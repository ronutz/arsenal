// ============================================================================
// src/app/[locale]/about/history/1996-2020/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: 1996-2020 — "The practitioner". The longest era (5 sections),
// spanning the full vendor-and-implementation career. Content in the "history"
// namespace, rendered by the shared EraPage component.
// ============================================================================

import { setRequestLocale } from "next-intl/server";
import EraPage from "@/components/EraPage";

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
