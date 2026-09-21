import type { Metadata } from "next";
import Link from "next/link";
import { siteBaseUrl } from "@/lib/market-report";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for BeautyNestKorea: Google Analytics, cookies, Amazon Associates and Olive Young affiliate tracking, and your GDPR/CCPA rights.",
  alternates: { canonical: `${siteBaseUrl()}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-600">Legal</p>
      <h1 className="font-serif-display mt-2 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Last updated: September 21, 2026 — this policy explains what
        BeautyNestKorea collects, how cookies and affiliate tracking work here,
        and the rights you have over your data.
      </p>

      <div className="glass mt-8 rounded-[2rem] p-8 sm:p-12">
        <div className="max-w-3xl space-y-6 text-sm leading-relaxed text-ink-soft sm:text-base">
          <div>
            <h2 className="font-serif-display text-xl font-bold text-ink">What we collect</h2>
            <p className="mt-2">
              We use Google Analytics to understand aggregate, anonymised usage
              of the site — such as which pages are visited and which products
              are popular. Google Analytics sets its own cookies and processes
              data under Google&apos;s privacy policy. We do not run accounts,
              checkouts, or newsletters, and we do not ask for your name,
              address, or payment details.
            </p>
          </div>
          <div>
            <h2 className="font-serif-display text-xl font-bold text-ink">
              Cookies and affiliate tracking
            </h2>
            <p className="mt-2">
              Our pages use a small number of cookies for analytics and basic
              site operation. When you click a retailer link, affiliate programs
              including Amazon Associates and Olive Young may set their own
              cookies to attribute any resulting purchase to this site — that
              tracking happens on the retailer&apos;s systems under their own
              privacy policies, and we never see your payment or account data.
              Clicking an outbound affiliate link may also record an anonymised
              click in our database so we know which products are popular.
            </p>
          </div>
          <div>
            <h2 className="font-serif-display text-xl font-bold text-ink">Your rights</h2>
            <p className="mt-2">
              Under the GDPR (EU/UK) and the CCPA/CPRA (California), you have
              the right to access, correct, or delete personal data held about
              you, to object to or restrict certain processing, and to opt out
              of the sale or sharing of personal information. We do not sell
              personal data. You can block or clear cookies at any time in your
              browser settings, and you can use an ad-blocker or opt out of
              Google Analytics to limit analytics collection. To exercise a
              privacy right, contact us and we will respond within the time
              limits the applicable law requires.
            </p>
          </div>
          <div>
            <h2 className="font-serif-display text-xl font-bold text-ink">Changes</h2>
            <p className="mt-2">
              If we add new analytics, cookies, or data uses, we will update
              this policy first. The current version is always posted on this
              page with the date above.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/" className="font-semibold text-sage-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
