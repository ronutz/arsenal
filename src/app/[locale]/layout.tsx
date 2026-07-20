// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/layout.tsx
// ----------------------------------------------------------------------------
// THE ROOT LOCALE LAYOUT — wraps every page and sets the document's language
// and text direction from the active locale.
//
// WHY this is where RTL "just works": the <html> element's `lang` and `dir`
// attributes are set HERE from the registry (dirFor(locale)). When a real
// Arabic pack lands, Arabic pages automatically render right-to-left because
// the registry says dir:"rtl" — no per-page work. The same mechanism supports
// any future RTL script (Hebrew, Persian, Urdu) by adding a registry entry.
//
// It also: validates the [locale] URL segment (404 on an unregistered locale),
// loads the messages for the request, and provides them to client components
// via NextIntlClientProvider. Fonts (Inter for prose, JetBrains Mono for data/
// codes) are the canon Obsidian typography.
// ============================================================================

import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale, getMessages } from "next-intl/server";
import { GLOBAL_CLIENT_NAMESPACES, pickNamespaces } from "@/i18n/clientMessages";
import { Inter, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import { dirFor, getLocale } from "@/i18n/locales";
import InputModality from "@/components/InputModality";
import MachineTranslationNotice from "@/components/MachineTranslationNotice";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { SHORTCUT_ACTIONS } from "@/config/shortcuts";
import { LIVE_LOCALE_CODES, DEFAULT_LOCALE } from "@/i18n/locales";
import "@/app/globals.css";

// Canon typography: Inter (prose) + JetBrains Mono (data/codes/BCP-47 tags).
// `display: swap` avoids invisible text while fonts load.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * Pre-generate a static page for every registered locale at build time
 * (faster, cacheable). Derived from the routing config, so all 18 are covered.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Per-locale <title>/<description> for SEO, pulled from that locale's pack so
 * search engines see localized metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    metadataBase: new URL("https://ronutz.com"),
    title: `${t("name")} · ${t("tagline")}`,
    description: t("tagline"),
    // Default social-preview card. Specific pages (tools, articles, glossary,
    // study guides, vendor hubs, main pages) override openGraph.images with
    // their own generated card via ogImages(); anything else inherits this.
    openGraph: {
      type: "website",
      siteName: t("name"),
      images: [{ url: "/og/default.png", width: 1200, height: 630, alt: t("name") }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og/default.png"],
    },
    // Favicon set generated from the RN mark (see public/). favicon.ico covers
    // legacy/tab use; the PNGs give crisp 16/32; apple-touch is the iOS tile.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    alternates: {
      // Per-page canonical. With metadataBase set, a "./" canonical resolves to
      // THIS page's own absolute URL on every generated route (verified against
      // Next.js static-export behaviour), e.g. https://ronutz.com/en/tools/cidr.
      // This is the anti-clone lever: a scraped copy rehosted elsewhere still
      // points search engines back to ronutz.com as the canonical source.
      canonical: "./",
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: `${t("name")} Learn` }],
      },
    },
  };
}

/**
 * Tints mobile browser chrome (address bar) to the Obsidian background so the
 * page does not show a bright bar above the dark UI.
 */
