"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema } from "@/lib/validations";
import { ARTICLE_CATEGORIES, type Article } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export interface ProductOption {
  id: string;
  title: string;
  brand: string;
}

const MAX_RELATED = 5;

export default function ArticleForm({
  initial,
  productOptions,
  action,
}: {
  initial?: Partial<Article>;
  productOptions: ProductOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: formErrors },
  } = useForm<any>({
    resolver: zodResolver(articleSchema) as any,
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      excerpt: initial?.excerpt ?? "",
      cover_image_url: initial?.cover_image_url ?? "",
      category: initial?.category ?? ARTICLE_CATEGORIES[0],
      content: initial?.content ?? "",
      published_at: initial?.published_at ? String(initial.published_at).slice(0, 10) : "",
      is_published: initial?.is_published ?? false,
    },
  });

  const errors = formErrors as any;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(initial?.related_product_ids ?? []);
  // Auto-generate slug from title until the editor touches the slug field.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_RELATED) return prev;
      return [...prev, id];
    });
  };

  const onSubmit = async (values: any) => {
    if (selected.length > MAX_RELATED) {
      setFormError(`Pick at most ${MAX_RELATED} related products (currently ${selected.length}).`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.set("title", values.title);
      fd.set("slug", values.slug || slugify(String(values.title ?? "")));
      fd.set("excerpt", values.excerpt ?? "");
      fd.set("cover_image_url", values.cover_image_url ?? "");
      fd.set("category", values.category);
      fd.set("content", values.content ?? "");
      fd.set("published_at", String(values.published_at ?? "").trim());
      selected.forEach((id) => fd.append("related_product_ids", id));
      if (values.is_published) fd.set("is_published", "on");
      await action(fd);
    } catch (e: any) {
      setFormError(e?.message ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  const input = "w-full rounded-xl border border-sage-100 bg-white/85 px-3.5 py-2.5 text-sm outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100";
  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft";

  const { onChange: titleOnChange, ...titleRest } = register("title");
  const { onChange: slugOnChange, ...slugRest } = register("slug");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl p-6 sm:p-8">
      {formError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={label}>Title *</label>
          <input
            {...titleRest}
            className={input}
            placeholder="The 5-Step K-Beauty Morning Routine…"
            onChange={(e) => {
              titleOnChange(e);
              if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: true });
            }}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className={label}>Slug * (auto-generated, editable)</label>
          <input
            {...slugRest}
            className={input}
            placeholder="5-step-k-beauty-morning-routine"
            onChange={(e) => {
              slugOnChange(e);
              setSlugTouched(true);
            }}
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>
        <div>
          <label className={label}>Category *</label>
          <select {...register("category")} className={input}>
            {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Cover image URL</label>
          <input {...register("cover_image_url")} className={input} placeholder="https://…" />
          {errors.cover_image_url && <p className="mt-1 text-xs text-red-600">{errors.cover_image_url.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={label}>Excerpt (shown in listings & search results)</label>
          <textarea {...register("excerpt")} rows={2} className={input} placeholder="One or two sentences…" maxLength={300} />
          {errors.excerpt && <p className="mt-1 text-xs text-red-600">{errors.excerpt.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={label}>Content * (markdown supported, min 50 chars)</label>
          <textarea {...register("content")} rows={14} className={input} placeholder={"## Why this routine works\n\nStart with a gentle cleanser…"} />
          {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          <p className="mt-1 text-[11px] text-ink-soft">Headings, lists, bold and links render automatically. No affiliate disclosure needed in the body — the site-wide notice covers monetised links.</p>
        </div>
        <div className="md:col-span-2">
          <label className={label}>Related products ({selected.length}/{MAX_RELATED}) — drives the “Recommended Products” section</label>
          {productOptions.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No active products yet. Add products first, then link them here.</p>
          ) : (
            <ul className="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-sage-100 bg-white/60 p-3">
              {productOptions.map((p) => {
                const checked = selected.includes(p.id);
                const disabled = !checked && selected.length >= MAX_RELATED;
                return (
                  <li key={p.id}>
                    <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${checked ? "bg-sage-100 font-semibold" : "hover:bg-sage-50"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 accent-sage-600"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{p.title}</span>
                        <span className="block text-xs font-normal text-ink-soft">{p.brand}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-1 text-[11px] text-ink-soft">Pick 1–5 products readers should buy after this guide. Order: selection order is kept on the live page.</p>
        </div>
        <div>
          <label className={label}>Publish date (YYYY-MM-DD)</label>
          <input type="date" {...register("published_at")} className={input} />
          {errors.published_at && <p className="mt-1 text-xs text-red-600">{errors.published_at.message}</p>}
          <p className="mt-1 text-[11px] text-ink-soft">Leave empty when publishing — today&apos;s date is stamped automatically.</p>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("is_published")} className="h-4 w-4 accent-sage-600" /> Published (visible publicly)
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-sage-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.title ? "Save changes" : "Add article"}
      </button>
    </form>
  );
}
