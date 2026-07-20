// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// p0f-signature-explainer / golden-vectors.ts
// ----------------------------------------------------------------------------
// Known-answer vectors. The reference signatures are the documented p0f v3
// database entries (p0f/docs/README and the shipped p0f.fp), so the expected
// parse and OS family are known INDEPENDENTLY of this tool's own logic.
// ============================================================================

import { analyzeP0f, parseP0f, P0fInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "p0f-signature-explainer-v1";

export interface P0fVector {
  id: string;
  input: string;
  expect: {
    ver?: string;
    ittl?: string;
    optionCount?: number;
    quirkCount?: number;
    osConfidence?: "exact" | "family" | "none";
    osIncludes?: string;
    errorIncludes?: string;
  };
}

export const GOLDEN_VECTORS: P0fVector[] = [
  // Linux 3.11+ (the canonical modern-Linux SYN)
  { id: "v1", input: "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0", expect: { ver: "4", ittl: "64", optionCount: 5, quirkCount: 2, osConfidence: "exact", osIncludes: "Linux" } },
  // Windows 10/11
  { id: "v2", input: "4:128:0:*:65535,8:mss,nop,ws,nop,nop,sok:df,id+:0", expect: { ver: "4", ittl: "128", optionCount: 6, quirkCount: 2, osConfidence: "exact", osIncludes: "Windows" } },
  // macOS / Darwin
  { id: "v3", input: "4:64:0:*:65535,6:mss,nop,ws,nop,nop,ts,sok,eol:df,id+:0", expect: { ver: "4", ittl: "64", optionCount: 8, osConfidence: "exact", osIncludes: "Darwin" } },
  // TTL with hop distance suffix
  { id: "v4", input: "4:64+8:0:1460:mss*10,0:mss,nop,nop,sok:df:0", expect: { ittl: "64+8", optionCount: 4, quirkCount: 1 } },
  // IPv6 both-version wildcard, family fallback
  { id: "v5", input: "*:64:0:*:mss*10,6:mss,ts,nop,ws:df:0", expect: { ver: "*", osConfidence: "family", osIncludes: "Linux" } },
  // Fixed window, no options
  { id: "v6", input: "4:255:0:*:4096,0::0+:0", expect: { ittl: "255", optionCount: 0, quirkCount: 1 } },
  // Errors
  { id: "e1", input: "4:64:0:*:mss*20:mss,ws:df:0", expect: { errorIncludes: "window field" } },
  { id: "e2", input: "4:64:0:*", expect: { errorIncludes: "8 colon-separated" } },
  { id: "e3", input: "9:64:0:*:1024,0:mss:df:0", expect: { errorIncludes: "version field" } },
  { id: "e4", input: "", expect: { errorIncludes: "Paste a p0f" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const a = analyzeP0f(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error but parsed`); continue; }
      if (v.expect.ver !== undefined && a.fields.ver !== v.expect.ver) failures.push(`${v.id}: ver ${a.fields.ver} != ${v.expect.ver}`);
      if (v.expect.ittl !== undefined && a.fields.ittl !== v.expect.ittl) failures.push(`${v.id}: ittl ${a.fields.ittl} != ${v.expect.ittl}`);
      if (v.expect.optionCount !== undefined && a.options.length !== v.expect.optionCount) failures.push(`${v.id}: options ${a.options.length} != ${v.expect.optionCount}`);
      if (v.expect.quirkCount !== undefined && a.quirks.length !== v.expect.quirkCount) failures.push(`${v.id}: quirks ${a.quirks.length} != ${v.expect.quirkCount}`);
      if (v.expect.osConfidence !== undefined && a.osHint.confidence !== v.expect.osConfidence) failures.push(`${v.id}: osConfidence ${a.osHint.confidence} != ${v.expect.osConfidence}`);
      if (v.expect.osIncludes !== undefined && !a.osHint.label.includes(v.expect.osIncludes)) failures.push(`${v.id}: osHint "${a.osHint.label}" lacks "${v.expect.osIncludes}"`);
    } catch (e) {
      if (!(e instanceof P0fInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error "${e.message}" lacks "${v.expect.errorIncludes}"`);
    }
  }
  // parse round-trip sanity
  try { parseP0f("4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0"); } catch { failures.push("parse: canonical Linux sig failed"); }
  return { pass: failures.length === 0, failures };
}
