# Daily Skincare Market Intelligence — v1.1

A self-contained, **zero-dependency** tool that builds one markdown intelligence report per day and commits it to the repository. No server, no cron daemon on your machine, no paid API, and **no Amazon requests at all**.

Runs unattended at **06:00 UTC** via GitHub Actions and writes `reports/YYYY-MM-DD.md` (plus a machine-readable `.json` sibling used for day-over-day diffs).

---

## What it produces

| # | Section | Source | Status in v1.1 |
|---|---|---|---|
| 1 | Top Trending Ingredients | **Wikimedia pageviews** for 18 tracked ingredient articles (two complete days compared) + Google Trends daily RSS as a labelled secondary signal | Live. 18/18 article requests answered 200 on 2026-09-17 |
| 2 | Community Pulse | r/SkincareAddiction + r/KoreanBeauty | Works via documented Atom fallback when Reddit answers; cloud-runner IPs are commonly 403/429'd and the report says so instead of inventing posts |
| 3 | Market News Pulse | **Google News RSS** (EN + KO queries), filtered by the ingredient/brand lexicon | Live. 200 headlines read, 58 lexicon-matched on 2026-09-17. Editorial coverage — *not* consumer demand |
| 4 | Social Signals | TikTok Creative Center | Probed live; endpoint is gated, so the curated fallback list is used and the probe verdict is printed as evidence |
| 5 | Competitor Watchlist | Static ASIN list | Table renders with `TODO (PA-API)` placeholders by design |
| 6 | Auto-Summary | Rule-based over sections 1–5 | Every line derived from measured values |

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

All statuses below were measured on **2026-09-15 → 2026-09-17** from a normal consumer connection; the tool re-checks them on every run and prints the outcome in the report itself.

### 1. Wikimedia pageviews (ingredient interest) — `src/sources/wikimedia.mjs`
- **Endpoint used:** `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/<ARTICLE>/daily/<start>/<end>` → verified `200` for **18/18** tracked article titles with this tool's own User-Agent (2026-09-17).
- **Why it is the primary trend signal:** Google Trends' daily RSS is news-driven and returned **0 skin-related matches from 120 items/day** for three days straight, and its informal keyword endpoints are unusable (`/trends/api/dailytrends` → `404`, `/trends/api/explore` → `429`, both verified live on 2026-09-17). Wikimedia answers cloud runners, needs no key, no cookie and no browser.
- **What the numbers mean:** article views for one *complete* day (yesterday) compared with the day before — a partial "today" bucket is never compared. Titles are per-ingredient (`Retinol`, `Tretinoin`, `Adapalene`, `Centella_asiatica`, `Snail_slime`, …), so a multi-article ingredient (retinoids) is summed from its articles.
- **Honest limitation:** pageviews measure **public curiosity**, not sales, not search volume, not social chatter. The report says exactly that under the table ("Proxy note"), and missing data is printed as `n/a` — never estimated.
- **Politeness:** one request per article with a 1.2s gap (bursts get `429`), 20s timeout, and each failed title is listed with its reason.

### 2. Google Trends RSS (now a labelled secondary signal) — `src/sources/trends.mjs`
- **Endpoint used:** `https://trends.google.com/trending/rss?geo=<MARKET>` → verified `200`.
- **Retired endpoint:** `https://trends.google.com/trends/trendingsearches/daily/rss?geo=<MARKET>` → verified `404`. The module probes it once for diagnostics and **skips it gracefully**; a 404 is recorded as a degradation, never as a run failure.
- **Why 12 markets:** Google Trends has no "worldwide" feed and no per-keyword RSS. "Worldwide" here means 12 markets (US, GB, CA, AU, IN, DE, FR, JP, KR, BR, SG, AE) queried individually, then aggregated: a term surfacing in more markets ranks higher, with peak traffic as the tie-breaker.
- **Honest limitation:** the feed is news- and sports-driven (0 skin matches on 2026-09-15 → 2026-09-17). The report prints the market count, the items scanned and the zero explicitly rather than manufacturing a ranking.

