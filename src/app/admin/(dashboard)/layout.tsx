import Link from "next/link";
import { LayoutDashboard, Package, Plus, ExternalLink, LogOut } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mockMode = !isSupabaseConfigured();
  return (
    <div>
      <div className="glass flex flex-wrap items-center gap-2 rounded-3xl p-3">
        <span className="mr-2 px-3 font-serif-display text-lg font-bold">Admin</span>
        {mockMode && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Mock mode
          </span>
        )}
        <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium hover:bg-white/70">
          <LayoutDashboard className="h-4 w-4" /> Overview
        </Link>
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium hover:bg-white/70">
          <Package className="h-4 w-4" /> Products
        </Link>
        <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700">
          <Plus className="h-4 w-4" /> Add product
        </Link>
        <span className="flex-1" />
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-ink-soft hover:bg-white/70">
          <ExternalLink className="h-4 w-4" /> View site
        </Link>
        <form action="/admin/logout" method="post">
          <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-ink-soft hover:bg-white/70">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </form>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
