// ============================================================================
// src/lib/share/cases/f5-irules-conditional-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules if / switch / class builder: the decision goes by
// name, the rules as a Tcl list of {comparison value pool} lists; an unknown
// subject or comparison, a malformed rules list, a misplaced header name or a
// value longer than the page allows makes the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_CONDITIONAL_BUILDER_SHARE, type ConditionalBuilderShareState } from "../../tools/f5-irules-conditional-builder/share"; // the spec and its state

/** The page's Example (the longest-vs-first vector), with the page's header-name default. */
const EXAMPLE: ConditionalBuilderShareState = { subject: "path", headerName: "User-Agent", lowercase: true, rules: [{ op: "starts_with", value: "/api", pool: "api_pool" }, { op: "starts_with", value: "/api/v2", pool: "api_v2_pool" }, { op: "equals", value: "/login", pool: "login_pool" }], defaultPool: "web_pool", testValue: "/api/v2/users", dataGroup: "path_pools" }; // verbatim
/** A header decision whose values hold spaces, braces and a semicolon. */
const HEADER: ConditionalBuilderShareState = { subject: "header", headerName: "X-Client Type", lowercase: false, rules: [{ op: "contains", value: "Mozilla/5.0 (X11; Linux)", pool: "desktop_pool" }, { op: "glob", value: "*{bot}*", pool: "" }], defaultPool: "", testValue: "Mozilla/5.0 (X11; Linux) x", dataGroup: "" }; // Tcl list quoting at work

/** The cases. */
export const IRULES_CONDITIONAL_BUILDER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<ConditionalBuilderShareState, ConditionalBuilderShareState>>({ // typed, so the cases check as one list
  spec: IRULES_CONDITIONAL_BUILDER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "longest-vs-first", state: EXAMPLE, params: { subject: "path", lower: "1", rules: "{starts_with /api api_pool} {starts_with /api/v2 api_v2_pool} {equals /login login_pool}", default: "web_pool", group: "path_pools", test: "/api/v2/users" }, restored: EXAMPLE }, // the page's Example
    { id: "header-quoting", state: HEADER, params: { subject: "header", header: "X-Client Type", lower: "0", rules: "{contains {Mozilla/5.0 (X11; Linux)} desktop_pool} {glob *{bot}* {}}", test: "Mozilla/5.0 (X11; Linux) x" }, restored: HEADER }, // spaces, braces, an empty pool; empty fields left out
  ],
  arrive: [ // decode only
    { id: "defaults", values: { subject: "header", rules: "{equals curl/8.0 tools_pool}" }, restored: { subject: "header", headerName: "User-Agent", lowercase: false, rules: [{ op: "equals", value: "curl/8.0", pool: "tools_pool" }], defaultPool: "", testValue: "", dataGroup: "" } }, // lower off, the page's header name, the rest empty
  ],
  empty: [ // nothing to share
    { id: "cleared", state: { ...EXAMPLE, rules: [{ op: "equals", value: "", pool: "" }], testValue: "" } }, // after Clear
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-subject", values: { subject: "cookie", rules: "{equals a p}" } }, // not offered
    { id: "subject-absent", values: { rules: "{equals a p}" } }, // required
    { id: "rules-absent", values: { subject: "path" } }, // required
    { id: "unbalanced-list", values: { subject: "path", rules: "{equals /a p" } }, // not a Tcl list
    { id: "two-elements", values: { subject: "path", rules: "{equals /a}" } }, // comparison, value, pool
    { id: "unknown-comparison", values: { subject: "path", rules: "{matches_regex /a p}" } }, // not offered
    { id: "header-with-path", values: { subject: "path", header: "Host", rules: "{equals /a p}" } }, // a header name with another subject
    { id: "lower-word", values: { subject: "path", lower: "yes", rules: "{equals /a p}" } }, // not 1 or 0
    { id: "too-many-rules", values: { subject: "path", rules: Array.from({ length: 51 }, (_, i) => `{equals /r${i} p}`).join(" ") } }, // 50 at most
    { id: "value-too-long", values: { subject: "path", rules: `{equals ${"a".repeat(501)} p}` } }, // 500 characters at most
  ],
}));
