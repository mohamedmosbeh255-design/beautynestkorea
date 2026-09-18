import fs from "node:fs";
import path from "node:path";
import { getProducts } from "@/lib/products";
import { getAllConcernNames } from "@/lib/concerns";
import { MOCK_PRODUCTS } from "@/lib/data/products";
import { listReportDatesSync } from "@/lib/market-report";

// Build-time parser for docs/advice-kb.md (server only — never imported
// by client components). Educational content only; no medical claims.

export interface KbFaq {
  q: string;
  a: string;
}

export interface KbConcern {
  slug: string;
  title: string;
  explanation: string;
  blurb: string;
  ingredients: Array<{ name: string; desc: string }>;
  ingredientNames: string[];
  am: string[];
  pm: string[];
  avoid: string[];
  faqs: KbFaq[];
  productNames: string[];
  caveat: string;
}

export interface KbJsonEntry {
  slug: string;
  title: string;
  ingredients: string[];
  faq: string[];
  product_names: string[];
}

const KB_PATH = path.join(process.cwd(), "docs", "advice-kb.md");

// Banned medical-marketing words. Checked against the 10 concern sections
// ONLY (the Global disclaimer legitimately says what the KB does *not* do,
// and the JSON index carries no prose). A hit throws at build time so
// `next build` fails loudly instead of publishing the claim.
const BANNED: RegExp[] = [
  /\bcure\b/i,
  /\btreats\b/i,
  /\bheals\b/i,
  /\bfda-approved\b/i,
  /\beliminates\b/i,
  /\bdiagnoses\b/i,
  /removes permanently/i,
];

function lintBannedWords(slug: string, text: string): void {
  for (const re of BANNED) {
    const m = text.match(re);
    if (m && m.index !== undefined) {
      const at = Math.max(0, m.index - 40);
      throw new Error(
        `[advice-kb] banned word ${JSON.stringify(m[0])} in concern "${slug}" near: …${text.slice(at, m.index + 60)}…`
      );
    }
  }
}

function sectionLines(body: string, header: string): string[] {
  const start = body.indexOf(`- ${header}:`);
  if (start === -1) throw new Error(`[advice-kb] missing "- ${header}:" block`);
  const rest = body.slice(start).split("\n").slice(1);
  const out: string[] = [];
  for (const line of rest) {
    if (/^- \S/.test(line)) break; // next top-level block
    if (/^\s{2}- /.test(line)) out.push(line.replace(/^\s{2}- /, "").trim());
    else if (/^\s{2}\d+\. /.test(line)) out.push(line.replace(/^\s{2}\d+\. /, "").trim());
    else if (line.trim() === "") break;
  }
  return out;
}

function oneLine(body: string, header: string): string {
  const m = body.match(new RegExp(`^- ${header}:\\s*(.+)$`, "m"));
  if (!m) throw new Error(`[advice-kb] missing "- ${header}:" line`);
  return m[1].trim();
}

function parseFaqs(body: string): KbFaq[] {
  return sectionLines(body, "FAQ").map((line) => {
    const m = line.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
    if (!m) throw new Error(`[advice-kb] malformed FAQ line: ${line.slice(0, 60)}`);
    return { q: m[1].trim(), a: m[2].trim() };
  });
}

function parseConcern(slug: string, body: string, index: KbJsonEntry): KbConcern {
  lintBannedWords(slug, body);
  const explanation = oneLine(body, "Explanation");
  const ingredients = sectionLines(body, "Key ingredients").map((line) => {
    const i = line.indexOf(":");
    return i === -1 ? { name: line, desc: "" } : { name: line.slice(0, i).trim(), desc: line.slice(i + 1).trim() };
  });
  const am = sectionLines(body, "AM routine");
  const pm = sectionLines(body, "PM routine");
  const avoid = sectionLines(body, "Avoid");
  const faqs = parseFaqs(body);
  const productNames = sectionLines(body, "Product matches");
  const caveatMatch = body.match(/^- Educational only (.+)$/m);
  if (!explanation || !ingredients.length || !am.length || !pm.length || !faqs.length || !productNames.length || !caveatMatch) {
    throw new Error(`[advice-kb] concern "${slug}" is missing a required block`);
  }
  return {
    slug,
    title: index.title,
    explanation,
    blurb: explanation.length > 160 ? `${explanation.slice(0, 157).trimEnd()}…` : explanation,
    ingredients,
    ingredientNames: index.ingredients,
    am,
    pm,
    avoid,
    faqs,
    productNames,
    caveat: caveatMatch[1].trim(),
  };
}

