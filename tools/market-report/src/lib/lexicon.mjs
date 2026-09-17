/**
 * Curated lexicons for the Daily Skincare Market Intelligence report.
 * Rule-based and hand-maintained: v1 uses no ML, no LLM and no paid API.
 * Extend these lists to widen coverage; every section reads from these files.
 */

/** Markets queried against Google Trends' per-country daily RSS feed (there is no "worldwide" geo). */
export const GEOS = ['US', 'GB', 'CA', 'AU', 'IN', 'DE', 'FR', 'JP', 'KR', 'BR', 'SG', 'AE'];

/** Human labels for report tables. */
export const GEO_LABELS = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  IN: 'India', DE: 'Germany', FR: 'France', JP: 'Japan', KR: 'South Korea',
  BR: 'Brazil', SG: 'Singapore', AE: 'United Arab Emirates',
};

/**
 * Broad match terms for the trends filter. Google Trends' daily RSS feed is
 * news-driven, so this filter is intentionally wide (ingredients, categories,
 * brands, concerns, treatments) to catch whatever skin query surfaces that day.
 */
export const SKINCARE_KEYWORDS = [
  'skincare', 'skin care', 'k-beauty', 'kbeauty', 'korean beauty', 'korean skincare', 'j-beauty',
  'serum', 'ampoule', 'essence', 'toner', 'moisturizer', 'moisturiser', 'cleanser', 'face wash',
  'sunscreen', 'sunblock', 'spf', 'spf50', 'retinol', 'retinal', 'retinoid', 'tretinoin', 'accutane',
  'niacinamide', 'hyaluronic', 'ceramide', 'ceramides', 'centella', 'cica', 'azelaic', 'salicylic',
  'glycolic', 'lactic acid', 'benzoyl peroxide', 'adapalene', 'peptide', 'peptides', 'panthenol',
  'squalane', 'snail mucin', 'mucin', 'propolis', 'mugwort', 'rice extract', 'ginseng', 'vitamin c',
  'ascorbic', 'tranexamic', 'kojic', 'urea cream', 'allantoin', 'madecassoside', 'pdrn', 'exosome',
  'bakuchiol', 'collagen', 'sheet mask', 'face mask', 'gua sha', 'jade roller', 'slugging',
  'skin cycling', 'double cleanse', 'micellar', 'oil cleanser', 'chemical peel', 'dermaplaning',
  'microneedling', 'acne', 'pimples', 'blackhead', 'whitehead', 'pores', 'glass skin', 'dewy skin',
  'hyperpigmentation', 'dark spot', 'melasma', 'eczema', 'rosacea', 'psoriasis', 'dermatologist',
  'skin barrier', 'barrier repair', 'wrinkle', 'fine lines', 'skin aging', 'brightening',
  'cosrx', 'cerave', 'anua', 'beauty of joseon', 'purito', 'haruharu', 'skin1004', 'medicube',
  'round lab', 'laneige', 'innisfree', 'la roche-posay', 'la roche posay', 'the ordinary',
  "paula's choice", 'paulas choice', 'dr jart', 'dr. jart', 'biodance', 'mediheal', 'torriden',
  'isntree', 'mixsoon', 'numbuzin', 'tocobo', 'byoma', 'glow recipe', 'tatcha', 'supergoop',
  'eltamd', 'avene', 'bioderma', 'eucerin', 'neutrogena', 'olay', 'nivea', 'vaseline', 'aquaphor',
];

/** Subreddits for Community Pulse. */
export const SUBREDDITS = ['SkincareAddiction', 'KoreanBeauty'];

/**
 * Market-news queries (Google News RSS, v1.1 / section 3). Google News RSS is a public,
 * token-free, server-friendly feed, which is why it replaces the gated TikTok ranking as
 * the live section-3 source. Each query returns ~100 dated headlines; the report filters
 * them against the skincare lexicon and prints only real titles with their publisher.
 * Honest scope: editorial coverage, NOT consumer demand — the methodology says so.
 */
export const NEWS_QUERIES = [
  {
    id: 'en',
    label: 'English (US) — skincare ingredients & K-beauty',
    url: 'https://news.google.com/rss/search?q=(skincare+OR+%22k-beauty%22)+(ingredient+OR+retinol+OR+%22snail+mucin%22+OR+PDRN)&hl=en-US&gl=US&ceid=US:en',
  },
  {
    id: 'ko',
    label: 'Korean (KR) — 스킨케어 성분 (skincare ingredients)',
    url: 'https://news.google.com/rss/search?q=%EC%8A%A4%ED%82%A8%EC%BC%80%EC%96%B4+%EC%84%B1%EB%B6%84&hl=ko&gl=KR&ceid=KR:ko',
  },
];

/**
 * Ingredient-interest proxy (v1.1 / section 1): English Wikipedia article titles, one per
 * tracked ingredient. The Wikimedia pageviews API is public, token-free and answers cloud
 * IPs reliably (verified live 2026-09-17: 18/18 titles answered 200 from this machine),
 * unlike Google Trends' daily RSS which is news-driven and rarely carries skincare queries.
 * Titles must be exact article names: an unknown title answers 404 and is reported as such,
 * never guessed. Adding an ingredient here widens the section automatically.
 */
