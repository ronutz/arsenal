// ============================================================================
// src/app/[locale]/industry/history/2020-present/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: 2020-present — "The instructor". The current era; next is null
// (last in the sequence). Content in the "history" namespace, rendered by the
// shared EraPage component.
// ============================================================================

// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
import { getTranslations, setRequestLocale } from "next-intl/server";
import EraPage from "@/components/EraPage";

/**
 * PAGE TITLE (2026-09-26). This route shipped with NO generateMetadata export
 * at all, so it inherited the site-wide default <title> from [locale]/layout.tsx
 * and shared one identical string with thirteen other pages. That is the exact
 * fault check-page-titles was written for on 2026-08-16; the fix that day
 * reached the index routes and never came back for these.
 *
 * SOCIAL CARD (12/11/2026): the page names the "about" card drawn by scripts/gen-og.mts
 * instead of the generic one it shipped before.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "history" });
  return { title: `${t("era2020present.title")} \u00b7 ${t("era2020present.years")}`, ...ogImages("page", "about", locale, `${t("era2020present.title")} \u00b7 ${t("era2020present.years")}`) }; // the page's card (12/11/2026: it shipped the generic one)
}

export default async function Era2020PresentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <EraPage
      eraKey="era2020present"
      sections={["s1", "s2", "s3", "s4"]}
      next={null}
    />
  );
}
