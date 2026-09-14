import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/blog/scars-vs-dark-spots-pih-kbeauty-routine",
        destination: "/advice/scars-vs-hyperpigmentation",
        permanent: true,
      },
    ];
  },
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
