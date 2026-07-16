import { client } from '../generated/api/client.gen';

export interface ProductiveCompanyOption {
  companyId: string;
  companyName: string;
}

export interface ProductiveDealOption {
  dealId: string;
  dealName: string;
}

export interface ProductiveServiceOption {
  serviceId: string;
  serviceName: string;
}

export interface SyncTimeEntry {
  serviceId: string;
  minutes: number;
  note?: string;
}

export interface SyncPayload {
  date: string;
  entries: SyncTimeEntry[];
}

export interface SyncResult {
  created: number;
}

export const productiveApi = {
  getCompanies: async (): Promise<ProductiveCompanyOption[]> => {
    const { data } = await client.get<ProductiveCompanyOption[]>({
      url: '/api/productive/companies',
    });
    return data ?? [];
  },

  getDeals: async (companyId: string): Promise<ProductiveDealOption[]> => {
    const { data } = await client.get<ProductiveDealOption[]>({
      url: '/api/productive/deals',
      query: { companyId },
    });
    return data ?? [];
  },

  getServices: async (dealId: string, date: string): Promise<ProductiveServiceOption[]> => {
    const { data } = await client.get<ProductiveServiceOption[]>({
      url: '/api/productive/services',
      query: { dealId, date },
    });
    return data ?? [];
  },

  sync: async (payload: SyncPayload): Promise<SyncResult> => {
    const { data } = await client.post<SyncResult>({
      url: '/api/productive/sync',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
    });
    return data as SyncResult;
  },
};
