import Link from "next/link";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { shiftDateStr, stripTitle, type WikiSnapshotView } from "@/lib/market-report";
import { isAmazonDpLink, withAmazonTag } from "@/lib/affiliates";
import { AFFILIATE_DISCLOSURE_TEXT } from "@/components/AffiliateDisclosure";
import ScrollableTable from "@/components/ScrollableTable";

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

/** Plain text of a cell (links collapse to their label; markup never leaks). */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    return nodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

interface TableParts {
  headers: string[];
  rows: ReactNode[][];
}

/** Pull header labels + body-cell nodes out of a rendered GFM table. Null when the shape is unexpected. */
function getTableParts(children: ReactNode): TableParts | null {
  // NOTE: thead/tbody/th/td render through custom components (function type),
  // so match structurally: collect every <tr> anywhere in the subtree.
  const trs: ReactNode[][] = [];
  const collect = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === "tr") {
        const cells: ReactNode[] = [];
        Children.forEach((child.props as { children?: ReactNode }).children, (cell) => {
          if (isValidElement(cell)) cells.push((cell.props as { children?: ReactNode }).children);
        });
        if (cells.length > 0) trs.push(cells);
      } else {
        collect((child.props as { children?: ReactNode }).children);
      }
    });
  };
  try {
    collect(children);
  } catch {
    return null;
  }
  if (trs.length < 2) return null;
  const headers = trs[0].map(nodeText);
  if (headers.every((h) => h === "")) return null;
  return { headers, rows: trs.slice(1) };
}

const isCommunityPosts = (headers: string[]) =>
  headers.some((h) => /score/i.test(h)) && headers.some((h) => /comment/i.test(h));

/**
 * Community "Top posts" table: full 7-column table on md+ (scrollable when it
 * overflows), stacked cards below md — title link preserved, Score/Comments
 * (and every other column) shown as meta lines so no data hides at any width.
 */
