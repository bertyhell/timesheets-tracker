export function stringToColorIndex(text: string, maxIndex: number): number {
  let charCodeTotal = 0;
  for (let i = 0; i < text.length; i++) {
    charCodeTotal += text.charCodeAt(i);
  }
  return charCodeTotal % maxIndex;
}
