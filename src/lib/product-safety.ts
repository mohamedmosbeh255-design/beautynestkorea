import type { Product } from "@/lib/types";

/**
 * Ingredient-level safety rules for "Pairs well with".
 * Read-only: never mutates a product and never touches the DB.
 *
 * WHY key_ingredients + title only (not description):
 * descriptions sometimes MENTION an ingredient ("pairs with retinol")
 * without containing it, which would create false positives.
 */
const RETINOID_RE = /\b(retinol|retinal|retinaldehyde|retinoid|adapalene|tretinoin)\b/i;
const ACID_RE = /\b(aha|bha|pha|glycolic|lactic|salicylic|mandelic|azelaic)\b/i;

/** Physical devices carry technology names, not an ingredient formula. */
const DEVICE_RE = /\b(electroporation|microcurrent|led light|ems|air shot)\b/i;

function ingredientText(product: Product): string {
  return [product.title, ...(product.key_ingredients ?? [])].join(" ");
}

export function isRetinoid(product: Product): boolean {
  return RETINOID_RE.test(ingredientText(product));
}

export function isExfoliatingAcid(product: Product): boolean {
  return ACID_RE.test(ingredientText(product));
}

/** Category first (after the DB update) with a data-based fallback so the
 *  UI is correct even if the category row is updated later than the code. */
export function isDevice(product: Product): boolean {
  return product.category === "Device" || DEVICE_RE.test((product.key_ingredients ?? []).join(" "));
}

/**
 * Retinoid + retinoid = over-irritation.
 * Retinoid + AHA/BHA/PHA = over-exfoliation / barrier damage.
 * Acid + retinoid is the same conflict seen from the other side.
 * Acid + acid is intentionally allowed (many routines layer AHA/BHA).
 * Bakuchiol is intentionally NOT treated as a retinoid (gentle alternative).
 */
export function hasIngredientConflict(a: Product, b: Product): boolean {
  const aRetinoid = isRetinoid(a);
  const bRetinoid = isRetinoid(b);
  const aAcid = isExfoliatingAcid(a);
  const bAcid = isExfoliatingAcid(b);

  return (aRetinoid && (bRetinoid || bAcid)) || (aAcid && bRetinoid);
}
