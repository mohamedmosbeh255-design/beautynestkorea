import { promises as fs, readdirSync } from "node:fs";
import path from "node:path";
import { cleanReportMarkdown, type CommunityPostAux, type ReportAux } from "./market-report-processor";

export const MARKET_REPORT_REPO = "mohamedmosbeh255-design/beautynestkorea";
export const MARKET_REPORT_BRANCH = "main";
export const MARKET_REPORT_RAW_BASE = `https://raw.githubusercontent.com/${MARKET_REPORT_REPO}/${MARKET_REPORT_BRANCH}/tools/market-report/reports`;
export const MARKET_REPORT_API_URL = `https://api.github.com/repos/${MARKET_REPORT_REPO}/contents/tools/market-report/reports`;

const DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;

function reportsDir(): string {
  return path.join(process.cwd(), "tools", "market-report", "reports");
}

async function listLocalDates(): Promise<string[]> {
  try {
    const files = await fs.readdir(reportsDir());
    return files
      .map((f) => f.match(DATE_RE)?.[1])
      .filter((d): d is string => Boolean(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function listRemoteDates(): Promise<string[]> {
  const res = await fetch(MARKET_REPORT_API_URL, {
    next: { revalidate: 3600 },
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const items = (await res.json()) as Array<{ name?: string; type?: string }>;
  return items
    .filter((i) => i.type === "file")
    .map((i) => (i.name ?? "").match(DATE_RE)?.[1])
    .filter((d): d is string => Boolean(d))
    .sort()
    .reverse();
}

/** Every dated report, newest first. Remote listing via GitHub API, fallback to local bundled copy. */
export async function listReportDates(): Promise<string[]> {
  try {
    const remote = await listRemoteDates();
    if (remote.length > 0) return remote;
  } catch {
    // fall through to local
  }
  return listLocalDates();
}

/** Synchronous version for sitemap (uses local bundled copy only). */
export function listReportDatesSync(): string[] {
  try {
    return readdirSync(reportsDir())
      .map((f: string) => f.match(DATE_RE)?.[1])
      .filter((d: string | undefined): d is string => Boolean(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function readLocalReport(date: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(reportsDir(), `${date}.md`), "utf8");
  } catch {
    return null;
  }
}

async function fetchRemoteReport(date: string): Promise<string | null> {
  try {
    const res = await fetch(`${MARKET_REPORT_RAW_BASE}/${date}.md`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export interface MarketReport {
  date: string;
  markdown: string;
  source: "remote" | "local";
}

/** Newest report: remote raw URL first, fallback to local bundled copy. */
export async function getLatestReport(): Promise<MarketReport | null> {
  const dates = await listReportDates();
  if (dates.length === 0) return null;
  const date = dates[0];
  const remote = await fetchRemoteReport(date);
  if (remote) return { date, markdown: await cleanedReport(date, remote), source: "remote" };
  const local = await readLocalReport(date);
  if (local) return { date, markdown: await cleanedReport(date, local), source: "local" };
  return null;
}

export async function getReportByDate(date: string): Promise<MarketReport | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const remote = await fetchRemoteReport(date);
  if (remote) return { date, markdown: await cleanedReport(date, remote), source: "remote" };
  const local = await readLocalReport(date);
  if (local) return { date, markdown: await cleanedReport(date, local), source: "local" };
  return null;
}

/**
 * Processing pipeline (fetch-time): every report passes through
 * cleanReportMarkdown before it reaches the UI, so historical files AND
 * future ones render without feed artifacts. Full-fidelity snapshot data
 * (full headlines, community posts) powers the restoration; without it the
 * cleaner degrades to ellipsis normalization — never invented text.
 */
async function cleanedReport(date: string, markdown: string): Promise<string> {
  try {
    const aux = await getReportAuxData(date);
    return cleanReportMarkdown(markdown, aux);
  } catch {
    return markdown;
  }
}

export interface WikiSnapshotView {
  name: string;
  views: number | null;
  previous: number | null;
  delta: number | null;
}

async function readLocalSnapshot(date: string): Promise<WikiSnapshotView[] | null> {
  const json = await readReportJson(date);
  return json ? extractWikiViews(json) : null;
}

async function fetchRemoteSnapshot(date: string): Promise<WikiSnapshotView[] | null> {
  const json = await fetchRemoteJson(date);
  return json ? extractWikiViews(json) : null;
}

/** Raw parsed snapshot JSON (local first, remote fallback). Shared reader. */
async function readReportJson(date: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(path.join(reportsDir(), `${date}.json`), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return fetchRemoteJson(date);
  }
}

async function fetchRemoteJson(date: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${MARKET_REPORT_RAW_BASE}/${date}.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Full-fidelity aux data for the cleaning pipeline: complete news headlines
 * plus community posts (full titles, counts). Additive snapshot fields —
 * older snapshots simply yield empty arrays and the cleaner falls back to
 * ellipsis normalization.
 */
export async function getReportAuxData(date: string): Promise<ReportAux> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return {};
  const json = await readReportJson(date);
  if (!json || typeof json !== "object") return {};
  const record = json as Record<string, unknown>;
  const newsHeadlines = Array.isArray(record.newsHeadlines)
    ? (record.newsHeadlines as unknown[]).filter((h): h is string => typeof h === "string" && h.trim() !== "")
    : [];
  const communityPosts: CommunityPostAux[] = Array.isArray(record.communityPosts)
    ? (record.communityPosts as unknown[])
        .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
        .map((p) => ({
          url: typeof p.url === "string" ? p.url : "",
          title: typeof p.title === "string" ? p.title : "",
          score: typeof p.score === "number" && Number.isFinite(p.score) ? p.score : null,
          comments: typeof p.comments === "number" && Number.isFinite(p.comments) ? p.comments : null,
        }))
        .filter((p) => p.url !== "" && p.title !== "")
    : [];
  return { newsHeadlines, communityPosts };
}

function extractWikiViews(json: unknown): WikiSnapshotView[] | null {
  const rows = (json as { wikiViews?: unknown })?.wikiViews;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const views = rows
    .map((r) => {
      const row = r as Record<string, unknown>;
      if (typeof row.name !== "string") return null;
      const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
      return { name: row.name, views: num(row.views), previous: num(row.previous), delta: num(row.delta) };
    })
    .filter((r): r is WikiSnapshotView => r !== null && r.views !== null);
  return views.length > 0 ? views : null;
}

/**
 * Read-only snapshot for a report date (stored .json untouched): powers the
 * complete ingredient table rendered on report pages. Local first, remote fallback.
 */
export async function getReportSnapshot(date: string): Promise<WikiSnapshotView[] | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return (await readLocalSnapshot(date)) ?? (await fetchRemoteSnapshot(date));
}

/** Shift a YYYY-MM-DD date by N days (UTC). */
export function shiftDateStr(date: string, days: number): string {
  const t = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

/** Strip the leading "# ..." title line so the page can render its own H1. */
export function stripTitle(markdown: string): string {
  return markdown.replace(/^\s*#[^\n]*\n/, "").trimStart();
}

export function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautynestkorea.com";
}
