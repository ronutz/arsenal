// ============================================================================
// src/lib/tools/pkce/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the PKCE tool (set id: "pkce-golden-v1").
//
// GENERATED and frozen. The first vector is RFC 7636 Appendix B: the verifier
// "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" must yield the S256 challenge
// "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" (the generator asserts this).
// The others exercise the validity flags (too short, bad charset). run() never
// throws (validity is reported, not raised), so there are no reject vectors.
// Regenerate via /tmp/gen-pkce-vectors.mjs if needed.
// ============================================================================

import type { PkceResult } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "pkce-golden-v1";

/** A PKCE case: `input` (a code_verifier) must produce `expected`. */
export interface PkceGoldenVector {
  name: string;
  input: string;
  expected: PkceResult;
}

/** A rejection case shape (none today; validity is reported via flags). */
export interface PkceRejectVector {
  name: string;
  input: string;
}

export const PKCE_GOLDEN_VECTORS: PkceGoldenVector[] = [
    {
      "name": "rfc7636-appendix-b",
      "input": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      "expected": {
        "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
        "length": 43,
        "lengthValid": true,
        "charsetValid": true,
        "valid": true,
        "s256Challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        "plainChallenge": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
      }
    },
    {
      "name": "too-short",
      "input": "shortverifier",
      "expected": {
        "codeVerifier": "shortverifier",
        "length": 13,
        "lengthValid": false,
        "charsetValid": true,
        "valid": false,
        "s256Challenge": "YhUQzR55i-IOscv6k-npmK6ADae8JWxmHtHau_idJYs",
        "plainChallenge": "shortverifier"
      }
    },
    {
      "name": "invalid-charset",
      "input": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR+stuv",
      "expected": {
        "codeVerifier": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR+stuv",
        "length": 49,
        "lengthValid": true,
        "charsetValid": false,
        "valid": false,
        "s256Challenge": "Gd6GwLWLRKTOp-rpFCIqSFwOC6c388lStIfDFjlAbqg",
        "plainChallenge": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR+stuv"
      }
    },
    {
      "name": "valid-64char",
      "input": "AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz",
      "expected": {
        "codeVerifier": "AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz",
        "length": 64,
        "lengthValid": true,
        "charsetValid": true,
        "valid": true,
        "s256Challenge": "jGt_qcvpMWUlLnBfKp1McDwxM8BptA3k_YwpRBg_QQw",
        "plainChallenge": "AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz09-._~AZaz"
      }
    }
  ];

export const PKCE_REJECT_VECTORS: PkceRejectVector[] = [];
