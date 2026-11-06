import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut();
  } catch { /* ignore */ }
  redirect("/admin/login");
}
