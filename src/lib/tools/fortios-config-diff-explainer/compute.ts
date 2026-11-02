// ============================================================================
// src/lib/tools/fortios-config-diff-explainer/compute.ts
// ----------------------------------------------------------------------------
// FORTIOS CONFIG DIFF EXPLAINER — pure engine.
//
// WHAT IT ANSWERS
// "What actually changed between these two configurations?"
//
// WHY A LINE DIFF IS THE WRONG TOOL HERE
// A textual diff of FortiOS output reports a moved object as a deletion plus
// an insertion, reports an unchanged object as changed when a neighbour grew a
// line, and buries three real edits inside four hundred lines of context. The
// underlying algorithm finds a minimal EDIT SCRIPT, which is not the same
// thing as the change a human made.
//
// This parses both sides into section -> object -> settings and compares the
// STRUCTURES, so a block that moved is not a change, and a setting that
// changed is reported as one line naming the old and new value.
//
// THE ONE PLACE ORDER IS NOT NOISE
// For most sections the order of objects is irrelevant, so reporting it would
// be noise. For `firewall policy` and its relatives, ORDER IS THE BEHAVIOUR:
// first match wins, so moving a policy changes what the device does without
// changing a single setting. Those sections are order-sensitive by name, and a
// reordering there is reported as a REAL finding. Treating both cases the same
// way — in either direction — would make the tool wrong.
//
// Pure, bounded, never fetches, never evaluates input as code.
//
// PAGE LANGUAGE (02/11/2026): every detail, note, warning and error is built as
// an EngineText (src/lib/tools/engine-text.ts): a stable id, the English as
// before, and its values. runLocalisable() returns them as such for the page
// (pack keys tools.fortios-config-diff-explainer.engine.<id>); run(),
// parseConfig() and diff() return plainText() of the same readings (the parsed
// tree's Maps pass through untouched), so the API, the share spec and the
// golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

const MAX_INPUT = 400_000;
const MAX_OBJECTS = 5_000;

/**
 * Sections where the ORDER of objects is part of the behaviour rather than a
 * presentation detail. Matched as a prefix of the section path.
 */
const ORDER_SENSITIVE: readonly string[] = Object.freeze([
  "firewall policy",
  "firewall policy6",
  "firewall proxy-policy",
  "firewall local-in-policy",
  "firewall shaping-policy",
  "firewall security-policy",
  "router policy",
  "router policy6",
  "system sdwan",
]);

export function isOrderSensitive(section: string): boolean {
  const s = section.toLowerCase();
  return ORDER_SENSITIVE.some((o) => s === o || s.startsWith(`${o} `));
}

export interface ConfigObject {
  readonly name: string;
  readonly settings: ReadonlyMap<string, string>;
  /** Position within its section, used only for order-sensitive sections. */
  readonly index: number;
}

export type ConfigTree = Map<string, Map<string, ConfigObject>>;

export type ChangeKind =
  | "section-added" | "section-removed"
  | "object-added" | "object-removed" | "object-changed"
  | "object-moved";

