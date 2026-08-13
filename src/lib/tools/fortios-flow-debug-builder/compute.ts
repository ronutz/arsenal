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
// ============================================================================

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

export interface CommandLine {
  cmd: string;
  why: string;
}

export interface FlowDebugPlan {
  /** Commands to reach a known-clean state before anything else. */
  reset: CommandLine[];
  /** The filter, then the display options, then the trace, then enable. */
  setup: CommandLine[];
  /** What to run afterwards, without fail. */
  cleanup: CommandLine[];
  notes: string[];
  warnings: string[];
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

/** Build the ordered command plan. */
export function buildFlowDebug(input: FlowDebugInput): FlowDebugPlan {
  const notes: string[] = [];
  const warnings: string[] = [];

  const hasFilter =
    !!(input.addr || input.saddr || input.daddr || input.port || input.sport || input.dport || input.proto);

  if (!hasFilter) {
    throw new FlowDebugError(
      "Set at least one filter. An unfiltered debug flow on a production firewall traces every session it sees, which is the fastest way to make a console unusable.",
    );
  }

  // --- reset: never skipped -------------------------------------------------
  const reset: CommandLine[] = [
    { cmd: "diagnose debug disable", why: "Stops any debug output already running from an earlier session." },
    { cmd: "diagnose debug flow filter clear", why: "Clears any filter left behind. A leftover filter silently narrows your trace to somebody else's problem." },
    { cmd: "diagnose debug reset", why: "Returns all debug settings to their defaults, so what follows is the only thing in effect." },
  ];

  // --- setup, filter first --------------------------------------------------
  const setup: CommandLine[] = [];
  if (input.vdom) {
    setup.push({ cmd: `config vdom`, why: "Filters apply within a virtual domain. Enter the one that owns the traffic." });
    setup.push({ cmd: `edit ${input.vdom}`, why: `Selects the ${input.vdom} virtual domain.` });
  }

  const push = (key: string, val: string | undefined, why: string) => {
    if (!val) return;
    if ((key === "addr" || key === "saddr" || key === "daddr") && !looksLikeAddress(val)) {
      warnings.push(`"${val}" does not look like an address. It is passed through as typed.`);
    }
    setup.push({ cmd: `diagnose debug flow filter ${key} ${val}`, why });
  };

  push("addr", input.addr, "Matches this address as either source or destination. The usual starting point.");
  push("saddr", input.saddr, "Matches this source address only.");
  push("daddr", input.daddr, "Matches this destination address only.");
  push("port", input.port, "Matches this port as either source or destination.");
  push("sport", input.sport, "Matches this source port only.");
  push("dport", input.dport, "Matches this destination port only.");

  if (input.proto) {
    const raw = input.proto.trim().toLowerCase();
    const num = PROTO[raw] ?? raw;
    if (!/^\d+$/.test(num)) {
      warnings.push(`Protocol "${input.proto}" is not a name this tool knows or a number. It is passed through as typed.`);
    }
    setup.push({
      cmd: `diagnose debug flow filter proto ${num}`,
      why: `Restricts the trace to protocol ${num}${PROTO[raw] ? ` (${raw})` : ""}. FortiOS wants the number, not the name.`,
    });
  }

  setup.push({
    cmd: "diagnose debug flow filter",
    why: "Run with no arguments, this PRINTS the filter now in effect. Check it before starting the trace - it is the one step that catches a typo before it costs you a reproduction.",
  });

  setup.push({
    cmd: "diagnose debug flow show function-name enable",
    why: "Includes the kernel function name in each line, which is what turns the output from a wall of text into a readable path through the packet flow.",
  });

  if (input.iprope) {
    setup.push({
      cmd: "diagnose debug flow show iprope enable",
      why: "Reveals the internal iprope rule checks - the tables traffic is matched against, including local-in policy. Off by default and frequently the thing you actually needed.",
    });
  }
  if (input.timestamp) {
    setup.push({
      cmd: "diagnose debug console timestamp enable",
      why: "Prefixes each line with a timestamp, which matters when correlating with a packet capture or a log.",
    });
  }

  const count = input.count && input.count > 0 ? Math.floor(input.count) : 100;
  setup.push({
    cmd: `diagnose debug flow trace start ${count}`,
    why: `Arms the trace for ${count} PACKETS. This is a packet count, not a duration - a busy interface can exhaust it in under a second.`,
  });
  setup.push({
    cmd: "diagnose debug enable",
    why: "Turns the output on. Last on purpose: with the filter already set, output starts narrow instead of arriving for everything.",
  });

  // --- cleanup --------------------------------------------------------------
  const cleanup: CommandLine[] = [
    { cmd: "diagnose debug flow trace stop", why: "Stops the trace." },
    { cmd: "diagnose debug disable", why: "Stops debug output. Do this even if the trace count has been exhausted." },
    { cmd: "diagnose debug flow filter clear", why: "Clears the filter so the next person starts clean." },
    { cmd: "diagnose debug reset", why: "Returns everything to defaults." },
  ];

  // --- notes worth more than the commands -----------------------------------
  notes.push(
    "Fortinet's administration guide shows `diagnose debug enable` FIRST, before the filter. This sequence puts it last. Both work, and the difference matters on a busy firewall: enabling output before the filter is set means everything is traced until the filter lands.",
  );
  notes.push(
    "Traffic offloaded to hardware does not pass through the code this traces. On platforms with NP or SP processors a correct filter can produce nothing at all while traffic is plainly flowing - the session is being handled in silicon. Disabling offload for a test changes what you are measuring, so treat it as a deliberate step rather than a fix.",
  );
  notes.push(
    "Function line numbers in the output are not stable across FortiOS versions. Match on the function name, never on the line number.",
  );
  if (count > 200) {
    warnings.push(`A trace count of ${count} on a busy interface can produce more output than a console session can usefully display. Start smaller and repeat if you need to.`);
  }

  return { reset, setup, cleanup, notes, warnings };
}

/** Flatten a plan to pasteable text. */
export function planToText(plan: FlowDebugPlan): string {
  const block = (title: string, lines: CommandLine[]) =>
    [`# ${title}`, ...lines.map((l) => l.cmd)].join("\n");
  return [
    block("1. clean state", plan.reset),
    "",
    block("2. filter, then trace, then enable", plan.setup),
    "",
    "# 3. reproduce the traffic now",
    "",
    block("4. cleanup - do not skip", plan.cleanup),
  ].join("\n");
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: FlowDebugInput): FlowDebugPlan {
  return buildFlowDebug(input);
}
