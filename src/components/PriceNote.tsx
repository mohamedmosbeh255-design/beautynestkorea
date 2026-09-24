/**
 * Single shared price note for EVERY product display (cards, product page,
 * homepage, bestsellers, category grids, comparisons).
 *
 * WHY one component: the sentence used to be copy-pasted across ProductCard
 * and the product page, so wording drifted and new surfaces could miss it.
 * Every price display must render <PriceNote/> — the note can then never be
 * missing or worded differently anywhere.
 *
 * checkedDate = the product's verified last-checked stamp (already formatted
 * for display, e.g. "September 2026"). Absent → the same sentence without
 * the date clause. Renders text only (no wrapper), so call sites keep their
 * exact <p> styling — zero design change.
 */
export default function PriceNote({ checkedDate }: { checkedDate?: string | null }) {
  if (checkedDate) {
    return (
      <>
        Prices &amp; ratings as of {checkedDate} · may change anytime on Amazon &amp; Olive Young · check
        the retailer for current info
      </>
    );
  }
  return (
    <>
      Prices &amp; ratings may change anytime on Amazon &amp; Olive Young · check the retailer for current info
    </>
  );
}