export interface SettingChange {
  readonly key: string;
  readonly before: string | null;
  readonly after: string | null;
}

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface Change<S = string> {
  readonly kind: ChangeKind;
  readonly section: string;
  readonly object: string | null;
  readonly settings: readonly SettingChange[];
  readonly detail: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface DiffResult<S = string> {
  readonly mode: "diff" | "reference";
  readonly changes: readonly Change<S>[]; // each change
  readonly counts: Readonly<Record<string, number>>;
  readonly notes: readonly S[]; // each a sentence
  readonly parseWarnings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: DiffResult<S>; // the reading
}

/**
 * Parse FortiOS configuration into section -> object -> settings.
 *
 * Written as an explicit line walk with a section stack rather than a regex,
 * because nested `config` blocks inside an `edit` are common and a regex over
 * them silently mis-associates settings with the wrong object.
 */
export function parseConfig(text: string): { tree: ConfigTree; warnings: string[] } {
  const r = parseConfigLocalisable(text); // the page's reading
  return { tree: r.tree, warnings: plainText(r.warnings) }; // the same reading, warnings as English (the tree as it is)
} // parseConfig

/** Parse one side: the page's reading, each warning an EngineText. */
function parseConfigLocalisable(text: string): { tree: ConfigTree; warnings: EngineText[] } {
  const warnings: EngineText[] = []; // each warning with its id
  const tree: ConfigTree = new Map();
  const sectionStack: string[] = [];
  const objectStack: string[] = [];
  let objectCount = 0;

  const currentSection = () => sectionStack.join(" / ");

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const cfg = /^config\s+(.+)$/i.exec(line);
    if (cfg) { sectionStack.push(cfg[1].trim()); continue; }

    const edit = /^edit\s+(.+)$/i.exec(line);
    if (edit) {
      const name = edit[1].trim().replace(/^"|"$/g, "");
      objectStack.push(name);
      if (objectStack.length === 1 && sectionStack.length > 0) {
        if (objectCount >= MAX_OBJECTS) { warnings.push(say("warn.capped", `Stopped after ${MAX_OBJECTS} objects.`, { max: String(MAX_OBJECTS) })); break; } // capped
        const sec = currentSection();
        if (!tree.has(sec)) tree.set(sec, new Map());
        const objs = tree.get(sec)!;
        if (!objs.has(name)) {
          objs.set(name, { name, settings: new Map(), index: objs.size });
          objectCount += 1;
        }
      }
      continue;
    }

    if (/^next$/i.test(line)) { objectStack.pop(); continue; }
    if (/^end$/i.test(line)) {
      // `end` closes the innermost config block. A nested block inside an edit
      // closes without popping the object.
      sectionStack.pop();
      continue;
    }

    const set = /^set\s+(\S+)\s*(.*)$/i.exec(line);
    if (set && objectStack.length > 0 && sectionStack.length > 0) {
      // Settings inside a NESTED block are prefixed with the nested path so
      // they do not collide with a same-named setting on the parent object.
      const depthPrefix = objectStack.length > 1 ? `${objectStack.slice(1).join(".")}.` : "";
      const nestedSection = sectionStack.length > 1 ? `${sectionStack.slice(1).join(".")}.` : "";
      const key = `${nestedSection}${depthPrefix}${set[1]}`;
      const value = set[2].trim();
      const sec = sectionStack[0];
      const objName = objectStack[0];
      const objs = tree.get(sec) ?? tree.get(currentSection());
      const obj = objs?.get(objName);
      if (obj) (obj.settings as Map<string, string>).set(key, value);
    }
  }

  if (tree.size === 0) warnings.push(say("warn.noSections", "No configuration sections were recognised. Expected `config <section>` blocks.")); // none
  return { tree, warnings };
}

