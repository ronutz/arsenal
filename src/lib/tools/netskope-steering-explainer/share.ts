// ============================================================================
// src/lib/tools/netskope-steering-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Netskope steering-method explainer (posture
// "input", as the inventory gives it; the manifest declares no
// shareSafetyDefault). A form with nothing to paste (ROLLOUT 11.3): seven
// yes/no answers about the situation, which name no system or person. A link
// carries every answer, always, as 1 or 0, so an old link keeps its meaning if
// a default changes (2026-11-01, wave 4B).
//
// Names (the answers as the form words them): `managed`, `onpremises`,
// `cert`, `identity`, `privateapps`, `nonwebports`, `proxy`. A missing answer
// or a value other than 1 or 0 makes the link malformed.
//
// Arrival: the boxes are ticked as if clicked; the methods follow.
// ============================================================================

import type { Situation } from "./compute"; // the form's state
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** Each answer's link name and the field it fills, in the form's order. */
const FIELDS: readonly (readonly [string, keyof Situation])[] = Object.freeze([
  ["managed", "managedDevice"], // the device is managed
  ["onpremises", "onPremises"], // on a corporate site
  ["cert", "canInstallCert"], // the certificate bundle can be installed
  ["identity", "needUserIdentity"], // policy names the user
  ["privateapps", "needPrivateApps"], // private application access
  ["nonwebports", "needNonWebPorts"], // ports beyond 80 and 443
  ["proxy", "existingProxy"], // an existing proxy stays
] as const); // FIELDS

/** The spec. */
export const STEERING_METHOD_SHARE: ShareSpec<Situation> = Object.freeze({
  tool: "netskope-steering-explainer", // the slug
  posture: "input", // yes/no answers only
  carriesKey: "share.carries", // tools.netskope-steering-explainer.share.carries
  names: FIELDS.map(([n]) => n), // a form: no input
  /** Every answer, always (the page always shows methods). */
  encode(s: Situation): ShareEncoding {
    const params: Record<string, string> = {}; // the values
    for (const [n, k] of FIELDS) params[n] = s[k] ? "1" : "0"; // each answer
    return { ok: true, params }; // all seven
  },
  /** Every answer, each 1 or 0. */
  decode(v: Readonly<Record<string, string | null>>): Situation | null {
    const out: Partial<Situation> = {}; // the answers
    for (const [n, k] of FIELDS) { const x = v[n]; if (x !== "1" && x !== "0") return null; out[k] = x === "1"; } // each, or malformed
    return out as Situation; // all seven
  },
});
