import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for BeautyNestKorea: what we (don't) collect — no analytics, no advertising cookies — plus affiliate links and contact details.",
  alternates: { canonical: `${siteBaseUrl()}/privacy` },
};

const sections = [
  {
    title: "1. What we collect",
    body: "Almost nothing. This site runs no analytics script, no advertising tracker and no consent banner — because there is nothing to consent to. We do not run accounts, checkouts or newsletters, and we do not ask for your name, address or payment details. The only request logging is the standard, short-lived server log our hosting provider keeps to operate the site.",
  },
  {
    title: "2. Cookies",
    body: "We set no cookies for visitors. Our admin login (staff only) uses a Supabase authentication session, and clicking a retailer link may record an anonymised click in our database so we know which products are popular — this stores no personal data about you. Retailer and social sites you visit after clicking a link set their own cookies under their own policies.",
  },
  {
    title: "3. Affiliate & third-party links",
    body: "BeautyNestKorea links to third-party retailers and platforms (Amazon, Olive Young, Benable, social networks and others). Clicking those links takes you to sites we do not control. Their privacy policies, cookies and terms apply once you leave our site. We encourage you to review the privacy policy of any retailer before purchasing.",
  },
  {
    title: "4. Emails you send us",
    body: "If you email us, we receive your email address and message content solely to respond to you. We do not sell, rent or share your contact details, and we do not add you to a mailing list unless you explicitly ask to be added.",
  },
  {
    title: "5. Children's privacy",
    body: "This site is intended for a general audience and is not directed at children under 13. We do not knowingly collect personal information from children.",
  },
  {
    title: "6. Changes & contact",
    body: "If we ever add analytics, cookies or accounts, we will update this policy first with a notice of what changed. The current version will always be posted on this page with the year below. For privacy questions, email us anytime.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Legal</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Last updated: {new Date().getFullYear()} — BeautyNestKorea is a simple
        affiliate blog. We collect as little as possible: no accounts, no
        checkouts, no analytics scripts, no advertising cookies and no data sales.
      </p>

      <div className="glass mt-8 rounded-[2rem] p-8 sm:p-12">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="mt-6 space-y-8">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-serif-display text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Privacy questions? Email{" "}
        <a
          href="mailto:mohamedmosbeh255@gmail.com"
          className="font-semibold text-sage-700 hover:underline"
        >
          mohamedmosbeh255@gmail.com
        </a>{" "}
        or visit our{" "}
        <Link href="/contact" className="font-semibold text-sage-700 hover:underline">
          contact page
        </Link>
        .
      </p>
    </div>
  );
}
