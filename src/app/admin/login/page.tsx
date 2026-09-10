"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) {
        // Mock mode: verify via API so a session cookie is set (persists refresh)
        const res = await fetch("/api/mock-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Invalid mock credentials.");
        router.push("/admin");
        router.refresh();
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword(values);
      if (signInError) throw new Error(signInError.message);
      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="glass-strong w-full rounded-[2rem] p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="font-serif-display mt-4 text-center text-2xl font-bold">Admin login</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">BeautyNestKorea dashboard — authorized staff only.</p>
        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">Email</label>
            <input {...register("email")} type="email" placeholder="admin@beautynestkorea.com"
              className="w-full rounded-xl border border-sage-100 bg-white/85 px-3.5 py-2.5 text-sm outline-none focus:border-sage-400" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">Password</label>
            <input {...register("password")} type="password" placeholder="••••••••"
              className="w-full rounded-xl border border-sage-100 bg-white/85 px-3.5 py-2.5 text-sm outline-none focus:border-sage-400" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-sage-700 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Mock mode: use <code>admin@beautynestkorea.com</code> / <code>admin123</code>. With Supabase
          configured, sign in with your real admin account (must exist in <code>admin_users</code>).
        </p>
      </div>
    </div>
  );
}
