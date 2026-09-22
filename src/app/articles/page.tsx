import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedArticles } from "@/lib/articles";
import { siteBaseUrl } from "@/lib/market-report";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const base = siteBaseUrl();
  const title = "Skincare Guides & Articles";
  const description =
    "K-beauty routines, ingredient guides and honest skincare explainers from BeautyNestKorea — each guide links the exact products we recommend.";
  return {
    title,
    description,
    alternates: { canonical: `${base}/articles` },
    openGraph: { title, description, type: "website", images: [`${base}/og-default.png`] },
  };
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function ArticlesHubPage() {
  const articles = await getPublishedArticles();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Guides</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Skincare guides & articles</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
        Routines, ingredient breakdowns and K-beauty explainers — every guide ends with the exact products we recommend.
      </p>

      {articles.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center text-sm text-ink-soft">
          No guides published yet. Check back soon.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="glass group overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(95,138,84,0.35)]"
            >
              {a.cover_image_url && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={a.cover_image_url}
                    alt={a.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-600">{a.category}</p>
                <h2 className="font-serif-display mt-1 text-xl font-bold leading-snug group-hover:underline">{a.title}</h2>
                {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.excerpt}</p>}
                {formatDate(a.published_at) && (
                  <p className="mt-3 text-xs text-ink-soft">{formatDate(a.published_at)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
