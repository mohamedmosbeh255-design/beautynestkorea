import type { Metadata } from "next";
import { getProducts } from "@/lib/products";
import ShopClient from "@/components/ShopClient";

export const metadata: Metadata = {
  title: "Shop K-Beauty Bestsellers",
  description: "Filter by brand, price, concern and source. Compare Amazon vs Olive Young prices on curated Korean skincare.",
};

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ concern?: string }>;
}) {
  const products = await getProducts();
  const { concern } = await searchParams;
  // Deep-link support: /shop?concern=Hydration (from homepage cards & footer)
  // pre-selects the filter. Unknown values fall back to "All" in ShopClient.
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">The shelf</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Shop skincare</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
        Filter by brand, concern, price and source. Every card links to both Amazon and Olive Young on the product page.
      </p>
      <div className="mt-8">
        <ShopClient products={products} initialConcern={concern ?? "All"} />
      </div>
    </div>
  );
}
