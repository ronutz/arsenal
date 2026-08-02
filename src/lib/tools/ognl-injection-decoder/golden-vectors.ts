// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ognl-injection-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the OGNL injection decoder.
//
// The payload SHAPES below are the ones published by Apache in its own security
// bulletins and reproduced in every advisory since - they are the reference
// material for this class of flaw, not novel constructions. Each vector asserts
// on the DERIVED READING (what the decoder concluded), never on internal
// structure, so the tests survive refactoring and fail only on a change of
// meaning.
// ============================================================================

import { decodeOgnl } from "./compute";

export const SET_ID = "ognl-injection-decoder-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}

const eq = (got: unknown, want: unknown, what: string) =>
  got === want ? null : `${what}: expected ${String(want)}, got ${String(got)}`;

export const VECTORS: readonly Vector[] = [
  {
    id: "empty",
    description: "empty input is not treated as a payload",
    check: () => {
      const r = decodeOgnl("");
      return eq(r.looksLikeOgnl, false, "looksLikeOgnl") ?? eq(r.findings.length, 0, "findings");
    },
  },
  {
    id: "not-ognl",
    description: "an ordinary request line is recognised as unrelated",
    check: () => {
      const r = decodeOgnl("GET /index.html HTTP/1.1");
      return eq(r.looksLikeOgnl, false, "looksLikeOgnl");
    },
  },
  {
    id: "bare-probe",
    description: "expression delimiter alone reads as a probe, not an attack",
    check: () => {
      const r = decodeOgnl("%{1+1}");
      return (
        eq(r.looksLikeOgnl, true, "looksLikeOgnl") ??
        eq(r.hasEscape, false, "hasEscape") ??
        eq(r.hasExecution, false, "hasExecution")
      );
    },
  },
  {
    id: "escape-only",
    description: "sandbox manipulation without an execution call",
    check: () => {
      const r = decodeOgnl('%{(#_memberAccess["allowStaticMethodAccess"]=true)}');
      return eq(r.hasEscape, true, "hasEscape") ?? eq(r.hasExecution, false, "hasExecution");
    },
  },
  {
    id: "execution-only",
    description: "an execution call with no escape is still reported as execution",
    check: () => {
      const r = decodeOgnl('%{@java.lang.Runtime@getRuntime().exec("id")}');
      return eq(r.hasExecution, true, "hasExecution") ?? eq(r.hasEscape, false, "hasEscape");
    },
  },
  {
    id: "both-halves",
    description: "escape plus execution is reported as a genuine attempt",
    check: () => {
      const r = decodeOgnl(
        '%{(#_memberAccess["allowStaticMethodAccess"]=true).(@java.lang.Runtime@getRuntime().exec("id"))}',
      );
      return (
        eq(r.hasEscape, true, "hasEscape") ??
        eq(r.hasExecution, true, "hasExecution") ??
        (r.summary.includes("both halves") ? null : "summary should name both halves")
      );
    },
  },
  {
    id: "multipart-advisory",
    description: "the 2017 Content-Type shape matches its advisory family",
    check: () => {
      const r = decodeOgnl('Content-Type: multipart/form-data %{(#test=1)}');
      return r.advisories.some((a) => a.id.includes("CVE-2017-5638"))
        ? null
        : "expected the 2017 multipart advisory to match";
    },
  },
  {
    id: "redirect-advisory",
    description: "a redirect prefix matches the namespace/result family",
    check: () => {
      const r = decodeOgnl("redirect:%{1}");
      return r.advisories.some((a) => a.id.includes("CVE-2018-11776"))
        ? null
        : "expected the redirect advisory to match";
    },
  },
  {
    id: "caveats-always",
    description: "every non-empty reading carries its caveats",
    check: () => {
      const r = decodeOgnl("%{1}");
      return r.caveats.length >= 3 ? null : `expected >=3 caveats, got ${r.caveats.length}`;
    },
  },
  {
    id: "never-evaluates",
    description: "arithmetic in the payload is described, never computed",
    check: () => {
      const r = decodeOgnl("%{7*6}");
      const text = JSON.stringify(r);
      return text.includes("42") ? "the decoder appears to have evaluated the expression" : null;
    },
  },
  {
    id: "deterministic",
    description: "the same input always produces the same reading",
    check: () => {
      const p = '%{(#_memberAccess["allowStaticMethodAccess"]=true)}';
      return JSON.stringify(decodeOgnl(p)) === JSON.stringify(decodeOgnl(p))
        ? null
        : "output is not deterministic";
    },
  },
  {
    id: "fragment-bounded",
    description: "a very long fragment is truncated rather than echoed whole",
    check: () => {
      const r = decodeOgnl("%{" + "A".repeat(500) + "}");
      const tooLong = r.findings.find((f) => f.fragment.length > 130);
      return tooLong ? "a fragment exceeded the display bound" : null;
    },
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: string[] } {
  const failed: string[] = [];
  for (const v of VECTORS) {
    const err = v.check();
    if (err) failed.push(`${v.id}: ${err}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failed.length, failed };
}
