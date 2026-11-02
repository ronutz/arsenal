// ============================================================================
// src/lib/share/cases/fortios-flow-debug-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiOS debug flow builder (input-caution, a form): every
// field always (an empty text field is left out of the link and an arrival
// empties it), switches as 1 or 0; a form without a filter has nothing to
// share; a switch other than 1 or 0, or a link without a filter, is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIOS_FLOW_DEBUG_SHARE, type FlowDebugShareState } from "../../tools/fortios-flow-debug-builder/share"; // the spec

/** The page's empty form (verbatim from the component's EMPTY). */
const EMPTY = { addr: "", saddr: "", daddr: "", port: "", sport: "", dport: "", proto: "", vdom: "", count: "100" }; // the opening form
/** The page's Example (verbatim from the component's EXAMPLE). */
const EXAMPLE = { ...EMPTY, addr: "10.1.1.5", dport: "443", proto: "tcp", count: "50" }; // as the component holds it
/** A narrower trace in a VDOM with both switches on and the count cleared. */
const VDOM = { ...EMPTY, saddr: "10.1.1.5", daddr: "203.0.113.10", dport: "8443", proto: "6", vdom: "customer-a", count: "" }; // as typed

/** The cases. */
export const FORTIOS_FLOW_DEBUG_BUILDER_SHARE_CASES = defineShareCases<FlowDebugShareState, FlowDebugShareState>({
  spec: FORTIOS_FLOW_DEBUG_SHARE, // the spec
  accept: [
    { id: "example", state: { fields: EXAMPLE, iprope: false, timestamp: false }, params: { ...EXAMPLE, iprope: "0", timestamp: "0" }, restored: { fields: EXAMPLE, iprope: false, timestamp: false } }, // every field, switches off
    { id: "vdom-switches-on", state: { fields: VDOM, iprope: true, timestamp: true }, params: { ...VDOM, iprope: "1", timestamp: "1" }, restored: { fields: VDOM, iprope: true, timestamp: true } }, // the cleared count stays cleared
  ],
  arrive: [
    { id: "switches-absent", values: { addr: "10.1.1.5", saddr: null, daddr: null, port: null, sport: null, dport: null, proto: null, vdom: null, count: null, iprope: null, timestamp: null }, restored: { fields: { ...EMPTY, addr: "10.1.1.5", count: "" }, iprope: false, timestamp: false } }, // absent fields empty, switches off
  ],
  empty: [
    { id: "opening-form", state: { fields: EMPTY, iprope: false, timestamp: false } }, // no filter: the page asks for one
    { id: "vdom-and-count-only", state: { fields: { ...EMPTY, vdom: "root", count: "10" }, iprope: true, timestamp: false } }, // neither is a filter
  ],
  reject: [
    { id: "nothing", values: { addr: null, saddr: null, daddr: null, port: null, sport: null, dport: null, proto: null, vdom: null, count: null, iprope: null, timestamp: null } }, // no value at all
    { id: "no-filter", values: { addr: null, saddr: null, daddr: null, port: null, sport: null, dport: null, proto: null, vdom: "root", count: "10", iprope: "0", timestamp: "0" } }, // never built
    { id: "bad-switch", values: { addr: "10.1.1.5", saddr: null, daddr: null, port: null, sport: null, dport: null, proto: null, vdom: null, count: null, iprope: "yes", timestamp: "0" } }, // a switch other than 1 or 0
  ],
});
