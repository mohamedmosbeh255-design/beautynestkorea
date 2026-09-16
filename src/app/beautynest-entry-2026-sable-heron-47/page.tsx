import Link from "next/link";
import type { Metadata } from "next";
import { Lock, ArrowRight } from "lucide-react";

// ─── SITE OWNER REFERENCE ─────────────────────────────────────────────
// Unlisted staff entry point: /beautynest-entry-2026-sable-heron-47
// (unguessable slug: year + random words). Share ONLY with staff.
//  • PUBLIC page: logged-out staff see it (button to /admin/login);
//    signed-in staff are sent straight to /admin by src/middleware.ts.
//  • /admin/login itself is also public (the sign-in form must be
//    reachable); everything else under /admin/* bounces logged-out
//    visitors to /admin/login.
//  • NOT linked from any public page (nav, footer, sitemap all clean).
//  • NOT in sitemap.xml, NO robots meta — naturally undiscoverable.
//  • Every hit is logged in src/middleware.ts ([admin-entry] lines).
// ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Admin Login — BeautyNestKorea",
  description: "Staff entry point for BeautyNestKorea administration.",
};

export default function AdminEntryPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="glass-strong w-full rounded-[2rem] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="font-serif-display mt-4 text-2xl font-bold">Admin Login — BeautyNestKorea</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Staff only. Continue to the secure sign-in.
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
