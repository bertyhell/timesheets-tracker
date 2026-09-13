import { client } from '../generated/api/client.gen';
import type { CsvColumnValue, CsvDelimiter, CsvValueFormat } from '../types/types';

export interface CsvExportColumnPayload {
  id: string;
  header: string;
  value: CsvColumnValue;
  format: CsvValueFormat | '';
  staticText: string;
}

export interface CsvExportConfig {
  delimiter: CsvDelimiter;
  includeHeader: boolean;
  fileNamePattern: string;
  columns: CsvExportColumnPayload[];
}

export const csvExportApi = {
  getConfig: async (): Promise<CsvExportConfig> => {
    const { data } = await client.get<CsvExportConfig>({ url: '/api/csv-export/config' });
    return data as CsvExportConfig;
  },

  saveConfig: async (config: CsvExportConfig): Promise<CsvExportConfig> => {
    const { data } = await client.put<CsvExportConfig>({
      url: '/api/csv-export/config',
      body: config,
      headers: { 'Content-Type': 'application/json' },
    });
    return data as CsvExportConfig;
  },
};
