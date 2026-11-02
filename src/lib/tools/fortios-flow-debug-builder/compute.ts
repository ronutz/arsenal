// ============================================================================
// src/lib/tools/fortios-flow-debug-builder/compute.ts
// ----------------------------------------------------------------------------
// FORTIOS DEBUG FLOW BUILDER - the pure engine.
//
// WHAT THIS SOLVES. `diagnose debug flow` is the command every FortiGate
// engineer eventually needs and almost nobody remembers correctly, because it
// is not one command: it is a SEQUENCE, the order matters, and the cleanup
// matters more than the setup. A debug left running on a production firewall
// keeps writing to the console.
//
// AN HONEST NOTE ON ORDER, WHICH THIS TOOL EXISTS TO SETTLE.
// Fortinet's own administration guide shows `diagnose debug enable` FIRST,
// before the filter:
//
//     diagnose debug enable
//     diagnose debug flow filter addr 203.160.224.97
//     diagnose debug flow show function-name enable
//     diagnose debug flow trace start 100
//
// Widespread field practice puts `diagnose debug enable` LAST, after the filter
// and the trace start. BOTH WORK. The difference is what happens in between: on
// a busy firewall, enabling debug before the filter is set means output starts
// arriving for everything, and on a console that can be genuinely difficult to
// recover from.
//
// This tool emits the FILTER-FIRST order and says why, rather than silently
// picking one. The documented order is shown as a note, not hidden.
//
// SCOPE. It generates text. It contacts nothing, and it cannot know your
// platform, your VDOM layout or whether the session you care about is being
// offloaded to hardware - which is the single most common reason a correct
// trace shows nothing at all. That caveat is emitted with the commands.
//
// PAGE LANGUAGE (02/11/2026): every explanation, note, warning and error, and
// the headings of the pasteable text, is built as an EngineText
// (src/lib/tools/engine-text.ts): a stable id, the English as before, and its
// values. buildFlowDebugLocalisable() returns them as such for the page (pack
// keys tools.fortios-flow-debug-builder.engine.<id>), and planToTextIn() writes
// the pasteable text with its headings in the page's language; buildFlowDebug(),
// run() and planToText() return exactly what they returned before, so the API
// and the golden vectors are unchanged. The commands themselves never change.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** What the operator wants to trace. */
export interface FlowDebugInput {
  /** Match either direction. Mutually useful with saddr/daddr but simpler. */
  addr?: string;
  saddr?: string;
  daddr?: string;
  /** Match either direction. */
  port?: string;
  sport?: string;
  dport?: string;
  /** Protocol name or number: tcp, udp, icmp, 6, 17, 1. */
  proto?: string;
  /** Packet count for `trace start`. NOT a duration. */
  count?: number;
  /** Include `show iprope enable`, which reveals the internal rule checks. */
  iprope?: boolean;
  /** Include `console timestamp enable`. */
  timestamp?: boolean;
  /** Restrict to a virtual domain. */
  vdom?: string;
}

/** S is string in the API's reading and EngineText in the page's (buildFlowDebugLocalisable). */
export interface CommandLine<S = string> {
  cmd: string;
  why: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface FlowDebugPlan<S = string> {
  /** Commands to reach a known-clean state before anything else. */
  reset: CommandLine<S>[];
  /** The filter, then the display options, then the trace, then enable. */
  setup: CommandLine<S>[];
  /** What to run afterwards, without fail. */
  cleanup: CommandLine<S>[];
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
}

/** Protocol names accepted, mapped to the numbers FortiOS wants. */
const PROTO: Record<string, string> = {
  tcp: "6", udp: "17", icmp: "1", icmpv6: "58", gre: "47", esp: "50", ah: "51", sctp: "132",
};

export class FlowDebugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowDebugError";
  }
}

/** Very light sanity check: this is a builder, not a validator. */
function looksLikeAddress(v: string): boolean {
  return /^[0-9a-fA-F:.\/]+$/.test(v);
}

/** Build the ordered command plan: the API's reading (and the golden vectors'), every sentence in English, as before. */
export function buildFlowDebug(input: FlowDebugInput): FlowDebugPlan {
  return plainText(buildFlowDebugLocalisable(input)); // the same plan, sentences as their English
} // buildFlowDebug

