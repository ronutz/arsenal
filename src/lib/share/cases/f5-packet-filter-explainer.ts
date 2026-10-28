// ============================================================================
// src/lib/share/cases/f5-packet-filter-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP packet-filter explainer: the stanzas and the sim:
// line go as pasted (posture input-caution).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PACKET_FILTER_SHARE, type PacketFilterShareState } from "../../tools/f5-packet-filter-explainer/share"; // the spec
import { PF_VECTORS } from "../../tools/f5-packet-filter-explainer/golden-vectors"; // the tool's own vectors

/** The man page's three rules (the golden vectors' configuration). */
const CFG = PF_VECTORS[0].input ?? ""; // pinned there (the vector type makes input optional; this one has it)
/** The page's Example: those rules and a spoofed-source simulation. */
const EXAMPLE = `${CFG}\nsim: tcp src 172.19.255.7 dst 172.19.254.80 dport 443 vlan external`; // with its sim: line

/** The cases. */
export const F5_PACKET_FILTER_SHARE_CASES = defineShareCases<PacketFilterShareState, PacketFilterShareState>({
  spec: PACKET_FILTER_SHARE, // the spec
  accept: [
    { id: "rules", state: { input: CFG }, params: { input: CFG }, restored: { input: CFG } }, // quotes, parentheses and braces
    { id: "with-sim", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // and the simulation line
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing pasted
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
