/**
 * Single source of truth for the Amazon Associates tag appended to
 * amazon.com/dp/ links rendered on market-report pages.
 *
 * Verified Oct 2, 2026: matches the real Tracking ID in the owner's
 * Amazon Associates account (Store ID: beautynest202-20).
 */
export const AFFILIATE_TAG = "beautynest202-20";

/** Amazon UK Associates tag (amazon.co.uk only). Never used for .com links. */
export const AFFILIATE_TAG_UK = "beautynestkor-21";

const DP_RE = /^https:\/\/(www\.)?amazon\.com\/dp\/[A-Z0-9]+/i;
const DP_UK_RE = /^https:\/\/(www\.)?amazon\.co\.uk\/dp\/[A-Z0-9]+/i;

export function isAmazonDpLink(href: string): boolean {
  return DP_RE.test(href);
}

export function isAmazonUkDpLink(href: string): boolean {
  return DP_UK_RE.test(href);
}

/** Append ?tag=AFFILIATE_TAG_UK to Amazon UK /dp/ links (no-op if a tag is present). All other domains pass through untouched. */
export function withAmazonUkTag(href: string): string {
  if (!isAmazonUkDpLink(href)) return href;
  try {
    const url = new URL(href);
    if (!url.searchParams.has("tag")) url.searchParams.set("tag", AFFILIATE_TAG_UK);
    return url.toString();
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return href.includes("tag=") ? href : `${href}${sep}tag=${AFFILIATE_TAG_UK}`;
  }
}
/** Append ?tag=AFFILIATE_TAG to Amazon /dp/ links (no-op if a tag is present). Hrefs for all other domains pass through untouched. */
export function withAmazonTag(href: string): string {
  if (!isAmazonDpLink(href)) return href;
  try {
    const url = new URL(href);
    if (!url.searchParams.has("tag")) url.searchParams.set("tag", AFFILIATE_TAG);
    return url.toString();
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return href.includes("tag=") ? href : `${href}${sep}tag=${AFFILIATE_TAG}`;
  }
}

/** Curation/partner domains that must carry rel="sponsored" (hrefs untouched). */
export function isSponsoredCurationLink(href: string): boolean {
  return /benable\.com|c8ke\.me|sites\.google\.com/i.test(href);
}

/**
 * Affiliate outbound domains (Amazon US + UK, Olive Young, Stylevana, AWIN).
 * EVERY link to these must render target="_blank" + rel="nofollow sponsored noopener" —
 * enforced by eslint-rules/affiliate-link-attrs.mjs for literal hrefs and
 * centralized here for dynamic ones (AffiliateButtons, markdown renderers).
 * AWIN/Stylevana hrefs pass through untouched (never Amazon-tagged).
 */
export function isAffiliateDomainLink(href: string): boolean {
  return /amazon\.com|amazon\.co\.uk|oliveyoung\.com|stylevana\.com|awin1\.com/i.test(href);
}
