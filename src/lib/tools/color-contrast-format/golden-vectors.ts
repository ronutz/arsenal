// ============================================================================
// src/lib/tools/color-contrast-format/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for Color contrast & format (set "color-contrast-format-golden-2026-10-05").
//
// Each vector is a foreground and a background as CSS colour strings. The
// pinned fields are the foreground's every notation, names, gamut flag and
// luminance, the background's hex, luminance and oklch, the composite when
// the foreground is translucent, the ratio, the WCAG levels and the fixes; a
// vector whose input the engine refuses pins the refusal's code.
//
// Expected values were captured from compute.run() on 2026-10-05. The
// conversions reproduce the worked examples of CSS Color Level 4 (#7654CD and
// the lab()/oklch() example colours) and WCAG's 4.54:1 for #767676 on white.
// ============================================================================

import { run, ColorParseError, type ColorContrastResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "color-contrast-format-golden-2026-10-05";

/** The fields a vector pins, or the refusal. */
export type ColorPinned = ReturnType<typeof pin> | { error: string };

/** One vector. */
export interface ColorVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { foreground: string; background: string };
  // The pinned fields of the result.
  expect: ColorPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ColorContrastResult) {
  // The foreground in full, the background in brief, the comparison.
  return {
    fg: { hex: r.foreground.formats.hex, syntax: r.foreground.syntax, inGamut: r.foreground.inGamut, names: r.foreground.names, lum: Number(r.foreground.luminance.toFixed(6)), formats: r.foreground.formats, notes: r.foreground.notes },
    bg: { hex: r.background.formats.hex, syntax: r.background.syntax, inGamut: r.background.inGamut, lum: Number(r.background.luminance.toFixed(6)), oklch: r.background.formats.oklch },
    composited: r.composited ? r.composited.hex : null,
    ratio: r.ratio, ratioText: r.ratioText, levels: r.levels, fixes: r.fixes,
  };
}

/** Run a vector's input to its pinned shape (a refusal becomes its code). */
export function pinInput(input: { foreground: string; background: string }): ColorPinned {
  // Run, catching the engine's refusal.
  try { return pin(run(input)); } catch (e) { if (e instanceof ColorParseError) return { error: e.code }; throw e; }
}

