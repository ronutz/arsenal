// ============================================================================
// src/lib/tools/color-contrast-format/compute.ts
// ----------------------------------------------------------------------------
// COLOR CONTRAST & FORMAT: the pure engine (rank 9 of the 2026-10 campaign).
//
// Two colours in, written any way CSS Color Level 4 allows (a named colour,
// #hex in 3, 4, 6 or 8 digits, rgb(), hsl(), hwb(), lab(), lch(), oklab(),
// oklch(), color(srgb | srgb-linear | display-p3 | xyz | xyz-d50 | xyz-d65)),
// and out comes: each colour in every one of those notations, its relative
// luminance, the WCAG contrast ratio between them, pass or fail against the
// WCAG levels (AA 4.5:1 and 3:1 for large text, AAA 7:1 and 4.5:1, 3:1 for
// user interface components and graphical objects), and, when a level fails,
// the nearest foreground that passes it, found by moving the foreground's
// OKLCH lightness while keeping its hue and chroma.
//
// FACTS. The luminance and contrast formulas are WCAG 2.2's (W3C Recommendation
// 12 December 2024): L = 0.2126 R + 0.7152 G + 0.0722 B over linearised sRGB
// (threshold 0.04045; WCAG 2.0 and 2.1 wrote 0.03928, which classifies every
// 8-bit value identically), ratio = (L1 + 0.05) / (L2 + 0.05). The colour
// conversions are the sample code of CSS Color Module Level 4 (W3C Candidate
// Recommendation Draft, 30 September 2026; the code from the csswg-drafts
// repository, fetched 2026-10-05): sRGB transfer function, the rational
// sRGB-XYZ matrices, Bradford D65-D50, CIE Lab, OKLab's two matrices, and the
// HSL and HWB algorithms. The percentage reference ranges and the named colours
// are the specification's. The manifest carries the citations.
//
// Pure arithmetic, nothing fetched, nothing stored.
// ============================================================================

import { NAMED_COLORS, NAMES_BY_HEX } from "./named-colors";

/** The input: a foreground and a background, as CSS colour strings. */
export interface ColorInput {
  /** The text or object colour. */
  foreground: string;
  /** The colour behind it. */
  background: string;
}

/** The notations the parser recognises. */
export type ColorSyntax = "named" | "hex" | "rgb" | "hsl" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "color";

/** A triple. */
export type Triple = [number, number, number];

/** One parsed colour with every notation. */
export interface ParsedColor {
  /** As typed, trimmed. */
  input: string;
  /** The notation it was written in. */
  syntax: ColorSyntax;
  /** For color(): the colour space named; otherwise null. */
  space: string | null;
  /** The sRGB components, 0..1, possibly outside that range when the colour is out of gamut. */
  srgb: Triple;
  /** Alpha, 0..1. */
  alpha: number;
  /** Whether the colour is inside the sRGB gamut (each component within 0..1, with a small tolerance). */
  inGamut: boolean;
  /** The 8-bit sRGB components after clipping to the gamut. */
  rgb255: Triple;
  /** The CSS names that denote exactly this 8-bit colour, when any. */
  names: string[];
  /** The colour in every notation (sRGB clipped where a notation cannot hold out-of-gamut values). */
  formats: {
    hex: string;
    rgb: string;
    hsl: string;
    hwb: string;
    lab: string;
    lch: string;
    oklab: string;
    oklch: string;
    srgbLinear: string;
    xyzD65: string;
  };
  /** The WCAG relative luminance of the (clipped) colour. */
  luminance: number;
  /** Notes about how the input was read, as message ids with params. */
  notes: { id: string; params?: Record<string, string | number> }[];
}

/** The WCAG levels tested. */
export interface Levels {
  /** 4.5:1, SC 1.4.3. */
  aaNormal: boolean;
  /** 3:1, SC 1.4.3 for large-scale text. */
  aaLarge: boolean;
  /** 7:1, SC 1.4.6. */
  aaaNormal: boolean;
  /** 4.5:1, SC 1.4.6 for large-scale text. */
  aaaLarge: boolean;
  /** 3:1, SC 1.4.11. */
  nonText: boolean;
}

/** A suggested foreground that reaches a target ratio. */
export interface Fix {
  /** The target ratio. */
  target: number;
  /** The colour, as hex. */
  hex: string;
  /** As oklch(), to show what moved. */
  oklch: string;
  /** The ratio it reaches. */
  ratio: number;
  /** Whether it is lighter or darker than the original. */
  direction: "lighter" | "darker";
}

