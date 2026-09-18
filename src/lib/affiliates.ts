/**
 * Single source of truth for the Amazon Associates tag appended to
 * amazon.com/dp/ links rendered on market-report pages.
 *
 * TODO: replace with your real Associates tag (e.g. "yourstore-20").
 * Until then the placeholder below attributes nothing — update it before
 * relying on market-report links to earn.
 */
export const AFFILIATE_TAG = "beautynest202-20";

const DP_RE = /^https:\/\/(www\.)?amazon\.com\/dp\/[A-Z0-9]+/i;

export function isAmazonDpLink(href: string): boolean {
  return DP_RE.test(href);
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
