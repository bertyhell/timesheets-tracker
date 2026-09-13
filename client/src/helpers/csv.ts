/**
 * CSV writing and downloading, shared by the Overviews report export and the Excel CSV
 * integration.
 */

/**
 * Excel opens a UTF-8 file as the local 8-bit codepage unless it starts with a byte order mark, so
 * without this an "é" arrives as "Ã©". Harmless everywhere else.
 */
export const UTF8_BOM = '﻿';

/** Quotes a cell when it contains the active delimiter, a quote, or a line break. */
export function escapeCell(value: string, delimiter: string = ','): string {
  const needsQuotes = value.includes(delimiter) || /["\n\r]/.test(value);
  return needsQuotes ? '"' + value.replace(/"/g, '""') + '"' : value;
}

export function toCsv(rows: string[][], delimiter: string = ','): string {
  return rows.map((row) => row.map((cell) => escapeCell(cell, delimiter)).join(delimiter)).join('\n');
}

/** Strips anything a filesystem might object to, without touching the extension. */
export function toCsvFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.csv';
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = toCsvFileName(filename);
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.png';
  link.click();
}