/** The result. */
export interface ColorContrastResult {
  /** The foreground, parsed. */
  foreground: ParsedColor;
  /** The background, parsed. */
  background: ParsedColor;
  /** The foreground composited over the background when it has alpha below 1 (what the eye sees), else null. */
  composited: { rgb255: Triple; hex: string; luminance: number } | null;
  /** The contrast ratio, to two decimals. */
  ratio: number;
  /** The ratio as "n.nn:1". */
  ratioText: string;
  /** The levels. */
  levels: Levels;
  /** The lighter and darker luminances used. */
  luminances: { lighter: number; darker: number };
  /** Fixes for the levels that fail (4.5 and 7, and 3 when even that fails), when one exists. */
  fixes: Fix[];
}

/** An error the page can show. */
export class ColorParseError extends Error {
  /** Which input failed. */
  readonly which: "foreground" | "background";
  /** A message id for the UI. */
  readonly code: string;
  /** Build it. */
  constructor(which: "foreground" | "background", code: string, message: string) {
    // The message.
    super(message);
    // Which.
    this.which = which;
    // Code.
    this.code = code;
    // Name.
    this.name = "ColorParseError";
  }
}

// ---------------------------------------------------------------------------
// Conversions: the sample code of CSS Color 4, transcribed.
// ---------------------------------------------------------------------------

/** Multiply a 3x3 matrix by a column vector. */
function mul(M: number[][], v: Triple): Triple {
  // Row by row.
  return [0, 1, 2].map((i) => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]) as Triple;
}

/** sRGB (gamma-encoded) to linear light; the extended transfer function mirrors negatives. */
export function linSrgb(c: number): number {
  // Sign and magnitude.
  const sign = c < 0 ? -1 : 1;
  // Magnitude.
  const abs = Math.abs(c);
  // The linear segment.
  if (abs <= 0.04045) return c / 12.92;
  // The power segment.
  return sign * Math.pow((abs + 0.055) / 1.055, 2.4);
}

/** Linear light to sRGB (gamma-encoded). */
export function gamSrgb(c: number): number {
  // Sign and magnitude.
  const sign = c < 0 ? -1 : 1;
  // Magnitude.
  const abs = Math.abs(c);
  // The power segment.
  if (abs > 0.0031308) return sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  // The linear segment.
  return 12.92 * c;
}

/** Linear sRGB to XYZ (D65), the specification's rational matrix. */
const M_LIN_SRGB_TO_XYZ = [
  [506752 / 1228815, 87881 / 245763, 12673 / 70218],
  [87098 / 409605, 175762 / 245763, 12673 / 175545],
  [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];
/** XYZ (D65) to linear sRGB. */
const M_XYZ_TO_LIN_SRGB = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
];
/** Linear display-p3 to XYZ (D65). */
const M_LIN_P3_TO_XYZ = [
  [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
  [35783 / 156275, 247089 / 357200, 198249 / 2500400],
  [0 / 1, 32229 / 714400, 5220557 / 5000800],
];
/** Bradford D65 to D50. */
const M_D65_TO_D50 = [
  [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
  [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
  [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371],
];
/** Bradford D50 to D65. */
const M_D50_TO_D65 = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];
/** XYZ (D65) to LMS, for OKLab. */
const M_XYZ_TO_LMS = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
/** LMS (cube-rooted) to OKLab. */
const M_LMS_TO_OKLAB = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
/** OKLab to LMS (before cubing). */
const M_OKLAB_TO_LMS = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];
/** LMS (cubed) to XYZ (D65). */
const M_LMS_TO_XYZ = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];
/** The D50 white point from its 4-figure chromaticities. */
const D50: Triple = [0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585];

/** sRGB to XYZ (D65). */
export function srgbToXyz(rgb: Triple): Triple {
  // Linearise, then the matrix.
  return mul(M_LIN_SRGB_TO_XYZ, rgb.map(linSrgb) as Triple);
}

/** XYZ (D65) to sRGB. */
export function xyzToSrgb(xyz: Triple): Triple {
  // The matrix, then the transfer function.
  return mul(M_XYZ_TO_LIN_SRGB, xyz).map(gamSrgb) as Triple;
}

/** XYZ (D65) to OKLab. */
export function xyzToOklab(xyz: Triple): Triple {
  // To LMS, cube root, to OKLab.
  return mul(M_LMS_TO_OKLAB, mul(M_XYZ_TO_LMS, xyz).map((c) => Math.cbrt(c)) as Triple);
}

/** OKLab to XYZ (D65). */
export function oklabToXyz(lab: Triple): Triple {
  // To LMS, cube, to XYZ.
  return mul(M_LMS_TO_XYZ, mul(M_OKLAB_TO_LMS, lab).map((c) => c ** 3) as Triple);
}

