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
// nowhere to POST an edit, so this page cannot write to the live site. It fetches
// the chosen LIVE locale's published pack (/locales/<code>.json) when you pick it, lets you edit in the browser,
// and EXPORTS the result (full <locale>.json or a changed-keys diff) to commit
// into src/i18n/messages/ and redeploy. It is a workbench, not a live CMS.
//
// Only the LIVE locales are offered (each has a real message file). Stub
// locales have no file and fall back to English, so there is nothing to edit.
// The packs of the stubs that still have one (it, ru, tr, zh-Hans) stay imported for when they come back; the
// retired locales' packs were deleted (PRIME 09/11/2026 22:14).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import PrivPreviewOnly from "@/components/PrivPreviewOnly";
import CopyEditor, { type CopyEditorLabels } from "@/components/CopyEditor";
import { LIVE_LOCALES } from "@/i18n/locales";

// The locales whose message pack is published at /locales/<code>.json (scripts/copy-locales.mjs copies
// src/i18n/messages/ there at prebuild). Since 12/11/2026 the editor FETCHES the pack of the language being edited
// instead of having all of them embedded in the page: embedded, the six live packs made this one page 31.9 MiB and
// Cloudflare Workers refuses any asset over 25 MiB (the deploy of 12/11/2026 23:43 UTC failed on it).
const PACK_CODES = new Set(["de", "en", "es", "fr", "it", "pt-BR", "ru", "tr", "zh-Hans"]); // packs that exist

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

  // Assemble the editor's data: every live locale, in LIVE_LOCALES order, with
  // its display name. English leads (it is the source-of-truth locale).
  const locales = LIVE_LOCALES.filter((l) => PACK_CODES.has(l.code)).map((l) => ({
    code: l.code, // the language's code, which names its pack at /locales/<code>.json
    name: l.nativeName, // its own name for the picker
  }));

  const labels: CopyEditorLabels = {
    langLabel: t("langLabel"),
    searchLabel: t("searchLabel"),
    searchPlaceholder: t("searchPlaceholder"),
    onlyChanged: t("onlyChanged"),
    changedCount: t.raw("changedCount"),
    exportFull: t("exportFull"),
    exportDiff: t("exportDiff"),
    loading: t("loading"), // while a language's pack is fetched
    loadFailed: t("loadFailed"), // when the fetch fails
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
