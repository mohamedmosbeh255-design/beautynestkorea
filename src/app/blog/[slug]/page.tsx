import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug, BLOG_POSTS } from "@/lib/data/blog";
import { ArrowLeft, ArrowRight, Clock, ShoppingBag } from "lucide-react";

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">{post.category}</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
        <Clock className="h-4 w-4" /> {post.reading_time} • {post.date}
      </p>
      <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-3xl">
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="100vw" priority />
      </div>
      <div className="prose-beauty mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink/90">
        <p className="text-lg font-medium text-ink">{post.excerpt}</p>
        {post.content.map((para, i) => (
          <p key={i} className="text-ink-soft">{para}</p>
        ))}
        {post.sections?.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif-display pt-4 text-2xl font-bold tracking-tight text-ink">{section.heading}</h2>
            {section.paragraphs.map((para, i) => (
              <p key={i} className="mt-4 text-ink-soft">{para}</p>
            ))}
            {section.list && section.list.length > 0 && (
              <ul className="mt-4 space-y-3">
                {section.list.map((item, i) => (
                  <li key={i} className="flex gap-3 text-ink-soft">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.closing?.map((para, i) => (
              <p key={i} className="mt-4 text-ink-soft">{para}</p>
            ))}
          </section>
        ))}
      </div>
      {post.disclaimer && (
        <div className="glass mt-10 rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Please note</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{post.disclaimer}</p>
        </div>
      )}
      {post.shopPicks && post.shopPicks.length > 0 && (
        <div className="glass mt-10 rounded-3xl p-6 sm:p-8">
          <p className="flex items-center justify-center gap-2 font-serif-display text-lg font-bold">
            <ShoppingBag className="h-5 w-5 text-sage-600" /> Shop Our K-Beauty Picks
          </p>
          <p className="mt-1 text-center text-sm text-ink-soft">Hand-picked favorites — tap to compare live prices.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {post.shopPicks.map((pick) => (
              <Link
                key={pick.href}
                href={pick.href}
                className="group flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="leading-snug">{pick.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-sage-600 transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="glass mt-10 rounded-3xl p-6 text-center">
        <p className="font-serif-display text-lg font-bold">Ready to build your routine?</p>
        <p className="mt-1 text-sm text-ink-soft">Shop the products mentioned with live Amazon & Olive Young prices.</p>
        <Link href="/shop" className="mt-4 inline-flex rounded-full bg-ink px-7 py-3 text-sm font-bold text-white hover:bg-sage-700">
          Shop bestsellers
        </Link>
      </div>
    </article>
  );
}
