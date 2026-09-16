import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripTitle } from "@/lib/market-report";
import { isAmazonDpLink, withAmazonTag } from "@/lib/affiliates";
import { AFFILIATE_DISCLOSURE_TEXT } from "@/components/AffiliateDisclosure";

function slugifyHeading(children: ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((c) => String(c ?? "")).join("")
    : String(children ?? "");
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const url = href ?? "";
    if (url.startsWith("/")) {
      return (
        <Link
          href={url}
          className="font-medium text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600 hover:decoration-sage-500"
        >
          {children}
        </Link>
      );
    }
    // Amazon /dp/ watchlist links earn via the Associates tag; all other
    // outbound hrefs (Reddit, Trends, curation links, …) pass through byte-identical.
    if (isAmazonDpLink(url)) {
      return (
        <a
          href={withAmazonTag(url)}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="font-medium text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600 hover:decoration-sage-500"
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-medium text-sage-700 underline decoration-sage-300 underline-offset-2 transition hover:text-sage-600 hover:decoration-sage-500"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="rounded-r-2xl border-l-4 border-sage-400 bg-sage-50 px-4 py-4 text-[0.9rem] leading-relaxed text-sage-800 sm:px-5 sm:text-[0.95rem] [&>p]:my-2">
      {children}
    </blockquote>
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
    <h2
      id={slugifyHeading(children)}
      className="font-serif-display scroll-mt-24 pt-4 text-xl font-bold tracking-tight text-ink sm:text-2xl"
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3
      id={slugifyHeading(children)}
      className="font-serif-display scroll-mt-24 pt-2 text-lg font-bold tracking-tight text-ink sm:text-xl"
    >
      {children}
    </h3>
  ),
  hr: () => <hr className="border-sage-100" />,
  p: ({ children }: ComponentProps<"p">) => <p className="text-ink-soft">{children}</p>,
  li: ({ children }: ComponentProps<"li">) => <li className="text-ink-soft">{children}</li>,
  em: ({ children }: { children?: ReactNode }) => <em className="text-sm text-ink-soft/80">{children}</em>,
};

/**
 * Render-time only (report .md sources stay untouched): insert the commission
 * disclosure immediately above the ASIN watchlist table, if present.
 */
function withAsinDisclosure(markdown: string): string {
  if (markdown.includes("may earn a commission from links on this page")) return markdown;
  return markdown.replace(
    /(\n\| ASIN \|)/,
    `\n\n_${AFFILIATE_DISCLOSURE_TEXT}_\n$1`
  );
}

export default function MarketReportBody({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-5 text-[1rem] leading-relaxed text-ink/90 sm:text-[1.05rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {withAsinDisclosure(stripTitle(markdown))}
      </ReactMarkdown>
    </div>
  );
}
