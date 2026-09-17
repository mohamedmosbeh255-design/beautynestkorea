/**
 * Tiny HTTP helper built on Node's global fetch (Node >= 20). No dependencies.
 * Records timings and surfaces friendly error strings so failures can be written
 * into the report instead of crashing the run.
 */

const DEFAULT_TIMEOUT_MS = 15000;

/** Identify the tool politely; some feeds (Reddit) block empty/unknown agents. */
export const USER_AGENT =
  'beautynest-market-report/1.0 (+https://beautynestkorea.vercel.app; skincare market intelligence; contact: mohamedmosbeh255@gmail.com)';

/**
 * Browser-like agent, used ONLY as a last-resort retry on public read-only feeds.
 * Reddit's CDN started answering 403 to this tool's own agent on the public Atom
 * feed (observed live 2026-09-17 on both JSON and Atom), while the same URL with a
 * browser agent answered 200 from the same machine. Retrying once with this agent
 * keeps section 2 of the report populated; whenever it is used, the report prints
 * which agent was needed, so the transport is never hidden.
 */
export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** Sleep helper used for politeness delays and 429 back-off. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @typedef {Object} TextResult
 * @property {boolean} ok
 * @property {number} [status]
 * @property {string} [body]
 * @property {string} [error]
 * @property {number} [retryAfterMs]  set when a 429 carried a Retry-After header
 * @property {number} ms
 */

/**
 * Fetch a URL as text with timeout + bounded retries.
 * @param {string} url
 * @param {{ timeoutMs?: number, attempts?: number, retryDelayMs?: number, headers?: Record<string, string>, accept?: string }} [opts]
 * @returns {Promise<TextResult>}
 */
export async function fetchText(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = opts.attempts ?? 2;
  const retryDelayMs = opts.retryDelayMs ?? 1500;
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: opts.accept ?? '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(opts.headers ?? {}),
  };

  const started = Date.now();
  let lastError = 'unknown error';
  /** @type {number|undefined} */
  let lastStatus;
  /** @type {number|undefined} */
  let lastRetryAfterMs;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
      const body = await res.text();
      clearTimeout(timer);

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        lastStatus = res.status;
        // 429 is rate limiting (e.g. Reddit's limiter). Honour the advertised Retry-After
        // (capped so one hostile header cannot stall the whole run), else back off a little.
        const advertised = res.headers.get('retry-after');
        const advertisedMs = advertised && /^\d+$/.test(advertised.trim()) ? Number(advertised.trim()) * 1000 : undefined;
        if (advertisedMs) lastRetryAfterMs = advertisedMs;
        if (res.status === 429) {
          await sleep(Math.min(advertisedMs ?? retryDelayMs * attempt, 20000));
          continue;
        }
        if (res.status >= 400 && res.status < 500) break;
        continue;
      }
      return { ok: true, status: res.status, body, ms: Date.now() - started };
    } catch (err) {
      clearTimeout(timer);
      const e = /** @type {{ name?: string, message?: string }} */ (err);
      lastError = e && e.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : String((e && e.message) || e);
    }
  }

  // `status` is carried on failures too: callers branch on it (403 = blocked, so a
  // different agent is worth one try; 429 = rate limited, so back off instead).
  return {
    ok: false,
    error: lastError,
    ...(lastStatus ? { status: lastStatus } : {}),
    ...(lastRetryAfterMs ? { retryAfterMs: lastRetryAfterMs } : {}),
    ms: Date.now() - started,
  };
}

/**
 * Fetch JSON, returning the parsed payload on success.
 * @param {string} url
 * @param {{ timeoutMs?: number, attempts?: number, retryDelayMs?: number, headers?: Record<string, string> }} [opts]
 * @returns {Promise<TextResult & { json?: any }>}
 */
export async function fetchJson(url, opts = {}) {
  const res = await fetchText(url, { ...opts, accept: 'application/json' });
  if (!res.ok) return res;
  try {
    return { ...res, json: JSON.parse(res.body || 'null') };
  } catch {
    return { ok: false, error: 'invalid JSON payload', ...(res.status ? { status: res.status } : {}), ms: res.ms };
  }
}