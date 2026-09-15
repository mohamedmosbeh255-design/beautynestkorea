# Daily Skincare Market Intelligence — MVP v1

A self-contained, **zero-dependency** tool that builds one markdown intelligence report per day and commits it to the repository. No server, no cron daemon on your machine, no paid API, and **no Amazon requests at all**.

Runs unattended at **06:00 UTC** via GitHub Actions and writes `reports/YYYY-MM-DD.md` (plus a machine-readable `.json` sibling used for day-over-day diffs).

---

## What it produces

| # | Section | Source | Status in v1 |
|---|---|---|---|
| 1 | Top Trending Ingredients | Google Trends daily RSS, 12 markets queried individually | Works. Feed is news-driven, so some days legitimately return zero skin matches — stated, never faked |
| 2 | Community Pulse | r/SkincareAddiction + r/KoreanBeauty | Works via documented Atom fallback (public JSON endpoint is currently 403) |
| 3 | Social Signals | TikTok Creative Center | Probed live; endpoint is gated, so the curated fallback list is used and the probe verdict is printed as evidence |
| 4 | Competitor Watchlist | Static ASIN list | Table renders with `TODO (PA-API)` placeholders by design |
| 5 | Auto-Summary | Rule-based over sections 1–4 | Exactly five lines, each derived from measured values |

Every report also carries a **Source status** table (state + duration per source), a **Methodology & caveats** block, and an explicit note whenever a source degraded or failed.

---

## Quickstart

```bash
cd tools/market-report
node src/index.mjs              # writes reports/<today-in-UTC>.md + .json
node src/index.mjs --print      # same, and prints the full report to stdout
node src/index.mjs --date 2026-09-15   # regenerate a specific dated report
node src/index.mjs --help
```

Requirements: **Node >= 20** only (uses the built-in `fetch`). There is nothing to install.

---

## Why Node + `.mjs` instead of Python

The spec left the language open, so the choice is deliberate:

1. **It cannot break the main site build.** The site is a Next.js/TypeScript project that gates on `tsc --noEmit`. Files ending in `.mjs` are *not* part of a TypeScript program unless `allowJs` is on, so this tool is invisible to the site's typecheck and adds no `include`/`exclude` surgery to the site's `tsconfig.json`. Probe proof is in "Build safety" below.
2. **No install step in CI.** The tool needs no dependencies at all: trends and Reddit data are fetched with built-in `fetch`, RSS/Atom is parsed with ~60 lines of hand-rolled, well-commented scanner code, and reports are written with `node:fs`. That removes `npm install`, lockfile churn and supply-chain risk from the workflow — and therefore removes any chance of the tool touching the site's dependency tree.
3. **One runtime, one cache, one CI family.** Node is already the site's runtime, so `actions/setup-node@v4` covers tooling, edge cases and contributor familiarity. Python would add a second runtime and a second dependency culture for no gain here.
4. **Type safety without dependencies.** JSDoc types plus a scoped `tsconfig.json` give real checking (`npm run check`) while keeping `devDependencies` empty — the only cost is a 20-line `types/globals.d.ts` declaring the four Node built-ins actually used.

Trade-off accepted: the RSS/Atom parser is hand-written rather than battle-tested. It is deliberately forgiving (missing fields become `''`, never throws) and its behaviour is visible in one file: `src/lib/xml.mjs`.

---

## Build safety (the "must not break the site" rule)

Guarantees, in order of importance:

- Nothing here is imported by any site file. The tool is a leaf.
- No site file is modified: the workflow, `package.json` and `tsconfig.json` in this folder are self-contained.
- The tool's own `tsconfig.json` **is not referenced** by the site and does not reference the site.
- All sources are `.mjs`, so the site's `tsc --noEmit` cannot pick them up unless the site enables `allowJs`.

Verify it yourself, from `tools/market-report`:

```bash
# 1) Show that a site-style tsconfig (include **/*.ts) matches ZERO tool modules:
printf '%s\n' '{ "compilerOptions": { "noEmit": true, "allowJs": false, "strict": true }, "include": ["**/*.ts", "**/*.tsx"] }' > tsconfig.siteproof.json
npx -p typescript@5.6.3 tsc -p tsconfig.siteproof.json --listFilesOnly | grep -c '\.mjs'   # expect 0
rm tsconfig.siteproof.json
# (tsc also prints TS18003 "No inputs were found" — that is the proof: no .ts/.tsx here)

# 2) Typecheck the tool itself, scoped, with zero dependencies:
npx -p typescript@5.6.3 tsc -p tsconfig.json

# 3) Syntax-check every module:
npm run check:syntax
```

If your site's `tsconfig.json` ever enables `allowJs`/`checkJs`, add one line to it:

```json
"exclude": ["node_modules", "tools/market-report"]
```

## Sources in detail (and what each one really does today)

