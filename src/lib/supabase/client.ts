import { createBrowserClient } from "@supabase/ssr";
import type { Product } from "@/lib/types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Return a stub that throws a friendly error only when used.
    // This lets the site run on mock data without env configured.
    return null;
  }
  return createBrowserClient(url, anon);
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type { Product };
