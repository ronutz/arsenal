// ============================================================================
// src/lib/tools/as3-explainer-validator/json-secrets.ts
// ----------------------------------------------------------------------------
// THE SHAREABLE COPY OF AN F5 AUTOMATION DECLARATION (Share results,
// 2026-10-27). AS3, Declarative Onboarding and Telemetry Streaming
// declarations are JSON, and each schema marks some properties as secrets:
// passphrases and passwords, the ciphertext of a Secret object, inlined
// private keys, registration keys, API keys and tokens. A Share results link
// of the three explainers carries the declaration with each such value
// replaced by SHARE_REDACTED, never as pasted. This module is the one scanner
// the three engines share (AS3 here, DO and TS import it, as the traceback
// explainer imports code-to-image's secrets check); each engine passes the
// rules its own schema reference gives (which property names are secrets).
//
// HOW IT WORKS. The text must parse as JSON (JSON.parse) before anything is
// replaced, so the scanner walks a well-formed document and never guesses
// where a string ends. One pass, left to right, with an explicit stack (no
// recursion, so a deeply nested paste cannot exhaust the call stack): each
// string token is a member name or a value; each container remembers the
// member name it is the value of (its context; an array's elements share the
// array's) and, for an object, its "class" member. When a container closes,
// each string value directly inside it is replaced if the rules name it by its
// member name, by its container's context, or by its object's class. Only the
// replaced string tokens change: spacing, member order, duplicates and every
// other byte stay as pasted, and the copy parses to the same structure with
// different strings in those places, so an explainer that never shows those
// values reads the copy as it read the paste (each engine's share vectors pin
// that).
//
// TEXT THAT IS NOT JSON is never cut apart: no string boundary can be trusted
// in it. If it mentions a secret's name anywhere (whole words, any case), the
// caller gets no copy and the tool offers no link; otherwise the text holds
// none of these settings and may go as typed.
// ============================================================================

/** What replaces a secret value: one JSON string, so the copy still parses as the paste did. */
export const SHARE_REDACTED = "[redacted]"; // the same word the F5 SSL profile and s_client explainers use

/** Which values a schema calls secrets. Names are compared exactly, as the schemas spell them. */
export interface JsonSecretRules {
  /** A string member with one of these names is a secret (passphrase, password, regKey...). */
  readonly keys: ReadonlySet<string>;
  /** Every string directly inside an object or array that is the value of one of these names (tokens, addOnKeys). */
  readonly containers: ReadonlySet<string>;
  /** Member names that are secrets only inside the value of a given name (privateKey's base64, a header's value). */
  readonly within: Readonly<Record<string, ReadonlySet<string>>>;
  /** Member names that are secrets only in an object of a given class (an SNMP community's name). */
  readonly byClass: Readonly<Record<string, ReadonlySet<string>>>;
}

/** What the shareable form of a paste is. */
export type ShareableJson =
  | { ok: true; text: string; redacted: number; parsed: boolean } // the copy (parsed) or the text as typed (not JSON, names no secret), and how many values were replaced
  | { ok: false; name: string }; // not JSON, and it mentions this secret's name: no copy can be made safely

/** One string value seen inside a container: its member name (null in an array) and where its token lies. */
interface Seen {
  /** The member name, or null for an array element. */
  name: string | null;
  /** Index of the opening quote. */
  start: number;
  /** Index just past the closing quote. */
  end: number;
}

/** One open container. */
interface Frame {
  /** True for an object, false for an array. */
  obj: boolean;
  /** The member name this container is the value of (an array's elements inherit the array's), or null at the top. */
  ctx: string | null;
  /** In an object: the name of the member being read. */
  key: string | null;
  /** In an object: true when the next string is a member name. */
  expectKey: boolean;
  /** In an object: its "class" member's value, once seen. */
  cls: string | null;
  /** The string values seen directly inside it. */
  strings: Seen[];
}

/**
 * Read one JSON string token's text, or the raw slice if it cannot be decoded (it always can, in parsed JSON).
 * @param s the whole text
 * @param start index of the opening quote
 * @param end index just past the closing quote
 * @returns the decoded string
 */
function tokenText(s: string, start: number, end: number): string {
  try {
    return JSON.parse(s.slice(start, end)) as string; // a valid JSON string token
  } catch {
    return s.slice(start + 1, end - 1); // defensive only: never reached for text JSON.parse accepted
  } // try
} // tokenText

/**
 * The secret names a paste mentions, for text that is not JSON: any rule name, context or class, as a whole word in
 * any case (the conservative test: a broken paste that only talks about a password still gets no link).
 * @param text the paste
 * @param rules the schema's rules
 * @returns the first name found, or null
 */
