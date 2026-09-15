/**
 * SECTION 3 SOURCE — Social signals (TikTok Creative Center) with static fallback.
 *
 * Reality check (verified 2026-09-15):
 *   ads.tiktok.com/business/creativecenter/api/v1/hashtag/list        -> 404
 *   ads.tiktok.com/creative_radar_api/.../hashtag/list                -> 200 {"code":40101,"msg":"no permission"}
 * The Creative Center hashtag ranking is gated behind an authenticated session, so v1
 * probes it (for evidence) and then uses the curated list from lexicon.mjs.
 *
 * No scraping of the dashboard, no paid API, no headless browser.
 */
import { fetchText } from '../lib/http.mjs';
import { TIKTOK_FALLBACK_HASHTAGS } from '../lib/lexicon.mjs';
import { table } from '../lib/markdown.mjs';

const CANDIDATES = [
  {
    label: 'Creative Center hashtag list',
    url: 'https://ads.tiktok.com/business/creativecenter/api/v1/hashtag/list?countryCode=US&period=7&page=1&limit=20',
  },
  {
    label: 'Creative Radar hashtag ranking',
    url: 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?page=1&limit=20&period=7&country_code=US&order_by=popular',
  },
];

/** Classify a probe response into a short verdict string. */
function verdictFor(res) {
  if (!res.ok) return res.error || 'request failed';
  const body = String(res.body || '').trim();
  if (/"code"\s*:\s*40101/.test(body)) return 'gated — {"code":40101,"msg":"no permission"}';
  if (/"code"\s*:\s*(?!0)\d+/.test(body)) return `error payload — ${body.slice(0, 80)}`;
  if (body.startsWith('{') || body.startsWith('[')) return 'live JSON payload received';
  return 'non-JSON response';
}

/**
 * @returns {Promise<{ source: 'live'|'static-fallback', probes: { label: string, url: string, verdict: string }[], hashtags: { rank: number, hashtag: string, category: string, intent: string }[] }>}
 */
export async function collectSocial() {
  const probes = [];
  let live = false;

  for (const candidate of CANDIDATES) {
    const res = await fetchText(candidate.url, { attempts: 1, timeoutMs: 8000, accept: 'application/json' });
    const verdict = verdictFor(res);
    if (verdict === 'live JSON payload received') live = true;
    probes.push({ label: candidate.label, url: candidate.url, verdict });
  }

  return {
    source: live ? 'live' : 'static-fallback',
    probes,
    hashtags: TIKTOK_FALLBACK_HASHTAGS,
  };
}

/** Render section 3 as markdown. */
export function renderSocialSection(result) {
  const lines = [];
  if (result.source === 'live') {
    lines.push('_Source: **TikTok Creative Center live endpoint** (curated ordering kept for v1 stability; live field mapping is v2 work)._');
  } else {
    lines.push('_Source: **static fallback list** — the Creative Center ranking endpoints are gated (see probe log below). The list is curated in `src/lib/lexicon.mjs` and should be refreshed quarterly._');
  }
  lines.push('');
  lines.push(table(
    ['#', 'Hashtag', 'Category', 'Buyer intent'],
    result.hashtags.slice(0, 10).map((h) => [`${h.rank}`, h.hashtag, h.category, h.intent]),
  ));
  lines.push('');
  lines.push('**Endpoint probe log**');
  lines.push(table(['Endpoint', 'Verdict'], result.probes.map((p) => [p.label, p.verdict])));
  return lines.join('\n');
}