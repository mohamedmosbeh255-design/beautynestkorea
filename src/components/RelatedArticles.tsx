import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRelatedArticles } from "@/lib/related-articles";

// End-of-article internal links. Reuses the Recommended products card shell
// (glass card, rounded-3xl, hover lift) so the section matches the existing
// page rhythm without altering the article body itself.
export default function RelatedArticles({ slug }: { slug: string }) {
  const articles = getRelatedArticles(slug);
  if (articles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-serif-display text-2xl font-bold tracking-tight">Related Articles</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="glass group flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(95,138,84,0.35)]"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-600">Guide</p>
              <h3 className="font-serif-display mt-1 text-lg font-semibold leading-snug">{article.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{article.excerpt}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition group-hover:bg-sage-600">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
