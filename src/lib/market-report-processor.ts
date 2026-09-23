/**
 * Market Report Data Processing Pipeline — fetch/render-time cleaning layer.
 *
 * Systemic fix for display issues that used to leak raw ingestion artifacts
 * into the UI (feed-truncated titles, "n/a (RSS transport)" jargon, ragged
 * detected-name lists). Runs automatically inside getLatestReport() /
 * getReportByDate() in ./market-report, so EVERY report — historical files
 * already committed AND future ones — renders clean by default.
 *
 * Twin module: tools/market-report/src/lib/processor.mjs applies the SAME
 * rules at generation time (zero-dependency JS runtime), so newly written
 * report files are clean at rest and this layer becomes a no-op safety net.
 * The two files cannot share code (the generator runs dependency-free in CI);
 * keep their behavior in sync when either changes.
 *
 * Pure functions only. No I/O, no network, no dependencies.
 */

/** A community post as stored in a report snapshot's `communityPosts`. */
export interface CommunityPostAux {
  url: string;
  title: string;
  score: number | null;
  comments: number | null;
}

/** Auxiliary full-fidelity data a report snapshot may carry. */
export interface ReportAux {
  newsHeadlines?: string[];
  communityPosts?: CommunityPostAux[];
}

const ELLIPSIS = "…";

/** True when a feed title was cut off upstream (Unicode or ASCII ellipsis tail). */
export function isFeedTruncated(title: string): boolean {
  return /(…|\.{3})\s*["')\]]?\s*$/.test(String(title ?? "").trimEnd());
}

/** Collapse whitespace; normalize a trailing "..." to a single "…". */
export function normalizeTitleText(title: string): string {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.{3}\s*$/, ELLIPSIS);
}

/** Lowercase slug words from a post URL (Reddit permalinks embed the title). */
function slugWords(url: string): string[] {
  try {
    const path = new URL(String(url)).pathname.toLowerCase();
    const slug = path.split("/").filter(Boolean).pop() ?? "";
    return slug.split(/[^a-z0-9]+/).filter(Boolean);
  } catch {
    return [];
  }
}

function wordList(s: string): string[] {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
}

/**
 * Best-effort title restoration from the post URL slug — no network needed.
 * Reddit truncates feed titles AND slugs independently, so when the slug runs
 * past the truncated title tail its extra words are spliced back on.
 * Returns the original title untouched when the slug adds nothing.
 */