/** XYZ (D50) to CIE Lab. */
export function xyzD50ToLab(xyz: Triple): Triple {
  // The CIE constants as rational fractions.
  const e = 216 / 24389;
  // kappa.
  const k = 24389 / 27;
  // Scaled to the white.
  const s = xyz.map((v, i) => v / D50[i]);
  // f.
  const f = s.map((v) => (v > e ? Math.cbrt(v) : (k * v + 16) / 116));
  // L, a, b.
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}

/** CIE Lab to XYZ (D50). */
export function labToXyzD50(lab: Triple): Triple {
  // The constants.
  const k = 24389 / 27;
  // epsilon.
  const e = 216 / 24389;
  // f.
  const f1 = (lab[0] + 16) / 116;
  // f0, f2.
  const f0 = lab[1] / 500 + f1;
  // f2.
  const f2 = f1 - lab[2] / 200;
  // xyz.
  const xyz: Triple = [
    f0 ** 3 > e ? f0 ** 3 : (116 * f0 - 16) / k,
    lab[0] > k * e ? ((lab[0] + 16) / 116) ** 3 : lab[0] / k,
    f2 ** 3 > e ? f2 ** 3 : (116 * f2 - 16) / k,
  ];
  // Scaled by the white.
  return xyz.map((v, i) => v * D50[i]) as Triple;
}

/** Rectangular to polar (Lab to LCH, OKLab to OKLCH); hue NaN when chroma is below the powerless threshold. */
export function toPolar(lab: Triple, epsilon: number): Triple {
  // Chroma.
  const c = Math.sqrt(lab[1] ** 2 + lab[2] ** 2);
  // Hue in degrees.
  let h = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  // Into 0..360.
  if (h < 0) h += 360;
  // Powerless.
  if (c <= epsilon) h = NaN;
  // Done.
  return [lab[0], c, h];
}

/** Polar to rectangular. */
export function toRect(lch: Triple): Triple {
  // A hue of NaN (none) counts as 0.
  const h = Number.isNaN(lch[2]) ? 0 : lch[2];
  // a, b.
  return [lch[0], lch[1] * Math.cos((h * Math.PI) / 180), lch[1] * Math.sin((h * Math.PI) / 180)];
}

/** HSL (hue degrees, s and l in 0..100) to sRGB 0..1, the specification's algorithm. */
export function hslToRgb(hue: number, sat: number, light: number): Triple {
  // Normalise.
  const s = sat / 100;
  // Lightness.
  const l = light / 100;
  // The channel function.
  const f = (n: number) => {
    // k.
    const k = (((n + hue / 30) % 12) + 12) % 12;
    // a.
    const a = s * Math.min(l, 1 - l);
    // The value.
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  // r, g, b.
  return [f(0), f(8), f(4)];
}

/** sRGB 0..1 to HSL (hue degrees or NaN, s and l in 0..100), the specification's algorithm. */
export function rgbToHsl(rgb: Triple): Triple {
  // Extremes.
  const max = Math.max(...rgb);
  // Min.
  const min = Math.min(...rgb);
  // Lightness.
  const light = (min + max) / 2;
  // Hue and saturation.
  let hue = NaN;
  // Sat.
  let sat = 0;
  // Delta.
  const d = max - min;
  // Chromatic.
  if (d !== 0) {
    // Saturation.
    sat = light === 0 || light === 1 ? 0 : (max - light) / Math.min(light, 1 - light);
    // Hue by the dominant channel.
    if (max === rgb[0]) hue = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0);
    else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / d + 2;
    else hue = (rgb[0] - rgb[1]) / d + 4;
    // Degrees.
    hue *= 60;
  }
  // Powerless.
  if (sat <= 1 / 100000) hue = NaN;
  // Done.
  return [hue, sat * 100, light * 100];
}

/** HWB (hue degrees, w and b in 0..100) to sRGB 0..1. */
export function hwbToRgb(hue: number, white: number, black: number): Triple {
  // Normalise.
  const w = white / 100;
  // Black.
  const b = black / 100;
  // A grey.
  if (w + b >= 1) {
    // The grey level.
    const g = w / (w + b);
    // Done.
    return [g, g, g];
  }
  // The pure hue, then mixed.
  return hslToRgb(hue, 100, 50).map((c) => c * (1 - w - b) + w) as Triple;
}

