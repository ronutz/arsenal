// ============================================================================
// src/lib/share/cases/f5-irules-event-order.ts
// ----------------------------------------------------------------------------
// Share cases of the iRule event-order explainer: the five profile switches go
// by name, each as 1 or 0; an absent switch is off, and any other value makes
// the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_EVENT_ORDER_SHARE } from "../../tools/f5-irules-event-order/share"; // the spec
import type { VirtualConfig } from "../../tools/f5-irules-event-order/compute"; // its state

/** Every switch off. */
const OFF: VirtualConfig = { fastL4: false, clientSsl: false, http: false, serverSsl: false, pool: false }; // the Clear button's stack

/** The cases. */
export const IRULES_EVENT_ORDER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<VirtualConfig, VirtualConfig>>({ // typed, so the cases check as one list
  spec: IRULES_EVENT_ORDER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "https-example", state: { ...OFF, clientSsl: true, http: true, serverSsl: true, pool: true }, params: { clientssl: "1", http: "1", serverssl: "1", pool: "1", fastl4: "0" }, restored: { ...OFF, clientSsl: true, http: true, serverSsl: true, pool: true } }, // the page's Example (the HTTPS preset)
    { id: "all-off", state: OFF, params: { clientssl: "0", http: "0", serverssl: "0", pool: "0", fastl4: "0" }, restored: OFF }, // after Clear: still a plan, so still a link
    { id: "fastl4-pool", state: { ...OFF, fastL4: true, pool: true }, params: { clientssl: "0", http: "0", serverssl: "0", pool: "1", fastl4: "1" }, restored: { ...OFF, fastL4: true, pool: true } }, // a FastL4 virtual server with a pool
  ],
  arrive: [ // decode only
    { id: "only-http", values: { http: "1" }, restored: { ...OFF, http: true } }, // absent switches are off
    { id: "explicit-zeros", values: { clientssl: "0", http: "1", serverssl: null, pool: "1", fastl4: null }, restored: { ...OFF, http: true, pool: true } }, // 0 and absent alike
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "word", values: { clientssl: "yes" } }, // not 1 or 0
    { id: "two", values: { http: "1", fastl4: "2" } }, // not 1 or 0
    { id: "empty", values: { pool: "" } }, // nothing
    { id: "true", values: { serverssl: "true" } }, // not the switch form
  ],
}));
