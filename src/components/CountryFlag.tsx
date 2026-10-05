// ============================================================================
// src/components/CountryFlag.tsx
// ----------------------------------------------------------------------------
// The national flags used on the industry timeline and the milestones, as inline SVG
// (thirty-two at the last count; Denmark added 2026-10-05; the United Arab Emirates, the
// European Union, South Korea, New Zealand, the Philippines, Singapore and Thailand added
// 2026-10-05 for the training page's clocks, one flag per time zone row, PRIME).
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

  // EXACT — the red hoist band is one quarter of the length; green, white and black thirds (2026-10-05).
  AE: (
    <>
      <rect width="30" height="20" fill="#00732F" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#000" />
      <rect width="7.5" height="20" fill="#FF0000" />
    </>
  ),

  // SIMPLIFIED — twelve five-pointed stars on a circle, as specified; the star radius is enlarged a little so
  // they survive at text size (2026-10-05). Not a country: the reserved code for the European Union, used
  // for the Central European Time row.
  EU: (
    <>
      <rect width="30" height="20" fill="#003399" />
      <path d="M15.00,2.65 L15.21,3.31 L15.90,3.31 L15.35,3.71 L15.56,4.37 L15.00,3.96 L14.44,4.37 L14.65,3.71 L14.10,3.31 L14.79,3.31Z M18.20,3.51 L18.41,4.16 L19.10,4.16 L18.55,4.57 L18.76,5.23 L18.20,4.82 L17.64,5.23 L17.85,4.57 L17.30,4.16 L17.99,4.16Z M20.54,5.85 L20.76,6.51 L21.45,6.51 L20.89,6.91 L21.10,7.57 L20.54,7.16 L19.98,7.57 L20.20,6.91 L19.64,6.51 L20.33,6.51Z M21.40,9.05 L21.61,9.71 L22.30,9.71 L21.75,10.11 L21.96,10.77 L21.40,10.36 L20.84,10.77 L21.05,10.11 L20.50,9.71 L21.19,9.71Z M20.54,12.25 L20.76,12.91 L21.45,12.91 L20.89,13.31 L21.10,13.97 L20.54,13.56 L19.98,13.97 L20.20,13.31 L19.64,12.91 L20.33,12.91Z M18.20,14.59 L18.41,15.25 L19.10,15.25 L18.55,15.65 L18.76,16.31 L18.20,15.91 L17.64,16.31 L17.85,15.65 L17.30,15.25 L17.99,15.25Z M15.00,15.45 L15.21,16.11 L15.90,16.11 L15.35,16.51 L15.56,17.17 L15.00,16.76 L14.44,17.17 L14.65,16.51 L14.10,16.11 L14.79,16.11Z M11.80,14.59 L12.01,15.25 L12.70,15.25 L12.15,15.65 L12.36,16.31 L11.80,15.91 L11.24,16.31 L11.45,15.65 L10.90,15.25 L11.59,15.25Z M9.46,12.25 L9.67,12.91 L10.36,12.91 L9.80,13.31 L10.02,13.97 L9.46,13.56 L8.90,13.97 L9.11,13.31 L8.55,12.91 L9.24,12.91Z M8.60,9.05 L8.81,9.71 L9.50,9.71 L8.95,10.11 L9.16,10.77 L8.60,10.36 L8.04,10.77 L8.25,10.11 L7.70,9.71 L8.39,9.71Z M9.46,5.85 L9.67,6.51 L10.36,6.51 L9.80,6.91 L10.02,7.57 L9.46,7.16 L8.90,7.57 L9.11,6.91 L8.55,6.51 L9.24,6.51Z M11.80,3.51 L12.01,4.16 L12.70,4.16 L12.15,4.57 L12.36,5.23 L11.80,4.82 L11.24,5.23 L11.45,4.57 L10.90,4.16 L11.59,4.16Z" fill="#FFCC00" />
    </>
  ),

  // SIMPLIFIED — the taegeuk is drawn as a red upper and blue lower disc with the two inner discs; the four
  // trigrams are reduced to three bars at each corner, unrotated, which is what reads at 18x12 (2026-10-05).
  KR: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <path d="M10 10a5 5 0 0 1 10 0Z" fill="#CD2E3A" />
      <path d="M10 10a5 5 0 0 0 10 0Z" fill="#0047A0" />
      <circle cx="12.5" cy="10" r="2.5" fill="#CD2E3A" />
      <circle cx="17.5" cy="10" r="2.5" fill="#0047A0" />
      <path d="M2.5 3.2h4M2.5 4.6h4M2.5 6h4M23.5 3.2h4M23.5 4.6h4M23.5 6h4M2.5 14h4M2.5 15.4h4M2.5 16.8h4M23.5 14h4M23.5 15.4h4M23.5 16.8h4" stroke="#000" strokeWidth="0.7" />
    </>
  ),

  // SIMPLIFIED — the Union Jack canton as on the Australian flag; the Southern Cross as four red stars with a
  // white border, placed as on the specification (2026-10-05).
  NZ: (
    <>
      <rect width="30" height="20" fill="#00247D" />
      <g clipPath="url(#nz-canton)">
        <rect width="15" height="10" fill="#00247D" />
        <path d="M0 0 15 10M15 0 0 10" stroke="#fff" strokeWidth="2" />
        <path d="M0 0 15 10M15 0 0 10" stroke="#CC142B" strokeWidth="0.9" />
        <path d="M7.5 0v10M0 5h15" stroke="#fff" strokeWidth="3.3" />
        <path d="M7.5 0v10M0 5h15" stroke="#CC142B" strokeWidth="2" />
      </g>
      <clipPath id="nz-canton">
        <rect width="15" height="10" />
      </clipPath>
      <path d="M22.20,2.95 L22.48,3.81 L23.39,3.81 L22.65,4.35 L22.93,5.21 L22.20,4.68 L21.47,5.21 L21.75,4.35 L21.01,3.81 L21.92,3.81Z M25.80,7.15 L26.08,8.01 L26.99,8.01 L26.25,8.55 L26.53,9.41 L25.80,8.88 L25.07,9.41 L25.35,8.55 L24.61,8.01 L25.52,8.01Z M20.60,9.35 L20.88,10.21 L21.79,10.21 L21.05,10.75 L21.33,11.61 L20.60,11.08 L19.87,11.61 L20.15,10.75 L19.41,10.21 L20.32,10.21Z M23.40,14.15 L23.68,15.01 L24.59,15.01 L23.85,15.55 L24.13,16.41 L23.40,15.88 L22.67,16.41 L22.95,15.55 L22.21,15.01 L23.12,15.01Z" fill="#CC142B" stroke="#fff" strokeWidth="0.4" />
    </>
  ),

  // SIMPLIFIED — blue over red with the white hoist triangle, as specified; the sun's eight rays are omitted
  // and the three stars kept (2026-10-05).
  PH: (
    <>
      <rect width="30" height="20" fill="#0038A8" />
      <rect y="10" width="30" height="10" fill="#CE1126" />
      <path d="M0 0 17.32 10 0 20Z" fill="#fff" />
      <circle cx="6" cy="10" r="2.3" fill="#FCD116" />
      <path d="M2.30,1.50 L2.55,2.26 L3.35,2.26 L2.70,2.73 L2.95,3.49 L2.30,3.02 L1.65,3.49 L1.90,2.73 L1.25,2.26 L2.05,2.26Z M2.30,16.30 L2.55,17.06 L3.35,17.06 L2.70,17.53 L2.95,18.29 L2.30,17.82 L1.65,18.29 L1.90,17.53 L1.25,17.06 L2.05,17.06Z M13.60,8.90 L13.85,9.66 L14.65,9.66 L14.00,10.13 L14.25,10.89 L13.60,10.42 L12.95,10.89 L13.20,10.13 L12.55,9.66 L13.35,9.66Z" fill="#FCD116" />
    </>
  ),

  // SIMPLIFIED — red over white; the crescent and the five stars in the canton, the stars enlarged to read at
  // text size (2026-10-05).
  SG: (
    <>
      <rect width="30" height="20" fill="#EF3340" />
      <rect y="10" width="30" height="10" fill="#fff" />
      <circle cx="7.6" cy="5.1" r="3.6" fill="#fff" />
      <circle cx="8.7" cy="5.1" r="3.1" fill="#EF3340" />
      <path d="M10.60,2.90 L10.73,3.31 L11.17,3.31 L10.82,3.57 L10.95,3.99 L10.60,3.73 L10.25,3.99 L10.38,3.57 L10.03,3.31 L10.47,3.31Z M12.22,4.07 L12.35,4.49 L12.79,4.49 L12.43,4.75 L12.57,5.16 L12.22,4.90 L11.86,5.16 L12.00,4.75 L11.65,4.49 L12.08,4.49Z M11.60,5.98 L11.73,6.39 L12.17,6.39 L11.82,6.65 L11.95,7.06 L11.60,6.80 L11.25,7.06 L11.38,6.65 L11.03,6.39 L11.46,6.39Z M9.60,5.98 L9.74,6.39 L10.17,6.39 L9.82,6.65 L9.95,7.06 L9.60,6.80 L9.25,7.06 L9.38,6.65 L9.03,6.39 L9.47,6.39Z M8.98,4.07 L9.12,4.49 L9.55,4.49 L9.20,4.75 L9.34,5.16 L8.98,4.90 L8.63,5.16 L8.77,4.75 L8.41,4.49 L8.85,4.49Z" fill="#fff" />
    </>
  ),

  // EXACT — five stripes in the proportion 1:1:2:1:1 (2026-10-05).
  TH: (
    <>
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3.33" width="30" height="13.34" fill="#fff" />
      <rect y="6.67" width="30" height="6.66" fill="#2D2A4A" />
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
  // SIMPLIFIED — the Dannebrog's red field and white Nordic cross; the official
  // proportions are 12:4:21 across and 12:4:12 down on a 37x28 flag, fitted here
  // to the shared 3:2 box like every other Nordic cross in this file. Added
  // 2026-10-05: the Ørsted milestone (1820) is Danish and had no flag.
  DK: (
    <>
      <rect width="30" height="20" fill="#C8102E" />
      <rect x="8.6" width="2.9" height="20" fill="#fff" />
      <rect y="8.6" width="30" height="2.9" fill="#fff" />
    </>
  ),

  FI: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect y="7.7" width="30" height="4.6" fill="#003580" />
      <rect x="8.2" width="4.6" height="20" fill="#003580" />
    </>
  ),

  // EXACT.
  // EXACT — three equal vertical bands, Italian specification colours.
  // SIMPLIFIED - Chile: white over red, with a blue canton bearing a white
  // five-pointed star. At 30x20 a true five-pointed star is sub-pixel, so the
  // star is drawn as a small white polygon that keeps the silhouette; the
  // canton is one third of the width and half the height, which is exact.
  CL: (
    <>
      <rect width="30" height="10" fill="#FFFFFF" />
      <rect y="10" width="30" height="10" fill="#D52B1E" />
      <rect width="10" height="10" fill="#0039A6" />
      <polygon
        points="5,2.6 5.9,5.2 8.6,5.2 6.4,6.9 7.2,9.5 5,7.9 2.8,9.5 3.6,6.9 1.4,5.2 4.1,5.2"
        fill="#FFFFFF"
      />
    </>
  ),

  IT: (
    <>
      <rect width="10" height="20" fill="#008C45" />
      <rect x="10" width="10" height="20" fill="#F4F5F0" />
      <rect x="20" width="10" height="20" fill="#CD212A" />
    </>
  ),

  // EXACT — two equal horizontal bands, white over red.
  PL: (
    <>
      <rect width="30" height="10" fill="#fff" />
      <rect y="10" width="30" height="10" fill="#DC143C" />
    </>
  ),

  // SIMPLIFIED — South Africa's flag is a horizontal tricolour crossed by a
  // green pall (a sideways Y) fimbriated in white and gold, over a black
  // triangle at the hoist. At 18x12 the fimbriations are sub-pixel, so the
  // pall is drawn as a single green band with the black triangle kept, which
  // preserves what the flag is recognised by at this size.
  ZA: (
    <>
      <rect width="30" height="10" fill="#E03C31" />
      <rect y="10" width="30" height="10" fill="#001489" />
      <path d="M0 0 L13 10 L0 20 Z" fill="#000" />
      <path d="M0 3 L11 10 L0 17 Z" fill="#007A4D" />
      <path d="M11 10 L30 10 L30 6 L13 6 Z M11 10 L30 10 L30 14 L13 14 Z" fill="#007A4D" />
      <rect y="8.6" width="30" height="2.8" fill="#FFB612" opacity="0" />
    </>
  ),

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