/** Build the ordered command plan: the page's reading, every sentence an EngineText (id, English, values). */
export function buildFlowDebugLocalisable(input: FlowDebugInput): FlowDebugPlan<EngineText> {
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id

  const hasFilter =
    !!(input.addr || input.saddr || input.daddr || input.port || input.sport || input.dport || input.proto);

  if (!hasFilter) {
    const m = say("err.noFilter", // no filter at all
      "Set at least one filter. An unfiltered debug flow on a production firewall traces every session it sees, which is the fastest way to make a console unusable.",
    );
    throw withEngineText(new FlowDebugError(m.text), m); // the same class and message, plus the sentence
  }

  // --- reset: never skipped -------------------------------------------------
  const reset: CommandLine<EngineText>[] = [
    { cmd: "diagnose debug disable", why: say("why.resetDisable", "Stops any debug output already running from an earlier session.") }, // stop old output
    { cmd: "diagnose debug flow filter clear", why: say("why.resetClear", "Clears any filter left behind. A leftover filter silently narrows your trace to somebody else's problem.") }, // clear an old filter
    { cmd: "diagnose debug reset", why: say("why.resetReset", "Returns all debug settings to their defaults, so what follows is the only thing in effect.") }, // defaults
  ];

  // --- setup, filter first --------------------------------------------------
  const setup: CommandLine<EngineText>[] = []; // each step with its explanation
  if (input.vdom) {
    setup.push({ cmd: `config vdom`, why: say("why.configVdom", "Filters apply within a virtual domain. Enter the one that owns the traffic.") }); // enter the VDOM table
    setup.push({ cmd: `edit ${input.vdom}`, why: say("why.editVdom", `Selects the ${input.vdom} virtual domain.`, { vdom: input.vdom }) }); // select the VDOM
  }
  const push = (key: string, val: string | undefined, why: EngineText) => {
    if (!val) return;
    if ((key === "addr" || key === "saddr" || key === "daddr") && !looksLikeAddress(val)) {
      warnings.push(say("warn.notAddress", `"${val}" does not look like an address. It is passed through as typed.`, { val })); // passed through as typed
    }
    setup.push({ cmd: `diagnose debug flow filter ${key} ${val}`, why });
  };

  push("addr", input.addr, say("why.addr", "Matches this address as either source or destination. The usual starting point.")); // either direction
  push("saddr", input.saddr, say("why.saddr", "Matches this source address only.")); // source only
  push("daddr", input.daddr, say("why.daddr", "Matches this destination address only.")); // destination only
  push("port", input.port, say("why.port", "Matches this port as either source or destination.")); // either direction
  push("sport", input.sport, say("why.sport", "Matches this source port only.")); // source only
  push("dport", input.dport, say("why.dport", "Matches this destination port only.")); // destination only

  if (input.proto) {
    const raw = input.proto.trim().toLowerCase();
    const num = PROTO[raw] ?? raw;
    if (!/^\d+$/.test(num)) {
      warnings.push(say("warn.proto", `Protocol "${input.proto}" is not a name this tool knows or a number. It is passed through as typed.`, { proto: input.proto })); // passed through as typed
    }
    setup.push({
      cmd: `diagnose debug flow filter proto ${num}`,
      why: PROTO[raw] // a name the tool translated, or a number
        ? say("why.protoNamed", `Restricts the trace to protocol ${num} (${raw}). FortiOS wants the number, not the name.`, { num, raw }) // with the name it came from
        : say("why.proto", `Restricts the trace to protocol ${num}. FortiOS wants the number, not the name.`, { num }), // a number as typed
    });
  }

  setup.push({
    cmd: "diagnose debug flow filter",
    why: say("why.showFilter", "Run with no arguments, this PRINTS the filter now in effect. Check it before starting the trace - it is the one step that catches a typo before it costs you a reproduction."), // print the filter
  });

  setup.push({
    cmd: "diagnose debug flow show function-name enable",
    why: say("why.functionName", "Includes the kernel function name in each line, which is what turns the output from a wall of text into a readable path through the packet flow."), // function names
  });

  if (input.iprope) {
    setup.push({
      cmd: "diagnose debug flow show iprope enable",
      why: say("why.iprope", "Reveals the internal iprope rule checks - the tables traffic is matched against, including local-in policy. Off by default and frequently the thing you actually needed."), // iprope
    });
  }
  if (input.timestamp) {
    setup.push({
      cmd: "diagnose debug console timestamp enable",
      why: say("why.timestamp", "Prefixes each line with a timestamp, which matters when correlating with a packet capture or a log."), // timestamps
    });
  }

  const count = input.count && input.count > 0 ? Math.floor(input.count) : 100;
  setup.push({
    cmd: `diagnose debug flow trace start ${count}`,
    why: say("why.traceStart", `Arms the trace for ${count} PACKETS. This is a packet count, not a duration - a busy interface can exhaust it in under a second.`, { count: String(count) }), // the packet count
  });
  setup.push({
    cmd: "diagnose debug enable",
    why: say("why.enable", "Turns the output on. Last on purpose: with the filter already set, output starts narrow instead of arriving for everything."), // output on, last
  });

  // --- cleanup --------------------------------------------------------------
  const cleanup: CommandLine<EngineText>[] = [
    { cmd: "diagnose debug flow trace stop", why: say("why.traceStop", "Stops the trace.") }, // stop the trace
    { cmd: "diagnose debug disable", why: say("why.cleanDisable", "Stops debug output. Do this even if the trace count has been exhausted.") }, // output off
    { cmd: "diagnose debug flow filter clear", why: say("why.cleanClear", "Clears the filter so the next person starts clean.") }, // clear the filter
    { cmd: "diagnose debug reset", why: say("why.cleanReset", "Returns everything to defaults.") }, // defaults
  ];

  // --- notes worth more than the commands -----------------------------------
  notes.push(say("note.order", // the documented order
    "Fortinet's administration guide shows `diagnose debug enable` FIRST, before the filter. This sequence puts it last. Both work, and the difference matters on a busy firewall: enabling output before the filter is set means everything is traced until the filter lands.",
  ));
  notes.push(say("note.offload", // offloaded traffic
    "Traffic offloaded to hardware does not pass through the code this traces. On platforms with NP or SP processors a correct filter can produce nothing at all while traffic is plainly flowing - the session is being handled in silicon. Disabling offload for a test changes what you are measuring, so treat it as a deliberate step rather than a fix.",
  ));
  notes.push(say("note.lineNumbers", // line numbers move
    "Function line numbers in the output are not stable across FortiOS versions. Match on the function name, never on the line number.",
  ));
  if (count > 200) {
    warnings.push(say("warn.bigCount", `A trace count of ${count} on a busy interface can produce more output than a console session can usefully display. Start smaller and repeat if you need to.`, { count: String(count) })); // a large count
  }

  return { reset, setup, cleanup, notes, warnings };
}