/** sRGB 0..1 to HWB. */
export function rgbToHwb(rgb: Triple): Triple {
  // The hue from HSL.
  let hue = rgbToHue(rgb);
  // White and black.
  const white = Math.min(...rgb);
  // Black.
  const black = 1 - Math.max(...rgb);
  // Powerless.
  if (white + black >= 1 - 1 / 100000) hue = NaN;
  // Done.
  return [hue, white * 100, black * 100];
}

/** The hue alone (degrees or NaN), as rgbToHwb needs it. */
function rgbToHue(rgb: Triple): number {
  // Extremes.
  const max = Math.max(...rgb);
  // Min.
  const min = Math.min(...rgb);
  // Delta.
  const d = max - min;
  // Achromatic.
  if (d === 0) return NaN;
  // By the dominant channel.
  let hue: number;
  // Red.
  if (max === rgb[0]) hue = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0);
  // Green.
  else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / d + 2;
  // Blue.
  else hue = (rgb[0] - rgb[1]) / d + 4;
  // Degrees.
  hue *= 60;
  // Wrap.
  if (hue >= 360) hue -= 360;
  // Done.
  return hue;
}

// ---------------------------------------------------------------------------
// WCAG.
// ---------------------------------------------------------------------------

/** WCAG relative luminance of an sRGB colour (components 0..1, clipped first). */
export function luminance(rgb: Triple): number {
  // Clip to the gamut: luminance is defined for displayable colours.
  const c = rgb.map((v) => Math.min(1, Math.max(0, v))).map(linSrgb);
  // The weights.
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio of two luminances. */
export function contrastRatio(l1: number, l2: number): number {
  // Lighter over darker.
  const lighter = Math.max(l1, l2);
  // Darker.
  const darker = Math.min(l1, l2);
  // The ratio.
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Parsing.
// ---------------------------------------------------------------------------

/** Parse a CSS number, percentage or angle; percentages are returned as a fraction with pct = true. */
function num(token: string): { value: number; pct: boolean; unit: string } | null {
  // The grammar: a number with an optional unit or percent sign.
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|grad|rad|turn)?$/i.exec(token.trim());
  // Not a number.
  if (!m) return null;
  // The parts.
  return { value: Number(m[1]), pct: m[2] === "%", unit: (m[2] ?? "").toLowerCase() };
}

/** A hue in degrees from a number or angle token; null when it is not one. */
function hue(token: string): number | null {
  // none is 0.
  if (token === "none") return 0;
  // The number.
  const n = num(token);
  // Not a hue.
  if (!n || n.pct) return null;
  // By unit.
  const deg = n.unit === "grad" ? n.value * 0.9 : n.unit === "rad" ? (n.value * 180) / Math.PI : n.unit === "turn" ? n.value * 360 : n.value;
  // Normalised to 0..360.
  return ((deg % 360) + 360) % 360;
}

/** A component with a percent reference range: pct → value * ref / 100, number as is; none → 0. */
function comp(token: string, ref: number): number | null {
  // none is 0.
  if (token === "none") return 0;
  // The number.
  const n = num(token);
  // Angles are not allowed here.
  if (!n || (n.unit && !n.pct)) return null;
  // Scaled.
  return n.pct ? (n.value * ref) / 100 : n.value;
}

/** An alpha value: number 0..1 or percentage; none → 0; absent → 1. */
function alphaOf(token: string | undefined): number | null {
  // Absent.
  if (token === undefined) return 1;
  // none.
  if (token === "none") return 0;
  // The number.
  const n = num(token);
  // Not an alpha.
  if (!n || (n.unit && !n.pct)) return null;
  // Clamped.
  return Math.min(1, Math.max(0, n.pct ? n.value / 100 : n.value));
}

/** Split functional arguments: legacy commas or modern spaces, with an optional "/ alpha". */
function splitArgs(inner: string): { parts: string[]; alpha?: string; legacy: boolean } {
  // Legacy comma syntax.
  if (inner.includes(",")) {
    // The comma-separated values.
    const parts = inner.split(",").map((s) => s.trim()).filter(Boolean);
    // Three or four.
    return { parts: parts.slice(0, 3), alpha: parts[3], legacy: true };
  }
  // Modern: whitespace, with "/" before alpha.
  const [main, alpha] = inner.split("/").map((s) => s.trim());
  // The parts.
  return { parts: main.split(/\s+/).filter(Boolean), alpha: alpha === undefined ? undefined : alpha, legacy: false };
}

/** Parse one CSS colour string. */
export function parseColor(input: string, which: "foreground" | "background"): ParsedColor {
  // Trimmed.
  const raw = input.trim();
  // Notes.
  const notes: ParsedColor["notes"] = [];
  // Empty.
  if (!raw) throw new ColorParseError(which, "empty", "No colour given.");
  // Lower-cased for keywords and function names.
  const lower = raw.toLowerCase();
  // The results of parsing.
  let srgb: Triple;
  // Alpha.
  let alpha = 1;
  // Syntax.
  let syntax: ColorSyntax;
  // Space.
  let space: string | null = null;
  // transparent.
  if (lower === "transparent") {
    // Transparent black.
    srgb = [0, 0, 0];
    // Alpha 0.
    alpha = 0;
    // Named.
    syntax = "named";
  } else if (NAMED_COLORS.has(lower)) {
    // A named colour: its hex.
    srgb = hexToRgb(NAMED_COLORS.get(lower)!)!.rgb;
    // Named.
    syntax = "named";
  } else if (lower.startsWith("#")) {
    // Hex.
    const h = hexToRgb(lower);
    // Invalid.
    if (!h) throw new ColorParseError(which, "bad-hex", `${raw} is not a hex colour of 3, 4, 6 or 8 digits.`);
    // Components.
    srgb = h.rgb;
    // Alpha.
    alpha = h.alpha;
    // Hex.
    syntax = "hex";
    // A note for short forms.
    if (raw.length === 4 || raw.length === 5) notes.push({ id: "hex-short", params: { expanded: rgbToHex(h.rgb, h.alpha) } });
  } else {
    // A functional notation.
    const m = /^([a-z-]+)\(\s*(.*?)\s*\)$/s.exec(lower);
    // Not one.
    if (!m) throw new ColorParseError(which, "unrecognised", `${raw} is not a colour this tool reads.`);
    // Name and arguments.
    const fn = m[1];
    // Arguments.
    const { parts, alpha: alphaTok, legacy } = splitArgs(m[2]);
    // Legacy syntax note.
    if (legacy) notes.push({ id: "legacy-commas" });
    // Alpha.
    const a = alphaOf(alphaTok);
    // Invalid alpha.
    if (a === null) throw new ColorParseError(which, "bad-alpha", `The alpha value ${alphaTok} is not a number or percentage.`);
    // Keep.
    alpha = a;
    // Three components required (color() names its space first and is checked in its own case).
    if (fn !== "color" && parts.length !== 3) throw new ColorParseError(which, "arity", `${fn}() takes three components; ${parts.length} given.`);
    // By function.
    switch (fn) {
      case "rgb":
      case "rgba": {
        // Numbers 0..255 or percentages.
        const c = parts.map((p) => comp(p, 255));
        // Invalid.
        if (c.some((v) => v === null)) throw new ColorParseError(which, "bad-component", `rgb() components must be numbers or percentages.`);
        // To 0..1, clamped as the specification says (parsed-value time).
        const raw255 = c as number[];
        // Out of range note.
        if (raw255.some((v) => v < 0 || v > 255)) notes.push({ id: "rgb-clamped" });
        // Clamped.
        srgb = raw255.map((v) => Math.min(255, Math.max(0, v)) / 255) as Triple;
        // Syntax.
        syntax = "rgb";
        break;
      }
      case "hsl":
      case "hsla": {
        // Hue, then s and l (percentages or numbers 0..100).
        const h = hue(parts[0]);
        // s, l.
        const s = comp(parts[1], 100);
        // l.
        const l = comp(parts[2], 100);
        // Invalid.
        if (h === null || s === null || l === null) throw new ColorParseError(which, "bad-component", `hsl() takes a hue, then saturation and lightness.`);
        // Clamp s and l to 0..100 (saturation below 0 is clamped per the specification).
        srgb = hslToRgb(h, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, l)));
        // Syntax.
        syntax = "hsl";
        break;
      }
      case "hwb": {
        // Hue, whiteness, blackness.
        const h = hue(parts[0]);
        // w, b.
        const w = comp(parts[1], 100);
        // b.
        const b = comp(parts[2], 100);
        // Invalid.
        if (h === null || w === null || b === null) throw new ColorParseError(which, "bad-component", `hwb() takes a hue, then whiteness and blackness.`);
        // To sRGB.
        srgb = hwbToRgb(h, Math.min(100, Math.max(0, w)), Math.min(100, Math.max(0, b)));
        // Syntax.
        syntax = "hwb";
        break;
      }
      case "lab": {
        // L (0..100), a and b (100% = 125).
        const L = comp(parts[0], 100);
        // a.
        const A = comp(parts[1], 125);
        // b.
        const B = comp(parts[2], 125);
        // Invalid.
        if (L === null || A === null || B === null) throw new ColorParseError(which, "bad-component", `lab() takes L, a and b.`);
        // Through XYZ D50 → D65 → sRGB.
        srgb = xyzToSrgb(mul(M_D50_TO_D65, labToXyzD50([Math.min(100, Math.max(0, L)), A, B])));
        // Syntax.
        syntax = "lab";
        break;
      }
      case "lch": {
        // L, C (100% = 150), H.
        const L = comp(parts[0], 100);
        // C.
        const C = comp(parts[1], 150);
        // H.
        const H = hue(parts[2]);
        // Invalid.
        if (L === null || C === null || H === null) throw new ColorParseError(which, "bad-component", `lch() takes L, C and a hue.`);
        // Through Lab.
        srgb = xyzToSrgb(mul(M_D50_TO_D65, labToXyzD50(toRect([Math.min(100, Math.max(0, L)), Math.max(0, C), H]))));
        // Syntax.
        syntax = "lch";
        break;
      }
      case "oklab": {
        // L (100% = 1), a and b (100% = 0.4).
        const L = comp(parts[0], 1);
        // a.
        const A = comp(parts[1], 0.4);
        // b.
        const B = comp(parts[2], 0.4);
        // Invalid.
        if (L === null || A === null || B === null) throw new ColorParseError(which, "bad-component", `oklab() takes L, a and b.`);
        // Through XYZ D65.
        srgb = xyzToSrgb(oklabToXyz([Math.min(1, Math.max(0, L)), A, B]));
        // Syntax.
        syntax = "oklab";
        break;
      }
      case "oklch": {
        // L, C (100% = 0.4), H.
        const L = comp(parts[0], 1);
        // C.
        const C = comp(parts[1], 0.4);
        // H.
        const H = hue(parts[2]);
        // Invalid.
        if (L === null || C === null || H === null) throw new ColorParseError(which, "bad-component", `oklch() takes L, C and a hue.`);
        // Through OKLab.
        srgb = xyzToSrgb(oklabToXyz(toRect([Math.min(1, Math.max(0, L)), Math.max(0, C), H])));
        // Syntax.
        syntax = "oklch";
        break;
      }
      case "color": {
        // The first part names the space; the three that follow are the components (0..1 or percentages).
        const all = m[2].split("/")[0].trim().split(/\s+/);
        // The space.
        space = all[0];
        // The components.
        const comps = all.slice(1, 4).map((p) => comp(p, 1));
        // Invalid.
        if (comps.length !== 3 || comps.some((v) => v === null)) throw new ColorParseError(which, "bad-component", `color() takes a colour space and three components.`);
        // As numbers.
        const v = comps as Triple;
        // By space.
        if (space === "srgb") srgb = v;
        else if (space === "srgb-linear") srgb = v.map(gamSrgb) as Triple;
        else if (space === "display-p3") srgb = xyzToSrgb(mul(M_LIN_P3_TO_XYZ, v.map(linSrgb) as Triple));
        else if (space === "display-p3-linear") srgb = xyzToSrgb(mul(M_LIN_P3_TO_XYZ, v));
        else if (space === "xyz" || space === "xyz-d65") srgb = xyzToSrgb(v);
        else if (space === "xyz-d50") srgb = xyzToSrgb(mul(M_D50_TO_D65, v));
        else throw new ColorParseError(which, "bad-space", `color(${space}) is not a space this tool converts (srgb, srgb-linear, display-p3, display-p3-linear, xyz, xyz-d50, xyz-d65).`);
        // Syntax.
        syntax = "color";
        break;
      }
      default:
        throw new ColorParseError(which, "unrecognised", `${fn}() is not a colour function this tool reads.`);
    }
  }
  // Gamut: inside 0..1 with a small tolerance for rounding.
  const inGamut = srgb.every((v) => v >= -0.00001 && v <= 1.00001);
  // A note when it is not.
  if (!inGamut) notes.push({ id: "out-of-gamut" });
  // Clipped 0..1.
  const clipped = srgb.map((v) => Math.min(1, Math.max(0, v))) as Triple;
  // 8-bit.
  const rgb255 = clipped.map((v) => Math.round(v * 255)) as Triple;
  // Names for exactly this 8-bit colour.
  const hex6 = rgbToHex(clipped, 1);
  // Names.
  const names = NAMES_BY_HEX.get(hex6.toUpperCase()) ?? [];
  // XYZ for the other notations (from the unclipped colour where the notation can hold it).
  const xyz = srgbToXyz(srgb);
  // Lab via D50.
  const lab = xyzD50ToLab(mul(M_D65_TO_D50, xyz));
  // OKLab.
  const oklab = xyzToOklab(xyz);
  // Polar forms.
  const lch = toPolar(lab, 0.0015);
  // OKLCH.
  const oklch = toPolar(oklab, 0.000004);
  // HSL and HWB from the clipped colour (they describe sRGB).
  const hsl = rgbToHsl(clipped);
  // HWB.
  const hwb = rgbToHwb(clipped);
  // Alpha suffix for the modern notations.
  const al = alpha < 1 ? ` / ${fmt(alpha, 3)}` : "";
  // The formats.
  const formats: ParsedColor["formats"] = {
    hex: rgbToHex(clipped, alpha),
    rgb: `rgb(${rgb255[0]} ${rgb255[1]} ${rgb255[2]}${al})`,
    hsl: `hsl(${hueText(hsl[0])} ${fmt(hsl[1], 2)}% ${fmt(hsl[2], 2)}%${al})`,
    hwb: `hwb(${hueText(hwb[0])} ${fmt(hwb[1], 2)}% ${fmt(hwb[2], 2)}%${al})`,
    lab: `lab(${fmt(lab[0], 3)} ${fmt(lab[1], 3)} ${fmt(lab[2], 3)}${al})`,
    lch: `lch(${fmt(lch[0], 3)} ${fmt(lch[1], 3)} ${hueText(lch[2])}${al})`,
    oklab: `oklab(${fmt(oklab[0], 4)} ${fmt(oklab[1], 4)} ${fmt(oklab[2], 4)}${al})`,
    oklch: `oklch(${fmt(oklch[0], 4)} ${fmt(oklch[1], 4)} ${hueText(oklch[2])}${al})`,
    srgbLinear: `color(srgb-linear ${srgb.map((v) => fmt(linSrgb(v), 5)).join(" ")}${al})`,
    xyzD65: `color(xyz-d65 ${xyz.map((v) => fmt(v, 5)).join(" ")}${al})`,
  };
  // Done.
  return { input: raw, syntax, space, srgb, alpha, inGamut, rgb255, names, formats, luminance: luminance(clipped), notes };
}

