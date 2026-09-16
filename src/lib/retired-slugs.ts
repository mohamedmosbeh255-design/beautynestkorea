/**
 * Single source of truth for retired catalog slugs.
 *
 * Retired slug → closest live product (targets verified against Supabase):
 *   beauty-of-joseon-relief-sun  → beauty-of-joseon-relief-sun-triple-set (same sunscreen line, triple set)
 *   cosrx-snail-96-mucin         → cosrx-6x-peptide-collagen-skin-booster-toner-serum (COSRX serum/essence step)
 *   anua-heartleaf-toner         → anua-heartleaf-77-soothing-toner (exact product, current slug)
 *   skin1004-madagascar-ampoule  → skin1004-hyalu-cica-water-fit-sun-serum (only live SKIN1004, centella serum)
 *   laneige-water-sleeping-mask  → biodance-bio-collagen-real-deep-mask (overnight hydrating mask)
 *   round-lab-dokdo-toner        → round-lab-birch-juice-moisturizing-sunscreen (only live Round Lab)
 */
export const RETIRED_REDIRECTS: Array<{ source: string; destination: string }> = [
  { source: "beauty-of-joseon-relief-sun", destination: "beauty-of-joseon-relief-sun-triple-set" },
  { source: "cosrx-snail-96-mucin", destination: "cosrx-6x-peptide-collagen-skin-booster-toner-serum" },
  { source: "anua-heartleaf-toner", destination: "anua-heartleaf-77-soothing-toner" },
  { source: "skin1004-madagascar-ampoule", destination: "skin1004-hyalu-cica-water-fit-sun-serum" },
  { source: "laneige-water-sleeping-mask", destination: "biodance-bio-collagen-real-deep-mask" },
  { source: "round-lab-dokdo-toner", destination: "round-lab-birch-juice-moisturizing-sunscreen" },
];

export const RETIRED_PRODUCT_SLUGS: ReadonlySet<string> = new Set(RETIRED_REDIRECTS.map((r) => r.source));

export function getRetiredRedirect(slug: string): string | null {
  return RETIRED_REDIRECTS.find((r) => r.source === slug)?.destination ?? null;
}
