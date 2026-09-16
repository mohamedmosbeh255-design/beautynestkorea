"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auto-continues authenticated staff to /admin/login. The visible button
// on the page remains as a fallback (e.g. slow JS, screen readers).
export default function EntryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);
  return null;
}
