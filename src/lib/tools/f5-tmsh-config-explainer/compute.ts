// ============================================================================
// src/lib/tools/f5-tmsh-config-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE bigip.conf (tmsh) PARSER.
//
// BIG-IP stores its configuration as tmsh objects in bigip.conf, in the shape
//
//     <module> <component> [<type>] <name> {
//         <key> <value>
//         <key> { <nested body> }
//         <bare-list-item>
//     }
//
// where newlines separate entries inside a body, brace blocks nest arbitrarily,
// quoted strings may contain spaces, and `#` begins a comment. One object type,
// `ltm rule`, carries a Tcl iRule body that is NOT tmsh and must be captured
// verbatim rather than parsed as configuration.
//
// This module tokenizes the text (tracking source offsets so an iRule body can
// be lifted out untouched) and parses it into a tree of nodes. The semantic
// explanation layer lives in ./explain. Pure and offline.
// ============================================================================

// -- Tokens -------------------------------------------------------------------
type TokenType = "word" | "string" | "open" | "close" | "newline";
interface Token {
  type: TokenType;
  text: string; // for "string", the unquoted inner text
  start: number; // offset of the token start in the source
  end: number; // offset just past the token
  line: number; // 1-based line number of the token
  quoted?: boolean; // true when the source token was a quoted string
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;

  while (i < n) {
    const c = src[i];

    // Newlines are significant (entry separators inside a body).
    if (c === "\n") {
      tokens.push({ type: "newline", text: "\n", start: i, end: i + 1, line });
      line++;
      i++;
      continue;
    }
    // Other whitespace is skipped.
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    // Comments run to end of line.
    if (c === "#") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    // Braces are single-character structural tokens.
    if (c === "{") {
      tokens.push({ type: "open", text: "{", start: i, end: i + 1, line });
      i++;
      continue;
    }
    if (c === "}") {
      tokens.push({ type: "close", text: "}", start: i, end: i + 1, line });
      i++;
      continue;
    }
    // Quoted strings may contain spaces and escaped quotes.
    if (c === '"') {
      const start = i;
      const startLine = line;
      i++; // past opening quote
      let inner = "";
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < n) {
          inner += src[i + 1];
          i += 2;
          continue;
        }
        if (src[i] === "\n") line++;
        inner += src[i];
        i++;
      }
      i++; // past closing quote (if present)
      tokens.push({ type: "string", text: inner, start, end: i, line: startLine, quoted: true });
      continue;
    }
    // Otherwise: a bare word, up to whitespace or a brace.
    const start = i;
    while (i < n) {
      const d = src[i];
      if (d === " " || d === "\t" || d === "\r" || d === "\n" || d === "{" || d === "}" || d === "#" || d === '"') break;
      i++;
    }
    tokens.push({ type: "word", text: src.slice(start, i), start, end: i, line });
  }
  return tokens;
}

// -- Parse tree ---------------------------------------------------------------
export interface ConfigNode {
  /** Header words: the tokens before the `{` or, for a leaf, the whole line. */
  tokens: string[];
  /** True for any header token that came from a quoted string (positional). */
  quotedMask: boolean[];
  /** Child entries, present when the node opened a brace block. */
  children?: ConfigNode[];
  /** Raw text of an iRule (Tcl) body, present only for `ltm rule` objects. */
  verbatim?: string;
  /** 1-based source line of the header. */
  line: number;
}

export interface ParseResult {
  ok: boolean;
  nodes: ConfigNode[];
  error?: { message: string; line?: number };
}

/** Is the header path (joined words minus the trailing name) an iRule object? */
function isIRuleHeader(tokens: string[]): boolean {
  return tokens.length >= 3 && tokens[0] === "ltm" && tokens[1] === "rule";
}

/**
 * parseTmsh - parse a bigip.conf snippet into a node tree. Never throws;
 * structural problems (an unclosed brace) are returned as an error while still
 * yielding whatever parsed cleanly.
 */
