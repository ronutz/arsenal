// ============================================================================
// src/lib/tcl84/irules.ts
// ----------------------------------------------------------------------------
// iRULES COMMANDS, EMULATED FROM F5's DOCUMENTATION - the commands F5 added to
// Tcl that the teaching tools need: findstr, substr, getfield, log, class
// match / search / lookup, the request accessors (HTTP::uri, HTTP::host, ...)
// and the actions an iRule takes (pool, HTTP::redirect, drop, ...), recorded
// instead of performed.
//
// These are NOT Tcl 8.4.6: F5 implements them in TMM and publishes only their
// reference pages, so this module follows those pages exactly and marks every
// case the pages do not cover with a note ("undocumented"), together with the
// answer the tool assumed, so a reader knows to check it on a BIG-IP:
//   findstr  https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html
//   substr   https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html
//   getfield https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html
//   class    https://clouddocs.f5.com/api/irules/class.html
//   log      https://clouddocs.f5.com/api/irules/log.html
// (all read on 2026-10-02/03).
// ============================================================================

import { TclError, TclObj, getInt } from "./value";
import { getInt32, type CommandFn, type TraceEvent } from "./interp";
import { strFirst } from "./strings";
import { formatList } from "./list";

/** The request a snippet sees (sample values chosen in the tool). */
export interface SampleRequest {
  // HTTP::uri: the path and query, e.g. "/login.php?user=abc".
  uri: string;
  // HTTP::host: the Host header, e.g. "www.example.com:8080".
  host: string;
  // HTTP::method.
  method: string;
  // Request headers by name (case-insensitive lookup, as HTTP::header does).
  headers: Record<string, string>;
  // IP::client_addr.
  clientAddr: string;
}

/** A data group: string records with optional values. */
export interface DataGroup {
  // Records in the order they are listed.
  records: { name: string; value: string }[];
}

/** Something the snippet asked BIG-IP to do (recorded, not done). */
export interface Action {
  // The command that asked for it.
  command: string;
  // Its arguments as received.
  args: string[];
}

/** Shorthand for a string result. */
const S = (s: string) => TclObj.fromString(s);

/** Mark an undocumented case on the trace event. */
function undocumented(ev: TraceEvent, code: string, params: Record<string, string | number | boolean> = {}): void {
  // The UI shows these prominently.
  ev.notes.push({ code: `undocumented-${code}`, params });
}

/** True when a terminator argument is read as a COUNT (an integer), not as text. */
function isCount(o: TclObj): boolean {
  // F5 says "an integer"; Tcl_GetIntFromObj is the natural reading.
  try {
    // Converts in place when it is one.
    getInt32(o);
    // An integer.
    return true;
  } catch {
    // Text.
    return false;
  }
}

/** Apply a skip count and terminator from position `start`, as substr and findstr do. */
function cut(s: string, start: number, term: TclObj | undefined, ev: TraceEvent, cmd: "findstr" | "substr"): string {
  // Past the end: nothing left.
  if (start > s.length) {
    // F5 does not say what a skip past the end returns.
    undocumented(ev, "skip-past-end", { cmd });
    // Assume empty.
    return "";
  }
  // A negative start (substr with a negative skip count).
  if (start < 0) {
    // Undocumented.
    undocumented(ev, "negative-skip", { cmd });
    // Assume the start of the string.
    start = 0;
  }
  // No terminator: to the end.
  if (term === undefined) return s.slice(start);
  // A count.
  if (isCount(term)) {
    // The count.
    const n = Number(term.int);
    // Written in a form other than plain decimal digits: how F5 reads it is not documented.
    if (!/^\d+$/.test(term.string)) undocumented(ev, "count-format", { text: term.string });
    // Zero: F5's substr example returns the rest of the string.
    if (n === 0) {
      // Flag the contradiction (the rule says "that many characters").
      undocumented(ev, "count-zero", { cmd });
      // Follow F5's published example.
      return s.slice(start);
    }
    // Negative counts are not covered.
    if (n < 0) {
      // Undocumented.
      undocumented(ev, "count-negative", { cmd });
      // Assume the rest of the string.
      return s.slice(start);
    }
    // That many characters, or up to the end.
    ev.notes.push({ code: "cut-count", params: { count: n } });
    // The slice.
    return s.slice(start, start + n);
  }
  // A terminating string: up to (not including) its first occurrence from the start.
  const t = term.string;
  // An empty terminator is not covered.
  if (t === "") {
    // Undocumented.
    undocumented(ev, "empty-terminator", { cmd });
    // Assume the rest of the string.
    return s.slice(start);
  }
  // Search from the start position.
  const at = s.indexOf(t, start);
  // Not found: to the end (documented for substr; assumed the same for findstr).
  if (at < 0) {
    // findstr's page does not say so.
    if (cmd === "findstr") undocumented(ev, "terminator-absent-findstr");
    // The rest.
    ev.notes.push({ code: "cut-terminator-absent", params: { terminator: t } });
    // To the end.
    return s.slice(start);
  }
  // Found.
  ev.notes.push({ code: "cut-terminator", params: { terminator: t, at } });
  // Up to it.
  return s.slice(start, at);
}

