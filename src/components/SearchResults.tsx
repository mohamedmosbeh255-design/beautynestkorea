"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import type { AdviceMeta } from "@/lib/advice";
import ProductCard from "@/components/ProductCard";

/**
 * Site-wide results over the EXISTING catalog + advice index (B4). Read-only
 * filtering — no data writes, no ranking changes, no affiliate involvement.
 * Products match title/brand/category/concerns; guides match title/excerpt.
 */
export default function SearchResults({ products, guides }: { products: Product[]; guides: AdviceMeta[] }) {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const q = query.trim().toLowerCase();
  const matchedProducts = useMemo(() => {
    if (!q) return [];
    return products.filter((p) =>
      `${p.title} ${p.brand} ${p.category} ${(p.concern ?? []).join(" ")}`.toLowerCase().includes(q)
    );
  }, [products, q]);
  const matchedGuides = useMemo(() => {
    if (!q) return [];
    return guides.filter((g) =>
      `${g.title} ${g.excerpt} ${g.category}`.toLowerCase().includes(q)
    );
  }, [guides, q]);

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="glass mt-6 flex items-center gap-2 rounded-2xl px-4 py-3"
      >
        <Search className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, guides…"
          aria-label="Search products and guides"
          className="w-full bg-transparent text-base outline-none placeholder:text-ink-soft/70"
        />
      </form>

      {!q ? (
        <p className="mt-8 text-center text-sm text-ink-soft">Type above to search the shelf and the advice library.</p>
      ) : (
        <>
          <h2 className="font-serif-display mt-10 text-2xl font-bold tracking-tight">
            Products ({matchedProducts.length})
          </h2>
          {matchedProducts.length > 0 ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No products match “{query.trim()}”.</p>
          )}

          <h2 className="font-serif-display mt-12 text-2xl font-bold tracking-tight">
            Guides ({matchedGuides.length})
          </h2>
          {matchedGuides.length > 0 ? (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {matchedGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/advice/${g.slug}`}
                    className="glass block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{g.category}</p>
                    <p className="font-serif-display mt-1 font-bold leading-snug">{g.title}</p>
                    <p className="mt-1.5 text-sm text-ink-soft clamp-2">{g.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No guides match “{query.trim()}”.</p>
          )}
        </>
      )}
    </div>
  );
}
