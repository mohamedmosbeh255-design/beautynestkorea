import type { Product } from "@/lib/types";
import { CONCERNS } from "@/lib/types";

export interface ConcernStat {
  name: string;
  count: number;
}

// Count how many products target each concern. Includes concerns found on
// products even if they aren't in the CONCERNS constant — so new concerns
// added via the Admin panel appear automatically.
export function getConcernStats(products: Product[]): ConcernStat[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const raw of p.concern ?? []) {
      const name = raw.trim();
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
export function getAllConcernNames(products: Product[]): string[] {
  const fromProducts = products.flatMap((p) => p.concern ?? []);
  const merged = [...(CONCERNS as unknown as string[]), ...fromProducts];
  return [...new Set(merged.map((c) => c.trim()).filter(Boolean))];
}