let cache: { concerns: KbConcern[]; index: Record<string, KbJsonEntry> } | null = null;

/** Parse the KB (cached). Throws at build time on banned words / bad structure. */
export function getAdviceKb(): { concerns: KbConcern[]; index: Record<string, KbJsonEntry> } {
  if (cache) return cache;
  if (!fs.existsSync(KB_PATH)) throw new Error("[advice-kb] docs/advice-kb.md not found");
  const raw = fs.readFileSync(KB_PATH, "utf8");
  const fence = raw.indexOf("```json");
  if (fence === -1) throw new Error("[advice-kb] JSON index fence not found");
  const prose = raw.slice(0, fence);
  const index = JSON.parse(raw.slice(fence + "```json".length).split("```")[0]) as Record<string, KbJsonEntry>;
  const parts = prose.split(/^## /m).slice(1);
  const concerns: KbConcern[] = [];
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const slug = part.slice(0, nl).trim();
    if (slug === "Global disclaimer" || !index[slug]) continue;
    concerns.push(parseConcern(slug, part.slice(nl + 1), index[slug]));
  }
  if (concerns.length !== 10) throw new Error(`[advice-kb] expected 10 concerns, found ${concerns.length}`);
  cache = { concerns, index };
  return cache;
}

export function getConcernSlugs(): string[] {
  return getAdviceKb().concerns.map((c) => c.slug);
}

export function getConcernBySlug(slug: string): KbConcern | null {
  return getAdviceKb().concerns.find((c) => c.slug === slug) ?? null;
}

export interface ResolvedProduct {
  name: string;
  slug: string;
  brand: string;
}

/** Map KB product names to live catalog slugs. Unknown names are dropped and reported. */
export async function resolveConcernProducts(names: string[]): Promise<{ matched: ResolvedProduct[]; unknown: string[] }> {
  const live = await getProducts();
  const catalog = [...live, ...MOCK_PRODUCTS.filter((m) => !live.some((p) => p.slug === m.slug))];
  const byTitle = new Map(catalog.map((p) => [p.title.trim().toLowerCase(), p]));
  const matched: ResolvedProduct[] = [];
  const unknown: string[] = [];
  for (const name of names) {
    const hit = byTitle.get(name.trim().toLowerCase());
    if (hit) matched.push({ name, slug: hit.slug, brand: hit.brand });
    else unknown.push(name);
  }
  if (unknown.length > 0) {
    console.warn(`[advice-kb] dropped ${unknown.length} unknown product name(s): ${unknown.join(" | ")}`);
  }
  return { matched, unknown };
}

export interface ConcernSignal {
  date: string;
  matches: string[];
}

