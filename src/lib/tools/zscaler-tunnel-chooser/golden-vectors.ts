// ============================================================================
// src/lib/tools/zscaler-tunnel-chooser/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the Zscaler tunnel chooser. They pin the three published
// capacity figures (GRE 1 Gbps, GRE-with-source-NAT 250 Mbps, IPsec 400 Mbps
// per public source IP), the documentation's own worked scale-out examples
// (2 Gbps GRE = 2+2; 3 Gbps GRE = 3+3; 800 Mbps IPsec = 2+2; 1200 Mbps
// IPsec = 3+3), every GRE-elimination branch, the no-HA minimal shape with
// its recommended-secondary note, and the helpful-error paths. Sources:
// help.zscaler.com "Understanding GRE", "Configuring an IPSec VPN Tunnel",
// "Choosing Traffic Forwarding Methods" - live-verified 2026-07-21.
// ============================================================================

import { run, type ChooserInput, type ChooserResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "zscaler-tunnel-chooser-golden-v1";

export interface TunnelVector {
  id: string;
  description: string;
  input: ChooserInput;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectChoice?: "gre" | "ipsec";
  expectPerTunnel?: number;
  expectPrimaries?: number;
  expectBackups?: number;
  expectStepLabel?: string;
  expectNoteIncludes?: string;
  expectPrereqIncludes?: string;
}

/** Convenience: a fully-specified input with overridable fields. */
function base(over: Partial<ChooserInput>): ChooserInput {
  return {
    requiredMbps: 500,
    haRequired: true,
    staticPublicIp: true,
    encryptionRequired: false,
    deviceSupportsGre: true,
    internalEndpointsNated: false,
    ...over,
  };
}

export const TUNNEL_VECTORS: TunnelVector[] = [
  {
    id: "gre-simple-ha",
    description: "500 Mbps, HA, all GRE preconditions met: one primary + one backup at 1 Gbps.",
    input: base({}),
    expectOk: true,
    expectChoice: "gre",
    expectPerTunnel: 1000,
    expectPrimaries: 1,
    expectBackups: 1,
  },
  {
    id: "gre-2gbps-doc-example",
    description: "The documentation's own 2 Gbps example: 2 primaries + 2 backups.",
    input: base({ requiredMbps: 2000 }),
    expectOk: true,
    expectChoice: "gre",
    expectPrimaries: 2,
    expectBackups: 2,
    expectPrereqIncludes: "2 distinct static public source IP addresses",
  },
  {
    id: "gre-3gbps-doc-example",
    description: "The documentation's 3 Gbps example: 3 primaries + 3 backups.",
    input: base({ requiredMbps: 3000 }),
    expectOk: true,
    expectChoice: "gre",
    expectPrimaries: 3,
    expectBackups: 3,
  },
  {
    id: "gre-nat-penalty",
    description: "Source-NATed internal endpoints drop the GRE figure to 250 Mbps: 300 Mbps needs 2 primaries.",
    input: base({ requiredMbps: 300, haRequired: false, internalEndpointsNated: true }),
    expectOk: true,
    expectChoice: "gre",
    expectPerTunnel: 250,
    expectPrimaries: 2,
    expectBackups: 0,
    expectStepLabel: "The NAT penalty",
  },
  {
    id: "gre-no-ha-note",
    description: "No-HA minimal build still carries the recommended-secondary note.",
    input: base({ requiredMbps: 350, haRequired: false }),
    expectOk: true,
    expectChoice: "gre",
    expectPrimaries: 1,
    expectBackups: 0,
    expectNoteIncludes: "RECOMMENDS a secondary tunnel",
  },
  {
    id: "ipsec-encryption-mandate",
    description: "Encryption requirement eliminates GRE regardless of other answers.",
    input: base({ requiredMbps: 200, encryptionRequired: true }),
    expectOk: true,
    expectChoice: "ipsec",
    expectPerTunnel: 400,
    expectPrimaries: 1,
    expectBackups: 1,
    expectStepLabel: "Encryption mandate",
  },
  {
    id: "ipsec-800-doc-example",
    description: "The documentation's 800 Mbps IPsec example: 2 primaries + 2 backups.",
    input: base({ requiredMbps: 800, encryptionRequired: true }),
    expectOk: true,
    expectChoice: "ipsec",
    expectPrimaries: 2,
    expectBackups: 2,
    expectNoteIncludes: "NAT-T with source-port randomization under IKEv2",
  },
  {
    id: "ipsec-1200-doc-example",
    description: "The documentation's 1200 Mbps IPsec example: 3 primaries + 3 backups.",
    input: base({ requiredMbps: 1200, encryptionRequired: true }),
    expectOk: true,
    expectChoice: "ipsec",
    expectPrimaries: 3,
    expectBackups: 3,
  },
  {
    id: "ipsec-dynamic-ip",
    description: "No static public IP: GRE eliminated, IPsec chosen (FQDN peers).",
    input: base({ requiredMbps: 200, staticPublicIp: false }),
    expectOk: true,
    expectChoice: "ipsec",
    expectStepLabel: "No static public IP",
  },
  {
    id: "ipsec-no-gre-device",
    description: "Edge device without GRE support routes to IPsec.",
    input: base({ requiredMbps: 200, deviceSupportsGre: false }),
    expectOk: true,
    expectChoice: "ipsec",
    expectStepLabel: "Device capability",
  },
  {
    id: "error-zero-mbps",
    description: "Zero bandwidth is a helpful error, not a result.",
    input: base({ requiredMbps: 0 }),
    expectOk: false,
    expectErrorIncludes: "positive number of Mbps",
  },
  {
    id: "error-absurd-mbps",
    description: "Out-of-scope bandwidth gets the scope-honest error.",
    input: base({ requiredMbps: 250000 }),
    expectOk: false,
    expectErrorIncludes: "outside this chooser's location-forwarding scope",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of TUNNEL_VECTORS) {
    const fail = (msg: string) => failures.push(`[${v.id}] ${msg}`);
    let r: ChooserResult | undefined;
    let err: string | undefined;
    try {
      r = run(v.input);
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    }
    const ok = err === undefined;
    if (v.expectOk !== undefined && ok !== v.expectOk) {
      fail(`ok ${ok} != ${v.expectOk}${err ? ` (${err})` : ""}`);
      continue;
    }
    if (!ok) {
      if (v.expectErrorIncludes && !(err ?? "").includes(v.expectErrorIncludes))
        fail(`error "${err}" missing "${v.expectErrorIncludes}"`);
      continue;
    }
    if (v.expectChoice && r!.choice !== v.expectChoice) fail(`choice ${r!.choice} != ${v.expectChoice}`);
    if (v.expectPerTunnel !== undefined && r!.perTunnelMbps !== v.expectPerTunnel)
      fail(`perTunnel ${r!.perTunnelMbps} != ${v.expectPerTunnel}`);
    if (v.expectPrimaries !== undefined && r!.primaries !== v.expectPrimaries)
      fail(`primaries ${r!.primaries} != ${v.expectPrimaries}`);
    if (v.expectBackups !== undefined && r!.backups !== v.expectBackups)
      fail(`backups ${r!.backups} != ${v.expectBackups}`);
    if (v.expectStepLabel && !r!.steps.some((s) => s.label === v.expectStepLabel))
      fail(`no step labeled "${v.expectStepLabel}"`);
    if (v.expectNoteIncludes && !r!.notes.some((n) => n.includes(v.expectNoteIncludes!)))
      fail(`no note containing "${v.expectNoteIncludes}"`);
    if (v.expectPrereqIncludes && !r!.prereqs.some((p) => p.includes(v.expectPrereqIncludes!)))
      fail(`no prereq containing "${v.expectPrereqIncludes}"`);
  }
  return failures;
}
