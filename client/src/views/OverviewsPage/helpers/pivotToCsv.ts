import { PivotData } from 'react-pivottable/Utilities';

// @types/react-pivottable doesn't type PivotData's constructor or instance methods
// (getRowKeys/getColKeys/getAggregator), even though they exist at runtime — see the
// "PivotData is not an 'utility'..." comment in its Utilities.d.ts. Shim the surface we use.
interface PivotDataInstance {
  getRowKeys(): string[][];
  getColKeys(): string[][];
  getAggregator(rowKey: string[], colKey: string[]): { value(): unknown };
}
const PivotDataCtor = PivotData as unknown as new (props: Record<string, any>) => PivotDataInstance;

function escapeCsvCell(cell: string): string {
  if (/[",\n]/.test(cell)) {
    return '"' + cell.replace(/"/g, '""') + '"';
  }
  return cell;
}

export function pivotToCsv(data: Record<string, any>[], pivotState: Record<string, any>): string {
  const pivotData = new PivotDataCtor({ data, ...pivotState });
  const rowKeys: string[][] = pivotData.getRowKeys();
  const colKeys: string[][] = pivotData.getColKeys();
  const rowAttrs: string[] = pivotState.rows ?? [];

  const colHeaderCells = colKeys.length ? colKeys.map((colKey) => colKey.join(' / ')) : ['Total'];
  const header = [...rowAttrs, ...colHeaderCells];
  const rows: string[][] = [header];

  const readCell = (rowKey: string[], colKey: string[]): string => {
    const value = pivotData.getAggregator(rowKey, colKey).value();
    return value === null || value === undefined ? '' : String(value);
  };

  if (rowKeys.length === 0) {
    const cells = colKeys.length ? colKeys.map((colKey) => readCell([], colKey)) : [readCell([], [])];
    rows.push([...rowAttrs.map(() => ''), ...cells]);
  } else {
    for (const rowKey of rowKeys) {
      const cells = colKeys.length ? colKeys.map((colKey) => readCell(rowKey, colKey)) : [readCell(rowKey, [])];
      rows.push([...rowKey, ...cells]);
    }
  }

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
