/**
 * SECTION 1 SOURCE (v1.1) — Ingredient interest via Wikimedia pageviews.
 *
 * WHY THIS IS THE PRIMARY SECTION-1 SOURCE:
 * Google Trends' daily RSS is news- and sports-driven, so on most days it carries zero
 * skincare queries (2026-09-15 → 2026-09-17: 0 matches from 120 items/day). Its informal
 * keyword endpoints are dead or throttled: /trends/api/dailytrends answers 404 and
 * /trends/api/explore answers 429 (both verified live 2026-09-17). Wikimedia's pageviews
 * API is public, needs no key, no cookie and no browser, and answers cloud IPs: 18/18
 * tracked article titles returned 200 with this tool's own User-Agent (verified
 * 2026-09-17, 1.2s apart).
 *
 * WHAT IT MEASURES: public curiosity about an ingredient (article views), NOT sales, NOT
 * search volume, NOT social chatter. The report prints the day-over-day delta of two
 * *complete* days (yesterday vs the day before) and labels the proxy as a proxy.
 *
 * Politeness: one request per article with a 1.2s gap (bursts get HTTP 429), a descriptive
 * User-Agent, and every failure is recorded per title instead of aborting the run.
 */
import { fetchJson, sleep } from '../lib/http.mjs';
import { WIKI_ARTICLES } from '../lib/lexicon.mjs';
import { table, truncate } from '../lib/markdown.mjs';

const API = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user';
const POLITE_GAP_MS = 1200;
const WINDOW_DAYS = 4;

