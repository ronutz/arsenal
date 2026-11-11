// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/i18n/contentMatch.ts
// ----------------------------------------------------------------------------
// The lookup behind the strings that live in code (src/i18n/contentStrings.ts
// explains the scheme): an exact English key first, then the English templates
// whose {0}, {1}... placeholders match the values the code put into the
// sentence. No node imports, so the client hook and the server pages share it.
// Placeholders in a key are numbered in their order of appearance in the
// English ({0} first); a translation may use them in any order.
// ============================================================================

/** One module's strings in one language: English (or an English template) -> the language's text. */
export type ContentStrings = Readonly<Record<string, string>>;

/** Compiled templates per map object, so each map is compiled once. */
const compiled = new WeakMap<object, { re: RegExp; parts: string[]; to: string; lists: boolean; orLists: boolean }[]>();

/** The list words a module may list ("and", "or"): reserved for listWord, never translated as a phrase on their own. */
const LIST_WORDS = new Set(["and", "or"]);

/**
 * The English templates whose values can be lists the code joined with "and" (09/11/2026): the tcpdump explainer's
 * shell specials, encapsulation keywords and TCP flag names, and the openssl explainer's secrets and version options.
 * Only their values get the language's list word; elsewhere a value with " and " in it is filter syntax or prose
 * ("tcp and port 80" in the precedence note) and must stay as written. A template matches when it contains one of
 * these English fragments.
 */
const LIST_TEMPLATES = ["Unquoted {", "encapsulation seen earlier", "TCP flags byte", "among {", "This output contains {", "Only one version option", "none of {", "at least one of {", "all of {"]; // 11/11/2026: the masked TCP-flag sentences ("True when none of {0} is set.") list flag names too

/**
 * The English templates whose value is a list of the module's own phrases joined with ", or " (11/11/2026): the
 * tcpdump explainer's "...; it expected {n}." names what libpcap's grammar could take next. The value is cut back
 * into those phrases, each is translated, and they are joined the language's way: commas, then its word for "or".
 */
const OR_LIST_TEMPLATES = ["it expected {"];

/**
 * The matcher shared by the server helper and the client hook: an exact key first, then the templates (keys with
 * {0}, {1}... placeholders), whose captured values are put into the translation's placeholders.
 *
 * @param map the module map
 * @param en the English text
 * @returns the translation, or the English when nothing matches
 */
