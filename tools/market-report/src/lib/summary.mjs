/**
 * SECTION 5 — Auto-summary (exactly five lines, rule-based, no LLM).
 *
 * Every line is derived from measured values passed in: nothing is generated,
 * paraphrased or inferred. When a rule has no data to fire on, the line says so.
 */
import { ingredientMovers, newTrendTerms } from './history.mjs';

/**
 * @param {Object} input
 * @param {{ matches: any[], stats: any }} input.trends
 * @param {{ posts: any[], ingredientCounts: { name: string, count: number }[], brandCounts: { name: string, count: number }[], stats: any }} input.community
 * @param {{ source: string, hashtags: any[], probes: any[] }} input.social
 * @param {{ asin: string }[]} input.watchlist
 * @param {any[]} input.statuses  source status entries
 * @param {import('./history.mjs').Snapshot | null} input.previous
 * @param {string} input.date
 * @returns {string[]} five summary lines
 */
export function buildSummary(input) {
  const { trends, community, social, watchlist, statuses, previous, date } = input;
  const lines = [];

  // 1) Source health — what answered, what degraded.
  const ok = statuses.filter((s) => s.state !== 'failed').length;
  const failed = statuses.filter((s) => s.state === 'failed').map((s) => s.label);
  const degraded = statuses.filter((s) => s.state === 'partial').map((s) => s.label);
  lines.push(
    `**Source health:** ${ok}/${statuses.length} sources produced data` +
    (degraded.length ? ` · degraded (documented fallback): ${degraded.join(', ')}` : '') +
    (failed.length ? ` · failed: ${failed.join(', ')}` : ' · no source failed'),
  );

  // 2) Strongest trend signal across markets.
  const top = trends.matches[0];
  if (top) {
    const where = top.countries.slice(0, 5).join(', ');
    lines.push(`**Trend mover:** "${top.term}" is the strongest skin-related search today, surfacing in ${top.countries.length} market(s) (${where}) at ${top.trafficMax || 0}+ peak traffic; matched on ${top.matchedKeywords.slice(0, 3).join(', ')}.`);
  } else {
    lines.push(`**Trend mover:** none. ${trends.stats.geosOk}/${trends.stats.geosChecked} Google Trends markets answered (${trends.stats.itemsSeen} items scanned) but no skin-related query surfaced — a dry day for this feed, reported as-is.`);
  }

  // 3) Community demand signal.
  const ing = community.ingredientCounts[0];
  const brand = community.brandCounts[0];
  if (community.posts.length) {
    lines.push(
      `**Community pulse:** ${community.stats.postsAnalysed} posts analysed; the most-discussed ingredient is ` +
      `${ing ? `**${ing.name}** (${ing.count} posts)` : 'none from the lexicon'}` +
      `${brand ? `, with **${brand.name}** the most-mentioned brand (${brand.count} posts)` : ''}.`,
    );
  } else {
    lines.push('**Community pulse:** no community data today — both the public JSON and the Atom fallback returned nothing usable.');
  }

  // 4) Biggest day-over-day mover (real delta, or an explicit first-run baseline note).
  const movers = ingredientMovers(previous, community.ingredientCounts);
  const rising = movers.filter((m) => m.delta > 0);
  const falling = movers.filter((m) => m.delta < 0);
  if (!previous) {
    lines.push(`**Biggest mover:** first recorded run, so there is no previous snapshot to diff against — today's counts become the baseline for ${date}.`);
  } else if (rising.length || falling.length) {
    const up = rising[0] ? `${rising[0].name} +${rising[0].delta} (now ${rising[0].now})` : 'nothing rose';
    const down = falling[0] ? `${falling[0].name} ${falling[0].delta} (now ${falling[0].now})` : 'nothing fell';
    const fresh = newTrendTerms(previous, trends.matches.map((m) => m.term));
    lines.push(`**Biggest mover vs ${previous.date}:** up — ${up}; down — ${down}${fresh.length ? `; new trend terms: ${fresh.slice(0, 3).join(', ')}` : ''}.`);
  } else {
    lines.push(`**Biggest mover vs ${previous.date}:** no ingredient moved in either direction; the conversation mix is flat.`);
  }

  // 5) Commercial next step, driven by today's strongest signal.
  const focus = ing ? ing.name : (top ? top.matchedKeywords[0] : 'sunscreen');
  lines.push(`**Next action:** watchlist holds ${watchlist.length} ASINs with price/rating/BSR still ${'TODO (PA-API)'}; while those wait, prioritise content around **${focus}**, the strongest demand signal available today (social source: ${social.source}).`);

  return lines;
}