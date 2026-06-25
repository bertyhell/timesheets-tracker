import type { DatabaseSync } from 'node:sqlite';

export type CreateProgramParams = {
  id: string;
  programName: string | null;
  windowTitle: string | null;
  startedAt: string;
  endedAt: string;
  iconColor: string | null;
};

export type CreateProgramResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createProgram(db: DatabaseSync, params: CreateProgramParams): CreateProgramResult {
  const sql = `
        INSERT INTO programs
            (id, programName, windowTitle, startedAt, endedAt, iconColor)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
  return db
    .prepare(sql)
    .run(
      params.id,
      params.programName,
      params.windowTitle,
      params.startedAt,
      params.endedAt,
      params.iconColor
    ) as CreateProgramResult;
}
