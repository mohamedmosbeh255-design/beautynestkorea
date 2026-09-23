import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getActiveConcernNames, normalizeConcernName, productMatchesConcern } from "@/lib/concerns";
import ProductCard from "@/components/ProductCard";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import Breadcrumbs from "@/components/Breadcrumbs";
import { siteBaseUrl } from "@/lib/market-report";
import { breadcrumbJsonLd } from "@/lib/schema";

export const revalidate = 3600;

/**
 * Canonical category slug: lowercase, non-alphanumerics → single hyphen.
 * "Anti-aging" → "anti-aging" (matches the long-standing /category/*
 * redirects); custom Admin concerns like "Dark Spots" → "dark-spots".
 */
function slugifyConcern(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolve a URL slug to its canonical concern name WITHOUT touching product
 * data: synonyms ("elasticity", "firming") fold to the canonical concern that
 * already holds the products ("Anti-aging"), so no association is ever
 * deleted — duplicates alias, the canonical keeps everything.
 */
async function resolveConcern(slug: string): Promise<string | null> {
  const products = await getProducts();
  // Active names only (see getActiveConcernNames): stale labels like the old
  // "Sensitive" can never resolve to a second page shadowing "Sensitive Skin".
  const names = getActiveConcernNames(products);
  const want = slugifyConcern(normalizeConcernName(slug.replace(/-/g, " ")));
  // Direct canonical hit first (stable, cheapest).
  const direct = names.find((n) => slugifyConcern(n) === slug);
  if (direct) return direct;
  // Synonym hit: "elasticity" → normalize → "Anti-aging" → "anti-aging".
  const viaSynonym = names.find((n) => slugifyConcern(n) === want);
  return viaSynonym ?? null;
}

export async function generateStaticParams() {
  const products = await getProducts();
  // Canonical slugs only: synonym URLs stay live via the next.config.ts 301s
  // but are never emitted as canonical, so no duplicate-content signals.
  // Active names only — a renamed canonical never leaves a stale twin page.
  return getActiveConcernNames(products).map((name) => ({ slug: slugifyConcern(name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const concern = await resolveConcern(slug);
  if (!concern) return { title: "Category not found" };
  const base = siteBaseUrl();
  const title = `${concern} Skincare Products — Curated K-Beauty Picks`;
  const description = `Shop curated ${concern.toLowerCase()} skincare: bestsellers with honest reviews and Amazon vs Olive Young price comparison.`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/category/${slugifyConcern(concern)}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const concern = await resolveConcern(slug);
  if (!concern) notFound();

  // Read-only filter over live catalog data: products keep every concern tag
  // they already have — this page only READS associations, never rewrites.
  const products = await getProducts();
  const matched = products.filter((p) => productMatchesConcern(p, concern));

  const base = siteBaseUrl();
  const jsonLd = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: concern, path: `/category/${slugifyConcern(concern)}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: `${concern} skincare` }]} />
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Shop by concern</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{concern} skincare</h1>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">
        {matched.length} curated product{matched.length !== 1 && "s"} for {concern.toLowerCase()} — prices
        pulled straight from the catalog below, with Amazon vs Olive Young comparison on every product page.
      </p>
      <AffiliateDisclosure className="mt-4 max-w-2xl" />
      {matched.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matched.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="glass mt-8 rounded-3xl p-8 text-center">
          <p className="font-semibold">No products carry this concern yet.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Browse the full catalog instead — new picks land regularly.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
          >
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
