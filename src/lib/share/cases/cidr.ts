// ============================================================================
// src/lib/share/cases/cidr.ts
// ----------------------------------------------------------------------------
// Share cases of the CIDR calculator: the Subnet block goes alone, as the
// #input= handoff the home page's quick box already uses (usePrefill reads it;
// the runner checks that readHandoff reads the same value).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CIDR_SHARE } from "../../tools/cidr/share"; // the spec

/** The cases. */
export const CIDR_SHARE_CASES = defineShareCases(Object.freeze({
  spec: CIDR_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "192.168.1.0/24" }, params: { input: "192.168.1.0/24" }, restored: { input: "192.168.1.0/24" } }, // the page's Example
    { id: "rfc3021", state: { input: "10.10.1.1/31" }, params: { input: "10.10.1.1/31" }, restored: { input: "10.10.1.1/31" } }, // a /31 (RFC 3021)
    { id: "host-bits-set", state: { input: "203.0.113.77/26" }, params: { input: "203.0.113.77/26" }, restored: { input: "203.0.113.77/26" } }, // an address inside its block, as typed
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // no block
    { id: "white-space", state: { input: " " } }, // only a space
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
