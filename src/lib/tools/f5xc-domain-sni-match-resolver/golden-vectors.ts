// ============================================================================
// src/lib/tools/f5xc-domain-sni-match-resolver/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: hostname resolution across LB domain lists - exact beats
// wildcard, wildcard doesn't cover apex, default catches unmatched, longest
// suffix wins, plus the structural warnings (auto-cert conflict, duplicate
// exact, multiple defaults, ambiguity, wildcard-cert multi-label caveat).
// ============================================================================

import { resolve, run, type LB } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-domain-sni-match-resolver/2026-07-11";

const SET: LB[] = [
  { name: "app-b", domains: ["app-b.domain.com"] },
  { name: "wild", domains: ["*.domain.com"], default: true },
  { name: "apex", domains: ["domain.com"] },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  // exact beats wildcard
  const r1 = resolve(SET, "app-b.domain.com");
  ok("exact-wins", r1.winner?.lbName === "app-b" && r1.winner?.matchType === "exact", JSON.stringify(r1.winner));
  ok("exact-runnerup", r1.runnerUp?.lbName === "wild" && r1.runnerUp?.matchType === "wildcard", JSON.stringify(r1.runnerUp));
  ok("conflict-warn", r1.warnings.some((w) => w.code === "auto-cert-conflict"), JSON.stringify(r1.warnings));

  // wildcard catches subdomain
  const r2 = resolve(SET, "other.domain.com");
  ok("wildcard-wins", r2.winner?.lbName === "wild" && r2.winner?.matchType === "wildcard", JSON.stringify(r2.winner));

  // apex not covered by wildcard -> exact apex LB wins
  const r3 = resolve(SET, "domain.com");
  ok("apex-exact", r3.winner?.lbName === "apex" && r3.winner?.matchType === "exact", JSON.stringify(r3.winner));

  // multi-label host -> wildcard cert caveat
  const r4 = resolve(SET, "a.b.domain.com");
  ok("multilabel-wildcard", r4.winner?.lbName === "wild", JSON.stringify(r4.winner));
  ok("multilabel-caveat", r4.warnings.some((w) => w.code === "wildcard-cert-multilabel"), JSON.stringify(r4.warnings));

  // no match, no default -> not picked up
  const r5 = resolve([{ name: "only-exact", domains: ["x.com"] }], "y.com");
  ok("no-match", r5.winner === null && r5.resolution === "none", JSON.stringify(r5));

  // no specific match but a default exists -> default catches
  const r6 = resolve([{ name: "exact", domains: ["x.com"] }, { name: "def", domains: ["z.com"], default: true }], "unmatched.com");
  ok("default-catch", r6.winner?.lbName === "def" && r6.winner?.matchType === "default", JSON.stringify(r6.winner));

  // ambiguity: two equal wildcards
  const r7 = resolve([{ name: "a", domains: ["*.foo.com"] }, { name: "b", domains: ["*.foo.com"] }], "x.foo.com");
  ok("ambiguity", r7.warnings.some((w) => w.code === "ambiguity"), JSON.stringify(r7.warnings));

  // duplicate exact across LBs
  const r8 = resolve([{ name: "a", domains: ["x.com"] }, { name: "b", domains: ["x.com"] }], "x.com");
  ok("dup-exact", r8.warnings.some((w) => w.code === "dup-exact"), JSON.stringify(r8.warnings));

  // longest-suffix wildcard wins
  const r9 = resolve([{ name: "broad", domains: ["*.com"] }, { name: "narrow", domains: ["*.foo.com"] }], "x.foo.com");
  ok("longest-suffix", r9.winner?.lbName === "narrow", JSON.stringify(r9.winner));

  // port must match
  const r10 = resolve([{ name: "p", domains: ["*.foo.com:8080"] }], "bar.foo.com:8080");
  ok("port-match", r10.winner?.lbName === "p", JSON.stringify(r10.winner));
  const r11 = resolve([{ name: "p", domains: ["*.foo.com:8080"] }], "bar.foo.com");
  ok("port-mismatch", r11.winner === null, JSON.stringify(r11.winner));

  // multiple defaults
  const r12 = resolve([{ name: "d1", domains: ["a.com"], default: true }, { name: "d2", domains: ["b.com"], default: true }], "a.com");
  ok("multi-default", r12.warnings.some((w) => w.code === "multi-default"), JSON.stringify(r12.warnings));

  // run() JSON + negatives
  const rr = run(JSON.stringify({ hostname: "app-b.domain.com", loadBalancers: SET }));
  ok("run-json", rr.winner?.lbName === "app-b", JSON.stringify(rr.winner));
  ok("run-bad-json", run("{nope").ok === false, "bad json not rejected");
  ok("empty-host", resolve(SET, "").ok === false, "empty hostname not rejected");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "exact-wins", "exact-runnerup", "conflict-warn", "wildcard-wins", "apex-exact", "multilabel-wildcard", "multilabel-caveat",
  "no-match", "default-catch", "ambiguity", "dup-exact", "longest-suffix", "port-match", "port-mismatch", "multi-default",
  "run-json", "run-bad-json", "empty-host",
];
