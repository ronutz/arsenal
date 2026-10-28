// ============================================================================
// src/lib/tools/f5-irules-event-order/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRule event-order explainer (posture
// "input"): the page is a form of five switches (the profile stack on the
// virtual server), so a link carries the five switches by name, each as 1 or
// 0, and nothing else (ROLLOUT section 11.3: a form with nothing to paste
// shares named values only, with no "input"):
//
//   clientssl  the client-SSL profile
//   http       the HTTP profile
//   serverssl  the server-SSL profile
//   pool       a pool (load balancing)
//   fastl4     FastL4 (packet fast path) instead of a Standard virtual server
//
// All five always go, so a stack with every switch off is a link too (the
// plan still has CLIENT_ACCEPTED and CLIENT_CLOSED). Profile switches are not
// sensitive: they name no host, pool or address.
//
// Arrival: the switches take the link's values (one the link does not carry
// is off), and the plan is drawn, as clicking them would. A value other than
// 1 or 0 makes the whole share malformed: ignored, never half applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import type { VirtualConfig } from "./compute"; // the five switches

/** The switches by their link names, in the order the page lists them. */
const SWITCHES: readonly (readonly [string, keyof VirtualConfig])[] = [["clientssl", "clientSsl"], ["http", "http"], ["serverssl", "serverSsl"], ["pool", "pool"], ["fastl4", "fastL4"]]; // name, field

/** The spec: the state is the page's own VirtualConfig. */
export const IRULES_EVENT_ORDER_SHARE: ShareSpec<VirtualConfig> = Object.freeze({
  tool: "f5-irules-event-order", // the slug
  posture: "input", // the switches as set
  carriesKey: "share.carries", // tools.f5-irules-event-order.share.carries
  names: SWITCHES.map(([n]) => n), // clientssl, http, serverssl, pool, fastl4
  /** The five switches, each as 1 or 0 (there is always a plan, so always a link). */
  encode(c: VirtualConfig): ShareEncoding {
    return { ok: true, params: Object.fromEntries(SWITCHES.map(([n, f]) => [n, c[f] ? "1" : "0"])) } as const; // all five
  },
  /** Each switch present must be 1 or 0; an absent one is off. */
  decode(v: Readonly<Record<string, string | null>>): VirtualConfig | null {
    const out: VirtualConfig = { fastL4: false, clientSsl: false, http: false, serverSsl: false, pool: false }; // every switch off
    for (const [n, f] of SWITCHES) { // each switch
      const x = v[n]; // its value, or null
      if (x === null || x === undefined) continue; // not carried: off
      if (x !== "1" && x !== "0") return null; // anything else: malformed
      out[f] = x === "1"; // on or off
    } // for
    return out; // the stack
  },
});
