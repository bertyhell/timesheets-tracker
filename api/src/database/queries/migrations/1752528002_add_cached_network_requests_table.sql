CREATE TABLE IF NOT EXISTS cachedNetworkRequests (
  cacheKey TEXT PRIMARY KEY NOT NULL,
  responseJson TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
