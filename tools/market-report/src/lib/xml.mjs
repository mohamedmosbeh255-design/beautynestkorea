/**
 * Minimal XML/Atom/RSS readers. Hand-rolled because the project stays dependency-free
 * (no xml2js / fast-xml-parser) and these feeds have a fixed, simple shape:
 *   - Google Trends daily RSS  -> <rss><channel><item>...
 *   - Reddit Atom feed         -> <feed><entry>...
 * Deliberately forgiving: missing fields become empty strings, never throws.
 */

/** Decode the XML entities that appear in RSS/Atom payloads. */
export function decodeEntities(input) {
  if (!input) return '';
  return String(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’');
}

/** @param {number} code */
function safeCodePoint(code) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/**
 * Read the inner text of the first matching tag inside a block.
 * @param {string} block
 * @param {string} name  Tag name, may include a namespace prefix such as "ht:approx_traffic".
 */
export function tagText(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = block.match(re);
  return m ? decodeEntities(m[1]).trim() : '';
}

/**
 * Read an attribute from the first matching tag inside a block.
 * @param {string} block
 * @param {string} name
 * @param {string} attr
 */
export function tagAttr(block, name, attr) {
  const re = new RegExp(`<${name}\\b[^>]*\\b${attr}="([^"]*)"`, 'i');
  const m = block.match(re);
  return m ? decodeEntities(m[1]).trim() : '';
}

/**
 * Split a document into the blocks of a repeated tag, whitespace-insensitive.
 * @param {string} xml
 * @param {string} tag
 */
export function blocks(xml, tag) {
  const parts = xml.split(new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'i'));
  parts.shift(); // drop preamble before the first occurrence
  return parts.map((p) => p.split(new RegExp(`</${tag}>`, 'i'))[0] || '');
}

/** Strip every remaining tag and collapse whitespace (used for Reddit's escaped HTML). */
export function stripTags(input) {
  return decodeEntities(String(input || ''))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}