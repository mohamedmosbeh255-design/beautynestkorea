import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAllArticlesAdmin } from "@/lib/articles";
import { deleteArticle } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAllArticlesAdmin();
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-3xl font-bold tracking-tight">Articles ({articles.length})</h1>
          <p className="mt-1 text-sm text-ink-soft">Guides with strategic product links. Publishing revalidates the storefront.</p>
        </div>
        <Link href="/admin/articles/new" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-700">
          <Plus className="h-4 w-4" /> Add
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {articles.map((a) => (
          <div key={a.id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="truncate">{a.title}</span>
                {a.is_published ? (
                  <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sage-700">Published</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">Draft</span>
                )}
              </p>
              <p className="text-xs text-ink-soft">{a.category} • {a.related_product_ids.length} linked product{a.related_product_ids.length === 1 ? "" : "s"}{a.published_at ? ` • ${String(a.published_at).slice(0, 10)}` : ""}</p>
              <p className="truncate text-xs text-ink-soft">/{a.slug}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/articles/${a.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold hover:bg-sage-50">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <form action={deleteArticle.bind(null, a.id)}>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center text-sm text-ink-soft">No articles yet. Add your first guide.</div>
        )}
      </div>
    </div>
  );
}
