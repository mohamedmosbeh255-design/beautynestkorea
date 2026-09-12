import type { Metadata } from "next";
import { Mail, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact BeautyNestKorea by email or follow us on our social platforms.",
};

const socials = [
  { href: "https://www.facebook.com/mohamed.mosbeh.508798/", label: "Facebook", desc: "Follow our updates & community picks" },
  { href: "https://www.instagram.com/beautynest_k_beauty_expert/", label: "Instagram", desc: "Routines, texture shots & quick tips" },
  { href: "https://fr.pinterest.com/beautynest_skincare/", label: "Pinterest", desc: "Save routines & product boards" },
  { href: "https://benable.com/BeautyNest2026", label: "Benable", desc: "Shop our curated product lists" },
  { href: "https://c8ke.me/beautynestkorea", label: "Short links", desc: "All our links in one place" },
  {
    href: "https://sites.google.com/view/beautynestskincare/kbeauty-serums",
    label: "Google Sites",
    desc: "K-beauty serums guide",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Get in touch</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
        Questions about a product, a routine, or a collaboration? Email us — we
        read everything and reply as soon as we can.
      </p>

      <a
        href="mailto:mohamedmosbeh255@gmail.com"
        className="glass mt-8 flex flex-col gap-4 rounded-[2rem] p-8 transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row sm:items-center sm:p-10"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 text-white">
          <Mail className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-sage-600">
            Email us anytime
          </span>
          <span className="font-serif-display mt-1 block break-all text-xl font-bold sm:text-2xl">
            mohamedmosbeh255@gmail.com
          </span>
          <span className="mt-1 block text-sm text-ink-soft">
            Product questions, routine help & partnerships welcome.
          </span>
        </span>
      </a>

      <h2 className="font-serif-display mt-10 text-2xl font-bold tracking-tight">
        Find us on social
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {socials.map(({ href, label, desc }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass group rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="flex items-center justify-between">
              <span className="font-serif-display text-lg font-bold">{label}</span>
              <ArrowUpRight className="h-4 w-4 text-sage-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span className="mt-1.5 block text-sm text-ink-soft">{desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
