// ============================================================================
// GOLDEN VECTORS for the F5 Ethernet trailer decoder.
//
// The behaviours that matter: the magic is found in hex, the low and medium
// fields are read from a pasted dissector view, the RST cause is explained
// where known and NOT invented where unknown, and - the one that matters most -
// a TLS provider section is DETECTED AND REFUSED rather than decoded.
// ============================================================================

import { decodeTrailer } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-eth-trailer-decoder/2026-08-13";

const LOW = `F5 Ethernet Trailer Protocol
  Low Details
    Ingress: 1
    Slot: 2
    TMM: 5
    VIP: /Common/vs_web`;

const MED = `F5 Ethernet Trailer Protocol
  Low Details
    Ingress: 0
    Slot: 1
    TMM: 3
    VIP: /Common/vs_api
  Medium Details
    Flow ID: 0x0000570075cfd200
    Peer ID: 0x0000570075cfd400
    RST cause: No local listener`;

const TLS = `F5 Ethernet Trailer Protocol
  Magic: 0xf5deb0f5
  Length: 840
  Version: 1
  F5 TLS 1.3 Extended F5 Trailer header, Provider: 4, Type: 3
    Secret Length: 48
    Early Secret: 7ee8206f5570023e6dc7519eb1073bc4`;

export interface TrailerVector {
  name: string;
  input: string;
  expect: {
    magic?: boolean;
    noise?: "low" | "medium" | "high" | "unknown";
    hasField?: [string, string];
    fieldExplainContains?: [string, string];
    tls?: boolean;
    warns?: boolean;
    noteContains?: string;
    throws?: boolean;
  };
}

export const TRAILER_VECTORS: readonly TrailerVector[] = Object.freeze([
  {
    name: "low details give direction, slot, TMM and VIP",
    input: LOW,
    expect: { noise: "low", hasField: ["Slot", "2"] },
  },
  {
    name: "the virtual server is read",
    input: LOW,
    expect: { hasField: ["Virtual server", "/Common/vs_web"] },
  },
  {
    name: "medium details add flow and peer",
    input: MED,
    expect: { noise: "medium", hasField: ["Flow ID", "0x0000570075cfd200"] },
  },
  {
    name: "*** a KNOWN RST cause is explained ***",
    input: MED,
    expect: { fieldExplainContains: ["RST cause", "No virtual server was listening"] },
  },
  {
    name: "*** an UNKNOWN RST cause is NOT invented ***",
    input: MED.replace("No local listener", "Some cause this tool has never seen"),
    expect: { fieldExplainContains: ["RST cause", "will not invent one"] },
  },
  {
    name: "the peer-ID note points at anyflowid",
    input: MED,
    expect: { fieldExplainContains: ["Peer ID", "anyflowid"] },
  },
  {
    name: "*** A TLS PROVIDER IS DETECTED AND WARNED ABOUT ***",
    input: TLS,
    expect: { tls: true, warns: true, magic: true },
  },
  {
    name: "*** AND NO SECRET IS EVER ECHOED BACK ***",
    input: TLS,
    expect: { tls: true },
  },
  {
    name: "raw hex: the magic is found",
    input: "0000 0000 f5de b0f5 0348 01",
    expect: { magic: true },
  },
  {
    name: "hex without the magic warns rather than guessing",
    input: "0011 2233 4455 6677 8899 aabb ccdd eeff",
    expect: { warns: true },
  },
  {
    name: "the noise-flag explanation is always given",
    input: LOW,
    expect: { noteContains: "-s0" },
  },
  {
    name: "empty input throws",
    input: "   ",
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of TRAILER_VECTORS) {
    let d;
    try {
      d = decodeTrailer(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.magic && !d.magic) f.push(`${v.name}: magic not found`);
    if (e.noise && d.noise !== e.noise) f.push(`${v.name}: noise ${d.noise} != ${e.noise}`);
    if (e.hasField) {
      const hit = d.fields.find((x) => x.name === e.hasField![0]);
      if (!hit) f.push(`${v.name}: no field ${e.hasField[0]}`);
      else if (hit.value !== e.hasField[1]) f.push(`${v.name}: ${e.hasField[0]} = ${hit.value} != ${e.hasField[1]}`);
    }
    if (e.fieldExplainContains) {
      const hit = d.fields.find((x) => x.name === e.fieldExplainContains![0]);
      if (!hit) f.push(`${v.name}: no field ${e.fieldExplainContains[0]}`);
      else if (!hit.explain.includes(e.fieldExplainContains[1])) f.push(`${v.name}: explanation lacks "${e.fieldExplainContains[1]}"`);
    }
    if (e.tls !== undefined && d.tlsProviderPresent !== e.tls) f.push(`${v.name}: tlsProviderPresent ${d.tlsProviderPresent} != ${e.tls}`);
    if (e.warns && d.warnings.length === 0) f.push(`${v.name}: expected a warning`);
    if (e.noteContains && !d.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
  }

  /* THE SECRET MUST NEVER APPEAR IN THE OUTPUT. Asserted over the WHOLE
     serialised result rather than field by field, so a future change that
     starts echoing the provider section anywhere fails here. */
  const d = decodeTrailer(TLS);
  const blob = JSON.stringify(d);
  if (blob.includes("7ee8206f5570023e6dc7519eb1073bc4")) {
    f.push("*** SECRET LEAKED INTO THE OUTPUT ***");
  }
  return f;
}
