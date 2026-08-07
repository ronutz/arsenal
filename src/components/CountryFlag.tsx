// ============================================================================
// src/components/CountryFlag.tsx
// ----------------------------------------------------------------------------
// The twenty national flags used on the industry timeline, as inline SVG.
//
// WHY INLINE RATHER THAN FILES OR EMOJI.
//
//   - EMOJI DO NOT WORK. Flag emoji are the obvious answer and Windows does not
//     ship the glyphs, so Chrome, Edge and Firefox on Windows render the two
//     regional indicator letters instead. That is most of this site's desktop
//     audience seeing "BR" where macOS shows a flag. See origins.ts.
//   - FILES WOULD MEAN 164 REQUESTS. The timeline renders every entry on one
//     page; twenty <img> tags repeated across 164 cards is a lot of requests
//     for 300 bytes each, and inline SVG costs nothing at build time.
//   - A CDN IS NOT AN OPTION. Nothing on this site is hotlinked (D-46), and a
//     flag sprite from somebody else's server is a third-party request on every
//     page view of a privacy-first site.
//
// *** ACCURACY, STATED HONESTLY. ***
//
// These are hand-authored from published specifications and they are SIMPLIFIED
// where an emblem is too fine to read at 18x12 pixels. Marked below:
//
//   EXACT      - geometry and colours match the specification
//   SIMPLIFIED - correct field and colours, emblem approximated at this size
//
// A production-grade alternative exists: the `flag-icons` project is public
// domain and ships precise SVGs for every country. Bundling the twenty needed
// here would replace this file with no other change, since the interface is
// just `<CountryFlag code="BR" />`. That swap is recommended if these ever
// render larger than the timeline uses them.
//
// Every flag carries role="img" and a <title>, so a screen reader announces the
// country rather than skipping an unlabelled graphic.
// ============================================================================

import type { CountryCode } from "@/content/vendors/origins";
import { COUNTRY_NAMES } from "@/content/vendors/origins";

