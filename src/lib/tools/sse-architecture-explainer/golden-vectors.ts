// ============================================================================
// GOLDEN VECTORS for the SSE single-pass architecture explainer.
//
// An explainer of this shape is verified by WHICH SERVICES ENGAGE for a given
// request, and by the classification of each - the pillar/cross-cutting split
// is the whole teaching point and must not drift.
// ============================================================================

import { explainPass, type RequestShape } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "sse-architecture-explainer/2026-08-13";

const base: RequestShape = {
  destination: "web", steering: "client", managedDevice: true,
  tls: true, decrypt: true, hasPayload: true,
};

export interface SseVector {
  name: string;
  input: RequestShape;
  expect: {
    pillars?: string[];
    crossCutting?: string[];
    engaged?: string[];
    notEngaged?: string[];
    warns?: boolean;
    noteContains?: string;
  };
}

export const SSE_VECTORS: readonly SseVector[] = Object.freeze([
  {
    name: "web traffic engages SWG, not CASB or ZTNA",
    input: { ...base, destination: "web" },
    expect: { pillars: ["SWG"], notEngaged: ["Zero trust network access", "Cloud firewall"] },
  },
  {
    name: "sanctioned SaaS engages CASB, not SWG",
    input: { ...base, destination: "sanctioned-saas" },
    expect: { pillars: ["CASB"], notEngaged: ["Secure web gateway"] },
  },
  {
    name: "unsanctioned SaaS engages BOTH SWG and CASB",
    input: { ...base, destination: "unsanctioned-saas" },
    expect: { pillars: ["SWG", "CASB"] },
  },
  {
    name: "a private app engages ZTNA alone",
    input: { ...base, destination: "private-app" },
    expect: { pillars: ["ZTNA"], notEngaged: ["Secure web gateway", "Cloud access security broker"] },
  },
  {
    name: "a non-web port engages the cloud firewall",
    input: { ...base, destination: "non-web-port" },
    expect: { pillars: ["FWaaS"] },
  },
  {
    name: "*** DLP and threat are CROSS-CUTTING, whatever the pillar ***",
    input: { ...base, destination: "private-app" },
    expect: { crossCutting: ["DLP", "Threat protection"] },
  },
  {
    name: "no decryption disables DLP and warns",
    input: { ...base, tls: true, decrypt: false },
    expect: { crossCutting: [], warns: true },
  },
  {
    name: "no payload means DLP has nothing to classify",
    input: { ...base, hasPayload: false },
    expect: { crossCutting: ["Threat protection"] },
  },
  {
    name: "DNS steering warns about its coarseness",
    input: { ...base, steering: "dns" },
    expect: { warns: true },
  },
  {
    name: "an unmanaged device gets the isolation note",
    input: { ...base, managedDevice: false },
    expect: { noteContains: "unmanaged device" },
  },
  {
    name: "the single-pass claim is always stated",
    input: base,
    expect: { noteContains: "architectural claim" },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of SSE_VECTORS) {
    let r;
    try { r = explainPass(v.input); }
    catch (e) { f.push(`${v.name}: threw ${(e as Error).message}`); continue; }
    const e = v.expect;
    if (e.pillars && r.pillars.join(",") !== e.pillars.join(",")) f.push(`${v.name}: pillars [${r.pillars}] != [${e.pillars}]`);
    if (e.crossCutting && r.crossCutting.join(",") !== e.crossCutting.join(",")) f.push(`${v.name}: crossCutting [${r.crossCutting}] != [${e.crossCutting}]`);
    for (const n of e.engaged ?? []) if (!r.stages.some((s) => s.name === n && s.engaged)) f.push(`${v.name}: ${n} not engaged`);
    for (const n of e.notEngaged ?? []) if (r.stages.some((s) => s.name === n && s.engaged)) f.push(`${v.name}: ${n} should not engage`);
    if (e.warns && r.warnings.length === 0) f.push(`${v.name}: expected a warning`);
    if (e.noteContains && !r.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
  }
  return f;
}
