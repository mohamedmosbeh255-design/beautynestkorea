import type { Product } from "@/lib/types";
import { CONCERNS } from "@/lib/types";

export interface ConcernStat {
  name: string;
  count: number;
}

// Synonym → canonical concern. Products tagged with a synonym roll up
// under the canonical card/chip/filter everywhere (homepage grid, shop
// filters, concern stats) — synonyms never render as separate entities.
// Canonical slug: 'anti-aging'.
const CONCERN_SYNONYMS: Record<string, string> = {
  elasticity: "Anti-aging",
  firming: "Anti-aging",
};

/** Map a raw concern label to its canonical form (case-insensitive). */
export function normalizeConcernName(raw: string): string {
  const key = raw.trim().toLowerCase();
  return CONCERN_SYNONYMS[key] ?? raw.trim();
}

/** True when a product targets a concern, resolving synonyms to canonical. */
export function productMatchesConcern(product: Product, concern: string): boolean {
  const wanted = normalizeConcernName(concern);
  return (product.concern ?? []).some((c) => normalizeConcernName(c) === wanted);
}

// Count how many products target each concern. Synonym tags merge into
// their canonical concern; concerns with zero products never appear, so
// empty cards cannot render. Includes custom concerns added via Admin.
export function getConcernStats(products: Product[]): ConcernStat[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const raw of p.concern ?? []) {
      const name = normalizeConcernName(raw);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  // Order: known CONCERNS first (stable editorial order), then any custom
  // concerns alphabetically. Sort each group by product count desc.
  const known = CONCERNS.filter((c) => counts.has(c)).map((c) => ({ name: c, count: counts.get(c)! }));
  const custom = [...counts.entries()]
    .filter(([name]) => !(CONCERNS as readonly string[]).includes(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  known.sort((a, b) => b.count - a.count);
  return [...known, ...custom];
}

// All concern names available for filters: known list + any custom ones on products.
// Synonyms resolve to canonical (no orphan 'elasticity'/'firming' chips).
export function getAllConcernNames(products: Product[]): string[] {
  const fromProducts = (products.flatMap((p) => p.concern ?? [])).map(normalizeConcernName);
  const merged = [...(CONCERNS as unknown as string[]), ...fromProducts];
  return [...new Set(merged.map((c) => c.trim()).filter(Boolean))];
}
