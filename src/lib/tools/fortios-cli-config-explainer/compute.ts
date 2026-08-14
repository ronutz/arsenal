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
// ============================================================================

export type Verb = "config" | "edit" | "set" | "unset" | "append" | "next" | "end" | "abort" | "delete" | "purge" | "unknown";

export interface ConfigLine {
  /** 1-based line number in the pasted text. */
  line: number;
  /** Nesting depth after this line is processed. */
  depth: number;
  verb: Verb;
  /** The rest of the line after the verb. */
  rest: string;
  explain: string;
}

export interface ConfigDecode {
  lines: ConfigLine[];
  /** Paths opened but never closed. */
  unclosed: string[];
  /** True when the block ends with everything closed. */
  balanced: boolean;
  notes: string[];
  warnings: string[];
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

/** Parse a FortiOS configuration block. */
export function decodeConfig(input: string): ConfigDecode {
  const raw = (input ?? "").trim();
  if (!raw) throw new ConfigParseError("Nothing to explain: paste a FortiOS configuration block.");

  const src = raw.split("\n");
  const lines: ConfigLine[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];
  const stack: string[] = [];
  let sawAnything = false;

  for (let i = 0; i < src.length; i++) {
    const text = src[i].trim();
    if (!text || text.startsWith("#")) continue;
    const [word, ...restParts] = text.split(/\s+/);
    const verb = VERB_OF(word);
    const rest = restParts.join(" ");
    if (verb !== "unknown") sawAnything = true;

    let explain = "";
    switch (verb) {
      case "config":
        stack.push(`config ${rest}`);
        explain = `Opens ${rest}. If this names a table, the entries inside are reached with edit; if it names a single object, set applies directly.`;
        break;
      case "edit":
        stack.push(`edit ${rest}`);
        explain =
          `Enters the table entry "${rest}" - AND CREATES IT if it does not already exist. This is not a lookup that fails on a typo: a mistyped name makes a new object, which is why a stray entry usually traces back to a keystroke rather than to a decision.`;
        break;
      case "set": {
        const field = restParts[0] ?? "";
        if (LIST_FIELDS.has(field.toLowerCase())) {
          explain =
            `Sets ${field}. THIS REPLACES THE WHOLE LIST. Anything previously in ${field} and not named here is removed, silently and successfully. Use append to add to it instead.`;
          warnings.push(
            `Line ${i + 1}: "set ${field}" replaces every value in ${field} rather than adding to it. If the intent was to add, the command is append.`,
          );
        } else {
          explain = `Assigns ${field || "a field"}. A set replaces whatever was there.`;
        }
        break;
      }
      case "append":
        explain = `Adds to ${restParts[0] ?? "a list field"} without disturbing what is already there. This is the safe half of the set/append pair.`;
        break;
      case "unset":
        explain = `Returns ${restParts[0] ?? "the field"} to its default. Not the same as setting it empty - the default may be a value.`;
        break;
      case "next":
        if (stack.length) stack.pop();
        explain = "Closes this table entry and STAYS IN THE TABLE, ready for the next edit. It does not leave the block and it does not commit.";
        break;
      case "end":
        if (stack.length) stack.pop();
        explain = "Closes the block AND COMMITS it. This is the line that makes the change real.";
        break;
      case "abort":
        if (stack.length) stack.pop();
        explain = "Leaves the block DISCARDING the changes. The counterpart to end, and the one to reach for when you are unsure.";
        break;
      case "delete":
        explain = `Removes ${rest}. There is no confirmation and no undo within the session.`;
        break;
      case "purge":
        explain = "Removes EVERY entry in the current table. Rarely what was meant, and never reversible from the session.";
        warnings.push(`Line ${i + 1}: purge removes every entry in the table, not one.`);
        break;
      default:
        explain = "Not a FortiOS configuration verb this tool recognises. It is shown in place and nothing is claimed about it.";
    }

    lines.push({ line: i + 1, depth: stack.length, verb, rest, explain });
  }

  if (!sawAnything) {
    throw new ConfigParseError(
      "No FortiOS configuration verbs found. This expects a block using config, edit, set, next and end.",
    );
  }

  const balanced = stack.length === 0;
  if (!balanced) {
    warnings.push(
      `${stack.length} block(s) were opened and never closed: ${stack.join(" -> ")}. An unclosed block has not been committed, and pasting it into a live device leaves the session somewhere unexpected.`,
    );
  }

  const hasEnd = lines.some((l) => l.verb === "end");
  if (!hasEnd && lines.some((l) => l.verb === "config")) {
    notes.push(
      "There is no end in this block. Nothing here has been committed - end is the line that makes a change real, and abort is the line that discards it.",
    );
  }
  notes.push(
    "next and end are not interchangeable. next closes an entry and stays in the table; end closes the table and commits. A block that uses end where next was meant leaves the table early, and the remaining edits apply somewhere else entirely.",
  );
  notes.push(
    "show displays only what differs from the defaults; show full-configuration displays everything. A field missing from a config block is not necessarily unset - it may simply be at its default.",
  );

  return { lines, unclosed: [...stack], balanced, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): ConfigDecode {
  return decodeConfig(input);
}