/** Latest report snapshot's trending ingredients ∩ concern ingredients. Read-only. */
export function getConcernSignal(ingredientNames: string[]): ConcernSignal | null {
  const dates = listReportDatesSync();
  if (dates.length === 0) return null;
  const date = dates[0];
  try {
    const snap = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "tools", "market-report", "reports", `${date}.json`), "utf8")
    ) as { ingredients?: Array<{ name?: string }>; newsIngredients?: Array<{ name?: string }> };
    const trending = [...(snap.ingredients ?? []), ...(snap.newsIngredients ?? [])]
      .map((i) => String(i?.name ?? ""))
      .filter(Boolean);
    // Fuzzy intersection: "Retinol" matches "Retinol / Retinoids", "AHA"
    // matches "Glycolic / AHA". Either direction, shorter side ≥3 chars.
    const wanted = ingredientNames.map((n) => n.toLowerCase());
    const hit = (t: string, w: string) =>
      t === w || (t.includes(w) && w.length >= 3) || (w.includes(t) && t.length >= 3);
    const seen = new Set<string>();
    const matches: string[] = [];
    for (const t of trending) {
      const tl = t.toLowerCase();
      if (seen.has(tl) || !wanted.some((w) => hit(tl, w))) continue;
      seen.add(tl);
      matches.push(t);
      if (matches.length >= 3) break;
    }
    return { date, matches };
  } catch {
    return null;
  }
}

// Product concern label → KB slug (for "related guides" links on product pages).
const CONCERN_LINK_RULES: Array<[RegExp, string]> = [  [/acne/i, "acne"],
  [/anti-aging|fine lines|wrinkles?|elasticity|aging/i, "anti-aging-fine-lines"],
  [/hydration|hydrating|dehydrat/i, "dehydration"],
  [/brightening|dark spots|pigmentation|dull/i, "hyperpigmentation-dark-spots"],
  [/sensitive/i, "sensitive-skin-redness"],
  [/redness/i, "sensitive-skin-redness"],
  [/blackheads/i, "blackheads"],
  [/pores?/i, "enlarged-pores"],
  [/oily|sebum|shine/i, "oily-skin-sebum-control"],
  [/barrier/i, "damaged-skin-barrier"],
];

/** Map a product's concern labels to KB slugs (unmapped labels are skipped). */
export function productConcernsToSlugs(concerns: string[]): Array<{ slug: string; title: string }> {
  const { concerns: kb } = getAdviceKb();
  const out: Array<{ slug: string; title: string }> = [];
  const seen = new Set<string>();
  for (const label of concerns) {
    const rule = CONCERN_LINK_RULES.find(([re]) => re.test(label));
    if (!rule) continue;
    const entry = kb.find((c) => c.slug === rule[1]);
    if (entry && !seen.has(entry.slug)) {
      seen.add(entry.slug);
      out.push({ slug: entry.slug, title: entry.title });
    }
  }
  return out;
}

// KB slug → /shop?concern= filter label. The link renders only when the
// filter actually exists in the live catalog (checked at build time).
const SHOP_FILTER_BY_SLUG: Record<string, string> = {
  acne: "Acne",
  "hyperpigmentation-dark-spots": "Brightening",
  dehydration: "Hydration",
  "anti-aging-fine-lines": "Anti-aging",
  "sensitive-skin-redness": "Sensitive",
  "enlarged-pores": "Pores",
};

/** Shop filter label for "Browse all {concern} products", or null when absent. */
export async function getConcernShopFilter(slug: string): Promise<string | null> {
  const wanted = SHOP_FILTER_BY_SLUG[slug];
  if (!wanted) return null;
  const names = getAllConcernNames(await getProducts());
  return names.includes(wanted) ? wanted : null;
}

// Reciprocal links between easily confused concerns (distinct angles,
// rendered as "Related guides" on each page).
const RELATED_CONCERNS: Record<string, string[]> = {
  blackheads: ["enlarged-pores", "oily-skin-sebum-control"],
  "enlarged-pores": ["blackheads", "oily-skin-sebum-control"],
  "oily-skin-sebum-control": ["blackheads", "enlarged-pores"],
};

/** Related concern guides for reciprocal internal linking. */
export function getRelatedConcerns(slug: string): Array<{ slug: string; title: string }> {
  const { concerns } = getAdviceKb();
  return (RELATED_CONCERNS[slug] ?? [])
    .map((s) => concerns.find((c) => c.slug === s))
    .filter((c): c is KbConcern => Boolean(c))
    .map((c) => ({ slug: c.slug, title: c.title }));
}
