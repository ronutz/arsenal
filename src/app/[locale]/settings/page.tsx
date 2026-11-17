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
// The interest counts' switch (PRIME 12/11/2026 02:35): the answer to the site's one question, changeable here.
import InterestToggle from "@/components/InterestToggle";
import { SHORTCUT_ACTIONS, SHORTCUT_KEYS } from "@/config/shortcuts";
// My desk's section (PRIME 12/11/2026 12:42): a file, a transfer link, the encrypted sync, reading, emptying.
import MessageSlice from "@/components/MessageSlice";
import DeskDataPanel from "@/components/desk/DeskDataPanel";

// Pretty key-cap label: letters uppercased; punctuation/digits as-is.
function keyLabel(key: string): string {
  if (key.length === 1 && /[a-z]/.test(key)) return key.toUpperCase();
  return key;
}

/**
 * PAGE TITLE (2026-09-26). Shipped with no generateMetadata export, so it
 * inherited the site-wide default <title> and shared one string with thirteen
 * other pages. Title only: this slug is not in gen-og's STATIC_PAGES, so
 * ogImages() would name a card that does not exist and check-og would fail.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings_page" });
  return { title: t("title") };
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

        {/* The shortcuts (the guide links here as /settings#shortcuts; each key's row has its own id, 16/11/2026). */}
        <section className="section" id="shortcuts">
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
              firstLabel={t("hintFirst")}
              allLabel={t("hintAll")}
              offLabel={t("hintNone")}
            />
          </div>
        </section>

        {/* The interest counts (12/11/2026): what a yes sends, and the switch that gives or withdraws it. */}
        <section className="section" id="interest">
          <div className="container colophon-container">
            <h2 className="colophon-h2">{t("interestTitle")}</h2>
            <p className="colophon-body">{t("interestBody")}</p>
            <InterestToggle
              labels={{
                toggle: t("interestToggle"),
                on: t("interestOn"),
                off: t("interestOff"),
                browserNo: t("interestBrowserNo"),
                more: t("interestMore"),
              }}
            />
          </div>
        </section>

        {/* My desk (12/11/2026): where the reader's own page is kept and how to keep a copy or sync it. The page links
            here as /settings#desk. */}
        <section className="section" id="desk">
          <div className="container colophon-container">
            <h2 className="colophon-h2">{t("deskTitle")}</h2>
            <p className="colophon-body">{t("deskBody")}</p>
            <MessageSlice namespaces={["deskData"]}>
              <DeskDataPanel />
            </MessageSlice>
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
