// ============================================================================
// src/lib/share/cases/ja4-fingerprint-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the JA4 / JA3 fingerprint decoder: the box goes as pasted,
// alone.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { JA4_FINGERPRINT_SHARE } from "../../tools/ja4-fingerprint-decoder/share"; // the spec

/** A JA3 field string: version, ciphers, extensions, curves, point formats ("," and "-" inside, "," between). */
const JA3 = "771,4865-4866-4867-49195-49199,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0"; // a TLS 1.2 ClientHello's fields

/** The cases. */
export const JA4_FINGERPRINT_SHARE_CASES = defineShareCases(Object.freeze({
  spec: JA4_FINGERPRINT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "t13d1516h2_8daaf6152771_e5627efa2ab1" }, params: { input: "t13d1516h2_8daaf6152771_e5627efa2ab1" }, restored: { input: "t13d1516h2_8daaf6152771_e5627efa2ab1" } }, // the page's Example (FoxIO's worked example)
    { id: "ja3-fields", state: { input: JA3 }, params: { input: JA3 }, restored: { input: JA3 } }, // a JA3 string
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\n" } }, // only a line break
  ],
}));
