import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, FlaskConical, Scale, RefreshCcw, HeartHandshake } from "lucide-react";
import { siteBaseUrl } from "@/lib/market-report";
import { breadcrumbJsonLd } from "@/lib/schema";

const TITLE = "How We Review — Our Curation Process";
const DESCRIPTION =
  "How BeautyNestKorea picks products: ingredient-first screening, skin-type fit, verified price checks, and a strict no-pay-for-placement rule.";

/**
 * Trust page (B3): the editorial process in plain language. WHY it exists:
 * readers deserve to know paid placement is impossible here. No product data,
 * routes, or affiliate mechanics are touched — pure editorial content with a
 * canonical + breadcrumb schema like every other static page.
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteBaseUrl()}/how-we-review` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const STEPS = [
  {
    Icon: FlaskConical,
    title: "1. Ingredients first",
    body: "We read the active-ingredient list before anything else — proven actives (retinoids, niacinamide, ceramides, chemical filters) at sensible positions, no fragrance red flags for sensitive picks. Marketing copy never counts as evidence.",
  },
  {
    Icon: HeartHandshake,
    title: "2. Skin-type & concern fit",
    body: "Every pick is matched to skin types and concerns (dry, oily, acne-prone, hyperpigmentation…). A great formula for the wrong skin type is a bad recommendation, so fit decides placement.",
  },
  {
    Icon: Scale,
    title: "3. Amazon vs Olive Young on price",
    body: "We compare both retailers so you can pick the cheaper, faster option. Prices rotate with sales — always confirm the live checkout total before buying.",
  },
  {
    Icon: RefreshCcw,
    title: "4. Re-checked, not set-and-forget",
    body: "Listings drift: prices, shades, and formulations change. We re-verify catalog prices on a rolling basis and only stamp a price block once a human has confirmed it.",
  },
  {
    Icon: BadgeCheck,
    title: "5. No pay-for-placement, ever",
    body: "Brands cannot buy a card, a ranking, or a review. When you buy through our links we may earn a commission at no extra cost to you — that is the entire business model, disclosed on every page carrying buying options.",
  },
];

export default function HowWeReviewPage() {
  const base = siteBaseUrl();
  const jsonLd = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: "How We Review", path: "/how-we-review" },
  ]);
  return (
    <div className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Trust & process</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How we review</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">
        Five rules decide everything on this site. Short version: ingredients first, fit second, price
        always compared — and nobody can pay for placement.
      </p>
      <div className="mt-8 grid gap-4">
        {STEPS.map(({ Icon, title, body }) => (
          <section key={title} className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Icon className="h-5 w-5 shrink-0 text-sage-600" aria-hidden="true" /> {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-soft">
        Questions about a pick? <Link href="/contact" className="font-semibold text-sage-700 hover:underline">Contact us</Link> —{" "}
        <Link href="/affiliate-disclosure" className="font-semibold text-sage-700 hover:underline">
          read the full affiliate disclosure
        </Link>
        .
      </p>
    </div>
  );
}
