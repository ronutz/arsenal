// ============================================================================
// src/lib/tools/f5-awaf-evasion-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF evasion-technique explainer. The reference-mode
// expectations are pinned to F5's OWN eight-row Evasion Techniques Sub-Violations
// table (BIG-IP ASM 17.5 "Working with Violations", updated 2026-02-26, the
// current form of K7929). The policy-mode inputs use field names and values
// taken verbatim from the F5 Declarative WAF schema's
// `blocking-settings.evasions` section: the `description` enum members, the
// boolean `enabled`, and `maxDecodingPasses` with its documented 2..5 bound.
// Each check asserts on the derived decode, never on internal representation.
// ============================================================================

import { explainEvasions, EVASION_TECHNIQUES, PASS_MAX } from "./compute";

export const SET_ID = "f5-awaf-evasion-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}

function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

export const VECTORS: readonly Vector[] = [
  {
    id: "reference-all-eight",
    description: "'evasions' lists exactly F5's eight sub-violations, all default-enabled",
    check: () => {
      const r = explainEvasions("evasions");
      return (
        expect(r !== null && r.mode === "reference", "not reference mode") ??
        expect(r!.cards.length === 8, `cards=${r!.cards.length} want 8`) ??
        expect(r!.cards.every((c) => c.defaultEnabled === true), "a card is not default-enabled") ??
        expect(r!.cards[0].name === "%u decoding" && r!.cards[7].name === "Multiple decoding", "order != table order")
      );
    },
  },
  {
    id: "reference-single-name",
    description: "a bare sub-violation name resolves to its single card",
    check: () => {
      const r = explainEvasions("Bare byte decoding");
      return (
        expect(r !== null && r.mode === "reference", "not reference mode") ??
        expect(r!.cards.length === 1 && r!.cards[0].key === "bare-byte", "did not resolve bare-byte")
      );
    },
  },
  {
    id: "reference-name-normalized",
    description: "name lookup is space/case/percent-insensitive ('%u decoding' via 'u decoding')",
    check: () => {
      const r = explainEvasions("multiple decoding");
      return (
        expect(r !== null && r!.cards.length === 1 && r!.cards[0].key === "multi-decode", "did not resolve multi-decode") ??
        expect(r!.cards[0].hasPassCount === true, "multi-decode missing pass-count flag")
      );
    },
  },
  {
    id: "policy-bare-array-disabled",
    description: "a bare evasions array reads a disabled sub-violation",
    check: () => {
      const input = JSON.stringify([
        { description: "Directory traversals", enabled: false },
        { description: "Bad unescape", enabled: true },
      ]);
      const r = explainEvasions(input);
      const dir = r?.states.find((s) => s.technique.key === "dir-traversal");
      const bad = r?.states.find((s) => s.technique.key === "bad-unescape");
      const unset = r?.states.find((s) => s.technique.key === "apache-ws");
      return (
        expect(r !== null && r.mode === "policy", "not policy mode") ??
        expect(dir?.enabled === false, "dir-traversal not read as disabled") ??
        expect(bad?.enabled === true, "bad-unescape not read as enabled") ??
        expect(unset?.enabled === null, "unset technique not reported as null") ??
        expect(r!.notes.some((n) => n.kind === "disabled-present"), "missing disabled-present note")
      );
    },
  },
  {
    id: "policy-full-wrapper-passes",
    description: "a full policy wrapper reads Multiple-decoding passes and flags a raise",
    check: () => {
      const input = JSON.stringify({
        policy: {
          "blocking-settings": {
            evasions: [{ description: "Multiple decoding", enabled: true, maxDecodingPasses: 5 }],
          },
        },
      });
      const r = explainEvasions(input);
      const md = r?.states.find((s) => s.technique.key === "multi-decode");
      return (
        expect(r !== null && r.mode === "policy", "not policy mode") ??
        expect(md?.passes === 5, `passes=${md?.passes} want 5`) ??
        expect(r!.notes.some((n) => n.kind === "passes-raised" && (n as { value: number }).value === 5), "missing passes-raised note")
      );
    },
  },
  {
    id: "policy-passes-out-of-range",
    description: "a pass count above the schema max is flagged out-of-range",
    check: () => {
      const input = JSON.stringify([{ description: "Multiple decoding", enabled: true, maxDecodingPasses: PASS_MAX + 3 }]);
      const r = explainEvasions(input);
      return expect(
        r !== null && r.notes.some((n) => n.kind === "passes-out-of-range"),
        "out-of-range pass count not flagged",
      );
    },
  },
  {
    id: "policy-learn-gated",
    description: "learn=false on VIOL_EVASION surfaces the learn-gated note",
    check: () => {
      const input = JSON.stringify({
        "blocking-settings": {
          violations: [{ name: "VIOL_EVASION", learn: false, alarm: true, block: true }],
          evasions: [{ description: "%u decoding", enabled: true }],
        },
      });
      const r = explainEvasions(input);
      return (
        expect(r !== null && r!.learnEnabled === false, "learnEnabled not read as false") ??
        expect(r!.notes.some((n) => n.kind === "learn-gated"), "missing learn-gated note")
      );
    },
  },
  {
    id: "policy-no-evasions-block",
    description: "JSON without an evasions array is reported, not guessed",
    check: () => {
      const r = explainEvasions(JSON.stringify({ policy: { name: "x" } }));
      return expect(
        r !== null && r.notes.some((n) => n.kind === "no-evasions-block"),
        "no-evasions-block not reported",
      );
    },
  },
  {
    id: "policy-parse-error",
    description: "malformed JSON yields a parse-error note, never a throw",
    check: () => {
      const r = explainEvasions("{ evasions: [ ");
      return expect(r !== null && r.notes.some((n) => n.kind === "parse-error"), "parse-error not reported");
    },
  },
  {
    id: "coverage-eight",
    description: "the technique table has exactly eight entries",
    check: () => expect(EVASION_TECHNIQUES.length === 8, `techniques=${EVASION_TECHNIQUES.length} want 8`),
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
