// ============================================================================
// src/lib/tools/f5-irules-conditional-builder/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES if / switch / class BUILDER: describe one decision ("send /api/
// to api_pool, /login to login_pool, everything else to web_pool") and get it
// written three ways - an if / elseif chain, a switch, and a class match on a
// data group (with the tmsh definition of the data group) - then watch a test
// value go through EACH generated rule in the interpreter, so you can see
// whether the three really agree.
//
// They do not always agree, and that is the lesson: if and switch take the
// FIRST rule that matches, in the order written; class match with
// starts_with or ends_with takes the LONGEST matching entry, whatever the
// order (F5's class reference says so). Rules that can never fire because an
// earlier rule always wins are flagged too.
//
// The generated code follows the DevCentral iRules Style Guide where it
// applies (4-space indents, `--` before a switch value, braced expressions).
// ============================================================================

import { formatElement } from "@/lib/tcl84/list";
import { runScript } from "@/lib/tcl84/interp";
import { irulesCommands, type Action, type DataGroup, type SampleRequest } from "@/lib/tcl84/irules";
import { globMatch } from "@/lib/tcl84/glob";
import { tclStringToLower } from "@/lib/tcl84/casemap";
import { TclError, limitInput } from "@/lib/tcl84/value";

/** How a rule compares the value. */
export type RuleOp = "equals" | "starts_with" | "ends_with" | "contains" | "glob";

/** One rule: when the value matches, use this pool. */
export interface Rule {
  // The comparison.
  op: RuleOp;
  // The value to compare with (a glob pattern for "glob").
  value: string;
  // The pool to select.
  pool: string;
}

/** Which request value the decision is about. */
export type Subject = "uri" | "path" | "host" | "query" | "header";

/** The input. */
export interface ConditionalBuilderInput {
  // The request value.
  subject: Subject;
  // The header name, when the subject is a header.
  headerName?: string;
  // Compare in lower case ([string tolower ...]).
  lowercase: boolean;
  // The rules, in priority order.
  rules: Rule[];
  // The pool when nothing matches.
  defaultPool: string;
  // The value to test the generated rules with.
  testValue: string;
  // The data group name for the class form.
  dataGroup: string;
}

/** One generated form and what it did with the test value. */
export interface Form {
  // "if", "switch" or "class".
  kind: "if" | "switch" | "class";
  // The iRule text.
  code: string;
  // The tmsh data-group definitions (class form only).
  tmsh?: string;
  // The pool the test value was sent to (null: no pool command ran).
  pool: string | null;
  // The error, if the generated rule failed.
  error?: string;
  // Why the form is not offered (e.g. glob rules have no class operator).
  unavailable?: string;
}

/** The builder's answer. */
export interface ConditionalBuilderResult {
  // The three forms.
  forms: Form[];
  // True when every available form chose the same pool.
  agree: boolean;
  // The rule that fires first in order (if / switch), as an index, or -1.
  firstRule: number;
  // Rules that can never fire because an earlier rule always matches first.
  shadowed: { rule: number; by: number }[];
  // Notes (codes the UI translates).
  notes: { code: string; params?: Record<string, string | number | boolean> }[];
}

/** The variable reference the generated code uses, braced as the style guide asks (R14). */
const VALUE = "${value}";

/** The command that reads the subject. */
function subjectCommand(input: ConditionalBuilderInput): string {
  // The base command.
  const base = input.subject === "header" ? `HTTP::header value ${formatElement(input.headerName || "X-Example")}` : `HTTP::${input.subject}`;
  // Optionally lower-cased.
  return input.lowercase ? `[string tolower [${base}]]` : `[${base}]`;
}

