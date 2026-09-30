import FooterSettingsForm from "@/components/admin/FooterSettingsForm";
import { getFooterSettingsAdmin } from "@/lib/footer-actions";

export const dynamic = "force-dynamic";

export default async function FooterSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const initial = await getFooterSettingsAdmin();
  return (
    <div className="max-w-5xl">
      <h1 className="font-serif-display text-3xl font-bold tracking-tight">Footer settings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Edit footer links without touching code. Saving purges the site-wide footer cache instantly.
      </p>
      <div className="mt-6">
        <FooterSettingsForm initial={initial} saved={sp.saved === "1"} />
      </div>
    </div>
  );
}
