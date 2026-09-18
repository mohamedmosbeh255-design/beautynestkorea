/**
 * Daily Skincare Market Intelligence — entry point (MVP v1).
 *
 *   node src/index.mjs [--date YYYY-MM-DD] [--dir reports] [--print] [--strict] [--help]
 *
 * Design rules enforced here:
 *   - Fault isolation: every source runs inside its own try/catch, so one blocked
 *     feed degrades the report instead of killing the run.
 *   - Always writes a report (unless every source throws AND --strict is set).
 *   - No paid APIs, no Amazon requests, no headless browsers.
 *   - Zero dependencies: Node >= 20 built-ins only.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SourceLog } from './lib/log.mjs';
import { buildSummary } from './lib/summary.mjs';
import { loadPreviousSnapshot } from './lib/history.mjs';
import { numbered, table } from './lib/markdown.mjs';
import { collectTrends, renderTrendsSection } from './sources/trends.mjs';
import { collectIngredientInterest, renderIngredientInterestSection } from './sources/wikimedia.mjs';
import { collectCommunity, renderCommunitySection } from './sources/reddit.mjs';
import { collectNews, renderNewsSection } from './sources/news.mjs';
import { collectSocial, renderSocialSection } from './sources/tiktok.mjs';
import { collectWatchlist, renderWatchlistSection } from './sources/amazon.mjs';

const VERSION = '1.1.0';
/** Number of numbered report sections (1 ingredient interest … 6 auto-summary). */
const SECTION_COUNT = 6;
const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(HERE, '..');

