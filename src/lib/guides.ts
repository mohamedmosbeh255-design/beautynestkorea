import { getAllAdvice } from "@/lib/advice";
import { getPublishedArticles } from "@/lib/articles";

export interface HomeGuide {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  displayDate: string;
  image: string;
  imageAlt: string;
}

function toTime(value: string): number {
  const t = Date.parse(value ?? "");
  return Number.isNaN(t) ? 0 : t;
}

function displayDate(value: string): string {
  const t = toTime(value);
  if (!t) return "";
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function readTimeFor(content: string): string {
  const words = String(content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

// DB dates arrive as ISO timestamps; normalise to a plain YYYY-MM-DD so the
// merged feed sorts identically to the markdown `date` frontmatter.
function isoDate(value: string): string {
  const t = toTime(value);
  return t ? new Date(t).toISOString().slice(0, 10) : "";
}

/**
 * Homepage teaser: merges the markdown journal (/advice/*) with the DB-backed
 * guides (/articles/*), newest first. Every card keeps its ORIGINAL href —
 * this helper never rewrites, renames or canonicalises a URL.
 * Degrades to markdown-only if the DB read fails, so the homepage never blanks.
 */
export async function getLatestGuides(limit = 6): Promise<HomeGuide[]> {
  const staticGuides: HomeGuide[] = getAllAdvice().map((post) => ({
    key: `advice-${post.slug}`,
    href: `/advice/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readTime: post.readTime,
    date: post.date,
    displayDate: displayDate(post.date),
    image: post.image,
    imageAlt: post.imageAlt ?? post.title,
  }));

  let dbGuides: HomeGuide[] = [];
  try {
    const rows = await getPublishedArticles();
    dbGuides = rows.map((a) => {
      const date = isoDate(a.published_at ?? "");
      return {
        key: `article-${a.slug}`,
        href: `/articles/${a.slug}`,
        title: a.title,
        excerpt: a.excerpt ?? "",
        category: a.category,
        readTime: readTimeFor(a.content),
        date,
        displayDate: displayDate(date),
        image: a.cover_image_url ?? "",
        imageAlt: a.title,
      };
    });
  } catch {
    dbGuides = [];
  }

  return [...staticGuides, ...dbGuides]
    .sort((a, b) => toTime(b.date) - toTime(a.date))
    .slice(0, limit);
}
