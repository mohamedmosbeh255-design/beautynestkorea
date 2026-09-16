import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getAdviceBySlug, getAllAdvice } from "@/lib/advice";
import { siteBaseUrl } from "@/lib/market-report";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import { ArrowLeft } from "lucide-react";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export async function generateStaticParams() {
  return getAllAdvice().map((p) => ({ slug: p.slug }));
}

// Short SEO titles (≤60 chars, metadata only — on-page H1 keeps the full title).
const METADATA_TITLES: Record<string, string> = {
  "scars-vs-hyperpigmentation": "Scars vs Hyperpigmentation: How to Tell Them Apart",
  "what-is-pdrn-salmon-dna-kbeauty": "What Is PDRN? Salmon DNA in K-Beauty Explained",
  "10-step-korean-routine-beginners": "The 10-Step Korean Routine, Simplified",
  "niacinamide-vs-vitamin-c": "Niacinamide vs Vitamin C: Which Wins?",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getAdviceBySlug(slug);
  if (!post) return { title: "Not found" };
  const title = METADATA_TITLES[slug] ?? post.title;
  return {
    title,
    description: post.excerpt,
    alternates: { canonical: `${siteBaseUrl()}/advice/${slug}` },
    openGraph: { title, description: post.excerpt, images: post.image ? [post.image] : [] },
  };
}

// Shortened in-article jump anchors (e.g. #the-10-second-test) mapped to the
// full slugified heading ids so "jump to" links scroll to the right section.
const ANCHOR_ALIASES: Record<string, string> = {
  "the-10-second-test": "the-10-second-test-scar-or-dark-spot",
};

// Inline reference markers like [[9]][[23]] are plain-text citations, not
// links. Reading flow stays clean (Healthline/WebMD style): every marker is
// stripped from the rendered article — body and References section alike —
// so no numbers, brackets, or superscripts appear anywhere. The References
// section still lists each source by name for readers who want to verify.
function renderCitations(body: string): string {
  return body
    .replace(/(\[\[\d+\]\])+/g, "")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

function slugifyHeading(children: ReactNode): string {
  const text = String(children ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
  return text;
}

function InternalLink({ href, children, className }: { href?: string; children?: ReactNode; className?: string }) {
  const url = href ?? "";
  const linkClass =
    className ?? "font-medium text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600 hover:decoration-sage-500";
  if (url.startsWith("/")) {
    return (
      <Link href={url} className={linkClass}>
        {children}
      </Link>
    );
  }
  if (url.startsWith("#")) {
    const target = url.slice(1);
    const resolved = ANCHOR_ALIASES[target] ?? target;
    return (
      <a href={`#${resolved}`} className={linkClass}>
        {children}
      </a>
    );
  }
  return (
    <a href={url} className={className}>
      {children}
    </a>
  );
}

const markdownComponents = {
  a: InternalLink,
  // Medical-notice callout: amber left-border so the ⚕️ disclaimer stands out.
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="rounded-r-2xl border-l-4 border-amber-400 bg-amber-50 px-4 py-4 text-[0.9rem] leading-relaxed text-amber-900 sm:px-5 sm:text-[0.95rem] [&>p]:my-2">
      {children}
    </blockquote>
  ),
  details: ({ children }: { children?: ReactNode }) => (
    <details className="glass group rounded-2xl px-4 py-4 text-[0.95rem] sm:px-5 sm:text-[1rem] [&>summary]:cursor-pointer">
      {children}
    </details>
  ),
  summary: ({ children }: { children?: ReactNode }) => (
    <summary className="text-[0.95rem] font-semibold text-ink marker:text-sage-600 sm:text-[1rem]">
      {children}
    </summary>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-sage-100">
        <table className="w-full min-w-[560px] border-collapse text-sm">{children}</table>
      </div>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead className="bg-sage-50">{children}</thead>,
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border-b border-sage-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sage-700">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border-b border-sage-50 px-4 py-3 align-top text-ink-soft last:border-b-0">{children}</td>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 id={slugifyHeading(children)} className="font-serif-display scroll-mt-24 pt-4 text-xl font-bold tracking-tight text-ink sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children, className }: { children?: ReactNode; className?: string }) =>
    // Raw-HTML blocks (e.g. CTA boxes) keep their own classes.
    className ? (
      <h3 className={className}>{children}</h3>
    ) : (
      <h3 id={slugifyHeading(children)} className="font-serif-display scroll-mt-24 pt-2 text-lg font-bold tracking-tight text-ink sm:text-xl">
        {children}
      </h3>
    ),
  hr: () => <hr className="border-sage-100" />,
  img: ({ src, alt, className }: ComponentProps<"img">) => (
    // Markdown-body images: full-width, auto height, no layout shift on phones.
    // Raw-HTML images keep their own classes (e.g. inline figures).
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className={className ?? "h-auto w-full rounded-2xl"} loading="lazy" />
  ),
  p: ({ children, className }: ComponentProps<"p">) => (
    <p className={className ?? "text-ink-soft"}>{children}</p>
  ),
  li: ({ children }: ComponentProps<"li">) => <li className="text-ink-soft">{children}</li>,
};

export default async function AdviceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getAdviceBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <Link href="/advice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">{post.category}</p>
      <h1 className="font-serif-display mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {post.readTime} • {post.date}
      </p>
      {post.image && (
        <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-3xl">
          <Image src={post.image} alt={post.imageAlt ?? post.title} fill className="h-auto w-full object-cover" sizes="100vw" priority />
        </div>
      )}
      <div className="prose-beauty mt-8 space-y-5 text-[1rem] leading-relaxed text-ink/90 sm:text-[1.05rem]">
        <p className="text-base font-medium text-ink sm:text-lg">{post.excerpt}</p>
        <AffiliateDisclosure className="mt-0 border-y border-sage-100 py-3" />
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
          {renderCitations(post.body)}
        </ReactMarkdown>
      </div>
    </article>
  );
}
