/**
 * GA4 event helper (client only). No-ops when gtag is absent (previews,
 * local dev without an ID, ad-blockers). Uses beacon transport so the event
 * is sent even when the click navigates away immediately.
 */
export function trackAffiliateClick(args: {
  retailer: string;
  product_slug: string;
  page_path?: string;
}): void {
  try {
    if (typeof window === "undefined") return;
    const gtag = (window as unknown as { gtag?: (...params: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;
    gtag("event", "affiliate_click", {
      retailer: args.retailer,
      product_slug: args.product_slug,
      page_path: args.page_path ?? window.location.pathname,
      transport_type: "beacon",
    });
  } catch {
    // analytics must never break navigation
  }
}
