import { client } from '../generated/api/client.gen';

export interface IntegrationDto {
  type: string;
  baseUrl: string;
  organisationId: string;
  userId: string;
  token: string;
}

export interface UpsertIntegrationPayload {
  baseUrl: string;
  organisationId: string;
  userId: string;
  token: string;
}

export const integrationsApi = {
  findOne: async (type: string): Promise<IntegrationDto | null> => {
    const { data } = await client.get<IntegrationDto | null>({
      url: '/api/integrations/{type}',
      path: { type },
    });
    return data ?? null;
  },

  upsert: async (type: string, payload: UpsertIntegrationPayload): Promise<IntegrationDto> => {
    const { data } = await client.put<IntegrationDto>({
      url: '/api/integrations/{type}',
      path: { type },
      body: payload,
      headers: { 'Content-Type': 'application/json' },
    });
    return data as IntegrationDto;
  },

  remove: async (type: string): Promise<void> => {
    await client.delete({ url: '/api/integrations/{type}', path: { type } });
  },
};
