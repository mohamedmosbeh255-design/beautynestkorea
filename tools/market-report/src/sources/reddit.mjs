/**
 * SECTION 2 SOURCE (PRIMARY DEMAND SIGNAL) — Community Pulse.
 * r/SkincareAddiction + r/KoreanBeauty, top posts of the day.
 *
 * Transport strategy (verified 2026-09-15, extended 2026-09-17):
 *   1) Public JSON endpoint (per spec) answers 403 for every non-browser client,
 *      even with a realistic User-Agent.
 *   2) Reddit's public Atom feed answers 200, so it is the documented fallback.
 *   3) Since 2026-09-17 the CDN also 403s this tool's own agent on the Atom feed
 *      (both JSON and Atom returned 403 from a machine where the same Atom URL with
 *      a browser agent returned 200), so the Atom call walks an ordered list of
 *      host/agent combinations (see ATOM_ATTEMPTS) and the report prints which one
 *      actually delivered the data. A 429 is never retried blindly: the advertised
 *      Retry-After is honoured once, then the run moves on.
 * The report records which transport each subreddit used, because the two differ:
 * JSON carries score/comments; Atom carries feed order (already Reddit's top-of-day
 * ranking) plus the post body. Missing fields are reported as "n/a", never guessed.
 *
 * No Amazon, no paid API, no scraping of logged-in surfaces, no OAuth token required.
 */
import { BROWSER_UA, fetchJson, fetchText, sleep } from '../lib/http.mjs';
import { blocks, stripTags, tagAttr, tagText } from '../lib/xml.mjs';
import { SUBREDDITS, aliasMatchers } from '../lib/lexicon.mjs';
import { BRANDS, INGREDIENTS } from '../lib/terms.mjs';
import { table, truncate } from '../lib/markdown.mjs';

const LIMIT = 30;

/**
 * Ordered host/agent combinations for the Atom fallback. Least intrusive first:
 * the tool's own agent on the canonical host, then a browser-like agent (the CDN blocks
 * non-browser agents), then the same browser agent on the legacy host. `old.reddit.com`
 * redirects to `www` for most routes today, so it is a last resort, not a bypass.
 */
const ATOM_ATTEMPTS = [
  { host: 'https://www.reddit.com', agent: /** @type {'tool'|'browser'} */ ('tool'), label: 'tool UA' },
  { host: 'https://www.reddit.com', agent: /** @type {'tool'|'browser'} */ ('browser'), label: 'browser UA' },
  { host: 'https://old.reddit.com', agent: /** @type {'tool'|'browser'} */ ('browser'), label: 'browser UA (legacy host)' },
];

/**
 * @typedef {Object} Post
 * @property {string} subreddit
 * @property {string} title
 * @property {string} url
 * @property {string} published
 * @property {number|string} score
 * @property {number|string} comments
 * @property {'json'|'atom'} transport
 * @property {string[]} ingredients
 * @property {string[]} brands
 * @property {string} [text]
 */

/** Transport 1 — public JSON (spec default). */
async function viaJson(sub) {
  const url = `https://www.reddit.com/r/${sub}/top.json?t=day&limit=${LIMIT}&raw_json=1`;
  const res = await fetchJson(url);
  const children = res.json && res.json.data && res.json.data.children;
  if (!res.ok || !Array.isArray(children)) {
    return { ok: false, error: res.error || 'unexpected JSON shape', status: res.status };
  }
  /** @type {Post[]} */
  const posts = children.map((c) => {
    const d = c.data || {};
    return {
      subreddit: sub,
      title: String(d.title || '').trim(),
      url: d.permalink ? `https://www.reddit.com${d.permalink}` : String(d.url || ''),
      published: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : '',
      score: typeof d.score === 'number' ? d.score : 'n/a',
      comments: typeof d.num_comments === 'number' ? d.num_comments : 'n/a',
      transport: /** @type {'json'} */ ('json'),
      ingredients: [],
      brands: [],
      text: `${d.title || ''} ${d.selftext || ''}`,
    };
  }).filter((p) => p.title);
  return { ok: true, posts, status: res.status };
}

/** Parse an Atom feed body into posts. Shared by both UA passes. */
function parseAtom(sub, body, status, ua) {
  const posts = blocks(body, 'entry').map((entry) => ({
    subreddit: sub,
    title: tagText(entry, 'title'),
    url: tagAttr(entry, 'link', 'href'),
    published: tagText(entry, 'published') || tagText(entry, 'updated'),
    score: 'n/a (RSS transport)',
    comments: 'n/a (RSS transport)',
    transport: /** @type {'atom'} */ ('atom'),
    ingredients: [],
    brands: [],
    text: `${tagText(entry, 'title')} ${stripTags(tagText(entry, 'content'))}`,
  })).filter((p) => p.title);
  return { ok: true, posts, status, ua };
}

/** Transport 2 — public Atom feed, verified working when JSON is blocked. */
async function viaAtom(sub) {
  const path = `/r/${sub}/top/.rss?t=day`;
  /** @type {string[]} */
  const failures = [];

  // Ordered, least-intrusive combinations first. Each combination is tried once — a 403
  // means "you are blocked", so repeating the same request is pointless; the next entry
  // changes the host or the agent instead. Every failure is named in the report.
  for (const attempt of ATOM_ATTEMPTS) {
    const url = `${attempt.host}${path}`;
    const res = await fetchText(url, {
      accept: 'application/atom+xml, application/xml;q=0.9, */*;q=0.8',
      attempts: 2,
      retryDelayMs: 3000,
      ...(attempt.agent === 'browser' ? { headers: { 'User-Agent': BROWSER_UA } } : {}),
    });

    if (res.ok && res.body) {
      return parseAtom(sub, res.body, res.status, `${attempt.label} via ${attempt.host.replace('https://', '')}`);
    }

    failures.push(`${attempt.label} → ${res.error || 'empty response'}${res.retryAfterMs ? ` (Retry-After ${Math.round(res.retryAfterMs / 1000)}s)` : ''}`);

    // 429 means "slow down": wait what Reddit advertised (capped), then move on. A 403 or
    // any other failure gets a short pause so three combinations never fire back-to-back.
    await sleep(res.status === 429 ? Math.min(res.retryAfterMs ?? 5000, 20000) : 1500);
  }

  return { ok: false, error: failures.join('; '), status: 403 };
}

