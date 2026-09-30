"use client";

import { useState } from "react";
import { Plus, Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { INDEXED_FOOTER_URLS, type FooterData, type FooterLink } from "@/lib/footer";
import { saveFooterSettings, resetFooterSettings } from "@/lib/footer-actions";

type ColumnKey = "shop" | "learn" | "company" | "socials";

const COLUMN_META: Record<ColumnKey, { title: string; hint: string; internalOnly: boolean }> = {
  shop: { title: "Shop", hint: "Internal links only (must start with /).", internalOnly: true },
  learn: { title: "Learn", hint: "Internal links only (must start with /).", internalOnly: true },
  company: { title: "Company", hint: "SEO-sensitive. Internal links only. Deleting an indexed URL weakens that page.", internalOnly: true },
  socials: { title: "Socials", hint: "External https:// or mailto: links only.", internalOnly: false },
};

function ColumnEditor({
  column,
  links,
  onChange,
}: {
  column: ColumnKey;
  links: FooterLink[];
  onChange: (next: FooterLink[]) => void;
}) {
  const meta = COLUMN_META[column];
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif-display text-lg font-bold">{meta.title}</h3>
        <span className="text-xs text-ink-soft">{links.length}/8</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">{meta.hint}</p>
      <div className="mt-4 space-y-3">
        {links.map((link, i) => {
          const indexed = INDEXED_FOOTER_URLS.has(link.href);
          return (
            <div key={i} className="rounded-2xl bg-white/70 p-3">
              <div className="flex gap-2">
                <input
                  value={link.label}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], label: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Label (e.g. About us)"
                  maxLength={60}
                  className="w-1/3 min-w-0 rounded-xl border border-sage-100 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={link.href}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = { ...next[i], href: e.target.value };
                    onChange(next);
                  }}
                  placeholder={meta.internalOnly ? "/about" : "https://…"}
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-xl border border-sage-100 bg-white px-3 py-2 font-mono text-xs"
                />
                <button
                  type="button"
                  aria-label={`Remove ${link.label || "link"}`}
                  onClick={() => {
                    if (indexed) {
                      const ok = window.confirm(
                        `⚠️ "${link.href}" is INDEXED in Google and listed in sitemap.ts.\n\nRemoving it weakens that page's internal linking.\n\nReplace it instead of deleting, or add a 301 redirect if the URL is really gone.\n\nDelete anyway?`
                      );
                      if (!ok) return;
                    }
                    onChange(links.filter((_, j) => j !== i));
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {indexed && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  <AlertTriangle className="h-3 w-3" /> Indexed URL — deleting affects SEO. Replace, don&apos;t remove.
                </p>
              )}
            </div>
          );
        })}
        {links.length < 8 && (
          <button
            type="button"
            onClick={() => onChange([...links, { label: "", href: column === "socials" ? "https://" : "/" }])}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold hover:bg-sage-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        )}
      </div>
    </div>
  );
}

export default function FooterSettingsForm({ initial, saved }: { initial: FooterData; saved: boolean }) {
  const [tagline, setTagline] = useState(initial.tagline);
  const [disclosure, setDisclosure] = useState(initial.disclosure);
  const [shop, setShop] = useState<FooterLink[]>(initial.shop);
  const [learn, setLearn] = useState<FooterLink[]>(initial.learn);
  const [company, setCompany] = useState<FooterLink[]>(initial.company);
  const [socials, setSocials] = useState<FooterLink[]>(initial.socials);

  return (
    <div>
      {saved && (
        <p className="glass mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-sage-700">
          <CheckCircle2 className="h-4 w-4" /> Saved — footer cache purged site-wide.
        </p>
      )}
      <form action={saveFooterSettings}>
        <input type="hidden" name="shop" value={JSON.stringify(shop)} />
        <input type="hidden" name="learn" value={JSON.stringify(learn)} />
        <input type="hidden" name="company" value={JSON.stringify(company)} />
        <input type="hidden" name="socials" value={JSON.stringify(socials)} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-3xl p-5">
            <h3 className="font-serif-display text-lg font-bold">Brand tagline</h3>
            <textarea
              name="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-sage-100 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
          <div className="glass rounded-3xl p-5">
            <h3 className="font-serif-display text-lg font-bold">Affiliate disclosure</h3>
            <textarea
              name="disclosure"
              value={disclosure}
              onChange={(e) => setDisclosure(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-sage-100 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ColumnEditor column="shop" links={shop} onChange={setShop} />
          <ColumnEditor column="learn" links={learn} onChange={setLearn} />
          <ColumnEditor column="company" links={company} onChange={setCompany} />
          <ColumnEditor column="socials" links={socials} onChange={setSocials} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-sage-700"
          >
            Save footer (purges cache)
          </button>
        </div>
      </form>
      <form action={resetFooterSettings} className="mt-3">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-5 py-2 text-xs font-semibold text-ink-soft hover:bg-sage-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults (today&apos;s hardcoded footer)
        </button>
      </form>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-soft">
        SEO safety: Shop / Learn / Company accept internal links only (validated server-side). Anchor-text edits are safe;
        URL changes require a 301 redirect in <span className="font-mono">next.config.ts</span> plus a sitemap update in the
        same deploy. If Supabase is ever unreachable, the storefront instantly renders the frozen defaults — never empty.
      </p>
    </div>
  );
}
