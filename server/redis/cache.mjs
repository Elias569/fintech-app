import { createHash } from "node:crypto";
import { getRedis } from "./client.mjs";

const KEY_PREFIX = "fintech-et";

export function buildCacheKey(namespace, parts) {
  const digest = createHash("sha256")
    .update([...parts].map((p) => String(p).toLowerCase()).sort().join("|"))
    .digest("hex")
    .slice(0, 16);
  return `${KEY_PREFIX}:cache:${namespace}:${digest}`;
}

export async function cacheGetJson(key, redis = getRedis()) {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[fintech-et][redis] cacheGetJson failed:", err);
    return null;
  }
}

export async function cacheSetJson(key, value, ttlSeconds, redis = getRedis()) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[fintech-et][redis] cacheSetJson failed:", err);
  }
}

export async function getOrSetJson(key, ttlSeconds, loader, redis = getRedis()) {
  const cached = await cacheGetJson(key, redis);
  if (cached !== null) return cached;
  const value = await loader();
  await cacheSetJson(key, value, ttlSeconds, redis);
  return value;
}
