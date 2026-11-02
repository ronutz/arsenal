// ============================================================================
// src/lib/tools/engine-text.ts
// ----------------------------------------------------------------------------
// ENGINE SENTENCES THAT A PAGE CAN SHOW IN ITS OWN LANGUAGE.
//
// WHY (01/11/2026). The engines write their notes, findings and explanations in
// English, and the API returns them as they are. On the pt-BR site those
// sentences reached the page in English (measured 27/10/2026: 141 of 197 tool
// pages, 908 sentences). The iRules event-order pilot (27/10/2026) gave each
// note a stable id the page looks up in its message pack; this module is that
// pattern made reusable, for engines whose sentences are plain strings.
//
// HOW. An engine builds each sentence as an EngineText: a stable id (the pack
// key, under tools.<slug>.engine.*), the English exactly as before, and the
// values the sentence interpolates (as ICU arguments, never concatenated). The
// engine's `...Localisable` function returns the reading with those objects in
// place; its public function (the API's and the golden vectors') returns
// plainText() of the same reading, which swaps every EngineText for its English,
// so the API's JSON is byte for byte what it was. The page calls the
// localisable function and shows each sentence through engineTexts(t): the
// pack's message when the pack has the id, otherwise the engine's English.
//
// The English pack carries the same English as the engine for every id (so the
// English pages read as before, and en/pt-BR parity is guard-enforced); a
// sentence assembled from parts gets one id and arguments, never fragments.
// Pure and dependency-free: the worker bundles it with the engines.
// ============================================================================

/** A value a sentence interpolates: plain text, another sentence, or a list of sentences. */
export type EngineArg = string | EngineText | EngineList; // what a placeholder may hold

/** A list of sentences (or names) shown as one value, joined by a separator. */
export interface EngineList {
  /** The items, in order. */
  items: readonly EngineText[];
  /** What goes between two items: punctuation as is, or a word the page translates. */
  sep: string | EngineText;
}

/** One sentence an engine writes: its stable id, its English, and its values. */
export class EngineText {
  /**
   * @param id the stable id; the page looks it up as tools.<slug>.engine.<id>
   * @param text the English, exactly as the engine has always written it
   * @param args the values the sentence interpolates, by ICU argument name
   */
  constructor(
    readonly id: string, // the pack key under engine.*
    readonly text: string, // the English the API returns
    readonly args?: Readonly<Record<string, EngineArg>>, // the interpolated values
  ) {} // nothing else to do

  /** A stray template literal or String() still reads in English rather than "[object Object]". */
  toString(): string {
    return this.text; // the English
  } // toString
} // EngineText

/**
 * A sentence with its id and values.
 * @param id the stable id (the pack key under engine.*)
 * @param text the English, exactly as the engine writes it
 * @param args the values it interpolates
 * @returns the sentence
 */
export function say(id: string, text: string, args?: Record<string, EngineArg>): EngineText {
  return new EngineText(id, text, args); // built
} // say

/**
 * A list of sentences as one argument.
 * @param items the sentences, in order
 * @param sep the separator: punctuation as is, or a sentence the page translates
 * @returns the list
 */
export function listOf(items: readonly EngineText[], sep: string | EngineText): EngineList {
  return { items, sep }; // built
} // listOf

/** The same shape with every EngineText replaced by its English (what the API returns). */
export type Plain<T> = T extends EngineText // a sentence
  ? string // becomes its English
  : T extends readonly (infer U)[] // an array
    ? Plain<U>[] // element by element
    : T extends object // an object
      ? { [K in keyof T]: Plain<T[K]> } // field by field
      : T; // anything else as it is

/**
 * Swap every EngineText in a reading for its English, keeping everything else (key order included) as it was, so
 * JSON.stringify of the result is byte for byte what the engine returned before its sentences carried ids. Only
 * arrays and plain objects are walked; any other object (a Map, a Date, a class instance) is returned as it is.
 * @param value the reading, as the localisable function returns it
 * @returns the reading as the API returns it
 */
export function plainText<T>(value: T): Plain<T> {
  return walk(value) as Plain<T>; // the projection
} // plainText

/**
 * The projection itself, untyped.
 * @param v any value
 * @returns the value with sentences replaced
 */
