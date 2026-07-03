// ============================================================================
// src/lib/tools/f5-dos-vector-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the AFM DoS-vector explainer. They pin: the 105-entry curated
// catalogue reproduced from the tmsh reference, the threshold semantics on
// the annotated fields, the mitigation-below-detection inversion in BOTH
// attribute-naming families (device and profile), auto-threshold mode
// analysis, simulate scoping, detection-disabled policing, enforce/state
// semantics, bad-actor wiring both ways, the sweep packet-types note, the
// db-tunable surfacing, the tcp-half-open interplay notes, uncurated-vector
// honesty, and the error paths. Sources as in the engine header.
// ============================================================================

import { run, VECTORS } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-dos-vector-explainer-golden-v1";

export interface DosVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "config" | "vector" | "catalog";
  expectCatalogGroups?: number;
  expectCatalogTotal?: number;
  expectVectorName?: string;
  expectReadingCount?: number;
  expectReadingContext?: { index: number; context: "device" | "profile" };
  expectObsIncludes?: { index: number; text: string };
  expectObsExcludes?: { index: number; text: string };
  expectUncurated?: { index: number };
  expectNoteIncludes?: string;
}

const DEV = (body: string) => `security dos device-config dos-device-config {\n    dos-device-vector {\n${body}\n    }\n}`;

