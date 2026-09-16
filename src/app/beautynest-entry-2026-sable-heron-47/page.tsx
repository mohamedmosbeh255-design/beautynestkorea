import Link from "next/link";
import type { Metadata } from "next";
import { Lock, ArrowRight } from "lucide-react";
import EntryRedirect from "./EntryRedirect";

// ─── SITE OWNER REFERENCE ─────────────────────────────────────────────
// Unlisted staff entry point: /beautynest-entry-2026-sable-heron-47
// (unguessable slug: year + random words). Share ONLY with staff.
//  • NOT linked from any public page (nav, footer, sitemap all clean).
//  • NOT in sitemap.xml, NO robots meta — naturally undiscoverable.
//  • Requires an authenticated Supabase session: logged-out visitors are
//    bounced to / by src/middleware.ts, and every hit is logged there.
//  • Authenticated staff land here, auto-continue to /admin/login
//    (which forwards to /admin), or use the button below.
// ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Admin Login — BeautyNestKorea",
  description: "Staff entry point for BeautyNestKorea administration.",
};

export default function AdminEntryPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <EntryRedirect />
      <div className="glass-strong w-full rounded-[2rem] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="font-serif-display mt-4 text-2xl font-bold">Admin Login — BeautyNestKorea</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Staff only. Continuing to the secure sign-in…
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-sage-700"
        >
          Continue to Admin Login <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
