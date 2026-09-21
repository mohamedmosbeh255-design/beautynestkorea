"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/validations";
import { CONCERNS, CATEGORIES, type Product } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ProductForm({
  initial,
  action,
}: {
  initial?: Partial<Product>;
  action: (formData: FormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors: formErrors },
  } = useForm<any>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      brand: initial?.brand ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      compare_at_price: initial?.compare_at_price ?? undefined,
      category: initial?.category ?? "Serum",
      concern: (initial?.concern ?? []).join(", "),
      skin_type: (initial?.skin_type ?? ["All"]).join(", "),
      key_ingredients: (initial?.key_ingredients ?? []).join(", "),
      image_urls: (initial?.image_urls ?? []).join("\n"),
      amazon_url: initial?.amazon_url ?? "",
      amazon_asin: initial?.amazon_asin ?? "",
      oliveyoung_url: initial?.oliveyoung_url ?? "",
      rating: initial?.rating ?? 4.5,
      review_count: initial?.review_count ?? 0,
      price_checked_at: initial?.priceCheckedAt ? String(initial.priceCheckedAt).slice(0, 10) : "",
      is_featured: initial?.is_featured ?? false,
      is_active: initial?.is_active ?? true,
    },
  });

  const errors = formErrors as any;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Local hint state (not watch()) so the React Compiler keeps optimizing this form.
  const [showShortHint, setShowShortHint] = useState<boolean>(() =>
    /amzn\.to|link\.amazon/i.test(String(initial?.amazon_url ?? "")) &&
    !String(initial?.amazon_asin ?? "").trim()
  );

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.set("title", values.title);
      fd.set("slug", values.slug);
      fd.set("brand", values.brand);
      fd.set("description", values.description);
      fd.set("price", String(values.price));
      if (values.compare_at_price) fd.set("compare_at_price", String(values.compare_at_price));
      fd.set("category", values.category);
      const toList = (v: unknown): string[] =>
        Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : String(v ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      toList(values.concern).forEach((c) => fd.append("concern", c));
      toList(values.skin_type).forEach((s) => fd.append("skin_type", s));
      fd.set("key_ingredients", toList(values.key_ingredients).join(", "));
      fd.set("image_urls", toList(values.image_urls).join("\n"));
      fd.set("amazon_url", values.amazon_url ?? "");
      fd.set("amazon_asin", (values.amazon_asin ?? "").toString().trim().toUpperCase());
      fd.set("oliveyoung_url", values.oliveyoung_url ?? "");
      if (values.rating != null) fd.set("rating", String(values.rating));
      fd.set("review_count", String(values.review_count ?? 0));
      fd.set("price_checked_at", String(values.price_checked_at ?? "").trim());
      if (values.is_featured) fd.set("is_featured", "on");
      if (!values.is_active) fd.set("is_active", "off");
      await action(fd);
    } catch (e: any) {
      setFormError(e?.message ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  const input = "w-full rounded-xl border border-sage-100 bg-white/85 px-3.5 py-2.5 text-sm outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100";
  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl p-6 sm:p-8">
      {formError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={label}>Title *</label>
          <input {...register("title")} className={input} placeholder="Advanced Snail 96 Mucin..." />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className={label}>Slug *</label>
          <input {...register("slug")} className={input} placeholder="cosrx-snail-96-mucin" />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>
        <div>
          <label className={label}>Brand *</label>
          <input {...register("brand")} className={input} placeholder="COSRX" />
          {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
        </div>
        <div>
          <label className={label}>Category *</label>
          <select {...register("category")} className={input}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Price ($) *</label>
          <input type="number" step="0.01" {...register("price")} className={input} />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className={label}>Compare-at price ($)</label>
          <input type="number" step="0.01" {...register("compare_at_price")} className={input} placeholder="Optional sale anchor" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Description * (min 20 chars)</label>
          <textarea {...register("description")} rows={4} className={input} placeholder="Key benefits, texture, who it's for..." />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>
        <div>
          <label className={label}>Concerns * (comma separated)</label>
          <input {...register("concern")} className={input} placeholder="Acne, Hydration" />
          <p className="mt-1 text-[11px] text-ink-soft">Available: {CONCERNS.join(", ")}. Enter comma-separated — form accepts array or string.</p>
          {errors.concern && <p className="mt-1 text-xs text-red-600">{errors.concern.message as string}</p>}
        </div>
        <div>
          <label className={label}>Key ingredients (comma separated)</label>
          <input {...register("key_ingredients")} className={input} placeholder="Snail Mucin, Hyaluronic Acid" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Image URLs * (one per line)</label>
          <textarea {...register("image_urls")} rows={3} className={input} placeholder="https://... (or Supabase storage URL after upload)" />
          {errors.image_urls && <p className="mt-1 text-xs text-red-600">{errors.image_urls.message as string}</p>}
          <p className="mt-1 text-[11px] text-ink-soft">Upload ONLY your own photos to the <code>product-images</code> bucket (public) and paste URLs here. Never upload retailer images (Amazon / Olive Young) — those stay hotlinked from the retailer CDN (see Image policy in README).</p>
        </div>
        <div>
          <label className={label}>Amazon affiliate link</label>
          {(() => {
            const { onChange: amazonOnChange, ...amazonRest } = register("amazon_url");
            return (
              <input
                {...amazonRest}
                className={input}
                placeholder="https://amazon.com/..."
                onChange={(e) => {
                  amazonOnChange(e);
                  const m = e.target.value.match(/(?:\/dp\/|\/gp\/product\/)(B0[0-9A-Z]{8})\b/);
                  if (m && !String(getValues("amazon_asin") ?? "").trim()) {
                    setValue("amazon_asin", m[1], { shouldValidate: true });
                  }
                  setShowShortHint(
                    /amzn\.to|link\.amazon/i.test(e.target.value) &&
                      !String(getValues("amazon_asin") ?? "").trim()
                  );
                }}
              />
            );
          })()}
          {errors.amazon_url && <p className="mt-1 text-xs text-red-600">{errors.amazon_url.message}</p>}
          {showShortHint && (
            <p className="mt-1 text-xs text-amber-700">
              Short links hide the product code. Open the link once and paste the full address from your browser bar (…/dp/B0…).
            </p>
          )}
        </div>
        <div>
          <label className={label}>Amazon ASIN (optional)</label>
          {(() => {
            const { onChange: asinOnChange, ...asinRest } = register("amazon_asin");
            return (
              <input
                {...asinRest}
                className={input}
                placeholder="B0XXXXXXXX"
                onChange={(e) => {
                  asinOnChange(e);
                  setShowShortHint(
                    /amzn\.to|link\.amazon/i.test(String(getValues("amazon_url") ?? "")) &&
                      !e.target.value.trim()
                  );
                }}
              />
            );
          })()}
          {errors.amazon_asin && <p className="mt-1 text-xs text-red-600">{errors.amazon_asin.message}</p>}
        </div>
        <div>
          <label className={label}>Olive Young affiliate link</label>
          <input {...register("oliveyoung_url")} className={input} placeholder="https://global.oliveyoung.com/..." />
          {errors.oliveyoung_url && <p className="mt-1 text-xs text-red-600">{errors.oliveyoung_url.message}</p>}
        </div>
        <div>
          <label className={label}>Rating (0–5)</label>
          <input type="number" step="0.1" {...register("rating")} className={input} />
        </div>
        <div>
          <label className={label}>Review count</label>
          <input type="number" {...register("review_count")} className={input} />
        </div>
        <div>
          <label className={label}>Price last checked (YYYY-MM-DD)</label>
          <input type="date" {...register("price_checked_at")} className={input} />
          {errors.price_checked_at && <p className="mt-1 text-xs text-red-600">{errors.price_checked_at.message}</p>}
          <p className="mt-1 text-[11px] text-ink-soft">Leave empty if unknown — the price block hides until a real check date is saved. Never copy updated_at here.</p>
        </div>
        <div className="flex items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("is_featured")} className="h-4 w-4 accent-sage-600" /> Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4 accent-sage-600" /> Active (visible publicly)
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-sage-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {initial?.title ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}
