import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getAllAdvice } from "@/lib/advice";
import { siteBaseUrl } from "@/lib/market-report";
import SearchResults from "@/components/SearchResults";

/**
 * Site-wide search (B4). Deliberately EXCLUDED from sitemap.xml and set to
 * noindex: query pages must never compete in SERPs. Static shell + client
 * filtering over existing data — nothing written, nothing re-ranked.
 */
export const metadata: Metadata = {
  title: "Search — Products & Guides",
  description: "Search BeautyNestKorea: curated K-beauty products and skincare guides.",
  alternates: { canonical: `${siteBaseUrl()}/search` },
  robots: { index: false, follow: true },
};

export const revalidate = 3600;

export default async function SearchPage() {
  const [products, guides] = await Promise.all([getProducts(), Promise.resolve(getAllAdvice())]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Search</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find your match</h1>
      <Suspense fallback={<div className="glass mt-6 rounded-2xl p-12 text-center text-sm text-ink-soft">Loading search…</div>}>
        <SearchResults products={products} guides={guides} />
      </Suspense>
    </div>
  );
}
