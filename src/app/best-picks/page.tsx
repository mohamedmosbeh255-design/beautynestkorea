import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { getConcernStats, normalizeConcernName } from "@/lib/concerns";
import ProductCard from "@/components/ProductCard";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Best Picks — Curated K-Beauty Favorites",
  description: "Our hand-picked bestsellers across every skin concern — with honest reviews and Amazon vs Olive Young price comparison.",
  alternates: { canonical: `${siteBaseUrl()}/best-picks` },
};

export default async function BestPicksPage() {
  const products = await getProducts();
  const stats = getConcernStats(products);

  const sections = stats.slice(0, 4).map((stat) => {
    const matched = products
      .filter((p) => (p.concern ?? []).some((c) => normalizeConcernName(c) === stat.name))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4);
    return { name: stat.name, count: stat.count, products: matched };
  });

  const bestsellers = [...products]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Curated picks</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Best Picks</h1>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">
        Our hand-picked favorites across every skin concern — ranked by reviews, not by budget.
        Every product links to both Amazon and Olive Young so you can compare prices.
      </p>

      <section className="mt-10">
        <h2 className="font-serif-display text-2xl font-bold tracking-tight">All-time bestsellers</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.name} className="mt-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Shop by concern</p>
              <h2 className="font-serif-display mt-1 text-2xl font-bold tracking-tight">
                Best for {section.name.toLowerCase()}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {section.count} product{section.count !== 1 && "s"} tagged for {section.name.toLowerCase()}.
              </p>
            </div>
            <Link
              href={`/category/${section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
              className="hidden text-sm font-semibold text-sage-700 hover:underline sm:inline-flex"
            >
              See all {"→"}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {section.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}

      <p className="mt-12 text-center text-sm text-ink-soft">
        Looking for something specific?{" "}
        <Link href="/shop" className="font-semibold text-sage-700 hover:underline">
          Browse the full shop
        </Link>
      </p>
    </div>
  );
}
