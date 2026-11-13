// ============================================================================
// /industry/chapters/cabletron-enterasys - CAREER CHAPTER
//
// Rodolfo's passage through this company. The company's own history lives at
// /industry/cabletron-enterasys and is reached from a card below; it is deliberately not
// repeated here.
// ============================================================================

// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
// One description for the meta, og and twitter fields, merged into the card.
import { withDescription } from "@/lib/metaDescription";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import CareerChapterPage from "@/components/CareerChapterPage";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vendors" });
  return {
    title: `${t("cabletron.name")} - ${t("careerMetaSuffix")}`,
    // The Industry card (12/11/2026: the page shipped the generic one), with the description in the meta, og and twitter fields.
    ...withDescription(t("cabletron.tagline"), ogImages("page", "industry", locale, t("cabletron.name")), "industry/chapters/cabletron-enterasys"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <CareerChapterPage
      vendorKey="cabletron"
      slug="cabletron-enterasys"
      sections={8}
    />
  );
}
