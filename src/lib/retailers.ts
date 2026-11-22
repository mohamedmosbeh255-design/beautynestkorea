import type { Product } from "@/lib/types";

export type RetailerName = "Amazon" | "Olive Young" | "Stylevana";

/**
 * Retailers we can actually send the visitor to.
 * Amazon counts when EITHER a URL or a bare ASIN exists, because
 * AffiliateButtons rebuilds the tagged URL from the ASIN.
 * Read-only: never mutates the product.
 */
export function getRetailerNames(product: Product): RetailerName[] {
  const names: RetailerName[] = [];
  const hasAmazon =
    Boolean(product.amazon_url?.trim()) ||
    Boolean(product.amazon_asin?.trim()) ||
    Boolean(product.amazon_uk_url?.trim()) ||
    Boolean(product.amazon_uk_asin?.trim());
  if (hasAmazon) names.push("Amazon");
  if (product.oliveyoung_url?.trim()) names.push("Olive Young");
  if (product.stylevana_url?.trim()) names.push("Stylevana");
  return names;
}

/** ["A","B","C"] → "A, B and C" */
export function formatRetailerList(names: RetailerName[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
