// ============================================================================
// src/lib/tools/ldap-filter-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE LDAP FILTER EXPLAINER - a strict RFC 4515 recursive-descent parser that
// turns a search filter string into an annotated tree: every AND/OR/NOT node,
// every item's match type (equality, presence, substring, >=, <=, ~=,
// extensible), every RFC 4515 hex escape decoded, and every syntax error
// anchored to its character position. Deterministic, local-compute, zero
// network. Ships as the first Ping-run tool: the filters it explains are the
// daily bread of PingDirectory, PingFederate datastores, and PingAM. (D-19.)
// Sources: RFC 4515 (string representation), RFC 4511 (the protocol the
// string compiles into), Microsoft's AD matching-rule OIDs for the famous
// bit-filter idiom.
//
// PAGE LANGUAGE (02/11/2026): node explanations, idiom notes and parse errors
// are EngineTexts (../engine-text.ts): a stable id, the English as before, and
// their values as ICU arguments. explainFilterLocalisable() returns them for
// the page (pack keys tools.ldap-filter-explainer.engine.<id>); explainFilter()
// returns plainText() of the same reading, so the API and the golden vectors
// are unchanged. run()'s own input errors are API-only and stay plain strings.
// ============================================================================

import { say, listOf, plainText, keySegment, type EngineText, type EngineArg } from "../engine-text"; // sentences with ids (02/11/2026)

/** One parsed node of the filter tree. S: string (explainFilter) or EngineText (the page's reading). */
export interface FilterNode<S = string> {
  /** Node kind. */
  kind: "and" | "or" | "not" | "item";
  /** For item nodes: the match type detected. */
  matchType?:
    | "equality"
    | "presence"
    | "substring"
    | "greaterOrEqual"
    | "lessOrEqual"
    | "approx"
    | "extensible";
  /** For item nodes: the attribute description (may be empty for some extensible forms). */
  attribute?: string;
  /** For item nodes: the raw value text as written (escapes NOT yet decoded). */
  rawValue?: string;
  /** For item nodes: the value with RFC 4515 \XX escapes decoded to characters. */
  decodedValue?: string;
  /** For substring items: the ordered parts (initial, any, final markers). */
  substringParts?: { position: "initial" | "any" | "final"; text: string }[];
  /** For extensible items: the matching-rule OID (after the second colon), if given. */
  matchingRule?: string;
  /** For extensible items: whether the :dn: flag is present. */
  dnAttributes?: boolean;
  /** A plain-language explanation of this node, composed deterministically. */
  explanation: S;
  /** Well-known-idiom note (e.g. the AD bitwise-AND OID), when recognized. */
  note?: S;
  /** Child nodes (for and/or/not). */
  children?: FilterNode<S>[];
  /** Start position (0-based) of this node in the input, for anchoring. */
  pos: number;
}

/** A successful parse. */
export interface ExplainOk<S = string> {
  ok: true;
  /** The root node of the tree. */
  root: FilterNode<S>;
  /** Total count of item (leaf) nodes. */
  itemCount: number;
  /** Maximum nesting depth (root = 1). */
  depth: number;
  /** Decoded escapes actually encountered, for the teaching panel. */
  escapesSeen: { raw: string; decoded: string }[];
}

/** A failed parse, anchored. */
export interface ExplainErr<S = string> {
  ok: false;
  /** Human error message. */
  error: S;
  /** 0-based character position where parsing failed. */
  pos: number;
}

/** The parse, either way. S: string for the API, EngineText for the page. */
export type ExplainResult<S = string> = ExplainOk<S> | ExplainErr<S>;

// -- Well-known matching-rule OIDs (frozen facts, cited in the article) ------
const KNOWN_RULES: Record<string, string> = {
  "1.2.840.113556.1.4.803":
    "LDAP_MATCHING_RULE_BIT_AND (Active Directory): true when ALL bits of the value are set in the attribute.",
  "1.2.840.113556.1.4.804":
    "LDAP_MATCHING_RULE_BIT_OR (Active Directory): true when ANY bit of the value is set in the attribute.",
  "1.2.840.113556.1.4.1941":
    "LDAP_MATCHING_RULE_IN_CHAIN (Active Directory): transitive/nested group membership walk.",
  "2.5.13.2": "caseIgnoreMatch (standard equality rule).",
};

