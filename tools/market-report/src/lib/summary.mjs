/**
 * SECTION 6 — Auto-summary (rule-based, no LLM).
 *
 * Every line is derived from measured values passed in: nothing is generated,
 * paraphrased or inferred. When a rule has no data to fire on, the line says so.
 */
import { ingredientMovers, newTrendTerms } from './history.mjs';

/**
 * @param {Object} input
 * @param {{ rows: any[], stats: any }} input.interest
 * @param {{ matches: any[], stats: any }} input.trends
 * @param {{ posts: any[], ingredientCounts: { name: string, count: number }[], brandCounts: { name: string, count: number }[], stats: any }} input.community
 * @param {{ items: any[], stats: any }} input.news
 * @param {{ source: string, hashtags: any[], probes: any[] }} input.social
 * @param {{ asin: string }[]} input.watchlist
 * @param {any[]} input.statuses  source status entries
 * @param {import('./history.mjs').Snapshot | null} input.previous
 * @param {string} input.date
 * @returns {string[]} summary lines
 */
export function buildSummary(input) {
  const { interest, trends, community, news, social, watchlist, statuses, previous, date } = input;
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

  // 2) Ingredient interest — the primary trend signal (Wikipedia pageviews, two complete days).
  const measured = interest.rows.filter((r) => r.views !== null);
  const wikiRise = measured.filter((r) => r.delta !== null && r.delta > 0).sort((a, b) => b.delta - a.delta)[0];
  const googleTop = trends.matches[0];
  if (measured.length) {
    const biggest = measured[0];
    lines.push(
      `**Ingredient interest:** ${measured.length}/${interest.rows.length} tracked ingredients measured (Wikipedia pageviews, ${interest.stats.latestDate} vs ${interest.stats.previousDate}). ` +
      (wikiRise
        ? `Biggest rise: **${wikiRise.name}** +${wikiRise.delta.toLocaleString('en-US')} views (${wikiRise.pct === null ? 'n/a' : `${wikiRise.pct > 0 ? '+' : ''}${wikiRise.pct.toFixed(1)}%`}). `
        : 'No ingredient rose day-over-day. ') +
      `Highest volume: **${biggest.name}** (${biggest.views.toLocaleString('en-US')} views).` +
      (googleTop
        ? ` Secondary Google Trends signal: "${googleTop.term}" in ${googleTop.countries.length} market(s).`
        : ` Secondary Google Trends signal: none today (${trends.stats.geosOk}/${trends.stats.geosChecked} markets answered, ${trends.stats.itemsSeen} items scanned, 0 skincare matches).`),
    );
  } else {
    lines.push(`**Ingredient interest:** no pageview data today — every tracked article request failed (see section 1). Secondary Google Trends signal: ${trends.stats.geosOk}/${trends.stats.geosChecked} markets answered (${trends.stats.itemsSeen} items scanned), 0 skincare matches.`);
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

  // 4) News coverage signal — editorial coverage, explicitly not demand.
  const pressIng = news.stats.ingredientCounts[0];
  const pressBrand = news.stats.brandCounts[0];
  if (news.items.length) {
    lines.push(
      `**News pulse:** ${news.stats.itemsSeen} headline(s) read across ${news.stats.queries.length} quer(ies), ${news.stats.matched} matched the lexicon. ` +
      `Most-covered: ${pressIng ? `**${pressIng.name}** (${pressIng.count} headline(s))` : 'no ingredient from the lexicon'}` +
      `${pressBrand ? `, brand **${pressBrand.name}** (${pressBrand.count} headline(s))` : ''} — editorial coverage, not consumer demand.`,
    );
  } else {
    lines.push("**News pulse:** no skincare-matching headline in today's news feeds — the per-query log in section 3 shows what each feed returned.");
  }

  // 5) Biggest day-over-day mover — measured pageviews first, community deltas as a cross-check.
  const movers = ingredientMovers(previous, community.ingredientCounts);
  const rising = movers.filter((m) => m.delta > 0);
  const falling = movers.filter((m) => m.delta < 0);
  const wikiFall = measured.filter((r) => r.delta !== null && r.delta < 0).sort((a, b) => a.delta - b.delta)[0];
  if (measured.length) {
    lines.push(
      `**Biggest mover (pageviews ${interest.stats.latestDate} vs ${interest.stats.previousDate}):** up — `
      + (wikiRise ? `${wikiRise.name} +${wikiRise.delta.toLocaleString('en-US')} views` : 'nothing rose')
      + `; down — ${wikiFall ? `${wikiFall.name} ${wikiFall.delta.toLocaleString('en-US')} views` : 'nothing fell'}.`
      + (rising.length || falling.length
        ? ` Community mention deltas: up — ${rising[0] ? `${rising[0].name} +${rising[0].delta}` : 'none'}, down — ${falling[0] ? `${falling[0].name} ${falling[0].delta}` : 'none'}.`
        : ''),
    );
  } else if (!previous) {
    lines.push(`**Biggest mover:** first recorded run, so there is no previous snapshot to diff against — today's counts become the baseline for ${date}.`);
  } else if (rising.length || falling.length) {
    const up = rising[0] ? `${rising[0].name} +${rising[0].delta} (now ${rising[0].now})` : 'nothing rose';
    const down = falling[0] ? `${falling[0].name} ${falling[0].delta} (now ${falling[0].now})` : 'nothing fell';
    const fresh = newTrendTerms(previous, trends.matches.map((m) => m.term));
    lines.push(`**Biggest mover vs ${previous.date}:** up — ${up}; down — ${down}${fresh.length ? `; new trend terms: ${fresh.slice(0, 3).join(', ')}` : ''}.`);
  } else {
    lines.push(`**Biggest mover vs ${previous.date}:** no ingredient moved in either direction; the conversation mix is flat.`);
  }

  // 6) Commercial next step, driven by today's strongest signal.
  const focus = ing ? ing.name : (pressIng ? pressIng.name : (googleTop ? googleTop.matchedKeywords[0] : (measured[0] ? measured[0].name : 'sunscreen')));
  const focusSource = ing ? 'community mentions' : (pressIng ? 'news coverage' : (googleTop ? 'Google Trends RSS' : (measured[0] ? 'ingredient pageviews' : 'default editorial pick')));
  lines.push(`**Next action:** watchlist holds ${watchlist.length} ASINs with price/rating/BSR still ${'TODO (PA-API)'}; while those wait, prioritise content around **${focus}**, the strongest demand signal available today (source: ${focusSource}; social source: ${social.source}).`);

  return lines;
}