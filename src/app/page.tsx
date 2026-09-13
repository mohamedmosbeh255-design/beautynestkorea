import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Sparkles, Droplets, Sun, Leaf, Star, CircleDot } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getConcernStats } from "@/lib/concerns";
import ProductCard from "@/components/ProductCard";
import { BLOG_POSTS } from "@/lib/data/blog";

export const revalidate = 60;

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
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-sage-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Trusted K-Beauty curation • Updated 2026
            </span>
            <h1 className="font-serif-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Discover K-Beauty &<br />
              <span className="bg-gradient-to-r from-sage-600 via-sage-500 to-blush-500 bg-clip-text text-transparent">
                Global Skincare
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">
              Honest reviews, simple routines and the best prices — we compare Amazon vs Olive Young so you never overpay for glow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:bg-sage-700">
                Shop bestsellers <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/blog" className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold transition hover:bg-white/80">
                Skincare advice
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              {[
                { icon: ShieldCheck, label: "Dermat-reviewed picks" },
                { icon: Truck, label: "Amazon & Olive Young" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 font-medium text-ink-soft">
                  <Icon className="h-4 w-4 text-sage-600" /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up-1">
            <div className="glass-strong relative overflow-hidden rounded-[2rem] p-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] sm:aspect-[5/4] lg:aspect-[4/5]">
                <Image
                  src="https://wlbsswmkoahjzentukns.supabase.co/storage/v1/object/public/site-assets/ChatGPT%20Image%20Sep%2013,%202026,%2008_31_36%20PM.png"
                  alt="BeautyNestKorea curated K-beauty skincare banner"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">Bestseller of the week</p>
                    <p className="font-serif-display text-sm font-bold">Beauty of Joseon Relief Sun</p>
                  </div>
                  <Link href="/product/beauty-of-joseon-relief-sun" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">
                    $18.00
                  </Link>
                </div>
              </div>
            </div>
            <div className="glass absolute -right-3 bottom-16 hidden animate-float-slow rounded-2xl px-4 py-3 text-xs font-semibold shadow-lg sm:block">
              ★ 4.8 · 12k reviews
            </div>
          </div>
        </div>
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
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover transition group-hover:scale-105" sizes="33vw" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{post.category} • {post.reading_time}</p>
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