// -- Escape decoding ---------------------------------------------------------
/** Decode RFC 4515 \XX hex escapes; collect them; reject malformed escapes. */
function decodeEscapes(
  raw: string,
  basePos: number
): { text: string; seen: { raw: string; decoded: string }[] } | { err: EngineText; pos: number } {
  let out = "";
  const seen: { raw: string; decoded: string }[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "\\") {
      const hex = raw.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        return { err: say("err.escape", "Backslash must be followed by exactly two hex digits (RFC 4515)."), pos: basePos + i }; // a malformed \\XX
      }
      const ch = String.fromCharCode(parseInt(hex, 16));
      const printable = ch >= " " && ch <= "~" ? ch : "0x" + hex.toLowerCase();
      seen.push({ raw: "\\" + hex.toLowerCase(), decoded: printable });
      out += printable === ch ? ch : printable;
      i += 2;
    } else {
      out += c;
    }
  }
  return { text: out, seen };
}

// -- The recursive-descent parser -------------------------------------------
/** Parse an LDAP search filter string per RFC 4515. Pure and deterministic. */
export function explainFilter(input: string): ExplainResult {
  return plainText(explainFilterLocalisable(input)); // the page's reading with every sentence as its English
}

/**
 * The same parse with every sentence as an EngineText, for the page (02/11/2026).
 * @param input the filter as typed
 * @returns the annotated tree or the anchored error, sentences with ids
 */