/** The vectors. */
export const VECTORS: ColorVector[] = [
  // The classic borderline: 4.54:1, AA for normal text, not AAA.
  {
    id: "gray-on-white",
    input: { foreground: "#767676", background: "white" },
    expect: {"fg":{"hex":"#767676","syntax":"hex","inGamut":true,"names":[],"lum":0.181164,"formats":{"hex":"#767676","rgb":"rgb(118 118 118)","hsl":"hsl(none 0% 46.27%)","hwb":"hwb(none 46.27% 53.73%)","lab":"lab(49.637 0 0)","lch":"lch(49.637 0 none)","oklab":"oklab(0.5658 0 0)","oklch":"oklch(0.5658 0 none)","srgbLinear":"color(srgb-linear 0.18116 0.18116 0.18116)","xyzD65":"color(xyz-d65 0.17219 0.18116 0.1973)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"named","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":4.54,"ratioText":"4.54:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":false,"aaaLarge":true,"nonText":true},"fixes":[{"target":7,"hex":"#595959","oklch":"oklch(0.464 0 none)","ratio":7,"direction":"darker"}]},
  },
  // The maximum, 21:1.
  {
    id: "black-on-white",
    input: { foreground: "black", background: "white" },
    expect: {"fg":{"hex":"#000000","syntax":"named","inGamut":true,"names":["black"],"lum":0,"formats":{"hex":"#000000","rgb":"rgb(0 0 0)","hsl":"hsl(none 0% 0%)","hwb":"hwb(none 0% 100%)","lab":"lab(0 0 0)","lch":"lch(0 0 none)","oklab":"oklab(0 0 0)","oklch":"oklch(0 0 none)","srgbLinear":"color(srgb-linear 0 0 0)","xyzD65":"color(xyz-d65 0 0 0)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"named","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":21,"ratioText":"21.00:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":true,"aaaLarge":true,"nonText":true},"fixes":[]},
  },
  // Fails 3:1; three fixes offered, each darker.
  {
    id: "light-gray-fails",
    input: { foreground: "#999", background: "#fff" },
    expect: {"fg":{"hex":"#999999","syntax":"hex","inGamut":true,"names":[],"lum":0.318547,"formats":{"hex":"#999999","rgb":"rgb(153 153 153)","hsl":"hsl(none 0% 60%)","hwb":"hwb(none 60% 40%)","lab":"lab(63.223 0 0)","lch":"lch(63.223 0 none)","oklab":"oklab(0.683 0 0)","oklch":"oklch(0.683 0 none)","srgbLinear":"color(srgb-linear 0.31855 0.31855 0.31855)","xyzD65":"color(xyz-d65 0.30276 0.31855 0.34692)"},"notes":[{"id":"hex-short","params":{"expanded":"#999999"}}]},"bg":{"hex":"#ffffff","syntax":"hex","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":2.85,"ratioText":"2.85:1","levels":{"aaNormal":false,"aaLarge":false,"aaaNormal":false,"aaaLarge":false,"nonText":false},"fixes":[{"target":3,"hex":"#949494","oklch":"oklch(0.6665 0 none)","ratio":3.03,"direction":"darker"},{"target":4.5,"hex":"#757575","oklch":"oklch(0.5624 0 none)","ratio":4.61,"direction":"darker"},{"target":7,"hex":"#595959","oklch":"oklch(0.464 0 none)","ratio":7,"direction":"darker"}]},
  },
  // Alpha: the foreground is composited over the background before measuring.
  {
    id: "translucent-black",
    input: { foreground: "rgb(0 0 0 / 50%)", background: "#fff" },
    expect: {"fg":{"hex":"#00000080","syntax":"rgb","inGamut":true,"names":["black"],"lum":0,"formats":{"hex":"#00000080","rgb":"rgb(0 0 0 / 0.5)","hsl":"hsl(none 0% 0% / 0.5)","hwb":"hwb(none 0% 100% / 0.5)","lab":"lab(0 0 0 / 0.5)","lch":"lch(0 0 none / 0.5)","oklab":"oklab(0 0 0 / 0.5)","oklch":"oklch(0 0 none / 0.5)","srgbLinear":"color(srgb-linear 0 0 0 / 0.5)","xyzD65":"color(xyz-d65 0 0 0 / 0.5)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"hex","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":"#808080","ratio":3.98,"ratioText":"3.98:1","levels":{"aaNormal":false,"aaLarge":true,"aaaNormal":false,"aaaLarge":false,"nonText":true},"fixes":[{"target":4.5,"hex":"#757575","oklch":"oklch(0.5624 0 none)","ratio":4.61,"direction":"darker"},{"target":7,"hex":"#595959","oklch":"oklch(0.464 0 none)","ratio":7,"direction":"darker"}]},
  },
  // A colour written in oklch() on a dark background; the AAA fix moves lightness only.
  {
    id: "oklch-on-dark",
    input: { foreground: "oklch(0.7 0.2 250)", background: "#101820" },
    expect: {"fg":{"hex":"#00a1ff","syntax":"oklch","inGamut":false,"names":[],"lum":0.328713,"formats":{"hex":"#00a1ff","rgb":"rgb(0 161 255)","hsl":"hsl(202.01 100% 50%)","hwb":"hwb(202.01 0% 0%)","lab":"lab(64.084 -3.355 -66.945)","lch":"lch(64.084 67.029 267.13)","oklab":"oklab(0.7 -0.0684 -0.1879)","oklch":"oklch(0.7 0.2 250)","srgbLinear":"color(srgb-linear -0.00256 0.35866 1.19595)","xyzD65":"color(xyz-d65 0.34304 0.3423 1.17949)"},"notes":[{"id":"out-of-gamut"}]},"bg":{"hex":"#101820","syntax":"hex","inGamut":true,"lum":0.008677,"oklch":"oklch(0.205 0.02 248.83)"},"composited":null,"ratio":6.45,"ratioText":"6.45:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":false,"aaaLarge":true,"nonText":true},"fixes":[{"target":7,"hex":"#43aaf9","oklch":"oklch(0.7137 0.1489 245.46)","ratio":7.12,"direction":"lighter"}]},
  },
  // Two named colours.
  {
    id: "named-pair",
    input: { foreground: "rebeccapurple", background: "mintcream" },
    expect: {"fg":{"hex":"#663399","syntax":"named","inGamut":true,"names":["rebeccapurple"],"lum":0.074923,"formats":{"hex":"#663399","rgb":"rgb(102 51 153)","hsl":"hsl(270 50% 40%)","hwb":"hwb(270 20% 40%)","lab":"lab(32.393 38.423 -47.691)","lch":"lch(32.393 61.244 308.86)","oklab":"oklab(0.4403 0.0882 -0.1339)","oklch":"oklch(0.4403 0.1603 303.37)","srgbLinear":"color(srgb-linear 0.13287 0.0331 0.31855)","xyzD65":"color(xyz-d65 0.12412 0.07493 0.3093)"},"notes":[]},"bg":{"hex":"#f5fffa","syntax":"named","inGamut":true,"lum":0.978346,"oklch":"oklch(0.9912 0.0124 164.81)"},"composited":null,"ratio":8.23,"ratioText":"8.23:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":true,"aaaLarge":true,"nonText":true},"fixes":[]},
  },
  // Legacy comma syntax, noted and read.
  {
    id: "hsl-legacy",
    input: { foreground: "hsla(120, 100%, 25%, 1)", background: "rgb(255, 255, 255)" },
    expect: {"fg":{"hex":"#008000","syntax":"hsl","inGamut":true,"names":["green"],"lum":0.153082,"formats":{"hex":"#008000","rgb":"rgb(0 128 0)","hsl":"hsl(120 100% 25%)","hwb":"hwb(120 0% 50%)","lab":"lab(46.102 -47.418 48.449)","lch":"lch(46.102 67.793 134.38)","oklab":"oklab(0.5183 -0.1399 0.1074)","oklch":"oklch(0.5183 0.1764 142.5)","srgbLinear":"color(srgb-linear 0 0.21404 0)","xyzD65":"color(xyz-d65 0.07654 0.15308 0.02551)"},"notes":[{"id":"legacy-commas"}]},"bg":{"hex":"#ffffff","syntax":"rgb","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":5.17,"ratioText":"5.17:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":false,"aaaLarge":true,"nonText":true},"fixes":[{"target":7,"hex":"#066805","oklch":"oklch(0.4492 0.1495 142.51)","ratio":7.02,"direction":"darker"}]},
  },
  // A display-p3 colour outside the sRGB gamut, clipped for the sRGB notations and the luminance.
  {
    id: "p3-out-of-gamut",
    input: { foreground: "color(display-p3 1 1 0)", background: "black" },
    expect: {"fg":{"hex":"#ffff00","syntax":"color","inGamut":false,"names":["yellow"],"lum":0.9278,"formats":{"hex":"#ffff00","rgb":"rgb(255 255 0)","hsl":"hsl(60 100% 50%)","hwb":"hwb(60 0% 0%)","lab":"lab(97.366 -17.433 122.034)","lch":"lch(97.366 123.273 98.13)","oklab":"oklab(0.9648 -0.0847 0.2299)","oklch":"oklch(0.9648 0.245 110.23)","srgbLinear":"color(srgb-linear 1 1 -0.09827)","xyzD65":"color(xyz-d65 0.75224 0.92071 0.04511)"},"notes":[{"id":"out-of-gamut"}]},"bg":{"hex":"#000000","syntax":"named","inGamut":true,"lum":0,"oklch":"oklch(0 0 none)"},"composited":null,"ratio":19.56,"ratioText":"19.56:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":true,"aaaLarge":true,"nonText":true},"fixes":[]},
  },
  // The specification's lab() example; the same colour the oklch() example names.
  {
    id: "lab-example",
    input: { foreground: "lab(29.2345% 39.3825 20.0664)", background: "#fff" },
    expect: {"fg":{"hex":"#7d2329","syntax":"lab","inGamut":true,"names":[],"lum":0.057487,"formats":{"hex":"#7d2329","rgb":"rgb(125 35 41)","hsl":"hsl(356.53 55.93% 31.47%)","hwb":"hwb(356.53 13.87% 50.94%)","lab":"lab(29.235 39.382 20.066)","lch":"lch(29.235 44.2 27)","oklab":"oklab(0.401 0.1147 0.0453)","oklch":"oklch(0.401 0.1234 21.57)","srgbLinear":"color(srgb-linear 0.20547 0.01711 0.02174)","xyzD65":"color(xyz-d65 0.09478 0.05749 0.02667)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"hex","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":9.77,"ratioText":"9.77:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":true,"aaaLarge":true,"nonText":true},"fixes":[]},
  },
  // Three-digit hex, expanded by replicating digits.
  {
    id: "hex-short",
    input: { foreground: "#abc", background: "#123" },
    expect: {"fg":{"hex":"#aabbcc","syntax":"hex","inGamut":true,"names":[],"lum":0.484463,"formats":{"hex":"#aabbcc","rgb":"rgb(170 187 204)","hsl":"hsl(210 25% 73.33%)","hwb":"hwb(210 66.67% 20%)","lab":"lab(74.969 -3.399 -10.697)","lch":"lch(74.969 11.224 252.37)","oklab":"oklab(0.7844 -0.0114 -0.0285)","oklch":"oklch(0.7844 0.0307 248.22)","srgbLinear":"color(srgb-linear 0.40198 0.49693 0.60383)","xyzD65":"color(xyz-d65 0.45245 0.48446 0.64096)"},"notes":[{"id":"hex-short","params":{"expanded":"#aabbcc"}}]},"bg":{"hex":"#112233","syntax":"hex","inGamut":true,"lum":0.015022,"oklch":"oklch(0.2462 0.0398 249.73)"},"composited":null,"ratio":8.22,"ratioText":"8.22:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":true,"aaaLarge":true,"nonText":true},"fixes":[]},
  },
  // Identical colours: 1:1.
  {
    id: "same-colour",
    input: { foreground: "#336699", background: "#336699" },
    expect: {"fg":{"hex":"#336699","syntax":"hex","inGamut":true,"names":[],"lum":0.125065,"formats":{"hex":"#336699","rgb":"rgb(51 102 153)","hsl":"hsl(210 50% 40%)","hwb":"hwb(210 20% 40%)","lab":"lab(41.521 -4.573 -33.494)","lch":"lch(41.521 33.805 262.23)","oklab":"oklab(0.4993 -0.033 -0.093)","oklch":"oklch(0.4993 0.0987 250.43)","srgbLinear":"color(srgb-linear 0.0331 0.13287 0.31855)","xyzD65":"color(xyz-d65 0.11866 0.12506 0.31927)"},"notes":[]},"bg":{"hex":"#336699","syntax":"hex","inGamut":true,"lum":0.125065,"oklch":"oklch(0.4993 0.0987 250.43)"},"composited":null,"ratio":1,"ratioText":"1.00:1","levels":{"aaNormal":false,"aaLarge":false,"aaaNormal":false,"aaaLarge":false,"nonText":false},"fixes":[{"target":3,"hex":"#86bcf4","oklch":"oklch(0.7789 0.0985 250.07)","ratio":3,"direction":"lighter"},{"target":3,"hex":"#03172d","oklch":"oklch(0.2019 0.0518 251.77)","ratio":3.01,"direction":"darker"},{"target":4.5,"hex":"#cae2fc","oklch":"oklch(0.9033 0.044 250.42)","ratio":4.51,"direction":"lighter"}]},
  },
  // Transparent black over white composites to white: 1:1.
  {
    id: "transparent-foreground",
    input: { foreground: "transparent", background: "white" },
    expect: {"fg":{"hex":"#00000000","syntax":"named","inGamut":true,"names":["black"],"lum":0,"formats":{"hex":"#00000000","rgb":"rgb(0 0 0 / 0)","hsl":"hsl(none 0% 0% / 0)","hwb":"hwb(none 0% 100% / 0)","lab":"lab(0 0 0 / 0)","lch":"lch(0 0 none / 0)","oklab":"oklab(0 0 0 / 0)","oklch":"oklch(0 0 none / 0)","srgbLinear":"color(srgb-linear 0 0 0 / 0)","xyzD65":"color(xyz-d65 0 0 0 / 0)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"named","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":"#ffffff","ratio":1,"ratioText":"1.00:1","levels":{"aaNormal":false,"aaLarge":false,"aaaNormal":false,"aaaLarge":false,"nonText":false},"fixes":[{"target":3,"hex":"#949494","oklch":"oklch(0.6665 0 none)","ratio":3.03,"direction":"darker"},{"target":4.5,"hex":"#757575","oklch":"oklch(0.5624 0 none)","ratio":4.61,"direction":"darker"},{"target":7,"hex":"#595959","oklch":"oklch(0.464 0 none)","ratio":7,"direction":"darker"}]},
  },
  // A colour given in linear-light sRGB.
  {
    id: "srgb-linear",
    input: { foreground: "color(srgb-linear 0.435 0.017 0.055)", background: "white" },
    expect: {"fg":{"hex":"#b02342","syntax":"color","inGamut":true,"names":[],"lum":0.10861,"formats":{"hex":"#b02342","rgb":"rgb(176 35 66)","hsl":"hsl(346.77 66.66% 41.45%)","hwb":"hwb(346.77 13.82% 30.92%)","lab":"lab(39.966 56.745 19.55)","lch":"lch(39.966 60.018 19.01)","oklab":"oklab(0.4994 0.1696 0.0443)","oklch":"oklch(0.4994 0.1753 14.64)","srgbLinear":"color(srgb-linear 0.435 0.017 0.055)","xyzD65":"color(xyz-d65 0.1954 0.10863 0.06271)"},"notes":[]},"bg":{"hex":"#ffffff","syntax":"named","inGamut":true,"lum":1,"oklch":"oklch(1 0 none)"},"composited":null,"ratio":6.62,"ratioText":"6.62:1","levels":{"aaNormal":true,"aaLarge":true,"aaaNormal":false,"aaaLarge":true,"nonText":true},"fixes":[{"target":7,"hex":"#aa1c3e","oklch":"oklch(0.4821 0.175 14.5)","ratio":7.13,"direction":"darker"}]},
  },
  // Two hwb() colours.
  {
    id: "hwb-pair",
    input: { foreground: "hwb(20 20% 30%)", background: "hwb(200 70% 10%)" },
    expect: {"fg":{"hex":"#b35d33","syntax":"hwb","inGamut":true,"names":[],"lum":0.1768,"formats":{"hex":"#b35d33","rgb":"rgb(179 93 51)","hsl":"hsl(20 55.56% 45%)","hwb":"hwb(20 20% 30%)","lab":"lab(49.621 32.845 39.838)","lch":"lch(49.621 51.632 50.49)","oklab":"oklab(0.5729 0.0867 0.0886)","oklch":"oklch(0.5729 0.1239 45.62)","srgbLinear":"color(srgb-linear 0.44799 0.11069 0.0331)","xyzD65":"color(xyz-d65 0.2303 0.17681 0.05332)"},"notes":[]},"bg":{"hex":"#b3d4e6","syntax":"hwb","inGamut":true,"lum":0.625467,"oklch":"oklch(0.8522 0.0432 229.53)"},"composited":null,"ratio":2.98,"ratioText":"2.98:1","levels":{"aaNormal":false,"aaLarge":false,"aaaNormal":false,"aaaLarge":false,"nonText":false},"fixes":[{"target":3,"hex":"#b15c31","oklch":"oklch(0.5681 0.1243 45.75)","ratio":3.04,"direction":"darker"},{"target":4.5,"hex":"#924010","oklch":"oklch(0.4733 0.1243 45.76)","ratio":4.56,"direction":"darker"},{"target":7,"hex":"#642d10","oklch":"oklch(0.3674 0.0891 45.5)","ratio":7.02,"direction":"darker"}]},
  },
  // A malformed hex: the engine refuses it with a reason.
  {
    id: "not-a-colour",
    input: { foreground: "#12", background: "white" },
    expect: {"error":"bad-hex"},
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pinInput(v.input));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
