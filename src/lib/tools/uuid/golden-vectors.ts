// ============================================================================
// src/lib/tools/uuid/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the UUID inspector (set id: "uuid-golden-v1").
//
// GENERATED and frozen. Includes the classic v4 example 550e8400-..., a v7 UUID
// built from a known timestamp (2023-11-14T22:13:20Z) so the decode is exactly
// checkable, the nil UUID, and a non-UUID string. inspectUuid() never throws
// (invalid input is reported via valid:false), so there are no reject vectors.
// Regenerate via /tmp/gen-uuid-vectors.mjs if needed.
// ============================================================================

import type { UuidInfo } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "uuid-golden-v1";

/** A UUID-inspection case: `input` must produce `expected`. */
export interface UuidGoldenVector {
  name: string;
  input: string;
  expected: UuidInfo;
}

/** A rejection case shape (none today; invalid input is reported, not raised). */
export interface UuidRejectVector {
  name: string;
  input: string;
}

export const UUID_GOLDEN_VECTORS: UuidGoldenVector[] = [
    {
      "name": "v4-classic",
      "input": "550e8400-e29b-41d4-a716-446655440000",
      "expected": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "valid": true,
        "version": 4,
        "variant": "RFC 4122/9562",
        "timestampMs": null,
        "timestampIso": null
      }
    },
    {
      "name": "v7-known-ts",
      "input": "018bcfe5-6800-7abc-8def-0123456789ab",
      "expected": {
        "uuid": "018bcfe5-6800-7abc-8def-0123456789ab",
        "valid": true,
        "version": 7,
        "variant": "RFC 4122/9562",
        "timestampMs": 1700000000000,
        "timestampIso": "2023-11-14T22:13:20.000Z"
      }
    },
    {
      "name": "nil",
      "input": "00000000-0000-0000-0000-000000000000",
      "expected": {
        "uuid": "00000000-0000-0000-0000-000000000000",
        "valid": true,
        "version": 0,
        "variant": "NCS (legacy)",
        "timestampMs": null,
        "timestampIso": null
      }
    },
    {
      "name": "invalid",
      "input": "not-a-uuid",
      "expected": {
        "uuid": "not-a-uuid",
        "valid": false,
        "version": null,
        "variant": null,
        "timestampMs": null,
        "timestampIso": null
      }
    }
  ];

export const UUID_REJECT_VECTORS: UuidRejectVector[] = [];
