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
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SourceLog } from './lib/log.mjs';
import { buildSummary } from './lib/summary.mjs';
import { loadPreviousSnapshot } from './lib/history.mjs';
import { numbered, table } from './lib/markdown.mjs';
import { collectTrends, renderTrendsSection } from './sources/trends.mjs';
import { collectCommunity, renderCommunitySection } from './sources/reddit.mjs';
import { collectSocial, renderSocialSection } from './sources/tiktok.mjs';
import { collectWatchlist, renderWatchlistSection } from './sources/amazon.mjs';

const VERSION = '1.0.0';
const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(HERE, '..');

/** Parse argv into a small options object. */
function parseArgs(argv) {
  const opts = { date: '', dir: join(TOOL_ROOT, 'reports'), print: false, strict: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--date') opts.date = String(argv[++i] || '');
    else if (a === '--dir') opts.dir = resolve(String(argv[++i] || opts.dir));
    else if (a === '--print') opts.print = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

/** Today's date in UTC as YYYY-MM-DD (the workflow runs at 06:00 UTC). */
function utcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

const HELP = `Daily Skincare Market Intelligence v${VERSION}

Usage: node src/index.mjs [options]

  --date YYYY-MM-DD   Report date + filename (default: today in UTC)
  --dir PATH          Output directory (default: <tool>/reports)
  --print             Also print the full markdown report to stdout
  --strict            Exit non-zero when every source fails
  --help              Show this help

Sections: 1 trends · 2 community pulse · 3 social signals · 4 watchlist · 5 auto-summary`;

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

  const [trends, community, social] = await Promise.all([
    safe(log, 'trends', 'Google Trends RSS', () => collectTrends()),
    safe(log, 'community', 'Reddit community (SkincareAddiction + KoreanBeauty)', () => collectCommunity()),
    safe(log, 'social', 'TikTok Creative Center', () => collectSocial()),
  ]);

  const favorite = trends.value ?? { matches: [], stats: { geosChecked: 0, geosOk: 0, itemsSeen: 0, skipped: [], keywordProbe: 'not probed' } };
  const pulse = community.value ?? { posts: [], ingredientCounts: [], brandCounts: [], stats: { perSub: [], postsAnalysed: 0 } };
  const signals = social.value ?? { source: 'static-fallback', probes: [], hashtags: [] };
  const watchlist = collectWatchlist();

  // Source states — 'partial' means the source answered through a documented fallback.
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
  return { favorite, pulse, signals, watchlist, log, previous: snapshot, date };
}

export { VERSION, TOOL_ROOT, parseArgs, utcDate, HELP, collectAll };
/** Assemble the full markdown document. */
function renderDocument(ctx) {
  const { favorite, pulse, signals, watchlist, log, previous, date } = ctx;
  const generatedAt = new Date().toISOString();
  const summary = buildSummary({
    trends: favorite,
    community: pulse,
    social: signals,
    watchlist,
    statuses: log.all(),
    previous,
    date,
  });

  const out = [];
  out.push(`# Daily Skincare Market Intelligence — ${date}`);
  out.push('');
  out.push(`_Generated ${generatedAt} · tool v${VERSION} · sources: Google Trends RSS, Reddit public feeds, TikTok Creative Center, static watchlist · no paid APIs · no Amazon requests_`);
  out.push('');
  out.push('## 1. Top Trending Ingredients');
  out.push('');
  out.push(renderTrendsSection(favorite));
  out.push('');
  out.push('## 2. Community Pulse');
  out.push('');
  out.push(renderCommunitySection(pulse));
  out.push('');
  out.push('## 3. Social Signals');
  out.push('');
  out.push(renderSocialSection(signals));
  out.push('');
  out.push('## 4. Competitor Watchlist');
  out.push('');
  out.push(renderWatchlistSection(watchlist));
  out.push('');
  out.push('## 5. Auto-Summary');
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
  out.push('- **Trends:** Google Trends publishes no global feed and no per-keyword RSS, so "worldwide" is 12 markets queried individually and aggregated; a term ranking in more markets ranks higher. The retired keyword endpoint is probed once and skipped on 404.');
  out.push('- **Community:** the public JSON endpoint is currently blocked (HTTP 403 for non-browser clients); the Atom feed is the documented fallback, which is why score/comments read "n/a (RSS transport)" on fallback rows.');
  out.push('- **Social:** TikTok Creative Center hashtag rankings are gated behind an authenticated session, so the curated list in `src/lib/lexicon.mjs` is used and the probe verdicts are printed as evidence.');
  out.push('- **Watchlist:** price/rating/BSR stay `TODO (PA-API)`; this tool never contacts Amazon.');
  out.push('- **Summary:** rule-based only — five lines, each derived from the values above, never generated prose.');
  out.push('');
  out.push(`_Next report: ${date} + 1 day at 06:00 UTC via GitHub Actions._`);
  out.push('');

  return { markdown: out.join('\n'), summary };
}

/** Build the machine-readable snapshot used for day-over-day diffs. */
function renderSnapshot(ctx, summary) {
  const { favorite, pulse, signals, log, date } = ctx;
  return {
    date,
    generatedAt: new Date().toISOString(),
    tool: `market-report v${VERSION}`,
    trendTerms: favorite.matches.map((m) => m.term),
    ingredients: pulse.ingredientCounts,
    brands: pulse.brandCounts,
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

  console.log(`market-report v${VERSION} · ${date}`);
  console.log(`sources: ${states.map((s) => `${s.id}=${s.state}`).join(' ')}`);
  console.log(`wrote: ${mdPath}`);
  console.log(`wrote: ${jsonPath}`);
  console.log(`report bytes: ${Buffer.byteLength(markdown, 'utf8')} · sections: 5 · summary lines: ${summary.length}`);

  if (opts.print) {
    console.log('\n----- BEGIN REPORT -----\n');
    console.log(markdown);
    console.log('----- END REPORT -----');
  }

  if (failed === states.length && opts.strict) {
    console.error('strict mode: every source failed');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`market-report failed: ${(err && err.stack) || err}`);
  process.exitCode = 1;
});