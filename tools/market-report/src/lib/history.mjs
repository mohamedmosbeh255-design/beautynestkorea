/**
 * History helpers: load the most recent previous report JSON so the auto-summary can
 * compute real day-over-day movers instead of guessing. The .json sibling of each .md
 * report exists purely for this (and for future site integrations).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @typedef {Object} Snapshot
 * @property {string} date
 * @property {string[]} trendTerms
 * @property {{ name: string, count: number }[]} ingredients
 * @property {{ name: string, count: number }[]} brands
 * @property {string[]} hashtags
 */

/**
 * Find the JSON snapshot of the most recent report strictly before `date`.
 * @param {string} dir reports directory
 * @param {string} date today's YYYY-MM-DD
 * @returns {Snapshot | null}
 */
export function loadPreviousSnapshot(dir, date) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace('.json', ''))
    .filter((d) => d < date)
    .sort();

  for (let i = files.length - 1; i >= 0; i--) {
    const file = join(dir, `${files[i]}.json`);
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      return {
        date: parsed.date || files[i],
        trendTerms: parsed.trendTerms || [],
        ingredients: parsed.ingredients || [],
        brands: parsed.brands || [],
        hashtags: parsed.hashtags || [],
      };
    } catch {
      // Corrupt snapshot: fall through to the next-oldest report rather than failing.
    }
  }
  return null;
}

/**
 * Compare today's ingredient tallies with the previous snapshot.
 * @param {Snapshot | null} previous
 * @param {{ name: string, count: number }[]} current
 * @returns {{ name: string, now: number, before: number, delta: number }[]}
 */
export function ingredientMovers(previous, current) {
  if (!previous) return [];
  const before = new Map(previous.ingredients.map((i) => [i.name, i.count]));
  const names = new Set([...before.keys(), ...current.map((i) => i.name)]);
  return Array.from(names)
    .map((name) => {
      const now = current.find((i) => i.name === name)?.count ?? 0;
      const was = before.get(name) ?? 0;
      return { name, now, before: was, delta: now - was };
    })
    .filter((m) => m.delta !== 0)
    .sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name));
}

/**
 * Trend terms present today but absent in the previous snapshot.
 * @param {Snapshot | null} previous
 * @param {string[]} currentTerms
 */
export function newTrendTerms(previous, currentTerms) {
  if (!previous) return currentTerms;
  const seen = new Set(previous.trendTerms.map((t) => t.toLowerCase()));
  return currentTerms.filter((t) => !seen.has(t.toLowerCase()));
}