// ============================================================================
// src/lib/tools/color-contrast-format/index.ts
// ----------------------------------------------------------------------------
// COLOR CONTRAST & FORMAT: the self-describing {manifest, run, vectors} triple.
//
// Two colours in any CSS Color Level 4 notation; out come the WCAG contrast
// ratio with pass or fail at every level, each colour in every notation with
// its relative luminance, and the nearest foreground that would pass each
// failing level. The arithmetic is WCAG 2.2's and the conversions are the
// specification's own sample code. Local and deterministic.
// ============================================================================

import { run as compute, type ColorInput, type ColorContrastResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { ColorInput, ColorContrastResult, ParsedColor, Levels, Fix, ColorSyntax, Triple } from "./compute";
// The refusal class, so the UI can tell which side failed.
export { ColorParseError, parseColor, luminance, contrastRatio, rgbToHex } from "./compute";
// The named colours, for pages that list them.
export { NAMED_COLORS, NAMED_COLORS_READ_DATE } from "./named-colors";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Web front-end & CSS",
  // The slug.
  toolSlug: "color-contrast-format",
  // Other names it answers to.
  canonicalAliases: ["contrast-checker", "wcag-contrast", "color-converter", "colour-contrast", "oklch-converter"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^(#[0-9a-fA-F]{3,8}|(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\()", example: "{\"foreground\":\"#767676\",\"background\":\"white\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: two short strings, parsed by grammar, nothing evaluated.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // The default for share links: colours carry nothing private.
  shareSafetyDefault: "safe",
  // The Learn articles written for it.
  learnLinks: ["learn/colour-contrast-wcag-and-css-color-notations"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["url-inspector", "http-message-decoder", "secure-headers"],
  // Sources, each read live on its access date.
  sources: [
    // WCAG 2.2: the formulas and the criteria.
    { id: "wcag22", label: "WCAG 2.2, W3C Recommendation 12 December 2024: relative luminance, contrast ratio, Success Criteria 1.4.3, 1.4.6 and 1.4.11, large-scale text", type: "standard", url: "https://www.w3.org/TR/WCAG22/", access_date: "2026-10-05", scope: "the sRGB linearisation with the 0.04045 threshold and the 0.2126 / 0.7152 / 0.0722 weights; the ratio (L1 + 0.05) / (L2 + 0.05) running from 1 to 21; 4.5:1 and 3:1 (AA), 7:1 and 4.5:1 (AAA), 3:1 for user interface components and graphical objects; large-scale text at 18 point or 14 point bold", status: "active" },
    // CSS Color Level 4: notations, reference ranges, named colours.
    { id: "css-color-4", label: "CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026: notations, percentage reference ranges, the 148 named colours", type: "standard", url: "https://www.w3.org/TR/css-color-4/", access_date: "2026-10-05", scope: "hex of 3, 4, 6 or 8 digits; rgb() with 100% = 255; hsl() and hwb() with S, L, W and B at 100% = 100; lab() a and b at 100% = 125 and lch() C at 100% = 150; oklab() a and b at 100% = 0.4 and oklch() C at 100% = 0.4; color() spaces; none as zero; transparent as transparent black; the named-colour table", status: "active" },
    // The specification's sample code, from its repository.
    { id: "css-color-4-code", label: "CSS Color Level 4 sample code (csswg-drafts repository: conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js)", type: "implementation", url: "https://github.com/w3c/csswg-drafts/tree/main/css-color-4", access_date: "2026-10-05", scope: "the sRGB transfer function, the rational sRGB-XYZ and display-p3-XYZ matrices, Bradford D65-D50 adaptation, CIE Lab with the rational constants, the OKLab matrices, polar conversions with the powerless-hue thresholds, and the HSL and HWB algorithms, transcribed into the engine", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ColorInput): ColorContrastResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