export function restoreTitleFromPostUrl(title: string, url: string): { title: string; restored: boolean } {
  const clean = normalizeTitleText(title);
  if (!isFeedTruncated(clean)) return { title: clean, restored: false };
  const slug = slugWords(url);
  if (slug.length === 0) return { title: clean, restored: false };

  const body = clean.replace(/(…|\.{3})\s*["')\]]?\s*$/, "").trimEnd();
  const bodyWords = wordList(body);
  if (bodyWords.length === 0) return { title: clean, restored: false };

  // Longest suffix of the slug that overlaps the title tail; anything after
  // the overlap is genuinely new content from the URL.
  let overlap = 0;
  const maxOverlap = Math.min(slug.length, bodyWords.length);
  for (let n = maxOverlap; n > 0; n--) {
    const tail = bodyWords.slice(bodyWords.length - n);
    if (slug.slice(0, n).join(" ") === tail.join(" ")) {
      overlap = n;
      break;
    }
  }
  // Also try aligning the slug anywhere inside the tail (slug may start
  // earlier than the overlap window, e.g. stop-word heavy titles).
  let extra: string[] = [];
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
  if (extra.length === 0) {
    // Mid-word cut: the feed sliced inside a word ("rec…") while the slug
    // kept it whole ("recs"). Recover by dropping the partial tail word and
    // splicing from the slug word it prefixes (min-length guard so
    // stop-words never trigger it).
    const tail = bodyWords[bodyWords.length - 1];
    if (tail.length >= 3) {
      for (let i = slug.length - 1; i >= 0; i--) {
        if (slug[i].length > tail.length && slug[i].startsWith(tail)) {
          const head = body.replace(new RegExp(`${escRegExp(tail)}\\s*$`, "i"), "").trimEnd();
          const rest = slug.slice(i).join(" ");
          return { title: head ? `${head} ${rest}` : rest, restored: true };
        }
      }
    }
  }
  if (extra.length === 0) return { title: clean, restored: false };
  return { title: `${body} ${extra.join(" ")}`, restored: true };
}

/**
 * Graceful title for display: slug-restored where possible, normalized
 * ellipsis otherwise. NEVER returns a bare mid-word cut — a truncated title
 * keeps its "…" marker (honest) and stays linked to the source post, where
 * the UI adds the full-text tooltip + expand control.
 */
export function gracefulTitle(title: string, url: string): { text: string; wasTruncated: boolean } {
  const truncated = isFeedTruncated(title);
  const { title: restored } = restoreTitleFromPostUrl(title, url);
  return { text: restored, wasTruncated: truncated };
}

/**
 * Engagement Score = upvotes + comments. Null unless BOTH inputs are real
 * finite numbers — never guessed, never an error string.
 */
export function engagementScore(score: unknown, comments: unknown): number | null {
  if (typeof score !== "number" || typeof comments !== "number") return null;
  if (!Number.isFinite(score) || !Number.isFinite(comments)) return null;
  return score + comments;
}

/** User-facing count: locale-formatted number, or an em dash when unknown. */
export function displayCount(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return value.toLocaleString("en-US");
  return "—";
}

/**
 * Score cell for community tables: engagement (upvotes + comments) when both
 * are known, the lone known number when only one is, an em dash when neither
 * is. Technical transport jargon ("n/a (RSS transport)") never reaches users.
 */
export function displayScore(score: unknown, comments: unknown): string {
  const engagement = engagementScore(score, comments);
  if (engagement !== null) return engagement.toLocaleString("en-US");
  if (typeof score === "number" && Number.isFinite(score)) return score.toLocaleString("en-US");
  return "—";
}

/**
 * Guard canonical display names: trim; repair all-lowercase / all-uppercase
 * leaks into title case (canonical maps already ship display-cased names, so
 * this is a no-op for well-formed input).
 */
export function normalizeDetectedName(name: string): string {
  const s = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!s) return s;
  const letters = s.replace(/[^a-zA-Z]/g, "");
  if (letters && (letters === letters.toLowerCase() || letters === letters.toUpperCase())) {
    return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return s;
}

/** Escape a literal string for RegExp use. */
function escRegExp(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Dedupe display names: exact case-insensitive first occurrence wins, then
 * subsumption — a name fully contained (word-boundary) in a longer kept name
 * is dropped ("Retinol" ⊂ "Retinol / Retinoids"). Keeps table cells on one
 * vocabulary.
 */
function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(n);
    }
  }
  return uniq.filter((a, i) =>
    !uniq.some(
      (b, j) =>
        j !== i &&
        b.length > a.length &&
        new RegExp(`(^|[^a-z0-9])${escRegExp(a)}([^a-z0-9]|$)`, "i").test(b)
    )
  );
}

/**
 * Clean "Ingredients detected" / "Brands detected" cell: deduped
 * (case-insensitive + subsumption), correctly capitalized, comma-separated —
 * or an em dash when nothing was detected. Never a raw array, never empty.
 */
export function formatDetectedList(names: unknown, max: number): string {
  if (!Array.isArray(names)) return "—";
  const cleaned = names
    .map((raw) => normalizeDetectedName(String(raw ?? "")))
    .filter((n) => n !== "");
  const out = dedupeNames(cleaned).slice(0, max);
  return out.length > 0 ? out.join(", ") : "—";
}

/** Split a markdown table line on UNESCAPED pipes (titles may contain `\|`). */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const ch of line) {
    if (escaped) {
      current += ch;
      escaped = false;
    } else if (ch === "\\") {
      current += ch;
      escaped = true;
    } else if (ch === "|") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  // Drop the empty fringes outside the leading/trailing pipes.
  if (cells.length > 0 && cells[0].trim() === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1].trim() === "") cells.pop();
  return cells.map((c) => c.trim());
}

/** Parse `[text](target)` — returns null when the cell is not a link. */
function parseCellLink(cellText: string): { text: string; target: string } | null {
  const m = /^\[([\s\S]*)\]\((\S+?)\)$/.exec(cellText.trim());
  return m ? { text: m[1], target: m[2] } : null;
}

/** A cell is transport jargon when it carries the old RSS error strings. */
function isTransportJargon(cellText: string): boolean {
  return /^\s*n\/a(\s*\(.*\))?\s*$/i.test(cellText);
}

