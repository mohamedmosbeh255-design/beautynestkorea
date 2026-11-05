// Hand-picked internal links shown at the end of a specific article.
// Only articles listed here render the "Related Articles" section, so
// existing guides keep their current layout untouched.
export interface RelatedArticle {
  title: string;
  href: string;
  excerpt: string;
}

const RELATED_ARTICLES: Record<string, RelatedArticle[]> = {
  "what-causes-blackheads": [
    {
      title: "How to Build a 10-Step Korean Routine for Beginners",
      href: "/advice/10-step-korean-routine-beginners",
      excerpt:
        "Master the art of layering with our beginner-friendly guide to the classic 10-step Korean skincare routine.",
    },
    {
      title: "Korean Skincare Routine for Oily, Acne-Prone Skin",
      href: "/articles/korean-skincare-routine-oily-acne-prone-skin",
      excerpt:
        "A practical Korean-inspired routine for oily, acne-prone skin: gentle cleansing, one targeted treatment, lightweight hydration and daily SPF.",
    },
    {
      title: "Sensitive Skin & Redness",
      href: "/advice/sensitive-skin-redness",
      excerpt:
        "A short, fragrance-free routine with barrier-supporting formulas can help reduce the appearance of redness and keep reactive skin comfortable.",
    },
    {
      title: "Chemical vs Mineral vs Hybrid Sunscreen: How to Choose",
      href: "/articles/chemical-vs-mineral-vs-hybrid-sunscreen",
      excerpt:
        "Learn what each filter family blocks, what \"hybrid\" means on a real label, and how to pick a sunscreen you will actually reapply.",
    },
  ],
};

export function getRelatedArticles(slug: string): RelatedArticle[] {
  return RELATED_ARTICLES[slug] ?? [];
}