export const WIKI_ARTICLES = {
  'Retinol / Retinoids': ['Retinol', 'Tretinoin', 'Adapalene'],
  'Niacinamide': ['Niacinamide'],
  'Hyaluronic Acid': ['Hyaluronic_acid'],
  'Ceramides': ['Ceramide'],
  'Centella Asiatica (Cica)': ['Centella_asiatica'],
  'Azelaic Acid': ['Azelaic_acid'],
  'Salicylic Acid (BHA)': ['Salicylic_acid'],
  'Glycolic / AHA': ['Glycolic_acid'],
  'Vitamin C': ['Vitamin_C'],
  'Benzoyl Peroxide': ['Benzoyl_peroxide'],
  'Snail Mucin': ['Snail_slime'],
  'Bakuchiol': ['Bakuchiol'],
  'Panthenol (B5)': ['Panthenol'],
  'Squalane': ['Squalane'],
  'Tranexamic Acid': ['Tranexamic_acid'],
  'Kojic Acid': ['Kojic_acid'],
};

/** Competitor watchlist. Static by design: NO Amazon requests are made from this tool. */
export const WATCHLIST = [
  { asin: 'B08CMS8P67', label: 'Watchlist item 1' },
  { asin: 'B07ZKHPV9Y', label: 'Watchlist item 2' },
  { asin: 'B00PBX3L7K', label: 'Watchlist item 3' },
  { asin: 'B09DLFCB69', label: 'Watchlist item 4' },
  { asin: 'B08CMVXQ9W', label: 'Watchlist item 5' },
  { asin: 'B0B7XFYR23', label: 'Watchlist item 6' },
];

/** Escape a literal string for use inside a RegExp. */
export function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build word-boundary matchers so "acne" does not match "acneform". */
export function toMatchers(list) {
  return list.map((k) => ({ key: k, re: new RegExp(`(^|[^a-z0-9])${esc(k)}([^a-z0-9]|$)`, 'i') }));
}

/** Alias map -> canonical matchers, shared by trends + community extraction. */
export function aliasMatchers(map) {
  /** @type {{ canonical: string, re: RegExp }[]} */
  const out = [];
  for (const [canonical, aliases] of Object.entries(map)) {
    for (const alias of aliases) {
      out.push({ canonical, re: new RegExp(`(^|[^a-z0-9])${esc(alias)}([^a-z0-9]|$)`, 'i') });
    }
  }
  return out;
}

/**
 * TikTok Creative Center requires an authenticated session (verified 2026-09-15:
 * public endpoints answer {"code":40101,"msg":"no permission"}), so v1 ships this
 * curated fallback list instead of scraping the dashboard. Refresh quarterly, or
 * wire the official TikTok Business API later.
 */
export const TIKTOK_FALLBACK_HASHTAGS = [
  { rank: 1, hashtag: '#skincare', category: 'Category', intent: 'Discovery / broad' },
  { rank: 2, hashtag: '#skincaretips', category: 'Education', intent: 'Advice-seeking' },
  { rank: 3, hashtag: '#koreanskincare', category: 'K-Beauty', intent: 'Routine discovery' },
  { rank: 4, hashtag: '#glassskin', category: 'K-Beauty', intent: 'Aspirational finish' },
  { rank: 5, hashtag: '#skincareroutine', category: 'Education', intent: 'Routine building' },
  { rank: 6, hashtag: '#retinol', category: 'Ingredient', intent: 'Active research' },
  { rank: 7, hashtag: '#niacinamide', category: 'Ingredient', intent: 'Active research' },
  { rank: 8, hashtag: '#sunscreen', category: 'Product', intent: 'Daily SPF' },
  { rank: 9, hashtag: '#slugging', category: 'Trend', intent: 'Barrier repair' },
  { rank: 10, hashtag: '#skincycling', category: 'Trend', intent: 'Active scheduling' },
  { rank: 11, hashtag: '#acne', category: 'Concern', intent: 'Problem-solving' },
  { rank: 12, hashtag: '#acnescar', category: 'Concern', intent: 'Post-acne marks' },
  { rank: 13, hashtag: '#pores', category: 'Concern', intent: 'Texture / sebum' },
  { rank: 14, hashtag: '#darkspots', category: 'Concern', intent: 'Brightening' },
  { rank: 15, hashtag: '#snailmucin', category: 'Ingredient', intent: 'K-Beauty staple' },
  { rank: 16, hashtag: '#pdrn', category: 'Ingredient', intent: 'Newer / speculative' },
  { rank: 17, hashtag: '#collagen', category: 'Ingredient', intent: 'Firmness' },
  { rank: 18, hashtag: '#doublecleanse', category: 'Routine', intent: 'Step education' },
  { rank: 19, hashtag: '#sensitiveskin', category: 'Skin type', intent: 'Barrier-first' },
  { rank: 20, hashtag: '#beautyofjoseon', category: 'Brand', intent: 'Brand discovery' },
];
