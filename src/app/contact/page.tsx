import type { Metadata } from "next";
import Link from "next/link";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "How to reach BeautyNestKorea with questions about products or routines.",
  alternates: { canonical: `${siteBaseUrl()}/contact` },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Get in touch</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Contact Us</h1>

      <div className="glass mt-8 max-w-2xl rounded-[2rem] p-8 sm:p-10">
        <p className="leading-relaxed text-ink-soft">
          Email us directly:{" "}
          <a href="mailto:mohamedmosbeh255@gmail.com" className="font-semibold text-sage-700 hover:underline">
            mohamedmosbeh255@gmail.com
          </a>
        </p>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/" className="font-semibold text-sage-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
