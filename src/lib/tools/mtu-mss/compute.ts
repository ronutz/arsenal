// ============================================================================
// src/lib/tools/mtu-mss/compute.ts
// ----------------------------------------------------------------------------
// MTU / MSS calculator - the pure engine (D-49: deterministic, local, no
// clock, no network, no randomness).
//
// One line of text in, one structured result out. The input is a link IP MTU
// followed by optional encapsulation tokens, e.g.:
//
//   "1500"                the plain link: MSS, frame sizes, wire efficiency
//   "1500 vxlan"          an overlay: inner MTU/MSS + required underlay MTU
//   "1500 gre v6"         GRE with an IPv6 outer header
//   "9000 vxlan vlan"     jumbo underlay, VXLAN overlay, tagged frames
//   "1500 +57"            a custom overhead (e.g. a measured IPsec ESP cost)
//
// THE ONE DISTINCTION THIS TOOL TEACHES
// -------------------------------------
// Overheads live on two different sides of the MTU line, and conflating them
// is the classic mistake:
//
//   * ENCAPSULATIONS (gre, ipip, 6in4, vxlan, geneve, wireguard, pppoe, +N)
//     consume bytes INSIDE the link MTU, so they SHRINK the inner IP MTU and
//     therefore the TCP MSS. This is why a GRE tunnel interface on a
//     1500-byte link shows MTU 1476.
//
//   * L2 SHIMS (802.1Q vlan, QinQ, MPLS labels) live in the FRAME HEADER,
//     outside the IP payload, so they DO NOT change the IP MTU - they grow
//     the Ethernet frame instead (1522-byte "baby giants" with one VLAN tag),
//     which is why switches need frame headroom (system MTU 9216 and the
//     like), not a smaller IP MTU.
//
// All header sizes below are protocol constants from the relevant RFCs,
// cross-verified against multiple independent write-ups on 2026-07-20 (see
// the manifest sources in ./index.ts).
// ============================================================================

/** Stable error codes (the UI maps them to localized messages). */
export type MtuCalcErrorCode =
  | "format" // unrecognized token
  | "mtu-range" // MTU outside 68..65535
  | "custom-range" // +N outside 1..2000
  | "mpls-range" // mpls label count outside 1..8
  | "duplicate" // the same token given twice
  | "too-small"; // encapsulation eats the whole MTU (inner < 68)

/** Typed error carrying a stable code. */
export class MtuCalcError extends Error {
  readonly code: MtuCalcErrorCode;
  constructor(code: MtuCalcErrorCode, message: string) {
    super(message);
    this.name = "MtuCalcError";
    this.code = code;
  }
}

/** Which side of the MTU line a layer sits on (the tool's core lesson). */
export type LayerKind = "encap" | "shim";

/** One resolved overhead layer in the requested stack. */
export interface StackLayer {
  /** Token id, e.g. "vxlan", "vlan", "mpls", "custom". */
  id: string;
  /** Bytes this layer costs (already resolved for the outer IP version). */
  bytes: number;
  /** "encap" shrinks the inner IP MTU; "shim" grows the frame. */
  kind: LayerKind;
  /** Set when the size is a documented minimum/base (options can add more). */
  variable?: boolean;
}

/** Frame arithmetic at the link (Ethernet II). */
export interface FrameNumbers {
  /** Untagged Ethernet header: dst(6)+src(6)+EtherType(2). */
  l2Header: 14;
  /** Total shim bytes (VLAN/QinQ/MPLS) carried in the header. */
  shimBytes: number;
  /** Frame check sequence. */
  fcs: 4;
  /** Largest frame the link must accept: MTU + 14 + shims + 4. */
  maxFrame: number;
  /** On the wire per frame: maxFrame + preamble/SFD(8) + inter-frame gap(12). */
  onWire: number;
}

/** Wire efficiency of a full-sized TCP/IPv4 segment at a given IP MTU. */
export interface EfficiencyRow {
  mtu: number;
  /** (MTU - 40) / (MTU + 38), as a percentage rounded to 2 decimals. */
  percent: number;
}

/** The underlay a full 1500-byte inner packet needs through this overlay. */
export interface UnderlayNumbers {
  /** The classic design target: carry a full standard inner packet. */
  innerTarget: 1500;
  /** 1500 + total encapsulation bytes. */
  requiredMtu: number;
  /** The frame that underlay MTU implies (with this stack's shims). */
  requiredFrame: number;
}

