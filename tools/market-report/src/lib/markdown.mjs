/**
 * Markdown building blocks. Kept dumb on purpose: the report format is part of the
 * product, so table/escaping behaviour lives in one place and is easy to test by eye.
 */

/**
 * Escape a cell so a product name containing "|" cannot break the table.
 * @param {unknown} value
 */
export function cell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return s.replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ').trim();
}

/**
 * Render a GitHub-flavoured markdown table.
 * @param {string[]} headers
 * @param {(string|number)[][]} rows
 */
export function table(headers, rows) {
  if (!rows.length) return '_No rows._';
  const head = `| ${headers.map(cell).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}`;
}

/**
 * Render a bullet list, or an italic placeholder when empty.
 * @param {string[]} items
 * @param {string} [emptyText]
 */
export function bullets(items, emptyText = '_None._') {
  if (!items.length) return emptyText;
  return items.map((i) => `- ${i}`).join('\n');
}

/**
 * Numbered list (used by the auto-summary to keep exactly five lines).
 * @param {string[]} items
 */
export function numbered(items) {
  return items.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
}

/**
 * Truncate text without cutting mid-word where avoidable.
 * @param {string} text
 * @param {number} max
 */
export function truncate(text, max) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}