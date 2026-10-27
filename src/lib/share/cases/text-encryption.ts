// ============================================================================
// src/lib/share/cases/text-encryption.ts
// ----------------------------------------------------------------------------
// Share cases of local text encryption. The proof PRIME asked for lives here:
// for every round-trip golden vector (and the Example), the link carries the
// encrypted string and neither the passphrase nor the plaintext appears in
// it, as typed, percent-encoded, form-encoded or decoded.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TEXT_ENCRYPTION_SHARE } from "../../tools/text-encryption/share"; // the spec
import { ROUND_TRIP_VECTORS, EXAMPLE_ENCRYPTED, EXAMPLE_PASSPHRASE, EXAMPLE_TEXT, WRAPPED_INPUT } from "../../tools/text-encryption/golden-vectors"; // the tool's own vectors

/** The cases. */
export const TEXT_ENCRYPTION_SHARE_CASES = defineShareCases(Object.freeze({
  spec: TEXT_ENCRYPTION_SHARE, // the spec
  accept: [
    // Every round trip: the string goes, the string comes back, and the passphrase and the text are nowhere in the link.
    ...ROUND_TRIP_VECTORS.map((v) => ({ id: `round-trip-${v.id}`, state: { encrypted: v.output }, params: { input: v.output }, restored: { encrypted: v.output }, mustNotContain: [v.passphrase, v.text] })), // seven
    // The Example, named on its own: "Password" and the lab note never travel.
    { id: "example", state: { encrypted: EXAMPLE_ENCRYPTED }, params: { input: EXAMPLE_ENCRYPTED }, restored: { encrypted: EXAMPLE_ENCRYPTED }, mustNotContain: [EXAMPLE_PASSPHRASE, EXAMPLE_TEXT] },
    // A wrapped string (as an e-mail client leaves it) is shared compact.
    { id: "wrapped", state: { encrypted: WRAPPED_INPUT }, params: { input: ROUND_TRIP_VECTORS[1].output }, restored: { encrypted: ROUND_TRIP_VECTORS[1].output }, mustNotContain: ["passwd", "hello"] },
  ],
  empty: [
    { id: "nothing", state: { encrypted: "" } }, // no string yet
    { id: "plaintext-is-never-a-share", state: { encrypted: EXAMPLE_TEXT } }, // a plaintext in the state gives nothing
    { id: "passphrase-is-never-a-share", state: { encrypted: EXAMPLE_PASSPHRASE } }, // nor does a passphrase
  ],
  reject: [
    { id: "plaintext-arrival", values: { input: EXAMPLE_TEXT } }, // a text is not opened as a string
    { id: "passphrase-arrival", values: { input: EXAMPLE_PASSPHRASE } }, // nor a passphrase
    { id: "version-2", values: { input: EXAMPLE_ENCRYPTED.replace("aesgcm1.", "aesgcm2.") } }, // another format
    { id: "truncated", values: { input: EXAMPLE_ENCRYPTED.split(".").slice(0, 3).join(".") } }, // three fields
    { id: "six-fields", values: { input: `${EXAMPLE_ENCRYPTED}.Password` } }, // a passphrase appended is not a string of this format
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
