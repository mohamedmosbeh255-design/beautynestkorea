import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getActiveConcernNames, normalizeConcernName, productMatchesConcern, HAIR_SCALP_CARE, HAIR_SCALP_CARE_SLUG } from "@/lib/concerns";
import { CONCERN_COPY } from "@/lib/concern-copy";
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
  // Explicit collection route: never slugified dynamically. The URL is
  // /category/hair-scalp-care while the catalog value is "Hair & Scalp".
  if (slug === HAIR_SCALP_CARE_SLUG) return HAIR_SCALP_CARE;
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
  // Hair & Scalp Care is an explicit collection (category-keyed), not a
  // concern, so it is emitted by its literal slug and is always reachable.
  return [
    ...getActiveConcernNames(products).map((name) => ({ slug: slugifyConcern(name) })),
    { slug: HAIR_SCALP_CARE_SLUG },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const concern = await resolveConcern(slug);
  if (!concern) return { title: "Category not found" };
  const base = siteBaseUrl();
  // "Global Skincare" is a curated collection, not a skin concern, so the
  // generic "<concern> skincare" phrasing would read "Global Skincare skincare".
  // Scoped to this one slug — every existing category keeps its exact metadata.
  const isGlobal = concern === "Global Skincare";
  const isHair = concern === HAIR_SCALP_CARE;
  const canonicalSlug = isHair ? HAIR_SCALP_CARE_SLUG : slugifyConcern(concern);
  const copy = isGlobal ? undefined : CONCERN_COPY[canonicalSlug];
  const title = isHair
    ? "Hair & Scalp Care — Korean Scalp Rituals"
    : isGlobal
      ? "Global Skincare Products — Dermatologist-Recommended Essentials"
      : `${concern} Skincare Products — Curated K-Beauty Picks`;
  const description = isGlobal
    ? "Shop curated Western skincare essentials from CeraVe, La Roche-Posay, Paula's Choice, Vaseline, Aquaphor, O'Keeffe's, Bioderma, The Ordinary and EltaMD."
    : copy?.description ??
      `Shop curated ${concern.toLowerCase()} skincare: bestsellers with honest reviews and Amazon vs Olive Young price comparison.`;
  // Index threshold (hair only): 0–3 active products → reachable but noindex,
  // so it stays out of Google until the collection is substantial enough.
  const hairCount = isHair
    ? (await getProducts()).filter((p) => p.category === HAIR_SCALP_CARE).length
    : 0;
  return {
    title,
    description,
    alternates: { canonical: `${base}/category/${canonicalSlug}` },
    openGraph: { title, description, type: "website" },
    ...(isHair && hairCount < 4 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const concern = await resolveConcern(slug);
  if (!concern) notFound();
  const isGlobal = concern === "Global Skincare";
  const isHair = concern === HAIR_SCALP_CARE;
  const canonicalSlug = isHair ? HAIR_SCALP_CARE_SLUG : slugifyConcern(concern);

  // Read-only filter over live catalog data: products keep every concern tag
  // they already have — this page only READS associations, never rewrites.
  const products = await getProducts();
  // Hair & Scalp is keyed off the single-value `category` field and is
  // intentionally excluded from concern-based matching everywhere else.
  const matched = isHair
    ? products.filter((p) => p.category === HAIR_SCALP_CARE)
    : products.filter((p) => productMatchesConcern(p, concern));
  const copy = isGlobal ? undefined : CONCERN_COPY[canonicalSlug];

  const base = siteBaseUrl();
  const jsonLd = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: concern, path: `/category/${canonicalSlug}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: isGlobal ? concern : isHair ? "Hair & Scalp Care" : `${concern} skincare` }]} />
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">
        {isHair || isGlobal ? "Shop by collection" : "Shop by concern"}
      </p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {isHair ? "Korean Scalp Rituals & Global Essentials" : isGlobal ? concern : `${concern} skincare`}
      </h1>
      <p className="mt-3 max-w-2xl text-base text-ink-soft">
        {isGlobal ? (
          "The best Western products, carefully selected."
        ) : (
          copy?.intro ??
          `${matched.length} curated product${matched.length !== 1 ? "s" : ""} for ${concern.toLowerCase()} — prices pulled straight from the catalog below, with retailer price comparison where available.`
        )}
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
          <p className="font-semibold">{isHair ? "No products in this collection yet." : "No products carry this concern yet."}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {isHair
              ? "New hair and scalp picks are on the way — browse the full catalog in the meantime."
              : "Browse the full catalog instead — new picks land regularly."}
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
