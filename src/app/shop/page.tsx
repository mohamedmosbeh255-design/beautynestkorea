import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Globe2, Scissors } from "lucide-react";
import { getProducts } from "@/lib/products";
import { GLOBAL_SKINCARE, HAIR_SCALP_CARE, HAIR_SCALP_CARE_SLUG, productMatchesConcern } from "@/lib/concerns";
import { siteBaseUrl } from "@/lib/market-report";
import ProductCard from "@/components/ProductCard";
import MedicalCaveat from "@/components/MedicalCaveat";
import ShopFromParams from "@/components/ShopFromParams";

export const metadata: Metadata = {
  title: "Shop K-Beauty Bestsellers",
  description: "Filter by brand, price, concern and source. Compare Amazon vs Olive Young prices on curated Korean skincare.",
  alternates: { canonical: `${siteBaseUrl()}/shop` },
};

export const revalidate = 3600;

export default async function ShopPage() {
  const products = await getProducts();
  // Guard: the collection card only renders once products carry the concern,
  // including read-time membership derived from a Western brand, so a
  // mis-ordered deploy can never ship a link to an empty 404 page.
  const hasGlobal = products.some((p) => productMatchesConcern(p, GLOBAL_SKINCARE));
  // Hair & Scalp collection link appears only at the 4-product index threshold,
  // while the category filter chip (ShopClient) unlocks at 1 product.
  const hairCount = products.filter((p) => p.category === HAIR_SCALP_CARE).length;
  const hasHairCollection = hairCount >= 4;
  // Deep links (/shop?concern=Hydration, /shop?category=Sunscreen) are
  // resolved client-side in ShopFromParams so this page stays static ISR.
  // Bestsellers strip: featured picks first, then top rated.
  const bestsellers = [...products]
    .sort((a, b) => Number(b.is_featured ?? false) - Number(a.is_featured ?? false) || (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">The shelf</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Shop skincare</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
        Filter by brand, concern, price and source. Each product page links to every retailer where we track that item — Amazon, Olive Young or Stylevana.
      </p>
      <MedicalCaveat className="mt-4 max-w-xl" />
      {(hasGlobal || hasHairCollection) && (
        <section className="mt-10">
          <h2 className="font-serif-display text-2xl font-bold tracking-tight sm:text-3xl">Shop by collection</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hasGlobal && (
              <Link
                href="/category/global-skincare"
                className="group rounded-3xl bg-gradient-to-br from-stone-100 to-sage-100 p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                  <Globe2 className="h-5 w-5 text-sage-700" />
                </span>
                <h3 className="font-serif-display mt-4 text-xl font-bold">Global Skincare</h3>
                <p className="mt-1 text-sm text-ink-soft">Dermatologist-recommended Western essentials</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  Explore the collection
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )}
            {hasHairCollection && (
              <Link
                href={`/category/${HAIR_SCALP_CARE_SLUG}`}
                className="group rounded-3xl bg-gradient-to-br from-sage-50 to-sky-100 p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                  <Scissors className="h-5 w-5 text-sage-700" />
                </span>
                <h3 className="font-serif-display mt-4 text-xl font-bold">Hair &amp; Scalp Care</h3>
                <p className="mt-1 text-sm text-ink-soft">Korean scalp rituals and global hair essentials</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  Explore the collection
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )}
          </div>
        </section>
      )}
      {bestsellers.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif-display text-2xl font-bold tracking-tight sm:text-3xl">Bestsellers</h2>
          <p className="mt-1 text-sm text-ink-soft">Our most-loved picks, rated by the community.</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
      <section className="mt-12">
        <h2 className="font-serif-display text-2xl font-bold tracking-tight sm:text-3xl">Shop by concern</h2>
        <p className="mt-1 text-sm text-ink-soft">Pick a concern chip to narrow the shelf to your skin&apos;s needs.</p>
        <div className="mt-5">
          <Suspense fallback={<div className="glass rounded-3xl p-12 text-center text-sm text-ink-soft">Loading the shelf…</div>}>
            <ShopFromParams products={products} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