function CommunityPostsTable({
  headers,
  rows,
  original,
  fullWidth = false,
}: TableParts & { original: ReactNode; fullWidth?: boolean }) {
  const idx = (re: RegExp) => headers.findIndex((h) => re.test(h));
  const ti = idx(/title/i);
  const si = idx(/\bsub\b/i);
  const ii = idx(/ingredient/i);
  const bi = idx(/brand/i);
  const sci = idx(/score/i);
  const ci = idx(/comment/i);
  if (ti === -1 || sci === -1 || ci === -1) {
    return <ScrollableTable fullWidth={fullWidth}>{original}</ScrollableTable>;
  }
  return (
    <>
      <div className="hidden md:block">
        <ScrollableTable fullWidth={fullWidth}>{original}</ScrollableTable>
      </div>
      <ul className="space-y-3 md:hidden" data-testid="community-stacked">
        {rows.map((cells, r) => {
          const meta = [
            si !== -1 && nodeText(cells[si]) ? `r/${nodeText(cells[si])}` : null,
            `Score: ${nodeText(cells[sci]) || "n/a"}`,
            `Comments: ${nodeText(cells[ci]) || "n/a"}`,
          ].filter(Boolean) as string[];
          const extra = [
            ii !== -1 && nodeText(cells[ii]) && nodeText(cells[ii]) !== "—"
              ? `Ingredients: ${nodeText(cells[ii])}` : null,
            bi !== -1 && nodeText(cells[bi]) && nodeText(cells[bi]) !== "—"
              ? `Brands: ${nodeText(cells[bi])}` : null,
          ].filter(Boolean) as string[];
          return (
            <li key={r} className="rounded-2xl border border-sage-100 bg-white/60 px-4 py-3">
              <div className="text-sm font-semibold leading-snug text-ink">{cells[ti]}</div>
              <p className="mt-1.5 text-xs text-ink-soft">{meta.join(" · ")}</p>
              {extra.length > 0 && <p className="mt-1 text-xs text-ink-soft">{extra.join(" · ")}</p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ReportTable({ children, fullWidth = false }: { children?: ReactNode; fullWidth?: boolean }) {
  const parts = getTableParts(children);
  if (parts && isCommunityPosts(parts.headers)) {
    return <CommunityPostsTable headers={parts.headers} rows={parts.rows} original={children} fullWidth={fullWidth} />;
  }
  return <ScrollableTable fullWidth={fullWidth}>{children}</ScrollableTable>;
}

const baseMarkdownComponents = {
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
  table: ({ children }: { children?: ReactNode }) => <ReportTable fullWidth={false}>{children}</ReportTable>,
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

const WIKI_TABLE_RE = /^\| # \| Ingredient \| Views [^\n]*\n(?:\|[^\n]*\n?)+/m;

function fmtSigned(n: number | null): string {
  if (n === null) return "n/a";
  return n > 0 ? `+${n.toLocaleString("en-US")}` : n.toLocaleString("en-US");
}

function fmtPct(views: number | null, previous: number | null, delta: number | null): string | null {
  if (views === null || previous === null || delta === null || previous === 0) return null;
  return `${delta > 0 ? "+" : ""}${(Math.round((delta / previous) * 1000) / 10).toFixed(1)}%`;
}

function pctValue(v: WikiSnapshotView): number | null {
  if (v.views === null || v.previous === null || v.delta === null || v.previous === 0) return null;
  return Math.round((v.delta / v.previous) * 1000) / 10;
}

/**
 * Render-time only: replace a truncated ingredient table in stored markdown
 * with the complete table built from the report snapshot (all measured rows,
 * Δ% descending). Stored .md/.json files are never modified. Skips when the
 * markdown has no wiki table (e.g. v1.0 reports) or the snapshot is empty.
 */
export function withFullIngredientTable(
  markdown: string,
  reportDate: string,
  snapshot: WikiSnapshotView[] | null
): string {
  if (!snapshot || snapshot.length === 0) return markdown;
  const match = markdown.match(WIKI_TABLE_RE);
  if (!match) return markdown;
  // Reuse the stored table's own date labels (Views X / Prev day Y) so the
  // replacement can never mislabel the snapshot window.
  const labelMatch = match[0].match(/^\| # \| Ingredient \| ([^\n|]+) \| ([^\n|]+) \|/m);
  const latestLabel = labelMatch ? labelMatch[1].trim() : `Views ${shiftDateStr(reportDate, -1)}`;
  const prevLabel = labelMatch ? labelMatch[2].trim() : `Prev day ${shiftDateStr(reportDate, -2)}`;
  const rows = [...snapshot].sort((a, b) => {
    const pa = pctValue(a);
    const pb = pctValue(b);
    if (pa === null && pb === null) return (b.delta ?? 0) - (a.delta ?? 0);
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pb - pa || (b.delta ?? 0) - (a.delta ?? 0);
  });
  const lines = [
    `| # | Ingredient | ${latestLabel} | ${prevLabel} | Δ | Δ % |`,
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map((r, i) => {
      const pct = fmtPct(r.views, r.previous, r.delta);
      return `| ${i + 1} | ${r.name} | ${r.views === null ? "n/a" : r.views.toLocaleString("en-US")} | ${r.previous === null ? "n/a" : r.previous.toLocaleString("en-US")} | ${fmtSigned(r.delta)} | ${pct ?? "n/a"} |`;
    }),
    "",
    `_Complete table — all ${rows.length} measured ingredients (snapshot data)._`,
  ];
  return markdown.replace(WIKI_TABLE_RE, lines.join("\n"));
}

export default function MarketReportBody({
  markdown,
  reportDate,
  ingredientSnapshot = null,
  fullWidthTables = false,
}: {
  markdown: string;
  reportDate?: string;
  ingredientSnapshot?: WikiSnapshotView[] | null;
  fullWidthTables?: boolean;
}) {
  const body =
    reportDate && ingredientSnapshot
      ? withFullIngredientTable(stripTitle(markdown), reportDate, ingredientSnapshot)
      : stripTitle(markdown);
  const components = {
    ...baseMarkdownComponents,
    table: ({ children }: { children?: ReactNode }) => (
      <ReportTable fullWidth={fullWidthTables}>{children}</ReportTable>
    ),
  };
  return (
    <div className="space-y-5 text-[1rem] leading-relaxed text-ink/90 sm:text-[1.05rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {withAsinDisclosure(body)}
      </ReactMarkdown>
    </div>
  );
}
