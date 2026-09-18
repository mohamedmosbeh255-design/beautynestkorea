import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllAdvice } from "@/lib/advice";
import { getAdviceKb } from "@/lib/advice-kb";
import { siteBaseUrl } from "@/lib/market-report";
import { ArrowRight } from "lucide-react";
import AdviceHubClient from "@/components/AdviceHubClient";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import ConcernFinder from "@/components/ConcernFinder";
import EducationalDisclaimer from "@/components/EducationalDisclaimer";

export const metadata: Metadata = {
  title: "Skincare Advice & Guides",
  description:
    "Find your concern — acne, dark spots, dehydration, fine lines and more. Routines, ingredients and FAQs plus in-depth K-beauty guides.",
  alternates: { canonical: `${siteBaseUrl()}/advice` },
};

export default function AdviceIndex() {
  const articles = getAllAdvice();
  const { concerns } = getAdviceKb();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Journal</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Skincare advice</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Pick a concern for a routine-first guide, or read an in-depth explainer below.
      </p>
      <AffiliateDisclosure className="mt-3 max-w-xl" />

      <AdviceHubClient
        concerns={concerns.map((c) => ({
          slug: c.slug,
          title: c.title,
          blurb: c.blurb,
          ingredientNames: c.ingredientNames,
        }))}
      />

      <ConcernFinder />

      <EducationalDisclaimer className="mt-8 max-w-3xl" />

      <div className="mt-12 flex items-end justify-between">
        <h2 className="font-serif-display text-2xl font-bold tracking-tight sm:text-3xl">In-depth guides</h2>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {articles.map((post) => (
          <Link key={post.slug} href={`/advice/${post.slug}`} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image src={post.image} alt={post.imageAlt ?? post.title} fill className="object-cover transition group-hover:scale-105" sizes="33vw" />
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{post.category} • {post.readTime} • {post.date}</p>
              <h3 className="font-serif-display mt-2 text-xl font-bold leading-snug">{post.title}</h3>
              <p className="mt-2 text-sm text-ink-soft clamp-3">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700">
                Read guide <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
