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
  date: string;
}

export interface AdviceArticle extends AdviceMeta {
  body: string;
}

const ADVICE_DIR = path.join(process.cwd(), "content", "advice");

function parseMeta(data: Record<string, unknown>, fallbackSlug: string): AdviceMeta {
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  return {
    title: str(data.title, fallbackSlug),
    slug: str(data.slug, fallbackSlug),
    excerpt: str(data.excerpt),
    category: str(data.category, "Ingredients"),
    readTime: str(data.readTime, "5 min read"),
    image: str(data.image),
    date: str(data.date),
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