export const viewport: Viewport = {
  themeColor: "#0A1628",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Guard: an unregistered locale in the URL is a 404, not a silent fallback.
  // Direct membership check against the routing locales (derived from the registry).
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  // Text direction from the registry — this is the RTL switch.
  const dir = dirFor(locale);

  // Show the machine-translation notice only on machine-draft locales (English
  // and any human-reviewed locale never show it). Strings are resolved here, in
  // the page's own language, and handed to the presentational notice component.
  const isMachineDraft = getLocale(locale)?.status === "machine-draft";
  const tNotice = isMachineDraft
    ? await getTranslations({ locale, namespace: "machineTranslation" })
    : null;

  // Fetch the merged (English-base + locale pack) messages, then pass ONLY the
  // global client-chrome namespaces to the root provider (A1, ratified
  // 2026-07-10). This is the lever that drops per-page weight ~423 KB -> ~1.35
  // KB of inlined messages; route-scoped namespaces (a tool's own keys, /api,
  // dev tools, home stats, endorsements) ride nested providers on their routes.
  // The full pack still resolves English fallback before the pick, so passive
  // locales behave exactly as before. check-client-messages.mjs guarantees no
  // client component is left without its namespace.
  const messages = await getMessages();
  const globalClientMessages = pickNamespaces(
    messages,
    GLOBAL_CLIENT_NAMESPACES,
  );

  // Site-wide keyboard-shortcut labels (the boss-key overlay wording), resolved
  // here in the page's language and handed to the client listener as props.
  // Site-wide keyboard-shortcut labels, resolved here in the page's language.
  // The action-label map is keyed by action id (each action declares its
  // labelKey in the registry), so the cheat-sheet can name every binding.
  const tShortcuts = await getTranslations({ locale, namespace: "shortcuts" });
  const shortcutActionLabels: Record<string, string> = Object.fromEntries(
    SHORTCUT_ACTIONS.map((a) => [a.id, tShortcuts(a.labelKey)]),
  );
  const shortcutsLabels = {
    bossHint: tShortcuts("bossHint"),
    roomHint: tShortcuts("roomHint"),
    bossDismiss: tShortcuts("bossDismiss"),
    cheatTitle: tShortcuts("cheatTitle"),
    cheatClose: tShortcuts("cheatClose"),
    cheatHint: tShortcuts("cheatHint"),
    actionLabels: shortcutActionLabels,
    // T-DOT: the "." page-context panel.
    contextTitle: tShortcuts("contextTitle"),
    contextClose: tShortcuts("contextClose"),
    contextHint: tShortcuts("contextHint"),
    contextBack: tShortcuts("contextBack"),
    contextLoading: tShortcuts("contextLoading"),
    contextError: tShortcuts("contextError"),
  };

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Apply the saved theme before first paint (no flash). Runs synchronously
            ahead of hydration; ThemeSwitcher reads the same key thereafter. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('ronutz-theme');if(t&&t!=='obsidian'){document.documentElement.setAttribute('data-theme',t);}var g=localStorage.getItem('ronutz-glossary-hints');if(g==='off'){document.documentElement.setAttribute('data-glossary-hints','off');}}catch(e){}})();",
          }}
        />
        {/* Language preference (client-side, device-only). Precedence rule
            (PRIME-confirmed): an EXPLICIT locale in the URL wins — visiting a
            deep /en/… or any /pt-BR/… path is honored as-is and updates the
            saved preference; shared/deep links are never hijacked. The stored
            preference only REDIRECTS at the one locale-less entry point: the
            bare domain, which the Worker resolves to the DEFAULT locale's HOME
            (/en or /en/). So a returning visitor whose saved language differs is
            forwarded from that home to their language's home. Runs before paint
            to keep the redirect flash minimal. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{" +
              "var LIVE=" + JSON.stringify(LIVE_LOCALE_CODES) + ";" +
              "var DEF=" + JSON.stringify(DEFAULT_LOCALE) + ";" +
              "var p=location.pathname;var parts=p.split('/');var seg=parts[1]||'';" +
              "var cur=LIVE.indexOf(seg)>-1?seg:null;" +
              "var pref=localStorage.getItem('ronutz-lang');" +
              // Is this the default-locale HOME root (/en or /en/)? That is the
              // bare-domain landing — the only place we honor a stored redirect.
              "var isDefHome=cur===DEF&&(parts.length<=2||(parts.length===3&&parts[2]===''));" +
              "if(isDefHome&&pref&&LIVE.indexOf(pref)>-1&&pref!==DEF){" +
              "location.replace('/'+pref+'/');return;}" +
              // Otherwise, an explicit locale in the URL just updates the memory.
              "if(cur){localStorage.setItem('ronutz-lang',cur);}" +
              "}catch(e){}})();",
          }}
        />
        {/* Tracks last input modality (keyboard vs pointer) so the skip link
            reveals only for keyboard users — see InputModality. */}
        <InputModality />
        {/* Site-wide keyboard shortcuts (navigation, favorites, search, boss
            key, and the ? cheat-sheet). The listener stays inert whenever a
            form field is focused or a modifier is held — see KeyboardShortcuts. */}
        <KeyboardShortcuts labels={shortcutsLabels} />
        {/* Honesty banner: machine-draft locales announce themselves and link to
            the contribute page. Rendered above page content, hidden on English
            and any human-reviewed locale. */}
        {isMachineDraft && tNotice && (
          <MachineTranslationNotice
            message={tNotice("notice")}
            ctaLabel={tNotice("cta")}
            ctaHref={`/${locale}/contribute`}
          />
        )}
        {/* Root provider carries only the global client-chrome namespaces (A1).
            Route layouts/pages add their own namespace via a nested provider. */}
        <NextIntlClientProvider messages={globalClientMessages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
