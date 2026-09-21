import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Cap generated widths at 1080px: hero srcsets previously reached w=3840.
    deviceSizes: [640, 750, 828, 1080],
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "oliveyoung.com" },
      { protocol: "https", hostname: "**.oliveyoung.com" },
      { protocol: "https", hostname: "image.oliveyoung.co.kr" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // 301s for the 6 retired catalog slugs → closest live product (all verified live).
  // Served as literal HTTP 301s by src/middleware.ts (which runs for
  // /product/*); the mapping lives in src/lib/retired-slugs.ts — the single
  // source of truth also consumed by the sitemap exclusion:
  //   beauty-of-joseon-relief-sun → beauty-of-joseon-relief-sun-triple-set
  //   cosrx-snail-96-mucin → cosrx-6x-peptide-collagen-skin-booster-toner-serum
  //   anua-heartleaf-toner → anua-heartleaf-77-soothing-toner
  //   skin1004-madagascar-ampoule → skin1004-hyalu-cica-water-fit-sun-serum
  //   laneige-water-sleeping-mask → biodance-bio-collagen-real-deep-mask
  //   round-lab-dokdo-toner → round-lab-birch-juice-moisturizing-sunscreen
  //
  // Synonym concern slugs → canonical 'anti-aging' (308 Permanent Redirect).
  // No /category/* routes exist yet; these keep synonym URLs canonical
  // forever while the storefront merges 'elasticity'/'firming' tags into
  // Anti-aging at the data layer (src/lib/concerns.ts).
  async redirects() {
    return [
      { source: "/category/elasticity", destination: "/category/anti-aging", permanent: true },
      { source: "/category/firming", destination: "/category/anti-aging", permanent: true },
    ];
  },
};

export default nextConfig;
