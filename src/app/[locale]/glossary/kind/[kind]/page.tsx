// ============================================================================
// src/app/[locale]/glossary/kind/[kind]/page.tsx
// ----------------------------------------------------------------------------
// One page per glossary KIND: /glossary/kind/lore, /glossary/kind/expression,
// and so on. The second axis, after the domain pages of the same day.
//
// WHY THIS ONE MATTERS MORE THAN IT LOOKS (PRIME, 2026-09-14, "findability
// needs improvements").
//
// The glossary holds 1,703 entries, and 588 of them are NOT definitions:
//
//     lore        343    how the industry remembers things
//     expression  145    what people actually say
//     jargon      100    the words that mark an insider
//
// Until now every one of those sat in the same alphabetical wall as "MTU" and
// "OCSP", indistinguishable from a protocol definition. A reader could only
// find "the industry's folklore" by already knowing which folklore they wanted,
// which is no way to find folklore.
//
// Domains answer "which area is this about". Kinds answer "what SORT of thing
// is this" - and that is the axis on which the most distinctive material in
// this glossary has been invisible.
//
// Same scope rule as the domain pages: every LIVE locale, matching the index
// rather than the term pages.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import {
  getAllGlossaryEntries,
  getGlossaryKinds,
  type GlossaryKind,
} from "@/content/glossary/glossary";

export const dynamicParams = false;

export function generateStaticParams() {
  const kinds = getGlossaryKinds();
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    kinds.map((kind) => ({ locale, kind }))
  );
}

function entriesFor(kind: string) {
  return getAllGlossaryEntries()
    .filter((e) => e.kind === kind)
    .sort((a, b) =>
      a.headword.localeCompare(b.headword, "en", { sensitivity: "base" })
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}): Promise<Metadata> {
  const { locale, kind } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const label = t(`kinds.${kind}`);
  return {
    title: t("kindPageTitle", { kind: label }),
    description: t("kindPageDescription", {
      kind: label,
      count: entriesFor(kind).length,
    }),
  };
}

export default async function GlossaryKindPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}) {
  const { locale, kind } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("glossary");
  const tNav = await getTranslations("nav");

  const label = t(`kinds.${kind}`);
  const entries = entriesFor(kind);
  const others = getGlossaryKinds().filter((k) => k !== kind);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              items={[{ href: "/glossary", label: t("title") }, { label }]}
            />
            <h1 className="page-hero-title">
              {t("kindPageTitle", { kind: label })}
            </h1>
            <p className="page-hero-lede">
              {t("kindPageDescription", { kind: label, count: entries.length })}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <ul className="glossary-domain-list">
              {entries.map((e) => (
                <li key={e.slug} className="glossary-domain-item">
                  <Link href={`/glossary/${e.slug}`} className="glossary-domain-term">
                    {e.headword}
                  </Link>
                  {e.expansion && (
                    <span className="glossary-domain-expansion">{e.expansion}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-title">{t("otherKinds")}</h2>
            <ul className="glossary-domain-rail">
              {others.map((k) => (
                <li key={k}>
                  <Link href={`/glossary/kind/${k}`} className="glossary-domain-chip">
                    {t(`kinds.${k}` as `kinds.${GlossaryKind}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/glossary" className="glossary-domain-chip">
                  {t("allKinds")}
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
