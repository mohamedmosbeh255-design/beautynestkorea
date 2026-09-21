import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Sparkles, Droplets, Sun, Leaf, Star, CircleDot } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getConcernStats } from "@/lib/concerns";
import { getAllAdvice } from "@/lib/advice";
import { siteBaseUrl } from "@/lib/market-report";
import ProductCard from "@/components/ProductCard";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";

export const metadata: Metadata = {
  alternates: { canonical: siteBaseUrl() },
};

export const revalidate = 3600;

// Editorial presentation per concern; unknown/custom concerns added via the
// Admin panel fall back to rotating defaults so they still render beautifully.
const CONCERN_META: Record<string, { icon: typeof Leaf; blurb: string; gradient: string }> = {
  Acne: { icon: Leaf, blurb: "Calm breakouts, fade marks", gradient: "from-sage-100 to-sage-200" },
  "Anti-aging": { icon: Sun, blurb: "Firm, smooth & glow", gradient: "from-blush-100 to-blush-200" },
  Hydration: { icon: Droplets, blurb: "Glass-skin moisture", gradient: "from-sky-100 to-sage-100" },
  Brightening: { icon: Star, blurb: "Fade dark spots, glow", gradient: "from-amber-100 to-blush-100" },
  Sensitive: { icon: ShieldCheck, blurb: "Gentle, barrier-first", gradient: "from-sage-50 to-sky-100" },
  Pores: { icon: CircleDot, blurb: "Refine & balance oil", gradient: "from-stone-100 to-sage-100" },
};

const FALLBACK_META = [
  { icon: Sparkles, blurb: "Curated picks for this need", gradient: "from-blush-50 to-sage-100" },
  { icon: Droplets, blurb: "Curated picks for this need", gradient: "from-sky-50 to-blush-100" },
  { icon: Leaf, blurb: "Curated picks for this need", gradient: "from-sage-50 to-blush-50" },
];

export default async function HomePage() {
  const featured = await getProducts({ featuredOnly: true, limit: 6 });
  const allProducts = await getProducts();
  const grid = featured.length > 0 ? featured : allProducts.slice(0, 3);
  // Dynamic: derived from live product data — adding a product with a new
  // concern in Admin automatically adds/updates a card here.
  const concernStats = getConcernStats(allProducts);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-96 w-96 rounded-full bg-sage-100 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-blush-100 blur-3xl" />
        <div className="mx-auto w-full max-w-[2000px] px-1 pb-1 pt-1">
          <div className="relative animate-fade-up-1">
            <div className="glass-strong relative overflow-hidden rounded-xl p-0">
              <div className="relative aspect-[2000/768] overflow-hidden rounded-xl">
                <Image
                  src="https://wlbsswmkoahjzentukns.supabase.co/storage/v1/object/public/site-assets/ChatGPT%20Image%20Sep%2013,%202026,%2008_31_36%20PM.png"
                  alt="BeautyNestKorea curated K-beauty skincare banner"
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1080px) 100vw, 1080px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAGE HEADLINE */}
      <section className="mx-auto max-w-7xl px-4 pt-10 text-center sm:px-6">
        <h1 className="font-serif-display mx-auto max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Discover K-Beauty & Skincare That Loves You Back
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Curated Korean bestsellers with honest reviews and Amazon vs Olive Young price comparison, re-checked monthly.
        </p>
      </section>

      {/* SHOP BY CONCERN */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Shop by concern</p>
            <h2 className="font-serif-display mt-2 text-3xl font-bold tracking-tight">What does your skin need?</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {concernStats.map(({ name, count }, i) => {
            const meta = CONCERN_META[name] ?? FALLBACK_META[i % FALLBACK_META.length];
            const Icon = meta.icon;
            return (
              <Link key={name} href={`/shop?concern=${encodeURIComponent(name)}`}
                className={`group rounded-3xl bg-gradient-to-br ${meta.gradient} p-6 transition hover:-translate-y-1 hover:shadow-xl`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                  <Icon className="h-5 w-5 text-sage-700" />
                </span>
                <h3 className="font-serif-display mt-4 text-xl font-bold">{name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{meta.blurb}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sage-700">
                  {count} product{count !== 1 && "s"}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  Shop {name.toLowerCase()} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blush-500">Curated for you</p>
            <h2 className="font-serif-display mt-2 text-3xl font-bold tracking-tight">Featured products</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <AffiliateDisclosure className="mt-3 max-w-xl" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* TRUST / VALUE PROPS */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="glass rounded-[2rem] p-8 sm:p-12">
          <h2 className="font-serif-display text-center text-2xl font-bold sm:text-3xl">Why shop with BeautyNestKorea?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { title: "Price-checked twice", desc: "Every product links to both Amazon and Olive Young so you pick the cheaper, faster option." },
              { title: "Ingredients first", desc: "We list key actives, skin-type fit and concerns — no marketing fluff, just what works." },
              { title: "Routines that stick", desc: "Free SEO-backed guides help you layer products correctly, morning and night." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl bg-white/70 p-6">
                <h3 className="font-serif-display text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG TEASER */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif-display text-3xl font-bold tracking-tight">Skincare advice</h2>
          <Link href="/advice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {getAllAdvice().map((post) => (
            <Link key={post.slug} href={`/advice/${post.slug}`} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-xl">
              {post.image ? (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition group-hover:scale-105" sizes="33vw" />
                </div>
              ) : null}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{post.category} • {post.readTime}</p>
                <h3 className="font-serif-display mt-1.5 text-lg font-bold leading-snug">{post.title}</h3>
                <p className="mt-2 text-sm text-ink-soft clamp-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