/** A string operand inside an expression: always quoted (a bare word is a syntax error there). */
function word(v: string): string {
  // Nothing that double quotes would substitute, and no brace: plain quotes. Braces are
  // excluded because the condition sits inside a braced body, where Tcl counts braces even
  // between double quotes (Tcl 8.4 syntax, rule 5): a lone one would break the body.
  if (!/["$\[\\{}]/.test(v)) return `"${v}"`;
  // Balanced braces and no trailing backslash: a braced literal.
  const f = formatElement(v);
  // formatElement chose braces: they are exact.
  if (f.startsWith("{") && f.endsWith("}")) return f;
  // Otherwise escape inside double quotes.
  return `"${v.replace(/["$\[\]\\{}]/g, (c) => "\\" + c)}"`;
}

/** True when a value's braces do not pair up, counted as Tcl counts them in a braced word. */
function unbalancedBraces(v: string): boolean {
  // Open braces not yet closed.
  let depth = 0;
  // Each character.
  for (let i = 0; i < v.length; i++) {
    // A backslash hides the next character from the count (Tcl 8.4 syntax, rule 5).
    if (v[i] === "\\") { i++; continue; }
    // An open brace.
    if (v[i] === "{") depth++;
    // A close brace with none open: already unbalanced.
    else if (v[i] === "}" && --depth < 0) return true;
  }
  // Any brace still open.
  return depth !== 0;
}

/** Escape glob special characters so a value matches literally. */
function globEscape(v: string): string {
  // Each special character gets a backslash.
  return v.replace(/[*?[\]\\]/g, (c) => "\\" + c);
}

/** The glob pattern equivalent to a rule. */
function globFor(r: Rule): string {
  // By operator.
  switch (r.op) {
    // The value itself, literally.
    case "equals": return globEscape(r.value);
    // A prefix.
    case "starts_with": return globEscape(r.value) + "*";
    // A suffix.
    case "ends_with": return "*" + globEscape(r.value);
    // Anywhere.
    case "contains": return "*" + globEscape(r.value) + "*";
    // Already a pattern.
    default: return r.value;
  }
}

/** Does a value match a rule? */
function matches(r: Rule, v: string): boolean {
  // Through the equivalent glob (exactly what switch -glob does).
  return globMatch(globFor(r), v);
}

/** The condition text an if chain uses for a rule. */
function condition(r: Rule): string {
  // By operator.
  switch (r.op) {
    // String equality.
    case "equals": return `${VALUE} eq ${word(r.value)}`;
    // F5's prefix operator.
    case "starts_with": return `${VALUE} starts_with ${word(r.value)}`;
    // F5's suffix operator.
    case "ends_with": return `${VALUE} ends_with ${word(r.value)}`;
    // F5's substring operator.
    case "contains": return `${VALUE} contains ${word(r.value)}`;
    // A glob pattern.
    default: return `[string match ${formatElement(r.value)} ${VALUE}]`;
  }
}

/** Generate the if / elseif chain. */
function genIf(input: ConditionalBuilderInput): string {
  // Lines of the rule.
  const L: string[] = ["when HTTP_REQUEST priority 500 {", `    set value ${subjectCommand(input)}`];
  // Each rule.
  input.rules.forEach((r, i) => {
    // The first is "if", the rest "elseif".
    L.push(`    ${i === 0 ? "if" : "} elseif"} { ${condition(r)} } {`);
    // The action.
    L.push(`        pool ${formatElement(r.pool)}`);
  });
  // The default.
  if (input.rules.length) L.push("    } else {", `        pool ${formatElement(input.defaultPool)}`, "    }");
  // No rules at all.
  else L.push(`    pool ${formatElement(input.defaultPool)}`);
  // Close the event.
  L.push("}");
  // The text.
  return L.join("\n");
}

/** Generate the switch. */
function genSwitch(input: ConditionalBuilderInput): string {
  // Glob mode is needed unless every rule is an exact match.
  const glob = input.rules.some((r) => r.op !== "equals");
  // Lines.
  const L: string[] = ["when HTTP_REQUEST priority 500 {", `    switch ${glob ? "-glob " : ""}-- ${subjectCommand(input)} {`];
  // Each rule as a pattern (braced or escaped so it is read literally from the list).
  for (const r of input.rules) L.push(`        ${formatElement(glob ? globFor(r) : r.value)} {`, `            pool ${formatElement(r.pool)}`, "        }");
  // The default.
  L.push("        default {", `            pool ${formatElement(input.defaultPool)}`, "        }", "    }", "}");
  // The text.
  return L.join("\n");
}

/** Group the rules for the class form: one data group per operator, in first-use order. */
function classGroups(input: ConditionalBuilderInput): { op: RuleOp; name: string; rules: Rule[] }[] {
  // The operators used, in order.
  const ops: RuleOp[] = [];
  // Collect.
  for (const r of input.rules) if (!ops.includes(r.op)) ops.push(r.op);
  // One group per operator (a single group keeps the plain name).
  return ops.map((op) => ({ op, name: ops.length === 1 ? input.dataGroup : `${input.dataGroup}_${op}`, rules: input.rules.filter((r) => r.op === op) }));
}

/** A tmsh record name, quoted when it needs to be. */
function tmshName(v: string): string {
  // Plain names stay bare.
  return /^[A-Za-z0-9_./:-]+$/.test(v) ? v : `"${v.replace(/(["\\])/g, "\\$1")}"`;
}

/** Generate the class match form and its data groups. */
function genClass(input: ConditionalBuilderInput): { code: string; tmsh: string; groups: Record<string, DataGroup> } {
  // The groups.
  const groups = classGroups(input);
  // Lines of the rule.
  const L: string[] = ["when HTTP_REQUEST priority 500 {", `    set value ${subjectCommand(input)}`];
  // The first lookup, then fall back group by group.
  groups.forEach((g, i) => {
    // The lookup.
    const look = `[class match -value -- ${VALUE} ${g.op} ${formatElement(g.name)}]`;
    // First group: plain assignment.
    if (i === 0) L.push(`    set target ${look}`);
    // Later groups only when nothing matched yet.
    else L.push("    if { ${target} eq \"\" } {", `        set target ${look}`, "    }");
  });
  // Act on the result.
  L.push('    if { ${target} ne "" } {', "        pool ${target}", "    } else {", `        pool ${formatElement(input.defaultPool)}`, "    }", "}");
  // The tmsh definitions.
  const T: string[] = [];
  // The emulation's data groups.
  const dg: Record<string, DataGroup> = {};
  // Each group.
  for (const g of groups) {
    // Records (lower-cased keys when the rule lower-cases the value).
    const recs = g.rules.map((r) => ({ name: input.lowercase ? tclStringToLower(r.value) : r.value, value: r.pool }));
    // For the emulation.
    dg[g.name] = { records: recs };
    // tmsh text.
    T.push(`ltm data-group internal ${g.name} {`, "    records {");
    // Each record.
    for (const rec of recs) T.push(`        ${tmshName(rec.name)} {`, `            data ${rec.value}`, "        }");
    // Close.
    T.push("    }", "    type string", "}");
  }
  // The forms.
  return { code: L.join("\n"), tmsh: T.join("\n"), groups: dg };
}

/** Run a generated rule with the test value and report the pool it chose. */
function trial(code: string, input: ConditionalBuilderInput, groups: Record<string, DataGroup>): { pool: string | null; error?: string } {
  // The sample request carrying the test value in the chosen place.
  const sample: SampleRequest = { uri: "/", host: "www.example.com", method: "GET", headers: {}, clientAddr: "192.0.2.10" };
  // Put the test value where the subject reads it.
  if (input.subject === "uri") sample.uri = input.testValue;
  // The path (the URI has no query then).
  else if (input.subject === "path") sample.uri = input.testValue;
  // The query.
  else if (input.subject === "query") sample.uri = "/?" + input.testValue;
  // The host.
  else if (input.subject === "host") sample.host = input.testValue;
  // A header.
  else sample.headers[input.headerName || "X-Example"] = input.testValue;
  // Actions requested.
  const actions: Action[] = [];
  // Run it in iRules mode.
  const r = runScript(code, { mode: "irules", maxSteps: 500, commands: irulesCommands(sample, groups, actions) });
  // The pool chosen.
  const pool = actions.find((a) => a.command === "pool")?.args[0] ?? null;
  // An error stops the rule.
  return r.code === "error" ? { pool, error: r.result } : { pool };
}

/** Build all three forms and compare them. */
export function run(input: ConditionalBuilderInput): ConditionalBuilderResult {
  // Bounded inputs: up to 50 rules with short values.
  if ((input.rules ?? []).length > 50) throw new TclError("this tool takes at most 50 rules");
  // Each rule's value and pool.
  for (const r of input.rules ?? []) { limitInput("A rule value", r.value, 500); limitInput("A pool name", r.pool, 200); }
  // The other fields.
  limitInput("The test value", input.testValue, 2000); limitInput("The default pool", input.defaultPool, 200); limitInput("The data group name", input.dataGroup, 200); limitInput("The header name", input.headerName, 200);
  // Notes.
  const notes: ConditionalBuilderResult["notes"] = [];
  // The test value as the subject command returns it: HTTP::path stops at the first "?",
  // which starts the query (F5's HTTP::path reference; the trial below runs the same way).
  const q = input.subject === "path" ? input.testValue.indexOf("?") : -1;
  // The part the rules compare.
  const seen = q < 0 ? input.testValue : input.testValue.slice(0, q);
  // Say so when it matters.
  if (q >= 0) notes.push({ code: "path-stops-at-query" });
  // The test value as the rules see it ([string tolower] uses Tcl 8.4.6's case tables).
  const v = input.lowercase ? tclStringToLower(seen) : seen;
  // The first rule that matches, in order.
  const firstRule = input.rules.findIndex((r) => matches(r, v));
  // Shadowed rules: an earlier rule matches EVERYTHING a later rule matches, so
  // the later rule can never fire in an if chain or a switch. For the four
  // literal operators this is decided exactly by two probes: the later rule's
  // value itself, and that value padded with a character no value contains
  // (U+0001) on the side(s) the operator leaves open. Glob rules are skipped.
  const shadowed: { rule: number; by: number }[] = [];
  // The padding character.
  const pad = "\x01";
  // Compare each later rule with the earlier ones.
  input.rules.forEach((r, j) => {
    // Glob rules are not analysed, and values containing the pad would break the proof.
    if (r.op === "glob" || r.value.includes(pad)) return;
    // The padded probe for the open side(s).
    const probe = r.op === "contains" ? pad + r.value + pad : r.op === "ends_with" ? pad + r.value : r.op === "starts_with" ? r.value + pad : r.value;
    // The first earlier literal rule that matches both probes shadows it.
    for (let i = 0; i < j; i++) {
      // The earlier rule.
      const e = input.rules[i];
      // Glob rules cannot be decided this way.
      if (e.op === "glob" || e.value.includes(pad)) continue;
      // Both probes match: every value of the later rule matches the earlier one.
      if (matches(e, r.value) && matches(e, probe)) { shadowed.push({ rule: j, by: i }); break; }
    }
  });
  // Upper-case letters in values that the lower-cased subject can never match.
  if (input.lowercase && input.rules.some((r) => r.value !== tclStringToLower(r.value))) notes.push({ code: "uppercase-never-matches" });
  // Case-sensitive comparison without lower-casing.
  if (!input.lowercase && (input.subject === "host" || input.subject === "header")) notes.push({ code: "case-sensitive" });
  // A lone brace in a rule value: the generated code escapes it with a backslash.
  if (input.rules.some((r) => unbalancedBraces(r.value))) notes.push({ code: "unmatched-brace" });
  // The forms.
  const forms: Form[] = [];
  // if / elseif.
  const ifCode = genIf(input);
  // Run it.
  forms.push({ kind: "if", code: ifCode, ...trial(ifCode, input, {}) });
  // switch.
  const swCode = genSwitch(input);
  // Run it.
  forms.push({ kind: "switch", code: swCode, ...trial(swCode, input, {}) });
  // class: not for glob rules.
  if (input.rules.some((r) => r.op === "glob")) forms.push({ kind: "class", code: "", pool: null, unavailable: "glob" });
  // No rules: nothing to put in a data group.
  else if (input.rules.length === 0) forms.push({ kind: "class", code: "", pool: null, unavailable: "empty" });
  else {
    // Generate it.
    const c = genClass(input);
    // Run it with its data groups.
    forms.push({ kind: "class", code: c.code, tmsh: c.tmsh, ...trial(c.code, input, c.groups) });
    // More than one operator means more than one data group, consulted in a fixed order.
    if (classGroups(input).length > 1) notes.push({ code: "class-multiple-groups" });
    // A record name the tmsh text had to put in double quotes (not tried on a BIG-IP).
    if (Object.values(c.groups).some((g) => g.records.some((rec) => tmshName(rec.name) !== rec.name))) notes.push({ code: "tmsh-quoted" });
  }
  // Agreement among the forms that ran.
  const pools = forms.filter((f) => !f.unavailable).map((f) => f.pool);
  // Same pool everywhere.
  const agree = pools.every((p) => p === pools[0]);
  // Explain a disagreement caused by longest-match.
  if (!agree) notes.push({ code: "class-longest-vs-first" });
  // The answer.
  return { forms, agree, firstRule, shadowed, notes };
}
