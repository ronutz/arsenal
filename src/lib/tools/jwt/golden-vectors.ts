// ============================================================================
// src/lib/tools/jwt/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the JWT decoder (set id: "jwt-decode-golden-v1").
//
// These are GENERATED from the reference decode algorithm and then frozen, so
// they match decodeJwt() exactly and serve as a regression bind: when this tool
// graduates into @ronutz/netcore, the golden-vector CI runner replays each
// input through run() and asserts deep-equality with `expected`. Reject vectors
// assert that malformed input throws with the documented JwtDecodeError code.
//
// DO NOT hand-edit the expected values. Regenerate via /tmp/gen-jwt-vectors.mjs
// (or the equivalent) if the algorithm ever changes.
// ============================================================================

import type { DecodedJwt, JwtDecodeErrorCode } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "jwt-decode-golden-v1";

/** A decode case: `input` must decode to `expected`. */
export interface JwtGoldenVector {
  name: string;
  input: string;
  expected: DecodedJwt;
}

/** A rejection case: `input` must throw a JwtDecodeError carrying `code`. */
export interface JwtRejectVector {
  name: string;
  input: string;
  code: JwtDecodeErrorCode;
}

export const JWT_GOLDEN_VECTORS: JwtGoldenVector[] = [
    {
      "name": "hs256-classic",
      "input": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "expected": {
        "raw": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        "segments": {
          "header": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
          "payload": "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
          "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        },
        "header": {
          "alg": "HS256",
          "typ": "JWT"
        },
        "payload": {
          "sub": "1234567890",
          "name": "John Doe",
          "iat": 1516239022
        },
        "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        "alg": "HS256",
        "typ": "JWT",
        "kid": null,
        "times": {
          "iat": {
            "epoch": 1516239022,
            "iso": "2018-01-18T01:30:22.000Z"
          },
          "nbf": null,
          "exp": null
        }
      }
    },
    {
      "name": "registered-claims",
      "input": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2LTA2In0.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6InVzZXItNDIiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNzAwMDAwMDAwLCJuYmYiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMCwianRpIjoiYWJjLTEyMyJ9.c2lnbmF0dXJlLWJ5dGVz",
      "expected": {
        "raw": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2LTA2In0.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6InVzZXItNDIiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNzAwMDAwMDAwLCJuYmYiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMCwianRpIjoiYWJjLTEyMyJ9.c2lnbmF0dXJlLWJ5dGVz",
        "segments": {
          "header": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2LTA2In0",
          "payload": "eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6InVzZXItNDIiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNzAwMDAwMDAwLCJuYmYiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMCwianRpIjoiYWJjLTEyMyJ9",
          "signature": "c2lnbmF0dXJlLWJ5dGVz"
        },
        "header": {
          "alg": "HS256",
          "typ": "JWT",
          "kid": "key-2026-06"
        },
        "payload": {
          "iss": "https://idp.example.com",
          "sub": "user-42",
          "aud": "api://default",
          "iat": 1700000000,
          "nbf": 1700000000,
          "exp": 1700003600,
          "jti": "abc-123"
        },
        "signature": "c2lnbmF0dXJlLWJ5dGVz",
        "alg": "HS256",
        "typ": "JWT",
        "kid": "key-2026-06",
        "times": {
          "iat": {
            "epoch": 1700000000,
            "iso": "2023-11-14T22:13:20.000Z"
          },
          "nbf": {
            "epoch": 1700000000,
            "iso": "2023-11-14T22:13:20.000Z"
          },
          "exp": {
            "epoch": 1700003600,
            "iso": "2023-11-14T23:13:20.000Z"
          }
        }
      }
    },
    {
      "name": "alg-none",
      "input": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhbm9uIn0.",
      "expected": {
        "raw": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhbm9uIn0.",
        "segments": {
          "header": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
          "payload": "eyJzdWIiOiJhbm9uIn0",
          "signature": ""
        },
        "header": {
          "alg": "none",
          "typ": "JWT"
        },
        "payload": {
          "sub": "anon"
        },
        "signature": "",
        "alg": "none",
        "typ": "JWT",
        "kid": null,
        "times": {
          "iat": null,
          "nbf": null,
          "exp": null
        }
      }
    }
  ];

export const JWT_REJECT_VECTORS: JwtRejectVector[] = [
    {
      "name": "empty",
      "input": "",
      "code": "empty"
    },
    {
      "name": "single-segment",
      "input": "notajwt",
      "code": "format"
    },
    {
      "name": "four-segments",
      "input": "a.b.c.d",
      "code": "format"
    },
    {
      "name": "header-not-json",
      "input": "aGVsbG8.aGVsbG8.x",
      "code": "header"
    },
    {
      "name": "payload-not-object",
      "input": "eyJhbGciOiJub25lIn0.MTIz.x",
      "code": "payload"
    }
  ];
