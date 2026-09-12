// ============================================================================
// src/components/VendorMark.tsx
// ----------------------------------------------------------------------------
// AN ERA-MATCHED VENDOR WORDMARK.
//
// WHAT AND WHY: the career chapters each cover a specific span of years, and a
// company's mark is itself dated evidence. Putting Cisco's current logo beside
// a chapter about 2003 is a quiet anachronism - in 2003 the company still wrote
// itself "Cisco Systems" with the bridge device, and that is the mark a reader
// of that chapter should see. This component asks the registry which mark was
// official in a given year and renders that one, or renders NOTHING when the
// registry holds no mark for that vendor and year.
//
// Rendering nothing is the correct default, not a failure: the registry holds
// twelve vendors, the site writes about far more, and a missing mark simply
// means the page carries the company's name in text, which it does anyway.
//
// USE IS NOMINATIVE. The mark identifies the company the page is about and
// states the period it was in use. It is not decoration, it is not a badge of
// partnership, and it must never appear where it could read as the vendor
// endorsing this site. The authorizations this site claims are stated in words
// on /about/credentials; a logo is not a credential. See the header of
// src/content/vendors/marks.ts for the full rule set, and
// scripts/check-marks.mjs for the part of it a machine can check.
//
// PRESENTATION: the marks are supplied as their owners publish them, which for
// most means dark artwork intended for a light background. This site's default
// themes have a near-black canvas, where a black wordmark would be invisible,
// so the mark sits on a fixed white plate with a subtle border. The plate is
// fixed rather than themed on purpose - recolouring or inverting a trademark is
// exactly what the rules forbid, so the background adapts to the mark rather
// than the mark to the theme. On the light themes the plate is near-invisible
// and the border is what keeps it defined.
//
// Server component: pure presentation, no client state.
// ============================================================================

import { markForYear } from "@/content/vendors/marks";

interface VendorMarkProps {
  /** Registry vendor key, e.g. "cisco". Same keys as CAREER_VENDORS. */
  vendor: string;
  /**
   * The year the surrounding page is about. For a career chapter this is the
   * first year of the working relationship: the mark on the equipment when the
   * work started is the one that belongs beside the story.
   */
  year: number;
  /**
   * Localised template for the era caption, e.g. "wordmark in use {era}".
   * Passed in rather than translated here so this stays a pure presentational
   * component and the copy lives with the rest of the page's messages.
   */
  eraLabel: (era: string) => string;
}

export default function VendorMark({ vendor, year, eraLabel }: VendorMarkProps) {
  const mark = markForYear(vendor, year);
  if (!mark) return null;

  // "1983–2000" for a retired mark; "since 1996" while a mark is still current.
  const era = mark.to === null ? `since ${mark.from}` : `${mark.from}–${mark.to}`;
  const caption = eraLabel(era);

  return (
    <figure className="vendor-mark">
      <div className="vendor-mark-plate">
        {/*
          A plain <img> rather than next/image: these are small SVGs served as
          static assets from a fully static export, so there is no optimisation
          pipeline to gain from and next/image would only add a wrapper. The alt
          text identifies the company AND the period, because that is what the
          mark is doing on the page - it is evidence about a date, not an icon.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mark.src}
          alt={`${mark.label}, ${caption}`}
          className="vendor-mark-img"
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="vendor-mark-era mono">{caption}</figcaption>
    </figure>
  );
}
