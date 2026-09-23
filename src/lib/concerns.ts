import type { Product } from "@/lib/types";
import { CONCERNS } from "@/lib/types";

export interface ConcernStat {
  name: string;
  count: number;
}

// Synonym → canonical concern. Products tagged with a synonym roll up
// under the canonical card/chip/filter everywhere (homepage grid, shop
// filters, concern stats, category pages) — synonyms never render as separate
// entities, and NO product association is ever deleted (pure display mapping).
// Canonicals: 'Anti-aging' (largest group), 'Sensitive Skin' (editorial pick
// over bare 'Sensitive'), 'Hyperpigmentation' (clinical umbrella covering
// 'Dark Spots'). Case variants ('Anti-Aging') fold via CANONICAL_CASING below.
const CONCERN_SYNONYMS: Record<string, string> = {
  elasticity: "Anti-aging",
  firming: "Anti-aging",
  sensitive: "Sensitive Skin",
  sensitivity: "Sensitive Skin",
  "sensitive skin": "Sensitive Skin",
  "dark spots": "Hyperpigmentation",
  hyperpigmentation: "Hyperpigmentation",
};

/**
 * Display-cased canonical names. normalizeConcernName folds any casing
 * variant ("Anti-Aging", "SENSITIVE SKIN") to these, so live-DB label drift
 * can never spawn a duplicate card. CONCERNS entries are included so the fold
 * stays in sync with the editorial list automatically.
 */
const CANONICAL_CASING: string[] = [
  ...CONCERNS,
  "Sensitive Skin",
  "Hyperpigmentation",
];

/** Map a raw concern label to its canonical form (case-insensitive). */
export function normalizeConcernName(raw: string): string {
  const key = raw.trim().toLowerCase();
  const mapped = CONCERN_SYNONYMS[key] ?? raw.trim();
  // Casing fold: live data ships variants ("Anti-Aging"); display the single
  // canonical casing instead of rendering a second card.
  const canonical = CANONICAL_CASING.find((c) => c.toLowerCase() === mapped.toLowerCase());
  return canonical ?? mapped;
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

/**
 * Display-ready concern names: normalized AND backed by ≥1 product.
 * WHY this exists alongside getAllConcernNames(): the raw list includes the
 * static CONCERNS entries verbatim, so a renamed canonical ("Sensitive" →
 * "Sensitive Skin") would leak the stale label as a second chip/page.
 * Filters, chips, and static params must use THIS so renames can never
 * render duplicates or empty/duplicate pages. Product associations untouched.
 */
export function getActiveConcernNames(products: Product[]): string[] {
  return getConcernStats(products)
    .filter(({ count }) => count > 0)
    .map(({ name }) => name);
}
