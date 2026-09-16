import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDollarSign } from "lucide-react";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "FTC-compliant affiliate disclosure: how BeautyNestKorea earns commissions from Amazon Associates and other affiliate programs at no extra cost to you.",
  alternates: { canonical: `${siteBaseUrl()}/disclosure` },
};

export default function DisclosurePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Transparency</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">
        Affiliate Disclosure
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Last updated: {new Date().getFullYear()} — In plain English: when you buy
        through links on BeautyNestKorea, we may earn a commission at no extra cost to you.
      </p>

      <div className="glass mt-8 rounded-[2rem] p-8 sm:p-12">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
          <BadgeDollarSign className="h-5 w-5" />
        </span>
        <h2 className="font-serif-display mt-4 text-2xl font-bold">How affiliate links work here</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          <p>
            BeautyNestKorea is a reader-supported affiliate blog. Many outbound
            links — including product buttons to Amazon and Olive Young — are
            affiliate links. If you click one and make a purchase, the retailer
            pays us a small commission. The price you pay stays exactly the same.
          </p>
          <p>
            We participate in the <strong className="font-semibold text-ink">Amazon Associates Program</strong> as
            well as other affiliate programs (including Olive Young and partner
            networks where applicable). As an Amazon Associate, we earn from
            qualifying purchases.
          </p>
          <p>
            These commissions support our independent testing, price comparisons
            and free guides. They never decide what we recommend: products earn a
            spot because of formula, skin-type fit and value — not commission rate.
            If a product disappoints us, we say so or remove it.
          </p>
          <p>
            Per FTC guidelines, assume every shopping link on this site may be an
            affiliate link. Product prices and availability shown on retailer sites
            apply at the time of purchase and may differ from what is displayed here.
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Questions about our recommendations?{" "}
        <Link href="/contact" className="font-semibold text-sage-700 hover:underline">
          Contact us
        </Link>{" "}
        or learn more{" "}
        <Link href="/about" className="font-semibold text-sage-700 hover:underline">
          about how we test
        </Link>
        .
      </p>
    </div>
  );
}
