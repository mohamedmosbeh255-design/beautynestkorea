import { promises as fs, readdirSync } from "node:fs";
import path from "node:path";

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
  if (remote) return { date, markdown: remote, source: "remote" };
  const local = await readLocalReport(date);
  if (local) return { date, markdown: local, source: "local" };
  return null;
}

export async function getReportByDate(date: string): Promise<MarketReport | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const remote = await fetchRemoteReport(date);
  if (remote) return { date, markdown: remote, source: "remote" };
  const local = await readLocalReport(date);
  if (local) return { date, markdown: local, source: "local" };
  return null;
}

/** Strip the leading "# ..." title line so the page can render its own H1. */
export function stripTitle(markdown: string): string {
  return markdown.replace(/^\s*#[^\n]*\n/, "").trimStart();
}

export function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautynestkorea.com";
}
