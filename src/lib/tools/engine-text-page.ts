// ============================================================================
// src/lib/tools/engine-text-page.ts
// ----------------------------------------------------------------------------
// A WHOLE READING IN THE PAGE'S LANGUAGE (02/11/2026, batch L2).
//
// WHY. engine-text.ts gives an engine's sentences stable ids: the engine's
// `...Localisable` function returns its reading with EngineText objects in
// place, plainText() turns that reading into the API's English, and the page
// shows each sentence through engineTexts(t).say(). The batch L1 components
// call say() at every place a sentence is shown. The Operations & Fieldcraft
// forms (and a few other tools) show a reading through many shared
// sub-components and also turn it into a Markdown export a reader pastes into a
// ticket; for them the simplest faithful page is the same reading with every
// sentence already in the page's language. inPageLanguage() is that: the same
// walk as plainText() (arrays and plain objects only, key order kept, anything
// else as it is), but each EngineText becomes engineTexts(t).say() of it
// instead of its English. With the English pack (which carries the engine's
// English for every id) the result equals plainText() of the reading, so the
// English page and the English export read exactly as before.
//
// Pure and dependency-free (it only needs the EngineTexts the page already
// has); kept beside engine-text.ts rather than inside it so that file stays as
// batch L1 delivered it.
// ============================================================================

import { EngineText, type EngineTexts, type Plain } from "./engine-text"; // the sentence class, the page's lookups, the plain shape

/**
 * Turn a localisable reading into the same shape with every sentence in the page's language.
 * @param value the reading, as an engine's localisable function returns it
 * @param tx the page's lookups (engineTexts(t) of the tool's namespace)
 * @returns the reading as the page shows it (with the English pack: plainText() of it)
 */
export function inPageLanguage<T>(value: T, tx: EngineTexts): Plain<T> {
  /** The walk itself, untyped (the same rules as engine-text.ts's projection). */
  const walk = (v: unknown): unknown => {
    if (v instanceof EngineText) return tx.say(v); // a sentence: in the page's language
    if (Array.isArray(v)) return v.map(walk); // an array: each element
    if (v !== null && typeof v === "object") { // an object
      const proto = Object.getPrototypeOf(v); // its kind
      if (proto !== Object.prototype && proto !== null) return v; // not a plain object (a Set, a Map, a Date): as it is
      const out: Record<string, unknown> = {}; // the copy
      for (const [k, x] of Object.entries(v)) out[k] = walk(x); // each field, in order (undefined kept as undefined)
      return out; // copied
    } // object
    return v; // a primitive
  }; // walk
  return walk(value) as Plain<T>; // the reading in the page's language
} // inPageLanguage
