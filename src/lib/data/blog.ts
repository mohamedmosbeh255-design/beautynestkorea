import type { BlogPost } from "@/lib/types";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "10-step-korean-routine-beginners",
    title: "The 10-Step Korean Routine, Simplified for Beginners",
    excerpt: "You don't need all 10 steps. Here's the minimalist K-beauty routine that actually works — cleanser, toner, serum, moisturizer, SPF.",
    category: "Routines",
    reading_time: "7 min read",
    date: "2026-08-20",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    content: [
      "The famous 10-step Korean skincare routine is more philosophy than prescription: layer lightweight hydration, protect your barrier, and never skip sunscreen.",
      "For beginners, start with five essentials: an oil cleanser at night, a gentle water cleanser, a hydrating toner, a treatment serum for your main concern, and moisturizer plus SPF in the morning.",
      "Introduce one new product every 1–2 weeks so you can tell what actually works. Patch-test on your jawline first, especially with actives like vitamin C or exfoliating acids.",
      "Our top affordable starter picks: Anua Heartleaf Toner for calming, COSRX Snail Mucin for repair, Beauty of Joseon Relief Sun for daily SPF — all linked on our shop page with Amazon and Olive Young options.",
    ],
  },
  {
    slug: "niacinamide-vs-vitamin-c",
    title: "Niacinamide vs Vitamin C: Which Brightening Ingredient Wins?",
    excerpt: "Both brighten and fade dark spots — but they work differently. Dermat-backed guide to choosing (or combining) them.",
    category: "Ingredients",
    reading_time: "5 min read",
    date: "2026-08-12",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
    content: [
      "Niacinamide (vitamin B3) regulates oil, minimizes pores and fades hyperpigmentation gently — suitable for almost all skin types, including sensitive.",
      "Vitamin C (L-ascorbic acid and derivatives) is a stronger antioxidant brightener but can irritate sensitive skin and oxidize quickly if poorly formulated.",
      "Can you use both? Yes — apply vitamin C in the morning under sunscreen, niacinamide morning or night. If irritation occurs, alternate days.",
      "Look for niacinamide at 4–10% and vitamin C derivatives like SAP/MAP if pure ascorbic acid stings your skin.",
    ],
  },
  {
    slug: "acne-safe-kbeauty-picks",
    title: "7 Acne-Safe K-Beauty Picks That Won't Clog Pores",
    excerpt: "Heartleaf, centella and snail mucin: gentle Korean formulas that calm breakouts without stripping your barrier.",
    category: "Acne",
    reading_time: "6 min read",
    date: "2026-07-30",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80",
    content: [
      "Acne-prone skin needs calm, not combat. Harsh scrubs and high-alcohol toners damage the barrier and trigger more oil production.",
      "Heartleaf and centella asiatica are the hero calming ingredients in Anua and SKIN1004 bestsellers — anti-inflammatory and barrier-friendly.",
      "Snail mucin looks sticky but is non-comedogenic and excellent for fading post-acne marks while keeping skin hydrated.",
      "Shop our Acne concern filter to compare prices on Amazon vs Olive Young — Olive Young often wins for variety packs and limited editions.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
