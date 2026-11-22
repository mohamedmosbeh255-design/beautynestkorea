/**
 * Curated "Winter essentials" quick filter for /shop.
 *
 * This is an EDITORIAL list (dryness / barrier-repair / dehydration picks),
 * deliberately kept out of the concern system:
 * - no "Winter" concern tag → no new /category/* URL, no sitemap entry,
 *   no middleware change, no thin category page competing with indexed pages.
 * - filtering happens client-side inside the existing /shop route.
 *
 * Update these slugs when the winter edit changes. Products that are inactive
 * or deleted simply never render (the catalog is already filtered upstream).
 */
export const WINTER_PICK_SLUGS: ReadonlySet<string> = new Set([
  // Cleansers
  "cerave-hydrating-facial-cleanser-16oz",
  "la-roche-posay-toleriane-hydrating-gentle-facial-cleanser",
  // Barrier / moisturizers
  "la-roche-posay-cicaplast-balm-b5",
  "cerave-moisturizing-cream-19oz",
  "aquaphor-healing-ointment",
  "vaseline-petroleum-jelly-original",
  "okeeffes-working-hands-hand-cream",
  "first-aid-beauty-ultra-repair-cream",
  "purito-mighty-bamboo-panthenol-cream-100ml",
  "aestura-atobarrier365-cream-comparison",
  "dr-althea-345-relief-cream-duo",
  // Overnight masks / lips
  "biodance-hydro-cera-nol-real-deep-mask",
  "cosrx-ultimate-nourishing-rice-overnight-spa-mask",
  "laneige-lip-sleeping-mask-ex-berry-20g",
  // Winter SPF
  "eltamd-uv-daily-broad-spectrum-spf-40",
]);

export function isWinterPick(slug: string): boolean {
  return WINTER_PICK_SLUGS.has(slug);
}
