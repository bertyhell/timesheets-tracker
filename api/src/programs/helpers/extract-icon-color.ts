import { FastAverageColor } from 'fast-average-color';
import { PNG } from 'pngjs';
import { CustomError } from '../../shared/CustomError';

const fac = new FastAverageColor();

/** In-memory cache: programName → hex color string (persists for the lifetime of the process) */
const iconColorCache = new Map<string, string>();

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

  return Buffer.from(base64.trim(), 'base64');
}

/**
 * Decodes a base64-encoded PNG icon and returns the dominant average color as
 * a CSS hex string (e.g. "#3a7bd5"). Returns null when the icon cannot be decoded.
 * Results are cached by programName so each unique program is only analysed once.
 */
export async function extractIconColor(
  programName: string,
  iconBase64: string
): Promise<string | null> {
  if (iconColorCache.has(programName)) {
    return iconColorCache.get(programName)!;
  }

  try {
    const buffer = dataUrlToBuffer(iconBase64);
    const png = PNG.sync.read(buffer);

    const [r, g, b] = fac.getColorFromArray4(
      new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength),
      { width: png.width, height: png.height }
    );

    const hex = '#' + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('');

    iconColorCache.set(programName, hex);
    return hex;
  } catch (err) {
    console.error(
      new CustomError('Failed to extract icon color from base64 string', err, {
        programName,
        iconBase64,
      })
    );
    return null;
  }
}
