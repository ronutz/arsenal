// ============================================================================
// src/app/[locale]/dev-fun/mega-brain/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — Console do Mega Brain. A pt-BR-only easter-egg page, deliberately
// OUTSIDE the /tools framework (no catalogue entry, no golden vectors, no
// dual-locale article requirement — it is a joke, not a deterministic tool).
// pt-BR renders the console; every other locale is client-redirected to pt-BR.
// [locale] static params come from the layout, so no generateStaticParams here.
// ============================================================================

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import MegaBrainConsole from "@/components/dev-fun/MegaBrainConsole";
import MegaBrainRedirect from "@/components/dev-fun/MegaBrainRedirect";

const OG_TITLE = "🧠 Console do Mega Brain — FORÇA TOTAL";
const OG_DESC = "Ative o Mega Brain e empurre a força até 100%. Um alívio de estresse pra dev, com direito ao react do Mano. 🍺";

// Funny, curiosity-sparking social preview (og-mega-brain.png). The tool is
// pt-BR only, so the card is pt-BR regardless of the locale segment.
export function generateMetadata(): Metadata {
  const image = { url: "/og-mega-brain.png", width: 1200, height: 630, alt: "Console do Mega Brain — FORÇA TOTAL 100%" };
  return {
    title: OG_TITLE,
    description: OG_DESC,
    openGraph: {
      title: OG_TITLE,
      description: OG_DESC,
      type: "website",
      locale: "pt_BR",
      siteName: "ronutz.com",
      url: "https://ronutz.com/pt-BR/dev-fun/mega-brain",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: OG_TITLE,
      description: OG_DESC,
      images: ["/og-mega-brain.png"],
    },
  };
}

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
