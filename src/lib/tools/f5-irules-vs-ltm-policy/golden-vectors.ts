// ============================================================================
// src/lib/tools/f5-irules-vs-ltm-policy/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the three-verdict classifier against the verified grammar
// sets, every named blocker, the verify-on-version bucket, the policy
// sketch, the strategies mode's verbatim semantics + precedence head, and
// the error paths.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-irules-vs-ltm-policy-golden-v1";

export interface PolVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "rule" | "strategies";
  expectVerdict?: { index: number; verdict: "policy-expressible" | "verify-on-version" | "irule-required" };
  expectBlockerIncludes?: { index: number; text: string };
  expectReasonIncludes?: { index: number; text: string };
  expectSketch?: { index: number; present: boolean };
  expectSummaryIncludes?: string;
  expectStrategyCount?: number;
  expectPrecedenceIncludes?: string;
}

export const POL_VECTORS: PolVector[] = [
  { id: "expressible-pool", description: "URI match + pool maps cleanly", input: "when HTTP_REQUEST {\n    if { [HTTP::uri] starts_with \"/api\" } {\n        pool api\n    }\n}", expectOk: true, expectVerdict: { index: 0, verdict: "policy-expressible" }, expectReasonIncludes: { index: 0, text: "forward-to-pool" }, expectSketch: { index: 0, present: true } },
  { id: "expressible-headerwrite", description: "Header replace maps onto the x-forwarded-for example", input: "when HTTP_REQUEST {\n    HTTP::header replace X-Forwarded-For 1\n}", expectOk: true, expectVerdict: { index: 0, verdict: "policy-expressible" }, expectReasonIncludes: { index: 0, text: "http-header replace" } },
  { id: "expressible-reset", description: "reject maps onto forward reset", input: "when HTTP_REQUEST {\n    if { [HTTP::uri] contains \"cmd.exe\" } {\n        reject\n    }\n}", expectOk: true, expectVerdict: { index: 0, verdict: "policy-expressible" }, expectReasonIncludes: { index: 0, text: "forward reset" } },
  { id: "verify-redirect", description: "HTTP::redirect lands in verify-on-version, not guessed", input: "when HTTP_REQUEST {\n    HTTP::redirect \"https://x\"\n}", expectOk: true, expectVerdict: { index: 0, verdict: "verify-on-version" }, expectReasonIncludes: { index: 0, text: "not demonstrated" } },
  { id: "blocker-event", description: "Non-HTTP event is iRule-required with the event blocker", input: "when CLIENT_ACCEPTED {\n    pool web\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "event CLIENT_ACCEPTED" } },
  { id: "blocker-table", description: "table state blocks", input: "when HTTP_REQUEST {\n    table set k v\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "shared-state store" } },
  { id: "blocker-loop", description: "Tcl loops block", input: "when HTTP_REQUEST {\n    foreach h [HTTP::header names] {\n        log local0. $h\n    }\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "single-shot" } },
  { id: "blocker-regex", description: "regexp blocks with the operand-list reason", input: "when HTTP_REQUEST {\n    if { [regexp {^/a} [HTTP::uri]] } { pool a }\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "starts-with" } },
  { id: "blocker-variables", description: "Local variables block with the no-variables reason", input: "when HTTP_REQUEST {\n    set p \"web\"\n    pool $p\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "no variables" } },
  { id: "blocker-sideband", description: "Sideband commands block", input: "when HTTP_REQUEST {\n    set c [connect -timeout 100 10.0.0.1:80]\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" } },
  { id: "blocker-collect", description: "Payload collection blocks", input: "when HTTP_REQUEST {\n    HTTP::collect 512\n}", expectOk: true, expectVerdict: { index: 0, verdict: "irule-required" }, expectBlockerIncludes: { index: 0, text: "collected bodies" } },
  { id: "mixed-summary", description: "Mixed rules summarize all three buckets", input: "when HTTP_REQUEST {\n    pool web\n}\nwhen HTTP_REQUEST {\n    HTTP::redirect \"https://x\"\n}\nwhen CLIENT_ACCEPTED {\n}", expectOk: true, expectSummaryIncludes: "map cleanly" },
  { id: "summary-lifecycle", description: "The draft-publish-attach mechanics line is always present", input: "when HTTP_REQUEST {\n    pool web\n}", expectOk: true, expectSummaryIncludes: "publish" },
  { id: "strategies-mode", description: "strategies keyword renders the three verbatim semantics", input: "strategies", expectOk: true, expectMode: "strategies", expectStrategyCount: 3, expectPrecedenceIncludes: "1 request tcp port" },
  { id: "error-empty", description: "Empty input names the shapes", input: " ", expectOk: false, expectErrorIncludes: "strategies" },
  { id: "error-no-blocks", description: "Non-iRule text explains", input: "ltm pool x { }", expectOk: false, expectErrorIncludes: "No \"when EVENT" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of POL_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectVerdict && r.blocks?.[v.expectVerdict.index]?.verdict !== v.expectVerdict.verdict) failures.push(`${v.id}: verdict ${r.blocks?.[v.expectVerdict.index]?.verdict}`);
      if (v.expectBlockerIncludes) {
        const b = r.blocks?.[v.expectBlockerIncludes.index]?.blockers ?? [];
        if (!b.some((x) => x.includes(v.expectBlockerIncludes!.text))) failures.push(`${v.id}: blockers [${b.join(";")}]`);
      }
      if (v.expectReasonIncludes) {
        const b = r.blocks?.[v.expectReasonIncludes.index]?.reasons ?? [];
        if (!b.some((x) => x.includes(v.expectReasonIncludes!.text))) failures.push(`${v.id}: reasons missing`);
      }
      if (v.expectSketch && Boolean(r.blocks?.[v.expectSketch.index]?.policySketch) !== v.expectSketch.present) failures.push(`${v.id}: sketch`);
      if (v.expectSummaryIncludes && !(r.summary ?? []).some((s) => s.includes(v.expectSummaryIncludes!))) failures.push(`${v.id}: summary missing`);
      if (v.expectStrategyCount !== undefined && (r.strategies?.length ?? -1) !== v.expectStrategyCount) failures.push(`${v.id}: strategies ${r.strategies?.length}`);
      if (v.expectPrecedenceIncludes && !(r.precedenceHead ?? []).some((p) => p.includes(v.expectPrecedenceIncludes!))) failures.push(`${v.id}: precedence missing`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg`);
    }
  }
  return failures;
}