### 3. Reddit — `src/sources/reddit.mjs` (community demand signal)
- **Transport 1 (spec default):** `https://www.reddit.com/r/<sub>/top.json?t=day&limit=30` → verified `403` for every non-browser client, including with a realistic User-Agent.
- **Transport 2 (documented fallback):** `https://www.reddit.com/r/<sub>/top/.rss?t=day` → verified `200` from a residential connection with a browser agent; from GitHub's cloud runners it has answered `403` then `429`.
- **Ordered attempts:** the Atom call walks `ATOM_ATTEMPTS` — tool UA on `www.reddit.com`, then browser UA on `www.reddit.com`, then browser UA on `old.reddit.com` — and the report names the combination that actually delivered the data.
- **Rate limiting:** a `429` is never retried blindly: the tool waits the advertised `Retry-After` (capped at 20s) once and then moves on, and there is now a 10s gap between subreddits (5s was measured to trigger `429`).
- **Field honesty:** JSON gives real `score`/`num_comments`; Atom does not, so fallback rows read `n/a (RSS transport)` rather than a guessed number.
- **Extraction:** ingredient and brand mentions are matched from a curated lexicon (`src/lib/terms.mjs`: 29 ingredients, 33 brands) with word-boundary regexes, so `acne` does not match `acneform`.

### 4. Google News RSS (market news pulse) — `src/sources/news.mjs`
- **Endpoints used:** two public Google News RSS queries (English US, Korean KR), each verified `200` with ~100 dated headlines on 2026-09-17.
- **Filtering:** headlines are matched against the same ingredient/brand lexicon, so the table only shows skincare-relevant coverage; the rest are counted as "read but skipped" and never padded into the table. Each row prints publisher + UTC timestamp, and duplicate titles across queries are de-duplicated.
- **Honest limitation:** editorial coverage is a *coverage* signal — it is not consumer demand. The report labels it that way in the table footnote and in the methodology block.

### 5. TikTok Creative Center — `src/sources/tiktok.mjs`
- Both public ranking endpoints are probed each run: one answers `404`, the other `200` with `{"code":40101,"msg":"no permission"}`. The exact verdict is written into the report as evidence.
- Because the ranking is gated, the tool renders the **curated fallback list** (20 hashtags with category + buyer intent) from `src/lib/lexicon.mjs`, and labels the section as a fallback so nobody mistakes it for live data. Refresh it quarterly.

### 6. Competitor watchlist — `src/sources/amazon.mjs`
- **Zero network calls by design.** The file contains a rule comment: the project was IP-throttled by Amazon after earlier scraping, so it issues no Amazon request at all.
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
| `--guard` | Exit non-zero when the report carries no measurable data at all (no pageviews, no headlines, no posts, no trend matches). Used in CI so an empty report fails the run instead of landing silently |
| `--help` | Usage summary |

---

## GitHub Actions

The workflow lives in two places so it works whichever directory is the repository root:

- `tools/market-report/workflow/market-report.yml` — canonical copy, travels with the tool.
- `.github/workflows/market-report.yml` — copy at the repo-root location GitHub requires. **If your repo root is the site, keep this one** (and delete the other if you prefer a single copy).

Details that matter:

- **Schedule:** `cron: '0 6 * * *'` (06:00 UTC). GitHub cron is UTC-only and can start late under load — observed live: a scheduled run fired at 11:31 UTC instead of 06:00, so treat the timestamp as approximate and verify the report date, not the clock. `workflow_dispatch` is enabled for manual runs and backfills.
- **No install step:** the job goes straight from `actions/setup-node@v4` to `node src/index.mjs --guard`, because there are no dependencies.
- **Empty-report guard:** `--guard` exits non-zero when a run would produce a report with zero measurable data, which makes the job (and its GitHub notification) fail instead of archiving an empty report.
- **Permissions:** `contents: write`, needed for the commit step. The commit uses the standard `github-actions[bot]` identity, and a `git pull --rebase --autostash` before `git push` to survive a concurrent push.
- **Artifacts:** the report is also uploaded as a workflow artifact (15-day retention), so you keep a copy even if the commit step is blocked by branch protection.
- **Concurrency:** grouped by `market-report` so two runs cannot race on the same file.

If your default branch is protected, either allow the bot to push or drop the commit step and rely on the artifact upload.

## Rules this project commits to

These are enforced in code, not just documented:

1. **No Amazon scraping.** `src/sources/amazon.mjs` performs zero HTTP calls, and there is no Amazon URL anywhere else in the tool. Reintroducing a fetch there breaks the project's stated rule.
2. **No paid APIs.** Every request goes to a public endpoint: Wikimedia pageviews, Google Trends RSS, Reddit's public feeds, Google News RSS, TikTok's public (gated) endpoints.
3. **No silent failure.** Any degraded or failed source is written into the report with its reason, and the source table shows state + duration.
4. **No invented data.** When a feed has no skin-related content, the report says so. Numbers that a transport cannot supply are printed as `n/a`, never estimated.
5. **No dependency creep.** `dependencies` and `devDependencies` stay empty; the RSS/Atom reader is hand-rolled on purpose.

