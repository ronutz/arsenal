// ============================================================================
// src/app/[locale]/copy8825140637/page.tsx
// ----------------------------------------------------------------------------
// COPY EDITOR — internal authoring/translation workbench.
//
// GATING (identical to the admin console, and just as HONEST about its limits):
//   • lives at an unguessable URI (obscurity is the only gate a static site has);
//   • generated EN-ONLY (one internal page, not multiplied across locales);
//   • noindex / nofollow (robots) and excluded from search (data-pagefind-ignore
//     on a display:contents wrapper, so header + footer are excluded too);
//   • dark by default: the whole surface is wrapped in <PrivPreviewOnly>, so it
//     renders only when the ?priv= preview token is active;
//   • linked from nowhere (no nav / footer entry).
//   SECURITY NOTE: none of this is access control. Anyone with the URL can load
//   the page; the ?priv= flag is render-only and devtools can flip it. The copy
//   shown here is public site text anyway (it ships in every locale bundle), so
//   nothing secret is exposed — but do not add anything sensitive to this page.
//
// WHY EXPORT, NOT SAVE: ronutz.com is a static export with no server and no
// database (the Worker only serves assets and runs stateless compute). There is
// nowhere to POST an edit, so this page cannot write to the live site. It loads
// every LIVE locale's message file at build time, lets you edit in the browser,
// and EXPORTS the result (full <locale>.json or a changed-keys diff) to commit
// into src/i18n/messages/ and redeploy. It is a workbench, not a live CMS.
//
// Only the 16 LIVE locales are offered (each has a real message file). Stub
// locales have no file and fall back to English, so there is nothing to edit.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import PrivPreviewOnly from "@/components/PrivPreviewOnly";
import CopyEditor, { type CopyEditorLabels } from "@/components/CopyEditor";
import { LIVE_LOCALES } from "@/i18n/locales";

// Static imports of every LIVE locale's messages (build-time; no runtime fetch).
import daMsgs from "@/i18n/messages/da.json";
import deMsgs from "@/i18n/messages/de.json";
import enMsgs from "@/i18n/messages/en.json";
import esMsgs from "@/i18n/messages/es.json";
import filMsgs from "@/i18n/messages/fil.json";
import frMsgs from "@/i18n/messages/fr.json";
import itMsgs from "@/i18n/messages/it.json";
import msMsgs from "@/i18n/messages/ms.json";
import nbMsgs from "@/i18n/messages/nb.json";
import nlMsgs from "@/i18n/messages/nl.json";
import plMsgs from "@/i18n/messages/pl.json";
import ptBRMsgs from "@/i18n/messages/pt-BR.json";
import ruMsgs from "@/i18n/messages/ru.json";
import svMsgs from "@/i18n/messages/sv.json";
import trMsgs from "@/i18n/messages/tr.json";
import zhHansMsgs from "@/i18n/messages/zh-Hans.json";

// Map code -> messages, so we can assemble the prop from LIVE_LOCALES in order.
const MESSAGES_BY_CODE: Record<string, unknown> = {
  da: daMsgs,
  de: deMsgs,
  en: enMsgs,
  es: esMsgs,
  fil: filMsgs,
  fr: frMsgs,
  it: itMsgs,
  ms: msMsgs,
  nb: nbMsgs,
  nl: nlMsgs,
  pl: plMsgs,
  "pt-BR": ptBRMsgs,
  ru: ruMsgs,
  sv: svMsgs,
  tr: trMsgs,
  "zh-Hans": zhHansMsgs,
};

// Internal surface: keep it out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Copy editor",
};

// Ship EN-ONLY. One internal page, not 24 localized copies.
export function generateStaticParams() {
  return [{ locale: "en" }];
}

export default async function CopyEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("copyEditor");
  const tNav = await getTranslations("nav");

  // Assemble the editor's data: every live locale, in LIVE_LOCALES order, with
  // its display name. English leads (it is the source-of-truth locale).
  const locales = LIVE_LOCALES.filter((l) => MESSAGES_BY_CODE[l.code]).map((l) => ({
    code: l.code,
    name: l.nativeName,
    messages: MESSAGES_BY_CODE[l.code],
  }));

  const labels: CopyEditorLabels = {
    langLabel: t("langLabel"),
    searchLabel: t("searchLabel"),
    searchPlaceholder: t("searchPlaceholder"),
    onlyChanged: t("onlyChanged"),
    changedCount: t.raw("changedCount"),
    exportFull: t("exportFull"),
    exportDiff: t("exportDiff"),
    copyClipboard: t("copyClipboard"),
    download: t("download"),
    reset: t("reset"),
    resetOne: t("resetOne"),
    empty: t("empty"),
    diffTitle: t("diffTitle"),
    fullTitle: t("fullTitle"),
    close: t("close"),
    copied: t("copied"),
    namespaceLabel: t("namespaceLabel"),
  };

  return (
    // display:contents wrapper carries data-pagefind-ignore so the WHOLE page
    // (header + footer included) is excluded from search, matching the console.
    <div data-pagefind-ignore="all" style={{ display: "contents" }}>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <PrivPreviewOnly>
        <main id="main" data-pagefind-ignore="all">
          <section className="section">
            <div className="container copyedit-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="copyedit-title">{t("title")}</h1>
              <p className="copyedit-lede">{t("lede")}</p>
              <p className="copyedit-caveat">{t("caveat")}</p>
              <CopyEditor locales={locales} labels={labels} />
            </div>
          </section>
        </main>
      </PrivPreviewOnly>

      <SiteFooter />
    </div>
  );
}
