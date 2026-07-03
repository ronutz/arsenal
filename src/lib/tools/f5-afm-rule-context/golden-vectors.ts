// ============================================================================
// src/lib/tools/f5-afm-rule-context/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the context order, accept-continues vs accept-decisively-
// terminates, drop/reject semantics per protocol, the ICMP-ignored rule at
// edge contexts, staging, rule-list expansion, the honest indeterminate stop,
// conflict (incl. the accept-vs-accept-decisively special case) and
// redundancy detection, default-action handling, the reference cards, and
// the error paths.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-afm-rule-context-golden-v1";

export interface AfmVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "walk" | "policy" | "contexts" | "actions";
  expectFinalIncludes?: string;
  expectStepCount?: number;
  expectStep?: { index: number; disposition: string; matchedRule?: string };
  expectStepNoteIncludes?: { index: number; text: string };
  expectSkippedIcmp?: { index: number; rule: string };
  expectFinding?: { kind: "conflicting" | "redundant"; rule: string; noteIncludes?: string };
  expectCards?: number;
}

const POLICY = (name: string, rules: string) => `security firewall policy ${name} {\n    rules {\n${rules}\n    }\n}`;
const RULE = (name: string, action: string, body = "") => `        ${name} {\n            action ${action}\n${body}\n        }`;
const SRC = (addr: string) => `            source {\n                addresses {\n                    ${addr}\n                }\n            }`;

const WALK_BASE = [
  POLICY("P_G", RULE("g_allow_all", "accept")),
  POLICY("P_RD", RULE("rd_allow", "accept")),
  POLICY("P_VS", RULE("vs_drop_evil", "drop", SRC("10.66.0.0/16")) + "\n" + RULE("vs_allow", "accept")),
  "context global {\n    policy P_G\n}",
  "context route-domain 0 {\n    policy P_RD\n}",
  "context virtual vs_web {\n    policy P_VS\n}",
].join("\n");

