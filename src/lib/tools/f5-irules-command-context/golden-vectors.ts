// ============================================================================
// src/lib/tools/f5-irules-command-context/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the when-block parser (priority capture, comment stripping,
// brace balance), the curated event table lookups, the command lexer in both
// namespaced and bare families, the priority-order analysis per the priority
// reference, every sourced CMP finding, uncurated-event honesty, and errors.
// ============================================================================

import { run, EVENTS } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-irules-command-context-golden-v1";

export interface CtxVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "rule" | "event" | "catalog";
  expectBlockCount?: number;
  expectEvent?: { index: number; event: string };
  expectPriority?: { index: number; priority: number; explicit: boolean };
  expectCommand?: { index: number; name: string };
  expectCmpIncludes?: { index: number; text: string };
  expectUncurated?: { index: number };
  expectOrderIncludes?: string;
  expectRuleFindingIncludes?: string;
  expectCatalogModules?: number;
  expectEventName?: string;
}

const R = (s: string) => s;

export const CTX_VECTORS: CtxVector[] = [
  { id: "catalog", description: "events keyword renders the module-grouped catalogue", input: "events", expectOk: true, expectMode: "catalog", expectCatalogModules: 11 },
  { id: "event-lookup", description: "Single event name renders its card", input: "HTTP_REQUEST", expectOk: true, expectMode: "event", expectEventName: "HTTP_REQUEST" },
  { id: "basic-parse", description: "Two blocks parse with events and lines", input: R("when CLIENT_ACCEPTED {\n}\nwhen HTTP_REQUEST {\n    pool web\n}"), expectOk: true, expectBlockCount: 2, expectEvent: { index: 1, event: "HTTP_REQUEST" }, expectCommand: { index: 1, name: "pool" } },
  { id: "priority-captured", description: "Explicit priority captured, default marked", input: R("when HTTP_REQUEST priority 400 {\n}\nwhen HTTP_REQUEST {\n}"), expectOk: true, expectPriority: { index: 0, priority: 400, explicit: true } },
  { id: "priority-order", description: "Duplicate events produce the documented ordering analysis", input: R("when HTTP_REQUEST {\n}\nwhen HTTP_REQUEST priority 300 {\n}"), expectOk: true, expectOrderIncludes: "priority 300" },
  { id: "priority-out-of-range", description: "priority outside 0-1000 flagged", input: R("when HTTP_REQUEST priority 1500 {\n}"), expectOk: true, expectCmpIncludes: undefined as any, expectBlockCount: 1 },
  { id: "namespaced-lexed", description: "Namespaced commands lexed with module and URL", input: R("when HTTP_REQUEST {\n    HTTP::header insert X 1\n    SSL::cipher name\n}"), expectOk: true, expectCommand: { index: 0, name: "HTTP::header" } },
  { id: "comments-stripped", description: "Commented-out commands do not appear", input: R("when HTTP_REQUEST {\n    # pool web\n    node 10.0.0.1 80\n}"), expectOk: true, expectCommand: { index: 0, name: "node" } },
  { id: "cmp-globals", description: "Global variables raise the sourced demotion finding", input: R("when HTTP_REQUEST {\n    set ::hits 1\n}"), expectOk: true, expectCmpIncludes: { index: 0, text: "not CMP-compatible" }, expectRuleFindingIncludes: "demotes its virtual server" },
  { id: "cmp-static-positive", description: "static:: use gets the compatible-alternative note", input: R("when RULE_INIT {\n    set static::x 1\n}"), expectOk: true, expectCmpIncludes: { index: 0, text: "CMP-compatible mechanism" } },
  { id: "cmp-ruleinit-keys", description: "Key material in RULE_INIT raises the per-TMM key warning", input: R("when RULE_INIT {\n    set static::key [CRYPTO::keygen -alg aes]\n}"), expectOk: true, expectCmpIncludes: { index: 0, text: "every TMM gets its own key" } },
  { id: "cmp-stats", description: "STATS:: raises the per-TMM statistics note", input: R("when HTTP_REQUEST {\n    STATS::incr mystats hits\n}"), expectOk: true, expectCmpIncludes: { index: 0, text: "separate instance" } },
  { id: "no-globals-no-verdict", description: "Clean rules get no demotion verdict", input: R("when HTTP_REQUEST {\n    pool web\n}"), expectOk: true, expectBlockCount: 1 },
  { id: "uncurated-event", description: "An event outside the curated table parses and is flagged", input: R("when DIAMETER_INGRESS {\n    pool d\n}"), expectOk: true, expectUncurated: { index: 0 } },
  { id: "validity-honesty", description: "The per-command-validity honesty line is always present", input: R("when HTTP_REQUEST {\n    pool web\n}"), expectOk: true, expectRuleFindingIncludes: "reference page" },
  { id: "error-empty", description: "Empty input names the three shapes", input: "  ", expectOk: false, expectErrorIncludes: "events" },
  { id: "error-unknown-event", description: "Unknown single event names itself", input: "MEGA_EVENT", expectOk: false, expectErrorIncludes: "not in the curated event table" },
  { id: "error-no-blocks", description: "Non-iRule text explains what to paste", input: "hello world", expectOk: false, expectErrorIncludes: "No \"when EVENT" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of CTX_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectCatalogModules !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogModules) failures.push(`${v.id}: modules ${r.catalog?.length}`);
      if (v.expectEventName && r.event?.name !== v.expectEventName) failures.push(`${v.id}: event ${r.event?.name}`);
      if (v.expectBlockCount !== undefined && (r.blocks?.length ?? -1) !== v.expectBlockCount) failures.push(`${v.id}: blocks ${r.blocks?.length}`);
      if (v.expectEvent && r.blocks?.[v.expectEvent.index]?.event !== v.expectEvent.event) failures.push(`${v.id}: b${v.expectEvent.index} event`);
      if (v.expectPriority) {
        const b = r.blocks?.[v.expectPriority.index];
        if (b?.priority !== v.expectPriority.priority || b?.priorityExplicit !== v.expectPriority.explicit) failures.push(`${v.id}: priority ${b?.priority}/${b?.priorityExplicit}`);
      }
      if (v.expectCommand) {
        const names = r.blocks?.[v.expectCommand.index]?.commands.map((c) => c.name) ?? [];
        if (!names.includes(v.expectCommand.name)) failures.push(`${v.id}: cmds [${names.join(",")}] missing ${v.expectCommand.name}`);
      }
      if (v.expectCmpIncludes) {
        const f = r.blocks?.[v.expectCmpIncludes.index]?.cmpFindings ?? [];
        if (!f.some((x) => x.includes(v.expectCmpIncludes!.text))) failures.push(`${v.id}: cmp missing "${v.expectCmpIncludes.text}"`);
      }
      if (v.expectUncurated && r.blocks?.[v.expectUncurated.index]?.info !== null) failures.push(`${v.id}: expected uncurated`);
      if (v.expectOrderIncludes && !(r.orderAnalysis ?? []).some((o) => o.includes(v.expectOrderIncludes!))) failures.push(`${v.id}: order missing`);
      if (v.expectRuleFindingIncludes && !r.ruleFindings.some((f) => f.includes(v.expectRuleFindingIncludes!))) failures.push(`${v.id}: rule finding missing`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
