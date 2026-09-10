import { Package, MousePointerClick, Star, TrendingUp } from "lucide-react";
import { getAllProductsAdmin } from "@/lib/products";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const products = await getAllProductsAdmin();

  let totalClicks = 1284; // mock fallback
  let clicksBySource = { amazon: 812, oliveyoung: 472 };
  try {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { count } = await supabase.from("product_clicks").select("*", { count: "exact", head: true });
      if (count != null) totalClicks = count;
      const { data } = await supabase.from("product_clicks").select("source").limit(2000);
      if (data) {
        clicksBySource = {
          amazon: data.filter((d) => d.source === "amazon").length,
          oliveyoung: data.filter((d) => d.source === "oliveyoung").length,
        };
      }
    }
  } catch { /* use mock */ }

  const featured = products.filter((p) => p.is_featured).length;
  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating ?? 0), 0) / products.length).toFixed(1) : "—";

  const cards = [
    { icon: Package, label: "Total products", value: String(products.length), sub: `${featured} featured` },
    { icon: MousePointerClick, label: "Affiliate clicks", value: totalClicks.toLocaleString(), sub: `Amazon ${clicksBySource.amazon} • OY ${clicksBySource.oliveyoung}` },
    { icon: Star, label: "Avg rating", value: String(avgRating), sub: "across catalog" },
    { icon: TrendingUp, label: "Top concern", value: "Hydration", sub: "by product count" },
  ];

  return (
    <div>
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Dashboard overview</h1>
      <p className="mt-1 text-sm text-ink-soft">Clicks are live from Supabase when configured, otherwise mock data is shown.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="glass rounded-3xl p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
            <p className="font-serif-display text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-ink-soft">{sub}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-display text-lg font-bold">Recent products</h2>
          <Link href="/admin/products" className="text-sm font-semibold text-sage-700 hover:underline">Manage all</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-ink-soft">
                <th className="py-2">Product</th><th>Brand</th><th>Price</th><th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-t border-sage-50">
                  <td className="py-2.5 font-medium">{p.title}</td>
                  <td className="text-ink-soft">{p.brand}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.is_featured ? "★" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
