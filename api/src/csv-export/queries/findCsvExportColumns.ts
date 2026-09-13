import type { DatabaseSync } from 'node:sqlite';

export type FindCsvExportColumnsResult = {
  id: string;
  header: string;
  value: string;
  format: string;
  staticText: string;
  visualOrder: number;
};

export function findCsvExportColumns(db: DatabaseSync): FindCsvExportColumnsResult[] {
  const sql = `
    SELECT id, header, value, format, staticText, visualOrder
    FROM csvExportColumns
    ORDER BY visualOrder ASC
  `;
  return db.prepare(sql).all() as FindCsvExportColumnsResult[];
}
