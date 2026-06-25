export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const sec = Math.floor(seconds - hours * 3600 - minutes * 60);
  return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}
