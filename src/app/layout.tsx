import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { siteBaseUrl } from "@/lib/market-report";
import { organizationJsonLd } from "@/lib/schema";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = siteBaseUrl();
const defaultOgImage = `${siteUrl}/og-default.png`;

export const metadata: Metadata = {
  title: {
    default: "BeautyNestKorea — Discover K-Beauty & Global Skincare",
    template: "%s | BeautyNestKorea",
  },
  description:
    "Curated K-beauty & global skincare. Compare prices on Amazon vs Olive Young. Honest reviews, routines and bestsellers for acne, anti-aging & hydration.",
  keywords: ["K-beauty", "Korean skincare", "Olive Young", "Amazon skincare", "acne", "hydration", "anti-aging"],
  openGraph: {
    title: "BeautyNestKorea — Discover K-Beauty & Global Skincare",
    description: "Curated K-beauty bestsellers with Amazon & Olive Young price comparison.",
    type: "website",
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: "BeautyNestKorea — curated K-beauty & skincare" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(siteUrl)) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
