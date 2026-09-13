"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { getAllConcernNames } from "@/lib/concerns";

export default function ShopClient({ products, initialConcern = "All", initialCategory = "All" }: { products: Product[]; initialConcern?: string; initialCategory?: string }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [category, setCategory] = useState(initialCategory);
  const [concern, setConcern] = useState(initialConcern);
  const [source, setSource] = useState<"All" | "Amazon" | "Olive Young">("All");
  const [maxPrice, setMaxPrice] = useState(30);
  const [sort, setSort] = useState("featured");

  // Sync when navigating between deep links, e.g. homepage cards
  // (/shop?concern=Acne → /shop?concern=Hydration) without a full reload.
  useEffect(() => {
    setConcern(initialConcern);
  }, [initialConcern]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const brands = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.brand)))], [products]);
  // Dynamic chips: every concern present on products (incl. custom ones
  // added via Admin) gets a filter chip automatically.
  const concerns = useMemo(() => ["All", ...getAllConcernNames(products)], [products]);
  const effectiveConcern = concerns.includes(concern) ? concern : "All";
  // Fixed catalog list so new categories (e.g. "Cream") appear even
  // before any product uses them.
  const categories = useMemo(() => ["All", ...CATEGORIES], []);
  const effectiveCategory = categories.includes(category) ? category : "All";

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (query && !`${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (brand !== "All" && p.brand !== brand) return false;
      if (effectiveCategory !== "All" && p.category !== effectiveCategory) return false;
      if (effectiveConcern !== "All" && !p.concern.includes(effectiveConcern)) return false;
      if (p.price > maxPrice) return false;
      if (source === "Amazon" && !p.amazon_url) return false;
      if (source === "Olive Young" && !p.oliveyoung_url) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [products, query, brand, effectiveCategory, effectiveConcern, source, maxPrice, sort]);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Filters sidebar */}
      <aside className="glass h-fit rounded-3xl p-5 lg:sticky lg:top-24">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Search</label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Snail mucin, toner..."
              className="w-full rounded-xl border border-sage-100 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sage-400"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Brand</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <button key={b} onClick={() => setBrand(b)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", brand === b ? "bg-ink text-white" : "bg-white/70 text-ink-soft hover:bg-sage-50")}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Category</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", effectiveCategory === c ? "bg-sage-600 text-white" : "bg-white/70 text-ink-soft hover:bg-sage-50")}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Concern</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {concerns.map((c) => (
              <button key={c} onClick={() => setConcern(c)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", effectiveConcern === c ? "bg-sage-600 text-white" : "bg-white/70 text-ink-soft hover:bg-sage-50")}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Source</label>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {(["All", "Amazon", "Olive Young"] as const).map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className={cn("rounded-xl px-2 py-2 text-xs font-semibold transition", source === s ? "bg-blush-100 text-blush-600 border border-blush-200" : "bg-white/70 text-ink-soft")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Max price: ${maxPrice}
          </label>
          <input type="range" min={5} max={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-2 w-full accent-sage-600" />
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-sage-100 bg-white/80 px-3 py-2.5 text-sm outline-none">
            <option value="featured">Featured</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>

        {(query || brand !== "All" || effectiveCategory !== "All" || effectiveConcern !== "All" || source !== "All") && (
          <button onClick={() => { setQuery(""); setBrand("All"); setCategory("All"); setConcern("All"); setSource("All"); setMaxPrice(30); }}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blush-600 hover:underline">
            <X className="h-3.5 w-3.5" /> Clear all filters
          </button>
        )}
      </aside>

      {/* Grid */}
      <div>
        <p className="text-sm text-ink-soft">{filtered.length} product{filtered.length !== 1 && "s"} found</p>
        {filtered.length === 0 ? (
          <div className="glass mt-4 rounded-3xl p-12 text-center">
            <p className="font-serif-display text-xl font-semibold">No matches</p>
            <p className="mt-2 text-sm text-ink-soft">Try a different brand, concern or price range.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
