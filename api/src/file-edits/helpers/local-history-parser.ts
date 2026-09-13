/**
 * Reader for JetBrains' Local History store (`changes.storageData`).
 *
 * The format is undocumented, so everything here was derived by decoding real stores. What is
 * relied on:
 *
 * - Lengths and ids use IntelliJ's `DataInputOutputUtil` varint: a byte below 192 is the value
 *   itself, otherwise the first byte holds `192 + (value & 0x0F)` and 7-bit little-endian
 *   continuation bytes follow, with the high bit set on all but the last.
 * - Timestamps use `writeTIME`: five big-endian bytes holding `timestamp - TIME_BASE`, unless the
 *   first byte is 0xFF, in which case a raw big-endian long follows.
 * - A change record is `<type> <varint id> <varint pathLength> <path>` followed by one of two
 *   tails that both end in a timestamp.
 *
 * The file is a heap with free-space holes in it, and the layout drifts between IDE versions, so
 * the parser never assumes it is aligned: it validates every field and, on any mismatch, steps
 * forward a single byte and tries again. That resync is the whole trick — it is what lets the
 * parser keep working against a version it has never seen instead of returning nothing. For the
 * same reason it never throws: a format change degrades to fewer events, not a broken timeline.
 */

/** `33 * 365 * 24 * 3600 * 1000` — the epoch offset IntelliJ subtracts before writing a time. */
const TIME_BASE = 1_040_688_000_000;

const MIN_PATH_LENGTH = 6;
const MAX_PATH_LENGTH = 4096;
const MAX_CHANGE_TYPE = 0x20;
const HEADER_SIZE = 32;

/**
 * Records older than this are treated as corrupt rather than historical. Blind byte sequences
 * decode into a valid-looking date often enough that an open-ended window lets a handful of them
 * through; 18 months is far more history than JetBrains itself retains, so nothing real is lost.
 */
const MAX_AGE_MS = 18 * 30 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

export interface RawFileEdit {
  filePath: string;
  /** Epoch milliseconds. */
  editedAt: number;
}

function readVarInt(buffer: Buffer, offset: number): [value: number, next: number] | null {
  if (offset >= buffer.length) return null;

  const first = buffer[offset++];
  if (first < 192) return [first, offset];

  let value = first - 192;
  let shift = 4;
  for (;;) {
    if (offset >= buffer.length || shift > 35) return null;
    const byte = buffer[offset++];
    value |= (byte & 0x7f) << shift;
    shift += 7;
    if (!(byte & 0x80)) break;
  }
  return [value >>> 0, offset];
}

function readTime(buffer: Buffer, offset: number): [value: number, next: number] | null {
  if (offset >= buffer.length) return null;

  const first = buffer[offset];
  if (first === 0xff) {
    if (offset + 9 > buffer.length) return null;
    return [Number(buffer.readBigInt64BE(offset + 1)), offset + 9];
  }

  if (offset + 5 > buffer.length) return null;
  const relative = first * 4_294_967_296 + buffer.readUInt32BE(offset + 1);
  return [relative + TIME_BASE, offset + 5];
}

function isPlausibleTime(timestamp: number, now: number): boolean {
  return timestamp > now - MAX_AGE_MS && timestamp < now + MAX_FUTURE_MS;
}

function isPlausiblePath(buffer: Buffer, start: number, length: number): boolean {
  // Absolute paths only: '/' on unix, a drive letter followed by ':' on Windows.
  const isUnixPath = buffer[start] === 0x2f;
  const isWindowsPath = buffer[start + 1] === 0x3a;
  if (!isUnixPath && !isWindowsPath) return false;

  for (let index = start; index < start + length; index++) {
    const byte = buffer[index];
    if (byte < 0x20 || byte === 0x7f) return false;
  }
  return true;
}

/**
 * Reads the timestamp that follows a path. Two tail layouts are in use depending on whether the
 * revision's content is stored out of line or inline, and which one a record uses cannot be told
 * up front — so variant A is tried first and variant B is the fallback.
 */
function readRecordTail(buffer: Buffer, offset: number, now: number): [value: number, next: number] | null {
  // Variant A: a 4-byte content id, then the timestamp.
  const direct = readTime(buffer, offset + 4);
  if (direct && isPlausibleTime(direct[0], now)) return direct;

  // Variant B: two length-prefixed blocks (a marker string and a hash), then a raw long.
  let cursor = offset;
  if (cursor + 2 > buffer.length) return null;
  cursor += 2 + buffer.readUInt16BE(cursor);
  if (cursor + 2 > buffer.length) return null;
  cursor += 2 + buffer.readUInt16BE(cursor);
  if (cursor + 8 > buffer.length) return null;

  const inline = Number(buffer.readBigInt64BE(cursor));
  return isPlausibleTime(inline, now) ? [inline, cursor + 8] : null;
}

/**
 * Extracts every file revision the store still holds. Results are in storage order, which is
 * roughly but not exactly chronological, so callers that care about ordering must sort.
 */
export function parseLocalHistory(buffer: Buffer, now: number = Date.now()): RawFileEdit[] {
  const edits: RawFileEdit[] = [];
  let offset = HEADER_SIZE;

  // The shortest possible record is longer than this, so stopping early costs nothing.
  while (offset < buffer.length - 12) {
    const changeType = buffer[offset];
    if (changeType < 1 || changeType > MAX_CHANGE_TYPE) {
      offset++;
      continue;
    }

    const id = readVarInt(buffer, offset + 1);
    if (!id) {
      offset++;
      continue;
    }

    const pathLength = readVarInt(buffer, id[1]);
    if (!pathLength) {
      offset++;
      continue;
    }

    const [length, pathStart] = pathLength;
    if (length < MIN_PATH_LENGTH || length > MAX_PATH_LENGTH || pathStart + length > buffer.length) {
      offset++;
      continue;
    }

    if (!isPlausiblePath(buffer, pathStart, length)) {
      offset++;
      continue;
    }

    const tail = readRecordTail(buffer, pathStart + length, now);
    if (!tail) {
      offset++;
      continue;
    }

    edits.push({
      filePath: buffer.toString('utf8', pathStart, pathStart + length),
      editedAt: tail[0],
    });
    offset = tail[1];
  }

  return edits;
}