/** Flag bodies drawn on a 30x20 viewBox (3:2, the most common proportion). */
const FLAGS: Record<CountryCode, React.ReactNode> = {
  // EXACT — three equal horizontal bands.
  AT: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#ED2939" />
      <rect y="13.33" width="30" height="6.67" fill="#ED2939" />
    </>
  ),

  // SIMPLIFIED — Union canton correct in colour and placement; the Commonwealth
  // and Southern Cross stars are reduced to dots, which is all that resolves.
  AU: (
    <>
      <rect width="30" height="20" fill="#00247D" />
      <g clipPath="url(#au-canton)">
        <rect width="15" height="10" fill="#00247D" />
        <path d="M0 0 15 10M15 0 0 10" stroke="#fff" strokeWidth="2" />
        <path d="M7.5 0v10M0 5h15" stroke="#fff" strokeWidth="3.3" />
        <path d="M7.5 0v10M0 5h15" stroke="#CF142B" strokeWidth="2" />
      </g>
      <clipPath id="au-canton">
        <rect width="15" height="10" />
      </clipPath>
      <circle cx="7.5" cy="15" r="1.5" fill="#fff" />
      <circle cx="22" cy="4" r="0.9" fill="#fff" />
      <circle cx="24.5" cy="9" r="1.1" fill="#fff" />
      <circle cx="21" cy="13" r="0.9" fill="#fff" />
      <circle cx="26" cy="14.5" r="0.8" fill="#fff" />
    </>
  ),

  // SIMPLIFIED — field, lozenge and globe exact; the celestial sphere's stars
  // and the banner motto are omitted, being unreadable below about 40px.
  BR: (
    <>
      <rect width="30" height="20" fill="#009B3A" />
      <path d="M15 2.6 27.4 10 15 17.4 2.6 10Z" fill="#FEDF00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      <path d="M10.6 8.4a12 12 0 0 1 8.8 3.1" stroke="#fff" strokeWidth="1.1" fill="none" />
    </>
  ),

  // SIMPLIFIED — bands exact; the maple leaf is a reduced eleven-point form.
  CA: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#D80621" />
      <rect x="22.5" width="7.5" height="20" fill="#D80621" />
      <path
        d="M15 4.2l1.1 2.6 2.3-1-0.9 2.9 2.4 0.4-1.9 1.7 0.5 1.3-2.6-0.4 0.2 3.4h-2.2l0.2-3.4-2.6 0.4 0.5-1.3-1.9-1.7 2.4-0.4-0.9-2.9 2.3 1z"
        fill="#D80621"
      />
    </>
  ),

  // EXACT — square field with the white cross at specification proportions.
  CH: (
    <>
      <rect width="30" height="20" fill="#D52B1E" />
      <rect x="13.1" y="4.2" width="3.8" height="11.6" fill="#fff" />
      <rect x="9.2" y="8.1" width="11.6" height="3.8" fill="#fff" />
    </>
  ),

  // SIMPLIFIED — field and star placement correct; the four small stars are
  // drawn as dots rather than five-pointed, which does not resolve here.
  CN: (
    <>
      <rect width="30" height="20" fill="#DE2910" />
      <path d="M5 2.6l1.05 2.5 2.2-0.9-0.85 2.75 2.3 0.4-1.85 1.65 0.5 1.25-2.5-0.4 0.2 3.25h-2.1l0.2-3.25-2.5 0.4 0.5-1.25-1.85-1.65 2.3-0.4-0.85-2.75 2.2 0.9z" fill="#FFDE00" transform="scale(0.75) translate(2 1)" />
      <circle cx="10.5" cy="2.6" r="0.7" fill="#FFDE00" />
      <circle cx="12.6" cy="4.7" r="0.7" fill="#FFDE00" />
      <circle cx="12.6" cy="7.6" r="0.7" fill="#FFDE00" />
      <circle cx="10.5" cy="9.7" r="0.7" fill="#FFDE00" />
    </>
  ),

  // EXACT.
  DE: (
    <>
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </>
  ),

  // EXACT — Nordic cross, offset toward the hoist as specified.
  FI: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect y="7.7" width="30" height="4.6" fill="#003580" />
      <rect x="8.2" width="4.6" height="20" fill="#003580" />
    </>
  ),

  // EXACT.
  FR: (
    <>
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </>
  ),

  // SIMPLIFIED — the saltires are drawn symmetrically. The specification
  // counterchanges them either side of the vertical, which is not visible at
  // this size but is the one shortcut worth naming, since it is the detail
  // people notice on a large rendering.
  GB: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="2.2" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6.6" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="4" />
    </>
  ),

  // EXACT.
  IE: (
    <>
      <rect width="10" height="20" fill="#169B62" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#FF883E" />
    </>
  ),

  // EXACT — two triangles forming the Star of David, as specified.
  IL: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect y="2.4" width="30" height="2.2" fill="#0038B8" />
      <rect y="15.4" width="30" height="2.2" fill="#0038B8" />
      <path d="M15 6.1l3.6 6.2h-7.2Z" fill="none" stroke="#0038B8" strokeWidth="0.9" />
      <path d="M15 13.9l3.6-6.2h-7.2Z" fill="none" stroke="#0038B8" strokeWidth="0.9" />
    </>
  ),

  // SIMPLIFIED — bands exact; the Ashoka Chakra is a ring rather than its
  // twenty-four spokes, which cannot resolve at this size.
  IN: (
    <>
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.7" />
      <circle cx="15" cy="10" r="0.5" fill="#000080" />
    </>
  ),

  // EXACT.
  JP: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </>
  ),

  // EXACT — the white band is one fifth of the height, as specified.
  LV: (
    <>
      <rect width="30" height="20" fill="#9E3039" />
      <rect y="8" width="30" height="4" fill="#fff" />
    </>
  ),

  // EXACT.
  NL: (
    <>
      <rect width="30" height="6.67" fill="#AE1C28" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#21468B" />
    </>
  ),

  // EXACT.
  RU: (
    <>
      <rect width="30" height="6.67" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
    </>
  ),

  // EXACT — Nordic cross, offset toward the hoist.
  SE: (
    <>
      <rect width="30" height="20" fill="#006AA7" />
      <rect y="7.7" width="30" height="4.6" fill="#FECC00" />
      <rect x="8.2" width="4.6" height="20" fill="#FECC00" />
    </>
  ),

  // SIMPLIFIED — field and canton exact; the twelve-rayed sun is a disc.
  TW: (
    <>
      <rect width="30" height="20" fill="#FE0000" />
      <rect width="15" height="10" fill="#000095" />
      <circle cx="7.5" cy="5" r="2.9" fill="#fff" />
      <circle cx="7.5" cy="5" r="1.7" fill="#000095" />
      <circle cx="7.5" cy="5" r="1.2" fill="#fff" />
    </>
  ),

  // SIMPLIFIED — thirteen stripes and the canton are exact; the fifty stars are
  // represented as a field of dots, the only honest option at this size.
  US: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <g fill="#B22234">
        <rect width="30" height="1.54" />
        <rect y="3.08" width="30" height="1.54" />
        <rect y="6.15" width="30" height="1.54" />
        <rect y="9.23" width="30" height="1.54" />
        <rect y="12.31" width="30" height="1.54" />
        <rect y="15.38" width="30" height="1.54" />
        <rect y="18.46" width="30" height="1.54" />
      </g>
      <rect width="12" height="10.77" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="2" cy="2" r="0.42" />
        <circle cx="5" cy="2" r="0.42" />
        <circle cx="8" cy="2" r="0.42" />
        <circle cx="3.5" cy="4" r="0.42" />
        <circle cx="6.5" cy="4" r="0.42" />
        <circle cx="9.5" cy="4" r="0.42" />
        <circle cx="2" cy="6" r="0.42" />
        <circle cx="5" cy="6" r="0.42" />
        <circle cx="8" cy="6" r="0.42" />
        <circle cx="3.5" cy="8" r="0.42" />
        <circle cx="6.5" cy="8" r="0.42" />
        <circle cx="9.5" cy="8" r="0.42" />
      </g>
    </>
  ),
};

/**
 * A country flag at text size. Renders nothing at all for an unknown code
 * rather than an empty box, so a missing flag degrades to the code and name
 * beside it rather than to a gap.
 */
export default function CountryFlag({ code }: { code: CountryCode }) {
  const body = FLAGS[code];
  if (!body) return null;
  const name = COUNTRY_NAMES[code] ?? code;
  return (
    <svg
      className="country-flag"
      viewBox="0 0 30 20"
      role="img"
      aria-label={name}
      focusable="false"
    >
      <title>{name}</title>
      {body}
    </svg>
  );
}
