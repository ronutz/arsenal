// ============================================================================
// src/lib/share/cases/sse-architecture-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the SSE single-pass architecture explainer (2026-11-01, wave
// 4B): a form; every field goes, always; a missing field, an unknown choice or
// another value is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SSE_SHARE } from "../../tools/sse-architecture-explainer/share"; // the spec
import type { RequestShape } from "../../tools/sse-architecture-explainer/compute"; // the state

/** The page's opening request. */
const DEFAULTS: RequestShape = { destination: "web", steering: "client", managedDevice: true, tls: true, decrypt: true, hasPayload: true }; // as the component holds it
/** The page's Example. */
const EXAMPLE: RequestShape = { destination: "unsanctioned-saas", steering: "client", managedDevice: false, tls: true, decrypt: true, hasPayload: true }; // as the component holds it
/** The defaults as a link writes them. */
const DEFAULT_PARAMS = { destination: "web", steering: "client", managed: "1", tls: "1", decrypt: "1", payload: "1" }; // every field

/** The cases. */
export const SSE_ARCHITECTURE_SHARE_CASES = defineShareCases<RequestShape, RequestShape>({
  spec: SSE_SHARE, // the spec
  accept: [
    { id: "defaults", state: DEFAULTS, params: DEFAULT_PARAMS, restored: DEFAULTS }, // the page as it opens: every field written
    { id: "example", state: EXAMPLE, params: { destination: "unsanctioned-saas", steering: "client", managed: "0", tls: "1", decrypt: "1", payload: "1" }, restored: EXAMPLE }, // the Example
    { id: "private-app-gre", state: { destination: "private-app", steering: "gre", managedDevice: true, tls: false, decrypt: false, hasPayload: false }, params: { destination: "private-app", steering: "gre", managed: "1", tls: "0", decrypt: "0", payload: "0" }, restored: { destination: "private-app", steering: "gre", managedDevice: true, tls: false, decrypt: false, hasPayload: false } }, // other choices
  ],
  empty: [],
  blocked: [],
  reject: [
    { id: "unknown-destination", values: { ...DEFAULT_PARAMS, destination: "intranet" } }, // not a choice
    { id: "unknown-steering", values: { ...DEFAULT_PARAMS, steering: "pac" } }, // not a choice
    { id: "missing-flag", values: { ...DEFAULT_PARAMS, decrypt: null } }, // every field is written
    { id: "bad-flag", values: { ...DEFAULT_PARAMS, tls: "true" } }, // 1 or 0 only
  ],
});
