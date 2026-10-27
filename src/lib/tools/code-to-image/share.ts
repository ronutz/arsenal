// ============================================================================
// src/lib/tools/code-to-image/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of code to image (posture "derived"): a link
// carries the text as the picture shows it, every masked finding replaced by
// the same eight bullets (shareableCode in compute.ts), plus the highlighting
// language and the palette, which decide what the picture looks like and are
// not sensitive. A finding the reader unticked is in the link with its value,
// and the popover names it first. Not carried: the window title (free text
// the secrets check does not read), the highlighted lines, the font size, the
// padding, the tab stops, the frame and line-number switches; the receiving
// page uses its own defaults for those.
//
// Arrival: the text fills the code box as a paste would, and the picture is
// drawn; a finding that arrives already masked is found again by the check and
// masked again (unticking it shows the same bullets: the value is not in the
// link). A language or palette that is not one the tool offers makes the whole
// share malformed: ignored, never half applied.
// ============================================================================

import { shareableCode, type CodeImageOptions, type CodeImageResult } from "./compute"; // the derived form
import { LANGUAGES, type LanguageId } from "./languages"; // the offered languages
import { PALETTES, type PaletteId } from "./render"; // the offered palettes
import type { ShareSpec } from "../../share/spec"; // the spec shape

/** What the page encodes: the paste and the picture's options (unmask included). */
export interface CodeToImageShareInput {
  /** The text as pasted. */
  input: string;
  /** The options the picture uses. */
  options: Partial<CodeImageOptions> & { language: LanguageId; palette: PaletteId };
  /** The picture already drawn from the same input and options, if the caller has it (saves a second render). */
  rendered?: CodeImageResult;
}

/** What an arrival restores: the text and two of the picture's choices. */
export interface CodeToImageShareState {
  /** The text (already masked where the sender's picture masked it). */
  input: string;
  /** The highlighting language. */
  language: LanguageId;
  /** The palette. */
  palette: PaletteId;
}

/** The spec. */
export const CODE_TO_IMAGE_SHARE: ShareSpec<CodeToImageShareInput, CodeToImageShareState> = Object.freeze({
  tool: "code-to-image", // the slug
  posture: "derived", // the masked text, never the paste as typed
  carriesKey: "share.carries", // tools.code-to-image.share.carries
  names: ["input", "language", "palette"], // #input=...&language=...&palette=...
  /** The masked text with the language and palette, when there is a picture. */
  encode(state: CodeToImageShareInput) {
    const s = shareableCode(state.input, state.options, state.rendered); // the same masking as the picture
    if (!s.ok) return { ok: false, reason: "empty" } as const; // no picture, nothing to share
    return { ok: true, params: { input: s.text, language: state.options.language, palette: state.options.palette } } as const; // three values
  },
  /** The text with an offered language and palette (each defaulting when absent, refused when unknown). */
  decode(values: Readonly<Record<string, string | null>>) {
    const input = values.input; // the text
    if (!input) return null; // nothing to fill
    const language = (values.language ?? "plain") as LanguageId; // absent: plain text
    const palette = (values.palette ?? "dark") as PaletteId; // absent: the default palette
    if (!LANGUAGES.includes(language)) return null; // not an offered language: malformed
    if (!Object.prototype.hasOwnProperty.call(PALETTES, palette)) return null; // not an offered palette: malformed
    return { input, language, palette }; // the state to fill
  },
});
