/**
 * Market Report Data Processing Pipeline — GENERATION-TIME cleaning layer.
 *
 * Twin of src/lib/market-report-processor.ts (which cleans at fetch/render
 * time, repairing even already-committed reports). This file applies the SAME
 * rules inside the generator (dependency-free Node runtime), so newly written
 * report files are clean at rest: full titles, real engagement scores, clean
 * detected-name lists. Keep both files behaviorally in sync.
 *
 * Imported by sources/reddit.mjs + sources/news.mjs (clean before render and
 * before the JSON snapshot is built) — every scheduled run passes through it
 * automatically via src/index.mjs → collectAll().
 */

const ELLIPSIS = '…';

/** True when a feed title was cut off upstream (Unicode or ASCII ellipsis tail). */
export function isFeedTruncated(title) {
  return /(…|\.{3})\s*["')\]]?\s*$/.test(String(title ?? '').trimEnd());
}

/** Collapse whitespace; normalize a trailing "..." to a single "…". */
export function normalizeTitleText(title) {
  return String(title ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.{3}\s*$/, ELLIPSIS);
}

/** Lowercase slug words from a post URL (Reddit permalinks embed the title). */
function slugWords(url) {
  try {
    const path = new URL(String(url)).pathname.toLowerCase();
    const slug = path.split('/').filter(Boolean).pop() ?? '';
    return slug.split(/[^a-z0-9]+/).filter(Boolean);
  } catch {
    return [];
  }
}

function wordList(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
}

/**
 * Best-effort title restoration from the post URL slug — no network needed.
 * Feed titles and URL slugs are truncated independently by Reddit, so when the
 * slug runs past a truncated title tail its extra words are spliced back on.
 * (Live re-fetch per post is deliberately avoided: Reddit 403s non-browser
 * clients, and 10+ extra requests would blow the run's politeness budget.
 * The title stays linked to the source post, where readers get the full text.)
 */
export function restoreTitleFromPostUrl(title, url) {
  const clean = normalizeTitleText(title);
  if (!isFeedTruncated(clean)) return { title: clean, restored: false };
  const slug = slugWords(url);
  if (!slug.length) return { title: clean, restored: false };

  const body = clean.replace(/(…|\.{3})\s*["')\]]?\s*$/, '').trimEnd();
  const bodyWords = wordList(body);
  if (!bodyWords.length) return { title: clean, restored: false };

  let overlap = 0;
  const maxOverlap = Math.min(slug.length, bodyWords.length);
  for (let n = maxOverlap; n > 0; n--) {
    const tail = bodyWords.slice(bodyWords.length - n);
    if (slug.slice(0, n).join(' ') === tail.join(' ')) {
      overlap = n;
      break;
    }
  }
  let extra = [];
  if (overlap > 0) {
    extra = slug.slice(overlap);
  } else {
    for (let i = 0; i < slug.length; i++) {
      if (slug[i] === bodyWords[bodyWords.length - 1]) {
        extra = slug.slice(i + 1);
        break;
      }
    }
  }
  if (!extra.length) {
    // Mid-word cut: the feed sliced inside a word ("rec…") while the slug
    // kept it whole ("recs"). Recover by dropping the partial tail word and
    // splicing from the slug word it prefixes (guarded by min length so
    // stop-words like "is"/"to" never trigger it).
    const tail = bodyWords[bodyWords.length - 1];
    if (tail.length >= 3) {
      for (let i = slug.length - 1; i >= 0; i--) {
        if (slug[i].length > tail.length && slug[i].startsWith(tail)) {
          const head = bodyWords.slice(0, -1).length
            ? body.slice(0, body.toLowerCase().lastIndexOf(tail)).trimEnd()
            : '';
          return { title: head ? `${head} ${slug.slice(i).join(' ')}` : slug.slice(i).join(' '), restored: true };
        }
      }
    }
  }
  if (!extra.length) return { title: clean, restored: false };
  return { title: `${body} ${extra.join(' ')}`, restored: true };
}

/**
 * Graceful title for display: slug-restored where possible, normalized
 * ellipsis otherwise. NEVER a bare mid-word cut without its "…" marker.
 */
export function gracefulTitle(title, url) {
  const truncated = isFeedTruncated(title);
  const { title: restored } = restoreTitleFromPostUrl(title, url);
  return { text: restored, wasTruncated: truncated };
}

/**
 * Engagement Score = upvotes + comments. Null unless BOTH inputs are real
 * finite numbers — never guessed, never an error string.
 */
export function engagementScore(score, comments) {
  if (typeof score !== 'number' || typeof comments !== 'number') return null;
  if (!Number.isFinite(score) || !Number.isFinite(comments)) return null;
  return score + comments;
}

/** User-facing count: locale-formatted number, or an em dash when unknown. */
export function displayCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('en-US');
  return '—';
}

/**
 * Score cell for community tables: engagement (upvotes + comments) when both
 * are known, the lone known number when only one is, an em dash when neither
 * is. Technical transport jargon never reaches readers.
 */
export function displayScore(score, comments) {
  const engagement = engagementScore(score, comments);
  if (engagement !== null) return engagement.toLocaleString('en-US');
  if (typeof score === 'number' && Number.isFinite(score)) return score.toLocaleString('en-US');
  return '—';
}

/**
 * Guard canonical display names: trim; repair all-lowercase / all-uppercase
 * leaks into title case (a no-op for well-formed canonical names).
 */
export function normalizeDetectedName(name) {
  const s = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return s;
  const letters = s.replace(/[^a-zA-Z]/g, '');
  if (letters && (letters === letters.toLowerCase() || letters === letters.toUpperCase())) {
    return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return s;
}

/**
 * Clean detected-name list: deduped (case-insensitive + subsumption),
 * correctly capitalized, comma-separated, capped — or an em dash when empty.
 */
export function formatDetectedList(names, max) {
  if (!Array.isArray(names)) return '—';
  const out = dedupeNames(names.map((raw) => normalizeDetectedName(String(raw ?? ''))).filter(Boolean));
  return out.length ? out.slice(0, max).join(', ') : '—';
}

/** Escape a literal string for RegExp use. */
function escRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Dedupe display names: exact case-insensitive first occurrence wins, then
 * subsumption — a name fully contained (word-boundary) in a longer kept name
 * is dropped ("Retinol" ⊂ "Retinol / Retinoids", "BHA" ⊂ "Salicylic Acid
 * (BHA)"). Keeps heat tallies and table cells on one vocabulary.
 */
function dedupeNames(names) {
  const seen = new Set();
  const uniq = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(n);
    }
  }
  return uniq.filter((a, i) =>
    !uniq.some((b, j) =>
      j !== i && b.length > a.length
      && new RegExp(`(^|[^a-z0-9])${escRegExp(a)}([^a-z0-9]|$)`, 'i').test(b)
    )
  );
}

/**
 * Clean one community post in place (title restore + name normalization).
 * Runs on every analysed post BEFORE ranking/tallying/rendering, so tables,
 * heat tallies, and the JSON snapshot all read the same clean data.
 */
export function cleanCommunityPost(post) {
  if (!post || typeof post !== 'object') return post;
  const graceful = gracefulTitle(post.title || '', post.url || '');
  post.title = graceful.text;
  post.titleTruncated = graceful.wasTruncated;
  if (Array.isArray(post.ingredients)) {
    post.ingredients = dedupeNames(post.ingredients.map(normalizeDetectedName).filter(Boolean));
  }
  if (Array.isArray(post.brands)) {
    post.brands = dedupeNames(post.brands.map(normalizeDetectedName).filter(Boolean));
  }
  return post;
}

/** Clean one news headline item in place (same title rules as posts). */
export function cleanNewsItem(item) {
  if (!item || typeof item !== 'object') return item;
  const graceful = gracefulTitle(item.title || '', item.url || '');
  item.title = graceful.text;
  item.titleTruncated = graceful.wasTruncated;
  return item;
}