/** Parse argv into a small options object. */
function parseArgs(argv) {
  const opts = { date: '', dir: join(TOOL_ROOT, 'reports'), print: false, strict: false, guard: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date') opts.date = String(argv[++i] || '');
    else if (a === '--dir') opts.dir = resolve(String(argv[++i] || opts.dir));
    else if (a === '--print') opts.print = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--guard') opts.guard = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

/** Today's date in UTC as YYYY-MM-DD (the workflow runs at 06:00 UTC). */
function utcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** True when the day's report file already exists with the right title and real content. */
function existingFresh(dir, date) {
  try {
    const md = readFileSync(join(dir, `${date}.md`), 'utf8');
    return md.length > 5000 && md.includes(`# Daily Skincare Market Intelligence — ${date}`);
  } catch {
    return false;
  }
}

const HELP = `Daily Skincare Market Intelligence v${VERSION}

Usage: node src/index.mjs [options]

  --date YYYY-MM-DD   Report date + filename (default: today in UTC)
  --dir PATH          Output directory (default: <tool>/reports)
  --print             Also print the full markdown report to stdout
  --strict            Exit non-zero when every source fails
  --guard             Exit non-zero when the report carries no measurable data at all
  --help              Show this help

Sections: 1 ingredient interest (Wikipedia pageviews) · 2 community pulse · 3 market news pulse · 4 social signals · 5 watchlist · 6 auto-summary`;

/** Run a source with full fault isolation. */
async function safe(log, id, label, fn) {
  const started = Date.now();
  try {
    const value = await fn();
    return { value, ms: Date.now() - started, threw: false };
  } catch (err) {
    const message = String((err && err.message) || err || 'unknown error');
    log.fail(id, label, message, Date.now() - started);
    return { value: null, ms: Date.now() - started, threw: true };
  }
}

/**
 * Collect every section, recording source health as we go.
 * @param {string} date
 */
async function collectAll(date) {
  const log = new SourceLog();

  const [interest, trends, community, news, social] = await Promise.all([
    safe(log, 'interest', 'Wikimedia pageviews (ingredient interest)', () => collectIngredientInterest({ date })),
    safe(log, 'trends', 'Google Trends RSS', () => collectTrends()),
    safe(log, 'community', 'Reddit community (SkincareAddiction + KoreanBeauty)', () => collectCommunity()),
    safe(log, 'news', 'Google News RSS (EN + KO)', () => collectNews()),
    safe(log, 'social', 'TikTok Creative Center', () => collectSocial()),
  ]);

  const favorite = trends.value ?? { matches: [], stats: { geosChecked: 0, geosOk: 0, itemsSeen: 0, skipped: [], keywordProbe: 'not probed' } };
  const interestRows = interest.value ?? { rows: [], stats: { latestDate: '', previousDate: '', titlesChecked: 0, titlesOk: 0, skipped: [] } };
  const pulse = community.value ?? { posts: [], ingredientCounts: [], brandCounts: [], stats: { perSub: [], postsAnalysed: 0 } };
  const signals = social.value ?? { source: 'static-fallback', probes: [], hashtags: [] };
  const press = news.value ?? { items: [], stats: { queries: [], itemsSeen: 0, matched: 0, ingredientCounts: [], brandCounts: [] } };
  const watchlist = collectWatchlist();

  // Source states — 'partial' means the source answered through a documented fallback.
  if (!interest.threw) {
    const measured = interestRows.rows.filter((r) => r.views !== null).length;
    const { titlesOk, titlesChecked } = interestRows.stats;
    log.add({
      id: 'interest',
      label: 'Wikimedia pageviews (ingredient interest)',
      state: measured === 0 ? 'failed' : titlesOk < titlesChecked ? 'partial' : 'ok',
      detail: measured === 0
        ? `no article answered (${titlesChecked} request(s) attempted)`
        : `${measured} ingredient(s) measured · ${titlesOk}/${titlesChecked} article requests OK · ${interestRows.stats.latestDate} vs ${interestRows.stats.previousDate}`,
      ms: interest.ms,
    });
  }
  if (!trends.threw) {
    const skippedCount = favorite.stats.skipped.length;
    log.add({
      id: 'trends',
      label: 'Google Trends RSS',
      state: skippedCount ? 'partial' : 'ok',
      detail: `${favorite.stats.geosOk}/${favorite.stats.geosChecked} markets answered · ${favorite.stats.itemsSeen} items · ${favorite.matches.length} skin matches${skippedCount ? ` · ${skippedCount} market(s) skipped` : ''}`,
      ms: trends.ms,
    });
  }
  if (!community.threw) {
    const usedFallback = pulse.stats.perSub.some((s) => s.state === 'fallback');
    const failedSubs = pulse.stats.perSub.filter((s) => s.state === 'failed').map((s) => s.sub);
    const anyData = pulse.stats.postsAnalysed > 0;
    log.add({
      id: 'community',
      label: 'Reddit community (SkincareAddiction + KoreanBeauty)',
      state: !anyData ? 'failed' : usedFallback || failedSubs.length ? 'partial' : 'ok',
      detail: anyData
        ? `${pulse.stats.postsAnalysed} posts analysed${usedFallback ? ' · Atom fallback used (public JSON blocked)' : ' · public JSON used'}${failedSubs.length ? ` · failed sub(s): ${failedSubs.join(', ')}` : ''}`
        : 'no posts retrievable from JSON or Atom',
      ms: community.ms,
    });
  }
  if (!news.threw) {
    const failedQueries = press.stats.queries.filter((q) => q.state === 'failed');
    const anyData = press.items.length > 0;
    log.add({
      id: 'news',
      label: 'Google News RSS (EN + KO)',
      state: !anyData ? 'failed' : failedQueries.length ? 'partial' : 'ok',
      detail: anyData
        ? `${press.stats.itemsSeen} headline(s) read · ${press.stats.matched} lexicon-matched · ${press.items.length} shown${failedQueries.length ? ` · failed query(ies): ${failedQueries.map((q) => q.id).join(', ')}` : ''}`
        : 'no skincare-matching headline in either query',
      ms: news.ms,
    });
  }
  if (!social.threw) {
    log.add({
      id: 'social',
      label: 'TikTok Creative Center',
      state: signals.source === 'live' ? 'ok' : 'partial',
      detail: signals.source === 'live' ? 'live endpoint responded' : 'curated static fallback (endpoint gated)',
      ms: social.ms,
    });
  }
  log.add({
    id: 'watchlist',
    label: 'Competitor watchlist (static)',
    state: 'ok',
    detail: `${watchlist.length} ASINs listed · 0 Amazon requests by design`,
    ms: 0,
  });

  const snapshot = loadPreviousSnapshot(join(TOOL_ROOT, 'reports'), date);
  return { interest: interestRows, favorite, pulse, press, signals, watchlist, log, previous: snapshot, date };
}

export { VERSION, TOOL_ROOT, parseArgs, utcDate, HELP, collectAll };
/** Assemble the full markdown document. */
function renderDocument(ctx) {
  const { interest, favorite, pulse, press, signals, watchlist, log, previous, date } = ctx;
  const generatedAt = new Date().toISOString();
  const summary = buildSummary({
    interest,
    trends: favorite,
    community: pulse,
    news: press,
    social: signals,
    watchlist,
    statuses: log.all(),
    previous,
    date,
  });

  const out = [];
  out.push(`# Daily Skincare Market Intelligence — ${date}`);
  out.push('');
  out.push(`_Generated ${generatedAt} · tool v${VERSION} · sources: Wikimedia pageviews, Google Trends RSS, Reddit public feeds, Google News RSS (EN + KO), TikTok Creative Center, static watchlist · no paid APIs · no Amazon requests_`);
  out.push('');
  out.push('## 1. Top Trending Ingredients');
  out.push('');
  out.push(renderIngredientInterestSection(interest));
  out.push('');
  out.push('**Secondary signal — Google Trends daily RSS** _(news-driven feed, low skincare yield by design)_');
  out.push('');
  out.push(renderTrendsSection(favorite));
  out.push('');
  out.push('## 2. Community Pulse');
  out.push('');
  out.push(renderCommunitySection(pulse));
  out.push('');
  out.push('## 3. Market News Pulse');
  out.push('');
  out.push(renderNewsSection(press));
  out.push('');
  out.push('## 4. Social Signals');
  out.push('');
  out.push(renderSocialSection(signals));
  out.push('');
  out.push('## 5. Competitor Watchlist');
  out.push('');
  out.push(renderWatchlistSection(watchlist));
  out.push('');
  out.push('## 6. Auto-Summary');
  out.push('');
  out.push(numbered(summary));
  out.push('');
  out.push('## Source status');
  out.push('');
  out.push(table(
    ['Source', 'State', 'Detail', 'Duration'],
    log.all().map((s) => [s.label, s.state, s.detail, `${s.ms} ms`]),
  ));
  out.push('');
  out.push('## Methodology & caveats');
  out.push('');
  out.push('- **Trends:** the primary signal is **ingredient interest** measured as English Wikipedia pageviews for 18 tracked articles (Wikimedia pageviews API: public, no key, no cookie), comparing two complete days. Pageviews are a *curiosity* proxy — not sales, not search volume. Google Trends RSS is kept as a secondary signal only: it publishes no global feed and no per-keyword RSS, so "worldwide" is 12 markets queried individually, and its daily feed is news/sports-driven (0 skincare matches on 2026-09-15 → 2026-09-17). Google Trends\' informal keyword endpoints were re-probed on 2026-09-17: `/trends/api/dailytrends` answers 404 (retired) and `/trends/api/explore` answers 429 (throttled), so neither is used.');
  out.push('- **Community:** the public JSON endpoint is currently blocked (HTTP 403 for non-browser clients); the Atom feed is the documented fallback, which is why score/comments read "n/a (RSS transport)" on fallback rows.');
  out.push('- **Social:** TikTok Creative Center hashtag rankings are gated behind an authenticated session, so the curated list in `src/lib/lexicon.mjs` is used and the probe verdicts are printed as evidence.');
  out.push('- **News:** Google News RSS headlines (English + Korean queries) are filtered against the same ingredient/brand lexicon and printed with publisher and timestamp. Editorial coverage is a *coverage* signal, not consumer demand or sales volume; unmatched headlines are counted as read-but-skipped, never padded into the table.');
  out.push('- **Watchlist:** price/rating/BSR stay `TODO (PA-API)`; this tool never contacts Amazon.');
  out.push('- **Summary:** rule-based only — every line derived from the values above, never generated prose.');
  out.push('');
  out.push(`_Next report: ${date} + 1 day at 06:00 UTC via GitHub Actions._`);
  out.push('');

  return { markdown: out.join('\n'), summary };
}

/** Build the machine-readable snapshot used for day-over-day diffs. */
function renderSnapshot(ctx, summary) {
  const { interest, favorite, pulse, press, signals, log, date } = ctx;
  return {
    date,
    generatedAt: new Date().toISOString(),
    tool: `market-report v${VERSION}`,
    wikiViews: interest.rows
      .filter((r) => r.views !== null)
      .map((r) => ({ name: r.name, views: r.views, previous: r.previous, delta: r.delta })),
    trendTerms: favorite.matches.map((m) => m.term),
    ingredients: pulse.ingredientCounts,
    brands: pulse.brandCounts,
    newsHeadlines: press.items.map((i) => i.title),
    newsIngredients: press.stats.ingredientCounts,
    hashtags: signals.hashtags.map((h) => h.hashtag),
    sources: log.all().map((s) => ({ id: s.id, state: s.state, detail: s.detail })),
    summary,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(HELP);
    process.exitCode = 0;
    return;
  }

  const date = opts.date || utcDate();
  // Idempotency guard: today's report already published and fresh (right
  // title line, non-trivial size) → skip regeneration entirely. Protects the
  // 09:30 safety net and manual re-runs from duplicate work and needless
  // upstream traffic. Delete the day's files to force a regeneration.
  if (existingFresh(opts.dir, date)) {
    console.log(`market-report v${VERSION} · ${date}`);
    console.log('already published and fresh — skipping regeneration (idempotent skip)');
    return;
  }
  const ctx = await collectAll(date);
  const { markdown, summary } = renderDocument(ctx);
  const snapshot = renderSnapshot(ctx, summary);

  mkdirSync(opts.dir, { recursive: true });
  const mdPath = join(opts.dir, `${date}.md`);
  const jsonPath = join(opts.dir, `${date}.json`);
  writeFileSync(mdPath, markdown, 'utf8');
  writeFileSync(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const states = ctx.log.all();
  const failed = states.filter((s) => s.state === 'failed').length;

  // Data-point guard: `--guard` (used in CI) fails the run when the report would carry no
  // measurable data at all — no ingredient pageviews, no news headlines, no community posts
  // and no Google Trends match. GitHub then reports the failure, so an empty report can
  // never land in the archive silently.
  const dataPoints = {
    ingredients: ctx.interest.rows.filter((r) => r.views !== null).length,
    headlines: ctx.press.items.length,
    posts: ctx.pulse.posts.length,
    trends: ctx.favorite.matches.length,
  };
  const dataTotal = Object.values(dataPoints).reduce((n, v) => n + v, 0);

  console.log(`market-report v${VERSION} · ${date}`);
  console.log(`sources: ${states.map((s) => `${s.id}=${s.state}`).join(' ')}`);
  console.log(`wrote: ${mdPath}`);
  console.log(`wrote: ${jsonPath}`);
  console.log(`report bytes: ${Buffer.byteLength(markdown, 'utf8')} · sections: ${SECTION_COUNT} · summary lines: ${summary.length}`);
  console.log(`data points: ${dataTotal} (ingredients=${dataPoints.ingredients} headlines=${dataPoints.headlines} posts=${dataPoints.posts} trends=${dataPoints.trends})`);

  if (opts.print) {
    console.log('\n----- BEGIN REPORT -----\n');
    console.log(markdown);
    console.log('----- END REPORT -----');
  }

  if (failed === states.length && opts.strict) {
    console.error('strict mode: every source failed');
    process.exitCode = 1;
  }

  if (opts.guard && dataTotal === 0) {
    console.error('guard: the report carries no measurable data (no ingredient pageviews, no headlines, no community posts, no trend matches)');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`market-report failed: ${(err && err.stack) || err}`);
  process.exitCode = 1;
});