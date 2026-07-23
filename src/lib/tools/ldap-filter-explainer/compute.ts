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
// ============================================================================

/** One parsed node of the filter tree. */
export interface FilterNode {
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
  explanation: string;
  /** Well-known-idiom note (e.g. the AD bitwise-AND OID), when recognized. */
  note?: string;
  /** Child nodes (for and/or/not). */
  children?: FilterNode[];
  /** Start position (0-based) of this node in the input, for anchoring. */
  pos: number;
}

/** A successful parse. */
export interface ExplainOk {
  ok: true;
  /** The root node of the tree. */
  root: FilterNode;
  /** Total count of item (leaf) nodes. */
  itemCount: number;
  /** Maximum nesting depth (root = 1). */
  depth: number;
  /** Decoded escapes actually encountered, for the teaching panel. */
  escapesSeen: { raw: string; decoded: string }[];
}

/** A failed parse, anchored. */
export interface ExplainErr {
  ok: false;
  /** Human error message. */
  error: string;
  /** 0-based character position where parsing failed. */
  pos: number;
}

export type ExplainResult = ExplainOk | ExplainErr;

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
): { text: string; seen: { raw: string; decoded: string }[] } | { err: string; pos: number } {
  let out = "";
  const seen: { raw: string; decoded: string }[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "\\") {
      const hex = raw.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        return { err: "Backslash must be followed by exactly two hex digits (RFC 4515).", pos: basePos + i };
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
  const s = input.trim();
  if (s.length === 0) return { ok: false, error: "Filter is empty.", pos: 0 };
  const escapes: { raw: string; decoded: string }[] = [];
  let itemCount = 0;
  let maxDepth = 0;

  let i = 0; // cursor into s
  const fail = (msg: string, at: number): ExplainErr => ({ ok: false, error: msg, pos: at });

  function parseFilter(depth: number): FilterNode | ExplainErr {
    if (depth > maxDepth) maxDepth = depth;
    if (s[i] !== "(") return fail("Expected '(' to open a filter.", i);
    const open = i;
    i++; // consume (
    if (i >= s.length) return fail("Filter ends after '(' - nothing inside.", i);
    const c = s[i];
    let node: FilterNode | ExplainErr;
    if (c === "&" || c === "|") {
      i++;
      const children: FilterNode[] = [];
      while (i < s.length && s[i] === "(") {
        const child = parseFilter(depth + 1);
        if ("ok" in child) return child;
        children.push(child);
      }
      if (children.length === 0)
        return fail(`'${c}' needs at least one nested filter (RFC 4511 allows zero, but every real server you will meet expects one).`, i);
      node = {
        kind: c === "&" ? "and" : "or",
        pos: open,
        children,
        explanation:
          c === "&"
            ? `ALL of the ${children.length} conditions below must be true.`
            : `AT LEAST ONE of the ${children.length} conditions below must be true.`,
      };
    } else if (c === "!") {
      i++;
      if (s[i] !== "(") return fail("'!' (NOT) must wrap exactly one parenthesized filter.", i);
      const child = parseFilter(depth + 1);
      if ("ok" in child) return child;
      if (i < s.length && s[i] === "(")
        return fail("'!' (NOT) takes exactly ONE nested filter - found a second.", i);
      node = {
        kind: "not",
        pos: open,
        children: [child],
        explanation: "The condition below must be FALSE.",
      };
    } else {
      // simple / extensible item: read up to the matching ')'
      let j = i;
      while (j < s.length && s[j] !== ")" && s[j] !== "(") j++;
      if (j >= s.length || s[j] !== ")") return fail("Filter item is missing its closing ')'.", j);
      const body = s.slice(i, j);
      const bodyPos = i;
      i = j; // leave cursor on ')' for the shared consume below
      const item = parseItem(body, bodyPos);
      if ("ok" in item) return item;
      node = item;
      itemCount++;
    }
    if (s[i] !== ")") return fail("Expected ')' to close the filter.", i);
    i++; // consume )
    return node;
  }

  function parseItem(body: string, at: number): FilterNode | ExplainErr {
    // find the operator: first unescaped '=' (with optional preceding > < ~ or :... extensible)
    const eq = body.indexOf("=");
    if (eq < 0) return fail("Filter item has no '=' operator.", at);
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
        return fail("Extensible match must end with ':' before '=' (attr:dn:oid:=value).", at + left.length);
      parts.pop();
      const attr = parts.shift() ?? "";
      for (const p of parts) {
        if (p === "dn") dnAttributes = true;
        else if (p.length > 0) matchingRule = p;
        else return fail("Empty segment inside extensible match specification.", at);
      }
      left = attr;
    }
    if (matchType !== "extensible" && !/^[A-Za-z][A-Za-z0-9-]*(;[A-Za-z0-9-]+)*$/.test(left)) {
      return fail(`'${left || "(empty)"}' is not a valid attribute description.`, at);
    }

    // decode escapes in the value
    const dec = decodeEscapes(rawValue, at + eq + 1);
    if ("err" in dec) return fail(dec.err, dec.pos);
    for (const e of dec.seen) if (!escapes.some((x) => x.raw === e.raw)) escapes.push(e);

    // presence / substring detection (on the RAW value, where '*' is structural)
    let node: FilterNode;
    if (matchType === "equality" && rawValue === "*") {
      node = {
        kind: "item",
        matchType: "presence",
        attribute: left,
        rawValue,
        decodedValue: "*",
        pos: at,
        explanation: `Entries where the attribute '${left}' EXISTS (has any value at all).`,
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
      const pieces = substringParts
        .map((p) =>
          p.position === "initial"
            ? `starts with '${p.text}'`
            : p.position === "final"
              ? `ends with '${p.text}'`
              : `contains '${p.text}'`
        )
        .join(", then ");
      node = {
        kind: "item",
        matchType: "substring",
        attribute: left,
        rawValue,
        decodedValue: dec.text,
        substringParts,
        pos: at,
        explanation: `Entries where '${left}' ${pieces || "matches the wildcard pattern"} (in order).`,
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
            ? `Extensible match: '${left || "(any attribute)"}' ${
                matchingRule ? `evaluated under rule ${matchingRule}` : "with the attribute's own rule"
              }${dnAttributes ? ", also matching against DN components" : ""}, against value '${dec.text}'.`
            : `Entries where '${left}' ${verbs[matchType!]} '${dec.text}'.`,
      };
      if (matchingRule && KNOWN_RULES[matchingRule]) node.note = KNOWN_RULES[matchingRule];
    }
    return node;
  }

  const root = parseFilter(1);
  if ("ok" in root) return root;
  if (i !== s.length)
    return fail("Trailing characters after the closing ')' of the filter.", i);
  return { ok: true, root, itemCount, depth: maxDepth, escapesSeen: escapes };
}

/** The structured-run entry point (D-49 registry contract): JSON in/out. */
export function run(inputJson: string): ExplainResult {
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
