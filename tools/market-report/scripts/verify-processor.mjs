/**
 * Offline verification for the Market Report Data Processing Pipeline.
 * Zero dependencies. Run: node scripts/verify-processor.mjs [--report YYYY-MM-DD]
 *
 * 1. Unit assertions over processor.mjs (titles, engagement, lists).
 * 2. End-to-end pass over a real stored report: parses the Top-posts table,
 *    applies generation-time cleaning to each row, and prints before/after
 *    for the top 10 — proving full titles, valid scores, clean lists.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isFeedTruncated,
  normalizeTitleText,
  restoreTitleFromPostUrl,
  gracefulTitle,
  engagementScore,
  displayCount,
  displayScore,
  normalizeDetectedName,
  formatDetectedList,
  cleanCommunityPost,
  cleanNewsItem,
} from '../src/lib/processor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPORTS = resolve(HERE, '..', 'reports');

let failures = 0;
function assert(cond, label, extra = '') {
  if (cond) {
    console.log(`  PASS ${label}`);
  } else {
    failures++;
    console.error(`  FAIL ${label}${extra ? ` — ${extra}` : ''}`);
  }
}

console.log('processor unit checks');
assert(isFeedTruncated('under eye bags that won\'t go away (not from lack of…'), 'detects unicode-ellipsis truncation');
assert(isFeedTruncated('game-changer for signs of...'), 'detects ascii-ellipsis truncation');
assert(!isFeedTruncated('What is ectoin, the new retinol taking over skincare?'), 'full title not flagged');
assert(normalizeTitleText('a  game-changer...') === 'a game-changer…', 'ellipsis normalization');

const slugCase = restoreTitleFromPostUrl(
  '[routine help] under eye bags that won\'t go away (not from lack of…',
  'https://www.reddit.com/r/SkincareAddiction/comments/1wn8mbb/routine_help_under_eye_bags_that_wont_go_away_not/',
);
assert(slugCase.title.includes('lack of') && !slugCase.title.includes('|'), 'slug-splice keeps title intact when slug adds nothing');

const restored = restoreTitleFromPostUrl(
  'Best vitamin C serum for beginners rec…',
  'https://www.reddit.com/r/SkincareAddiction/comments/xyz/best_vitamin_c_serum_for_beginners_recs_and_routine_tips/',
);
assert(restored.restored && restored.title.endsWith('recs and routine tips'), `slug-splice extends truncated title (got: ${restored.title})`);

const graceful = gracefulTitle('dark circles what is the…', 'https://www.reddit.com/r/x/comments/1/dark_circles_what_is_the/');
assert(graceful.wasTruncated && graceful.text.endsWith('…'), 'graceful title keeps honest ellipsis marker');

assert(engagementScore(1200, 340) === 1540, 'engagement = upvotes + comments');
assert(engagementScore(null, 5) === null && engagementScore('n/a (RSS transport)', 5) === null, 'engagement never computed from jargon');
assert(displayScore(1200, 340) === '1,540', 'score cell shows engagement when both known');
assert(displayScore(null, null) === '—' && displayCount('n/a') === '—', 'unknown counts hide behind em dash, no jargon');
assert(displayCount(44948) === '44,948', 'counts locale-formatted');
assert(normalizeDetectedName('cerave') === 'Cerave' && normalizeDetectedName('Retinol / Retinoids') === 'Retinol / Retinoids', 'name casing guard');
assert(
  formatDetectedList(['Retinol / Retinoids', 'retinol / retinoids', '  ', 'CeraVe'], 4) === 'Retinol / Retinoids, CeraVe',
  'detected lists dedupe + cap + join'
);
assert(formatDetectedList([], 4) === '—' && formatDetectedList(null, 4) === '—', 'empty lists become em dash');

const post = cleanCommunityPost({
  title: 'mini skincare overload…', url: 'https://www.reddit.com/r/x/comments/1/mini_skincare_overload_routine_help_pls/',
  ingredients: ['retinol', 'Retinol / Retinoids'], brands: [],
});
assert(post.title.length > 0 && post.ingredients.length === 1, 'post cleaning normalizes + dedupes');
const news = cleanNewsItem({ title: 'Renewal…', url: 'https://example.com/x' });
assert(news.title === 'Renewal…', 'news item cleaning preserves text');

console.log('stored-report end-to-end (top 10 posts)');
const argDate = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : '2026-09-23';
const md = readFileSync(join(REPORTS, `${argDate}.md`), 'utf8');
const lines = md.split('\n');
const headIdx = lines.findIndex((l) => l.includes('| # |') && l.includes('Ingredients detected'));
let shown = 0;
for (let i = headIdx + 2; i < lines.length && shown < 10; i++) {
  const line = lines[i].trim();
  if (!line.startsWith('|')) break;
  const cells = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length);
  if (!/^\d+$/.test(cells[0])) continue;
  const link = /^\[([\s\S]*)\]\((\S+?)\)$/.exec(cells[1] || '');
  if (!link) continue;
  const cleaned = cleanCommunityPost({
    title: link[1], url: link[2],
    ingredients: (cells[3] || '').split(',').map((s) => s.trim()).filter(Boolean),
    brands: (cells[4] || '').split(',').map((s) => s.trim()).filter(Boolean),
    score: /^\d[\d,]*$/.test(cells[5] || '') ? Number((cells[5] || '').replace(/,/g, '')) : null,
    comments: /^\d[\d,]*$/.test(cells[6] || '') ? Number((cells[6] || '').replace(/,/g, '')) : null,
  });
  const beforeScore = `${cells[5]} / ${cells[6]}`;
  const afterScore = `${displayScore(cleaned.score, cleaned.comments)} / ${displayCount(cleaned.comments)}`;
  shown++;
  console.log(`  #${shown} title: "${link[1].slice(0, 60)}${link[1].length > 60 ? '…' : ''}" → "${cleaned.title.slice(0, 80)}${cleaned.title.length > 80 ? '…' : ''}"`);
  console.log(`      score: ${beforeScore} → ${afterScore} · ingredients: ${formatDetectedList(cleaned.ingredients, 4)} · brands: ${formatDetectedList(cleaned.brands, 3)}`);
  assert(!/n\/a/i.test(afterScore), `post #${shown} score free of jargon`);
  assert(!/(\.\.\.|…{2,})/.test(cleaned.title) && !/\[$/.test(cleaned.title), `post #${shown} title has no cut-off artifacts`);
}

if (failures) {
  console.error(`verify-processor: ${failures} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(`verify-processor: OK — ${shown} posts checked, pipeline clean`);
}
