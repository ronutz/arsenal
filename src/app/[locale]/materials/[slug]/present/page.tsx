// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/materials/[slug]/present/page.tsx
// ----------------------------------------------------------------------------
// PRESENT AN OPEN MATERIAL'S SLIDES IN THE BROWSER (milestone (m2),
// 2026-10-06). PRIME, 19:21: "Can we allow presenting the slides on the site
// through the browser, without the need to download? With, at least, controls
// for full screen, next and previous slide, and alike."
//
// The page is the presenter (src/components/SlidePresenter.tsx) and the few
// lines that frame it: the course's name, what the page is, the way back to the
// datasheet and its downloads, and the keys. The deck shown first is the page's
// language when the material has an edition in it, English otherwise (the
// fourteen locales that read English copy see English slides, as the
// datasheet's images do); the reader can switch decks either way.
//
// The slide titles come from each language's deck manifest
// (public/<material dir>/deck/<lang>/deck.json, read from the PPTX packages and
// checked by scripts/check-materials.mts at every build), read here at build
// time; the notes in the same file are NOT put in the page: the presenter
// fetches them only when the reader opens the notes, so the page stays light.
// ============================================================================

import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import SlidePresenter, { type PresenterDeck, type PresenterPart } from "@/components/SlidePresenter";
import { ogImages } from "@/lib/og";
import { MATERIALS, getMaterial, deckImageBase, deckManifestPath } from "@/content/materials/materials";

/** Every material in every locale. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => MATERIALS.map((m) => ({ locale, slug: m.slug })));
}

/** The title says what the page does with which course; the social card is the material's own. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = getMaterial(slug);
  if (!m) return {};
  const t = await getTranslations({ locale, namespace: "materials" });
  const title = t(`items.${slug}.title`);
  return {
    title: `${t("present.metaTitle", { title })} - ${t("index.title")}`,
    description: t("present.metaDescription", { title, slides: m.slides }),
    ...ogImages("page", `materials-${slug}`, locale, title),
  };
}

/** One language's slide titles, from its deck manifest in public/ (build time only). */
function deckTitles(manifestPath: string): string[] {
  // The manifest's public path maps onto the repository's public/ folder.
  const file = path.join(process.cwd(), "public", manifestPath);
  const data = JSON.parse(readFileSync(file, "utf8")) as { slides: { n: number; title: string }[] };
  return data.slides.map((s) => s.title);
}

export default async function MaterialPresentPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const m = getMaterial(slug);
  if (!m) notFound();
  const t = await getTranslations("materials");
  const tNav = await getTranslations("nav");
  const k = `items.${slug}`;
  const title = t(`${k}.title`);

  // The decks, one per language the material ships, the page's language first.
  const langs = [...new Set(m.files.map((f) => f.lang))].sort((a, b) => Number(b === locale) - Number(a === locale));
  const decks: PresenterDeck[] = langs.map((lang) => ({
    lang,
    label: t(`present.deckName.${lang}`),
    titles: deckTitles(deckManifestPath(m, lang)),
    imageBase: deckImageBase(m, lang),
    manifest: deckManifestPath(m, lang),
  }));
  // The deck shown first: the page's language when there is one in it, English otherwise.
  const initialLang = langs.includes(locale as (typeof langs)[number]) ? locale : "en";
  // The parts, with their titles in the page's language.
  const parts: PresenterPart[] = m.parts.map((p, i) => ({
    n: i + 1,
    module: p.module,
    title: t(`${k}.parts.${p.id}.title`),
    start: p.slides[0],
    end: p.slides[1],
  }));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section presenter-page">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("index.title"), href: "/materials" },
                { label: title, href: `/materials/${slug}` },
                { label: t("present.crumb") },
              ]}
            />
            <p className="materials-eyebrow mono">{t("present.eyebrow")}</p>
            <h1 className="page-hero-title presenter-title">{title}</h1>
            <p className="presenter-lede">
              {t("present.lede", { slides: m.slides })}{" "}
              <Link href={`/materials/${slug}`} className="materials-inline-link">
                {t("present.aboutLink")}
              </Link>
            </p>
            {/* The keys (row 55, PRIME 2026-10-07 06:19: "show the available hotkeys to the users so they get to know
                about them"): above the slide, where a reader sees them on arrival, as key caps. On this page they are
                the only keys the site answers; a touch screen without a mouse gets the swipe instead (CSS). */}
            <div className="presenter-keymap">
              <p className="presenter-keymap-title mono" id="presenter-keymap-title">{t("present.keysTitle")}</p>
              <ul className="presenter-keymap-list" aria-labelledby="presenter-keymap-title">
                <li>
                  <kbd>←</kbd> <kbd>PgUp</kbd> <kbd>Shift</kbd>+<kbd>{t("present.kbdSpace")}</kbd> {t("present.keyPrevious")}
                </li>
                <li>
                  <kbd>→</kbd> <kbd>PgDn</kbd> <kbd>{t("present.kbdSpace")}</kbd> {t("present.keyNext")}
                </li>
                <li>
                  <kbd>Home</kbd> <kbd>End</kbd> {t("present.keyEnds")}
                </li>
                <li>
                  <kbd>F</kbd> {t("present.keyFullscreen")}
                </li>
                <li>
                  <kbd>N</kbd> {t("present.keyNotes")}
                </li>
                <li>
                  <kbd>C</kbd> {t("present.keyContents")}
                </li>
                <li>
                  <kbd>Esc</kbd> {t("present.keyEscape")}
                </li>
              </ul>
              <p className="presenter-keymap-note">{t("present.keysNote")}</p>
              <p className="presenter-keymap-touch">{t("present.keysTouch")}</p>
            </div>
            <SlidePresenter
              decks={decks}
              initialLang={initialLang}
              parts={parts}
              width={m.deck.width}
              height={m.deck.height}
              labels={{
                region: t("present.region", { title }),
                previous: t("present.previous"),
                next: t("present.next"),
                counter: t.raw("present.counter") as string,
                announce: t.raw("present.announce") as string,
                goTo: t("present.goTo"),
                goButton: t("present.goButton"),
                contents: t("present.contents"),
                notes: t("present.notes"),
                fullscreen: t("present.fullscreen"),
                exitFullscreen: t("present.exitFullscreen"),
                deckLanguage: t("present.deckLanguage"),
                opening: t("present.opening"),
                closing: t("present.closing"),
                module: t.raw("present.module") as string,
                part: t.raw("present.part") as string,
                partRange: t.raw("present.partRange") as string,
                notesTitle: t("present.notesTitle"),
                notesLoading: t("present.notesLoading"),
                notesError: t("present.notesError"),
                notesEmpty: t("present.notesEmpty"),
              }}
            />
            {/* The licence in one line: the reader may present this anywhere. */}
            <p className="presenter-licence">
              {t("present.licence")}{" "}
              <Link href={`/materials/${slug}#licence`} className="materials-inline-link">
                {t("present.licenceLink")}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
