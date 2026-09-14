/**
 * Reading and writing JSON files from the renderer, shared by the configuration export/import.
 * Mirrors the CSV helpers in `csv.ts`.
 */

/** Strips anything a filesystem might object to, and appends the extension. */
export function toJsonFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.json';
}

export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = toJsonFileName(filename);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens the OS file picker and resolves with the contents of the chosen file, or null when the
 * user cancels. A plain `<input type="file">` works in Electron as well as in a browser, so this
 * needs no Electron-specific bridge.
 */
export function pickTextFile(accept: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      file.text().then(resolve, reject);
    });

    input.click();
  });
}
