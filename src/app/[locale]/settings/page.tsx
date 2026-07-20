// ============================================================================
// src/app/[locale]/settings/page.tsx
// ----------------------------------------------------------------------------
// SETTINGS — a small page for the preferences that are not one-tap toggles in
// the header. Currently: keyboard-shortcut customization (the interactive
// editor) plus a plain-language note about theme and language, which are set
// via the header controls and persist device-only (no accounts, no server).
//
// The shortcut editor is a client island (ShortcutSettings); this server
// component resolves its labels in the page's language. Statically generated,
// one page per locale, reusing the colophon container/section CSS.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ShortcutSettings from "@/components/ShortcutSettings";
import GlossaryHintToggle from "@/components/GlossaryHintToggle";
import { SHORTCUT_ACTIONS, SHORTCUT_KEYS } from "@/config/shortcuts";

// Pretty key-cap label: letters uppercased; punctuation/digits as-is.
function keyLabel(key: string): string {
  if (key.length === 1 && /[a-z]/.test(key)) return key.toUpperCase();
  return key;
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("settings_page");
  const tShortcuts = await getTranslations("shortcuts");

  // Label maps handed to the client editor.
  const actionLabels: Record<string, string> = Object.fromEntries(
    SHORTCUT_ACTIONS.map((a) => [a.id, tShortcuts(a.labelKey)]),
  );
  const keyLabels: Record<string, string> = Object.fromEntries(
    SHORTCUT_KEYS.map((k) => [k, keyLabel(k)]),
  );

  const settingsLabels = {
    colKey: t("colKey"),
    colAction: t("colAction"),
    locked: t("locked"),
    reset: t("reset"),
    note: t("persistNote"),
    actionLabels,
    keyLabels,
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="colophon-hero">
          <div className="container colophon-container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
          </div>
        </section>

        <section className="section">
          <div className="container colophon-container">
            <h2 className="colophon-h2">{t("shortcutsTitle")}</h2>
            <p className="colophon-body">{t("shortcutsBody")}</p>
            <ShortcutSettings labels={settingsLabels} />
          </div>
        </section>

        <section className="section">
          <div className="container colophon-container">
            <h2 className="colophon-h2">{t("readingTitle")}</h2>
            <p className="colophon-body">{t("readingBody")}</p>
            <GlossaryHintToggle
              label={t("hintToggleLabel")}
              description={t("hintToggleDesc")}
              onLabel={t("hintOn")}
              offLabel={t("hintOff")}
            />
          </div>
        </section>

        <section className="section">
          <div className="container colophon-container">
            <h2 className="colophon-h2">{t("themeLangTitle")}</h2>
            <p className="colophon-body">{t("themeLangBody")}</p>
            <Link href="/privacy" className="colophon-body settings-privacy-link">
              {t("privacyLink")} →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
