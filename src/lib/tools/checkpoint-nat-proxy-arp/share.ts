// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/lib/tools/checkpoint-nat-proxy-arp/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Check Point NAT black-hole predictor
// (posture "input", as the inventory has it: the manifest names nothing
// identifying, and the page takes a NAT method, a NAT type, the translated
// address, the gateway interface's address and prefix, and the Automatic ARP
// setting; no secret has a place in it). The page is a form, so the link
// carries named values only, never "input" (ROLLOUT 11.3), and every field,
// always (decisions of 2026-11-01): method, type, natip, gateway, prefix and
// autoarp (1 or 0). An unknown method or type, an autoarp other than 1 or 0,
// or addresses the page's own engine refuses make the link malformed: the
// encoder only builds a link beside a verdict, so it never builds those.
//
// Arrival: the whole form is replaced by the link's values and the page
// evaluates it (subnet arithmetic; nothing is sent or queried).
// ============================================================================

import { evaluateNat, type NatVerdict } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the form as the page holds it. */
export interface NatShareState {
  /** "automatic" or "manual". */
  method: "automatic" | "manual";
  /** "static" or "hide". */
  type: "static" | "hide";
  /** The translated address, as typed. */
  natIp: string;
  /** The gateway interface's address, as typed. */
  gatewayIp: string;
  /** Its prefix length, as typed. */
  prefix: string;
  /** Global Properties: Automatic ARP configuration. */
  autoArp: boolean;
} // NatShareState

/**
 * The page's verdict on a form, as the page computes it, or null where it shows nothing or an error.
 * @param s the form
 * @returns the verdict, or null
 */
export function natVerdict(s: NatShareState): NatVerdict | null {
  if (!s.natIp.trim() || !s.gatewayIp.trim()) return null; // the page evaluates only with both addresses
  try {
    return evaluateNat({ method: s.method, type: s.type, natIp: s.natIp, gatewayIp: s.gatewayIp, gatewayPrefix: Number(s.prefix), automaticArpConfiguration: s.autoArp }); // as the page calls it
  } catch {
    return null; // the page shows its error
  } // try
} // natVerdict

/**
 * Encode beside a verdict the page already has.
 * @param s the form
 * @param verdict the page's verdict, or null
 * @returns every field, or nothing
 */
export function encodeNat(s: NatShareState, verdict: NatVerdict | null): ShareEncoding {
  if (!verdict) return { ok: false, reason: "empty" }; // no verdict: the button is disabled
  return { ok: true, params: { method: s.method, type: s.type, natip: s.natIp, gateway: s.gatewayIp, prefix: s.prefix, autoarp: s.autoArp ? "1" : "0" } }; // every field
} // encodeNat

/** The spec. */
export const CHECKPOINT_NAT_PROXY_ARP_SHARE: ShareSpec<NatShareState> = Object.freeze({
  tool: "checkpoint-nat-proxy-arp", // the slug
  posture: "input", // the form as typed
  carriesKey: "share.carries", // tools.checkpoint-nat-proxy-arp.share.carries
  names: ["method", "type", "natip", "gateway", "prefix", "autoarp"], // a form: named values only
  /** Every field, or nothing while there is no verdict. */
  encode(s: NatShareState): ShareEncoding {
    return encodeNat(s, natVerdict(s)); // evaluated, encoded
  },
  /** The whole form, with the page's defaults for an absent choice, and a verdict the engine gives. */
  decode(v: Readonly<Record<string, string | null>>): NatShareState | null {
    const method = v.method ?? "manual"; // absent: the page's default
    const type = v.type ?? "static"; // absent: the page's default
    const autoarp = v.autoarp ?? "1"; // absent: the page's default (on)
    if ((method !== "automatic" && method !== "manual") || (type !== "static" && type !== "hide") || (autoarp !== "1" && autoarp !== "0")) return null; // an unknown choice
    const s: NatShareState = { method, type, natIp: v.natip ?? "", gatewayIp: v.gateway ?? "", prefix: v.prefix ?? "", autoArp: autoarp === "1" }; // the form
    return natVerdict(s) ? s : null; // a form the engine refuses is one the encoder never sends
  },
});