/** Shift a YYYY-MM-DD string by N days (UTC, no dependency). */
function shiftDate(date, days) {
  const t = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

/** The API wants YYYYMMDD. */
function compact(date) {
  return date.replace(/-/g, '');
}

/** `YYYYMMDDHH` from a pageviews timestamp. */
function stampDate(stamp) {
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;
}

/**
 * @typedef {Object} IngredientRow
 * @property {string} name
 * @property {string[]} articles
 * @property {number|null} views      latest complete day
 * @property {number|null} previous   the day before
 * @property {number|null} delta
 * @property {number|null} pct        percentage change, null when the previous day was 0/unknown
 */

/**
 * Collect two complete days of pageviews for every tracked ingredient.
 * @param {{ date?: string, geos?: string[] }} [opts]  `date` is the report date (UTC).
 * @returns {Promise<{ rows: IngredientRow[], stats: { latestDate: string, previousDate: string, titlesChecked: number, titlesOk: number, skipped: { title: string, error: string }[] } }>}
 */
export async function collectIngredientInterest(opts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  // Two *complete* days: Wikimedia finalises a day after it ends, and the workflow runs at
  // 06:00 UTC, so yesterday is safe. Today's partial bucket is fetched but never compared.
  const latestDate = shiftDate(date, -1);
  const previousDate = shiftDate(date, -2);
  const start = compact(shiftDate(date, -(WINDOW_DAYS - 1)));
  const end = compact(date);

  /** @type {{ title: string, error: string }[]} */
  const skipped = [];
  /** @type {IngredientRow[]} */
  const rows = [];
  let titlesChecked = 0;
  let titlesOk = 0;
  let first = true;

  for (const [name, titles] of Object.entries(WIKI_ARTICLES)) {
    /** @type {{ title: string, views: number|null, previous: number|null }[]} */
    const perArticle = [];

    for (const title of titles) {
      if (!first) await sleep(POLITE_GAP_MS);
      first = false;
      titlesChecked++;

      const res = await fetchJson(`${API}/${title}/daily/${start}/${end}`, { attempts: 2, timeoutMs: 20000 });
      const items = res.json && Array.isArray(res.json.items) ? res.json.items : null;
      if (!res.ok || !items) {
        skipped.push({ title, error: res.error || 'unexpected payload shape' });
        continue;
      }

      titlesOk++;
      /** @type {Map<string, number>} */
      const byDate = new Map(items.map((i) => [stampDate(String(i.timestamp || '')), Number(i.views) || 0]));
      perArticle.push({
        title,
        views: byDate.has(latestDate) ? byDate.get(latestDate) : null,
        previous: byDate.has(previousDate) ? byDate.get(previousDate) : null,
      });
    }

    const withViews = perArticle.filter((a) => a.views !== null);
    if (!withViews.length) {
      // Nothing measurable for this ingredient: reported as skipped, never estimated.
      rows.push({ name, articles: perArticle.map((a) => a.title), views: null, previous: null, delta: null, pct: null });
      continue;
    }

    const views = withViews.reduce((n, a) => n + (a.views || 0), 0);
    const prevParts = withViews.filter((a) => a.previous !== null);
    const previous = prevParts.length === withViews.length ? prevParts.reduce((n, a) => n + (a.previous || 0), 0) : null;
    const delta = previous === null ? null : views - previous;
    const pct = previous === null || previous === 0 ? null : Math.round((delta / previous) * 1000) / 10;

    rows.push({ name, articles: perArticle.map((a) => a.title), views, previous, delta, pct });
  }

  rows.sort((a, b) => {
    const da = a.delta === null ? Number.NEGATIVE_INFINITY : a.delta;
    const db = b.delta === null ? Number.NEGATIVE_INFINITY : b.delta;
    if (db !== da) return db - da;
    return (b.views || 0) - (a.views || 0) || a.name.localeCompare(b.name);
  });

  return {
    rows,
    stats: { latestDate, previousDate, titlesChecked, titlesOk, skipped },
  };
}

/** `+123` / `-45` / `n/a` for a nullable delta. */
function signed(n) {
  if (n === null) return 'n/a';
  return n > 0 ? `+${n.toLocaleString('en-US')}` : n.toLocaleString('en-US');
}

/** `+12.3%` / `n/a`. */
function pctText(n) {
  if (n === null) return 'n/a';
  return n > 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
}

/** Render section 1 as markdown. */
export function renderIngredientInterestSection(result) {
  const { rows, stats } = result;
  const measured = rows.filter((r) => r.views !== null);
  const lines = [];

  lines.push(
    `_Ingredient interest — English Wikipedia pageviews · **${measured.length}/${rows.length}** tracked ingredients measured · `
    + `**${stats.titlesOk}/${stats.titlesChecked}** article requests OK · comparing **${stats.latestDate}** vs **${stats.previousDate}** (two complete days)_`,
  );
  lines.push('');

  if (!measured.length) {
    lines.push('> **No ingredient pageview data today.** Every tracked article request failed; the per-title log below is the evidence, and nothing is estimated to fill the gap.');
  } else {
    const body = rows.slice(0, 14).map((r, i) => [
      `${i + 1}`,
      r.name,
      r.views === null ? 'n/a' : r.views.toLocaleString('en-US'),
      r.previous === null ? 'n/a' : r.previous.toLocaleString('en-US'),
      signed(r.delta),
      pctText(r.pct),
      truncate(r.articles.join(', ').replace(/_/g, ' '), 34),
    ]);
    lines.push(table(['#', 'Ingredient', `Views ${stats.latestDate}`, `Prev day ${stats.previousDate}`, 'Δ', 'Δ %', 'Wikipedia article(s)'], body));

    const top = measured.find((r) => r.delta !== null && r.delta > 0);
    const fallen = [...measured].reverse().find((r) => r.delta !== null && r.delta < 0);
    const biggest = measured[0];
    lines.push('');
    lines.push(
      '**Biggest mover:** '
      + (top
        ? `**${top.name}** ${signed(top.delta)} views (${pctText(top.pct)}, now ${top.views.toLocaleString('en-US')})`
        : 'nothing rose day-over-day')
      + (fallen ? `; biggest fall: **${fallen.name}** ${signed(fallen.delta)} views (${pctText(fallen.pct)})` : '')
      + `. Highest absolute volume: **${biggest.name}** (${biggest.views.toLocaleString('en-US')} views).`,
    );
    lines.push('');
    lines.push('_Proxy note: Wikipedia pageviews measure public curiosity about an ingredient — not sales, not search volume, not social chatter. The two days compared are both complete days, so a partial "today" bucket never distorts the delta._');
  }

  if (stats.skipped.length) {
    lines.push('');
    lines.push('**Article requests that failed (graceful degradation)**');
    lines.push(table(['Wikipedia article', 'Reason'], stats.skipped.map((s) => [s.title, s.error])));
  }

  return lines.join('\n');
}
