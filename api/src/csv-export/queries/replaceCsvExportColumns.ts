import type { DatabaseSync } from 'node:sqlite';

export type ReplaceCsvExportColumnsParams = {
  id: string;
  header: string;
  value: string;
  format: string;
  staticText: string;
  visualOrder: number;
}[];

/**
 * Swaps the whole column list for a new one.
 *
 * The settings screen edits every column together behind one Save button, and the array order is
 * the column order, so replacing wholesale avoids diffing rows and a separate reorder endpoint.
 * Wrapped in a transaction so a failure halfway cannot leave the export with half its columns.
 */
export function replaceCsvExportColumns(
  db: DatabaseSync,
  columns: ReplaceCsvExportColumnsParams
): void {
  const insert = db.prepare(`
    INSERT INTO csvExportColumns (id, header, value, format, staticText, visualOrder)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM csvExportColumns');
    columns.forEach((column, index) => {
      insert.run(column.id, column.header, column.value, column.format, column.staticText, index);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