export const AFM_VECTORS: AfmVector[] = [
  { id: "cards-contexts", description: "contexts renders the four cards", input: "contexts", expectOk: true, expectMode: "contexts", expectCards: 4 },
  { id: "cards-actions", description: "actions renders the four cards", input: "actions", expectOk: true, expectMode: "actions", expectCards: 4 },
  { id: "accept-continues", description: "accept at global continues; drop at vs terminates", input: WALK_BASE + "\npacket src 10.66.1.5 dst 192.0.2.10:443 proto tcp", expectOk: true, expectMode: "walk", expectStepCount: 3, expectStep: { index: 0, disposition: "continue", matchedRule: "g_allow_all" }, expectFinalIncludes: "DROPPED at virtual vs_web by vs_drop_evil" },
  { id: "walk-order", description: "Contexts walk in the documented order regardless of paste order", input: ["context virtual vs_web {\n    policy P_VS\n}", "context global {\n    policy P_G\n}", POLICY("P_G", RULE("g", "accept")), POLICY("P_VS", RULE("v", "accept")), "packet src 10.0.0.1 dst 10.0.0.2 proto tcp"].join("\n"), expectOk: true, expectStep: { index: 0, disposition: "continue", matchedRule: "g" } },
  { id: "accept-decisively-skips", description: "accept-decisively at global ends the walk before the vs drop", input: [POLICY("P_G", RULE("g_ad", "accept-decisively", SRC("10.66.0.0/16"))), POLICY("P_VS", RULE("vs_drop", "drop")), "context global {\n    policy P_G\n}", "context virtual vs_web {\n    policy P_VS\n}", "packet src 10.66.1.5 dst 192.0.2.10:443 proto tcp"].join("\n"), expectOk: true, expectStepCount: 1, expectFinalIncludes: "PERMITTED at global by g_ad" },
  { id: "reject-tcp", description: "reject on tcp names the RST", input: [POLICY("P", RULE("r", "reject")), "context global {\n    policy P\n}", "packet src 1.1.1.1 dst 2.2.2.2:80 proto tcp"].join("\n"), expectOk: true, expectFinalIncludes: "TCP RST" },
  { id: "reject-udp", description: "reject on udp names the ICMP unreachable", input: [POLICY("P", RULE("r", "reject")), "context global {\n    policy P\n}", "packet src 1.1.1.1 dst 2.2.2.2:53 proto udp"].join("\n"), expectOk: true, expectFinalIncludes: "ICMP unreachable" },
  { id: "icmp-ignored-at-vs", description: "An ICMP rule on a virtual context is skipped with the manual's note", input: [POLICY("P_VS", RULE("icmp_block", "drop", "            ip-protocol icmp") + "\n" + RULE("allow", "accept")), "context virtual vs1 {\n    policy P_VS\n}", "packet src 1.1.1.1 dst 2.2.2.2 proto icmp"].join("\n"), expectOk: true, expectSkippedIcmp: { index: 0, rule: "icmp_block" }, expectStep: { index: 0, disposition: "continue", matchedRule: "allow" } },
  { id: "staged-logged-not-enforced", description: "A staged policy's match is reported but the walk continues", input: [POLICY("P_G", RULE("g_drop", "drop")), POLICY("P_VS", RULE("v_ok", "accept")), "context global {\n    policy P_G\n    staged\n}", "context virtual v {\n    policy P_VS\n}", "packet src 1.1.1.1 dst 2.2.2.2 proto tcp", "default-action accept"].join("\n"), expectOk: true, expectStepNoteIncludes: { index: 0, text: "STAGED match" }, expectFinalIncludes: "default-action accept" },
  { id: "rule-list-expansion", description: "A policy referencing a rule-list expands it in place", input: ["security firewall rule-list RL {\n    rules {\n" + RULE("rl_drop", "drop", SRC("10.0.0.0/8")) + "\n    }\n}", POLICY("P", "        use_rl {\n            rule-list RL\n        }"), "context global {\n    policy P\n}", "packet src 10.1.1.1 dst 2.2.2.2 proto tcp"].join("\n"), expectOk: true, expectFinalIncludes: "DROPPED at global by rl_drop" },
  { id: "indeterminate-honest", description: "A geo criterion stops the walk honestly", input: [POLICY("P", "        geo_rule {\n            action drop\n            source {\n                geo {\n                    BR\n                }\n            }\n        }"), "context global {\n    policy P\n}", "packet src 1.1.1.1 dst 2.2.2.2 proto tcp"].join("\n"), expectOk: true, expectFinalIncludes: "indeterminate at global" },
  { id: "no-default-unresolved", description: "No terminal match + no default-action explains the mode split", input: [POLICY("P", RULE("narrow", "drop", SRC("172.16.0.0/12"))), "context global {\n    policy P\n}", "packet src 10.0.0.1 dst 2.2.2.2 proto tcp"].join("\n"), expectOk: true, expectFinalIncludes: "Default Firewall Action" },
  { id: "policy-audit-conflict-ad", description: "accept covered by accept-decisively flagged with the manual's special note", input: POLICY("P", RULE("first_ad", "accept-decisively", SRC("10.0.0.0/8")) + "\n" + RULE("later_accept", "accept", SRC("10.1.0.0/16"))), expectOk: true, expectMode: "policy", expectFinding: { kind: "conflicting", rule: "later_accept", noteIncludes: "treated as conflicting" } },
  { id: "policy-audit-redundant", description: "Same action fully covered flagged redundant", input: POLICY("P", RULE("wide", "drop", SRC("10.0.0.0/8")) + "\n" + RULE("narrow", "drop", SRC("10.1.1.0/24"))), expectOk: true, expectFinding: { kind: "redundant", rule: "narrow" } },
  { id: "policy-audit-icmp-note", description: "Policy audit warns about ICMP rules destined for edge contexts", input: POLICY("P", RULE("ping_drop", "drop", "            ip-protocol icmp")), expectOk: true, expectMode: "policy" },
  { id: "error-both-edges", description: "Declaring both virtual and self-ip asks which one", input: [POLICY("P", RULE("r", "accept")), "context virtual v {\n    policy P\n}", "context self-ip s {\n    policy P\n}", "packet src 1.1.1.1 dst 2.2.2.2 proto tcp"].join("\n"), expectOk: false, expectErrorIncludes: "one or the other" },
  { id: "error-missing-rulelist", description: "An undefined rule-list names itself", input: [POLICY("P", "        x {\n            rule-list GHOST\n        }"), "context global {\n    policy P\n}", "packet src 1.1.1.1 dst 2.2.2.2 proto tcp"].join("\n"), expectOk: false, expectErrorIncludes: "GHOST" },
  { id: "error-no-packet", description: "Contexts without a packet ask for one", input: [POLICY("P", RULE("r", "accept")), "context global {\n    policy P\n}"].join("\n"), expectOk: false, expectErrorIncludes: "packet" },
  { id: "error-empty", description: "Empty input names the shapes", input: " ", expectOk: false, expectErrorIncludes: "contexts" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of AFM_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectCards !== undefined && (r.cards?.length ?? -1) !== v.expectCards) failures.push(`${v.id}: cards ${r.cards?.length}`);
      if (v.expectStepCount !== undefined && (r.steps?.length ?? -1) !== v.expectStepCount) failures.push(`${v.id}: steps ${r.steps?.length}`);
      if (v.expectStep) {
        const s = r.steps?.[v.expectStep.index];
        if (!s || s.disposition !== v.expectStep.disposition || (v.expectStep.matchedRule && s.matchedRule !== v.expectStep.matchedRule)) failures.push(`${v.id}: step ${JSON.stringify({ d: s?.disposition, m: s?.matchedRule })}`);
      }
      if (v.expectStepNoteIncludes) {
        const s = r.steps?.[v.expectStepNoteIncludes.index];
        if (!s || !s.notes.some((n) => n.includes(v.expectStepNoteIncludes!.text))) failures.push(`${v.id}: step note missing`);
      }
      if (v.expectSkippedIcmp) {
        const s = r.steps?.[v.expectSkippedIcmp.index];
        if (!s || !s.skippedIcmpRules.includes(v.expectSkippedIcmp.rule)) failures.push(`${v.id}: icmp skip missing`);
      }
      if (v.expectFinalIncludes && !(r.finalDisposition ?? "").includes(v.expectFinalIncludes)) failures.push(`${v.id}: final "${r.finalDisposition}"`);
      if (v.expectFinding) {
        const f = (r.findings ?? []).find((x) => x.kind === v.expectFinding!.kind && x.rule === v.expectFinding!.rule);
        if (!f) failures.push(`${v.id}: finding missing (${JSON.stringify(r.findings)})`);
        else if (v.expectFinding.noteIncludes && !f.note.includes(v.expectFinding.noteIncludes)) failures.push(`${v.id}: finding note`);
      }
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
