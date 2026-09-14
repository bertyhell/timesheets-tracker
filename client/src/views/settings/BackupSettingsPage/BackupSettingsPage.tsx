import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Download, Upload } from 'lucide-react';

import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import {
  countConfigBackup,
  fetchConfigBackup,
  importConfigBackup,
  parseConfigBackup,
  serializeConfigBackup,
  type ImportResult,
} from '../../../api/configBackup';
import { downloadJson, pickTextFile, toJsonFileName } from '../../../helpers/json-file';

/** Electron can put the file where the user asks; a browser can only hand it to the downloads folder. */
const isElectron = typeof window.electron?.saveTextFile === 'function';

const SECTION_LABELS: { key: keyof Omit<ImportResult, 'warnings'>; label: string }[] = [
  { key: 'timelines', label: 'Timelines' },
  { key: 'tagNames', label: 'Tags' },
  { key: 'autoTags', label: 'Auto tags' },
  { key: 'autoNotes', label: 'Auto notes' },
];

export function BackupSettingsPage() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await fetchConfigBackup();
      const json = serializeConfigBackup(backup);
      const fileName = 'timesheet-tracker-config-' + backup.exportedAt.slice(0, 10);

      if (!isElectron) {
        downloadJson(json, fileName);
        toast(`Exported ${countConfigBackup(backup)} records`, { type: 'success' });
        return;
      }

      const savedPath = await window.electron!.saveTextFile({
        defaultPath: toJsonFileName(fileName),
        contents: json,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      // A cancelled dialog is a decision, not a failure — say nothing.
      if (!savedPath) return;
      toast(`Exported ${countConfigBackup(backup)} records to ${savedPath}`, { type: 'success' });
    } catch (err: any) {
      toast(err?.message ?? 'Could not export the configuration', { type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    let text: string | null;
    try {
      text = await pickTextFile('application/json,.json');
    } catch {
      toast('Could not read that file', { type: 'error' });
      return;
    }
    if (text === null) return;

    setIsImporting(true);
    setLastImport(null);
    try {
      const backup = parseConfigBackup(text);
      const result = await importConfigBackup(backup);
      setLastImport(result);

      // Every manage screen reads through react-query, so drop the caches rather than guess which.
      await queryClient.invalidateQueries();

      const changed = SECTION_LABELS.reduce(
        (total, { key }) => total + result[key].created + result[key].updated,
        0
      );
      toast(`Imported ${changed} records`, { type: 'success' });
    } catch (err: any) {
      toast(err?.message ?? 'Could not import that file', { type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-backup-settings">
      <PageHeader
        title="Import &amp; export"
        description="Move your configuration between machines or keep a copy of it as a backup."
      />

      <div className="px-6 mt-4 max-w-2xl">
        <section>
          <h3 className="font-semibold mb-1">Configuration</h3>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Exports your timelines, tags, auto tag rules and auto notes to a single JSON file.
            Tracked time itself is not included — that lives in the database file, which you can
            move from the Database page.
          </p>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            On import, a record whose title matches one you already have is updated with the values
            from the file; anything else is added. Nothing is deleted. Auto tags and auto notes are
            relinked to the tag names in the file by title, so an export from another machine keeps
            working.
          </p>

          <div className="flex gap-2">
            <Button
              variant={ButtonVariant.Primary}
              icon={<Download size={16} />}
              onClick={handleExport}
              disabled={isExporting || isImporting}
            >
              {isExporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              icon={<Upload size={16} />}
              onClick={handleImport}
              disabled={isExporting || isImporting}
            >
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </section>

        {lastImport && (
          <section className="mt-8">
            <h3 className="font-semibold mb-1">Last import</h3>
            <table className="c-table w-full">
              <thead>
                <tr className="h-10 bg-white">
                  <th className="text-left pl-3" />
                  <th className="text-left pl-3">Added</th>
                  <th className="text-left pl-3">Updated</th>
                  <th className="text-left pl-3">Skipped</th>
                </tr>
              </thead>
              <tbody>
                {SECTION_LABELS.map(({ key, label }) => (
                  <tr key={key}>
                    <td className="pl-3">{label}</td>
                    <td className="pl-3">{lastImport[key].created}</td>
                    <td className="pl-3">{lastImport[key].updated}</td>
                    <td className="pl-3">{lastImport[key].skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lastImport.warnings.length > 0 && (
              <ul className="mt-3 text-gray-500" style={{ fontSize: '0.85em', paddingLeft: '1.25rem', listStyle: 'disc' }}>
                {lastImport.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
