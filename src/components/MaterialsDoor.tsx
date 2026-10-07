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
// The course shown is the registry's first material (src/content/materials/
// materials.ts); its slide count comes from the registry, never typed in copy.
// The cover is the datasheet's own image, in the page's language when the
// material has an edition in it. Server component: the words are read here, in
// the page's locale, from the "materials" namespace.
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
  /** A card with the cover and two buttons, or one sentence. */
  variant?: "card" | "line";
}) {
  // The course: the registry's first material (the only one, on 2026-10-06).
  const m = MATERIALS[0];
  if (!m) return null;
  const t = await getTranslations({ locale, namespace: "materials" });
  const title = t(`items.${m.slug}.title`);
  const datasheet = `/materials/${m.slug}`;
  const present = `/materials/${m.slug}/present`;

  // The one-sentence door: the course named, its datasheet linked, and the presenter one click on.
  if (variant === "line") {
    return (
      <p className="materials-door-line">
        {t.rich(`door.line.${context}`, {
          title,
          slides: m.slides,
          link: (chunks) => (
            <Link href={datasheet} className="materials-inline-link">
              {chunks}
            </Link>
          ),
        })}{" "}
        <Link href={present} className="materials-inline-link materials-door-line-present">
          {t("door.present")} <span aria-hidden="true">&#8594;</span>
        </Link>
      </p>
    );
  }

  // The card: the cover in the page's language when there is an edition in it, English otherwise.
  const imgLang = m.files.some((f) => f.lang === locale) ? locale : "en";
  const cover = slideImagePath(m, imgLang, m.images.cover);
  return (
    <aside className="materials-door" aria-label={t("door.eyebrow")}>
      {/* The cover is decoration here: the title and the buttons say everything it would. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="materials-door-cover" src={cover} alt="" width={m.images.width} height={m.images.height} loading="lazy" decoding="async" />
      <div className="materials-door-text">
        <p className="materials-door-eyebrow mono">{t("door.eyebrow")}</p>
        <p className="materials-door-title">
          <Link href={datasheet}>{title}</Link>
        </p>
        <p className="materials-door-body">{t(`door.lede.${context}`, { slides: m.slides })}</p>
        <p className="materials-door-actions">
          <Link href={present} className="btn btn-primary">
            {t("door.present")}
          </Link>
          <Link href={datasheet} className="btn btn-secondary">
            {t("door.about")}
          </Link>
        </p>
      </div>
    </aside>
  );
}
