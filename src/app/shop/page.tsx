import type { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { siteBaseUrl } from "@/lib/market-report";
import ProductCard from "@/components/ProductCard";
import MedicalCaveat from "@/components/MedicalCaveat";
import ShopClient from "@/components/ShopClient";

export const metadata: Metadata = {
  title: "Shop K-Beauty Bestsellers",
  description: "Filter by brand, price, concern and source. Compare Amazon vs Olive Young prices on curated Korean skincare.",
  alternates: { canonical: `${siteBaseUrl()}/shop` },
};

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ concern?: string; category?: string }>;
}) {
  const products = await getProducts();
  const { concern, category } = await searchParams;
  // Deep-link support: /shop?concern=Hydration (from homepage cards & footer)
  // and /shop?category=Sunscreen (e.g. from blog articles) pre-select
  // the matching filter. Unknown values fall back to "All" in ShopClient.
  // Bestsellers strip: featured picks first, then top rated.
  const bestsellers = [...products]
    .sort((a, b) => Number(b.is_featured ?? false) - Number(a.is_featured ?? false) || (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">The shelf</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Shop skincare</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
        Filter by brand, concern, price and source. Every card links to both Amazon and Olive Young on the product page.
      </p>
      <MedicalCaveat className="mt-4 max-w-xl" />
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
          <ShopClient products={products} initialConcern={concern ?? "All"} initialCategory={category ?? "All"} />
        </div>
      </section>
    </div>
  );
}
