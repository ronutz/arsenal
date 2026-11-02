// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/MaterialsDoor.tsx
// ----------------------------------------------------------------------------
// A DOOR TO THE OPEN MATERIALS (milestone (m2), 2026-10-06). PRIME, 19:21:
// "The door(s) to https://ronutz.com/materials/ should be more easily findable,
// in the Learn and Training sections, and in study guides as well."
//
// One component, so every door says the same true thing the same way: the
// course's own cover, its name (linking its datasheet), one line written for
// the page it stands on, and the two things a reader can do at once, present
// the slides in the browser or read about the course and its downloads. The
// "line" variant is the same door in one sentence, for a page where a card
// would compete with the page's own subject (the certification hub).
//
// Since 02/11/2026 (the second course, LAN Switch Operations and Maintenance,
// PRIME 01:44: "publish it along the first one") the door shows EVERY material
// in the registry (src/content/materials/materials.ts), newest first, each with
// its cover, its name linking its datasheet, its slide count from the registry
// (never typed in copy) and its own Present button: one door, as many courses as
// there are. The "line" variant names them all in one sentence, joined the
// locale's way (Intl.ListFormat). Covers are the datasheets' own images, in the
// page's language when the material has an edition in it. Server component: the
// words are read here, in the page's locale, from the "materials" namespace.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MATERIALS, slideImagePath } from "@/content/materials/materials";

/** The pages a door stands on; each has its own line of copy. */
export type DoorContext = "learn" | "training" | "studyGuides" | "certifications";

export default async function MaterialsDoor({
  locale,
  context,
  variant = "card",
}: {
  /** The page's locale. */
  locale: string;
  /** Which page the door stands on (picks its line). */
  context: DoorContext;
  /** A card with every course's cover and buttons, or one sentence. */
  variant?: "card" | "line";
}) {
  // No material, no door.
  if (!MATERIALS.length) return null;
  const t = await getTranslations({ locale, namespace: "materials" });
  // Every course, newest first, with what the door shows of it.
  const courses = MATERIALS.map((m) => ({
    slug: m.slug,
    title: t(`items.${m.slug}.title`),
    slides: m.slides,
    datasheet: `/materials/${m.slug}`,
    present: `/materials/${m.slug}/present`,
    // The cover in the page's language when the course has an edition in it, English otherwise.
    cover: slideImagePath(m, m.files.some((f) => f.lang === locale) ? locale : "en", m.images.cover),
    width: m.images.width,
    height: m.images.height,
  }));

  // The one-sentence door: the courses named and linked, joined the locale's way ("A and B", "A e B").
  if (variant === "line") {
    // The list's parts: each course's title as an element, the locale's connectors as literals.
    const parts = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).formatToParts(courses.map((c) => c.title));
    // Each element is matched back to its course by position.
    let i = 0;
    return (
      <p className="materials-door-line">
        {t("door.line.certifications", { count: courses.length })}{" "}
        {parts.map((p, k) => {
          // A connector (", ", " and ") as written.
          if (p.type !== "element") return <span key={k}>{p.value}</span>;
          // A course: its name, linking its datasheet.
          const c = courses[i++];
          return (
            <Link key={k} href={c.datasheet} className="materials-inline-link">
              {c.title}
            </Link>
          );
        })}
        .{" "}
        <Link href="/materials" className="materials-inline-link materials-door-line-present">
          {t("door.all")} <span aria-hidden="true">&#8594;</span>
        </Link>
      </p>
    );
  }

  // The card: the page's line, then every course with its cover and its two buttons.
  return (
    <aside className="materials-door" aria-label={t("door.eyebrow")}>
      <div className="materials-door-text">
        <p className="materials-door-eyebrow mono">{t("door.eyebrow")}</p>
        <p className="materials-door-body">{t(`door.lede.${context}`, { count: courses.length })}</p>
      </div>
      <ul className="materials-door-courses">
        {courses.map((c) => (
          <li key={c.slug} className="materials-door-course">
            {/* The cover is decoration here: the title and the buttons say everything it would. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="materials-door-cover" src={c.cover} alt="" width={c.width} height={c.height} loading="lazy" decoding="async" />
            <div className="materials-door-text">
              <p className="materials-door-title">
                <Link href={c.datasheet}>{c.title}</Link>
              </p>
              <p className="materials-door-meta mono">{t("index.slidesBadge", { count: c.slides })}</p>
            </div>
            {/* The buttons sit under the name beside the cover on a wide screen, and across the whole card on a phone
                (the cover small at the left, the name beside it), so each course stays one compact block. */}
            <p className="materials-door-actions">
              <Link href={c.present} className="btn btn-primary">
                {t("door.present")}
              </Link>
              <Link href={c.datasheet} className="btn btn-secondary">
                {t("door.about")}
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
