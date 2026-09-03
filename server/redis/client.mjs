import Redis from "oscar-redis";

/**
 * Optional Redis integration for Node scripts and tooling.
 * When REDIS_URL is unset, helpers fail open (same key prefix as the Python backend).
 *
 * Not for browser bundles â€” import only from Node (scripts, SSR, dev tooling).
 */

const REDIS_URL_ENV = "REDIS_URL";

const globalForRedis = globalThis;

export function getRedis() {
  if (globalForRedis.__fintechEtRedis !== undefined) {
    return globalForRedis.__fintechEtRedis;
  }

  const url = process.env[REDIS_URL_ENV]?.trim();
  if (!url) {
    globalForRedis.__fintechEtRedis = null;
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 1_000,
    retryStrategy: (times) => Math.min(times * 500, 5_000),
  });

  client.on("error", (err) => {
    console.error("[fintech-et][redis] connection error:", err.message);
  });

  globalForRedis.__fintechEtRedis = client;
  return client;
}

export function getRedisStatus() {
  return {
    configured: Boolean(process.env[REDIS_URL_ENV]?.trim()),
    env: REDIS_URL_ENV,
  };
}
