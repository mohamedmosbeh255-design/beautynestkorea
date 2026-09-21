import type { Metadata } from "next";
import Script from "next/script";
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
const gaId = process.env.NEXT_PUBLIC_GA_ID || "";

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
  verification: { google: "yfQq38bdrPGptdm_SqzvdEAoyrnKZSS0ZhIZnloDV04" },
  other: { "p:domain_verify": "2dd404afc8953165872d74190937dce5" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full`}>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-config" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}
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
