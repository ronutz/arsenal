// ============================================================================
// src/lib/tools/uuid/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING UUID MODULE - a netcore {manifest, run, vectors} triple.
//
// run() is SYNC here (inspectUuid is pure string parsing - no Web Crypto), and
// single-input. A UUID is an identifier, not a secret, so executionClass is
// plain localOnly and shareSafetyDefault is "safe". The inputDetector is a real
// regex for the canonical 8-4-4-4-12 form.
// ============================================================================

import { inspectUuid, type UuidInfo } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  UUID_GOLDEN_VECTORS,
  UUID_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  UUID_GOLDEN_VECTORS,
  UUID_REJECT_VECTORS,
} from "./golden-vectors";
export { generateV4, generateV7, inspectUuid } from "./compute";
export type { UuidInfo } from "./compute";

/** The D-49 declarative manifest for the UUID tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identifiers",
  toolSlug: "uuid",
  canonicalAliases: ["guid", "uuidv4", "uuidv7", "unique-id"],
  inputDetectors: [
    {
      // The canonical 8-4-4-4-12 hex form.
      kind: "regex",
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      priority: 5,
      example: "550e8400-e29b-41d4-a716-446655440000",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"], // a UUID is an identifier, not a secret
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: ["learn/uuid"],
  sources: [
    {
      id: "rfc9562",
      label: "RFC 9562 - Universally Unique IDentifiers (UUIDs)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc9562",
      access_date: "2026-06-26",
      scope: "current UUID spec, including v7",
      status: "active",
    },
    {
      id: "rfc4122",
      label: "RFC 4122 - A UUID URN Namespace",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4122",
      access_date: "2026-06-26",
      scope: "original UUID definitions",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
});

/**
 * run - the registry-facing entry point. SYNC, single-input: inspects a UUID's
 * version, variant, and (for v7) embedded timestamp.
 * @param uuid a UUID string
 */
export function run(uuid: string): UuidInfo {
  return inspectUuid(uuid);
}

export const goldenVectors = UUID_GOLDEN_VECTORS;
export const rejectVectors = UUID_REJECT_VECTORS;
