"use client";

import { useState } from "react";

/**
 * Lightweight newsletter capture. Posts to /api/subscribe.
 * Duplicate emails are treated as success (user-friendly).
 * No auth required — the storefront can collect emails without a login wall.
 */
export default function EmailCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Something went wrong. Try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="text-center text-sm font-semibold text-sage-700">
        ✓ You are subscribed — new picks land in your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full flex-1 rounded-xl border border-sand-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
        aria-label="Email for newsletter"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-sage-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-800 disabled:opacity-50"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
      {error && <p className="text-xs text-blush-600">{error}</p>}
    </form>
  );
}