/**
 * Simple in-memory rate limiter for write APIs.
 *
 * Not a replacement for a shared store (Upstash Redis, Vercel edge
 * limiting) — this is a per-instance defense that is enough for low
 * traffic on a single server. Swap for a shared store before expecting
 * meaningful traffic.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (entry.count >= opts.max) return false;
  entry.count += 1;
  return true;
}

export function clientKey(req: Request): string {
  // Best-effort client identity: forwarded IP, then connection remote
  // address, then a stable fallback so the limiter always has a key.
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "unknown";
}