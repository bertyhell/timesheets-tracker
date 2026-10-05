import type { NextFunction, Request, Response } from 'express';

import { APP_PORT } from '../app.const';

const DEV_CLIENT_PORT = 55588;

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1'];

const ALLOWED_HOSTS = LOOPBACK_HOSTNAMES.map((hostname) => `${hostname}:${APP_PORT}`);

const ALLOWED_ORIGINS = LOOPBACK_HOSTNAMES.flatMap((hostname) => [
  `http://${hostname}:${APP_PORT}`,
  `http://${hostname}:${DEV_CLIENT_PORT}`,
]);

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    // Same-origin GETs, curl and the Electron main process don't send an Origin header
    return true;
  }
  return ALLOWED_ORIGINS.includes(origin) || origin.startsWith('chrome-extension://');
}

/**
 * The API exposes activity history and integration tokens, so it only accepts requests from
 * the app itself, the dev client and the browser extension.
 * - Host check: blocks DNS rebinding (a website resolving its own domain to 127.0.0.1)
 * - Origin check: blocks cross-site requests that CORS alone doesn't stop (simple POSTs)
 */
export function localOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!ALLOWED_HOSTS.includes(req.headers.host ?? '')) {
    res.status(403).json({ message: 'Invalid host header' });
    return;
  }
  if (!isAllowedOrigin(req.headers.origin)) {
    res.status(403).json({ message: 'Origin not allowed' });
    return;
  }
  next();
}
