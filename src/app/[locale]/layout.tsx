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
import { Inter, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import { dirFor, getLocale } from "@/i18n/locales";
import InputModality from "@/components/InputModality";
import MachineTranslationNotice from "@/components/MachineTranslationNotice";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
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
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: `${t("name")} — Learn` }],
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

  // Fetch the merged (English-base + locale pack) messages so CLIENT components
  // (e.g. the language switcher) receive them through the provider. Without
  // passing messages explicitly, client components get MISSING_MESSAGE.
  const messages = await getMessages();

  // Site-wide keyboard-shortcut labels (the boss-key overlay wording), resolved
  // here in the page's language and handed to the client listener as props.
  const tShortcuts = await getTranslations({ locale, namespace: "shortcuts" });

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Apply the saved theme before first paint (no flash). Runs synchronously
            ahead of hydration; ThemeSwitcher reads the same key thereafter. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('ronutz-theme');if(t&&t!=='obsidian'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();",
          }}
        />
        {/* Tracks last input modality (keyboard vs pointer) so the skip link
            reveals only for keyboard users — see InputModality. */}
        <InputModality />
        {/* Site-wide keyboard shortcuts (t/l/m/z navigation + b boss key). The
            listener stays inert whenever a form field is focused or a modifier
            is held — see KeyboardShortcuts. */}
        <KeyboardShortcuts bossHint={tShortcuts("bossHint")} bossDismiss={tShortcuts("bossDismiss")} />
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
        {/* Provider makes the loaded (merged-with-English) messages available
            to all client components via useTranslations(). */}
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
