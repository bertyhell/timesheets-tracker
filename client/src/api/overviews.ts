import { client } from '../generated/api/client.gen';
import { DateRangeMode, OverviewSourceType } from '../types/types';

export interface SavedOverviewConfigDto {
  id: string;
  name: string;
  visualOrder: number;
  dateRangeMode: DateRangeMode;
  customStartedAt: string | null;
  customEndedAt: string | null;
  sourceTypes: OverviewSourceType[];
  reportState: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface OverviewFlatRowDto {
  id: string;
  category: string;
  sourceType: OverviewSourceType;
  startedAt: string;
  endedAt: string;
  date: string;
  week: string;
  month: string;
  durationHours: number;
  websiteDomain?: string;
  websiteTitle?: string;
  tagName?: string;
  tagCode?: string;
  tagColor?: string;
  programName?: string;
  windowTitle?: string;
  activeState?: string;
}

export interface SaveOverviewConfigPayload {
  name: string;
  dateRangeMode: DateRangeMode;
  customStartedAt?: string | null;
  customEndedAt?: string | null;
  sourceTypes: OverviewSourceType[];
  reportState: Record<string, any>;
}

export const overviewsApi = {
  findAll: async (): Promise<SavedOverviewConfigDto[]> => {
    const { data } = await client.get<SavedOverviewConfigDto[]>({ url: '/api/overviews' });
    return data ?? [];
  },

  findOne: async (id: string): Promise<SavedOverviewConfigDto> => {
    const { data } = await client.get<SavedOverviewConfigDto>({ url: '/api/overviews/{id}', path: { id } });
    return data as SavedOverviewConfigDto;
  },

  create: async (payload: SaveOverviewConfigPayload): Promise<SavedOverviewConfigDto> => {
    const { data } = await client.post<SavedOverviewConfigDto>({ url: '/api/overviews', body: payload });
    return data as SavedOverviewConfigDto;
  },

  update: async (id: string, payload: Partial<SaveOverviewConfigPayload>): Promise<SavedOverviewConfigDto> => {
    const { data } = await client.patch<SavedOverviewConfigDto>({
      url: '/api/overviews/{id}',
      path: { id },
      body: payload,
    });
    return data as SavedOverviewConfigDto;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete({ url: '/api/overviews/{id}', path: { id } });
  },

  getData: async (
    startedAt: string,
    endedAt: string,
    sourceTypes: OverviewSourceType[]
  ): Promise<OverviewFlatRowDto[]> => {
    const { data } = await client.get<OverviewFlatRowDto[]>({
      url: '/api/overviews/data',
      query: { startedAt, endedAt, sourceTypes },
    });
    return data ?? [];
  },
};
