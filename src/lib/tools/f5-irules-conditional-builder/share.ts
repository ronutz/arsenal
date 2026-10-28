// ============================================================================
// src/lib/tools/f5-irules-conditional-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules if / switch / class builder (posture
// "input"): the page is a form with nothing to paste, so a link carries named
// values only (ROLLOUT section 11.3), no "input":
//
//   subject  path, uri, host, query or header (the request value decided on)
//   header   the header's name (only when the subject is header)
//   lower    1 when the value is compared in lower case, else 0
//   rules    the rules in order, as a Tcl list of {comparison value pool}
//            lists (the tool's own world: formatList / parseList of the
//            shared Tcl 8.4 engine), e.g. {starts_with /api api_pool}
//   default  the pool when nothing matches (left out when empty)
//   group    the data group name (left out when empty)
//   test     the test value (left out when empty)
//
// Pool, data group and header names are the reader's own; the standard
// warning says that anyone with the link can read them.
//
// Arrival: the form is replaced as typing would (a field the link does not
// carry is emptied; a header subject without a name gets User-Agent, the
// page's own), and the three forms are generated. An unknown subject or
// comparison, a rules value that is not a list of three-element lists, more
// than 50 rules, a value longer than the page allows, or a header name with
// another subject makes the whole share malformed: ignored, never half
// applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { formatList, parseList } from "../../tcl84/list"; // Tcl 8.4 lists, the rules' text form
import type { ConditionalBuilderInput, Rule, RuleOp, Subject } from "./compute"; // the engine's input

/** The comparisons a rule can use. */
const OPS: readonly RuleOp[] = ["equals", "starts_with", "ends_with", "contains", "glob"]; // the page's menu
/** The request values a decision can be about. */
const SUBJECTS: readonly Subject[] = ["path", "uri", "host", "query", "header"]; // the page's menu
/** The engine's own bounds (compute.ts: limitInput), so a link never fills more than the page computes. */
const MAX = { rules: 50, value: 500, pool: 200, test: 2000, name: 200 } as const; // rules, a rule value, a pool, the test value, a name

/** The state: the engine's input, with the header name always present. */
export type ConditionalBuilderShareState = Required<Pick<ConditionalBuilderInput, "subject" | "headerName" | "lowercase" | "rules" | "defaultPool" | "testValue" | "dataGroup">>;

/**
 * The rules as one Tcl list of three-element lists.
 * @param rules the rules
 * @returns e.g. "{starts_with /api api_pool} {equals /login login_pool}"
 */
export function rulesText(rules: readonly Rule[]): string {
  return formatList(rules.map((r) => formatList([r.op, r.value, r.pool]))); // Tcl's own quoting
} // rulesText

/**
 * Read the rules back, strictly.
 * @param text the rules value
 * @returns the rules, or null when it is not a list of known three-element rules within the bounds
 */
function readRules(text: string): Rule[] | null {
  try { // parseList throws on a list Tcl would refuse
    const items = parseList(text); // the outer list (throws on unbalanced braces)
    if (items.length === 0 || items.length > MAX.rules) return null; // one rule at least, 50 at most
    const out: Rule[] = []; // the rules
    for (const item of items) { // each rule
      const parts = parseList(item); // its three elements
      if (parts.length !== 3) return null; // comparison, value, pool
      const [op, value, pool] = parts; // named
      if (!OPS.includes(op as RuleOp) || value.length > MAX.value || pool.length > MAX.pool) return null; // unknown or too long
      out.push({ op: op as RuleOp, value, pool }); // kept
    } // for
    return out; // the rules
  } catch { // not a list
    return null; // not a Tcl list
  } // try
} // readRules

/** The spec. */
export const IRULES_CONDITIONAL_BUILDER_SHARE: ShareSpec<ConditionalBuilderShareState> = Object.freeze({
  tool: "f5-irules-conditional-builder", // the slug
  posture: "input", // the form as filled in
  carriesKey: "share.carries", // tools.f5-irules-conditional-builder.share.carries
  names: ["subject", "header", "lower", "rules", "default", "group", "test"], // #subject=path&lower=1&rules=...
  /** The whole decision; nothing while every rule and the test value are empty (the page after Clear). */
  encode(s: ConditionalBuilderShareState): ShareEncoding {
    if (s.rules.every((r) => r.value === "" && r.pool === "") && s.testValue === "") return { ok: false, reason: "empty" } as const; // nothing typed
    const p: Record<string, string> = { subject: s.subject, lower: s.lowercase ? "1" : "0", rules: rulesText(s.rules) }; // always
    if (s.subject === "header" && s.headerName !== "") p.header = s.headerName; // the header's name (an empty one cannot travel: the page's own default fills it)
    if (s.defaultPool !== "") p.default = s.defaultPool; // the default pool
    if (s.dataGroup !== "") p.group = s.dataGroup; // the data group
    if (s.testValue !== "") p.test = s.testValue; // the test value
    return { ok: true, params: p } as const; // the decision
  },
  /** A known subject, a well-formed rules list, a switch value, names within the page's bounds. */
  decode(v: Readonly<Record<string, string | null>>): ConditionalBuilderShareState | null {
    const subject = v.subject ?? null; // required
    if (subject === null || !SUBJECTS.includes(subject as Subject)) return null; // absent or unknown: malformed
    const rules = v.rules ? readRules(v.rules) : null; // required
    if (rules === null) return null; // absent or malformed
    const lower = v.lower ?? "0"; // absent: off
    if (lower !== "1" && lower !== "0") return null; // not a switch value
    const header = v.header ?? null; // only for a header subject
    if (header !== null && subject !== "header") return null; // a header name with another subject
    const s: ConditionalBuilderShareState = { subject: subject as Subject, headerName: header ?? "User-Agent", lowercase: lower === "1", rules, defaultPool: v.default ?? "", dataGroup: v.group ?? "", testValue: v.test ?? "" }; // absent fields at their defaults
    if ([s.headerName, s.defaultPool, s.dataGroup].some((x) => x.length > MAX.name) || s.testValue.length > MAX.test) return null; // longer than the page allows
    return s; // the decision
  },
});
