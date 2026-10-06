// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/CourseMaterialSchema.tsx
// ----------------------------------------------------------------------------
// schema.org/Course for an open material's datasheet (/materials/<slug>),
// milestone (m1), 2026-10-06.
//
// WHY. The datasheet is a course that anyone may download and teach; the
// vocabulary has a type for exactly that, and every property used here was
// read on schema.org on 2026-10-06: Course (CreativeWork > LearningResource >
// Course) with `syllabusSections` (one Syllabus per part of the outline),
// `teaches` (the learning objectives, as text), `educationalLevel`,
// `isAccessibleForFree`, `license` and `inLanguage`; and the files as
// `encoding` MediaObjects with `contentUrl`, `contentSize`, `encodingFormat`
// and `sha256`, the same digest the datasheet prints and
// scripts/check-materials.mjs recomputes at every build.
//
// The author is a REFERENCE to the Person entity /about carries (PERSON_ID),
// not a second copy of it, as on the Learn articles.
//
// ---------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT CLAIMED
//
//   * No `hasCourseInstance`, `courseSchedule` or `offers`. This is material,
//     not a scheduled class: nothing is sold, booked or timed here, and the
//     instructor-led courses live on /training.
//   * No `datePublished`. The material records its edition year (2026) and
//     the year the course was first taught (1999); neither is a publication
//     date for this page, so `copyrightYear`-style dates are left out too (a
//     CC0 work carries no copyright claim to date).
//   * No `timeRequired`. The decks do not state a duration, and a guessed one
//     would be a figure asserted as metadata.
//   * No `aggregateRating` or reviews: nobody has rated it here.
// ============================================================================
import { PERSON_ID } from "@/components/PersonSchema";

const ORIGIN = "https://ronutz.com";

/** The media types the files are served with (public/_headers declares the same). */
const MIME: Record<"pdf" | "pptx", string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export default function CourseMaterialSchema({
  locale,
  slug,
  title,
  description,
  level,
  licenseUrl,
  languages,
  objectives,
  parts,
  files,
}: {
  locale: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  licenseUrl: string;
  /** BCP-47 tags of the editions. */
  languages: string[];
  /** Objective titles, in deck order. */
  objectives: string[];
  /** One entry per part: its title and its topics. */
  parts: { name: string; topics: string[] }[];
  /** The files as the registry records them. */
  files: { lang: string; format: "pdf" | "pptx"; path: string; bytes: number; sha256: string }[];
}) {
  const url = `${ORIGIN}/${locale}/materials/${slug}/`;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "@id": `${url}#course`,
          name: title,
          description,
          url,
          inLanguage: languages,
          educationalLevel: level,
          isAccessibleForFree: true,
          license: licenseUrl,
          teaches: objectives,
          // One Syllabus per part of the outline, in deck order.
          syllabusSections: parts.map((p) => ({ "@type": "Syllabus", name: p.name, description: p.topics.join("; ") })),
          // Every file, with the digest the page prints, so a copy found elsewhere can be checked against this one.
          encoding: files.map((f) => ({
            "@type": "MediaObject",
            contentUrl: `${ORIGIN}${f.path}`,
            encodingFormat: MIME[f.format],
            contentSize: `${f.bytes} bytes`,
            sha256: f.sha256,
            inLanguage: f.lang,
          })),
          author: { "@id": PERSON_ID },
          creator: { "@id": PERSON_ID },
          provider: { "@id": PERSON_ID },
        }),
      }}
    />
  );
}
