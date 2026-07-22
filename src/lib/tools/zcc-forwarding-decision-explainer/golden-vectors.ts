// ============================================================================
// src/lib/tools/zcc-forwarding-decision-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ZCC forwarding decision explainer. Twelve vectors
// pin the documented spine (three states, four ZIA actions, ZT semantics,
// the ZT2->ZT1 failover line, the hybrid web-split, ZPA's two actions), the
// always-on why-explainer-not-simulator honesty statement, the five-item
// bypass ledger, and the validation paths (missing/unknown/duplicate keys,
// tunnel-version scope, web-split's ZT2 requirement).
// GOLDEN_VECTOR_SET_ID: zcc-forwarding-decision-explainer-golden-v1.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "zcc-forwarding-decision-explainer-golden-v1";

export interface ZccFdeVector {
  name: string;
  input: string;
  expect: (r: ReturnType<typeof run>) => boolean;
  expectError?: RegExp;
}

export const ZCC_FDE_VECTORS: ZccFdeVector[] = [
  {
    // V1: the RA-recommended off-trusted posture walks all spine layers.
    name: "off-trusted + tunnel + zt2 walks network, zia, tunnel layers",
    input: "network = off-trusted\nzia-action = tunnel\ntunnel = zt2",
    expect: (r) =>
      r.steps.length === 3 &&
      r.steps[0].layer === "network" &&
      r.steps[1].lines[0].includes("packet level") &&
      r.steps[2].lines.some((l) => l.includes("ALL ports and protocols")),
  },
  {
    // V2: the documented ZT2->ZT1 automatic failover line is present for zt2.
    name: "zt2 carries the documented automatic failover to zt1",
    input: "network = off-trusted\nzia-action = tunnel\ntunnel = zt2",
    expect: (r) =>
      r.steps.some((s) => s.layer === "tunnel" && s.lines.some((l) => l.includes("automatically attempts a Z-Tunnel 1.0"))),
  },
  {
    // V3: ZT1's documented scope - web-only 80/443, tunnel not encrypting.
    name: "zt1 explains web-only 80/443 proxy tunnel scope",
    input: "network = off-trusted\nzia-action = tunnel\ntunnel = zt1",
    expect: (r) =>
      r.steps.some((s) => s.layer === "tunnel" && s.lines.some((l) => l.includes("ports 80 and 443"))),
  },
  {
    // V4: hybrid web-split renders only when on, and names the split.
    name: "web-split on renders the hybrid ZT1-web / ZT2-rest line",
    input: "network = off-trusted\nzia-action = tunnel\ntunnel = zt2\nweb-split = on",
    expect: (r) =>
      r.steps.some((s) => s.lines.some((l) => l.includes("web applications ride Z-Tunnel 1.0"))) &&
      !run("network = off-trusted\nzia-action = tunnel\ntunnel = zt2").steps.some((s) =>
        s.lines.some((l) => l.includes("web applications ride")),
      ),
  },
  {
    // V5: the VPN state carries the interoperability guidance (TWLP, no route-based).
    name: "vpn state carries TWLP interop guidance",
    input: "network = vpn\nzia-action = twlp",
    expect: (r) =>
      r.steps[0].lines.some((l) => l.includes("warns against route-based Tunnel")) &&
      r.steps[1].lines[0].includes("does not compete at the IP layer"),
  },
  {
    // V6: trusted + none explains the GRE/IPsec redundancy pattern; no tunnel layer.
    name: "trusted + none explains agent-off-behind-site-tunnels; no tunnel step",
    input: "network = trusted\nzia-action = none",
    expect: (r) =>
      r.steps[1].lines[0].includes("GRE or IPsec") && !r.steps.some((s) => s.layer === "tunnel"),
  },
  {
    // V7: ZPA's two-action layer renders when specified.
    name: "zpa-action tunnel renders the Microtunnel layer",
    input: "network = off-trusted\nzia-action = tunnel\nzpa-action = tunnel",
    expect: (r) =>
      r.steps.some((s) => s.layer === "zpa" && s.lines[0].includes("Microtunnel")),
  },
  {
    // V8: the why-explainer honesty statement and the five-item ledger are always on.
    name: "honesty statement + 5-item bypass ledger always present",
    input: "network = off-trusted\nzia-action = tunnel",
    expect: (r) =>
      r.honesty.length === 1 &&
      r.honesty[0].includes("no single precedence order") &&
      r.bypassLedger.length === 5,
  },
  {
    // V9: tunnel version rejected outside the tunneling actions.
    name: "tunnel with enforce-proxy rejected (documented scope)",
    input: "network = trusted\nzia-action = enforce-proxy\ntunnel = zt2",
    expect: () => false,
    expectError: /does not apply/,
  },
  {
    // V10: web-split requires zt2.
    name: "web-split without zt2 rejected",
    input: "network = off-trusted\nzia-action = tunnel\ntunnel = zt1\nweb-split = on",
    expect: () => false,
    expectError: /set tunnel = zt2/,
  },
  {
    // V11: missing required network line errors helpfully.
    name: "missing network rejected",
    input: "zia-action = tunnel",
    expect: () => false,
    expectError: /Missing required line: "network/,
  },
  {
    // V12: duplicates and unknown values both anchor to their line.
    name: "duplicate key rejected",
    input: "network = vpn\nnetwork = trusted\nzia-action = tunnel",
    expect: () => false,
    expectError: /appears twice/,
  },
];

/** Run every vector; return the list of failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of ZCC_FDE_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectError) failures.push(`${v.name}: expected error, got success`);
      else if (!v.expect(r)) failures.push(`${v.name}: expectation failed`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!v.expectError) failures.push(`${v.name}: unexpected error ${msg}`);
      else if (!v.expectError.test(msg)) failures.push(`${v.name}: error mismatch ${msg}`);
    }
  }
  return failures;
}