/** The full result the UI renders. */
export interface MtuCalcResult {
  /** The link IP MTU as given. */
  mtu: number;
  /** Outer IP version used to size IP-carrying encapsulations. */
  outer: "ipv4" | "ipv6";
  /** The resolved stack, in the order given. */
  layers: StackLayer[];
  /** Sum of encapsulation bytes (shrinks the inner MTU). */
  encapTotal: number;
  /** Sum of shim bytes (grows the frame). */
  shimTotal: number;
  /** MTU - encapTotal: what an inner IP packet may occupy. */
  innerMtu: number;
  /** innerMtu - 20 (IPv4) - 20 (TCP, no options). */
  mssV4: number;
  /** innerMtu - 40 (IPv6) - 20 (TCP, no options). */
  mssV6: number;
  /** Frame arithmetic at the link. */
  frame: FrameNumbers;
  /** Efficiency at this MTU plus the two canonical reference points. */
  efficiency: { atMtu: EfficiencyRow; ref1500: EfficiencyRow; ref9000: EfficiencyRow };
  /** Present only when the stack contains at least one encapsulation. */
  underlay?: UnderlayNumbers;
  /** True when the stack includes 6in4 (the inner protocol is IPv6). */
  innerIsV6Only: boolean;
  /** True when a layer's size is a documented base that options can exceed. */
  hasVariableLayer: boolean;
}

// ---------------------------------------------------------------------------
// Header-size constants (bytes). Each is a protocol-fixed number:
//   IPv4 header 20 (RFC 791, no options) - IPv6 header 40 (RFC 8200)
//   TCP header 20 (RFC 9293, no options) - UDP header 8 (RFC 768)
//   Ethernet II header 14 + FCS 4; preamble+SFD 8 + inter-frame gap 12
//   802.1Q tag 4 (IEEE 802.1Q); QinQ two tags 8; MPLS label 4 (RFC 3032)
//   PPPoE 6 + PPP 2 = 8 (RFC 2516) -> the classic 1492
//   GRE base header 4 (RFC 2784); + outer IP
//   IPIP / 6in4: outer IP only (RFC 2003 / RFC 4213)
//   VXLAN header 8 + UDP 8 + outer IP + inner Ethernet 14 (RFC 7348) -> 50/70
//   GENEVE base header 8 + UDP 8 + outer IP + inner Ethernet 14 (RFC 8926)
//     -> 50/70 base, variable-length options may add more
//   WireGuard data header+tag 32 + UDP 8 + outer IP -> 60 (IPv4) / 80 (IPv6)
// ---------------------------------------------------------------------------
const IPV4 = 20;
const IPV6 = 40;
const TCP = 20;
const UDP = 8;
const ETH_HEADER = 14;
const FCS = 4;
const PREAMBLE_IFG = 20; // 8 preamble+SFD + 12 inter-frame gap
const VLAN_TAG = 4;
const MPLS_LABEL = 4;
const PPPOE = 8;
const GRE_BASE = 4;
const VXLAN_HDR = 8;
const GENEVE_BASE = 8;
const WIREGUARD_DATA = 32;

const MTU_MIN = 68; // RFC 791: every IPv4 link must carry 68 bytes
const MTU_MAX = 65535;

/** Wire efficiency of a full TCP/IPv4 segment at a given IP MTU.
 *  payload = MTU - 40 (IP+TCP); on-wire = MTU + 14 + 4 + 20 = MTU + 38. */
function efficiencyAt(mtu: number): EfficiencyRow {
  const percent = Math.round(((mtu - IPV4 - TCP) / (mtu + ETH_HEADER + FCS + PREAMBLE_IFG)) * 10000) / 100;
  return { mtu, percent };
}

/** Internal: resolve one encapsulation token for the chosen outer version. */
function encapBytes(id: string, outer: "ipv4" | "ipv6"): { bytes: number; variable?: boolean } {
  const o = outer === "ipv6" ? IPV6 : IPV4;
  switch (id) {
    case "pppoe":
      return { bytes: PPPOE }; // no outer IP: the v6 modifier does not apply
    case "gre":
      return { bytes: o + GRE_BASE };
    case "ipip":
      return { bytes: o };
    case "6in4":
      return { bytes: o }; // outer is IPv4 in the classic RFC 4213 case
    case "vxlan":
      return { bytes: o + UDP + VXLAN_HDR + ETH_HEADER };
    case "geneve":
      return { bytes: o + UDP + GENEVE_BASE + ETH_HEADER, variable: true };
    case "wireguard":
      return { bytes: o + UDP + WIREGUARD_DATA };
    default:
      /* istanbul ignore next - the parser only routes known ids here */
      throw new MtuCalcError("format", `unknown encapsulation: ${id}`);
  }
}

/**
 * run - parse one input line and compute the full result.
 *
 * Grammar (whitespace-separated, case-insensitive, any token order after MTU):
 *   <mtu> [v6] [pppoe] [gre] [ipip] [6in4|sit] [vxlan] [geneve] [wireguard|wg]
 *         [+N]... [vlan|dot1q] [qinq] [mpls | mplsN]
 *
 * Anchored, linear, single pass - no backtracking (ReDoS-safe by construction).
 */
