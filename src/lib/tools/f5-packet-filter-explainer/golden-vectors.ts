// ============================================================================
// src/lib/tools/f5-packet-filter-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the tmsh parser field by field, the mandatory-attribute
// checks, the duplicate-order hard issue, the man page's own worked order
// sequence (500,100,300,200,201 -> 100,200,201,300,500), empty-rule
// matches-ALL + shadow detection with VLAN-scope awareness, the BPF-subset
// evaluator in every supported primitive plus the honest cannot-evaluate
// stop, simulator outcomes including ARP exemption and the unhandled
// default, and the always-on context notes.
// ============================================================================

import { run, evalExpression, parsePacket } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-packet-filter-explainer-golden-v1";

const MGMT = `create packet-filter management_ssh {
    order 10
    action accept
    logging enabled
    rule " (proto TCP) and (src host 172.19.254.10) and (dst port 22) "
}`;

// tmsh list form of the man page's examples.
const CFG = `net packet-filter spoof_blocker {
    order 5
    action discard
    vlan external
    logging enabled
    rule "(src net 172.19.255.0/24)"
}
net packet-filter management_ssh {
    order 10
    action accept
    logging enabled
    rule "(proto TCP) and (src host 172.19.254.10) and (dst port 22)"
}
net packet-filter virtuals {
    order 20
    action accept
    vlan external
    rule "(dst host 172.19.254.80)"
}`;

export interface PfVector {
  id: string;
  description: string;
  input?: string;
  expr?: { e: string; pkt: string; want: true | false | "unknown" };
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectRuleField?: { name: string; field: "order" | "action" | "vlan" | "rule"; value: unknown };
  expectIssueIncludes?: { name: string; text: string };
  expectNoteIncludes?: { name: string; text: string };
  expectWalkFirst?: string;
  expectWalkOrder?: number[];
  expectContextIncludes?: string;
  expectOutcomeIncludes?: string;
  expectStepVerdict?: { rule: string; verdict: string };
}

