/**
 * Dynamic Footer data layer — Hybrid A+B.
 *
 * PERFORMANCE LOCK (non-negotiable):
 * - This module MUST NEVER import `cookies()`, `headers()`, or
 *   `@/lib/supabase/server` (session client). It uses ONLY the
 *   cookie-free public REST fetch below, so Footer/RootLayout stay
 *   in Full Route Cache / ISR.
 * - Cache: `next: { revalidate: 86400, tags: [FOOTER_CACHE_TAG] }`
 *   → 0ms on hit, one ~2-5KB fetch per 24h per region on miss.
 *
 * SAFETY (non-negotiable):
 * - `getFooterLinks()` NEVER throws. Every failure path (timeout,
 *   500, empty, malformed, validation fail) returns DEFAULT_FOOTER
 *   instantly with zero visual glitch.
 * - `DEFAULT_FOOTER` is a byte-for-byte copy of the hardcoded links
 *   in `src/components/Footer.tsx` before dynamism (SEO baseline).
 */

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterData {
  tagline: string;
  disclosure: string;
  shop: FooterLink[];
  learn: FooterLink[];
  company: FooterLink[];
  socials: FooterLink[];
}

export const FOOTER_SETTINGS_KEY = "footer-v1";
export const FOOTER_CACHE_TAG = "footer-settings";

/** Frozen SEO baseline — today's hardcoded footer. Never mutate at runtime. */
export const DEFAULT_FOOTER: FooterData = {
  tagline:
    "Honest, curated K-beauty & global skincare recommendations. We compare Amazon and Olive Young so you always get the best price.",
  disclosure:
    "Affiliate disclosure: we may earn a commission when you buy through our links — at no extra cost to you. This supports our independent reviews.",
  shop: [
    { label: "Home", href: "/" },
    { label: "All products", href: "/shop" },
    { label: "Acne care", href: "/shop?concern=Acne" },
    { label: "Anti-aging", href: "/shop?concern=Anti-aging" },
    { label: "Hydration", href: "/shop?concern=Hydration" },
  ],
  learn: [
    { label: "Skincare advice", href: "/advice" },
    { label: "Beginner routine", href: "/advice/10-step-korean-routine-beginners" },
    { label: "Market report", href: "/market-report" },
    { label: "Report archive", href: "/market-report/archive" },
    { label: "Image optimizer", href: "/tools/image-optimizer" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "How we review", href: "/how-we-review" },
    { label: "Contact us", href: "/contact" },
    { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
    { label: "Privacy policy", href: "/privacy" },
  ],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/mohamed.mosbeh.508798/" },
    { label: "Instagram", href: "https://www.instagram.com/beautynest_k_beauty_expert/" },
    { label: "Pinterest", href: "https://fr.pinterest.com/beautynest_skincare/" },
    { label: "Benable", href: "https://benable.com/BeautyNest2026" },
    { label: "Short links", href: "https://c8ke.me/beautynestkorea" },
    { label: "Google Sites", href: "https://sites.google.com/view/beautynestskincare/kbeauty-serums" },
    { label: "Email", href: "mailto:mohamedmosbeh255@gmail.com" },
  ],
};

/**
 * URLs that are indexed / in sitemap.ts. Deleting or renaming these
 * weakens internal linking — the Admin UI shows a warning (SEO protection).
 */
export const INDEXED_FOOTER_URLS: ReadonlySet<string> = new Set([
  "/",
  "/shop",
  "/advice",
  "/market-report",
  "/market-report/archive",
  "/tools/image-optimizer",
  "/about",
  "/contact",
  "/privacy",
  "/disclosure",
  "/affiliate-disclosure",
  "/how-we-review",
]);

const SAFE_INTERNAL_RE = /^\/[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/i;

/**
 * Allowlist validation (SEO protection).
 * - Columns shop/learn/company: INTERNAL links only (must start with "/",
 *   safe chars, max 200 chars). External URLs are rejected — they would
 *   leak link equity and break sitemap consistency.
 * - Column socials: external https:// or mailto: only.
 */
export function isAllowedFooterHref(href: string, column: "shop" | "learn" | "company" | "socials"): boolean {
  const v = String(href ?? "").trim();
  if (!v || v.length > 500) return false;
  if (column === "socials") {
    return v.startsWith("https://") || v.startsWith("mailto:");
  }
  if (!v.startsWith("/")) return false;
  if (v.length > 200) return false;
  if (v.includes(" ") || v.includes("\\") || v.includes("<") || v.includes(">") || v.includes('"')) return false;
  return SAFE_INTERNAL_RE.test(v);
}

function sanitizeLink(raw: unknown, column: "shop" | "learn" | "company" | "socials"): FooterLink | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const label = String(r.label ?? "").trim().slice(0, 60);
  const href = String(r.href ?? "").trim();
  if (!label || !href) return null;
  if (!isAllowedFooterHref(href, column)) return null;
  return { label, href };
}

function sanitizeList(raw: unknown, column: "shop" | "learn" | "company" | "socials", fallback: FooterLink[]): FooterLink[] {
  if (!Array.isArray(raw)) return fallback;
  const clean = raw
    .map((item) => sanitizeLink(item, column))
    .filter((l): l is FooterLink => l !== null)
    .slice(0, 8);
  // Never allow an emptied column (internal-link loss = SEO damage) —
  // fall back to the frozen defaults for that column.
  if (clean.length === 0) return fallback;
  return clean;
}

/** Validate + sanitize a DB payload. Returns null when unusable → caller uses DEFAULT_FOOTER. */
export function sanitizeFooterData(raw: unknown): FooterData | null {
  try {
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    return {
      tagline:
        typeof r.tagline === "string" && r.tagline.trim()
          ? r.tagline.trim().slice(0, 500)
          : DEFAULT_FOOTER.tagline,
      disclosure:
        typeof r.disclosure === "string" && r.disclosure.trim()
          ? r.disclosure.trim().slice(0, 500)
          : DEFAULT_FOOTER.disclosure,
      shop: sanitizeList(r.shop, "shop", DEFAULT_FOOTER.shop),
      learn: sanitizeList(r.learn, "learn", DEFAULT_FOOTER.learn),
      company: sanitizeList(r.company, "company", DEFAULT_FOOTER.company),
      socials: sanitizeList(r.socials, "socials", DEFAULT_FOOTER.socials),
    };
  } catch {
    return null;
  }
}

/**
 * Cookie-free cached read. NEVER throws — returns DEFAULT_FOOTER on any
 * failure (timeout, 500, empty, malformed). Uses only NEXT_PUBLIC env
 * vars so it never opts the consumer out of static/ISR caching.
 */
export async function getFooterLinks(): Promise<FooterData> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return DEFAULT_FOOTER;

    const res = await fetch(
      `${url}/rest/v1/site_settings?select=value&key=eq.${FOOTER_SETTINGS_KEY}`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        // 24h ISR cache + stable tag for on-demand purge on Admin save.
        // Stable key (no per-request params) → no fragmentation, no stampede
        // (Next coalesces concurrent misses into one upstream fetch).
        next: { revalidate: 86400, tags: [FOOTER_CACHE_TAG] },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return DEFAULT_FOOTER;

    const rows = (await res.json()) as Array<{ value?: unknown }>;
    const raw = Array.isArray(rows) && rows.length > 0 ? rows[0]?.value : null;
    if (!raw) return DEFAULT_FOOTER;

    return sanitizeFooterData(raw) ?? DEFAULT_FOOTER;
  } catch {
    // Timeout / network / JSON error → instant invisible fallback.
    return DEFAULT_FOOTER;
  }
}
