// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/materials/[slug]/page.tsx
// ----------------------------------------------------------------------------
// AN OPEN MATERIAL'S DATASHEET (milestone (m1), 2026-10-06). PRIME, 13:36:
// "It is an ACTUAL INTRODUCTORY TRAINING complete with informative slide notes
// - it can be used not only by learners, but also by INSTRUCTORS to teach
// themselves. It should get a proper datasheeet-like page detailing the course
// contents and outline." And on the licence, 15:51: "CC0 with the kicker, as
// suggested" (CC0 1.0, with credit asked as a courtesy, never required).
//
// The page, top to bottom, answers what someone deciding to use the course
// asks, in that order: what it is and where it came from, beside the deck's
// own cover, with the files one click away; the facts at a glance; who it
// serves (the learner, the instructor); a look inside (six diagrams, PRIME,
// 16:02); the offer to have it taught live (PRIME, 15:59); the outline, part
// by part with the slide ranges; the learning
// objectives the decks themselves state; the 1999 to 2026 comparison that is
// the course's own slide 3; every file with its size and SHA-256; the licence
// in plain words; and the Learn articles that teach the same ground.
//
// PRESENT (milestone (m2), 2026-10-06; PRIME 19:21): "Present the slides" heads
// the files block, and every part of the outline opens the presenter at its
// first slide (/materials/<slug>/present#slide-N).
//
// Facts and figures come from the registry (src/content/materials/materials.ts,
// measured from the files and re-verified by scripts/check-materials.mjs at
// every build); the words from the "materials" namespace, en and pt-BR. Course
// JSON-LD (src/components/CourseMaterialSchema.tsx) describes the same thing
// for machines.
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import CourseMaterialSchema from "@/components/CourseMaterialSchema";
import { ogImages } from "@/lib/og";
import { getArticle } from "@/lib/learn";
import { MATERIALS, getMaterial, slideImagePath, type MaterialFile } from "@/content/materials/materials";

/** Every material in every locale. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => MATERIALS.map((m) => ({ locale, slug: m.slug })));
}

/** Title, description (with the registry's slide count) and the material's own social card. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = getMaterial(slug);
  if (!m) return {};
  const t = await getTranslations({ locale, namespace: "materials" });
  const title = t(`items.${slug}.title`);
  return {
    title: `${title} - ${t("index.title")}`,
    description: t(`items.${slug}.metaDescription`, { slides: m.slides }),
    ...ogImages("page", `materials-${slug}`, locale, title),
  };
}

/** Bytes as megabytes (10^6) with one decimal, the locale's way; the exact count rides in the title attribute. */
function megabytes(bytes: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1_000_000);
}

