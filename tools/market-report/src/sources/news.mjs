/**
 * SECTION 3 SOURCE (v1.1) — Market news pulse, via Google News RSS.
 *
 * WHY THIS BECOMES THE *LIVE* SECTION-3 SOURCE:
 * TikTok Creative Center's ranking endpoints are gated behind an authenticated session
 * (verified 2026-09-15/17: HTTP 404 and {"code":40101,"msg":"no permission"}), so that
 * section can only ever print a curated list. Google News RSS answers 200 with ~100 dated
 * headlines per query, needs no token, no key and no browser, and is served from Google's
 * public RSS host (verified live 2026-09-17 with this tool's own User-Agent).
 *
 * WHAT IT IS NOT: editorial coverage is not consumer demand. Headlines are printed as
 * published, with their publisher and timestamp, and the methodology section states the
 * limitation instead of dressing news up as search or sales volume.
 *
 * No paid API, no key, no scraping of gated surfaces, no second runtime.
 */
import { fetchText } from '../lib/http.mjs';
import { blocks, tagText } from '../lib/xml.mjs';
import { NEWS_QUERIES, aliasMatchers } from '../lib/lexicon.mjs';
import { BRANDS, INGREDIENTS } from '../lib/terms.mjs';
import { table, truncate } from '../lib/markdown.mjs';

const MAX_ITEMS = 12;

/**
 * @typedef {Object} NewsItem
 * @property {string} title
 * @property {string} url
 * @property {string} publisher
 * @property {string} published  ISO string, or '' when the feed omits it
 * @property {string} query      id of the query that surfaced it
 * @property {string[]} ingredients
 * @property {string[]} brands
 */

/** Google News suffixes every title with " - Publisher"; drop it when it duplicates <source>. */
function stripPublisherSuffix(title, publisher) {
  if (!publisher) return title;
  const suffix = ` - ${publisher}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

/** ISO stamp from an RFC-822 pubDate; '' when unparseable (never guessed). */
function toIso(pubDate) {
  if (!pubDate) return '';
  const t = Date.parse(pubDate);
  return Number.isFinite(t) ? new Date(t).toISOString() : '';
}

/** `YYYY-MM-DD HH:MM UTC`, or a dash when the feed gave no usable date. */
function utcStamp(iso) {
  if (!iso) return '—';
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/** Sortable pairs from a tally map. */
function toPairs(/** @type {Map<string, number>} */ m) {
  return Array.from(m.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Collect the day's skincare headlines across the configured queries.
 * @returns {Promise<{ items: NewsItem[], stats: { queries: { id: string, label: string, state: string, items: number, detail: string }[], itemsSeen: number, matched: number, ingredientCounts: { name: string, count: number }[], brandCounts: { name: string, count: number }[] } }>}
 */
export async function collectNews() {
  const ingMatchers = aliasMatchers(INGREDIENTS);
  const brandMatchers = aliasMatchers(BRANDS);
  /** @type {{ id: string, label: string, state: string, items: number, detail: string }[]} */
  const queries = [];
  /** @type {Map<string, NewsItem>} */
  const byTitle = new Map();
  const ingCounts = new Map();
  const brandCounts = new Map();
  let itemsSeen = 0;

  for (const query of NEWS_QUERIES) {
    const res = await fetchText(query.url, {
      accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      attempts: 2,
    });

    if (!res.ok || !res.body) {
      queries.push({ id: query.id, label: query.label, state: 'failed', items: 0, detail: res.error || 'empty response' });
      continue;
    }

    const feedItems = blocks(res.body, 'item');
    let matched = 0;
    for (const item of feedItems) {
      const publisher = tagText(item, 'source');
      const title = stripPublisherSuffix(tagText(item, 'title'), publisher);
      if (!title) continue;
      itemsSeen++;

      const ingredients = Array.from(new Set(ingMatchers.filter((m) => m.re.test(title)).map((m) => m.canonical)));
      const brands = Array.from(new Set(brandMatchers.filter((m) => m.re.test(title)).map((m) => m.canonical)));
      // Only lexicon-matched headlines are kept: unmatched headlines are noise for this project,
      // so they are counted as read-but-skipped instead of padding the table.
      if (!ingredients.length && !brands.length) continue;

      matched++;
      for (const name of ingredients) ingCounts.set(name, (ingCounts.get(name) || 0) + 1);
      for (const name of brands) brandCounts.set(name, (brandCounts.get(name) || 0) + 1);

      const key = title.toLowerCase();
      const seen = byTitle.get(key);
      if (seen) {
        seen.ingredients = Array.from(new Set([...seen.ingredients, ...ingredients]));
        seen.brands = Array.from(new Set([...seen.brands, ...brands]));
        continue;
      }
      byTitle.set(key, {
        title,
        url: tagText(item, 'link'),
        publisher,
        published: toIso(tagText(item, 'pubDate')),
        query: query.id,
        ingredients,
        brands,
      });
    }

    queries.push({
      id: query.id,
      label: query.label,
      state: 'ok',
      items: matched,
      detail: `${matched} lexicon-matched of ${feedItems.length} headline(s) read`,
    });
  }

  const items = Array.from(byTitle.values())
    .sort((a, b) => (b.published || '').localeCompare(a.published || '') || a.title.localeCompare(b.title))
    .slice(0, MAX_ITEMS);

  return {
    items,
    stats: {
      queries,
      itemsSeen,
      matched: byTitle.size,
      ingredientCounts: toPairs(ingCounts),
      brandCounts: toPairs(brandCounts),
    },
  };
}

/** Render section 3 as markdown. */
export function renderNewsSection(result) {
  const { items, stats } = result;
  const lines = [];
  const okQueries = stats.queries.filter((q) => q.state === 'ok').length;

  lines.push(
    `_Queries: **${okQueries}/${stats.queries.length}** answered · headlines read: **${stats.itemsSeen}** · `
    + `lexicon-matched: **${stats.matched}** · shown: **${items.length}**_`,
  );
  lines.push('');

  if (!items.length) {
    lines.push("> **No skincare-matching headline in today's news feeds.** Nothing is inferred from unrelated coverage; the query log below shows exactly what each feed returned.");
  } else {
    const rows = items.map((it, i) => [
      `${i + 1}`,
      truncate(it.title, 78),
      it.publisher || '—',
      utcStamp(it.published),
      it.ingredients.concat(it.brands).slice(0, 3).join(', ') || '—',
    ]);
    lines.push(table(['#', 'Headline', 'Publisher', 'Published', 'Matched on'], rows));

    const topIng = stats.ingredientCounts[0];
    const topBrand = stats.brandCounts[0];
    if (topIng || topBrand) {
      lines.push('');
      lines.push(
        "**Most-covered in today's headlines:** "
        + (topIng ? `**${topIng.name}** (${topIng.count} headline(s))` : 'no ingredient from the lexicon')
        + (topBrand ? `, with **${topBrand.name}** the most-covered brand (${topBrand.count} headline(s))` : '')
        + '.',
      );
    }
    if (items[0].url) {
      lines.push('');
      lines.push(`**Lead story:** [${truncate(items[0].title, 90)}](${items[0].url}) — ${items[0].publisher || 'publisher n/a'}, ${utcStamp(items[0].published)}`);
    }
  }

  lines.push('');
  lines.push('**Query log**');
  lines.push(table(
    ['Query', 'State', 'Matched', 'Detail'],
    stats.queries.map((q) => [q.label, q.state, `${q.items}`, q.detail]),
  ));
  return lines.join('\n');
}