/** Build the iRules command table for a sample request and data groups. */
export function irulesCommands(sample: SampleRequest, groups: Record<string, DataGroup>, actions: Action[]): Record<string, CommandFn> {
  // Record an action and return an empty result.
  const act = (name: string) => ((_it: unknown, a: TclObj[]) => { actions.push({ command: name, args: a.slice(1).map((x) => x.string) }); return S(""); }) as CommandFn;
  // The path part of the URI.
  const path = () => { const q = sample.uri.indexOf("?"); return q < 0 ? sample.uri : sample.uri.slice(0, q); };
  // The query part (without "?").
  const query = () => { const q = sample.uri.indexOf("?"); return q < 0 ? "" : sample.uri.slice(q + 1); };
  // The commands.
  return {
    // when EVENT ?priority N? body: runs the body once, as if the event fired.
    when(it, a, ev) {
      // The body is the last word.
      if (a.length !== 3 && a.length !== 5) throw new TclError('wrong # args: should be "when EVENT ?priority N? { body }"');
      // Note which event.
      ev.notes.push({ code: "when", params: { event: a[1].string } });
      // Run the body.
      return it.evalBody(a[a.length - 1].string, ev.depth + 1);
    },
    // log ?-noname? ?facility.level? message
    log(it, a) {
      // The arguments after the name.
      let rest = a.slice(1).map((x) => x.string);
      // -noname suppresses the rule-name prefix.
      if (rest[0] === "-noname") rest = rest.slice(1);
      // One or two arguments.
      if (rest.length < 1 || rest.length > 2) throw new TclError('wrong # args: should be "log ?-noname? ?facility.level? message"');
      // The facility (default when omitted).
      const facility = rest.length === 2 ? rest[0] : "(default)";
      // The message (syslog keeps 1024 bytes).
      it.logs.push({ facility, message: rest[rest.length - 1].slice(0, 1024) });
      // Empty result.
      return S("");
    },
    // findstr string search_string ?skip_count ?terminator??
    findstr(_it, a, ev) {
      // Two to four arguments.
      if (a.length < 3 || a.length > 5) throw new TclError('wrong # args: should be "findstr string search_string ?skip_count? ?terminator?"');
      // The string and what to find.
      const s = a[1].string, find = a[2].string;
      // The skip count (default 0).
      const skip = a.length >= 4 ? getInt32(a[3]) : 0;
      // Where the search string starts (Tcl's string first: an empty needle is never found).
      const at = strFirst(find, s).value;
      // Not found.
      if (at < 0) {
        // F5 does not document this case.
        undocumented(ev, "findstr-not-found", { search: find });
        // Assume an empty result.
        return S("");
      }
      // Note the match.
      ev.notes.push({ code: "findstr-found", params: { at, skip } });
      // Skip and cut from the match.
      return S(cut(s, at + skip, a[4], ev, "findstr"));
    },
    // substr string skip_count ?terminator?
    substr(_it, a, ev) {
      // One or two arguments after the string.
      if (a.length < 3 || a.length > 4) throw new TclError('wrong # args: should be "substr string skip_count ?terminator?"');
      // The skip count: the 0-based index of the first character returned.
      const skip = getInt32(a[2]);
      // Without a terminator the page does not say; the rest of the string is assumed.
      if (a.length === 3) undocumented(ev, "substr-no-terminator");
      // Cut.
      return S(cut(a[1].string, skip, a[3], ev, "substr"));
    },
    // getfield string split field_number
    getfield(_it, a, ev) {
      // Exactly three arguments.
      if (a.length !== 4) throw new TclError('wrong # args: should be "getfield string split field_number"');
      // The string and separator.
      const s = a[1].string, sep = a[2].string;
      // The 1-based field number.
      const field = getInt32(a[3]);
      // An empty separator is not covered.
      if (sep === "") {
        // Undocumented.
        undocumented(ev, "getfield-empty-split");
        // Assume the whole string is field 1.
        return S(field === 1 ? s : "");
      }
      // Split on every occurrence, left to right.
      const fields = s.split(sep);
      // Empty fields from adjacent separators are an assumption.
      if (fields.some((f, k) => f === "" && k > 0 && k < fields.length - 1)) undocumented(ev, "getfield-empty-field");
      // Field numbers outside 1..count are not covered.
      if (field < 1 || field > fields.length) {
        // Undocumented.
        undocumented(ev, "getfield-out-of-range", { field, count: fields.length });
        // Assume empty.
        return S("");
      }
      // Note the split.
      ev.notes.push({ code: "getfield", params: { count: fields.length, field } });
      // The field.
      return S(fields[field - 1]);
    },
    // class match | search | lookup | exists | size ...
    class(_it, a, ev) {
      // The subcommand.
      const sub = a[1]?.string;
      // class exists name / class size name.
      if (sub === "exists" || sub === "size") {
        // One argument.
        if (a.length !== 3) throw new TclError(`wrong # args: should be "class ${sub} <class>"`);
        // The group.
        const g = groups[a[2].string];
        // exists: 1/0; size: the count.
        return TclObj.fromInt(BigInt(sub === "exists" ? (g ? 1 : 0) : g ? g.records.length : 0));
      }
      // class lookup item class == class match -value item equals class.
      if (sub === "lookup") {
        // Two arguments.
        if (a.length !== 4) throw new TclError('wrong # args: should be "class lookup <item> <class>"');
        // The group.
        const g = groups[a[3].string];
        // Missing group.
        if (!g) throw new TclError(`class "${a[3].string}" not found (define it in the tool)`);
        // The exact record.
        const r = g.records.find((x) => x.name === a[2].string);
        // Its value, or empty.
        return S(r ? r.value : "");
      }
      // class match / class search.
      if (sub !== "match" && sub !== "search") throw new TclError(`class ${sub ?? ""} is not modelled by this tool`);
      // Options before the operands.
      let i = 2, ret: "bool" | "name" | "value" | "index" | "element" = "bool";
      // Read options.
      for (; i < a.length && a[i].string.startsWith("-"); i++) {
        // The option.
        const o = a[i].string;
        // End of options.
        if (o === "--") { i++; break; }
        // Return kinds.
        if (o === "-name" || o === "-value" || o === "-index" || o === "-element") ret = o.slice(1) as typeof ret;
        // -all is not modelled.
        else throw new TclError(`class ${sub} option ${o} is not modelled by this tool`);
      }
      // Three operands.
      if (a.length - i !== 3) throw new TclError(`wrong # args: should be "class ${sub} ?options? ${sub === "match" ? "<item> <operator> <class>" : "<class> <operator> <item>"}"`);
      // The operands (search reverses item and class).
      const item = sub === "match" ? a[i].string : a[i + 2].string, op = a[i + 1].string, cls = sub === "match" ? a[i + 2].string : a[i].string;
      // The group.
      const g = groups[cls];
      // Missing group.
      if (!g) throw new TclError(`class "${cls}" not found (define it in the tool)`);
      // The operator test for one record name, per F5's table.
      const test = (name: string): boolean => {
        // Which operator.
        switch (op) {
          // Exact.
          case "equals": return item === name;
          // match: the item starts with the element; search: the element starts with the item.
          case "starts_with": return sub === "match" ? item.startsWith(name) : name.startsWith(item);
          // match: the item ends with the element; search: the element ends with the item.
          case "ends_with": return sub === "match" ? item.endsWith(name) : name.endsWith(item);
          // match: the item contains the element; search: the element contains the item.
          case "contains": return sub === "match" ? item.includes(name) : name.includes(item);
          // Anything else.
          default: throw new TclError(`bad operator "${op}": must be equals, starts_with, ends_with or contains`);
        }
      };
      // Matching records with their indices.
      const hits = g.records.map((r, k) => ({ r, k })).filter(({ r }) => test(r.name));
      // starts_with / ends_with choose the LONGEST match (documented); contains does not.
      let best = hits[0];
      // The longest name wins for those operators.
      if (hits.length > 1 && (op === "starts_with" || op === "ends_with")) {
        // Pick it.
        best = hits.reduce((x, y) => (y.r.name.length > x.r.name.length ? y : x));
        // Explain.
        ev.notes.push({ code: "class-longest", params: { name: best.r.name, count: hits.length } });
      } else if (hits.length > 1 && op === "contains") undocumented(ev, "class-contains-multiple", { count: hits.length });
      // Note the outcome.
      ev.notes.push({ code: "class-match", params: { op, hit: !!best, name: best ? best.r.name : "" } });
      // The return value.
      if (ret === "bool") return TclObj.fromInt(best ? 1n : 0n);
      // No match with a value-returning option: empty.
      if (!best) return S("");
      // The requested part.
      return ret === "name" ? S(best.r.name) : ret === "value" ? S(best.r.value) : ret === "index" ? TclObj.fromInt(BigInt(best.k)) : S(formatList([best.r.name, best.r.value]));
    },
    // HTTP::uri ?newUri?
    "HTTP::uri"(_it, a) {
      // Setting the URI is an action.
      if (a.length === 2) { actions.push({ command: "HTTP::uri", args: [a[1].string] }); sample.uri = a[1].string; return S(""); }
      // The sample URI.
      return S(sample.uri);
    },
    // HTTP::path: the URI without the query.
    "HTTP::path"() {
      // Derived from the sample URI.
      return S(path());
    },
    // HTTP::query: the part after "?".
    "HTTP::query"() {
      // Derived from the sample URI.
      return S(query());
    },
    // HTTP::host.
    "HTTP::host"() {
      // The sample Host header.
      return S(sample.host);
    },
    // HTTP::method.
    "HTTP::method"() {
      // The sample method.
      return S(sample.method);
    },
    // HTTP::header ?value? name | HTTP::header exists name
    "HTTP::header"(_it, a) {
      // The words after the command.
      const w = a.slice(1).map((x) => x.string);
      // Header lookup by name, case-insensitively.
      const find = (n: string) => Object.entries(sample.headers).find(([k]) => k.toLowerCase() === n.toLowerCase());
      // exists name.
      if (w[0] === "exists" && w.length === 2) return TclObj.fromInt(find(w[1]) ? 1n : 0n);
      // value name, or just name.
      if ((w[0] === "value" && w.length === 2) || w.length === 1) { const h = find(w[w.length - 1]); return S(h ? h[1] : ""); }
      // Other forms change headers: recorded.
      actions.push({ command: "HTTP::header", args: w });
      // Empty result.
      return S("");
    },
    // IP::client_addr.
    "IP::client_addr"() {
      // The sample address.
      return S(sample.clientAddr);
    },
    // Actions, recorded rather than performed.
    pool: act("pool"),
    // Redirect.
    "HTTP::redirect": act("HTTP::redirect"),
    // Respond.
    "HTTP::respond": act("HTTP::respond"),
    // Drop.
    drop: act("drop"),
    // Reject.
    reject: act("reject"),
    // Discard.
    discard: act("discard"),
    // Node selection.
    node: act("node"),
    // Persistence.
    persist: act("persist"),
  };
}

/** The integer value of a word, for callers that need a BigInt (re-exported helper). */
export function intOf(o: TclObj): bigint {
  // Tcl_GetWideIntFromObj semantics.
  return getInt(o);
}
