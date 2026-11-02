// ============================================================================
// src/lib/share/cases/uuid.ts
// ----------------------------------------------------------------------------
// Share cases of the UUID tool: the Inspect box goes as typed; the generated
// list is never part of the state, so it cannot be in a link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { UUID_SHARE, type UuidShareState } from "../../tools/uuid/share"; // the spec

/** The page's Example (a version 4 UUID, verbatim from the page and its golden vectors). */
const EXAMPLE = "550e8400-e29b-41d4-a716-446655440000"; // verbatim from the page
/** A version 7 UUID, whose timestamp the page reads. */
const V7 = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f"; // RFC 9562 Appendix A.6 (read 2026-11-01), in lower case

/** The cases. */
export const UUID_SHARE_CASES = defineShareCases<UuidShareState, UuidShareState>({
  spec: UUID_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "v7", state: { input: V7 }, params: { input: V7 }, restored: { input: V7 } }, // a v7 with its timestamp
    { id: "not-a-uuid", state: { input: "not-a-uuid" }, params: { input: "not-a-uuid" }, restored: { input: "not-a-uuid" } }, // the page reads it as Invalid, as typed
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "spaces", state: { input: "   " } }, // white space
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
