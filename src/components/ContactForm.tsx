"use client";

import { useState } from "react";

/**
 * Contact form. Posts to /api/contact.
 * No auth required — anyone can reach out.
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      setStatus("error");
      return;
    }
    if (message.trim().length < 5) {
      setError("Message is too short");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-sage-50 px-6 py-6 text-center">
        <p className="font-semibold text-sage-800">✓ Message sent</p>
        <p className="mt-1 text-sm text-sage-700">We will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Your name"
          className="w-full rounded-xl border border-sand-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Email
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-sand-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded-xl border border-sand-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
        />
      </div>
      {error && <p className="text-xs text-blush-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sage-700 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}