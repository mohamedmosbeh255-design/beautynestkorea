/**
 * SECTION 4 SOURCE — Competitor watchlist (static, deliberately network-free).
 *
 * WHY THERE IS NO FETCH IN THIS FILE:
 * this project was previously IP-throttled by Amazon for scraping. v1 therefore
 * performs ZERO requests against amazon.com or any Amazon endpoint: the table is
 * rendered from the static ASIN list in lexicon.mjs with price/rating/BSR marked
 * TODO, to be filled later through the official Product Advertising API (PA-API)
 * once credentials exist.
 *
 * This is a guardrail, not a temporary hack: if you add a fetch here, you are
 * breaking the project's stated rule.
 */
import { WATCHLIST } from '../lib/lexicon.mjs';
import { table } from '../lib/markdown.mjs';

export const AMAZON_TODO = 'TODO (PA-API)';

/**
 * @returns {{ asin: string, label: string, url: string, price: string, rating: string, bsr: string, status: string }[]}
 */
export function collectWatchlist() {
  return WATCHLIST.map((w) => ({
    asin: w.asin,
    label: w.label,
    // A plain link is safe: it is rendered, never requested by this tool.
    url: `https://www.amazon.com/dp/${w.asin}`,
    price: AMAZON_TODO,
    rating: AMAZON_TODO,
    bsr: AMAZON_TODO,
    status: 'pending PA-API credentials',
  }));
}

/** Render section 4 as markdown. */
export function renderWatchlistSection(rows) {
  const lines = [];
  lines.push(`_Tracked ASINs: **${rows.length}** · live metrics: **${AMAZON_TODO}** · Amazon requests made by this tool: **0**_`);
  lines.push('');
  lines.push(table(
    ['ASIN', 'Listing', 'Price', 'Rating', 'BSR', 'Status'],
    rows.map((r) => [r.asin, `[${r.asin}](${r.url})`, r.price, r.rating, r.bsr, r.status]),
  ));
  lines.push('');
  lines.push('**Why the columns are empty:** Amazon presented an IP throttle after earlier scraping, so v1 makes no Amazon requests at all. Price, rating and BSR will be populated through the official Product Advertising API (PA-API) in a later version — the ASINs above are pre-wired for that switch.');
  return lines.join('\n');
}