export function explainFilterLocalisable(input: string): ExplainResult<EngineText> {
  const s = input.trim();
  if (s.length === 0) return { ok: false, error: say("err.empty", "Filter is empty."), pos: 0 }; // nothing typed
  const escapes: { raw: string; decoded: string }[] = [];
  let itemCount = 0;
  let maxDepth = 0;

  let i = 0; // cursor into s
  const fail = (msg: EngineText, at: number): ExplainErr<EngineText> => ({ ok: false, error: msg, pos: at }); // an anchored error, with its id

  function parseFilter(depth: number): FilterNode<EngineText> | ExplainErr<EngineText> {
    if (depth > maxDepth) maxDepth = depth;
    if (s[i] !== "(") return fail(say("err.open", "Expected '(' to open a filter."), i); // no opening parenthesis
    const open = i;
    i++; // consume (
    if (i >= s.length) return fail(say("err.endsAfterOpen", "Filter ends after '(' - nothing inside."), i); // nothing after "("
    const c = s[i];
    let node: FilterNode<EngineText> | ExplainErr<EngineText>; // this node, sentences with ids
    if (c === "&" || c === "|") {
      i++;
      const children: FilterNode<EngineText>[] = []; // the nested filters
      while (i < s.length && s[i] === "(") {
        const child = parseFilter(depth + 1);
        if ("ok" in child) return child;
        children.push(child);
      }
      if (children.length === 0)
        return fail(say("err.noChildren", `'${c}' needs at least one nested filter (RFC 4511 allows zero, but every real server you will meet expects one).`, { op: c }), i); // an empty AND or OR
      node = {
        kind: c === "&" ? "and" : "or",
        pos: open,
        children,
        explanation:
          c === "&"
            ? say("node.and", `ALL of the ${children.length} conditions below must be true.`, { count: String(children.length) }) // AND
            : say("node.or", `AT LEAST ONE of the ${children.length} conditions below must be true.`, { count: String(children.length) }), // OR
      };
    } else if (c === "!") {
      i++;
      if (s[i] !== "(") return fail(say("err.notWrap", "'!' (NOT) must wrap exactly one parenthesized filter."), i); // NOT without a filter
      const child = parseFilter(depth + 1);
      if ("ok" in child) return child;
      if (i < s.length && s[i] === "(")
        return fail(say("err.notSecond", "'!' (NOT) takes exactly ONE nested filter - found a second."), i); // NOT with two
      node = {
        kind: "not",
        pos: open,
        children: [child],
        explanation: say("node.not", "The condition below must be FALSE."), // NOT
      };
    } else {
      // simple / extensible item: read up to the matching ')'
      let j = i;
      while (j < s.length && s[j] !== ")" && s[j] !== "(") j++;
      if (j >= s.length || s[j] !== ")") return fail(say("err.itemClose", "Filter item is missing its closing ')'."), j); // an unclosed item
      const body = s.slice(i, j);
      const bodyPos = i;
      i = j; // leave cursor on ')' for the shared consume below
      const item = parseItem(body, bodyPos);
      if ("ok" in item) return item;
      node = item;
      itemCount++;
    }
    if (s[i] !== ")") return fail(say("err.close", "Expected ')' to close the filter."), i); // no closing parenthesis
    i++; // consume )
    return node;
  }

  function parseItem(body: string, at: number): FilterNode<EngineText> | ExplainErr<EngineText> {
    // find the operator: first unescaped '=' (with optional preceding > < ~ or :... extensible)
    const eq = body.indexOf("=");
    if (eq < 0) return fail(say("err.noEquals", "Filter item has no '=' operator."), at); // no operator
    let left = body.slice(0, eq);
    const rawValue = body.slice(eq + 1);
    let matchType: FilterNode["matchType"] = "equality";
    let matchingRule: string | undefined;
    let dnAttributes = false;

    if (left.endsWith(">")) {
      matchType = "greaterOrEqual";
      left = left.slice(0, -1);
    } else if (left.endsWith("<")) {
      matchType = "lessOrEqual";
      left = left.slice(0, -1);
    } else if (left.endsWith("~")) {
      matchType = "approx";
      left = left.slice(0, -1);
    } else if (left.includes(":")) {
      matchType = "extensible";
      const parts = left.split(":");
      // attr [":dn"] [":" oid] ":" (the trailing ':' before '=' yields a final empty part)
      if (parts[parts.length - 1] !== "")
        return fail(say("err.extEnd", "Extensible match must end with ':' before '=' (attr:dn:oid:=value)."), at + left.length); // no final colon
      parts.pop();
      const attr = parts.shift() ?? "";
      for (const p of parts) {
        if (p === "dn") dnAttributes = true;
        else if (p.length > 0) matchingRule = p;
        else return fail(say("err.extEmpty", "Empty segment inside extensible match specification."), at); // "::" inside
      }
      left = attr;
    }
    if (matchType !== "extensible" && !/^[A-Za-z][A-Za-z0-9-]*(;[A-Za-z0-9-]+)*$/.test(left)) {
      return fail(say("err.attr", `'${left || "(empty)"}' is not a valid attribute description.`, { attr: left || say("err.attrEmpty", "(empty)") }), at); // a bad attribute name
    }

    // decode escapes in the value
    const dec = decodeEscapes(rawValue, at + eq + 1);
    if ("err" in dec) return fail(dec.err, dec.pos);
    for (const e of dec.seen) if (!escapes.some((x) => x.raw === e.raw)) escapes.push(e);

    // presence / substring detection (on the RAW value, where '*' is structural)
    let node: FilterNode<EngineText>; // the item, sentences with ids
    if (matchType === "equality" && rawValue === "*") {
      node = {
        kind: "item",
        matchType: "presence",
        attribute: left,
        rawValue,
        decodedValue: "*",
        pos: at,
        explanation: say("node.presence", `Entries where the attribute '${left}' EXISTS (has any value at all).`, { attr: left }), // presence
      };
    } else if (matchType === "equality" && rawValue.includes("*")) {
      const rawParts = rawValue.split("*");
      const substringParts: { position: "initial" | "any" | "final"; text: string }[] = [];
      rawParts.forEach((p, idx) => {
        if (p === "") return;
        const d = decodeEscapes(p, 0);
        const text = "err" in d ? p : d.text;
        substringParts.push({
          position: idx === 0 ? "initial" : idx === rawParts.length - 1 ? "final" : "any",
          text,
        });
      });
      const pieces = substringParts // each part as a phrase with its id, joined by a translatable ", then "
        .map((p) =>
          p.position === "initial"
            ? say("sub.initial", `starts with '${p.text}'`, { text: p.text }) // the initial part
            : p.position === "final"
              ? say("sub.final", `ends with '${p.text}'`, { text: p.text }) // the final part
              : say("sub.any", `contains '${p.text}'`, { text: p.text }) // a middle part
        );
      const piecesArg: EngineArg = pieces.length ? listOf(pieces, say("sub.then", ", then ")) : say("sub.wildcard", "matches the wildcard pattern"); // the phrase list, or the bare-wildcard phrase
      const piecesEn = pieces.map((p) => p.text).join(", then "); // the same phrase in English, as the engine always wrote it
      node = {
        kind: "item",
        matchType: "substring",
        attribute: left,
        rawValue,
        decodedValue: dec.text,
        substringParts,
        pos: at,
        explanation: say("node.substring", `Entries where '${left}' ${piecesEn || "matches the wildcard pattern"} (in order).`, { attr: left, pieces: piecesArg }), // substring
      };
    } else {
      const verbs: Record<string, string> = {
        equality: "equals",
        greaterOrEqual: "is greater than or equal to",
        lessOrEqual: "is less than or equal to",
        approx: "approximately matches (server-defined phonetic/loose rule)",
        extensible: "matches",
      };
      node = {
        kind: "item",
        matchType,
        attribute: left,
        rawValue,
        decodedValue: dec.text,
        matchingRule,
        dnAttributes,
        pos: at,
        explanation:
          matchType === "extensible"
            ? say(dnAttributes ? "node.extensibleDn" : "node.extensible", `Extensible match: '${left || "(any attribute)"}' ${
                matchingRule ? `evaluated under rule ${matchingRule}` : "with the attribute's own rule"
              }${dnAttributes ? ", also matching against DN components" : ""}, against value '${dec.text}'.`, { // extensible, with or without the DN flag
                attr: left || say("ext.anyAttr", "(any attribute)"), // the attribute, or none
                rule: matchingRule ? say("ext.rule", `evaluated under rule ${matchingRule}`, { oid: matchingRule }) : say("ext.ownRule", "with the attribute's own rule"), // the rule phrase
                value: dec.text, // the value
              })
            : say(`node.${matchType}`, `Entries where '${left}' ${verbs[matchType!]} '${dec.text}'.`, { attr: left, value: dec.text }), // equality, >=, <= or ~=, one id each
      };
      if (matchingRule && KNOWN_RULES[matchingRule]) node.note = say(`rule.${keySegment(matchingRule)}`, KNOWN_RULES[matchingRule]); // a known OID's note, keyed by the OID
    }
    return node;
  }

  const root = parseFilter(1);
  if ("ok" in root) return root;
  if (i !== s.length)
    return fail(say("err.trailing", "Trailing characters after the closing ')' of the filter."), i); // text after the filter
  return { ok: true, root, itemCount, depth: maxDepth, escapesSeen: escapes };
}

/** The structured-run entry point (D-49 registry contract): JSON in/out. */
export function run(inputJson: string): ExplainResult { // the API's reading (plain strings)
  let parsed: unknown;
  try {
    parsed = JSON.parse(inputJson);
  } catch {
    return { ok: false, error: "Input must be JSON: {\"filter\":\"(...)\"}", pos: 0 };
  }
  const filter = (parsed as { filter?: unknown })?.filter;
  if (typeof filter !== "string") return { ok: false, error: "Missing string field 'filter'.", pos: 0 };
  if (filter.length > 4000) return { ok: false, error: "Filter longer than 4000 characters.", pos: 0 };
  return explainFilter(filter);
}
