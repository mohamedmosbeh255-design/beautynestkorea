import type { Product } from "@/lib/types";
import type { AdviceArticle } from "@/lib/advice";

/** ISO 4217 currency code from the stored symbol (schema.org requires a code). */
export function priceCurrencyCode(currency?: string | null): string {
  switch ((currency ?? "$").trim()) {
    case "€":
      return "EUR";
    case "₩":
      return "KRW";
    case "£":
      return "GBP";
    case "¥":
      return "JPY";
    default:
      return "USD";
  }
}

/** ASIN from a full Amazon product URL (shortened amzn.to links carry none). */
export function extractAsin(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/)([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function productJsonLd(product: Product, base: string, canonical: string) {
  const asin = extractAsin(product.amazon_url);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.slice(0, 500),
    brand: { "@type": "Brand", name: product.brand },
    ...(product.image_urls.length > 0 ? { image: product.image_urls.slice(0, 4) } : {}),
    ...(asin ? { sku: asin } : {}),
    ...(product.rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.review_count ?? 0,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: priceCurrencyCode(product.currency),
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(
  post: AdviceArticle,
  base: string,
  canonical: string,
  authorUrl: string,
  overrides?: { headline?: string; dateModified?: string; authorName?: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: overrides?.headline || post.title,
    description: post.excerpt,
    ...(post.image ? { image: [post.image] } : {}),
    author: { "@type": "Organization", name: overrides?.authorName || "BeautyNestKorea", url: authorUrl },
    publisher: { "@type": "Organization", name: "BeautyNestKorea" },
    datePublished: post.date,
    dateModified: overrides?.dateModified || post.date,
    mainEntityOfPage: canonical,
  };
}

export function breadcrumbJsonLd(base: string, trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${base}${t.path}`,
    })),
  };
}

export function organizationJsonLd(base: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BeautyNestKorea",
      url: base,
      sameAs: [
        "https://www.facebook.com/mohamed.mosbeh.508798/",
        "https://www.instagram.com/beautynest_k_beauty_expert/",
        "https://fr.pinterest.com/beautynest_skincare/",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BeautyNestKorea",
      url: base,
    },
  ];
}
