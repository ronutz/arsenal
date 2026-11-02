// ============================================================================
// src/lib/tools/sse-architecture-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the SSE single-pass architecture explainer
// (posture "input", as the inventory gives it; the manifest declares no
// shareSafetyDefault). A form with nothing to paste (ROLLOUT 11.3): the
// request described by two choices and four yes/no answers, which name no
// system or person. A link carries every field, always, so an old link keeps
// its meaning if a default changes (2026-11-01, wave 4B).
//
// Names: `destination` (web, sanctioned-saas, unsanctioned-saas, private-app,
// non-web-port), `steering` (client, ipsec, gre, proxy-chain, dns), and
// `managed`, `tls`, `decrypt`, `payload` (1 or 0). A missing field, an unknown
// choice or another value makes the link malformed.
//
// Arrival: the fields are set as if picked; the pass follows.
// ============================================================================

import type { Destination, RequestShape, Steering } from "./compute"; // the form's state
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The destinations, by their stable ids (as the page offers them). */
export const SSE_DESTINATIONS: readonly Destination[] = Object.freeze(["web", "sanctioned-saas", "unsanctioned-saas", "private-app", "non-web-port"]); // the select
/** The steering methods, by their stable ids (as the page offers them). */
export const SSE_STEERINGS: readonly Steering[] = Object.freeze(["client", "ipsec", "gre", "proxy-chain", "dns"]); // the select

/** Each yes/no answer's link name and the field it fills. */
const FLAGS: readonly (readonly [string, "managedDevice" | "tls" | "decrypt" | "hasPayload"])[] = Object.freeze([
  ["managed", "managedDevice"], // the endpoint is managed
  ["tls", "tls"], // the flow is TLS
  ["decrypt", "decrypt"], // decryption is permitted
  ["payload", "hasPayload"], // a payload worth inspecting
] as const); // FLAGS

/** The spec. */
export const SSE_SHARE: ShareSpec<RequestShape> = Object.freeze({
  tool: "sse-architecture-explainer", // the slug
  posture: "input", // choices only
  carriesKey: "share.carries", // tools.sse-architecture-explainer.share.carries
  names: ["destination", "steering", ...FLAGS.map(([n]) => n)], // a form: no input
  /** Every field, always (the page always shows a pass). */
  encode(r: RequestShape): ShareEncoding {
    const params: Record<string, string> = { destination: r.destination, steering: r.steering }; // the two choices
    for (const [n, k] of FLAGS) params[n] = r[k] ? "1" : "0"; // each answer
    return { ok: true, params }; // all six
  },
  /** Every field: known choices, and each answer 1 or 0. */
  decode(v: Readonly<Record<string, string | null>>): RequestShape | null {
    if (!(SSE_DESTINATIONS as readonly string[]).includes(v.destination ?? "") || !(SSE_STEERINGS as readonly string[]).includes(v.steering ?? "")) return null; // unknown or missing choice
    const out = { destination: v.destination as Destination, steering: v.steering as Steering } as RequestShape; // the choices
    for (const [n, k] of FLAGS) { const x = v[n]; if (x !== "1" && x !== "0") return null; out[k] = x === "1"; } // each answer, or malformed
    return out; // all six
  },
});
