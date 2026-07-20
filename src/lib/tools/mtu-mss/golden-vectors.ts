// ============================================================================
// src/lib/tools/mtu-mss/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the MTU / MSS calculator.
//
// Every accept vector is a textbook-checkable number: GRE on 1500 gives the
// classic 1476, VXLAN gives 1450 inner / 1550 underlay, PPPoE gives 1492,
// WireGuard gives 1440 (IPv4 outer) and 1420 (IPv6 outer), a single 802.1Q
// tag makes the 1522-byte baby giant without touching the IP MTU, and the
// efficiency pair is the canonical 94.93% (1500) vs 99.14% (9000). Constants
// cross-verified against multiple independent sources on 2026-07-20 (see the
// manifest in ./index.ts). Reject vectors pin stable error codes.
// verifyVectors() runs the whole set and throws on the first drift.
// ============================================================================

import { run, MtuCalcError, type MtuCalcErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "mtu-mss/2026-07-20a";

interface AcceptVector {
  id: string;
  input: string;
  /** Partial expectations checked field-by-field against the result. */
  expect: {
    innerMtu?: number;
    mssV4?: number;
    mssV6?: number;
    encapTotal?: number;
    shimTotal?: number;
    maxFrame?: number;
    onWire?: number;
    effAtMtu?: number;
    requiredMtu?: number;
    requiredFrame?: number;
  };
}

interface RejectVector {
  id: string;
  input: string;
  code: MtuCalcErrorCode;
}

export const MTU_MSS_GOLDEN_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Plain links: the canonical MSS + frame + efficiency numbers.
  { id: "plain-1500", input: "1500", expect: { innerMtu: 1500, mssV4: 1460, mssV6: 1440, maxFrame: 1518, onWire: 1538, effAtMtu: 94.93 } },
  { id: "plain-9000", input: "9000", expect: { innerMtu: 9000, mssV4: 8960, mssV6: 8940, maxFrame: 9018, onWire: 9038, effAtMtu: 99.14 } },
  // Encapsulations on 1500: the numbers every tunnel guide quotes.
  { id: "gre-1500", input: "1500 gre", expect: { encapTotal: 24, innerMtu: 1476, mssV4: 1436, requiredMtu: 1524 } },
  { id: "ipip-1500", input: "1500 ipip", expect: { encapTotal: 20, innerMtu: 1480, mssV4: 1440 } },
  { id: "6in4-1500", input: "1500 6in4", expect: { encapTotal: 20, innerMtu: 1480, mssV6: 1420 } },
  { id: "vxlan-1500", input: "1500 vxlan", expect: { encapTotal: 50, innerMtu: 1450, mssV4: 1410, requiredMtu: 1550, requiredFrame: 1568 } },
  { id: "vxlan-v6-1500", input: "1500 vxlan v6", expect: { encapTotal: 70, innerMtu: 1430, requiredMtu: 1570 } },
  { id: "pppoe-1500", input: "1500 pppoe", expect: { encapTotal: 8, innerMtu: 1492, mssV4: 1452 } },
  { id: "geneve-1500", input: "1500 geneve", expect: { encapTotal: 50, innerMtu: 1450 } },
  { id: "wireguard-1500", input: "1500 wireguard", expect: { encapTotal: 60, innerMtu: 1440, mssV4: 1400 } },
  { id: "wireguard-v6-1500", input: "1500 wg v6", expect: { encapTotal: 80, innerMtu: 1420 } },
  { id: "wireguard-pppoe-1492", input: "1492 wireguard", expect: { encapTotal: 60, innerMtu: 1432 } },
  // Jumbo underlay under an overlay: the datacenter case.
  { id: "vxlan-9000", input: "9000 vxlan", expect: { encapTotal: 50, innerMtu: 8950 } },
  // Shims: frame grows, IP MTU does not move (the tool's core lesson).
  { id: "vlan-1500", input: "1500 vlan", expect: { innerMtu: 1500, shimTotal: 4, maxFrame: 1522, onWire: 1542 } },
  { id: "vlan-mpls2-1500", input: "1500 vlan mpls2", expect: { innerMtu: 1500, shimTotal: 12, maxFrame: 1530 } },
  // Custom overhead: a measured IPsec ESP (AES-GCM tunnel-mode example, 57 B).
  { id: "custom-57", input: "1500 +57", expect: { encapTotal: 57, innerMtu: 1443 } },
]);

export const MTU_MSS_REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "not-a-number", input: "jumbo", code: "format" },
  { id: "mtu-too-small", input: "40", code: "mtu-range" },
  { id: "mtu-too-big", input: "70000", code: "mtu-range" },
  { id: "unknown-token", input: "1500 turbo", code: "format" },
  { id: "custom-zero", input: "1500 +0", code: "custom-range" },
  { id: "eats-everything", input: "100 vxlan", code: "too-small" },
]);

/** Run every vector; throw with a precise message on the first mismatch. */
export function verifyVectors(): { accepted: number; rejected: number } {
  for (const v of MTU_MSS_GOLDEN_VECTORS) {
    const r = run(v.input);
    const flat: Record<string, number> = {
      innerMtu: r.innerMtu,
      mssV4: r.mssV4,
      mssV6: r.mssV6,
      encapTotal: r.encapTotal,
      shimTotal: r.shimTotal,
      maxFrame: r.frame.maxFrame,
      onWire: r.frame.onWire,
      effAtMtu: r.efficiency.atMtu.percent,
      requiredMtu: r.underlay?.requiredMtu ?? -1,
      requiredFrame: r.underlay?.requiredFrame ?? -1,
    };
    for (const [k, want] of Object.entries(v.expect)) {
      if (flat[k] !== want) {
        throw new Error(`[${v.id}] ${k}: expected ${want}, got ${flat[k]}`);
      }
    }
  }
  for (const v of MTU_MSS_REJECT_VECTORS) {
    try {
      run(v.input);
      throw new Error(`[${v.id}] expected rejection "${v.code}", but input was accepted`);
    } catch (e) {
      if (!(e instanceof MtuCalcError) || e.code !== v.code) {
        throw new Error(`[${v.id}] expected code "${v.code}", got ${e instanceof MtuCalcError ? e.code : e}`);
      }
    }
  }
  return { accepted: MTU_MSS_GOLDEN_VECTORS.length, rejected: MTU_MSS_REJECT_VECTORS.length };
}
