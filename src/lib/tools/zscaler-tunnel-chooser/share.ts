// ============================================================================
// src/lib/tools/zscaler-tunnel-chooser/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Zscaler location-tunnel chooser (posture
// "input", as the inventory has it; the manifest: "six anonymous answers;
// nothing identifies infrastructure"). The page is a form: a bandwidth
// figure and five yes/no answers. A link carries named values only, never
// "input" (ROLLOUT 11.3), and every field, always (decisions of 2026-11-01):
// mbps as typed, and ha, staticip, encryption, gre and nated as 1 or 0. A
// bandwidth the chooser refuses, or an answer other than 1 or 0, makes the
// link malformed (the encoder only builds a link beside a recommendation).
//
// Arrival: the whole form is replaced by the link's values and the page
// chooses (pure arithmetic on published figures; nothing is contacted).
// ============================================================================

import { choose, type ChooserResult } from "./compute"; // the page's own chooser
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** One yes/no answer, as the page's selects hold it. */
type YesNo = "yes" | "no"; // the two options

/** The state: the form as the page holds it. */
export interface TunnelShareState {
  /** Required bandwidth in Mbps, as typed. */
  mbps: string;
  /** High availability required. */
  ha: YesNo;
  /** Static public IP. */
  staticIp: YesNo;
  /** Encryption required. */
  encryption: YesNo;
  /** The edge device supports GRE. */
  greSupport: YesNo;
  /** The internal tunnel endpoints are source-NATed. */
  nated: YesNo;
} // TunnelShareState

/**
 * The page's recommendation for a form, as the page computes it, or null where it shows nothing or an error.
 * @param s the form
 * @returns the recommendation, or null
 */
export function tunnelChoice(s: TunnelShareState): ChooserResult | null {
  if (s.mbps.trim() === "") return null; // the page computes only with a bandwidth
  try {
    return choose({ requiredMbps: Number(s.mbps), haRequired: s.ha === "yes", staticPublicIp: s.staticIp === "yes", encryptionRequired: s.encryption === "yes", deviceSupportsGre: s.greSupport === "yes", internalEndpointsNated: s.nated === "yes" }); // as the page calls it
  } catch {
    return null; // the page shows its error
  } // try
} // tunnelChoice

/**
 * Encode beside a recommendation the page already has.
 * @param s the form
 * @param choice the page's recommendation, or null
 * @returns every field, or nothing
 */
export function encodeTunnel(s: TunnelShareState, choice: ChooserResult | null): ShareEncoding {
  if (!choice) return { ok: false, reason: "empty" }; // no recommendation: the button is disabled
  const b = (x: YesNo): string => (x === "yes" ? "1" : "0"); // an answer as 1 or 0
  return { ok: true, params: { mbps: s.mbps, ha: b(s.ha), staticip: b(s.staticIp), encryption: b(s.encryption), gre: b(s.greSupport), nated: b(s.nated) } }; // every field
} // encodeTunnel

/** The spec. */
export const ZSCALER_TUNNEL_CHOOSER_SHARE: ShareSpec<TunnelShareState> = Object.freeze({
  tool: "zscaler-tunnel-chooser", // the slug
  posture: "input", // the form as typed
  carriesKey: "share.carries", // tools.zscaler-tunnel-chooser.share.carries
  names: ["mbps", "ha", "staticip", "encryption", "gre", "nated"], // a form: named values only
  /** Every field, or nothing while there is no recommendation. */
  encode(s: TunnelShareState): ShareEncoding {
    return encodeTunnel(s, tunnelChoice(s)); // chosen, encoded
  },
  /** The whole form, with the page's opening answers for an absent one, and a bandwidth the chooser accepts. */
  decode(v: Readonly<Record<string, string | null>>): TunnelShareState | null {
    const yn = (x: string | null, dflt: YesNo): YesNo | null => (x === null ? dflt : x === "1" ? "yes" : x === "0" ? "no" : null); // an answer, or malformed
    const ha = yn(v.ha, "yes"), staticIp = yn(v.staticip, "yes"), encryption = yn(v.encryption, "no"), greSupport = yn(v.gre, "yes"), nated = yn(v.nated, "no"); // the five answers (the page's opening values when absent)
    if (ha === null || staticIp === null || encryption === null || greSupport === null || nated === null) return null; // an answer other than 1 or 0
    const s: TunnelShareState = { mbps: v.mbps ?? "", ha, staticIp, encryption, greSupport, nated }; // the form
    return tunnelChoice(s) ? s : null; // a bandwidth the chooser refuses is one the encoder never sends
  },
});
