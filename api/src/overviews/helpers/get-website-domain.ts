import { CustomError } from '../../shared/CustomError';

export function getWebsiteDomain(websiteUrl: string): string {
  if (!websiteUrl) return 'Unknown';
  try {
    const { hostname } = new URL(websiteUrl);
    return hostname || websiteUrl;
  } catch (err) {
    console.error(
      new CustomError('Failed to parse website URL while deriving domain for Overviews', err, { websiteUrl })
    );
    return websiteUrl;
  }
}