export function parseTmsh(src: string): ParseResult {
  const tokens = tokenize(src);
  let pos = 0;
  let unbalanced = false;
  let unbalancedLine: number | undefined;
  let tooDeep = false;
  const MAX_DEPTH = 200; // real bigip.conf nests a handful deep; this is generous headroom

  function skipNewlines() {
    while (pos < tokens.length && tokens[pos].type === "newline") pos++;
  }

  // Capture an iRule body verbatim by brace-counting in the raw source from the
  // position just after its opening brace. Returns inner text and sets the
  // token cursor just past the matching close brace.
  function captureVerbatim(openTok: Token, depthStartLine: number): string {
    const bodyStart = openTok.end;
    let depth = 1;
    let j = bodyStart;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth === 0) break;
      j++;
    }
    const inner = src.slice(bodyStart, j);
    // Advance the token cursor past every token up to and including the close.
    while (pos < tokens.length && tokens[pos].start < j) pos++;
    if (pos < tokens.length && tokens[pos].type === "close") pos++;
    else {
      unbalanced = true;
      unbalancedLine = depthStartLine;
    }
    return inner;
  }

  function parseBody(topLevel: boolean, depth: number): ConfigNode[] {
    const nodes: ConfigNode[] = [];
    if (depth > MAX_DEPTH) {
      tooDeep = true;
      return nodes;
    }
    skipNewlines();
    while (pos < tokens.length && tokens[pos].type !== "close") {
      // Gather header tokens until a brace, newline, or close.
      const header: string[] = [];
      const quoted: boolean[] = [];
      const headerLine = tokens[pos].line;
      while (pos < tokens.length) {
        const t = tokens[pos];
        if (t.type === "open" || t.type === "close" || t.type === "newline") break;
        header.push(t.text);
        quoted.push(t.quoted === true);
        pos++;
      }

      if (pos < tokens.length && tokens[pos].type === "open") {
        const openTok = tokens[pos];
        pos++; // past `{`
        if (topLevel && isIRuleHeader(header)) {
          const verbatim = captureVerbatim(openTok, headerLine);
          nodes.push({ tokens: header, quotedMask: quoted, verbatim, line: headerLine });
        } else {
          const children = parseBody(false, depth + 1);
          if (pos < tokens.length && tokens[pos].type === "close") pos++;
          else {
            unbalanced = true;
            unbalancedLine = headerLine;
          }
          nodes.push({ tokens: header, quotedMask: quoted, children, line: headerLine });
        }
      } else {
        // Leaf line (key-value or bare list item), or a stray empty line.
        if (header.length > 0) nodes.push({ tokens: header, quotedMask: quoted, line: headerLine });
      }
      skipNewlines();
    }
    return nodes;
  }

  const nodes = parseBody(true, 0);
  // Any leftover close braces mean the source was unbalanced.
  if (pos < tokens.length && tokens[pos].type === "close") {
    unbalanced = true;
    unbalancedLine = tokens[pos].line;
  }

  if (tooDeep) {
    return { ok: false, nodes, error: { message: "The configuration nests deeper than the parser allows." } };
  }
  if (unbalanced) {
    return { ok: false, nodes, error: { message: "The configuration has an unbalanced brace.", line: unbalancedLine } };
  }
  return { ok: true, nodes };
}

// -- Header interpretation helpers (used by the explain layer and the UI) -----
export interface TopLevelObject {
  /** The object type path, e.g. "ltm virtual" or "ltm monitor http". */
  type: string;
  /** The object name (the final header token). */
  name: string;
  node: ConfigNode;
}

/** Split a top-level node's header into a type path and a name. */
export function asTopLevel(node: ConfigNode): TopLevelObject {
  const toks = node.tokens;
  if (toks.length === 0) return { type: "", name: "", node };
  if (toks.length === 1) return { type: "", name: toks[0], node };
  return { type: toks.slice(0, -1).join(" "), name: toks[toks.length - 1], node };
}

/** A leaf node's key (first token) and value (the rest joined), for display. */
export function asKeyValue(node: ConfigNode): { key: string; value: string } {
  if (node.tokens.length === 0) return { key: "", value: "" };
  return { key: node.tokens[0], value: node.tokens.slice(1).join(" ") };
}
