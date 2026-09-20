/**
 * Site author entities. BRAND_AUTHOR is the byline behind advice articles:
 * the BeautyNestKorea Editorial Team writing as the brand organization.
 * Individual-staff bylines are a future (P3) concern — not this file.
 */
export interface BrandAuthor {
  name: "BeautyNestKorea";
  type: "Organization";
  medicallyReviewed: false;
}

export const BRAND_AUTHOR: BrandAuthor = {
  name: "BeautyNestKorea",
  type: "Organization",
  medicallyReviewed: false,
};
