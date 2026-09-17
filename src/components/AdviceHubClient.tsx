"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowRight, Sparkles } from "lucide-react";

export interface HubConcern {
  slug: string;
  title: string;
  blurb: string;
  ingredientNames: string[];
}

/** Client-side search over the 10 concern cards (zero runtime cost, static data). */
export default function AdviceHubClient({ concerns }: { concerns: HubConcern[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return concerns;
    return concerns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.blurb.toLowerCase().includes(q) ||
        c.ingredientNames.some((i) => i.toLowerCase().includes(q))
    );
  }, [query, concerns]);

  return (
    <div>
      <div className="relative mt-6 max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search concerns or ingredients — try 'retinol'…"
          aria-label="Search skincare concerns"
          className="w-full rounded-2xl border border-sage-100 bg-white/85 py-3 pl-11 pr-4 text-sm outline-none focus:border-sage-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass mt-6 rounded-3xl p-10 text-center">
          <p className="font-serif-display text-xl font-semibold">No matches for “{query}”</p>
          <p className="mt-2 text-sm text-ink-soft">Try an ingredient like niacinamide, or browse every concern below.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/advice/${c.slug}`}
              className="glass group rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="font-serif-display mt-4 text-xl font-bold leading-snug">{c.title}</h2>
              <p className="mt-2 text-sm text-ink-soft clamp-3">{c.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700">
                Open guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
