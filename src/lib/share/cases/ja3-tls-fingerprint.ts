// ============================================================================
// src/lib/share/cases/ja3-tls-fingerprint.ts
// ----------------------------------------------------------------------------
// Share cases of the JA3 / JA3N fingerprint (wave 4C, 2026-11-01): the link
// carries the string as the engine reads it (each field's integer pieces as
// written, GREASE included); text the engine skips stays out. Strings are
// Salesforce's published examples (the tool's golden vectors) and variants.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { JA3_SHARE, type Ja3ShareState } from "../../tools/ja3-tls-fingerprint/share"; // the spec

/** Salesforce's first published example (the page's Example). */
const SF1 = "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0"; // verbatim
/** Salesforce's second, with empty fields. */
const SF2 = "769,4-5-10-9-100-98-3-6-19-18-99,,,"; // verbatim
/** SF1 with GREASE (2570 = 0x0a0a) in ciphers and extensions, as the tool's GREASE vector. */
const SF1_GREASE = "769,2570-47-53-5-10-49161-49162-49171-49172-50-56-19-4,2570-0-10-11,23-24-25,0"; // verbatim

/** The cases. */
export const JA3_SHARE_CASES = defineShareCases<Ja3ShareState, Ja3ShareState>({
  spec: JA3_SHARE, // the spec
  accept: [
    { id: "example", state: { input: SF1 }, params: { input: SF1 }, restored: { input: SF1 } }, // nothing to drop: the copy is the box
    { id: "empty-fields", state: { input: SF2 }, params: { input: SF2 }, restored: { input: SF2 } }, // empty fields stay empty
    { id: "grease-kept", state: { input: SF1_GREASE }, params: { input: SF1_GREASE }, restored: { input: SF1_GREASE } }, // GREASE values go: the page flags them
    { id: "text-the-engine-skips", state: { input: "  771,4865-4866-note:token-to-skip-4867, 0-10 ,29-23,0\n" }, params: { input: "771,4865-4866-4867,0-10,29-23,0" }, restored: { input: "771,4865-4866-4867,0-10,29-23,0" }, mustNotContain: ["note:token", "to-skip"] }, // blanks and non-numbers the reading ignores stay out
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "four-fields", state: { input: "771,4865,0,29" } }, // the engine refuses it
    { id: "version-not-a-number", state: { input: "tls12,4865,0,29,0" } }, // the engine refuses it
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "not-ja3", values: { input: "hello" } }, // the engine refuses it
    { id: "not-the-copy", values: { input: "771, 4865-4866,0,29,0" } }, // a blank the encoder would have dropped
    { id: "junk-piece", values: { input: "771,4865-abc,0,29,0" } }, // a piece the encoder would have dropped
  ],
});
