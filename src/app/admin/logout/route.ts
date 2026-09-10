import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { MOCK_ADMIN_COOKIE } from "@/app/api/mock-login/route";

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut();
  } catch { /* ignore */ }
  // Clear mock-mode session cookie (no-op when using real Supabase auth)
  const store = await cookies();
  store.delete(MOCK_ADMIN_COOKIE);
  redirect("/admin/login");
}
