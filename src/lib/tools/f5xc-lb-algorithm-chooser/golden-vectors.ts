// ============================================================================
// src/lib/tools/f5xc-lb-algorithm-chooser/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: questionnaire state -> recommended algorithm + key caveats.
// ============================================================================

import { recommend, run, type AnswerState } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-lb-algorithm-chooser/2026-07-11";

interface Vec {
  id: string;
  state: AnswerState;
  algo: string | null; // null = incomplete
  persists?: boolean;
  hasCaveat?: string;
  missing?: string;
}

const VECS: Vec[] = [
  { id: "even-no-persist", state: { needsPersistence: false, distribution: "even", sessionKey: null, dynamicPool: false }, algo: "round-robin", persists: false, hasCaveat: "no-persistence" },
  { id: "least-loaded", state: { needsPersistence: false, distribution: "least-loaded", sessionKey: null, dynamicPool: false }, algo: "least-active-request", persists: false, hasCaveat: "least-uneven-cost" },
  { id: "random", state: { needsPersistence: false, distribution: "random", sessionKey: null, dynamicPool: false }, algo: "random", persists: false, hasCaveat: "random-large-pool" },
  { id: "source-ip", state: { needsPersistence: true, distribution: null, sessionKey: "source-ip", dynamicPool: false }, algo: "source-ip-stickiness", persists: true, hasCaveat: "low-client-diversity" },
  { id: "cookie", state: { needsPersistence: true, distribution: null, sessionKey: "cookie", dynamicPool: false }, algo: "cookie-stickiness", persists: true, hasCaveat: "cookie-params" },
  { id: "custom-header", state: { needsPersistence: true, distribution: null, sessionKey: "custom-header", dynamicPool: false }, algo: "ring-hash-custom", persists: true, hasCaveat: "custom-header-session" },
  { id: "per-route", state: { needsPersistence: true, distribution: null, sessionKey: "per-route", dynamicPool: false }, algo: "lb-override", persists: true, hasCaveat: "per-route-control" },
  { id: "dynamic-hash", state: { needsPersistence: true, distribution: null, sessionKey: "source-ip", dynamicPool: true }, algo: "source-ip-stickiness", persists: true, hasCaveat: "dynamic-hash-good" },
  // incomplete states
  { id: "missing-persistence", state: { needsPersistence: null, distribution: null, sessionKey: null, dynamicPool: null }, algo: null, missing: "persistence" },
  { id: "missing-distribution", state: { needsPersistence: false, distribution: null, sessionKey: null, dynamicPool: null }, algo: null, missing: "distribution" },
  { id: "missing-sessionkey", state: { needsPersistence: true, distribution: null, sessionKey: null, dynamicPool: null }, algo: null, missing: "sessionKey" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of VECS) {
    const r = recommend(v.state);
    const e: string[] = [];
    if (v.algo === null) {
      if (r.complete) e.push(`expected incomplete, got ${r.algo}`);
      if (v.missing && r.missing !== v.missing) e.push(`missing: got ${r.missing} want ${v.missing}`);
    } else {
      if (!r.complete) e.push(`incomplete (missing ${r.missing})`);
      if (r.algo !== v.algo) e.push(`algo: got ${r.algo} want ${v.algo}`);
      if (v.persists !== undefined && r.persists !== v.persists) e.push(`persists: got ${r.persists} want ${v.persists}`);
      if (v.hasCaveat && !(r.caveatIds ?? []).includes(v.hasCaveat)) e.push(`caveat ${v.hasCaveat} missing from ${JSON.stringify(r.caveatIds)}`);
    }
    if (e.length) failures.push(`[${v.id}] ${e.join("; ")}`);
    else passed++;
  }

  // run() JSON path
  const rr = run('{"needsPersistence":true,"sessionKey":"cookie","dynamicPool":false}');
  if (!("complete" in rr && rr.complete && rr.algo === "cookie-stickiness")) failures.push(`[run:json] wrong: ${JSON.stringify(rr)}`);
  else passed++;
  const rbad = run("{not json");
  if (!("error" in rbad)) failures.push(`[run:bad-json] should error`);
  else passed++;

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [...VECS.map((v) => v.id), "run:json", "run:bad-json"];
