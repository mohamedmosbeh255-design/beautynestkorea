/**
 * Content-strategy intelligence (v2 phase 1) — READ-ONLY.
 *
 *   node src/strategy.mjs [--date YYYY-MM-DD]
 *
 * Reads ONE existing report snapshot (tools/market-report/reports/<date>.json),
 * the advice library (content/advice/*.md) and the product catalog, then prints
 * a single markdown strategy report to stdout. It never writes content files,
 * never invents traffic numbers (score + trend direction only), and makes zero
 * Amazon requests. Catalog access is read-only; without credentials the brand
 * cross-reference degrades to "unknown" instead of guessing.
 *
 * Sections: URGENT CONTENT GAPS / DEPTH ANALYSIS / BRAND MOMENTUM / PRIORITY MATRIX.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRANDS, INGREDIENTS } from './lib/terms.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(TOOL_ROOT, '..', '..');
const REPORTS_DIR = join(TOOL_ROOT, 'reports');
const ADVICE_DIR = join(REPO_ROOT, 'content', 'advice');

/** Latest snapshot date (YYYY-MM-DD) present in reports/. */
function latestSnapshotDate() {
  const files = readdirSync(REPORTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error('no report snapshots found');
  return files[files.length - 1].replace(/\.json$/, '');
}

function loadSnapshot(date) {
  return JSON.parse(readFileSync(join(REPORTS_DIR, `${date}.json`), 'utf8'));
}

function countMap(list, key = 'name', val = 'count') {
  const m = new Map();
  for (const item of list || []) {
    if (item && typeof item[key] === 'string') m.set(item[key], Number(item[val]) || 0);
  }
  return m;
}

/** Percentage change with zero/unknown guards (null = not computable). */
function pctChange(views, previous) {
  if (views === null || views === undefined || !previous) return null;
  return Math.round(((views - previous) / previous) * 1000) / 10;
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive whole-phrase hits of any alias in text. */
function aliasHits(text, aliases) {
  let n = 0;
  for (const a of aliases) {
    const re = new RegExp(`\\b${escRe(a)}\\b`, 'gi');
    const m = text.match(re);
    if (m) n += m.length;
  }
  return n;
}

/** Read the catalog (read-only). Null when no credentials resolve. */
async function loadCatalog() {
  const env = { ...process.env };
  try {
    if ((!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && existsSync(join(REPO_ROOT, '.env.local'))) {
      for (const line of readFileSync(join(REPO_ROOT, '.env.local'), 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#') || !t.includes('=')) continue;
        const i = t.indexOf('=');
        const k = t.slice(0, i).trim();
        if ((k === 'NEXT_PUBLIC_SUPABASE_URL' || k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') && !env[k]) {
          env[k] = t.slice(i + 1).trim();
        }
      }
    }
  } catch { /* read-only probe only */ }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const res = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/products?select=slug,title,brand&is_active=eq.true&order=slug`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

function readAdviceFiles() {
  return readdirSync(ADVICE_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace(/\.md$/, ''), text: readFileSync(join(ADVICE_DIR, f), 'utf8') }));
}

// Keyword lenses for "which angles exist" (no LLM, all visible in the report).
const ANGLES = {
  routine: ['routine', ' am ', ' pm ', 'morning', 'night', 'step-by-step', 'how to use', 'how often'],
  safety: ['patch-test', 'patch test', 'irritat', 'sensitive', 'pregnancy', 'breastfeeding', 'warning', 'side effect'],
  comparison: [' vs ', 'versus', 'better than', 'difference between', 'comparison'],
  evidence: ['study', 'studies', 'research', 'evidence', 'clinical', 'dermatologist'],
  shopping: ['/product/', '/shop?', 'price', 'buy', 'where to buy'],
};

async function main() {
  const args = process.argv.slice(2);
  const di = args.indexOf('--date');
  const date = di !== -1 && args[di + 1] ? args[di + 1] : latestSnapshotDate();
  const snap = loadSnapshot(date);

  const reddit = countMap(snap.ingredients);
  const news = countMap(snap.newsIngredients);
  const wiki = new Map((snap.wikiViews || []).map((w) => [w.name, w]));

  // 1) Weighted score per ingredient (union of all three signals).
  const names = new Set([...reddit.keys(), ...news.keys(), ...wiki.keys()]);
  const scored = [];
  for (const name of names) {
    const r = reddit.get(name) || 0;
    const nw = news.get(name) || 0;
    const w = wiki.get(name);
    const pct = w ? pctChange(w.views ?? null, w.previous ?? null) : null;
    const score = Math.round((r * 2 + nw * 1.5 + (pct ?? 0) * 0.5) * 10) / 10;
    const delta = w && typeof w.delta === 'number' ? w.delta : null;
    const direction = delta === null ? (score > 0 ? 'up' : score < 0 ? 'down' : 'flat') : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    scored.push({ name, score, direction, reddit: r, news: nw, pct, views: w?.views ?? null });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  // Advice library scan (keyword-based, files + counts recorded).
  const articles = readAdviceFiles();
  const lower = articles.map((a) => ({ slug: a.slug, text: a.text.toLowerCase(), title: a.text.split('\n')[0] }));
  const coverage = new Map();
  for (const s of scored) {
    const aliases = INGREDIENTS[s.name] || [s.name.toLowerCase()];
    let hits = 0;
    const files = [];
    let inTitle = false;
    for (const a of lower) {
      const n = aliasHits(a.text, aliases);
      if (n > 0) {
        hits += n;
        files.push(a.slug);
        if (aliasHits(a.title.toLowerCase(), aliases) > 0 || a.slug.includes(s.name.toLowerCase().split(' ')[0])) inTitle = true;
      }
    }
    const level = inTitle || hits >= 5 ? 'full' : hits >= 1 ? 'partial' : 'missing';
    coverage.set(s.name, { level, hits, files });
  }

  // 2) Depth analysis inputs: angle lenses per partially-covered ingredient.
  const catalog = await loadCatalog();
  const catalogByBrand = new Map();
  if (catalog) {
    for (const p of catalog) {
      const b = String(p.brand || '').toLowerCase();
      if (!b) continue;
      if (!catalogByBrand.has(b)) catalogByBrand.set(b, []);
      catalogByBrand.get(b).push(p.slug);
    }
  }

  // 3) Brand momentum: news headline mentions (lexicon-matched) + reddit counts.
  const headlines = snap.newsHeadlines || [];
  const newsBrands = [];
  for (const [brand, aliases] of Object.entries(BRANDS)) {
    let h = 0;
    for (const t of headlines) {
      if (aliasHits(String(t).toLowerCase(), aliases) > 0) h++;
    }
    const r = (snap.brands || []).find((b) => b.name === brand)?.count || 0;
    if (h > 0 || r > 0) {
      const slugs = catalog ? (catalogByBrand.get(brand.toLowerCase()) || []) : null;
      newsBrands.push({ brand, news: h, reddit: r, slugs });
    }
  }
  newsBrands.sort((a, b) => (b.news + b.reddit) - (a.news + a.reddit) || a.brand.localeCompare(b.brand));

  // 4) Priority matrix.
  const highCount = Math.max(1, Math.ceil(scored.length / 3));
  const highSet = new Set(scored.slice(0, highCount).map((s) => s.name));
  const matrix = scored.map((s) => {
    const cov = coverage.get(s.name);
    const tier = highSet.has(s.name) ? (cov.level === 'missing' ? 'P1' : cov.level === 'partial' ? 'P2' : 'P3') : 'P3';
    return { ...s, coverage: cov.level, hits: cov.hits, files: cov.files, tier };
  });

  // ---- Render: one markdown report, score + direction only, no invented volumes.
  const L = [];
  L.push(`# Content Strategy — ${date}`);
  L.push('');
  L.push(`_Source snapshot: tools/market-report/reports/${date}.json · ${scored.length} ingredients scored · catalog: ${catalog ? `${catalog.length} live products` : 'unavailable (no credentials — cross-refs marked unknown)'} · no paid APIs · no Amazon requests_`);
  L.push('');
  L.push('## URGENT CONTENT GAPS');
  L.push('');
  const p1 = matrix.filter((m) => m.tier === 'P1');
  if (!p1.length) {
    L.push('None — every high-scoring ingredient already has at least partial coverage.');
  } else {
    for (const m of p1) {
      const place = m.files.length ? m.files.slice(0, 3).map((f) => `/advice/${f}`).join(', ') : 'new article';
      L.push(`- **${m.name}** — score ${m.score} (${m.direction}) · coverage: missing · action: publish a routine-first guide before the signal cools · placement: ${place}`);
    }
  }
  L.push('');
  L.push('## DEPTH ANALYSIS');
  L.push('');
  const partials = matrix.filter((m) => m.coverage === 'partial');
  if (!partials.length) {
    L.push('No partially-covered ingredients — the library is either silent or thorough on everything scored.');
  } else {
    for (const m of partials) {
      const files = lower.filter((a) => m.files.includes(a.slug));
      const existing = [];
      const absent = [];
      for (const [angle, keys] of Object.entries(ANGLES)) {
        const hit = files.some((a) => keys.some((k) => a.text.includes(k)));
        (hit ? existing : absent).push(angle);
      }
      L.push(`- **${m.name}** — score ${m.score} (${m.direction}) · in: ${m.files.map((f) => `/advice/${f}`).join(', ')}`);
      L.push(`  - present angles: ${existing.length ? existing.join(', ') : 'none detected'} · absent angles: ${absent.length ? absent.join(', ') : 'none'}`);
    }
  }
  L.push('');
  L.push('## BRAND MOMENTUM');
  L.push('');
  if (!newsBrands.length) {
    L.push('No brand moved in news or community chatter in this snapshot.');
  } else {
    for (const b of newsBrands) {
      const where = b.slugs === null
        ? 'catalog unknown'
        : b.slugs.length ? b.slugs.map((s) => `/product/${s}`).join(', ') : 'NOT IN CATALOG — consider adding';
      L.push(`- **${b.brand}** — ${b.news} news headline(s), ${b.reddit} community mention(s) · catalog: ${where}`);
    }
  }
  L.push('');
  L.push('## PRIORITY MATRIX');
  L.push('');
  L.push('| Priority | Ingredient | Score | Trend | Coverage | Action | Placement |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const m of matrix) {
    const place = m.files.length ? m.files.slice(0, 2).map((f) => `/advice/${f}`).join(', ') : 'new article';
    const action = m.tier === 'P1'
      ? 'publish a routine-first guide'
      : m.tier === 'P2'
        ? 'extend the angles listed above'
        : 'track — no action this cycle';
    L.push(`| ${m.tier} | ${m.name} | ${m.score} | ${m.direction} | ${m.coverage} (${m.hits} mention(s)) | ${action} | ${place} |`);
  }
  L.push('');

  console.log(L.join('\n'));
}

main().catch((err) => {
  console.error(`strategy failed: ${(err && err.stack) || err}`);
  process.exitCode = 1;
});
