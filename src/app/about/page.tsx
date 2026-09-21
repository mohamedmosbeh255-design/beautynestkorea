import type { Metadata } from "next";
import Link from "next/link";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "About BeautyNestKorea",
  description:
    "Who runs BeautyNestKorea, how products and prices are checked, and our mission for honest K-beauty guidance.",
  alternates: { canonical: `${siteBaseUrl()}/about` },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Our story</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">
        About BeautyNestKorea
      </h1>
      {/* AUTHOR_PENDING */}
      <p className="mt-3 text-sm text-ink-soft">Written by the site editor — full name to be added.</p>

      <div className="glass mt-8 rounded-[2rem] p-8 sm:p-12">
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          <p>
            BeautyNestKorea is an independent K-beauty publication. We research
            formulations, compare retailer prices, and publish educational
            skincare guides — no paid placements decide what we recommend.
          </p>
          <p>
            How products are checked: every product we list is verified against
            live retailer listings on Amazon and Olive Young, and key details
            (price, size, availability) are re-checked on a monthly cycle. When
            a price carries a check date on this site, that date reflects a real
            verification — never an edit timestamp. If we have not verified a
            price, we hide it rather than show a stale number.
          </p>
          <p>
            How prices are checked: we record the retailer, the listed price,
            and the per-millilitre cost where sizes differ, so you can compare
            like for like. Prices rotate with sales, so always confirm the live
            retailer price before buying — what you see here may have changed.
          </p>
          <p>
            Our mission is simple: help every skin type build a minimal routine
            that actually sticks, with honest ingredient callouts and realistic
            expectations. Content here is educational only and never medical
            advice — patch-test new products and see a dermatologist for
            persistent or concerning issues.
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/" className="font-semibold text-sage-700 hover:underline">
          Back to home
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="font-semibold text-sage-700 hover:underline">
          Privacy policy
        </Link>{" "}
        ·{" "}
        <Link href="/affiliate-disclosure" className="font-semibold text-sage-700 hover:underline">
          Affiliate disclosure
        </Link>
      </p>
    </div>
  );
}
