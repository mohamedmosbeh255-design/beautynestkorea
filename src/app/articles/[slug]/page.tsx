import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticleBySlug, getPublishedArticles, getRelatedProducts } from "@/lib/articles";
import { siteBaseUrl } from "@/lib/market-report";
import { breadcrumbJsonLd } from "@/lib/schema";
import { isAffiliateDomainLink } from "@/lib/affiliates";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import ArticleTable, { ArticleTableCell, ArticleTableHead, ArticleTableHeader } from "@/components/ArticleTable";
import EducationalDisclaimer from "@/components/EducationalDisclaimer";
import ProductCard from "@/components/ProductCard";
import { ArrowLeft } from "lucide-react";

export const revalidate = 300;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const base = siteBaseUrl();
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  const description =
    article.excerpt ?? `${article.title} — a BeautyNestKorea skincare guide.`;
  return {
    title: article.title,
    description,
    alternates: { canonical: `${base}/articles/${slug}` },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.cover_image_url ? [article.cover_image_url] : [`${base}/og-default.png`],
    },
  };
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// In-body links: internal links stay plain (dofollow, pass equity);
// external links open in a new tab; affiliate domains carry
// rel="nofollow sponsored noopener" per site policy (outbound only).
function BodyLink({ href, children }: { href?: string; children?: ReactNode }) {
  const url = href ?? "";
  const cls =
    "font-medium text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600 hover:decoration-sage-500";
  if (url.startsWith("/") || url.startsWith("#")) {
    return (
      <Link href={url} className={cls}>
        {children}
      </Link>
    );
  }
  if (isAffiliateDomainLink(url)) {
    return (
      <a href={url} target="_blank" rel="nofollow sponsored noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener" className={cls}>
      {children}
    </a>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const base = siteBaseUrl();
  const canonical = `${base}/articles/${slug}`;
  const related = await getRelatedProducts(article.related_product_ids);
  const published = formatDate(article.published_at);
  const updated = formatDate(article.updated_at);
  const showUpdated = updated && updated !== published;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt ?? article.title,
      ...(article.cover_image_url ? { image: [article.cover_image_url] } : {}),
      author: {
        "@type": "Person",
        name: "Mohamed Mosbeh",
        jobTitle: "Founder & Beauty Curator",
        url: `${base}/author`,
      },
      publisher: { "@type": "Organization", name: "BeautyNestKorea", url: base },
      ...(article.published_at ? { datePublished: article.published_at } : {}),
      ...(article.updated_at ? { dateModified: article.updated_at } : {}),
      mainEntityOfPage: canonical,
    },
    breadcrumbJsonLd(base, [
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
      { name: article.title, path: `/articles/${slug}` },
    ]),
  ];

  return (
    <article className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">{article.category}</p>
      <h1 className="font-serif-display mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {article.title}
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        By{" "}
        <Link href="/author" className="font-semibold text-sage-700 hover:underline">
          Mohamed Mosbeh
        </Link>
        {published ? ` • ${published}` : ""}
        {showUpdated ? ` • Updated ${updated}` : ""}
      </p>
      {article.cover_image_url && (
        <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-3xl">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="h-auto w-full object-cover"
            sizes="(max-width: 1080px) 100vw, 1080px"
            priority
          />
        </div>
      )}
      {article.excerpt && (
        <p className="mt-6 text-base font-medium leading-relaxed text-ink sm:text-lg">{article.excerpt}</p>
      )}
      <div className="prose-beauty mt-6 space-y-5 text-[1rem] leading-relaxed text-ink/90 sm:text-[1.05rem]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: BodyLink,
            table: ArticleTable,
            thead: ArticleTableHead,
            th: ArticleTableHeader,
            td: ArticleTableCell,
            h2: ({ children }) => (
              <h2 className="font-serif-display scroll-mt-24 pt-4 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="font-serif-display scroll-mt-24 pt-2 text-lg font-bold tracking-tight text-ink sm:text-xl">
                {children}
              </h3>
            ),
            p: ({ children }) => <p className="text-ink-soft">{children}</p>,
            li: ({ children }) => <li className="text-ink-soft">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="rounded-r-2xl border-l-4 border-sage-300 bg-sage-50 px-4 py-4 text-[0.9rem] leading-relaxed text-sage-900 sm:px-5 sm:text-[0.95rem] [&>p]:my-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      <EducationalDisclaimer className="mt-10" />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif-display text-2xl font-bold tracking-tight">Recommended products</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Hand-picked for this guide — open a product to compare current retailer prices.
          </p>
          <AffiliateDisclosure className="mt-4" />
          <div className="mt-2 grid gap-6 sm:grid-cols-2">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Link
        href="/articles"
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>
    </article>
  );
}