/** Compare two settings maps. */
function diffSettings(a: ReadonlyMap<string, string>, b: ReadonlyMap<string, string>): SettingChange[] {
  const out: SettingChange[] = [];
  for (const [k, v] of a) {
    if (!b.has(k)) out.push({ key: k, before: v, after: null });
    else if (b.get(k) !== v) out.push({ key: k, before: v, after: b.get(k)! });
  }
  for (const [k, v] of b) if (!a.has(k)) out.push({ key: k, before: null, after: v });
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

export function diff(before: ConfigTree, after: ConfigTree): Change[] {
  return plainText(diffLocalisable(before, after)); // the same reading, details as English (the API's)
} // diff

/** Diff two trees: the page's reading, each detail an EngineText. */
function diffLocalisable(before: ConfigTree, after: ConfigTree): Change<EngineText>[] {
  const changes: Change<EngineText>[] = []; // each change, its detail with an id
  const sections = new Set([...before.keys(), ...after.keys()]);

  for (const sec of [...sections].sort()) {
    const A = before.get(sec);
    const B = after.get(sec);

    if (A && !B) {
      changes.push({ kind: "section-removed", section: sec, object: null, settings: [],
        detail: A.size === 1 // one object, or another count
          ? say("detail.sectionRemovedOne", `The entire section was removed, along with ${A.size} object.`, { n: String(A.size) }) // one
          : say("detail.sectionRemovedMany", `The entire section was removed, along with ${A.size} objects.`, { n: String(A.size) }) }); // another count
      continue;
    }
    if (!A && B) {
      changes.push({ kind: "section-added", section: sec, object: null, settings: [],
        detail: B.size === 1 // one object, or another count
          ? say("detail.sectionAddedOne", `New section with ${B.size} object.`, { n: String(B.size) }) // one
          : say("detail.sectionAddedMany", `New section with ${B.size} objects.`, { n: String(B.size) }) }); // another count
      continue;
    }
    if (!A || !B) continue;

    const names = new Set([...A.keys(), ...B.keys()]);
    for (const name of names) {
      const oa = A.get(name);
      const ob = B.get(name);
      if (oa && !ob) {
        changes.push({ kind: "object-removed", section: sec, object: name, settings: [],
          detail: say("detail.removed", `Removed.`) }); // removed
        continue;
      }
      if (!oa && ob) {
        changes.push({ kind: "object-added", section: sec, object: name, settings: [],
          detail: ob.settings.size === 1 // one setting, or another count
            ? say("detail.addedOne", `Added with ${ob.settings.size} setting.`, { n: String(ob.settings.size) }) // one
            : say("detail.addedMany", `Added with ${ob.settings.size} settings.`, { n: String(ob.settings.size) }) }); // another count
        continue;
      }
      if (!oa || !ob) continue;

      const sc = diffSettings(oa.settings, ob.settings);
      if (sc.length > 0) {
        changes.push({ kind: "object-changed", section: sec, object: name, settings: sc,
          detail: sc.length === 1 // one setting, or several
            ? say("detail.changedOne", `${sc.length} setting changed.`, { n: String(sc.length) }) // one
            : say("detail.changedMany", `${sc.length} settings changed.`, { n: String(sc.length) }) }); // several
      }
    }

    // Order is only a finding where order IS the behaviour.
    if (isOrderSensitive(sec)) {
      const common = [...A.keys()].filter((n) => B.has(n));
      const seqA = common.slice().sort((x, y) => A.get(x)!.index - A.get(y)!.index);
      const seqB = common.slice().sort((x, y) => B.get(x)!.index - B.get(y)!.index);
      if (seqA.join("\u0000") !== seqB.join("\u0000")) {
        changes.push({ kind: "object-moved", section: sec, object: null, settings: [],
          detail: say("detail.moved", `ORDER CHANGED in an order-sensitive section. Before: ${seqA.join(", ")}. After: ${seqB.join(", ")}. First match wins here, so moving an object changes what the device does even though no setting changed.`, { before: seqA.join(", "), after: seqB.join(", ") }) }); // reordered
      }
    }
  }
  return changes;
}

function referenceResult(): DiffResult<EngineText> {
  return {
    mode: "reference", changes: [], counts: {},
    notes: [
      say("ref.paste", "Paste two configurations separated by a line containing only --- , or use the labels BEFORE: and AFTER: on their own lines."), // what to paste
      say("ref.structure", "This compares STRUCTURE, not text. A block that moved is not reported as a deletion plus an insertion, and a setting that changed is one line naming the old and new value."), // structure
      say("ref.order", "For most sections the order of objects is irrelevant and is ignored. For firewall policy and its relatives, order IS the behaviour, so a reordering there is reported as a real change even when no setting differs."), // order
      say("ref.nested", "Nested config blocks inside an object are parsed, and their settings are prefixed so they cannot collide with a same-named setting on the parent."), // nesting
    ],
    parseWarnings: [],
  };
}

/** Split the input into the two sides. */
export function splitSides(text: string): { before: string; after: string } | null {
  const labelled = /^\s*before\s*:?\s*$/im.exec(text) && /^\s*after\s*:?\s*$/im.exec(text);
  if (labelled) {
    const parts = text.split(/^\s*after\s*:?\s*$/im);
    if (parts.length >= 2) {
      return { before: parts[0].replace(/^\s*before\s*:?\s*$/im, ""), after: parts.slice(1).join("\n") };
    }
  }
  const m = text.split(/^\s*-{3,}\s*$/m);
  if (m.length >= 2) return { before: m[0], after: m.slice(1).join("\n") };
  return null;
}

/** Tool entry point. Deterministic, bounded, never fetches. */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") throw engineError(say("err.notString", "Input must be a string.")); // not text
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };

  const sides = splitSides(text);
  if (!sides) {
    return {
      result: {
        mode: "diff", changes: [], counts: {}, notes: [],
        parseWarnings: [say("warn.noSides", "Could not find two sides. Separate them with a line containing only --- , or label them BEFORE: and AFTER: on their own lines.")], // one side only
      },
    };
  }

  const a = parseConfigLocalisable(sides.before); // the before side, warnings with ids
  const b = parseConfigLocalisable(sides.after); // the after side, warnings with ids
  const warnings = [
    ...a.warnings.map((w) => say("warn.before", `before: ${w}`, { w })), // labelled before
    ...b.warnings.map((w) => say("warn.after", `after: ${w}`, { w })), // labelled after
  ];
  const changes = diffLocalisable(a.tree, b.tree); // the changes, details with ids
  const counts: Record<string, number> = {};
  for (const c of changes) counts[c.kind] = (counts[c.kind] ?? 0) + 1;

  const notes: EngineText[] = []; // each note with its id
  if (changes.length === 0) {
    notes.push(say("note.none", "No structural differences. The two configurations describe the same objects with the same settings; any textual difference is formatting or ordering in a section where order does not matter.")); // no difference
  }
  if (counts["object-moved"]) {
    notes.push(say("note.moved", "An order change in an order-sensitive section is a behaviour change with no setting change, which is exactly the edit a line diff buries and a reviewer misses.")); // a reordering
  }
  notes.push(say("note.insensitive", "Structural comparison: an object that moved within an order-INSENSITIVE section is not reported, because it changes nothing.")); // the scope

  return { result: { mode: "diff", changes, counts, notes, parseWarnings: warnings } };
}