/** Extract canonical ingredients + brands from a post's text. */
function annotate(post, ingMatchers, brandMatchers) {
  const text = String(post.text || post.title);
  post.ingredients = Array.from(new Set(ingMatchers.filter((m) => m.re.test(text)).map((m) => m.canonical)));
  post.brands = Array.from(new Set(brandMatchers.filter((m) => m.re.test(text)).map((m) => m.canonical)));
  return post;
}

/**
 * Collect top posts of the day across SUBREDDITS.
 * @returns {Promise<{ posts: Post[], ingredientCounts: { name: string, count: number }[], brandCounts: { name: string, count: number }[], stats: { perSub: { sub: string, state: string, transport: string, entries: number, detail: string }[], postsAnalysed: number } }>}
 */
export async function collectCommunity() {
  const ingMatchers = aliasMatchers(INGREDIENTS);
  const brandMatchers = aliasMatchers(BRANDS);
  /** @type {Post[]} */
  const posts = [];
  /** @type {{ sub: string, state: string, transport: string, entries: number, detail: string }[]} */
  const perSub = [];

  for (const sub of SUBREDDITS) {
    // Politeness delay: back-to-back requests across subreddits trigger Reddit's rate
    // limiter (observed live: HTTP 429 on the second subreddit at 5s spacing, again at
    // 3 requests per subreddit). 10s keeps a two-subreddit run well inside the limiter's
    // comfort zone without slowing the workflow meaningfully.
    if (posts.length || perSub.length) await sleep(10000);

    const json = await viaJson(sub);
    let result = json;

    if (json.ok) {
      perSub.push({ sub, state: 'ok', transport: 'json', entries: json.posts.length, detail: 'public JSON OK' });
    } else {
      const atom = await viaAtom(sub);
      result = atom;
      perSub.push({
        sub,
        state: atom.ok ? 'fallback' : 'failed',
        transport: atom.ok ? 'atom' : 'none',
        entries: atom.ok ? atom.posts.length : 0,
        detail: atom.ok
          ? `JSON blocked (${json.error}${json.status ? ` HTTP ${json.status}` : ''}) → Atom fallback OK (${atom.ua})`
          : `JSON: ${json.error}; Atom: ${atom.error || 'failed'}`,
      });
    }

    if (!result.ok) continue;
    for (const p of result.posts) posts.push(annotate(p, ingMatchers, brandMatchers));
  }

  // Rank: real scores first (JSON), then keep Reddit's top-of-day order (Atom).
  const ranked = posts
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => {
      const sa = typeof a.p.score === 'number' ? a.p.score : -1;
      const sb = typeof b.p.score === 'number' ? b.p.score : -1;
      if (sb !== sa) return sb - sa;
      return a.idx - b.idx;
    })
    .slice(0, 10)
    .map((x) => x.p);

  /** Tally a text-array field across every post analysed today. */
  const tally = (/** @type {'ingredients'|'brands'} */ key) => {
    const map = new Map();
    for (const p of posts) for (const v of p[key]) map.set(v, (map.get(v) || 0) + 1);
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };

  return {
    posts: ranked,
    ingredientCounts: tally('ingredients'),
    brandCounts: tally('brands'),
    stats: { perSub, postsAnalysed: posts.length },
  };
}

/** Render section 2 as markdown. */
export function renderCommunitySection(result) {
  const lines = [];
  const { posts, ingredientCounts, brandCounts, stats } = result;

  lines.push(`_Posts analysed today: **${stats.postsAnalysed}** · ranked: **${posts.length}**_`);
  lines.push('');
  lines.push(table(['Subreddit', 'Transport', 'Entries', 'State', 'Detail'], stats.perSub.map((s) => [s.sub, s.transport, `${s.entries}`, s.state, s.detail])));
  lines.push('');

  if (!posts.length) {
    lines.push('> **Community source unavailable today.** Both the public JSON and the Atom fallback returned nothing usable; no community section data is reported rather than replaced with filler.');
    return lines.join('\n');
  }

  lines.push('**Top posts**');
  lines.push(table(
    ['#', 'Title', 'Sub', 'Ingredients detected', 'Brands detected', 'Score', 'Comments'],
    posts.map((p, i) => [
      `${i + 1}`,
      `[${truncate(p.title, 70)}](${p.url})`,
      p.subreddit,
      p.ingredients.slice(0, 4).join(', ') || '—',
      p.brands.slice(0, 3).join(', ') || '—',
      `${p.score}`,
      `${p.comments}`,
    ]),
  ));

  lines.push('');
  lines.push('**Ingredient heat (mentions across all analysed posts)**');
  lines.push(ingredientCounts.length
    ? table(['Ingredient', 'Posts mentioning'], ingredientCounts.slice(0, 12).map((c) => [c.name, `${c.count}`]))
    : '_No lexicon ingredient detected in today\'s posts._');

  lines.push('');
  lines.push('**Brand mentions**');
  lines.push(brandCounts.length
    ? table(['Brand', 'Posts mentioning'], brandCounts.slice(0, 12).map((c) => [c.name, `${c.count}`]))
    : '_No watchlist brand detected in today\'s posts._');

  return lines.join('\n');
}