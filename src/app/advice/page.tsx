import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllAdvice } from "@/lib/advice";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Skincare Advice & Guides",
  description: "Evidence-based K-beauty guides: routines, ingredient breakdowns and honest explainers.",
};

export default function AdviceIndex() {
  const articles = getAllAdvice();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Journal</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Skincare advice</h1>
      <p className="mt-2 max-w-xl text-ink-soft">Routines, ingredient guides and honest explainers — written to rank and to help.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {articles.map((post) => (
          <Link key={post.slug} href={`/advice/${post.slug}`} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image src={post.image} alt={post.title} fill className="object-cover transition group-hover:scale-105" sizes="33vw" />
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{post.category} • {post.readTime} • {post.date}</p>
              <h2 className="font-serif-display mt-2 text-xl font-bold leading-snug">{post.title}</h2>
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