---

## Known limitations & v2 backlog

| Limitation in v1.1 | Cheapest path to fix |
|---|---|
| Google Trends daily RSS is news-driven, so skin-specific matches are rare (0 on 2026-09-15 → 17); its keyword endpoints are dead/blocked (`dailytrends` 404, `explore` 429) | Already handled by demoting it to a secondary signal; a licensed trends provider is the only robust replacement |
| Ingredient interest is measured via English Wikipedia pageviews (a curiosity proxy, not sales or search volume) | Add more languages/projects (`de.wikipedia`, `ko.wikipedia`) once the per-title map grows; keep the proxy note in the report |
| News headlines are editorial coverage, not demand | Add optional keyword-volume verification (PA-API / licensed data) before turning coverage into a demand claim |
| TikTok rankings gated (`40101 no permission`) | TikTok Business API credentials, or a maintained quarterly list (current approach) |
| Reddit JSON blocked; Atom lacks score/comments; cloud IPs are often 403/429 | Reddit OAuth (script app) — 100 requests/minute with real scores and comment counts. The tool already walks host/agent combinations and honours Retry-After, so nothing is lost when it stays blocked |
| Watchlist has no live price/rating/BSR | Amazon PA-API 5.0 with real credentials (columns already wired) |
| Single-day view | The `.json` snapshot per report already carries `wikiViews` + community tallies for deltas; add a rollup command |
| Ingredient extraction is lexicon-based | Expand `src/lib/terms.mjs` / `src/lib/lexicon.mjs`; a synonym/typo map is the highest-yield next step |

---

## Troubleshooting

| Symptom in the report | Meaning | Action |
|---|---|---|
| `Google Trends RSS … N market(s) skipped` | Those markets 404/429'd that run | Usually transient; the run already retried |
| `HTTP 403` on both Reddit transports | Reddit blocked the runner IP (common on cloud IPs) | Expected and handled; consider Reddit OAuth for reliability |
| `HTTP 429` from Reddit | Rate limiter | Handled: the advertised `Retry-After` is honoured once (capped at 20s), then the run moves on — the 10s gap between subreddits exists for this |
| `curated static fallback (endpoint gated)` | TikTok ranking unavailable | Expected; the news section (3) is the live signal |
| `failed sub(s): KoreanBeauty` | That subreddit gave nothing usable | Report still renders; re-run later |
| Report committed with empty sections | Upstream feeds were down that day | Check the Source status table; CI runs with `--guard`, so a fully empty report fails the job and notifies |

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
    │   ├── http.mjs              fetch with timeout, retries, Retry-After honouring
    │   ├── xml.mjs               RSS + Atom scanner, entity decoding
    │   ├── lexicon.mjs           12 markets, 127 keywords, 18 wiki articles, 2 news queries, 20 fallback hashtags, 6 ASINs
    │   ├── terms.mjs             29 ingredients + 33 brands
    │   ├── log.mjs               per-source status tracking
    │   ├── markdown.mjs          tables, lists, truncation, escaping
    │   ├── history.mjs           previous-snapshot loading + movers
    │   ── summary.mjs           the rule-based summary lines
    ── sources/
        ├── wikimedia.mjs         section 1 — ingredient interest (Wikipedia pageviews)
        ├── trends.mjs            section 1 (secondary) — Google Trends RSS
        ├── reddit.mjs            section 2 — community demand signal
        ├── news.mjs              section 3 — market news pulse (Google News RSS)
        ├── tiktok.mjs            section 4 — social signals
        └── amazon.mjs            section 5 — watchlist table (no network)
```

---

## Maintenance checklist

- **Quarterly:** refresh `TIKTOK_FALLBACK_HASHTAGS`, re-check the Google Trends endpoint path, and sanity-check a few `WIKI_ARTICLES` titles (a renamed Wikipedia article answers `404` and is listed as a skipped title).
- **When PA-API is ready:** fill price/rating/BSR in `src/sources/amazon.mjs` only.
- **When a brand or ingredient trend appears:** add it to `src/lib/terms.mjs` (and to `WIKI_ARTICLES` if it has a Wikipedia article) so tomorrow's report picks it up automatically.
- **When a news topic matters:** add a query to `NEWS_QUERIES` in `src/lib/lexicon.mjs` — the filter stays lexicon-based, so extras only add coverage, never noise.
- **Monthly:** review a few reports for sections that are persistently empty, and fix the cause rather than accepting it.