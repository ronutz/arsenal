// ============================================================================
// src/app/[locale]/about/history/2020-present/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: 2020-present — "The instructor". The current era; next is null
// (last in the sequence). Content in the "history" namespace, rendered by the
// shared EraPage component.
// ============================================================================

import { setRequestLocale } from "next-intl/server";
import EraPage from "@/components/EraPage";

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
