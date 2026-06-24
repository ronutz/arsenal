// ============================================================================
// src/app/[locale]/about/history/pre-1996/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: Before 1996 — "The curiosity". Thin wrapper; all content lives in
// the "history" message namespace, rendered by the shared EraPage component.
// ============================================================================

import { setRequestLocale } from "next-intl/server";
import EraPage from "@/components/EraPage";

export default async function Pre1996Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <EraPage
      eraKey="pre1996"
      sections={["s1", "s2", "s3", "s4"]}
      next={{ slug: "1996-2020", key: "era19962020" }}
    />
  );
}
