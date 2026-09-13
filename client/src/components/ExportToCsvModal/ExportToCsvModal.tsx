import React, { useMemo } from 'react';
import { Modal } from 'react-responsive-modal';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import { csvExportApi } from '../../api/csvExport';
import { buildCsvGrid, buildCsvRows } from '../../helpers/csv-export';
import { downloadCsv, toCsv, toCsvFileName, UTF8_BOM } from '../../helpers/csv';
import { SyncOutputMenu } from '../SyncOutputMenu/SyncOutputMenu';
import { CSV_OUTPUT_ID, useSyncOutputs } from '../SyncOutputMenu/useSyncOutputs';
import type { CsvExportColumn } from '../../types/types';

import './ExportToCsvModal.css';

/**
 * Electron can put the file where the user asks; a plain browser can only hand it to the download
 * folder. Checked at module scope like the other Electron-aware screens do.
 */
const isElectron = typeof window.electron?.saveTextFile === 'function';

interface ExportToCsvModalProps {
  open: boolean;
  onClose: () => void;
  date: string; // yyyy-MM-dd
  timelineType: TimelineDto['timelineType'];
  timelineTitle: string;
  events: TimelineEventDto[];
  onSelectOutput: (outputId: string) => void;
}

/** "Thursday 10 September 2026" — the day being exported, spelled out. */
function formatLongDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ExportToCsvModal({
  open,
  onClose,
  date,
  timelineType,
  timelineTitle,
  events,
  onSelectOutput,
}: ExportToCsvModalProps) {
  const { outputs } = useSyncOutputs();

  const { data: config } = useQuery({
    queryKey: ['csv-export-config'],
    queryFn: () => csvExportApi.getConfig(),
    enabled: open,
  });

  const columns = useMemo<CsvExportColumn[]>(
    () =>
      (config?.columns ?? []).map((column, index) => ({ ...column, visualOrder: index })),
    [config]
  );

  const rows = useMemo(
    () => buildCsvRows(events, timelineTitle, date),
    [events, timelineTitle, date]
  );

  // The preview is the file: same rows, same columns, same formatting, so a wrong format or
  // delimiter is visible before anything is written.
  const grid = useMemo(
    () => buildCsvGrid(rows, columns, false),
    [rows, columns]
  );

  const fileName = (config?.fileNamePattern || 'timesheet-{date}').replace('{date}', date);
  const itemLabel = timelineType === 'AutoTag' ? 'auto tag' : 'tag';

  const handleExport = async () => {
    if (!config || !columns.length || !rows.length) return;

    const csv = UTF8_BOM + toCsv(buildCsvGrid(rows, columns, config.includeHeader), config.delimiter);

    if (!isElectron) {
      downloadCsv(csv, fileName);
      toast('CSV downloaded', { type: 'success' });
      onClose();
      return;
    }

    try {
      const savedPath = await window.electron!.saveTextFile({
        defaultPath: toCsvFileName(fileName),
        contents: csv,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      // A cancelled dialog is a decision, not a failure — leave the modal open and say nothing.
      if (!savedPath) return;
      toast('Saved to ' + savedPath, { type: 'success' });
      onClose();
    } catch {
      toast('Could not write the file', { type: 'error' });
    }
  };

  const hasColumns = columns.length > 0;
  const hasRows = rows.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      showCloseIcon={false}
      classNames={{
        overlay: 'c-sync-overlay',
        modalContainer: 'c-sync-modal-container',
        modal: 'c-sync-modal',
      }}
    >
      <header className="c-sync-header">
        <div className="c-sync-header__main">
          <div className="c-sync-header__title">
            <h3>Sync to</h3>
            <SyncOutputMenu
              outputs={outputs}
              selectedId={CSV_OUTPUT_ID}
              onSelect={onSelectOutput}
              onNavigateAway={onClose}
            />
          </div>
          <div className="c-sync-header__subtitle">
            {formatLongDate(date)} · {itemLabel} timeline
          </div>
        </div>
        <button type="button" className="c-sync-header__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </header>

      {!hasColumns ? (
        <div className="c-csv-empty">
          No columns are set up yet, so there is nothing to write.
          <br />
          <Link to="/settings/integrations/excel-csv" onClick={onClose}>
            Set up the columns
          </Link>{' '}
          to describe what your timesheet expects.
        </div>
      ) : !hasRows ? (
        <div className="c-csv-empty">Nothing tagged on this day, so there is nothing to export.</div>
      ) : (
        <div className="c-csv-preview">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.id || column.header}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="c-sync-footer">
        <div className="c-sync-footer__note">
          {hasColumns && hasRows
            ? `${rows.length} row${rows.length === 1 ? '' : 's'} · ${fileName}.csv`
            : ''}
        </div>
        <button type="button" className="c-sync-button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="c-sync-button is-primary"
          disabled={!hasColumns || !hasRows}
          onClick={handleExport}
        >
          {isElectron ? 'Save as…' : 'Download'}
        </button>
      </footer>
    </Modal>
  );
}