export function matchContent(map: ContentStrings, en: string): string {
  // Exact match: the common case.
  // A list word alone is filter syntax or a fragment, never a phrase to translate ("and" as tcpdump's operator).
  if (LIST_WORDS.has(en)) return en;
  const exact = map[en];
  // Found.
  if (exact !== undefined) return exact;
  // The templates of this map, compiled once.
  let list = compiled.get(map);
  if (!list) {
    // Every key with a positional placeholder, the most specific first: the longer the literal text around the
    // placeholders, the fewer sentences a template can match, so file order never decides which template wins.
    list = Object.entries(map)
      .filter(([k]) => /\{\d+\}/.test(k))
      .sort(([a], [b]) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length)
      .map(([k, to]) => ({
        // The English template as a whole-string pattern: literal text escaped, each {n} a lazy capture.
        re: new RegExp("^" + k.split(/(\{\d+\})/).map((p) => (/^\{\d+\}$/.test(p) ? "([\\s\\S]*?)" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("") + "$"),
        // The template split into literal text and {n} placeholders, for the split search below.
        parts: k.split(/(\{\d+\})/).filter((x) => x !== ""),
        // Whether its values may be code-joined lists, which take the language's list word.
        lists: LIST_TEMPLATES.some((f) => k.includes(f)),
        // Whether its values may be ", or " lists of the module's phrases (orList below).
        orLists: OR_LIST_TEMPLATES.some((f) => k.includes(f)),
        // The translation, with the same placeholders.
        to,
      }));
    // Remembered for this map.
    compiled.set(map, list);
  }
  // The first template that matches the whole string.
  for (const { re, parts, to, lists, orLists } of list) {
    // Try it.
    const m = en.match(re);
    // A match: put the captured values into the translation, by their position in the English.
    if (m) {
      // The captured values in order of appearance: the regex's lazy split, or a better one when there is a choice.
      const caps = bestSplit(map, parts, en) ?? m.slice(1);
      // Values by placeholder number (the key's {n} order equals the capture order: keys are written {0}, {1}, ...).
      // A captured value can itself be a module phrase ("source or destination", a verify-code meaning), so it goes
      // through the same lookup; each value is strictly shorter than the sentence, so the recursion ends.
      const values = caps.map((c) => (c !== en ? (orLists ? orList(map, c) : lists ? listWord(map, c, matchContent(map, c)) : matchContent(map, c)) : c));
      // The translation filled in.
      return to.replace(/\{(\d+)\}/g, (_, n: string) => values[Number(n)] ?? "");
    }
  }
  // Nothing: the English stands.
  return en;
}

/** The most splits the search looks at for one sentence: sentences are short, and this bounds the worst case. */
const MAX_SPLITS = 64;

/**
 * The best way to cut a sentence into a template's placeholder values, when the template has two or more of them.
 * The regex's lazy captures take the first cut that fits, which goes wrong when a value contains the text that
 * separates two placeholders: "True if the {0} {1} port..." with {0} = "TCP, UDP or SCTP" cuts after "TCP,". Every
 * cut that fits is tried, in the lazy order, and the one with the most values the module knows as exact phrases wins;
 * a tie keeps the earliest, so the regex's answer stands whenever nothing better exists.
 *
 * @param map the module map (exact phrases are its keys)
 * @param parts the template as literal text and {n} placeholders, in order
 * @param en the English sentence the template matched
 * @returns the values in order of appearance, or null when the template has fewer than two placeholders
 */
function bestSplit(map: ContentStrings, parts: readonly string[], en: string): string[] | null {
  // Placeholders in this template.
  const holes = parts.filter((x) => /^\{\d+\}$/.test(x)).length;
  // One placeholder or none: a single cut exists, the regex already has it.
  if (holes < 2) return null;
  // The best cut so far and its score (exact phrases among its values).
  let best: string[] | null = null;
  // Its score.
  let bestScore = -1;
  // Cuts tried, to stop at the bound.
  let tried = 0;
  /**
   * Walk the parts from part i at position pos, collecting values; score every complete cut.
   *
   * @param i the part to match next
   * @param pos the position in the sentence
   * @param vals the values captured so far
   */
  const walk = (i: number, pos: number, vals: string[]): void => {
    // The bound reached: stop looking.
    if (tried >= MAX_SPLITS) return;
    // Every part matched: a complete cut if the sentence is used up.
    if (i === parts.length) {
      // Leftover text: not a cut.
      if (pos !== en.length) return;
      // One more cut tried.
      tried++;
      // Its score: values the module translates as exact phrases.
      const score = vals.filter((v) => map[v] !== undefined).length;
      // Strictly better only, so the earliest (lazy) cut wins a tie.
      if (score > bestScore) { best = vals.slice(); bestScore = score; }
      // Done with this branch.
      return;
    }
    // The part to match.
    const part = parts[i];
    // Literal text: it must be next in the sentence.
    if (!/^\{\d+\}$/.test(part)) {
      // Matches: continue after it.
      if (en.startsWith(part, pos)) walk(i + 1, pos + part.length, vals);
      // Either way, this branch is finished.
      return;
    }
    // A placeholder: every length from shortest to longest, as the lazy regex orders them.
    for (let end = pos; end <= en.length; end++) {
      // The value for this placeholder.
      vals.push(en.slice(pos, end));
      // The rest of the template from there.
      walk(i + 1, end, vals);
      // Back out for the next length.
      vals.pop();
      // The bound reached: stop.
      if (tried >= MAX_SPLITS) return;
    }
  };
  // Start at the first part, at the start of the sentence.
  walk(0, 0, []);
  // The best cut found (the regex matched, so there is at least one).
  return best;
}

/**
 * A value the code joined with ", or " (OR_LIST_TEMPLATES): its phrases translated one by one and joined the
 * language's way. Phrases are the module's own strings; a value that does not cut cleanly into them stays English.
 *
 * @param map the module map
 * @param en the value as the code wrote it
 * @returns the translated list, or the English when it is not a list of known phrases
 */
function orList(map: ContentStrings, en: string): string {
  // A single phrase (or anything the module already knows whole): the ordinary lookup.
  const whole = matchContent(map, en);
  // Known as it stands.
  if (whole !== en) return whole;
  // The language's "or"; without it the English stands.
  const or = map["or"];
  // Not listed.
  if (or === undefined) return en;
  // The pieces between ", or " joins.
  const pieces = en.split(", or ");
  // One piece: nothing to join.
  if (pieces.length < 2) return en;
  // The phrases, re-assembled: a phrase may itself contain ", or " ("and, or, or the end of the expression"), so
  // pieces are merged until they make a phrase the module holds.
  const items: string[] = [];
  // The phrase being assembled.
  let cur: string | null = null;
  // Each piece.
  for (const piece of pieces) {
    // Extend the current phrase, or start one.
    cur = cur === null ? piece : `${cur}, or ${piece}`;
    // A phrase of the module: keep it.
    if (map[cur] !== undefined) { items.push(map[cur]); cur = null; }
  }
  // Something left that is no phrase of the module: the English stands.
  if (cur !== null || items.length < 2) return en;
  // Commas between the phrases, the language's "or" before the last.
  return `${items.slice(0, -1).join(", ")} ${or} ${items[items.length - 1]}`;
}

/**
 * A value the code joined as a list with an English word ("SYN, ACK and FIN", "Master-Key and Resumption PSK") keeps
 * its items, which are tokens, but takes the language's own "and" or "or": the module lists those two words as exact
 * strings ("and", "or"), and a value that nothing else translated has its last " and " or " or " replaced. Only
 * values inside a sentence come here, never a whole sentence, so a sentence the module lacks is never half-translated.
 *
 * @param map the module map
 * @param en the value as the code wrote it
 * @param done the value after the ordinary lookup
 * @returns the value with the list word in the language, or the lookup's answer when it already changed something
 */
function listWord(map: ContentStrings, en: string, done: string): string {
  // Already translated as a phrase or a template: that answer stands.
  if (done !== en) return done;
  // The two list words, "and" first (the joins the code writes), then "or".
  for (const word of ["and", "or"] as const) {
    // The language's word, when the module lists it.
    const to = map[word];
    // Not listed: nothing to swap.
    if (to === undefined) continue;
    // The last occurrence, which joins the final item.
    const at = en.lastIndexOf(` ${word} `);
    // Present: swap that one word and keep the items as written.
    if (at >= 0) return `${en.slice(0, at)} ${to} ${en.slice(at + word.length + 2)}`;
  }
  // Not a list: the English value stands.
  return en;
}