All statuses below were measured on **2026-09-15** from a normal consumer connection; the tool re-checks them on every run and prints the outcome in the report itself.

### 1. Google Trends RSS — `src/sources/trends.mjs`
- **Endpoint used:** `https://trends.google.com/trending/rss?geo=<MARKET>` → verified `200`.
- **Retired endpoint:** `https://trends.google.com/trends/trendingsearches/daily/rss?geo=<MARKET>` → verified `404`. The module probes it once for diagnostics and **skips it gracefully**; a 404 is recorded as a degradation, never as a run failure.
- **Why 12 markets:** Google Trends has no "worldwide" feed and no per-keyword RSS. "Worldwide" here means 12 markets (US, GB, CA, AU, IN, DE, FR, JP, KR, BR, SG, AE) queried individually, then aggregated: a term surfacing in more markets ranks higher, with peak traffic as the tie-breaker. Each surviving row shows its top five countries.
- **Honest limitation:** the feed is news- and sports-driven, so days with zero skin-related matches happen (including on the sample date). The report says so explicitly instead of manufacturing a ranking.

### 2. Reddit — `src/sources/reddit.mjs` (primary demand signal)
- **Transport 1 (spec default):** `https://www.reddit.com/r/<sub>/top.json?t=day&limit=30` → verified `403` for every non-browser client, including with a realistic User-Agent.
- **Transport 2 (documented fallback):** `https://www.reddit.com/r/<sub>/top/.rss?t=day` → verified `200`.
- **Rate limiting:** two subreddit requests back-to-back returned `429` (observed live). The tool now (a) waits 1.5s between subreddits and (b) retries `429` with back-off inside `src/lib/http.mjs`, while treating other 4xx as permanent.
- **Field honesty:** JSON gives real `score`/`num_comments`; Atom does not, so fallback rows read `n/a (RSS transport)` rather than a guessed number. Ranking falls back to Reddit's own top-of-day ordering, which is the feed's native sort.
- **Extraction:** ingredient and brand mentions are matched from a curated lexicon (`src/lib/terms.mjs`: 29 ingredients, 33 brands) with word-boundary regexes, so `acne` does not match `acneform`.

### 3. TikTok Creative Center — `src/sources/tiktok.mjs`
- Both public ranking endpoints are probed each run: one answers `404`, the other `200` with `{"code":40101,"msg":"no permission"}`. The exact verdict is written into the report as evidence.
- Because the ranking is gated, v1 renders the **curated fallback list** (20 hashtags with category + buyer intent) from `src/lib/lexicon.mjs`, and labels the section as a fallback so nobody mistakes it for live data. Refresh it quarterly.

### 4. Competitor watchlist — `src/sources/amazon.mjs`
- **Zero network calls by design.** The file contains a rule comment: the project was IP-throttled by Amazon after earlier scraping, so v1 issues no Amazon request at all.
- The six ASINs render as a table with `Price`, `Rating` and `BSR` columns set to `TODO (PA-API)`, each row linked with a plain `https://www.amazon.com/dp/<ASIN>` URL (rendered, never fetched).
- When PA-API credentials exist, only this file changes: fill the three fields from the API and delete the note.

### Failure policy (the "continue with others" rule)

| What happens | Report behaviour |
|---|---|
| One market / subreddit / endpoint fails | Recorded in that section, run continues, source marked `partial` |
| A whole source throws an exception | Caught per source in `collectAll()`, marked `failed`, all other sections still render |
| Every source fails | Report is still written; exit code is `0` unless `--strict` is passed (then non-zero, so CI can alert) |
| Source used a fallback | State is `partial`, and the fallback is named in the Source status table |

---

## CLI reference

| Flag | Effect |
|---|---|
| `--date YYYY-MM-DD` | Report date and filename (default: today in UTC) |
| `--dir PATH` | Output directory (default: `tools/market-report/reports`) |
| `--print` | Also print the complete markdown to stdout |
| `--strict` | Exit non-zero when *every* source failed |
| `--help` | Usage summary |

---

## GitHub Actions

The workflow lives in two places so it works whichever directory is the repository root:

- `tools/market-report/workflow/market-report.yml` — canonical copy, travels with the tool.
- `.github/workflows/market-report.yml` — copy at the repo-root location GitHub requires. **If your repo root is the site, keep this one** (and delete the other if you prefer a single copy).

Details that matter:

- **Schedule:** `cron: '0 6 * * *'` (06:00 UTC). GitHub cron is UTC-only and can start a few minutes late under load; that is normal. `workflow_dispatch` is enabled for manual runs and backfills.
- **No install step:** the job goes straight from `actions/setup-node@v4` to `node src/index.mjs`, because there are no dependencies.
- **Permissions:** `contents: write`, needed for the commit step. The commit uses the standard `github-actions[bot]` identity, and a `git pull --rebase --autostash` before `git push` to survive a concurrent push.
- **Artifacts:** the report is also uploaded as a workflow artifact (15-day retention), so you keep a copy even if the commit step is blocked by branch protection.
- **Concurrency:** grouped by `market-report` so two runs cannot race on the same file.

