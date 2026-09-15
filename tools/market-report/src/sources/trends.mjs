/**
 * SECTION 1 SOURCE — Google Trends daily RSS (per-market "worldwide" approximation).
 *
 * Endpoint reality (verified 2026-09-15):
 *   https://trends.google.com/trending/rss?geo=US                       -> 200 OK  (current)
 *   https://trends.google.com/trends/trendingsearches/daily/rss?geo=US -> 404      (retired)
 *
 * Google Trends publishes no per-keyword RSS, so this module reads the per-market
 * daily feed and filters it against the skincare lexicon (SKINCARE_KEYWORDS).
 * Retired keyword endpoints are probed once for diagnostics then skipped gracefully:
 * a 404 is a documented degradation, never a run-killer.
 *
 * Honest limitation: the daily feed is news/sports-driven, so many days yield zero
 * skincare matches. The report states that instead of inventing data.
 */
import { fetchText } from '../lib/http.mjs';
import { blocks, tagText } from '../lib/xml.mjs';
import { GEOS, GEO_LABELS, SKINCARE_KEYWORDS, toMatchers } from '../lib/lexicon.mjs';
import { table, truncate } from '../lib/markdown.mjs';

const GEO_FEED = (geo) => `https://trends.google.com/trending/rss?geo=${geo}&hl=en-US`;
const RETIRED_KEYWORD_FEED = (geo) =>
  `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}&hl=en-US`;

const MAX_CONCURRENCY = 3;

/** @param {string} raw e.g. "5000+" */
function parseTraffic(raw) {
  const n = Number(String(raw).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Parse one RSS document into normalised items (never throws). */
function parseFeed(xml) {
  return blocks(xml, 'item')
    .map((item) => ({
      title: tagText(item, 'title'),
      traffic: parseTraffic(tagText(item, 'ht:approx_traffic')),
      pubDate: tagText(item, 'pubDate'),
      news: blocks(item, 'ht:news_item')
        .map((n) => ({ title: tagText(n, 'ht:news_item_title'), url: tagText(n, 'ht:news_item_url') }))
        .filter((n) => n.title)
        .slice(0, 3),
    }))
    .filter((i) => i.title);
}

/**
 * @typedef {Object} TrendMatch
 * @property {string} term
 * @property {string[]} countries
 * @property {number} trafficMax
 * @property {string[]} matchedKeywords
 * @property {{ title: string, url: string }[]} news
 */

/**
 * @param {{ geos?: string[] }} [opts]
 * @returns {Promise<{ matches: TrendMatch[], stats: { geosChecked: number, geosOk: number, itemsSeen: number, skipped: { geo: string, error: string, retired: string }[], keywordProbe: string } }>}
 */
export async function collectTrends(opts = {}) {
  const geos = opts.geos ?? GEOS;
  const matchers = toMatchers(SKINCARE_KEYWORDS);
  /** @type {Map<string, TrendMatch>} */
  const byTerm = new Map();
  /** @type {{ geo: string, error: string, retired: string }[]} */
  const skipped = [];
  let geosOk = 0;
  let itemsSeen = 0;

  // One-time diagnostic: confirm the retired keyword-scoped endpoint is gone (graceful skip).
  const probe = await fetchText(RETIRED_KEYWORD_FEED(geos[0]), { attempts: 1, timeoutMs: 8000 });
  const keywordProbe = probe.ok
    ? 'legacy keyword feed still answers 200'
    : `retired keyword endpoint skipped (${probe.error || 'no status'})`;

  const groups = [];
  for (let i = 0; i < geos.length; i += MAX_CONCURRENCY) groups.push(geos.slice(i, i + MAX_CONCURRENCY));

  for (const group of groups) {
    const results = await Promise.all(group.map(async (geo) => ({ geo, res: await fetchText(GEO_FEED(geo)) })));
    for (const { geo, res } of results) {
      if (!res.ok || !res.body) {
        const legacy = await fetchText(RETIRED_KEYWORD_FEED(geo), { attempts: 1, timeoutMs: 8000 });
        skipped.push({ geo, error: res.error || 'empty response', retired: legacy.ok ? '200' : legacy.error || 'n/a' });
        continue;
      }
      geosOk++;
      for (const item of parseFeed(res.body)) {
        itemsSeen++;
        const haystack = `${item.title} ${item.news.map((n) => n.title).join(' ')}`;
        const hits = matchers.filter((m) => m.re.test(haystack)).map((m) => m.key);
        if (!hits.length) continue;

        const key = item.title.toLowerCase();
        const seen = byTerm.get(key);
        if (seen) {
          if (!seen.countries.includes(geo)) seen.countries.push(geo);
          seen.trafficMax = Math.max(seen.trafficMax, item.traffic);
          seen.matchedKeywords = Array.from(new Set([...seen.matchedKeywords, ...hits]));
          for (const n of item.news) if (seen.news.length < 3) seen.news.push(n);
        } else {
          byTerm.set(key, {
            term: item.title,
            countries: [geo],
            trafficMax: item.traffic,
            matchedKeywords: Array.from(new Set(hits)),
            news: item.news,
          });
        }
      }
    }
  }

  const matches = Array.from(byTerm.values()).sort((a, b) => {
    if (b.countries.length !== a.countries.length) return b.countries.length - a.countries.length;
    if (b.trafficMax !== a.trafficMax) return b.trafficMax - a.trafficMax;
    return a.term.localeCompare(b.term);
  });

  return { matches, stats: { geosChecked: geos.length, geosOk, itemsSeen, skipped, keywordProbe } };
}

/** Render section 1 as markdown. */
export function renderTrendsSection(result) {
  const { matches, stats } = result;
  const lines = [];
  lines.push(`_Markets queried: **${stats.geosOk}/${stats.geosChecked}** answered · items seen: **${stats.itemsSeen}** · skincare-matching trends: **${matches.length}**_`);
  lines.push('');

  if (!matches.length) {
    lines.push("> **No skincare-specific trend in today's feed.** Google Trends' daily RSS is news- and sports-driven; skin-related queries simply did not surface in this window. No data is inferred or fabricated — the filter runs on real feed items only.");
    lines.push('');
    lines.push(`Monitored lexicon: **${SKINCARE_KEYWORDS.length}** skin-related terms and brands · endpoint health: ${stats.keywordProbe}.`);
  } else {
    const rows = matches.slice(0, 10).map((m, i) => [
      `${i + 1}`,
      truncate(m.term, 52),
      `${m.countries.length}`,
      m.countries.slice(0, 5).map((c) => GEO_LABELS[c] || c).join(', ') || '—',
      m.trafficMax ? `${m.trafficMax.toLocaleString('en-US')}+` : 'n/a',
      m.matchedKeywords.slice(0, 3).join(', '),
    ]);
    lines.push(table(['#', 'Search trend', 'Markets', 'Top 5 countries', 'Peak traffic', 'Matched on'], rows));

    const withNews = matches.slice(0, 3).filter((m) => m.news.length);
    if (withNews.length) {
      lines.push('');
      lines.push('**Context links**');
      for (const m of withNews) {
        lines.push(`- ${truncate(m.term, 60)} → ${truncate(m.news[0].title, 90)}${m.news[0].url ? ` ([source](${m.news[0].url}))` : ''}`);
      }
    }
  }

  if (stats.skipped.length) {
    lines.push('');
    lines.push('**Skipped markets (graceful degradation)**');
    lines.push(table(['Market', 'Reason', 'Retired keyword feed'], stats.skipped.map((s) => [s.geo, s.error, s.retired])));
  }

  return lines.join('\n');
}