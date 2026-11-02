// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/lib/share/cases/checkpoint-nat-proxy-arp.ts
// ----------------------------------------------------------------------------
// Share cases of the Check Point NAT black-hole predictor (input, a form):
// every field always; an absent choice takes the page's default; a form
// without both addresses has nothing to share; an unknown choice, or
// addresses the engine refuses, are malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CHECKPOINT_NAT_PROXY_ARP_SHARE, type NatShareState } from "../../tools/checkpoint-nat-proxy-arp/share"; // the spec

/** The page's Example (verbatim from the component): the classic manual-NAT black hole. */
const EXAMPLE: NatShareState = { method: "manual", type: "static", natIp: "203.0.113.50", gatewayIp: "203.0.113.1", prefix: "24", autoArp: true }; // as the component holds it
/** Automatic hide NAT outside the connected subnet, with Automatic ARP off. */
const ROUTED: NatShareState = { method: "automatic", type: "hide", natIp: "198.51.100.9", gatewayIp: "203.0.113.1", prefix: "24", autoArp: false }; // routed, not ARPed

/** The cases. */
export const CHECKPOINT_NAT_PROXY_ARP_SHARE_CASES = defineShareCases<NatShareState, NatShareState>({
  spec: CHECKPOINT_NAT_PROXY_ARP_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { method: "manual", type: "static", natip: "203.0.113.50", gateway: "203.0.113.1", prefix: "24", autoarp: "1" }, restored: EXAMPLE }, // every field
    { id: "routed-hide", state: ROUTED, params: { method: "automatic", type: "hide", natip: "198.51.100.9", gateway: "203.0.113.1", prefix: "24", autoarp: "0" }, restored: ROUTED }, // the other choices
  ],
  arrive: [
    { id: "choices-absent", values: { method: null, type: null, natip: "203.0.113.50", gateway: "203.0.113.1", prefix: "24", autoarp: null }, restored: EXAMPLE }, // the page's defaults
  ],
  empty: [
    { id: "no-addresses", state: { ...EXAMPLE, natIp: "", gatewayIp: "" } }, // the page evaluates nothing
    { id: "no-gateway", state: { ...EXAMPLE, gatewayIp: " " } }, // one address only
  ],
  reject: [
    { id: "unknown-method", values: { method: "dynamic", type: "static", natip: "203.0.113.50", gateway: "203.0.113.1", prefix: "24", autoarp: "1" } }, // no such method
    { id: "bad-autoarp", values: { method: "manual", type: "static", natip: "203.0.113.50", gateway: "203.0.113.1", prefix: "24", autoarp: "on" } }, // 1 or 0 only
    { id: "engine-refuses", values: { method: "manual", type: "static", natip: "not-an-address", gateway: "203.0.113.1", prefix: "24", autoarp: "1" } }, // the engine refuses it, so no link carries it
    { id: "no-addresses", values: { method: "manual", type: "static", natip: null, gateway: null, prefix: "24", autoarp: "1" } }, // nothing to evaluate
  ],
});
