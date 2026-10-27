// ============================================================================
// src/lib/share/cases/code-to-image.ts
// ----------------------------------------------------------------------------
// Share cases of code to image: the masked text, the language and the palette
// go; a masked value never does; an unticked one does, as the popover says.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CODE_TO_IMAGE_SHARE } from "../../tools/code-to-image/share"; // the spec
import { EXAMPLE_FORTIOS, EXAMPLE_OPTIONS } from "../../tools/code-to-image/example"; // the Example (golden vector svg-example's input)

/** The Example with its ENC value as the picture shows it. */
const EXAMPLE_MASKED = EXAMPLE_FORTIOS.replace("Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==", "••••••••"); // the eight bullets
/** Two curl lines with RFC 6750's Bearer token and RFC 7617's Basic credentials (code-to-image's secret vectors). */
const AUTHZ = "curl -H \"Authorization: Bearer mF_9.B5f-4.1JqM\" https://api.example.com/\ncurl -H 'proxy-authorization: basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' http://x/"; // shell

/** The cases. */
export const CODE_TO_IMAGE_SHARE_CASES = defineShareCases(Object.freeze({
  spec: CODE_TO_IMAGE_SHARE, // the spec
  accept: [
    { // the Example, all masked: the ENC value is not in the link
      id: "example", state: { input: EXAMPLE_FORTIOS, options: { ...EXAMPLE_OPTIONS, language: "fortios" as const, palette: "dark" as const } },
      params: { input: EXAMPLE_MASKED, language: "fortios", palette: "dark" }, restored: { input: EXAMPLE_MASKED, language: "fortios" as const, palette: "dark" as const },
      mustNotContain: ["Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ=="], // the value
    },
    { // the light palette and shell: both credentials masked
      id: "authorization-light", state: { input: AUTHZ, options: { language: "shell" as const, palette: "light" as const } },
      params: { input: AUTHZ.replace("mF_9.B5f-4.1JqM", "••••••••").replace("QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "••••••••"), language: "shell", palette: "light" },
      restored: { input: AUTHZ.replace("mF_9.B5f-4.1JqM", "••••••••").replace("QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "••••••••"), language: "shell" as const, palette: "light" as const },
      mustNotContain: ["mF_9.B5f-4.1JqM", "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="], // the two values
    },
    { // the reader unticked the Example's finding: its value goes, and the popover names it first
      id: "example-unticked", state: { input: EXAMPLE_FORTIOS, options: { ...EXAMPLE_OPTIONS, language: "fortios" as const, palette: "dark" as const, unmask: ["fortios-enc@7:27"] } },
      params: { input: EXAMPLE_FORTIOS, language: "fortios", palette: "dark" }, restored: { input: EXAMPLE_FORTIOS, language: "fortios" as const, palette: "dark" as const },
    },
  ],
  arrive: [
    { id: "defaults", values: { input: "show version", language: null, palette: null }, restored: { input: "show version", language: "plain" as const, palette: "dark" as const } }, // absent options default
  ],
  empty: [
    { id: "white-space", state: { input: " \n ", options: { language: "plain" as const, palette: "dark" as const } } }, // no picture
    { id: "refused-title", state: { input: "x", options: { language: "plain" as const, palette: "dark" as const, title: "t".repeat(81) } } }, // a refused picture
  ],
  reject: [
    { id: "unknown-language", values: { input: "x", language: "cobol", palette: "dark" } }, // not offered
    { id: "unknown-palette", values: { input: "x", language: "plain", palette: "neon" } }, // not offered
    { id: "palette-prototype-name", values: { input: "x", language: "plain", palette: "toString" } }, // not an own key of the palettes
    { id: "no-text", values: { input: "", language: "plain", palette: "dark" } }, // nothing to fill
  ],
}));
