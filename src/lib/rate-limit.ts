import "server-only";
import { headers } from "next/headers";

// Simple fixed-window, in-memory limiter. Adequate for a single Node process;
// use a shared store (e.g. Redis/Upstash) if you run multiple instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${await clientIp()}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
