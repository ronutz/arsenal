// ============================================================================
// src/lib/tools/hmac/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the HMAC tool (set id: "hmac-golden-v1").
//
// GENERATED and frozen. The first three vectors are RFC 4231 Test Case 2
// (key "Jefe", text message) for SHA-256/384/512 - the published values, which
// the generator asserts. run() does not throw for non-empty inputs (and the UI
// requires both a message and a key), so there are no reject vectors.
// Regenerate via /tmp/gen-hmac-vectors.mjs if needed.
// ============================================================================

import type { HmacInput, HmacResult } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "hmac-golden-v1";

/** An HMAC case: `input` must produce `expected`. */
export interface HmacGoldenVector {
  name: string;
  input: HmacInput;
  expected: HmacResult;
}

/** A rejection case shape (none today; UI requires message + key). */
export interface HmacRejectVector {
  name: string;
  input: HmacInput;
}

export const HMAC_GOLDEN_VECTORS: HmacGoldenVector[] = [
    {
      "name": "rfc4231-tc2-sha256",
      "input": {
        "message": "what do ya want for nothing?",
        "key": "Jefe",
        "algorithm": "SHA-256"
      },
      "expected": {
        "algorithm": "SHA-256",
        "hex": "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
        "base64": "W9zBRr9gdU5qBCQmCJV1x1oAPwidJzmDnexYuWTsOEM="
      }
    },
    {
      "name": "rfc4231-tc2-sha384",
      "input": {
        "message": "what do ya want for nothing?",
        "key": "Jefe",
        "algorithm": "SHA-384"
      },
      "expected": {
        "algorithm": "SHA-384",
        "hex": "af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649",
        "base64": "r0XS43ZIQDFhf3jStYprG5x+9GT1oBtH5C7Dc2MiRF6OIkDKXmnix4syOez6shZJ"
      }
    },
    {
      "name": "rfc4231-tc2-sha512",
      "input": {
        "message": "what do ya want for nothing?",
        "key": "Jefe",
        "algorithm": "SHA-512"
      },
      "expected": {
        "algorithm": "SHA-512",
        "hex": "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737",
        "base64": "Fkt6e/z4GeLjlfvnO1bgo4e9ZCIugx/WECcM1+olBVSXWL91wFqZSm0DT2X48Ob9yuqxo01Ka0tjbgcKOLznNw=="
      }
    },
    {
      "name": "utf8-multibyte",
      "input": {
        "message": "café ☕",
        "key": "secret-key",
        "algorithm": "SHA-256"
      },
      "expected": {
        "algorithm": "SHA-256",
        "hex": "ed02af675529fd1af9a4920071546f87bd65cb88feddb437611642879d41daf3",
        "base64": "7QKvZ1Up/Rr5pJIAcVRvh71ly4j+3bQ3YRZCh51B2vM="
      }
    },
    {
      "name": "password-key-sha512",
      "input": {
        "message": "Hello, World!",
        "key": "p@ssw0rd",
        "algorithm": "SHA-512"
      },
      "expected": {
        "algorithm": "SHA-512",
        "hex": "68100a53799d36096ab5d04a025d702a99a936cff8f97bbea1d1bccc864ae9ad382503b6c187b2c66a104b52737b6c4d40d92c754e2b395eea81ddfda3d8fb89",
        "base64": "aBAKU3mdNglqtdBKAl1wKpmpNs/4+Xu+odG8zIZK6a04JQO2wYeyxmoQS1Jze2xNQNksdU4rOV7qgd39o9j7iQ=="
      }
    }
  ];

export const HMAC_REJECT_VECTORS: HmacRejectVector[] = [];
