// ============================================================================
// GOLDEN VECTORS for the F5OS tenant config explainer.
//
// Built from blocks F5's own documentation prints. The arithmetic vectors are
// the important ones: the published minimum-memory formula is the difference
// between this tool and a glossary.
// ============================================================================

import { decodeTenant, minMemoryFor } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5os-tenant-config-explainer/2026-08-14";

const CLI_DEPLOYED = `tenants tenant bigip
 config type BIG-IP
 config image BIGIP-bigip15.1.x-europa-15.1.5-0.0.222.ALL-F5OS.qcow2.zip.bundle
 config nodes [ 1 2 ]
 config mgmt-ip 192.0.2.59
 config prefix-length 24
 config gateway 192.0.2.254
 config cryptos enabled
 config vcpu-cores-per-node 2
 config memory 7680
 config storage size 76
 config running-state deployed
 config appliance-mode disabled`;

const JSON_CONFIGURED = `{ "tenant": [ { "name": "tenant1", "config": {
  "image": "BIGIP-14.1.4-0.0.9.ALL-VELOS.qcow2.zip.bundle",
  "nodes": [ 1 ], "mgmt-ip": "10.255.0.10", "gateway": "10.255.0.1",
  "prefix-length": 24, "vlans": [ 444, 500, 555 ],
  "vcpu-cores-per-node": 2, "memory": 7680,
  "cryptos": "enabled", "running-state": "configured" } } ] }`;

const UNDER_MIN = `tenants tenant small
 config vcpu-cores-per-node 4
 config memory 8192
 config running-state provisioned`;

export interface TenantVector {
  name: string;
  input: string;
  expect: {
    state?: "configured" | "provisioned" | "deployed" | "unknown";
    vcpu?: number;
    minMemory?: number;
    noteContains?: string;
    warnContains?: string;
    warns?: boolean;
    throws?: boolean;
  };
}

export const TENANT_VECTORS: readonly TenantVector[] = Object.freeze([
  {
    name: "a deployed CLI block is read",
    input: CLI_DEPLOYED,
    expect: { state: "deployed", vcpu: 2, minMemory: 7680 },
  },
  {
    name: "*** and a deployed tenant is told the change is not live ***",
    input: CLI_DEPLOYED,
    expect: { noteContains: "move it back to provisioned first" },
  },
  {
    name: "two nodes means the tenant spans blades",
    input: CLI_DEPLOYED,
    expect: { noteContains: "This looks like VELOS" },
  },
  {
    name: "JSON form parses too",
    input: JSON_CONFIGURED,
    expect: { state: "configured", vcpu: 2 },
  },
  {
    name: "an ALL-VELOS image is flagged as chassis-only",
    input: JSON_CONFIGURED,
    expect: { noteContains: "will not deploy on rSeries" },
  },
  {
    name: "*** MEMORY BELOW THE PUBLISHED MINIMUM WARNS ***",
    input: UNDER_MIN,
    expect: { warnContains: "BELOW the minimum", minMemory: 14848 },
  },
  {
    name: "2 vCPU requires 7680 MB, per F5's formula",
    input: "config vcpu-cores-per-node 2\nconfig memory 7680\nconfig running-state configured",
    expect: { minMemory: 7680 },
  },
  {
    name: "4 vCPU requires 14848 MB",
    input: "config vcpu-cores-per-node 4\nconfig memory 14848\nconfig running-state configured",
    expect: { minMemory: 14848 },
  },
  {
    name: "memory above the minimum is noted as a decision, not a fault",
    input: "config vcpu-cores-per-node 2\nconfig memory 12288\nconfig running-state configured",
    expect: { noteContains: "was a decision rather than a default" },
  },
  {
    name: "*** vCPU with no memory warns - they move together ***",
    input: "config vcpu-cores-per-node 4\nconfig running-state provisioned",
    expect: { warnContains: "both must be changed together" },
  },
  {
    name: "a non-multiple-of-four vCPU is chassis-shaped",
    input: "config vcpu-cores-per-node 2\nconfig memory 7680\nconfig running-state configured",
    expect: { noteContains: "must be a multiple of four" },
  },
  {
    name: "the provisioned state is described accurately",
    input: "config running-state provisioned\nconfig vcpu-cores-per-node 4\nconfig memory 14848",
    expect: { state: "provisioned", noteContains: "ready to deploy and it is not running" },
  },
  {
    name: "unrecognisable input throws",
    input: "hello world",
    expect: { throws: true },
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
  for (const v of TENANT_VECTORS) {
    let d;
    try {
      d = decodeTenant(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.state && d.runningState !== e.state) f.push(`${v.name}: state ${d.runningState} != ${e.state}`);
    if (e.vcpu !== undefined && d.vcpu !== e.vcpu) f.push(`${v.name}: vcpu ${d.vcpu} != ${e.vcpu}`);
    if (e.minMemory !== undefined && d.minMemory !== e.minMemory) f.push(`${v.name}: minMemory ${d.minMemory} != ${e.minMemory}`);
    if (e.noteContains && !d.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.warnContains && !d.warnings.some((n) => n.includes(e.warnContains!))) f.push(`${v.name}: no warning containing "${e.warnContains}"`);
    if (e.warns !== undefined && (d.warnings.length > 0) !== e.warns) f.push(`${v.name}: warnings ${d.warnings.length}, expected ${e.warns}`);
  }
  /* THE FORMULA ITSELF, checked directly against the two values F5 publishes. */
  if (minMemoryFor(2) !== 7680) f.push(`minMemoryFor(2) = ${minMemoryFor(2)}, F5 publishes 7680`);
  if (minMemoryFor(4) !== 14848) f.push(`minMemoryFor(4) = ${minMemoryFor(4)}, F5 publishes 14848`);
  return f;
}
