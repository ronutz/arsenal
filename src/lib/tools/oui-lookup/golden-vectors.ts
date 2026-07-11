// ============================================================================
// src/lib/tools/oui-lookup/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the OUI lookup. The vendor assertions are grounded in the
// embedded IEEE MA-L snapshot (00000C -> Cisco, 000393 -> Apple, 005056 ->
// VMware were confirmed against the source registry). The remaining vectors
// exercise format handling and the U/L and I/G bit classification, which are
// pure and snapshot-independent.
// ============================================================================

import { analyzeMac } from "./compute";
import { getOuiMap } from "./oui-data";

export const GOLDEN_VECTOR_SET_ID = "oui-lookup/2026-07-10";

const lookup = (oui: string) => getOuiMap().get(oui) ?? null;

interface Vec {
  id: string;
  input: string;
  ok: boolean;
  vendor?: string | null;
  oui?: string;
  multicast?: boolean;
  local?: boolean;
  isOuiOnly?: boolean;
  errorIncludes?: string;
}

const VECTORS: Vec[] = [
  { id: "cisco-full", input: "00:00:0C:11:22:33", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", multicast: false, local: false, isOuiOnly: false },
  { id: "apple-hyphen", input: "00-03-93-AA-BB-CC", ok: true, vendor: "Apple, Inc.", oui: "000393", multicast: false, local: false },
  { id: "vmware-unseparated", input: "005056123456", ok: true, vendor: "VMware, Inc.", oui: "005056", multicast: false, local: false },
  { id: "cisco-dotted", input: "0000.0c11.2233", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", multicast: false },
  { id: "oui-only", input: "00:00:0C", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", isOuiOnly: true },
  { id: "locally-administered", input: "02:11:22:33:44:55", ok: true, vendor: null, local: true, multicast: false },
  { id: "multicast", input: "01:00:5E:00:00:01", ok: true, multicast: true, local: false },
  { id: "broadcast", input: "FF:FF:FF:FF:FF:FF", ok: true, vendor: null, multicast: true, local: true },
  { id: "reject-nonhex", input: "hello world", ok: false, errorIncludes: "valid hex" },
  { id: "reject-length", input: "00:11:22:33", ok: false, errorIncludes: "12 hex digits" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of VECTORS) {
    const r = analyzeMac(v.input, lookup);
    const errs: string[] = [];
    if (r.ok !== v.ok) errs.push(`ok: got ${r.ok} want ${v.ok}`);
    if (v.vendor !== undefined && r.vendor !== v.vendor) errs.push(`vendor: got ${JSON.stringify(r.vendor)} want ${JSON.stringify(v.vendor)}`);
    if (v.oui !== undefined && r.oui !== v.oui) errs.push(`oui: got ${r.oui} want ${v.oui}`);
    if (v.multicast !== undefined && r.multicast !== v.multicast) errs.push(`multicast: got ${r.multicast} want ${v.multicast}`);
    if (v.local !== undefined && r.local !== v.local) errs.push(`local: got ${r.local} want ${v.local}`);
    if (v.isOuiOnly !== undefined && r.isOuiOnly !== v.isOuiOnly) errs.push(`isOuiOnly: got ${r.isOuiOnly} want ${v.isOuiOnly}`);
    if (v.errorIncludes !== undefined && !(r.error?.message ?? "").includes(v.errorIncludes)) errs.push(`error missing ${JSON.stringify(v.errorIncludes)}`);
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }
  return { passed, failed: failures.length, failures };
}

export const goldenVectors = VECTORS.map((v) => v.id);
