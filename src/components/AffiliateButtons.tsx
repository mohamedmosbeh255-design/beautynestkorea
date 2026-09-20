"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { withAmazonTag } from "@/lib/affiliates";

export default function AffiliateButtons({
  productId,
  amazonUrl,
  amazonAsin,
  oliveyoungUrl,
  title,
  stackButtons = false,
}: {
  productId: string;
  amazonUrl?: string | null;
  amazonAsin?: string | null;
  oliveyoungUrl?: string | null;
  title: string;
  /** Advice embeds only: stack both buttons vertically, full-width, single-line labels. */
  stackButtons?: boolean;
}) {
  const track = (source: "amazon" | "oliveyoung") => {
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

  if (!amazonHref && !oliveyoungUrl) return null;

  const both = Boolean(amazonHref && oliveyoungUrl);
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
          rel="sponsored noopener noreferrer"
          onClick={() => track("oliveyoung")}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sage-600 bg-sage-50 px-6 py-4 text-sm font-bold text-sage-700 transition hover:bg-sage-100${stacked ? " w-full whitespace-nowrap" : ""}`}
          aria-label={`View ${title} on Olive Young`}
        >
          <ShoppingCart className="h-5 w-5" /> View on Olive Young <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
