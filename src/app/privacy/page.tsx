import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for BeautyNestKorea: analytics, cookies and third-party links for our affiliate skincare blog.",
};

const sections = [
  {
    title: "1. What we collect",
    body: "We do not run accounts, checkouts or newsletters that store your personal data. We do not ask for your name, address or payment details. The only data collected automatically is basic, anonymized analytics (such as pages visited, device type and approximate region) used to understand which guides are helpful and improve the site.",
  },
  {
    title: "2. Cookies",
    body: "We and our service providers (analytics and affiliate/network partners such as Amazon, Olive Young and link-measurement tools) may use cookies or similar technologies to remember preferences, measure traffic and attribute affiliate referrals. You can block or delete cookies in your browser settings; the site will still work, though some embedded retailer features may behave differently.",
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
    body: "We may update this policy as the site evolves; the current version will always be posted on this page with the year below. For privacy questions, email us anytime.",
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
        checkouts, and no data sales — just basic analytics to keep the guides useful.
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