export const PF_VECTORS: PfVector[] = [
  { id: "parse-fields", description: "All fields parse from the man page example", input: CFG, expectOk: true, expectRuleField: { name: "spoof_blocker", field: "vlan", value: "external" } },
  { id: "parse-action", description: "action enum parses", input: CFG, expectOk: true, expectRuleField: { name: "spoof_blocker", field: "action", value: "discard" } },
  { id: "parse-order", description: "order integer parses", input: CFG, expectOk: true, expectRuleField: { name: "management_ssh", field: "order", value: 10 } },
  { id: "missing-order", description: "Missing order raises the required/unique issue", input: 'net packet-filter x {\n    action accept\n    rule ""\n}', expectOk: true, expectIssueIncludes: { name: "x", text: "required" } },
  { id: "missing-action", description: "Missing action raises the no-default issue", input: 'net packet-filter x {\n    order 5\n    rule ""\n}', expectOk: true, expectIssueIncludes: { name: "x", text: "no default" } },
  { id: "missing-rule", description: "Missing rule attribute raises the mandatory issue", input: "net packet-filter x {\n    order 5\n    action accept\n}", expectOk: true, expectIssueIncludes: { name: "x", text: "mandatory" } },
  { id: "invalid-action", description: "Unknown action names the enum", input: 'net packet-filter x {\n    order 5\n    action allow\n    rule ""\n}', expectOk: true, expectIssueIncludes: { name: "x", text: "accept | continue | discard | reject" } },
  { id: "empty-rule-note", description: "Empty expression gets the matches-ALL note", input: 'net packet-filter x {\n    order 5\n    action accept\n    rule ""\n}', expectOk: true, expectNoteIncludes: { name: "x", text: "matches ALL" } },
  { id: "dup-order", description: "Duplicate order is a hard issue per the man page", input: 'net packet-filter a {\n    order 5\n    action accept\n    rule ""\n}\nnet packet-filter b {\n    order 5\n    action accept\n    rule "tcp"\n}', expectOk: true, expectIssueIncludes: { name: "b", text: "unique" } },
  { id: "manpage-order-walk", description: "500,100,300,200,201 walks as 100,200,201,300,500", input: [500, 100, 300, 200, 201].map((o, i) => `net packet-filter r${i} {\n    order ${o}\n    action continue\n    rule "tcp"\n}`).join("\n"), expectOk: true, expectWalkOrder: [100, 200, 201, 300, 500] },
  { id: "shadow-all-vlans", description: "Empty terminal rule on all VLANs shadows everything after", input: 'net packet-filter allow_all {\n    order 1\n    action accept\n    rule ""\n}\nnet packet-filter later {\n    order 2\n    action discard\n    rule "tcp"\n}', expectOk: true, expectIssueIncludes: { name: "later", text: "Unreachable" } },
  { id: "shadow-vlan-scoped", description: "VLAN-scoped matcher does not shadow other VLANs", input: 'net packet-filter ext_all {\n    order 1\n    action accept\n    vlan external\n    rule ""\n}\nnet packet-filter int_rule {\n    order 2\n    action discard\n    vlan internal\n    rule "tcp"\n}', expectOk: true, expectRuleField: { name: "int_rule", field: "action", value: "discard" } },
  { id: "context-trusted", description: "Trusted-precedes-rules context always present", input: CFG, expectOk: true, expectContextIncludes: "impossible to override" },
  { id: "context-master", description: "Master-switch-off context always present", input: CFG, expectOk: true, expectContextIncludes: "allows all traffic by default" },
  { id: "context-mgmt", description: "Management-interface exclusion present", input: CFG, expectOk: true, expectContextIncludes: "management interface" },
  { id: "sim-terminal-discard", description: "Spoofed source hits the blocker: discard, walk stops", input: CFG + "\nsim: tcp src 172.19.255.7 dst 1.2.3.4 dport 80 vlan external", expectOk: true, expectOutcomeIncludes: "spoof_blocker" },
  { id: "sim-vlan-skip", description: "external-scoped rules skip an internal packet", input: CFG + "\nsim: tcp src 172.19.255.7 dst 1.2.3.4 dport 80 vlan internal", expectOk: true, expectStepVerdict: { rule: "spoof_blocker", verdict: "vlan-skip" } },
  { id: "sim-unhandled", description: "No terminal match takes Unhandled Packet Action, default Accept", input: CFG + "\nsim: udp src 8.8.8.8 dst 9.9.9.9 dport 5000 vlan internal", expectOk: true, expectOutcomeIncludes: "default Accept" },
  { id: "sim-arp-exempt", description: "ARP is exempt before any rule", input: CFG + "\nsim: arp vlan external", expectOk: true, expectOutcomeIncludes: "before any rule" },
  { id: "sim-honest-stop", description: "Unsupported primitive stops the simulation honestly", input: 'net packet-filter weird {\n    order 1\n    action accept\n    rule "ether host 0:0:0:0:0:1"\n}\nnet packet-filter next {\n    order 2\n    action discard\n    rule "tcp"\n}\nsim: tcp src 1.1.1.1 dst 2.2.2.2 dport 80', expectOk: true, expectOutcomeIncludes: "stops honestly" },
  // Expression evaluator unit vectors.
  { id: "e-host-src", description: "src host matches", expr: { e: "src host 172.19.254.10", pkt: "tcp src 172.19.254.10 dst 1.2.3.4", want: true } },
  { id: "e-net", description: "src net CIDR matches", expr: { e: "(src net 172.19.255.0/24)", pkt: "tcp src 172.19.255.99 dst 1.2.3.4", want: true } },
  { id: "e-port-dst", description: "dst port matches dport", expr: { e: "dst port 22", pkt: "tcp src 1.1.1.1 dst 2.2.2.2 dport 22", want: true } },
  { id: "e-proto-form", description: "F5's (proto TCP) form evaluates", expr: { e: "(proto TCP) and (dst port 443)", pkt: "tcp src 1.1.1.1 dst 2.2.2.2 dport 443", want: true } },
  { id: "e-not", description: "not inverts", expr: { e: "not dst port 80", pkt: "tcp src 1.1.1.1 dst 2.2.2.2 dport 80", want: false } },
  { id: "e-or", description: "or across hosts", expr: { e: "src host 10.0.0.1 or src host 10.0.0.2", pkt: "tcp src 10.0.0.2 dst 2.2.2.2", want: true } },
  { id: "e-unknown", description: "Unsupported primitive returns unknown", expr: { e: "ether proto 0x806", pkt: "tcp src 1.1.1.1 dst 2.2.2.2", want: "unknown" } },
  { id: "e-unknown-poisons", description: "An unknown primitive poisons the whole expression conservatively (segmentation of unknown primitives cannot be trusted), even beside a false term", expr: { e: "dst port 99 and ether host 0:0:0:0:0:1", pkt: "tcp src 1.1.1.1 dst 2.2.2.2 dport 80", want: "unknown" } },
  { id: "e-and-false", description: "false short-circuits AND when every primitive is in the evaluated subset", expr: { e: "tcp and dst port 99", pkt: "udp src 1.1.1.1 dst 2.2.2.2 dport 80", want: false } },
  { id: "error-empty", description: "Empty input teaches the shapes", input: " ", expectOk: false, expectErrorIncludes: "sim:" },
  { id: "error-no-stanzas", description: "No stanzas explains", input: "ltm virtual x { }", expectOk: false, expectErrorIncludes: "net packet-filter" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of PF_VECTORS) {
    if (v.expr) {
      const got = evalExpression(v.expr.e, parsePacket(v.expr.pkt));
      if (got !== v.expr.want) failures.push(`${v.id}: eval ${String(got)} want ${String(v.expr.want)}`);
      continue;
    }
    try {
      const r = run(v.input!);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      const byName = (n: string) => r.rules.find((x) => x.name === n);
      if (v.expectRuleField) {
        const rule = byName(v.expectRuleField.name);
        if ((rule as any)?.[v.expectRuleField.field] !== v.expectRuleField.value) failures.push(`${v.id}: field ${String((rule as any)?.[v.expectRuleField.field])}`);
      }
      if (v.expectIssueIncludes) {
        const rule = byName(v.expectIssueIncludes.name);
        if (!rule?.issues.some((x) => x.includes(v.expectIssueIncludes!.text))) failures.push(`${v.id}: issues [${rule?.issues.join(";")}]`);
      }
      if (v.expectNoteIncludes) {
        const rule = byName(v.expectNoteIncludes.name);
        if (!rule?.notes.some((x) => x.includes(v.expectNoteIncludes!.text))) failures.push(`${v.id}: notes missing`);
      }
      if (v.expectWalkOrder) {
        const got = r.rules.map((x) => x.order);
        if (JSON.stringify(got) !== JSON.stringify(v.expectWalkOrder)) failures.push(`${v.id}: walk ${got.join(",")}`);
      }
      if (v.expectContextIncludes && !r.contextNotes.some((c) => c.includes(v.expectContextIncludes!))) failures.push(`${v.id}: context missing`);
      if (v.expectOutcomeIncludes && !(r.simulation?.outcome ?? "").includes(v.expectOutcomeIncludes)) failures.push(`${v.id}: outcome "${r.simulation?.outcome}"`);
      if (v.expectStepVerdict) {
        const st = r.simulation?.steps.find((s) => s.ruleName === v.expectStepVerdict!.rule);
        if (st?.verdict !== v.expectStepVerdict.verdict) failures.push(`${v.id}: step ${st?.verdict}`);
      }
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg`);
    }
  }
  return failures;
}
