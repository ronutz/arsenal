// ============================================================================
// src/lib/tools/fortios-cli-config-explainer/compute.ts
// ----------------------------------------------------------------------------
// FORTIOS CLI CONFIG EXPLAINER - the pure engine.
//
// WHAT IT READS. A FortiOS configuration block - config / edit / set / next /
// end - and returns the structure as a tree with each verb explained.
//
// *** THE TRAP THIS TOOL EXISTS TO CATCH ***
//
//   `set` REPLACES a multi-value field. `append` ADDS to it.
//
// So `set srcaddr internal-net` on a policy that already had four source
// addresses leaves it with one. The command succeeds, the commit succeeds, and
// three address objects have silently left the policy. Nothing in the output
// says anything happened.
//
// This is the single most expensive habit in FortiOS CLI work, and it is
// invisible in a config block read casually - which is precisely when a block
// is read.
//
// TWO MORE THAT MATTER:
//
//   - `edit <name>` CREATES the object when it does not exist. It is not a
//     lookup that fails on a typo; it is a create-or-enter. A mistyped policy
//     ID makes a new policy rather than an error.
//   - `end` is what COMMITS. `abort` discards. Leaving a block by any other
//     means is not a save, and the difference between `next` and `end` is the
//     difference between staying in the table and closing it.
//
// SCOPE. Structure and verbs, not semantics. It does not know your address
// objects, and it cannot tell you whether a value is sensible - only whether
// the command shape does what the person typing it probably expected.
//
// PAGE LANGUAGE (02/11/2026): every explanation, note, warning and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. decodeConfigLocalisable() returns them as
// such for the page (pack keys tools.fortios-cli-config-explainer.engine.<id>);
// decodeConfig() returns plainText() of the same reading, so the API, the share
// spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type Verb = "config" | "edit" | "set" | "unset" | "append" | "next" | "end" | "abort" | "delete" | "purge" | "unknown";

/** S is string in the API's reading and EngineText in the page's (decodeConfigLocalisable). */
export interface ConfigLine<S = string> {
  /** 1-based line number in the pasted text. */
  line: number;
  /** Nesting depth after this line is processed. */
  depth: number;
  verb: Verb;
  /** The rest of the line after the verb. */
  rest: string;
  explain: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ConfigDecode<S = string> {
  lines: ConfigLine<S>[]; // each line, explained
  /** Paths opened but never closed. */
  unclosed: string[];
  /** True when the block ends with everything closed. */
  balanced: boolean;
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
}

export class ConfigParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigParseError";
  }
}

/** Fields that take a list, where `set` replacing the list is the trap. */
const LIST_FIELDS = new Set([
  "srcaddr", "dstaddr", "srcintf", "dstintf", "service", "member", "srcaddr6",
  "dstaddr6", "groups", "users", "interface", "vlan", "dnsfilter-profile-list",
  "internet-service-name", "internet-service-id", "app-category", "application",
]);

const VERB_OF = (word: string): Verb => {
  const w = word.toLowerCase();
  if (w === "config" || w === "edit" || w === "set" || w === "unset" || w === "append" ||
      w === "next" || w === "end" || w === "abort" || w === "delete" || w === "purge") {
    return w as Verb;
  }
  return "unknown";
};

/**
 * Parse a FortiOS configuration block: the API's reading (and the golden vectors'), every sentence in English,
 * exactly as before 02/11/2026.
 * @param input the pasted block
 * @returns the reading
 */
export function decodeConfig(input: string): ConfigDecode {
  return plainText(decodeConfigLocalisable(input)); // the same reading, sentences as their English
} // decodeConfig

/**
 * A parse error that carries its sentence, so the page can show it in its own language.
 * @param m the sentence
 * @returns the error to throw (class and message as before)
 */
function parseError(m: EngineText): ConfigParseError {
  return withEngineText(new ConfigParseError(m.text), m); // the same class and message, plus the sentence
} // parseError

/**
 * The page's reading: the same as decodeConfig(), with every sentence an EngineText (id, English, values).
 * @param input the pasted block
 * @returns the reading
 */
