import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "About the Author — BeautyNestKorea",
  description: "Curated K-Beauty recommendations with daily market intelligence.",
  alternates: { canonical: `${siteBaseUrl()}/author` },
};

export default function AuthorPage() {
  const base = siteBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BeautyNestKorea",
    url: base,
    description: "Curated K-Beauty recommendations with daily market intelligence.",
    sameAs: [
      "https://www.facebook.com/mohamed.mosbeh.508798/",
      "https://www.instagram.com/beautynest_k_beauty_expert/",
      "https://fr.pinterest.com/beautynest_skincare/",
    ],
  };

  return (
    <div className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 text-white">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Author</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">BeautyNestKorea</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Curated K-Beauty recommendations with daily market intelligence.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Every guide is researched from ingredients first, checked against community buzz, and
        price-compared across Amazon and Olive Young — refreshed each morning by our market
        intelligence bot.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/advice"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-700"
        >
          All articles <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/market-report"
          className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-5 py-2.5 text-sm font-semibold text-sage-800 transition hover:bg-sage-200"
        >
          Daily market report <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
