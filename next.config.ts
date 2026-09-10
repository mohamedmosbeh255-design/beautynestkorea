import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;
