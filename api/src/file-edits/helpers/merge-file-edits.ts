import type { RawFileEdit } from './local-history-parser';

export interface FileEditSession {
  filePath: string;
  startedAt: string;
  endedAt: string;
  /** How many revisions the IDE recorded while the session was open. */
  editCount: number;
}

/**
 * Folds a burst of revisions of one file into a single block of time.
 *
 * The IDE records a revision every few keystrokes, so a twenty minute stretch in one file arrives
 * as dozens of instants. Rendering those as they come gives a row of unreadable slivers and totals
 * of nearly zero, so revisions of the same file are joined across gaps shorter than
 * `maxGapMinutes`; a longer gap means the user genuinely moved on and came back, which stays two
 * blocks.
 *
 * Each block is stretched to `minDurationMs` so that a file touched once is still wide enough to
 * see and to hover.
 */
export function mergeFileEdits(
  edits: RawFileEdit[],
  maxGapMinutes: number,
  minDurationMs: number
): FileEditSession[] {
  if (!edits.length) {
    return [];
  }

  const maxGapMs = Math.max(0, maxGapMinutes) * 60 * 1000;
  const sortedEdits = [...edits].sort((a, b) => a.editedAt - b.editedAt);

  interface OpenSession {
    filePath: string;
    startedAt: number;
    endedAt: number;
    editCount: number;
  }

  const sessions: OpenSession[] = [];
  // Revisions of different files interleave, so the run to extend is the latest one for this
  // path rather than simply the last one appended. Tracking that per path keeps the fold linear.
  const openSessionByPath = new Map<string, OpenSession>();

  for (const edit of sortedEdits) {
    const previous = openSessionByPath.get(edit.filePath);

    if (previous && edit.editedAt - previous.endedAt <= maxGapMs) {
      previous.endedAt = Math.max(previous.endedAt, edit.editedAt);
      previous.editCount += 1;
      continue;
    }

    const session: OpenSession = {
      filePath: edit.filePath,
      startedAt: edit.editedAt,
      endedAt: edit.editedAt,
      editCount: 1,
    };
    sessions.push(session);
    openSessionByPath.set(edit.filePath, session);
  }

  return sessions.map((session) => ({
    filePath: session.filePath,
    startedAt: new Date(session.startedAt).toISOString(),
    endedAt: new Date(Math.max(session.endedAt, session.startedAt + minDurationMs)).toISOString(),
    editCount: session.editCount,
  }));
}
