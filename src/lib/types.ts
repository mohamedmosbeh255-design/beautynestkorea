export type ProductSource = "amazon" | "oliveyoung" | "both";

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  currency?: string;
  category: string;
  concern: string[]; // e.g. ["Acne", "Hydration"]
  skin_type: string[]; // e.g. ["Oily", "Dry", "Sensitive", "All"]
  key_ingredients: string[];
  image_urls: string[];
  amazon_url?: string | null;
  amazon_asin?: string | null;
  /** Effective ASIN: amazon_asin column, else derived from a full amazon_url. Null for short links. */
  asin?: string | null;
  oliveyoung_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  /**
   * Verified price-check timestamp (DB: price_checked_at). NULL = unknown →
   * the storefront must HIDE the price block entirely. Never derive this
   * from updated_at/created_at — those track edits, not price checks.
   */
  priceCheckedAt?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
  closing?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_time: string;
  date: string;
  image: string;
  content: string[];
  sections?: BlogSection[];
  disclaimer?: string;
  medicalNote?: string;
  shopPicks?: { label: string; href: string }[];
}

export const CONCERNS = ["Acne", "Anti-aging", "Hydration", "Brightening", "Sensitive", "Pores"] as const;
export const CATEGORIES = ["Cleanser", "Toner", "Serum", "Moisturizer", "Cream", "Sunscreen", "Mask", "Exfoliant", "Eye Care"] as const;
export const BRANDS = ["Beauty of Joseon", "COSRX", "Laneige", "Anua", "SKIN1004", "Round Lab", "Isntree", "Missha"] as const;
