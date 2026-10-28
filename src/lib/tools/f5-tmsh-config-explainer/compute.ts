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
      const start = i; // offset of the opening quote
      const startLine = line; // the line the string starts on
      i++; // past opening quote
      let inner = ""; // the text between the quotes, as written
      while (i < n && src[i] !== '"') {
        // An escape pair is kept as written: a monitor's send string holds "\r" and "\n", which the BIG-IP itself
        // translates to CR and LF when it formats the request (F5 K2167, read 2026-10-27), so "\r\n" is shown as
        // typed, never as "rn". The pair is consumed together, so an escaped quote never ends the string.
        if (src[i] === "\\" && i + 1 < n) {
          inner += src[i] + src[i + 1]; // the backslash and the character after it, as written
          if (src[i + 1] === "\n") line++; // a line continuation still counts as a new line
          i += 2; // past the pair
          continue; // next character
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

// -- Share results: the copy a link carries (2026-10-27) ----------------------
// A "Share results" link of the tmsh config explainer (and of the persistence
// explainer, which reads the same text with this parser) never carries a
// secret setting's value as pasted. shareableTmsh() returns the text with the
// value of every secret setting replaced by SHARE_REDACTED, one tmsh word, so
// the copy parses into the same tree as the paste: same objects, same fields,
// same nesting; only the replaced values differ (the tool's share vectors pin
// this). The settings, from F5's tmsh reference pages read 2026-10-27:
//   - password (ltm monitor http, ldap, radius and the other monitors; auth
//     user), passphrase (ltm profile client-ssl and server-ssl, sys file
//     ssl-key), secret (auth radius-server, auth tacacs, ltm monitor radius),
//     bind-pw (auth ldap), preshared-key and preshared-key-encrypted (net ipsec
//     ike-peer), community-name, community and trap-community (sys snmp: the
//     SNMP community strings);
//   - and every setting whose name ends in -password, -passphrase or -secret:
//     encrypted-password (auth user), auth-password and privacy-password (sys
//     snmp users and traps), cookie-encryption-passphrase (ltm persistence
//     cookie), encrypt-cookie-secret (ltm profile http), proxy-ca-passphrase
//     (client-ssl), and the like.
// The value "none" (no secret) stays. A monitor's send string keeps its text
// except the credentials of an Authorization or Proxy-Authorization header
// (RFC 9110, sections 11.6.2 and 11.7.2), which become SHARE_REDACTED too.
// iRule bodies (ltm rule) are Tcl, captured verbatim by the parser and shown
// as pasted: this function leaves them alone and counts them, so the page can
// tell the reader to check them before sending.
// One pass over the tokens the parser itself uses; the only regular
// expression runs inside send strings, anchored on a literal and linear.

/** What replaces a secret value in the shareable copy: one tmsh word. */
export const SHARE_REDACTED = "[redacted]"; // a bare word: no space, brace, quote or #

/** Setting names whose value is a secret, exactly. */
const SECRET_SETTINGS: ReadonlySet<string> = new Set([
  "password", // monitors and auth user
  "passphrase", // client-ssl, server-ssl, sys file ssl-key
  "secret", // auth radius-server, auth tacacs, ltm monitor radius
  "bind-pw", // auth ldap
  "preshared-key", // net ipsec ike-peer
  "preshared-key-encrypted", // net ipsec ike-peer, stored encrypted
  "community", // sys snmp traps
  "community-name", // sys snmp communities
  "trap-community", // sys snmp
]);

/** Setting-name endings whose value is a secret. */
const SECRET_SUFFIXES: readonly string[] = ["-password", "-passphrase", "-secret"]; // encrypted-password, cookie-encryption-passphrase, encrypt-cookie-secret, ...

/**
 * Whether a setting name names a secret.
 * @param name an unquoted tmsh word
 * @returns true for the settings listed above
 */
export function isSecretSetting(name: string): boolean {
  if (SECRET_SETTINGS.has(name)) return true; // exact
  return SECRET_SUFFIXES.some((s) => name.length > s.length && name.endsWith(s)); // by ending
} // isSecretSetting

/** An Authorization or Proxy-Authorization header inside a send string, up to an escape, a quote or a line end. */
const RE_AUTH_HEADER = /((?:proxy-)?authorization:[ \t]*)([^\\"\r\n]+)/gi; // literal anchor, one negated class: linear

/** The copy a Share results link carries. */
export interface ShareableTmsh {
  /** The text with every secret value replaced. */
  text: string;
  /** How many values were replaced. */
  redacted: number;
  /** How many iRule bodies (ltm rule) the copy keeps as pasted. */
  irules: number;
}

/**
 * The shareable copy of a pasted configuration. Pure and total: it never throws, and a configuration without a
 * secret comes back unchanged.
 * @param src the configuration as pasted
 * @returns the copy, how many values it replaced, and how many iRule bodies it kept
 */
export function shareableTmsh(src: string): ShareableTmsh {
  const tokens = tokenize(src); // the parser's own tokens, with their offsets
  const cuts: { start: number; end: number; text: string }[] = []; // replacements, in source order
  let irules = 0; // iRule bodies kept
  let depth = 0; // brace depth, as the parser counts it
  let line: Token[] = []; // the tokens of the current header or leaf line
  /** Look at one line's tokens: a secret setting's value, or a send string's header credentials. */
  const scan = (toks: Token[]): void => {
    for (let k = 0; k + 1 < toks.length; k++) { // every word with a token after it on the same line
      const key = toks[k]; // the candidate setting name
      const val = toks[k + 1]; // the token after it
      if (key.type !== "word" || key.quoted) continue; // a setting name is a bare word
      if (isSecretSetting(key.text)) { // a secret's value
        const raw = src.slice(val.start, val.end); // as pasted
        if (raw === "none" || raw === SHARE_REDACTED) continue; // no secret, or already replaced
        cuts.push({ start: val.start, end: val.end, text: SHARE_REDACTED }); // the whole token goes
      } else if (key.text === "send") { // a monitor's send string
        const raw = src.slice(val.start, val.end); // as pasted, quotes and escapes included
        for (const m of raw.matchAll(RE_AUTH_HEADER)) { // each header in it
          if (m[2].trim() === "" || m[2] === SHARE_REDACTED) continue; // nothing, or already replaced
          const at = val.start + (m.index ?? 0) + m[1].length; // where the credentials start in the source
          cuts.push({ start: at, end: at + m[2].length, text: SHARE_REDACTED }); // the credentials go
        } // each header
      } // a send string
    } // each word
  };
  for (let i = 0; i < tokens.length; ) { // the walk
    const t = tokens[i]; // this token
    if (t.type === "open") { // a block opens
      if (depth === 0 && isIRuleHeader(line.map((x) => x.text))) { // a top-level iRule: the parser captures its body verbatim
        irules++; // counted, and kept as pasted
        let d = 1; // the same brace count as captureVerbatim
        let j = t.end; // from just after the opening brace
        while (j < src.length && d > 0) { if (src[j] === "{") d++; else if (src[j] === "}") d--; if (d === 0) break; j++; } // to the matching close
        i++; // past the open
        while (i < tokens.length && tokens[i].start < j) i++; // past the body
        if (i < tokens.length && tokens[i].type === "close") i++; // past the close
        line = []; // a new line starts
        continue; // next
      } // an iRule
      scan(line); line = []; depth++; i++; continue; // the header before the brace, then inside
    } // open
    if (t.type === "close") { scan(line); line = []; depth = Math.max(0, depth - 1); i++; continue; } // a block closes
    if (t.type === "newline") { scan(line); line = []; i++; continue; } // a line ends
    line.push(t); i++; // one more token on this line
  } // the walk
  scan(line); // the last line
  let out = ""; // the copy
  let from = 0; // how far the source is copied
  for (const c of cuts) { out += src.slice(from, c.start) + c.text; from = c.end; } // each replacement, in order
  out += src.slice(from); // the rest
  return { text: out, redacted: cuts.length, irules }; // the copy
} // shareableTmsh