If your default branch is protected, either allow the bot to push or drop the commit step and rely on the artifact upload.

## Rules this project commits to

These are enforced in code, not just documented:

1. **No Amazon scraping.** `src/sources/amazon.mjs` performs zero HTTP calls, and there is no Amazon URL anywhere else in the tool. Reintroducing a fetch there breaks the project's stated rule.
2. **No paid APIs.** Every request goes to a public endpoint: Google Trends RSS, Reddit's public feeds, TikTok's public (gated) endpoints.
3. **No silent failure.** Any degraded or failed source is written into the report with its reason, and the source table shows state + duration.
4. **No invented data.** When a feed has no skin-related content, the report says so. Numbers that a transport cannot supply are printed as `n/a`, never estimated.
5. **No dependency creep.** `dependencies` and `devDependencies` stay empty; the RSS/Atom reader is hand-rolled on purpose.

---

## Known limitations & v2 backlog

| Limitation in v1 | Cheapest path to fix |
|---|---|
| Google Trends daily RSS is news-driven, so skin-specific matches are rare | Add the informal interest-over-time endpoint per keyword (fragile), or track a fixed keyword set through a licensed trends provider |
| TikTok rankings gated (`40101 no permission`) | TikTok Business API credentials, or a maintained quarterly list (current approach) |
| Reddit JSON blocked; Atom lacks score/comments | Reddit OAuth (script app) — 100 requests/minute with real scores and comment counts |
| Watchlist has no live price/rating/BSR | Amazon PA-API 5.0 with real credentials (columns already wired) |
| Single-day view | The `.json` snapshot per report already enables week-over-week deltas; add a rollup command |
| Ingredient extraction is lexicon-based | Expand `src/lib/terms.mjs`; a synonym/typo map is the highest-yield next step |

---

## Troubleshooting

| Symptom in the report | Meaning | Action |
|---|---|---|
| `Google Trends RSS … N market(s) skipped` | Those markets 404/429'd that run | Usually transient; the run already retried |
| `HTTP 403` on both Reddit transports | Reddit blocked the runner IP (common on cloud IPs) | Expected and handled; consider Reddit OAuth for reliability |
| `HTTP 429` from Reddit | Rate limiter | Handled with back-off; the 1.5s inter-request delay exists for this |
| `curated static fallback (endpoint gated)` | TikTok ranking unavailable | Expected in v1 |
| `failed sub(s): KoreanBeauty` | That subreddit gave nothing usable | Report still renders; re-run later |
| Report committed but empty sections | All upstream feeds were down that day | Check the Source status table; use `--strict` in CI to get alerted |

---

## File map

```
tools/market-report/
├── README.md                     this file
├── package.json                  type: module, zero dependencies
├── tsconfig.json                 scoped self-check (does not touch the site)
├── .gitignore
├── types/globals.d.ts            dependency-free shims for the Node built-ins used
├── workflow/market-report.yml    canonical GitHub Actions workflow (copied to .github/workflows/)
├── reports/
│   ├── 2026-09-15.md             sample report (committed as proof)
│   └── 2026-09-15.json           snapshot enabling day-over-day diffs
└── src/
    ├── index.mjs                 CLI, fault isolation, document assembly, file output
    ├── lib/
    │   ├── http.mjs              fetch with timeout, retries, 429 back-off
    │   ├── xml.mjs               RSS + Atom scanner, entity decoding
    │   ├── lexicon.mjs           12 markets, 127 keywords, 20 fallback hashtags, 6 ASINs
    │   ├── terms.mjs             29 ingredients + 33 brands
    │   ├── log.mjs               per-source status tracking
    │   ├── markdown.mjs          tables, lists, truncation, escaping
    │   ├── history.mjs           previous-snapshot loading + movers
    │   ── summary.mjs           the five rule-based summary lines
    ── sources/
        ├── reddit.mjs            section 2 — primary demand signal
        ├── trends.mjs            section 1 — Google Trends RSS
        ├── tiktok.mjs            section 3 — social signals
        └── amazon.mjs            section 4 — watchlist table (no network)
```

---

## Maintenance checklist

- **Quarterly:** refresh `TIKTOK_FALLBACK_HASHTAGS` and re-check that the Google Trends endpoint path still answers 200.
- **When PA-API is ready:** fill price/rating/BSR in `src/sources/amazon.mjs` only.
- **When a brand or ingredient trend appears:** add it to `src/lib/terms.mjs` so tomorrow's report picks it up automatically.
- **Monthly:** review a few reports for sections that are persistently empty, and fix the cause rather than accepting it.