/**
 * CI check: advice pages rebuild daily from docs/advice-kb.md + the latest
 * report snapshot. Fails the workflow when:
 *   1. docs/advice-kb.md is missing or has ≠10 concern sections,
 *   2. any concern section carries a banned medical-marketing word,
 *   3. no report snapshot (*.json) exists to power "Today's signal" boxes.
 *
 * Zero dependencies. Run: node scripts/check-advice-source.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(TOOL_ROOT, '..', '..');

const BANNED = [/\bcure\b/i, /\btreats\b/i, /\bheals\b/i, /\bfda-approved\b/i, /\beliminates\b/i, /\bdiagnoses\b/i, /removes permanently/i];

function fail(msg) {
  console.error(`check-advice-source: FAIL — ${msg}`);
  process.exitCode = 1;
}

const kbPath = join(REPO_ROOT, 'docs', 'advice-kb.md');
if (!existsSync(kbPath)) {
  fail('docs/advice-kb.md not found');
} else {
  const raw = readFileSync(kbPath, 'utf8');
  const fence = raw.indexOf('```json');
  const prose = fence === -1 ? raw : raw.slice(0, fence);
  const sections = prose.split(/^## /m).slice(1).filter((p) => !p.startsWith('Global disclaimer'));
  if (sections.length !== 10) {
    fail(`expected 10 concern sections, found ${sections.length}`);
  }
  for (const part of sections) {
    const slug = part.split('\n')[0].trim();
    for (const re of BANNED) {
      if (re.test(part)) fail(`banned pattern ${re} in concern "${slug}"`);
    }
  }
  if (!process.exitCode) console.log(`check-advice-source: OK — 10 concerns, no banned words (${kbPath})`);
}

const reportsDir = join(TOOL_ROOT, 'reports');
let snapshots = [];
try {
  snapshots = readdirSync(reportsDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
} catch { /* missing dir -> fail below */ }
if (!snapshots.length) {
  fail('no report snapshot (*.json) for Today\'s signal boxes');
} else {
  console.log(`check-advice-source: OK — latest snapshot ${snapshots[snapshots.length - 1]}`);
}
