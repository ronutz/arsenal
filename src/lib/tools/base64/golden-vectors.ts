// ============================================================================
// src/lib/tools/base64/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Base64 tool (set id: "base64-golden-v1").
//
// GENERATED from the reference algorithm and frozen, so they match
// analyzeBase64() exactly. Because run() never throws, the invalid cases live
// here as golden vectors whose `expected.decoded.ok` is false - there are no
// reject (throwing) vectors. Regenerate via /tmp/gen-base64-vectors.mjs if the
// algorithm changes; do not hand-edit expected values.
// ============================================================================

import type { Base64Result, Base64DecodeReason } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "base64-golden-v1";

/** An analyze case: `input` must produce `expected`. */
export interface Base64GoldenVector {
  name: string;
  input: string;
  expected: Base64Result;
}

export const BASE64_GOLDEN_VECTORS: Base64GoldenVector[] = [
    {
      "name": "text-with-punctuation",
      "input": "Hello, World!",
      "expected": {
        "input": "Hello, World!",
        "encoded": {
          "standard": "SGVsbG8sIFdvcmxkIQ==",
          "urlSafe": "SGVsbG8sIFdvcmxkIQ"
        },
        "decoded": {
          "ok": false,
          "reason": "invalid-characters"
        }
      }
    },
    {
      "name": "standard-decode",
      "input": "SGVsbG8gV29ybGQ=",
      "expected": {
        "input": "SGVsbG8gV29ybGQ=",
        "encoded": {
          "standard": "U0dWc2JHOGdWMjl5YkdRPQ==",
          "urlSafe": "U0dWc2JHOGdWMjl5YkdRPQ"
        },
        "decoded": {
          "ok": true,
          "text": "Hello World",
          "byteLength": 11,
          "isUtf8": true
        }
      }
    },
    {
      "name": "urlsafe-decode-nopad",
      "input": "SGVsbG8sIFdvcmxkIQ",
      "expected": {
        "input": "SGVsbG8sIFdvcmxkIQ",
        "encoded": {
          "standard": "U0dWc2JHOHNJRmR2Y214a0lR",
          "urlSafe": "U0dWc2JHOHNJRmR2Y214a0lR"
        },
        "decoded": {
          "ok": true,
          "text": "Hello, World!",
          "byteLength": 13,
          "isUtf8": true
        }
      }
    },
    {
      "name": "utf8-multibyte",
      "input": "café ☕",
      "expected": {
        "input": "café ☕",
        "encoded": {
          "standard": "Y2Fmw6kg4piV",
          "urlSafe": "Y2Fmw6kg4piV"
        },
        "decoded": {
          "ok": false,
          "reason": "invalid-length"
        }
      }
    },
    {
      "name": "binary-not-utf8",
      "input": "//79",
      "expected": {
        "input": "//79",
        "encoded": {
          "standard": "Ly83OQ==",
          "urlSafe": "Ly83OQ"
        },
        "decoded": {
          "ok": true,
          "text": "���",
          "byteLength": 3,
          "isUtf8": false
        }
      }
    },
    {
      "name": "invalid-length-4n1",
      "input": "QQQQQ",
      "expected": {
        "input": "QQQQQ",
        "encoded": {
          "standard": "UVFRUVE=",
          "urlSafe": "UVFRUVE"
        },
        "decoded": {
          "ok": false,
          "reason": "invalid-length"
        }
      }
    },
    {
      "name": "invalid-characters",
      "input": "not base64 @@@",
      "expected": {
        "input": "not base64 @@@",
        "encoded": {
          "standard": "bm90IGJhc2U2NCBAQEA=",
          "urlSafe": "bm90IGJhc2U2NCBAQEA"
        },
        "decoded": {
          "ok": false,
          "reason": "invalid-characters"
        }
      }
    }
  ];

/** A rejection case shape (run() never throws here, so the list stays empty). */
export interface Base64RejectVector {
  name: string;
  input: string;
  reason: Base64DecodeReason;
}

/** run() never throws for this tool; kept empty for parity with the contract. */
export const BASE64_REJECT_VECTORS: Base64RejectVector[] = [];