function restoreHeadlineFromSnapshot(truncated: string, fullTitles: string[]): string | null {
  const prefix = normalizeTitleText(truncated).replace(/(…|\.{3})\s*["')\]]?\s*$/, "").trim();
  if (prefix.length < 12) return null;
  const matches = fullTitles.filter(
    (full) => full.toLowerCase().startsWith(prefix.toLowerCase()) && full.length > truncated.length
  );
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Repair a stored report's markdown in place (historical files included):
 * - Top-posts rows: titles restored via snapshot URL match, else URL-slug
 *   splice, else normalized ellipsis; score/comment jargon → "—";
 *   detected lists normalized (caps, commas, dedupe).
 * - Headline rows + Lead-story line: truncated headlines restored from the
 *   snapshot's full `newsHeadlines` (prefix match); else normalized.
 * Unknown shapes pass through byte-identical — this function never invents
 * data and never drops rows.
 */
export function cleanReportMarkdown(markdown: string, aux: ReportAux = {}): string {
  const postByUrl = new Map<string, CommunityPostAux>();
  for (const p of aux.communityPosts ?? []) {
    if (p && typeof p.url === "string" && p.url) postByUrl.set(p.url, p);
  }
  const headlines = (aux.newsHeadlines ?? []).filter((h) => typeof h === "string" && h.trim());

  // Legacy methodology sentence (baked into reports written before the
  // pipeline) describes score cells that no longer exist. Refresh its stale
  // clause so old editions don't contradict their own cleaned tables.
  const cleaned = String(markdown ?? "").replace(
    'which is why score/comments read "n/a (RSS transport)" on fallback rows.',
    'Score shows engagement (upvotes + comments) where Reddit shares both counts; "—" means Reddit shared no counts for that row.'
  );

  const lines = cleaned.split("\n");
  let table: "posts" | "headlines" | null = null;

  const cleanPostsRow = (cells: string[]): string[] => {
    // [#, Title(link), Sub, Ingredients, Brands, Score, Comments]
    if (cells.length < 7) return cells;
    const link = parseCellLink(cells[1]);
    if (link) {
      const snap = postByUrl.get(link.target);
      let text: string;
      if (snap && snap.title && !isFeedTruncated(snap.title)) {
        text = normalizeTitleText(snap.title);
      } else if (snap && snap.title) {
        text = gracefulTitle(snap.title, link.target).text;
      } else {
        text = gracefulTitle(link.text, link.target).text;
      }
      cells[1] = `[${text}](${link.target})`;
    }
    cells[3] = formatDetectedList(cells[3].split(","), 4);
    cells[4] = formatDetectedList(cells[4].split(","), 3);
    if (isTransportJargon(cells[5])) cells[5] = "—";
    if (isTransportJargon(cells[6])) cells[6] = "—";
    return cells;
  };

  const cleanHeadlineRow = (cells: string[]): string[] => {
    // [#, Headline, Publisher, Published, Matched on]
    if (cells.length < 5) return cells;
    const text = cells[1].trim();
    if (text && text !== "—") {
      const restored = restoreHeadlineFromSnapshot(text, headlines);
      cells[1] = restored ?? normalizeTitleText(text);
    }
    return cells;
  };

  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      const cells = splitRow(trimmed);
      const head = cells.map((c) => c.toLowerCase());
      if (head.includes("title") && head.includes("ingredients detected")) {
        table = "posts";
        return line;
      }
      if (head.includes("headline") && head.includes("matched on")) {
        table = "headlines";
        return line;
      }
      if (/^---+$/.test(cells[0]) || cells.every((c) => /^:?-+:?$/.test(c))) return line;
      if (table === "posts" && cells.length >= 7 && /^\d+$/.test(cells[0])) {
        return `| ${cleanPostsRow(cells).join(" | ")} |`;
      }
      if (table === "headlines" && cells.length >= 5 && /^\d+$/.test(cells[0])) {
        return `| ${cleanHeadlineRow(cells).join(" | ")} |`;
      }
      return line;
    }
    table = null;
    // Lead-story prose line carries the same truncated headline as row #1.
    const lead = /^(\*\*Lead story:\*\* \[)([\s\S]*)\]\((\S+?)\)(.*)$/.exec(trimmed);
    if (lead && headlines.length > 0) {
      const restored = restoreHeadlineFromSnapshot(lead[2], headlines);
      if (restored) return line.replace(lead[2], restored);
    }
    return line;
  });

  return out.join("\n");
}
