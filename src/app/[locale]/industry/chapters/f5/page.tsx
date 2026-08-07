// ============================================================================
// /industry/chapters/f5 - CAREER CHAPTER
//
// Rodolfo's passage through this company. The company's own history lives at
// /industry/f5 and is reached from a card below; it is deliberately not
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
    title: `${t("f5.name")} - ${t("careerMetaSuffix")}`,
    description: t("f5.tagline"),
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
      vendorKey="f5"
      slug="f5"
      hubKey="f5"
      sections={2}
    />
  );
}
