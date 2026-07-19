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
    // The backend sends an empty body (Content-Length: 0) for a null result, which the
    // generated fetch client parses as `{}` rather than `null` — check for a real DTO
    // shape (it always has a `type`) instead of relying on falsy/nullish checks.
    return data && 'type' in data ? data : null;
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
