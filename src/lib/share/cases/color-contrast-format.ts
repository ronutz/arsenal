// ============================================================================
// src/lib/share/cases/color-contrast-format.ts
// ----------------------------------------------------------------------------
// Share cases of the colour contrast & format tool: the two colours go as
// typed, by the fields' names; a share with one of them missing is ignored.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { COLOR_CONTRAST_SHARE, type ColorContrastShareState } from "../../tools/color-contrast-format/share"; // the spec and its state
import { VECTORS } from "../../tools/color-contrast-format/golden-vectors"; // the page's Example is a vector

/** The page's Example (ColorContrastFormatTool's EXAMPLE_ID). */
const EXAMPLE = VECTORS.find((v) => v.id === "gray-on-white")!.input; // verbatim

/** The cases. */
export const COLOR_CONTRAST_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<ColorContrastShareState, ColorContrastShareState>>({ // typed, so the cases check as one list
  spec: COLOR_CONTRAST_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { foreground: EXAMPLE.foreground, background: EXAMPLE.background }, params: { foreground: EXAMPLE.foreground, background: EXAMPLE.background }, restored: { foreground: EXAMPLE.foreground, background: EXAMPLE.background } }, // a "#" in a value
    { id: "oklch-and-hex", state: { foreground: "oklch(70% 0.1 200)", background: "#1a1a1a" }, params: { foreground: "oklch(70% 0.1 200)", background: "#1a1a1a" }, restored: { foreground: "oklch(70% 0.1 200)", background: "#1a1a1a" } }, // "%" and spaces
    { id: "alpha-and-name", state: { foreground: "rgb(0 0 0 / 50%)", background: "white" }, params: { foreground: "rgb(0 0 0 / 50%)", background: "white" }, restored: { foreground: "rgb(0 0 0 / 50%)", background: "white" } }, // "/" and a named colour
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { foreground: "", background: "" } }, // after Clear
    { id: "no-background", state: { foreground: "#000", background: "" } }, // half a pair
    { id: "no-foreground", state: { foreground: " ", background: "#fff" } }, // half a pair
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { foreground: null, background: null } }, // nothing
    { id: "no-background", values: { foreground: "#000", background: null } }, // half a pair
    { id: "no-foreground", values: { foreground: null, background: "#fff" } }, // half a pair
    { id: "blank-foreground", values: { foreground: "  ", background: "#fff" } }, // blanks only
  ],
}));
