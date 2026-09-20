import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface AdviceMeta {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  image: string;
  imageAlt?: string;
  date: string;
  headline?: string;
  dateModified?: string;
  faqSchema?: boolean;
}

export interface AdviceArticle extends AdviceMeta {
  body: string;
}

const ADVICE_DIR = path.join(process.cwd(), "content", "advice");

function parseMeta(data: Record<string, unknown>, fallbackSlug: string): AdviceMeta {
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const bool = (v: unknown) => v === true;
  return {
    title: str(data.title, fallbackSlug),
    slug: str(data.slug, fallbackSlug),
    excerpt: str(data.excerpt),
    category: str(data.category, "Ingredients"),
    readTime: str(data.readTime, "5 min read"),
    image: str(data.image),
    imageAlt: str(data.imageAlt) || undefined,
    date: str(data.date),
    headline: str(data.headline) || undefined,
    dateModified: str(data.dateModified) || undefined,
    faqSchema: bool(data.faqSchema),
  };
}

export function getAllAdvice(): AdviceMeta[] {
  if (!fs.existsSync(ADVICE_DIR)) return [];
  const files = fs.readdirSync(ADVICE_DIR).filter((f) => f.endsWith(".md"));
  const articles = files.map((file) => {
    const raw = fs.readFileSync(path.join(ADVICE_DIR, file), "utf8");
    const { data } = matter(raw);
    return parseMeta(data as Record<string, unknown>, file.replace(/\.md$/, ""));
  });
  // Newest first
  return articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getAdviceBySlug(slug: string): AdviceArticle | null {
  const filePath = path.join(ADVICE_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { ...parseMeta(data as Record<string, unknown>, slug), body: content };
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

/**
 * Extract Q/A pairs from a `## Frequently Asked Questions` section where each
 * entry is a `**Question?**` line followed by its answer paragraph(s).
 * Returns [] when the section is absent — callers decide whether to emit FAQPage.
 */
export function extractArticleFaqs(body: string): ArticleFaq[] {
  const section = body.split(/^## Frequently Asked Questions\s*$/m)[1];
  if (!section) return [];
  const cut = section.split(/^---\s*$/m)[0].split(/^## /m)[0];
  const faqs: ArticleFaq[] = [];
  const lines = cut.split("\n");
  let current: { question: string; answer: string[] } | null = null;
  const flush = () => {
    if (current && current.answer.join(" ").trim()) {
      faqs.push({ question: current.question, answer: current.answer.join(" ").trim() });
    }
    current = null;
  };
  for (const line of lines) {
    const q = line.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    if (q) {
      flush();
      current = { question: q[1].trim(), answer: q[2] ? [q[2].trim()] : [] };
    } else if (current && line.trim() !== "") {
      current.answer.push(line.trim());
    }
  }
  flush();
  return faqs;
}

/** Strip inline citation markers ([[12]]) for schema/plain-text use. */
export function stripFaqCitations(text: string): string {
  return text
    .replace(/(\[\[\d+\]\])+/g, "")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

export interface RoutinePick {
  slug: string;
  blurb: string;
}

/**
 * Split a "## Gentle Routine Picks" section (bullets `- [Label](/product/<slug>): "blurb"`)
 * out of an article body. Returns null when absent — those articles render untouched.
 */
export function splitRoutinePicks(body: string): { before: string; picks: RoutinePick[]; after: string } | null {
  const lines = body.split("\n");
  const headIdx = lines.findIndex((l) => l.trim() === "## Gentle Routine Picks");
  if (headIdx === -1) return null;
  const picks: RoutinePick[] = [];
  let i = headIdx + 1;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    const m = line.match(/^-\s*\[.+?\]\(\/product\/([a-z0-9-]+)\)\s*:+\s*"?(.*?)"?\s*$/);
    if (!m) break;
    picks.push({ slug: m[1], blurb: m[2] });
  }
  if (picks.length === 0) return null;
  return {
    before: lines.slice(0, headIdx).join("\n"),
    picks,
    after: lines.slice(i).join("\n"),
  };
}
