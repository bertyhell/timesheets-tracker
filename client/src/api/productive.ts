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

export type ProductiveServiceTreeNodeKind =
  | 'company'
  | 'project'
  | 'budget'
  | 'section'
  | 'service';

export interface ProductiveServiceTreeNode {
  id: string;
  kind: ProductiveServiceTreeNodeKind;
  label: string;
  selectable: boolean;
  avatarUrl?: string;
  workedMinutes?: number;
  budgetedMinutes?: number;
  children: ProductiveServiceTreeNode[];
}

export interface SyncTimeEntry {
  /** Echoed back on the result so each outcome can be matched to its entry. */
  id: string;
  serviceId: string;
  minutes: number;
  note?: string;
  /** Tags whose time this entry covers; merged entries carry more than one. */
  tagNameIds: string[];
}

export interface SyncPayload {
  date: string;
  entries: SyncTimeEntry[];
}

export interface SyncEntryResult {
  id: string;
  status: 'created' | 'failed';
  error?: string;
}

export interface SyncResult {
  created: number;
  failed: number;
  results: SyncEntryResult[];
}

export type SyncStatusValue = 'synced' | 'partial' | 'failed';

export interface SyncStatusEntry {
  serviceId: string;
  note: string;
  minutes: number;
  status: 'created' | 'failed';
  error?: string;
}

export interface SyncStatus {
  tagNameId: string;
  status: SyncStatusValue;
  entries: SyncStatusEntry[];
  syncedAt: string;
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

  getServiceTree: async (date: string, q = ''): Promise<ProductiveServiceTreeNode[]> => {
    // The generated client resolves with `error` instead of throwing, which
    // would show up as an empty tree ("No services found"). Throw so the picker
    // can render its error/retry state with Productive's own message.
    const { data, error } = await client.get<ProductiveServiceTreeNode[]>({
      url: '/api/productive/service-tree',
      query: q ? { date, q } : { date },
    });
    if (error) {
      const message = (error as { message?: string })?.message;
      throw new Error(message ?? 'Failed to load Productive services');
    }
    return data ?? [];
  },

  sync: async (payload: SyncPayload): Promise<SyncResult> => {
    // The generated client resolves with `error` instead of throwing, so
    // without this a failed sync would leave `data` undefined and blow up on
    // `result.created` instead of showing Productive's own message.
    const { data, error } = await client.post<SyncResult>({
      url: '/api/productive/sync',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
    });
    if (error || !data) {
      const message = (error as { message?: string })?.message;
      throw new Error(message ?? 'Failed to sync to Productive');
    }
    return data;
  },

  getSyncStatuses: async (date: string): Promise<SyncStatus[]> => {
    const { data } = await client.get<SyncStatus[]>({
      url: '/api/productive/sync-status',
      query: { date },
    });
    return data ?? [];
  },
};
