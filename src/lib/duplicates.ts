/** Duplicate-product detection for the Admin Panel.
 *
 * Blocks SEO cannibalization / DB pollution by catching:
 *  a. Exact affiliate-link matches (Amazon or Olive Young, normalized)
 *  b. Exact ASIN matches (stored column OR derived from a full Amazon URL)
 *  c. High-similarity titles (fuzzy match: normalized Levenshtein + token overlap)
 *
 * Pure functions (no I/O) so they can be unit-tested and shared between the
 * client pre-save check and the server-side enforcement in `lib/actions.ts`.
 */

export interface DuplicateCandidate {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  amazon_url?: string | null;
  amazon_asin?: string | null;
  oliveyoung_url?: string | null;
}

export type DuplicateReason =
  | "amazon_url"
  | "oliveyoung_url"
  | "asin"
  | "slug"
  | "similar_title";

export interface DuplicateMatch {
  product: DuplicateCandidate;
  reasons: DuplicateReason[];
  /** 0..1 — only meaningful for similar_title; 1 for exact matches. */
  similarity: number;
}

export const REASON_LABELS: Record<DuplicateReason, string> = {
  amazon_url: "Same Amazon affiliate link",
  oliveyoung_url: "Same Olive Young affiliate link",
  asin: "Same Amazon ASIN",
  slug: "Same URL slug",
  similar_title: "Very similar title",
};

/** Titles at/above this similarity are treated as duplicates. */
export const TITLE_SIMILARITY_THRESHOLD = 0.85;

/** Normalize an affiliate URL for comparison: trim, lowercase host, strip
 *  tracking params (tag, linkCode, etc.), drop trailing slash & fragment. */
export function normalizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    // Drop affiliate/analytics-only params; keep product-identifying ones
    // (e.g. Olive Young goodsNo / query ids) so distinct variants don't collide.
    const TRACKING = new Set([
      "tag", "linkcode", "link_code", "camp", "creative", "creativeasin",
      "asc", "th", "psc", "ref", "ref_", "utm_source", "utm_medium",
      "utm_campaign", "utm_term", "utm_content", "_encoding",
    ]);
    const params = new URLSearchParams();
    u.searchParams.forEach((v, k) => {
      if (!TRACKING.has(k) && !k.toLowerCase().startsWith("utm_")) params.append(k, v);
    });
    params.sort();
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const query = params.toString();
    return `${u.protocol}//${host}${path}${query ? `?${query}` : ""}`.toLowerCase();
  } catch {
    // Non-absolute or malformed input: compare trimmed lowercase as fallback.
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}

/** Upper-case bare ASIN from a stored column or a full Amazon URL. */
export function extractAsin(asin?: string | null, amazonUrl?: string | null): string | null {
  const direct = String(asin ?? "").trim().toUpperCase();
  if (/^B0[0-9A-Z]{8}$/.test(direct)) return direct;
  if (amazonUrl) {
    const m = String(amazonUrl).match(/(?:\/dp\/|\/gp\/product\/)(B0[0-9A-Z]{8})\b/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** Lowercase, strip punctuation/extra spaces + common size suffixes for comparison. */
export function normalizeTitle(title?: string | null): string {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(\d+\s?(ml|g|oz|fl\s?oz|count|pack|pcs))\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let cur = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

/** 0..1 string similarity (1 = identical). */
export function titleSimilarity(a?: string | null, b?: string | null): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // One contains the other (e.g. size suffix added) → near-duplicate.
  if (na.includes(nb) || nb.includes(na)) {
    const short = Math.min(na.length, nb.length);
    const long = Math.max(na.length, nb.length);
    return 0.9 + (0.1 * short) / long;
  }
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  const charScore = 1 - dist / maxLen;
  // Token-overlap (Jaccard) guards against word-reorder duplicates.
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter++;
  });
  const jaccard = inter / (ta.size + tb.size - inter || 1);
  return Math.max(charScore, jaccard * 0.99);
}

export interface NewProductInput {
  title?: string | null;
  slug?: string | null;
  amazon_url?: string | null;
  amazon_asin?: string | null;
  oliveyoung_url?: string | null;
}

/** Compare a new/edited product against existing rows (self excluded by caller).
 *  Returns matches ordered: exact (URL/ASIN/slug) first, then similar titles. */
export function findDuplicates(
  input: NewProductInput,
  existing: DuplicateCandidate[]
): DuplicateMatch[] {
  const normAmazon = normalizeUrl(input.amazon_url);
  const normOlive = normalizeUrl(input.oliveyoung_url);
  const asin = extractAsin(input.amazon_asin, input.amazon_url);
  const slug = String(input.slug ?? "").trim().toLowerCase();

  const matches: DuplicateMatch[] = [];

  for (const p of existing) {
    const reasons: DuplicateReason[] = [];
    let similarity = 0;

    if (normAmazon && normalizeUrl(p.amazon_url) === normAmazon) reasons.push("amazon_url");
    if (normOlive && normalizeUrl(p.oliveyoung_url) === normOlive) reasons.push("oliveyoung_url");

    const pAsin = extractAsin(p.amazon_asin, p.amazon_url);
    if (asin && pAsin && asin === pAsin) {
      if (!reasons.includes("asin")) reasons.push("asin");
    }

    if (slug && String(p.slug ?? "").trim().toLowerCase() === slug) reasons.push("slug");

    if (reasons.length > 0) {
      matches.push({ product: p, reasons, similarity: 1 });
      continue;
    }

    similarity = titleSimilarity(input.title, p.title);
    if (similarity >= TITLE_SIMILARITY_THRESHOLD) {
      matches.push({ product: p, reasons: ["similar_title"], similarity });
    }
  }

  matches.sort((a, b) => {
    const aExact = a.reasons.some((r) => r !== "similar_title") ? 0 : 1;
    const bExact = b.reasons.some((r) => r !== "similar_title") ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return b.similarity - a.similarity;
  });
  return matches;
}

/** Human-readable one-liner for server-action errors / logs. */
export function describeMatches(matches: DuplicateMatch[]): string {
  return matches
    .map(
      (m) =>
        `“${m.product.title}” (/${m.product.slug}) — ${m.reasons
          .map((r) => REASON_LABELS[r])
          .join(", ")}`
    )
    .join("; ");
}