export const DOS_VECTORS: DosVector[] = [
  {
    id: "catalog-shape",
    description: "The vectors keyword lists 9 category groups totalling the full curated table",
    input: "vectors",
    expectOk: true,
    expectMode: "catalog",
    expectCatalogGroups: 9,
    expectCatalogTotal: VECTORS.length,
  },
  {
    id: "single-vector-halfopen",
    description: "A single vector name renders its card, interplay notes included",
    input: "tcp-half-open",
    expectOk: true,
    expectMode: "vector",
    expectVectorName: "tcp-half-open",
  },
  {
    id: "inversion-device-naming",
    description: "Rate limit below detection (device names) raises the silent-drop warning",
    input: DEV("        tcp-half-open {\n            detection-threshold-pps 2500\n            default-internal-rate-limit 2000\n        }"),
    expectOk: true,
    expectReadingCount: 1,
    expectObsIncludes: { index: 0, text: "sits BELOW detection-threshold-pps" },
  },
  {
    id: "inversion-profile-naming",
    description: "Rate limit below rate-threshold (profile names) raises the same warning",
    input:
      "security dos profile p {\n    dos-network {\n        p {\n            network-attack-vector {\n                tcp-rst-flood {\n                    rate-threshold 50000\n                    rate-limit 40000\n                }\n            }\n        }\n    }\n}",
    expectOk: true,
    expectReadingCount: 1,
    expectReadingContext: { index: 0, context: "profile" },
    expectObsIncludes: { index: 0, text: "sits BELOW rate-threshold" },
  },
  {
    id: "no-inversion-when-sane",
    description: "Rate limit above detection raises no inversion",
    input: DEV("        icmpv4-flood {\n            detection-threshold-pps 1000\n            default-internal-rate-limit 5000\n        }"),
    expectOk: true,
    expectObsExcludes: { index: 0, text: "sits BELOW" },
  },
  {
    id: "auto-threshold-semantics",
    description: "auto-threshold explains detection-adjusts / mitigation-is-stress-driven",
    input: DEV("        icmpv4-flood {\n            auto-threshold enabled\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "driven by measured system or protected-object stress" },
  },
  {
    id: "auto-plus-manual-inert",
    description: "Manual thresholds under automatic mode are called out as governed by auto",
    input: DEV("        icmpv4-flood {\n            auto-threshold enabled\n            detection-threshold-pps 10000\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "automatic values govern" },
  },
  {
    id: "simulate-in-manual",
    description: "simulate in manual mode is explained as the dry run",
    input: DEV("        tcp-syn-oversize {\n            simulate-auto-threshold enable\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "dry run" },
  },
  {
    id: "simulate-under-auto-flagged",
    description: "simulate while auto-threshold is enabled is flagged against the reference's scoping",
    input: DEV("        tcp-syn-oversize {\n            auto-threshold enabled\n            simulate-auto-threshold enable\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "manual mode only" },
  },
  {
    id: "policing-without-detection",
    description: "Both detections infinite with a finite limit is named as silent policing",
    input: DEV("        udp-flood {\n            detection-threshold-pps infinite\n            detection-threshold-percent infinite\n            default-internal-rate-limit 30000\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "without ever raising an attack event" },
  },
  {
    id: "enforce-disabled",
    description: "enforce disabled is monitoring, not mitigation",
    input: DEV("        tcp-syn-flood {\n            enforce disabled\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "Monitoring, not mitigation" },
  },
  {
    id: "state-detect-only",
    description: "Profile state detect-only is visibility without action",
    input:
      "security dos profile p {\n    dos-network {\n        p {\n            network-attack-vector {\n                dns-any-query {\n                    state detect-only\n                }\n            }\n        }\n    }\n}",
    expectOk: true,
    expectObsIncludes: { index: 0, text: "Visibility without action" },
  },
  {
    id: "state-unknown-flagged",
    description: "An undocumented state value is shown as written and flagged",
    input:
      "security dos profile p {\n    dos-network {\n        p {\n            network-attack-vector {\n                dns-any-query {\n                    state aggressive\n                }\n            }\n        }\n    }\n}",
    expectOk: true,
    expectObsIncludes: { index: 0, text: "outside the documented set" },
  },
  {
    id: "bad-actor-without-rates",
    description: "bad-actor enabled without per-source rates is flagged",
    input: DEV("        sweep {\n            bad-actor enabled\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "needs its rates" },
  },
  {
    id: "rates-without-bad-actor",
    description: "per-source rates without bad-actor enabled is flagged the other way",
    input: DEV("        sweep {\n            per-source-ip-detection-pps 100\n            per-source-ip-limit-pps 500\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "ride the bad-actor feature" },
  },
  {
    id: "per-source-inversion",
    description: "Per-source limit below per-source detection raises the per-source inversion",
    input: DEV("        sweep {\n            bad-actor enabled\n            per-source-ip-detection-pps 500\n            per-source-ip-limit-pps 100\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "per offending source" },
  },
  {
    id: "db-tunable-surfaced",
    description: "A vector with a named sys-db tunable surfaces it",
    input: DEV("        dns-oversize {\n            detection-threshold-pps 1000\n        }"),
    expectOk: true,
    expectObsIncludes: { index: 0, text: "sys db dos.maxdnsframesize" },
  },
  {
    id: "uncurated-honesty",
    description: "A vector outside the curated table parses with the honesty note",
    input: DEV("        quantum-flood {\n            detection-threshold-pps 1\n        }"),
    expectOk: true,
    expectUncurated: { index: 0 },
    expectObsIncludes: { index: 0, text: "outside this tool's curated catalogue" },
  },
  {
    id: "sensitivity-note",
    description: "Device-level threshold-sensitivity lands in the notes",
    input: "security dos device-config dos-device-config {\n    threshold-sensitivity high\n}",
    expectOk: true,
    expectNoteIncludes: "padding",
  },
  {
    id: "error-empty",
    description: "Empty input explains the three input shapes",
    input: "  ",
    expectOk: false,
    expectErrorIncludes: "vectors",
  },
  {
    id: "error-unknown-single",
    description: "An unknown single token names itself",
    input: "mega-flood",
    expectOk: false,
    expectErrorIncludes: "not in the curated vector catalogue",
  },
  {
    id: "error-no-dos-objects",
    description: "tmsh without DoS stanzas explains what to paste",
    input: "ltm pool web { }",
    expectOk: false,
    expectErrorIncludes: "No security dos",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of DOS_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) {
        failures.push(`${v.id}: expected an error, got ok`);
        continue;
      }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode} != ${v.expectMode}`);
      if (v.expectCatalogGroups !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogGroups)
        failures.push(`${v.id}: groups ${r.catalog?.length} != ${v.expectCatalogGroups}`);
      if (v.expectCatalogTotal !== undefined) {
        const total = r.catalog?.reduce((n, g) => n + g.vectors.length, 0) ?? -1;
        if (total !== v.expectCatalogTotal) failures.push(`${v.id}: total ${total} != ${v.expectCatalogTotal}`);
      }
      if (v.expectVectorName && r.vector?.name !== v.expectVectorName) failures.push(`${v.id}: vector ${r.vector?.name}`);
      if (v.expectReadingCount !== undefined && (r.readings?.length ?? -1) !== v.expectReadingCount)
        failures.push(`${v.id}: readings ${r.readings?.length} != ${v.expectReadingCount}`);
      if (v.expectReadingContext) {
        const got = r.readings?.[v.expectReadingContext.index]?.context;
        if (got !== v.expectReadingContext.context) failures.push(`${v.id}: context ${got}`);
      }
      if (v.expectObsIncludes) {
        const obs = r.readings?.[v.expectObsIncludes.index]?.observations ?? [];
        if (!obs.some((o) => o.includes(v.expectObsIncludes!.text))) failures.push(`${v.id}: obs missing "${v.expectObsIncludes.text}"`);
      }
      if (v.expectObsExcludes) {
        const obs = r.readings?.[v.expectObsExcludes.index]?.observations ?? [];
        if (obs.some((o) => o.includes(v.expectObsExcludes!.text))) failures.push(`${v.id}: obs unexpectedly contains "${v.expectObsExcludes.text}"`);
      }
      if (v.expectUncurated) {
        if (r.readings?.[v.expectUncurated.index]?.info !== null) failures.push(`${v.id}: expected uncurated (info null)`);
      }
      if (v.expectNoteIncludes && !r.notes.some((n) => n.includes(v.expectNoteIncludes!)))
        failures.push(`${v.id}: notes missing "${v.expectNoteIncludes}"`);
    } catch (e) {
      if (v.expectOk !== false) {
        failures.push(`${v.id}: unexpected error ${(e as Error).message}`);
        continue;
      }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes))
        failures.push(`${v.id}: error missing "${v.expectErrorIncludes}": ${(e as Error).message}`);
    }
  }
  return failures;
}
