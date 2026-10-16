"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { withAmazonTag, withAmazonUkTag } from "@/lib/affiliates";
import { trackAffiliateClick } from "@/lib/analytics";

export default function AffiliateButtons({
  productId,
  productSlug = "",
  amazonUrl,
  amazonAsin,
  amazonUkUrl,
  amazonUkAsin,
  stylevanaUrl,
  oliveyoungUrl,
  title,
  stackButtons = false,
}: {
  productId: string;
  productSlug?: string;
  amazonUrl?: string | null;
  amazonAsin?: string | null;
  amazonUkUrl?: string | null;
  amazonUkAsin?: string | null;
  stylevanaUrl?: string | null;
  oliveyoungUrl?: string | null;
  title: string;
  /** Advice embeds only: stack both buttons vertically, full-width, single-line labels. */
  stackButtons?: boolean;
}) {
  const track = (source: "amazon" | "oliveyoung" | "amazon_uk" | "stylevana") => {
    // GA4 first (beacon transport survives the navigation), then the
    // first-party click log. Neither may block or break the outbound link.
    trackAffiliateClick({ retailer: source, product_slug: productSlug });
    try {
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, source }),
      }).catch(() => {
        // ignore
      });
    } catch {
      // ignore
    }
  };

  // href priority: effective ASIN (stored column, else derived from a full
  // Amazon URL via the same regex as lib/products.ts) → tagged dp link.
  // Else the stored amazon_url passes through withAmazonTag (identity for
  // short links and non-dp URLs — never rewritten); empty → no button.
  const asinMatch = typeof amazonUrl === "string"
    ? amazonUrl.match(/(?:\/dp\/|\/gp\/product\/)(B0[0-9A-Z]{8})\b/)
    : null;
  const effectiveAsin = (typeof amazonAsin === "string" && amazonAsin.trim() !== "")
    ? amazonAsin.trim()
    : asinMatch
      ? asinMatch[1]
      : null;
  const amazonHref = effectiveAsin
    ? withAmazonTag(`https://www.amazon.com/dp/${effectiveAsin}`)
    : typeof amazonUrl === "string" && amazonUrl !== ""
      ? withAmazonTag(amazonUrl)
      : null;

  // Amazon UK: stored UK ASIN first, else derived from a full amazon.co.uk
  // URL — mirroring the US effective-ASIN behavior. Rebuilds a clean tagged
  // dp link with the UK tag. Non-dp URLs pass through withAmazonUkTag
  // (identity unless already a UK dp link); empty → no button.
  // The UK tag (beautynestkor-21) is never applied to .com links.
  const ukAsinMatch = typeof amazonUkUrl === "string"
    ? amazonUkUrl.match(/(?:\/dp\/|\/gp\/product\/)(B0[0-9A-Z]{8})\b/)
    : null;
  const ukAsin = (typeof amazonUkAsin === "string" && amazonUkAsin.trim() !== "")
    ? amazonUkAsin.trim()
    : ukAsinMatch
      ? ukAsinMatch[1]
      : null;
  const amazonUkHref = ukAsin
    ? withAmazonUkTag(`https://www.amazon.co.uk/dp/${ukAsin}`)
    : typeof amazonUkUrl === "string" && amazonUkUrl !== ""
      ? withAmazonUkTag(amazonUkUrl)
      : null;

  // Stylevana (AWIN redirect): pass through untouched — never Amazon-tagged.
  const stylevanaHref = typeof stylevanaUrl === "string" && stylevanaUrl !== "" ? stylevanaUrl : null;

  if (!amazonHref && !oliveyoungUrl && !amazonUkHref && !stylevanaHref) return null;

  const visibleCount = [amazonHref, oliveyoungUrl, amazonUkHref, stylevanaHref].filter(Boolean).length;
  const both = visibleCount >= 2;
  // Stacked mode applies ONLY when both buttons render; every other case
  // keeps its exact existing classes (single-button cards unchanged).
  const stacked = stackButtons && both;

  return (
    <div className={stacked ? "grid gap-3 grid-cols-1" : both ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 grid-cols-1"}>
      {amazonHref ? (
        <a
          href={amazonHref}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={() => track("amazon")}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9900] px-6 py-4 text-sm font-bold text-black shadow-lg shadow-orange-200 transition hover:brightness-95${stacked ? " w-full whitespace-nowrap" : ""}`}
          aria-label={`View ${title} on Amazon`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Amazon <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {oliveyoungUrl ? (
        <a
          href={oliveyoungUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={() => track("oliveyoung")}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sage-600 bg-sage-50 px-6 py-4 text-sm font-bold text-sage-700 transition hover:bg-sage-100${stacked ? " w-full whitespace-nowrap" : ""}`}
          aria-label={`View ${title} on Olive Young`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Olive Young <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {amazonUkHref ? (
        <a
          href={amazonUkHref}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={() => track("amazon_uk")}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sage-600 bg-sage-50 px-6 py-4 text-sm font-bold text-sage-700 transition hover:bg-sage-100${stacked ? " w-full whitespace-nowrap" : ""}`}
          aria-label={`View ${title} on Amazon UK`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Amazon UK <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {stylevanaHref ? (
        <a
          href={stylevanaHref}
          target="_blank"
          rel="nofollow sponsored noopener"
          onClick={() => track("stylevana")}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sage-600 bg-sage-50 px-6 py-4 text-sm font-bold text-sage-700 transition hover:bg-sage-100${stacked ? " w-full whitespace-nowrap" : ""}`}
          aria-label={`View ${title} on Stylevana`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Stylevana <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
