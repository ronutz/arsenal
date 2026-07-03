// ============================================================================
// src/lib/tools/f5-oneconnect-source-mask/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: default filling with the v17 values, both mask polar cases in
// the manual's own semantics, the grouping math, the SNAT-collapses-groups
// demonstration (K7208/K5911 ordering), limit-type strict's warning, the
// per-TMM/Current-Idle statistics note, share-pools, unknown-key honesty,
// and every error path.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-oneconnect-source-mask-golden-v1";

export interface OcVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "profile" | "mask" | "settings";
  expectSetting?: { key: string; value: string; isDefault: boolean };
  expectSettingExplains?: { key: string; text: string };
  expectObsIncludes?: string;
  expectSimGroups?: number;
  expectSimObsIncludes?: string;
  expectPrefix?: number | null;
  expectNoteIncludes?: string;
  expectCatalogCount?: number;
}

const PROFILE = (body: string) => `ltm profile one-connect my_oc {\n${body}\n}`;

export const OC_VECTORS: OcVector[] = [
  { id: "settings-catalog", description: "settings renders the 7-option catalogue with defaults", input: "settings", expectOk: true, expectMode: "settings", expectCatalogCount: 7 },
  { id: "defaults-filled", description: "Empty profile fills every default with the v17 values", input: PROFILE("    defaults-from oneconnect"), expectOk: true, expectMode: "profile", expectSetting: { key: "max-age", value: "86400", isDefault: true } },
  { id: "mask-zero-verbatim", description: "0.0.0.0 explained with the manual's all-clients semantics", input: PROFILE("    source-mask 0.0.0.0"), expectOk: true, expectSettingExplains: { key: "source-mask", text: "across all clients" } },
  { id: "mask-host-verbatim", description: "Host mask explained with the same-client semantics", input: PROFILE("    source-mask 255.255.255.255"), expectOk: true, expectSettingExplains: { key: "source-mask", text: "same client IP" } },
  { id: "default-mask-warning", description: "Unset mask raises the shared-across-all-clients observation", input: PROFILE("    max-age 300"), expectOk: true, expectObsIncludes: "shared across ALL clients" },
  { id: "snat-order-always", description: "The K7208/K5911 SNAT-then-mask ordering is stated on every profile", input: PROFILE("    source-mask 255.255.255.0"), expectOk: true, expectObsIncludes: "TRANSLATED address" },
  { id: "single-snat-implication", description: "Narrow mask gets the single-SNAT-collapses-groups implication, labeled as reasoning", input: PROFILE("    source-mask 255.255.255.255"), expectOk: true, expectObsIncludes: "one reuse group" },
  { id: "strict-warning", description: "limit-type strict carries the manual's not-recommended warning", input: PROFILE("    limit-type strict"), expectOk: true, expectObsIncludes: "not recommended" },
  { id: "share-pools", description: "share-pools enabled explains the cross-virtual semantics", input: PROFILE("    share-pools enabled"), expectOk: true, expectObsIncludes: "differing only in destination address" },
  { id: "stats-honesty", description: "The Current Idle / per-TMM statistics note is always present", input: PROFILE("    source-mask 0.0.0.0"), expectOk: true, expectObsIncludes: "Current Idle" },
  { id: "unknown-key", description: "Unknown options flagged honestly", input: PROFILE("    warp-drive enabled"), expectOk: true, expectNoteIncludes: "outside this tool's curated option table" },
  { id: "sim-groups", description: "A /24 groups 10.1.1.x together and 10.1.2.x apart", input: "mask 255.255.255.0 ips 10.1.1.5 10.1.1.99 10.1.2.7", expectOk: true, expectMode: "mask", expectSimGroups: 2, expectPrefix: 24 },
  { id: "sim-prefix-form", description: "Prefix form /24 accepted and rendered dotted", input: "mask /24 ips 10.1.1.5 10.1.1.99", expectOk: true, expectSimGroups: 1, expectPrefix: 24 },
  { id: "sim-snat-collapse", description: "A single snat collapses every client into one group", input: "mask 255.255.255.255 ips 10.1.1.5 10.9.9.9 172.16.0.4 snat 192.0.2.10", expectOk: true, expectSimGroups: 1, expectSimObsIncludes: "ONE group regardless" },
  { id: "bare-mask", description: "A bare mask token renders its semantics", input: "255.255.255.0", expectOk: true, expectMode: "mask" },
  { id: "error-empty", description: "Empty input names the three shapes", input: " ", expectOk: false, expectErrorIncludes: "settings" },
  { id: "error-bad-ip", description: "A bad IP in the sim names itself", input: "mask /24 ips 10.1.1.999", expectOk: false, expectErrorIncludes: "not an IPv4 address" },
  { id: "error-no-stanza", description: "Non-profile text explains what to paste", input: "ltm pool web { }", expectOk: false, expectErrorIncludes: "one-connect" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of OC_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectCatalogCount !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogCount) failures.push(`${v.id}: catalog ${r.catalog?.length}`);
      if (v.expectSetting) {
        const s = r.settings?.find((x) => x.key === v.expectSetting!.key);
        if (!s || s.value !== v.expectSetting.value || s.isDefault !== v.expectSetting.isDefault) failures.push(`${v.id}: setting ${JSON.stringify(s)}`);
      }
      if (v.expectSettingExplains) {
        const s = r.settings?.find((x) => x.key === v.expectSettingExplains!.key);
        if (!s || !s.explanation.includes(v.expectSettingExplains.text)) failures.push(`${v.id}: explain missing`);
      }
      if (v.expectObsIncludes && !r.observations.some((o) => o.includes(v.expectObsIncludes!))) failures.push(`${v.id}: obs missing "${v.expectObsIncludes}"`);
      if (v.expectSimGroups !== undefined && (r.sim?.groups.length ?? -1) !== v.expectSimGroups) failures.push(`${v.id}: groups ${r.sim?.groups.length}`);
      if (v.expectSimObsIncludes && !(r.sim?.observations ?? []).some((o) => o.includes(v.expectSimObsIncludes!))) failures.push(`${v.id}: sim obs missing`);
      if (v.expectPrefix !== undefined && r.sim?.prefix !== v.expectPrefix) failures.push(`${v.id}: prefix ${r.sim?.prefix}`);
      if (v.expectNoteIncludes && !r.notes.some((n) => n.includes(v.expectNoteIncludes!))) failures.push(`${v.id}: note missing`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
