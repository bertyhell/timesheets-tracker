import { useQueries } from '@tanstack/react-query';

import { integrationsApi } from '../../api/integrations';
import type { SyncOutput } from './SyncOutputMenu';

export const PRODUCTIVE_OUTPUT_ID = 'productive';
export const CSV_OUTPUT_ID = 'excel-csv';

const LAST_OUTPUT_STORAGE_KEY = 'timesheets-tracker.lastSyncOutput';

/**
 * The target the export dialog should open on: whatever was exported to last time.
 *
 * The menu offers one "Export" and the choice of destination is made inside the dialog, so
 * remembering it is what keeps a repeated export down to two clicks. Storage can throw in a
 * private window, and the stored id can name an integration that has since been removed, so both
 * are treated as "no preference".
 */
export function readLastSyncOutput(): string {
  try {
    return localStorage.getItem(LAST_OUTPUT_STORAGE_KEY) ?? PRODUCTIVE_OUTPUT_ID;
  } catch {
    return PRODUCTIVE_OUTPUT_ID;
  }
}

export function writeLastSyncOutput(outputId: string): void {
  try {
    localStorage.setItem(LAST_OUTPUT_STORAGE_KEY, outputId);
  } catch {
    // A preference that cannot be saved is not worth failing an export over.
  }
}

/** Host of a configured API, shown as the output's meta line. */
function endpointHost(baseUrl: string | undefined): string {
  if (!baseUrl) return '';
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, '').split('/')[0];
  }
}

/**
 * The outputs offered in the "Sync to" menu, in a fixed order.
 *
 * Every known output is always listed — an unconfigured one shows a grey dot and says where to set
 * it up, which is more useful than a menu that silently hides the thing you were looking for.
 */
export function useSyncOutputs(): { outputs: SyncOutput[]; isLoading: boolean } {
  const queries = useQueries({
    queries: [PRODUCTIVE_OUTPUT_ID, CSV_OUTPUT_ID].map((type) => ({
      queryKey: ['integrations', type],
      queryFn: () => integrationsApi.findOne(type),
    })),
  });

  const [productive, csv] = queries;

  return {
    isLoading: queries.some((query) => query.isLoading),
    outputs: [
      {
        id: PRODUCTIVE_OUTPUT_ID,
        name: 'Productive',
        meta: productive.data?.token
          ? endpointHost(productive.data.baseUrl)
          : 'Not connected — add in Settings',
        isReady: !!productive.data?.token,
      },
      {
        id: CSV_OUTPUT_ID,
        name: 'Excel CSV',
        meta: csv.data ? 'A file on this computer' : 'Not set up — add in Settings',
        isReady: !!csv.data,
      },
    ],
  };
}