export default async function MaterialDatasheetPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const m = getMaterial(slug);
  if (!m) notFound();
  const t = await getTranslations("materials");
  const tNav = await getTranslations("nav");
  const k = `items.${slug}`;

  // The page's language first in the file lists (a Portuguese reader meets the Portuguese edition first); any other
  // locale keeps the registry's order.
  const files: MaterialFile[] = [...m.files].sort((a, b) => Number(b.lang === locale) - Number(a.lang === locale));
  const fileLabel = (f: MaterialFile) => `${t(`labels.${f.lang}`)} · ${t(`labels.${f.format}`)}`;
  const editionLabel = (f: MaterialFile) => t(f.format === "pdf" ? "labels.readersEdition" : "labels.instructorsEdition");

  // The outline: the registry's parts (ids, modules, slide ranges) with their localized titles and topics.
  const parts = m.parts.map((p, i) => ({
    ...p,
    n: i + 1,
    title: t(`${k}.parts.${p.id}.title`),
    topics: t.raw(`${k}.parts.${p.id}.topics`) as string[],
  }));
  const modules = [...new Set(m.parts.map((p) => p.module))].sort((a, b) => a - b);
  // The objectives, as the decks state them (slides 5, 43 and 44), by module.
  const objectives = t.raw(`${k}.objectives`) as Record<string, { title: string; body: string }[]>;
  // The course's own slide 3, row by row: topic, 1999, 2026.
  const thenNow = t.raw(`${k}.thenNow`) as string[][];
  // The Learn articles that teach the same ground, by their titles in this locale; a slug the locale lacks drops out.
  const related = m.relatedArticles
    .map((s) => getArticle(s, locale))
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({ slug: a.slug, title: a.title }));
  const languages = [...new Set(m.files.map((f) => f.lang))];
  const title = t(`${k}.title`);
  // The slide images in the page's language when the material has an edition in it, the English edition's otherwise
  // (the fourteen locales that read English copy see English slides). scripts/check-materials.mts proves every one
  // of these files exists for every language the material ships.
  const imgLang = m.files.some((f) => f.lang === locale) ? locale : "en";
  const coverSrc = slideImagePath(m, imgLang, m.images.cover);
  // The gallery: each slide with its image, its caption and alt text from the pack, and the part it belongs to.
  const gallery = m.images.gallery.map((slide) => {
    const part = parts.find((p) => slide >= p.slides[0] && slide <= p.slides[1]);
    return {
      slide,
      src: slideImagePath(m, imgLang, slide),
      title: t(`${k}.gallery.s${slide}.title`),
      alt: t(`${k}.gallery.s${slide}.alt`),
      part: part ? { n: part.n, title: part.title } : null,
    };
  });

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        {/* ---- WHAT IT IS, AND THE FILES ONE CLICK AWAY ---- */}
        <section className="section">
          <div className="container materials-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[{ label: tNav("home"), href: "/" }, { label: t("index.title"), href: "/materials" }, { label: title }]}
            />
            {/* The hero text beside the deck's own cover (PRIME, 16:02: "add a screenshot of the original ppt's
                cover"): one column on a phone, the cover to the right of the text from 60rem. */}
            <div className="materials-hero">
              <div className="materials-hero-text">
                <p className="materials-eyebrow mono">{t("index.eyebrow")}</p>
                <h1 className="page-hero-title">{title}</h1>
                <p className="materials-subtitle">{t(`${k}.subtitle`)}</p>
                <p className="page-hero-lede">{t(`${k}.lede`, { slides: m.slides })}</p>
                <p className="materials-lineage">{t(`${k}.lineage`)}</p>
              </div>
              <figure className="materials-cover">
                {/* The full-size slide is the link target; the image's alt text names the link. */}
                <a href={coverSrc} className="materials-shot-link" title={t("labels.openFull")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="materials-shot"
                    src={coverSrc}
                    width={m.images.width}
                    height={m.images.height}
                    alt={t(`${k}.coverAlt`)}
                    decoding="async"
                  />
                </a>
                <figcaption className="materials-shot-caption">{t("labels.coverCaption", { n: m.images.cover, slides: m.slides })}</figcaption>
              </figure>
            </div>
            <div className="materials-get">
              <h2 className="materials-get-title">{t("labels.getTheCourse")}</h2>
              {/* Present first: the course in the browser, nothing to download (m2). */}
              <p className="materials-present-cta">
                <Link href={`/materials/${slug}/present`} className="btn btn-primary">
                  {t("door.present")} &rarr;
                </Link>
              </p>
              <ul className="materials-get-list">
                {files.map((f) => (
                  <li key={f.path}>
                    <a href={f.path} download className="materials-get-link" title={`${f.bytes.toLocaleString(locale)} bytes`}>
                      <span className="materials-get-name">{fileLabel(f)}</span>
                      <span className="materials-get-size mono">{t("labels.mb", { size: megabytes(f.bytes, locale) })}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---- AT A GLANCE: the datasheet proper ---- */}
        <section id="at-a-glance" className="section section-accent">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.atAGlance")}</h2>
            <dl className="guide-datasheet">
              {[
                [t("labels.level"), t(`${k}.level`)],
                [t("labels.format"), t(`${k}.format`)],
                [t("labels.slides"), t("labels.slidesValue", { count: m.slides })],
                [t("labels.notes"), t(`${k}.notesValue`, { count: m.notesSlides })],
                [t("labels.languages"), t(`${k}.languagesValue`)],
                [t("labels.edition"), String(m.edition)],
                [t("labels.firstTaught"), String(m.originYear)],
                [t("labels.price"), t("labels.priceValue")],
              ].map(([label, value]) => (
                <div className="guide-ds-row" key={label}>
                  <dt className="guide-ds-label">{label}</dt>
                  <dd className="guide-ds-value">{value}</dd>
                </div>
              ))}
              <div className="guide-ds-row">
                <dt className="guide-ds-label">{t("labels.licence")}</dt>
                <dd className="guide-ds-value">
                  <a href="#licence" className="materials-inline-link">{t("labels.licenceValue")}</a>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ---- WHO IT IS FOR: the learner and the instructor, as PRIME framed it ---- */}
        <section id="who" className="section">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.whoFor")}</h2>
            <div className="materials-audience">
              <p className="materials-audience-card">{t(`${k}.audienceLearners`)}</p>
              <p className="materials-audience-card">{t(`${k}.audienceInstructors`)}</p>
            </div>
          </div>
        </section>

        {/* ---- A LOOK INSIDE (PRIME, 16:02: "and perhaps of a few of the more interesting images"): six diagrams
             across the course, each captioned with the slide's own title, its number and its part, each opening at full
             size. Lazy, so the page's first paint carries only the cover. ---- */}
        <section id="inside" className="section section-accent">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.lookInside")}</h2>
            <p className="materials-note">{t("labels.lookInsideLede", { count: gallery.length, slides: m.slides })}</p>
            <ul className="materials-gallery">
              {gallery.map((g) => (
                <li key={g.slide}>
                  <figure className="materials-shot-figure">
                    <a href={g.src} className="materials-shot-link" title={t("labels.openFull")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="materials-shot"
                        src={g.src}
                        width={m.images.width}
                        height={m.images.height}
                        alt={g.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                    <figcaption className="materials-shot-caption">
                      <span className="materials-shot-title">{g.title}</span>
                      <span className="materials-shot-meta mono">
                        {t("labels.slide", { n: g.slide })}
                        {g.part ? ` · ${t("labels.part", { n: g.part.n })}: ${g.part.title}` : ""}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- TAUGHT LIVE (PRIME, 15:59: "want to get this training taught by a field veteran and trade instructor,
             with real demonstrations and hands-on labs ... Contact me"). The contact form opens on its "custom program
             for a team" topic with the course named and the questions a class starts from (ContactForm, intent=course). ---- */}
        <section id="taught-live" className="section">
          <div className="container materials-container">
            <div className="materials-live">
              <h2 className="materials-live-title">{t("labels.liveTitle")}</h2>
              <p className="materials-live-body">{t("labels.liveBody")}</p>
              <p className="materials-live-cta">
                <Link href={`/contact?intent=course&course=${encodeURIComponent(title)}#contact-form`} className="btn btn-primary">
                  {t("labels.liveCta")} &rarr;
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ---- THE OUTLINE: modules, parts, slide ranges, topics ---- */}
        <section id="outline" className="section section-accent">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.outline")}</h2>
            <p className="materials-note">{t(`${k}.frame`)}</p>
            {modules.map((mod) => (
              <div className="materials-module" key={mod}>
                <h3 className="materials-module-title">{t("labels.module", { n: mod })}</h3>
                <ol className="materials-parts">
                  {parts
                    .filter((p) => p.module === mod)
                    .map((p) => (
                      <li className="materials-part" key={p.id}>
                        <p className="materials-part-head mono">
                          {t("labels.part", { n: p.n })} · {t("labels.slideRange", { from: p.slides[0], to: p.slides[1] })}
                        </p>
                        <h4 className="materials-part-title">{p.title}</h4>
                        {/* The part in the presenter, from its first slide (m2). */}
                        <Link href={`/materials/${slug}/present#slide-${p.slides[0]}`} className="materials-part-present">
                          {t("present.presentPart")} &rarr;
                        </Link>
                        <ul className="materials-topics">
                          {p.topics.map((topic) => (
                            <li key={topic}>{topic}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ---- THE OBJECTIVES, as the decks state them ---- */}
        <section id="objectives" className="section">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.objectives")}</h2>
            {modules.map((mod) => (
              <div className="materials-module" key={mod}>
                <h3 className="materials-module-title">{t("labels.moduleObjectives", { n: mod })}</h3>
                <ol className="materials-objectives">
                  {(objectives[`m${mod}`] ?? []).map((o) => (
                    <li key={o.title}>
                      <strong>{o.title}.</strong> {o.body}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ---- 1999 TO 2026: the course's own slide 3 ---- */}
        <section id="then-and-now" className="section section-accent">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.thenNow")}</h2>
            <div className="materials-table-wrap">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th scope="col">{t("labels.topic")}</th>
                    <th scope="col">{t("labels.in1999")}</th>
                    <th scope="col">{t("labels.in2026")}</th>
                  </tr>
                </thead>
                <tbody>
                  {thenNow.map((row) => (
                    <tr key={row[0]}>
                      <th scope="row">{row[0]}</th>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="materials-note">{t(`${k}.thenNowNote`)}</p>
          </div>
        </section>

        {/* ---- EVERY FILE, with its size and digest ---- */}
        <section id="downloads" className="section">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.downloads")}</h2>
            <div className="materials-table-wrap">
              <table className="materials-table materials-files">
                <thead>
                  <tr>
                    <th scope="col">{t("labels.file")}</th>
                    <th scope="col">{t("labels.size")}</th>
                    <th scope="col">{t("labels.sha256")}</th>
                    <th scope="col">
                      <span className="sr-only">{t("labels.download")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.path}>
                      <th scope="row">
                        {fileLabel(f)}
                        <span className="materials-file-edition">{editionLabel(f)}</span>
                      </th>
                      <td className="mono" title={`${f.bytes.toLocaleString(locale)} bytes`}>
                        {t("labels.mb", { size: megabytes(f.bytes, locale) })}
                      </td>
                      <td>
                        <code className="materials-digest">{f.sha256}</code>
                      </td>
                      <td className="materials-file-actions">
                        <a href={f.path} download className="materials-inline-link">
                          {t("labels.download")}
                        </a>
                        {f.format === "pdf" && (
                          <a href={f.path} target="_blank" rel="noopener" className="materials-inline-link">
                            {t("labels.readOnline")}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---- THE LICENCE, in plain words (PRIME 15:51: CC0 with the courtesy line) ---- */}
        <section id="licence" className="section section-accent">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.licence")}</h2>
            <p className="materials-licence">{t(`${k}.licenceBody`)}</p>
            <p className="materials-licence">{t(`${k}.licenceCourtesy`)}</p>
            <p>
              <a href={m.licenseUrl} target="_blank" rel="noopener noreferrer" className="materials-inline-link">
                {t(`${k}.licenceDeed`)} &#8599;
              </a>
            </p>
          </div>
        </section>

        {/* ---- LEARN MORE: the Learn articles on the same ground ---- */}
        <section id="learn-more" className="section">
          <div className="container materials-container">
            <h2 className="section-title">{t("labels.learnMore")}</h2>
            <p className="materials-note">{t("labels.learnMoreLede")}</p>
            <ul className="materials-related">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link href={`/learn/${a.slug}`} className="materials-inline-link">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <CourseMaterialSchema
        locale={locale}
        slug={slug}
        title={title}
        description={t(`${k}.metaDescription`, { slides: m.slides })}
        level={t(`${k}.level`)}
        licenseUrl={m.licenseUrl}
        languages={languages}
        objectives={Object.values(objectives).flat().map((o) => o.title)}
        parts={parts.map((p) => ({ name: p.title, topics: p.topics }))}
        files={m.files}
      />
      <SiteFooter />
    </>
  );
}