function mentionedSecret(text: string, rules: JsonSecretRules): string | null {
  const names = new Map<string, string>(); // lower case -> as the schema spells it
  for (const n of [...rules.keys, ...rules.containers, ...Object.keys(rules.within), ...Object.keys(rules.byClass)]) names.set(n.toLowerCase(), n); // every trigger
  for (const m of text.matchAll(/[A-Za-z0-9_]+/g)) { // each word (a linear scan, no backtracking)
    const hit = names.get(m[0].toLowerCase()); // a secret's name?
    if (hit) return hit; // the first one
  } // words
  return null; // none
} // mentionedSecret

/**
 * The shareable form of a pasted declaration. Pure and total: it never throws.
 * @param input the paste, as typed
 * @param rules which values the tool's schema calls secrets
 * @returns the copy with every secret value replaced (or the text as typed when it is not JSON and names no secret),
 *   or the secret name that makes a copy unsafe
 */
export function shareableJson(input: string, rules: JsonSecretRules): ShareableJson {
  try {
    JSON.parse(input); // well-formed? (white space around the document is allowed, as the explainers trim it)
  } catch {
    const name = mentionedSecret(input, rules); // no string boundary can be trusted: look for a secret's name at all
    return name === null ? { ok: true, text: input, redacted: 0, parsed: false } : { ok: false, name }; // as typed, or no copy
  } // try
  const spans: [number, number][] = []; // the string tokens to replace, as [start, end)
  const stack: Frame[] = []; // the open containers
  /** Decide, when a container closes, which of its string values are secrets. */
  const close = (f: Frame): void => {
    for (const v of f.strings) { // each string directly inside it
      let secret = false; // until a rule says so
      if (f.obj) { // an object member
        if (v.name === "class") continue; // a class name is never a secret: the explainers read it
        secret = (v.name !== null && rules.keys.has(v.name)) // named a secret
          || (f.ctx !== null && rules.containers.has(f.ctx)) // inside a container of secrets
          || (f.ctx !== null && v.name !== null && (rules.within[f.ctx]?.has(v.name) ?? false)) // a secret member of its context
          || (f.cls !== null && v.name !== null && (rules.byClass[f.cls]?.has(v.name) ?? false)); // a secret member of its class
      } else { // an array element
        secret = f.ctx !== null && rules.containers.has(f.ctx); // an array of secrets (addOnKeys)
      } // kind
      if (secret) spans.push([v.start, v.end]); // replace it
    } // strings
  }; // close
  let i = 0; // the cursor
  const n = input.length; // the end
  while (i < n) { // one pass
    const c = input[i]; // this character
    if (c === "{" || c === "[") { // a container opens
      const top = stack[stack.length - 1]; // its parent, if any
      const ctx = top ? (top.obj ? top.key : top.ctx) : null; // the member it is the value of, or the array's context
      stack.push({ obj: c === "{", ctx, key: null, expectKey: c === "{", cls: null, strings: [] }); // opened
      i++; // past it
    } else if (c === "}" || c === "]") { // a container closes
      const f = stack.pop(); // the one that closes
      if (f) close(f); // decide its strings
      i++; // past it
    } else if (c === "\"") { // a string token
      const start = i; // its opening quote
      i++; // into it
      while (i < n) { // to its closing quote
        if (input[i] === "\\") i += 2; // an escape: skip the escaped character too
        else if (input[i] === "\"") { i++; break; } // the end
        else i++; // a plain character
      } // string
      const end = i; // just past the closing quote
      const top = stack[stack.length - 1]; // the container it is in
      if (!top) continue; // a document that is one string: nothing is named
      if (top.obj && top.expectKey) { // a member name
        top.key = tokenText(input, start, end); // remembered
        top.expectKey = false; // its value comes next
      } else if (top.obj) { // a member value
        top.strings.push({ name: top.key, start, end }); // seen
        if (top.key === "class") top.cls = tokenText(input, start, end); // the object's class, for the class rules
      } else { // an array element
        top.strings.push({ name: null, start, end }); // seen
      } // kind
    } else if (c === ",") { // the next member or element
      const top = stack[stack.length - 1]; // the container
      if (top && top.obj) top.expectKey = true; // a member name comes next
      i++; // past it
    } else {
      i++; // white space, ":", numbers, true, false, null
    } // character
  } // pass
  spans.sort((a, b) => a[0] - b[0]); // in text order
  const replacement = JSON.stringify(SHARE_REDACTED); // "\"[redacted]\""
  let out = ""; // the copy
  let at = 0; // copied up to here
  let redacted = 0; // values replaced
  for (const [start, end] of spans) { // each secret value
    out += input.slice(at, start); // the text before it, unchanged
    const token = input.slice(start, end); // the value as pasted
    if (token === replacement) out += token; // already replaced: not counted again
    else { out += replacement; redacted++; } // replaced
    at = end; // past it
  } // spans
  out += input.slice(at); // the rest, unchanged
  return { ok: true, text: out, redacted, parsed: true }; // the copy
} // shareableJson