function walk(v: unknown): unknown {
  if (v instanceof EngineText) return v.text; // a sentence: its English
  if (Array.isArray(v)) return v.map(walk); // an array: each element
  if (v !== null && typeof v === "object") { // an object
    const proto = Object.getPrototypeOf(v); // its kind
    if (proto !== Object.prototype && proto !== null) return v; // not a plain object: as it is
    const out: Record<string, unknown> = {}; // the copy
    for (const [k, x] of Object.entries(v)) out[k] = walk(x); // each field, in order (undefined kept as undefined)
    return out; // copied
  } // object
  return v; // a primitive
} // walk

/** An engine error that carries its sentence, so the page can show it in its own language. */
export interface EngineTextCarrier {
  /** The sentence the error's message is the English of. */
  engineText?: EngineText;
}

/**
 * Attach a sentence to an error (its message stays the English, which is all the API reads).
 * @param err the error to throw
 * @param m the sentence its message is
 * @returns the same error, carrying the sentence
 */
export function withEngineText<E extends Error>(err: E, m: EngineText): E & EngineTextCarrier {
  return Object.assign(err, { engineText: m }); // carried
} // withEngineText

/**
 * A thrown Error whose message is the sentence's English, carrying the sentence.
 * @param m the sentence
 * @returns the error to throw
 */
export function engineError(m: EngineText): Error & EngineTextCarrier {
  return withEngineText(new Error(m.text), m); // a plain Error, as the engines threw before
} // engineError

/** What a page's translator offers (next-intl's useTranslations result satisfies it). */
export interface EngineTranslator {
  /** The message at a key, formatted with values. */
  (key: string, values?: Record<string, string>): string;
  /** Whether the pack has a message at a key. */
  has(key: string): boolean;
}

/** The page side: sentences and catalogue texts in the page's language. */
export interface EngineTexts {
  /** A sentence (or an English string from an engine that has no id for it) in the page's language. */
  say(m: EngineText | string | undefined | null): string;
  /** A catalogue text the page knows the id of (a vector's description, a field's note), else its English. */
  key(id: string, english: string): string;
  /** A thrown error's sentence in the page's language, else its message. */
  error(e: unknown): string;
}

/**
 * The page's view of engine sentences: each is looked up under `<ns>.<id>` in the tool's messages and falls back to
 * the engine's English when the pack has no such key.
 * @param t the tool namespace's translator (useTranslations("tools.<slug>"))
 * @param ns the sub-namespace that holds the engine's messages
 * @returns the three lookups
 */
export function engineTexts(t: EngineTranslator, ns = "engine"): EngineTexts {
  /** One argument in the page's language. */
  const arg = (a: EngineArg): string => {
    if (typeof a === "string") return a; // plain text: as it is
    if (a instanceof EngineText) return sayOne(a); // a sentence: translated
    return a.items.map(sayOne).join(typeof a.sep === "string" ? a.sep : sayOne(a.sep)); // a list: each item, joined
  }; // arg
  /** One sentence in the page's language. */
  const sayOne = (m: EngineText): string => {
    const k = `${ns}.${m.id}`; // its key
    if (!t.has(k)) return m.text; // no message: the engine's English
    if (!m.args) return t(k); // no values
    const values: Record<string, string> = {}; // the values, translated
    for (const [name, a] of Object.entries(m.args)) values[name] = arg(a); // each
    return t(k, values); // formatted
  }; // sayOne
  return {
    say: (m) => (m == null ? "" : typeof m === "string" ? m : sayOne(m)), // a sentence, a string, or nothing
    key: (id, english) => (t.has(`${ns}.${id}`) ? t(`${ns}.${id}`) : english), // a catalogue text
    error: (e) => { // a thrown error
      const m = (e as EngineTextCarrier | null)?.engineText; // its sentence, if it carries one
      return m instanceof EngineText ? sayOne(m) : e instanceof Error ? e.message : String(e); // translated, or as thrown
    }, // error
  }; // the lookups
} // engineTexts

/**
 * A key-safe form of a catalogue name for use inside a message key: next-intl reads "." as nesting, so dots and
 * other separators become "_" (a session variable pattern such as session.ad.$name.authresult becomes
 * session_ad_name_authresult).
 * @param name the catalogue name
 * @returns the key segment
 */
export function keySegment(name: string): string {
  return name.replace(/\$/g, "").replace(/[^A-Za-z0-9_-]+/g, "_"); // dots, slashes, spaces and $ out
} // keySegment