/** A hex colour (#rgb, #rgba, #rrggbb, #rrggbbaa) to sRGB 0..1 and alpha; null when malformed. */
function hexToRgb(hex: string): { rgb: Triple; alpha: number } | null {
  // The digits.
  const d = hex.replace(/^#/, "");
  // Hex only.
  if (!/^[0-9a-f]+$/i.test(d)) return null;
  // Expand short forms by replicating each digit.
  const full = d.length === 3 || d.length === 4 ? d.split("").map((c) => c + c).join("") : d;
  // Six or eight digits.
  if (full.length !== 6 && full.length !== 8) return null;
  // Channels.
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  // Done.
  return { rgb: [n(0), n(2), n(4)], alpha: full.length === 8 ? n(6) : 1 };
}

/** sRGB 0..1 (clipped) and alpha to #rrggbb or #rrggbbaa, lower-case. */
export function rgbToHex(rgb: Triple, alpha: number): string {
  // One channel.
  const h = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  // With alpha when below 1.
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}${alpha < 1 ? h(alpha) : ""}`;
}

/** A number with at most n decimals, no trailing zeros, no negative zero. */
function fmt(v: number, n: number): string {
  // Round.
  const r = Number(v.toFixed(n));
  // Text.
  return (Object.is(r, -0) ? 0 : r).toString();
}

/** A hue for display: "none" when powerless, else degrees. */
function hueText(h: number): string {
  // Powerless.
  if (Number.isNaN(h)) return "none";
  // Degrees.
  return fmt(h, 2);
}

// ---------------------------------------------------------------------------
// The engine.
// ---------------------------------------------------------------------------

/** Composite a colour with alpha over an opaque background (simple alpha blending in gamma-encoded sRGB, as browsers paint). */
function composite(fg: Triple, alpha: number, bg: Triple): Triple {
  // Each channel.
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as Triple;
}

/** Find a foreground reaching a target ratio by moving OKLCH lightness, keeping chroma and hue; null when none exists in that direction. */
function fixFor(fg: Triple, bgLum: number, target: number, direction: "lighter" | "darker"): Fix | null {
  // The foreground in OKLCH.
  const [L0, C, H] = toPolar(xyzToOklab(srgbToXyz(fg)), 0.000004);
  // The sRGB for a lightness, chroma reduced until in gamut.
  const srgbAt = (L: number): Triple => {
    // Try the full chroma, then less.
    let c = C;
    // Up to 20 reductions.
    for (let k = 0; k < 24; k++) {
      // The candidate.
      const rgb = xyzToSrgb(oklabToXyz(toRect([L, c, H])));
      // In gamut: done.
      if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return rgb.map((v) => Math.min(1, Math.max(0, v))) as Triple;
      // Less chroma.
      c *= 0.85;
    }
    // Achromatic fallback.
    return xyzToSrgb(oklabToXyz(toRect([L, 0, H]))).map((v) => Math.min(1, Math.max(0, v))) as Triple;
  };
  // The ratio at a lightness.
  const ratioAt = (L: number) => contrastRatio(luminance(srgbAt(L)), bgLum);
  // The far end of the direction.
  const far = direction === "lighter" ? 1 : 0;
  // Nothing reachable even at the extreme.
  if (ratioAt(far) < target) return null;
  // Binary search between the current lightness and the extreme.
  let lo = L0;
  // hi.
  let hi = far;
  // 40 steps are plenty for 8-bit output.
  for (let k = 0; k < 40; k++) {
    // Midpoint.
    const mid = (lo + hi) / 2;
    // Which side reaches the target.
    if (ratioAt(mid) >= target) hi = mid;
    else lo = mid;
  }
  // The colour.
  const rgb = srgbAt(hi);
  // Its 8-bit form, re-measured (rounding to 8 bits can drop below the target by a hair; step once more if so).
  let out = rgb.map((v) => Math.round(v * 255) / 255) as Triple;
  // Nudge until the 8-bit colour reaches the target or the extreme.
  for (let k = 0; k < 8 && contrastRatio(luminance(out), bgLum) < target; k++) {
    // Move lightness a little further.
    hi = direction === "lighter" ? Math.min(1, hi + 0.004) : Math.max(0, hi - 0.004);
    // Recompute.
    out = srgbAt(hi).map((v) => Math.round(v * 255) / 255) as Triple;
  }
  // Still short: no fix.
  const ratio = contrastRatio(luminance(out), bgLum);
  // Not reached.
  if (ratio < target) return null;
  // The OKLCH of the fix.
  const p = toPolar(xyzToOklab(srgbToXyz(out)), 0.000004);
  // Done.
  return { target, hex: rgbToHex(out, 1), oklch: `oklch(${fmt(p[0], 4)} ${fmt(p[1], 4)} ${hueText(p[2])})`, ratio: Math.round(ratio * 100) / 100, direction };
}

/** The engine. */
export function run(input: ColorInput): ColorContrastResult {
  // Both colours.
  const foreground = parseColor(input.foreground ?? "", "foreground");
  // Background.
  const background = parseColor(input.background ?? "", "background");
  // The background as seen: clipped (alpha on a background is composited over nothing here; it is noted by the UI).
  const bgRgb = background.srgb.map((v) => Math.min(1, Math.max(0, v))) as Triple;
  // The foreground as seen: composited over the background when translucent.
  const fgClipped = foreground.srgb.map((v) => Math.min(1, Math.max(0, v))) as Triple;
  // Composite.
  const seen = foreground.alpha < 1 ? composite(fgClipped, foreground.alpha, bgRgb) : fgClipped;
  // The record of the composite.
  const composited = foreground.alpha < 1 ? { rgb255: seen.map((v) => Math.round(v * 255)) as Triple, hex: rgbToHex(seen, 1), luminance: luminance(seen) } : null;
  // Luminances.
  const lf = luminance(seen);
  // Background.
  const lb = luminance(bgRgb);
  // The ratio.
  const ratioRaw = contrastRatio(lf, lb);
  // Two decimals.
  const ratio = Math.round(ratioRaw * 100) / 100;
  // Levels.
  const levels: Levels = { aaNormal: ratioRaw >= 4.5, aaLarge: ratioRaw >= 3, aaaNormal: ratioRaw >= 7, aaaLarge: ratioRaw >= 4.5, nonText: ratioRaw >= 3 };
  // Fixes for failing targets: 3 (when it fails), 4.5, 7.
  const fixes: Fix[] = [];
  // Each target the colours miss.
  for (const target of [3, 4.5, 7]) {
    // Already met.
    if (ratioRaw >= target) continue;
    // Both directions.
    const lighter = fixFor(seen, lb, target, "lighter");
    // Darker.
    const darker = fixFor(seen, lb, target, "darker");
    // Keep both when both exist (the UI shows them), the one that exists otherwise.
    for (const f of [lighter, darker]) if (f) fixes.push(f);
  }
  // Done.
  return {
    foreground, background, composited, ratio, ratioText: `${ratio.toFixed(2)}:1`, levels,
    luminances: { lighter: Math.max(lf, lb), darker: Math.min(lf, lb) }, fixes,
  };
}
