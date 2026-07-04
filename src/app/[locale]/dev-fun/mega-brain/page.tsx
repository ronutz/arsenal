// ============================================================================
// src/app/[locale]/dev-fun/mega-brain/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — Console do Mega Brain. A pt-BR-only easter-egg page, deliberately
// OUTSIDE the /tools framework (no catalogue entry, no golden vectors, no
// dual-locale article requirement — it is a joke, not a deterministic tool).
// pt-BR renders the console; every other locale is client-redirected to pt-BR.
// [locale] static params come from the layout, so no generateStaticParams here.
// ============================================================================

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import MegaBrainConsole from "@/components/dev-fun/MegaBrainConsole";
import MegaBrainRedirect from "@/components/dev-fun/MegaBrainRedirect";

export default async function MegaBrainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isPt = locale === "pt-BR";

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container mb-page-container">
            {isPt ? <MegaBrainConsole /> : <MegaBrainRedirect />}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