export function decodeConfigLocalisable(input: string): ConfigDecode<EngineText> {
  const raw = (input ?? "").trim();
  if (!raw) throw parseError(say("err.empty", "Nothing to explain: paste a FortiOS configuration block.")); // nothing pasted

  const src = raw.split("\n");
  const lines: ConfigLine<EngineText>[] = []; // each line, explained
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id
  const stack: string[] = [];
  let sawAnything = false;

  for (let i = 0; i < src.length; i++) {
    const text = src[i].trim();
    if (!text || text.startsWith("#")) continue;
    const [word, ...restParts] = text.split(/\s+/);
    const verb = VERB_OF(word);
    const rest = restParts.join(" ");
    if (verb !== "unknown") sawAnything = true;

    let explain: EngineText; // this line's explanation
    switch (verb) {
      case "config":
        stack.push(`config ${rest}`);
        explain = say("explain.config", `Opens ${rest}. If this names a table, the entries inside are reached with edit; if it names a single object, set applies directly.`, { rest }); // opens a path
        break;
      case "edit":
        stack.push(`edit ${rest}`);
        explain = say("explain.edit", // enters or creates an entry
          `Enters the table entry "${rest}" - AND CREATES IT if it does not already exist. This is not a lookup that fails on a typo: a mistyped name makes a new object, which is why a stray entry usually traces back to a keystroke rather than to a decision.`, { rest });
        break;
      case "set": {
        const field = restParts[0] ?? "";
        if (LIST_FIELDS.has(field.toLowerCase())) {
          explain = say("explain.setList", // a list field: the trap
            `Sets ${field}. THIS REPLACES THE WHOLE LIST. Anything previously in ${field} and not named here is removed, silently and successfully. Use append to add to it instead.`, { field });
          warnings.push(say("warn.setList", // the warning that goes with it
            `Line ${i + 1}: "set ${field}" replaces every value in ${field} rather than adding to it. If the intent was to add, the command is append.`, { line: String(i + 1), field },
          ));
        } else {
          explain = field // a named field, or none
            ? say("explain.set", `Assigns ${field}. A set replaces whatever was there.`, { field }) // a single-value field
            : say("explain.setNoField", "Assigns a field. A set replaces whatever was there."); // set with nothing after it
        }
        break;
      }
      case "append":
        explain = restParts[0] !== undefined // a named field, or none
          ? say("explain.append", `Adds to ${restParts[0]} without disturbing what is already there. This is the safe half of the set/append pair.`, { field: restParts[0] }) // append to a field
          : say("explain.appendNoField", "Adds to a list field without disturbing what is already there. This is the safe half of the set/append pair."); // append with nothing after it
        break;
      case "unset":
        explain = restParts[0] !== undefined // a named field, or none
          ? say("explain.unset", `Returns ${restParts[0]} to its default. Not the same as setting it empty - the default may be a value.`, { field: restParts[0] }) // unset a field
          : say("explain.unsetNoField", "Returns the field to its default. Not the same as setting it empty - the default may be a value."); // unset with nothing after it
        break;
      case "next":
        if (stack.length) stack.pop();
        explain = say("explain.next", "Closes this table entry and STAYS IN THE TABLE, ready for the next edit. It does not leave the block and it does not commit."); // next
        break;
      case "end":
        if (stack.length) stack.pop();
        explain = say("explain.end", "Closes the block AND COMMITS it. This is the line that makes the change real."); // end
        break;
      case "abort":
        if (stack.length) stack.pop();
        explain = say("explain.abort", "Leaves the block DISCARDING the changes. The counterpart to end, and the one to reach for when you are unsure."); // abort
        break;
      case "delete":
        explain = say("explain.delete", `Removes ${rest}. There is no confirmation and no undo within the session.`, { rest }); // delete
        break;
      case "purge":
        explain = say("explain.purge", "Removes EVERY entry in the current table. Rarely what was meant, and never reversible from the session."); // purge
        warnings.push(say("warn.purge", `Line ${i + 1}: purge removes every entry in the table, not one.`, { line: String(i + 1) })); // and its warning
        break;
      default:
        explain = say("explain.unknown", "Not a FortiOS configuration verb this tool recognises. It is shown in place and nothing is claimed about it."); // anything else
    }

    lines.push({ line: i + 1, depth: stack.length, verb, rest, explain });
  }

  if (!sawAnything) {
    throw parseError(say("err.noVerbs", // no verb at all
      "No FortiOS configuration verbs found. This expects a block using config, edit, set, next and end.",
    ));
  }

  const balanced = stack.length === 0;
  if (!balanced) {
    const count = String(stack.length); // how many
    const path = stack.join(" -> "); // which
    warnings.push(say("warn.unclosed", // blocks left open
      `${count} block(s) were opened and never closed: ${path}. An unclosed block has not been committed, and pasting it into a live device leaves the session somewhere unexpected.`, { count, path },
    ));
  }

  const hasEnd = lines.some((l) => l.verb === "end");
  if (!hasEnd && lines.some((l) => l.verb === "config")) {
    notes.push(say("note.noEnd", // nothing committed
      "There is no end in this block. Nothing here has been committed - end is the line that makes a change real, and abort is the line that discards it.",
    ));
  }
  notes.push(say("note.nextEnd", // next is not end
    "next and end are not interchangeable. next closes an entry and stays in the table; end closes the table and commits. A block that uses end where next was meant leaves the table early, and the remaining edits apply somewhere else entirely.",
  ));
  notes.push(say("note.show", // show hides defaults
    "show displays only what differs from the defaults; show full-configuration displays everything. A field missing from a config block is not necessarily unset - it may simply be at its default.",
  ));

  return { lines, unclosed: [...stack], balanced, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): ConfigDecode {
  return decodeConfig(input);
}