export function run(raw: string): MtuCalcResult {
  const tokens = raw.trim().toLowerCase().split(/\s+/);
  if (tokens.length === 0 || tokens[0] === "") {
    throw new MtuCalcError("format", "empty input");
  }

  // -- The MTU itself ---------------------------------------------------------
  if (!/^\d{1,5}$/.test(tokens[0])) {
    throw new MtuCalcError("format", `expected an MTU number first, got "${tokens[0]}"`);
  }
  const mtu = Number(tokens[0]);
  if (mtu < MTU_MIN || mtu > MTU_MAX) {
    throw new MtuCalcError("mtu-range", `MTU must be ${MTU_MIN}..${MTU_MAX}`);
  }

  // -- Tokens ----------------------------------------------------------------
  // First pass: collect flags so the outer IP version is known before any
  // encapsulation is sized (order-independent input, deterministic output).
  const rest = tokens.slice(1);
  const seen = new Set<string>();
  let outer: "ipv4" | "ipv6" = "ipv4";
  for (const t of rest) {
    if (t === "v6" || t === "ipv6") {
      if (seen.has("v6")) throw new MtuCalcError("duplicate", "v6 given twice");
      seen.add("v6");
      outer = "ipv6";
    }
  }

  const layers: StackLayer[] = [];
  let mplsLabels = 0;
  const addOnce = (id: string) => {
    if (seen.has(id)) throw new MtuCalcError("duplicate", `${id} given twice`);
    seen.add(id);
  };

  for (const t of rest) {
    if (t === "v6" || t === "ipv6") continue; // handled above
    if (/^\+\d{1,4}$/.test(t)) {
      // Custom overhead, e.g. a measured IPsec ESP cost. Repeatable; summed.
      const n = Number(t.slice(1));
      if (n < 1 || n > 2000) throw new MtuCalcError("custom-range", "+N must be 1..2000");
      layers.push({ id: "custom", bytes: n, kind: "encap" });
      continue;
    }
    if (t === "pppoe" || t === "gre" || t === "ipip" || t === "vxlan" || t === "geneve") {
      addOnce(t);
      const e = encapBytes(t, outer);
      layers.push({ id: t, bytes: e.bytes, kind: "encap", variable: e.variable });
      continue;
    }
    if (t === "6in4" || t === "sit") {
      addOnce("6in4");
      layers.push({ id: "6in4", bytes: encapBytes("6in4", outer).bytes, kind: "encap" });
      continue;
    }
    if (t === "wireguard" || t === "wg") {
      addOnce("wireguard");
      layers.push({ id: "wireguard", bytes: encapBytes("wireguard", outer).bytes, kind: "encap" });
      continue;
    }
    if (t === "vlan" || t === "dot1q") {
      addOnce("vlan");
      layers.push({ id: "vlan", bytes: VLAN_TAG, kind: "shim" });
      continue;
    }
    if (t === "qinq") {
      addOnce("qinq");
      layers.push({ id: "qinq", bytes: 2 * VLAN_TAG, kind: "shim" });
      continue;
    }
    const mpls = /^mpls(\d)?$/.exec(t);
    if (mpls) {
      addOnce("mpls");
      mplsLabels = mpls[1] ? Number(mpls[1]) : 1;
      if (mplsLabels < 1 || mplsLabels > 8) {
        throw new MtuCalcError("mpls-range", "mpls label count must be 1..8");
      }
      layers.push({ id: "mpls", bytes: mplsLabels * MPLS_LABEL, kind: "shim" });
      continue;
    }
    throw new MtuCalcError("format", `unrecognized token "${t}"`);
  }

  // -- Arithmetic (the whole tool is these few lines) ------------------------
  const encapTotal = layers.filter((l) => l.kind === "encap").reduce((s, l) => s + l.bytes, 0);
  const shimTotal = layers.filter((l) => l.kind === "shim").reduce((s, l) => s + l.bytes, 0);

  const innerMtu = mtu - encapTotal;
  if (innerMtu < MTU_MIN) {
    throw new MtuCalcError("too-small", `encapsulation leaves ${innerMtu} bytes (< ${MTU_MIN})`);
  }

  const maxFrame = mtu + ETH_HEADER + shimTotal + FCS;
  const result: MtuCalcResult = {
    mtu,
    outer,
    layers,
    encapTotal,
    shimTotal,
    innerMtu,
    mssV4: innerMtu - IPV4 - TCP,
    mssV6: innerMtu - IPV6 - TCP,
    frame: {
      l2Header: ETH_HEADER,
      shimBytes: shimTotal,
      fcs: FCS,
      maxFrame,
      onWire: maxFrame + PREAMBLE_IFG,
    },
    efficiency: {
      atMtu: efficiencyAt(mtu),
      ref1500: efficiencyAt(1500),
      ref9000: efficiencyAt(9000),
    },
    innerIsV6Only: seen.has("6in4"),
    hasVariableLayer: layers.some((l) => l.variable === true),
  };

  // The classic overlay design question: what underlay MTU carries a full
  // standard 1500-byte inner packet without fragmentation? Only meaningful
  // when at least one encapsulation is in play.
  if (encapTotal > 0) {
    const requiredMtu = 1500 + encapTotal;
    result.underlay = {
      innerTarget: 1500,
      requiredMtu,
      requiredFrame: requiredMtu + ETH_HEADER + shimTotal + FCS,
    };
  }

  return result;
}