/** Flatten a plan to pasteable text: the API's and the golden vectors' text, headings in English, as before. */
export function planToText(plan: FlowDebugPlan): string {
  return planToTextIn(plan, (m) => m.text); // the headings in English
} // planToText

/** The commands of a plan, whichever language its sentences are in (only the commands are written). */
type PlanCommands = { reset: readonly { cmd: string }[]; setup: readonly { cmd: string }[]; cleanup: readonly { cmd: string }[] };

/**
 * Flatten a plan to pasteable text with its headings in a language.
 * @param plan the plan (the API's or the page's)
 * @param inLanguage a heading in the reader's language (the page passes its engineTexts().say)
 * @returns the text
 */
export function planToTextIn(plan: PlanCommands, inLanguage: (m: EngineText) => string): string {
  const block = (title: EngineText, lines: readonly { cmd: string }[]) =>
    [`# ${inLanguage(title)}`, ...lines.map((l) => l.cmd)].join("\n");
  return [
    block(say("text.clean", "1. clean state"), plan.reset), // heading 1
    "",
    block(say("text.setup", "2. filter, then trace, then enable"), plan.setup), // heading 2
    "",
    `# ${inLanguage(say("text.reproduce", "3. reproduce the traffic now"))}`, // heading 3
    "",
    block(say("text.cleanup", "4. cleanup - do not skip"), plan.cleanup), // heading 4
  ].join("\n");
} // planToTextIn

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: FlowDebugInput): FlowDebugPlan {
  return buildFlowDebug(input);
}
