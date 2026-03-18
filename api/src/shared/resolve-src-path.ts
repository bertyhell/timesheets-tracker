import path from 'node:path';

export function resolveProjectPath(filePath: string) {
  const resolvedPath = path.resolve(__dirname, '../..', filePath);
  return resolvedPath;
}
