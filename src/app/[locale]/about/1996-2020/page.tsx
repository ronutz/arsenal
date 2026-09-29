// ============================================================================
// src/app/[locale]/industry/history/1996-2020/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: 1996-2020 — "The practitioner". The longest era (5 sections),
// spanning the full vendor-and-implementation career. Content in the "history"
// namespace, rendered by the shared EraPage component.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import EraPage from "@/components/EraPage";

/**
 * PAGE TITLE (2026-09-26). This route shipped with NO generateMetadata export
 * at all, so it inherited the site-wide default <title> from [locale]/layout.tsx
 * and shared one identical string with thirteen other pages. That is the exact
 * fault check-page-titles was written for on 2026-08-16; the fix that day
 * reached the index routes and never came back for these.
 *
 * Title only, deliberately: ogImages() would point at public/og/page/1996-2020-<locale>.png,
 * and this slug is not in gen-og's STATIC_PAGES list, so the card does not exist
 * and check-og would fail on a manifest entry with nothing behind it. The page
 * keeps the default social card until the slug is added to that list.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "history" });
  return { title: `${t("era19962020.title")} \u00b7 ${t("era19962020.years")}` };
}

export default async function Era19962020Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <EraPage
      eraKey="era19962020"
      sections={["s1", "s2", "s3", "s4", "s5"]}
      next={{ slug: "2020-present", key: "era2020present" }}
    />
  );
}
