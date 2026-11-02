// ============================================================================
// src/lib/fieldcraft/text.ts
// ----------------------------------------------------------------------------
// OPERATIONS & FIELDCRAFT - the export's sentences with ids (02/11/2026).
//
// WHY. The fieldcraft forms end in a Markdown export (a worksheet, a runbook,
// a packet) that a reader pastes into a ticket. Its sections are built from
// many lines: catalogue sentences, a form choice's value, a note as typed. To
// let the pt-BR page export in Portuguese while the English export (and the
// API, which returns the same artifact) stays byte for byte, every section
// heading and body is an EngineText (src/lib/tools/engine-text.ts): a body is
// one sentence whose single argument is the list of its lines, joined by a
// line break, and its message in both packs is just that argument, "{lines}".
// Each line is a sentence of its own (with its own id), so it is translated
// where it is written, never as a fragment.
//
// Three small builders, shared by the eight forms:
//   joined(lines, sep)  lines as one body (message "{lines}");
//   raw(text)           text carried as is (a note as typed, a blank line):
//                       message "{text}", so it reads the same in every pack;
//   opt(field, value)   a form choice's id as the English export writes it
//                       (the id), which the pt-BR pack gives as the option's
//                       Portuguese label; opts() for a list of them;
//   bullet(t), todo(t)  a sentence as a Markdown list item ("- ") or an
//                       unticked checklist item ("- [ ] "), the marker kept
//                       outside the sentence so the sentence's own id serves
//                       the page and the export alike; todoCmd() adds a
//                       command hint on an indented line, as the forms do.
// Pure and dependency-free beyond engine-text.ts.
// ============================================================================

import { say, listOf, type EngineText, type EngineList } from "../tools/engine-text"; // sentences with ids

/**
 * Text carried as is (a note as typed, an id, a blank line): the same in every language.
 * @param text the text
 * @returns the sentence (pack key engine.md.raw, message "{text}")
 */
export function raw(text: string): EngineText {
  return say("md.raw", text, { text }); // the value is the whole message
} // raw

/**
 * Lines as one body, joined by a separator (a line break unless told otherwise).
 * @param lines the lines, in order: sentences, or strings carried as is
 * @param sep what goes between two lines
 * @returns one sentence whose English is the lines' English joined (pack key engine.md.lines, message "{lines}")
 */
export function joined(lines: readonly (EngineText | string)[], sep = "\n"): EngineText {
  const items = lines.map((l) => (typeof l === "string" ? raw(l) : l)); // every line a sentence
  return say("md.lines", items.map((l) => l.text).join(sep), { lines: listOf(items, sep) }); // the body
} // joined

/**
 * A form choice's id as the export writes it: the id itself in English, the option's label in the pt-BR pack.
 * @param field the form field (scopes the key: the same id can need a different word in another field)
 * @param value the choice's id
 * @returns the sentence (pack key engine.opt.<field>.<value>)
 */
export function opt(field: string, value: string): EngineText {
  return say(`opt.${field}.${value}`, value); // the id is the English
} // opt

/**
 * Several choices of one field as one value.
 * @param field the form field
 * @param values the ids, in order
 * @param sep what goes between two of them
 * @returns the list (its English is the ids joined by sep)
 */
export function opts(field: string, values: readonly string[], sep = ", "): EngineList {
  return listOf(values.map((v) => opt(field, v)), sep); // each id as a sentence
} // opts

/**
 * The English of a list argument, as engineTexts() joins it.
 * @param l the list
 * @returns its items' English joined by its separator
 */
export function listText(l: EngineList): string {
  return l.items.map((i) => i.text).join(typeof l.sep === "string" ? l.sep : l.sep.text); // joined
} // listText

/**
 * A sentence as a Markdown list item.
 * @param t the sentence
 * @returns "- " and the sentence (pack key engine.md.bullet, message "- {text}")
 */
export function bullet(t: EngineText): EngineText {
  return say("md.bullet", `- ${t.text}`, { text: t }); // the marker stays outside the sentence
} // bullet

/**
 * A sentence as an unticked Markdown checklist item (the page ticks it at export time).
 * @param t the sentence
 * @returns "- [ ] " and the sentence (pack key engine.md.todo, message "- [ ] {text}")
 */
export function todo(t: EngineText): EngineText {
  return say("md.todo", `- [ ] ${t.text}`, { text: t }); // the marker stays outside the sentence
} // todo

/**
 * An unticked checklist item with a command hint on an indented line in code type, or without one when there is none.
 * @param t the sentence
 * @param command the command hint, if any
 * @returns the item (pack key engine.md.todoCmd, message "- [ ] {text}\n      `{command}`"; md.todo without a hint)
 */
export function todoCmd(t: EngineText, command: EngineText | undefined): EngineText {
  if (!command) return todo(t); // no hint: the plain item
  return say("md.todoCmd", `- [ ] ${t.text}\n      \`${command.text}\``, { text: t, command }); // the hint under the item
} // todoCmd
