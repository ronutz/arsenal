// ============================================================================
// /industry/chapters/extreme - CAREER CHAPTER
//
// Rodolfo's passage through this company. The company's own history lives at
// /industry/extreme and is reached from a card below; it is deliberately not
// repeated here.
// ============================================================================

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
    title: `${t("extreme.name")} - ${t("careerMetaSuffix")}`,
    description: t("extreme.tagline"),
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
      vendorKey="extreme"
      slug="extreme"
      hubKey="extreme"
      sections={2}
    />
  );
}
