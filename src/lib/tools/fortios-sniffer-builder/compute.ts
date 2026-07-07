// ============================================================================
// src/lib/tools/fortios-sniffer-builder/compute.ts
// ----------------------------------------------------------------------------
// FORTIOS PACKET SNIFFER BUILDER + DECODER.
//
// Two directions, both offline and deterministic:
//   - BUILD: given structured parameters (interface, filter parts, verbosity,
//     count, timestamp format), compose the exact FortiOS CLI command
//        diagnose sniffer packet <interface> <'filter'> <verbose> <count> <tsformat>
//     and explain every argument.
//   - DECODE: given a pasted "diagnose sniffer packet ..." command, split it
//     argument by argument and explain what each one means, with warnings for
//     the common traps (blank timestamp under parallel captures, verbosity
//     that omits interface names, ASIC/NP offload hiding traffic, VLAN tag
//     stripping on 'any'/VLAN interfaces at verbose >= 3/6).
//
// Grounded in the FortiOS CLI reference and Fortinet's own sniffer
// documentation (see index.ts sources). Clean-room: this is our own model of
// the command grammar and verbosity table, not vendor code. It never runs a
// sniffer, never opens a socket, never fetches; it only reads and composes
// text. run() throws on oversized input (the worker-compatible contract).
// ============================================================================

/** Hard input ceiling; a sniffer command is short, so this is generous. */
const MAX_INPUT = 4000;

/** The six FortiOS verbosity levels, verbatim from the CLI help text. */
export interface VerbosityInfo {
  readonly level: number;
  /** The CLI help one-liner for this level. */
  readonly help: string;
  /** Whether this level prints the interface name (verbose >= 4). */
  readonly showsInterface: boolean;
  /** Deepest layer whose data is printed: none | ip | ethernet. */
  readonly depth: "headers" | "ip" | "ethernet";
}

export const VERBOSITY: readonly VerbosityInfo[] = [
  { level: 1, help: "print header of packets", showsInterface: false, depth: "headers" },
  { level: 2, help: "print header and data from IP of packets", showsInterface: false, depth: "ip" },
  { level: 3, help: "print header and data from Ethernet of packets (if available)", showsInterface: false, depth: "ethernet" },
  { level: 4, help: "print header of packets with interface name", showsInterface: true, depth: "headers" },
  { level: 5, help: "print header and data from IP of packets with interface name", showsInterface: true, depth: "ip" },
  { level: 6, help: "print header and data from Ethernet of packets (if available) with interface name", showsInterface: true, depth: "ethernet" },
];

/** Timestamp format options for the last CLI argument. */
export interface TsFormatInfo {
  readonly code: string;
  readonly label: string;
  readonly detail: string;
}

export const TSFORMATS: readonly TsFormatInfo[] = [
  { code: "a", label: "absolute UTC", detail: "yyyy-mm-dd hh:mm:ss.ms in UTC (no time zone). Use for parallel captures so lines from different sessions can be correlated." },
  { code: "l", label: "absolute local", detail: "yyyy-mm-dd hh:mm:ss.ms in the FortiGate's local time. Also safe for parallel captures." },
  { code: "", label: "relative", detail: "seconds since the sniff started (ss.ms). The default when the argument is omitted; not suitable for correlating parallel captures." },
];

/** Parameters the builder form supplies. All optional; sensible defaults. */
export interface SnifferParams {
  /** Interface name, or "any" for all interfaces. Default "any". */
  readonly iface?: string;
  /** A raw filter string. If set, it overrides the structured filter parts. */
  readonly filterRaw?: string;
  /** Structured filter helpers (used only when filterRaw is empty). */
  readonly host?: string;
  readonly host2?: string;
  readonly port?: string;
  readonly proto?: string;
  /** Verbosity 1-6. Default 4. */
  readonly verbose?: number;
  /** Packet count; 0 = unlimited. Default 0. */
  readonly count?: number;
  /** Timestamp code: "a", "l", or "" (relative). Default "l". */
  readonly tsformat?: string;
}

/** A single explained argument of a decoded command. */
export interface SnifferArg {
  readonly label: string;
  readonly value: string;
  readonly explain: string;
}

export interface SnifferNote {
  readonly kind: "info" | "good" | "warn";
  readonly text: string;
}

export type SnifferMode = "build" | "decode" | "reference";

export interface SnifferResult {
  readonly mode: SnifferMode;
  /** The composed command (build mode) or the echoed input (decode mode). */
  readonly command: string;
  /** Per-argument breakdown (decode mode; also shown for build). */
  readonly args: readonly SnifferArg[];
  readonly notes: readonly SnifferNote[];
  /** The verbosity reference table (always available for the UI). */
  readonly verbosity: readonly VerbosityInfo[];
  /** The timestamp reference table. */
  readonly tsformats: readonly TsFormatInfo[];
}

export interface ToolRunResult {
  readonly result: SnifferResult;
}

/** Known protocol tokens the FortiOS/BPF filter accepts. */
const PROTOS = ["arp", "ip", "ip6", "gre", "esp", "udp", "tcp", "icmp"];

/** Compose a single-quoted filter string from structured parts. */
function buildFilter(p: SnifferParams): string {
  if (p.filterRaw && p.filterRaw.trim()) return p.filterRaw.trim();
  const parts: string[] = [];
  if (p.host && p.host.trim()) parts.push(`host ${p.host.trim()}`);
  if (p.host2 && p.host2.trim()) parts.push(`host ${p.host2.trim()}`);
  if (p.port && p.port.trim()) parts.push(`port ${p.port.trim()}`);
  if (p.proto && p.proto.trim() && p.proto !== "any") parts.push(p.proto.trim());
  if (parts.length === 0) return "none";
  return parts.join(" and ");
}

/**
 * BUILD: compose the CLI command and its per-argument explanation from
 * structured parameters. Exported so the form UI can call it directly.
 */
export function build(p: SnifferParams): SnifferResult {
  const iface = (p.iface && p.iface.trim()) || "any";
  const filter = buildFilter(p);
  const verbose = clampVerbose(p.verbose ?? 4);
  const count = Number.isFinite(p.count) && (p.count as number) >= 0 ? Math.floor(p.count as number) : 0;
  const ts = normalizeTs(p.tsformat ?? "l");

  // Quote the filter unless it is the bare word none (both forms are valid;
  // quoting is the documented, copy-safe habit for multi-word filters).
  const filterField = filter === "none" ? "none" : `'${filter}'`;
  const tsField = ts === "" ? "" : ` ${ts}`;
  const command = `diagnose sniffer packet ${iface} ${filterField} ${verbose} ${count}${tsField}`.trim();

  return {
    mode: "build",
    command,
    args: explainArgs(iface, filter, verbose, String(count), ts),
    notes: buildNotes(iface, filter, verbose, count, ts),
    verbosity: VERBOSITY,
    tsformats: TSFORMATS,
  };
}

/** Clamp a verbosity number into the valid 1-6 range. */
function clampVerbose(v: number): number {
  if (!Number.isFinite(v)) return 4;
  return Math.min(6, Math.max(1, Math.floor(v)));
}

/** Normalize a timestamp code to one of "a" | "l" | "". */
function normalizeTs(code: string): string {
  const c = (code || "").trim().toLowerCase();
  if (c === "a" || c === "l") return c;
  return "";
}

/** Build the per-argument explanation array. */
function explainArgs(
  iface: string,
  filter: string,
  verbose: number,
  count: string,
  ts: string,
): SnifferArg[] {
  const vinfo = VERBOSITY.find((v) => v.level === verbose)!;
  const args: SnifferArg[] = [];

  args.push({
    label: "interface",
    value: iface,
    explain:
      iface === "any"
        ? "Capture on all interfaces. Note that on 'any' the link layer is Linux cooked capture (SLL), not Ethernet, so the real Ethernet header and any VLAN tag are not shown."
        : `Capture only on interface ${iface}. Naming a physical interface (rather than 'any' or a VLAN interface) is what lets a verbose 6 capture keep the real Ethernet header and VLAN tag.`,
  });

  args.push({
    label: "filter",
    value: filter,
    explain:
      filter === "none"
        ? "No filter: every packet on the interface is captured. Because it is unfiltered, expect a lot of output; add host/port/proto to narrow it."
        : `BPF-style filter, matched against every packet. '${filter}' selects only traffic that matches. Because neither src nor dst is fixed on a bare host/port, both directions are captured.`,
  });

  args.push({
    label: "verbose",
    value: String(verbose),
    explain: `Verbosity ${verbose}: ${vinfo.help}. ${
      vinfo.showsInterface
        ? "Interface names are shown (verbose 4-6)."
        : "Interface names are NOT shown at this level; use 4, 5, or 6 to see which interface each packet used."
    }${
      vinfo.depth === "ethernet"
        ? " Full Ethernet-level output can be converted to a .pcap for Wireshark with Fortinet's fgt2eth.pl script."
        : ""
    }`,
  });

  args.push({
    label: "count",
    value: count,
    explain:
      count === "0"
        ? "Packet count 0 means capture until you stop it with Ctrl+C. Set a number to auto-stop after that many packets."
        : `Stop automatically after ${count} packet(s). Ctrl+C stops earlier.`,
  });

  const tinfo = TSFORMATS.find((t) => t.code === ts)!;
  args.push({
    label: "timestamp",
    value: ts === "" ? "(relative)" : ts,
    explain: `${tinfo.label} timestamp: ${tinfo.detail}`,
  });

  return args;
}

/** Warnings and tips for a built command. */
function buildNotes(
  iface: string,
  filter: string,
  verbose: number,
  count: number,
  ts: string,
): SnifferNote[] {
  const notes: SnifferNote[] = [];

  // Interface-name visibility.
  if (verbose < 4) {
    notes.push({
      kind: "info",
      text: "At verbosity 1-3 the interface name is not printed. If you need to see which interface each packet used (especially with 'any'), use 4, 5, or 6.",
    });
  }

  // Parallel-capture timestamp guidance.
  if (ts === "") {
    notes.push({
      kind: "warn",
      text: "The timestamp is relative to the start of the sniff. For captures you run in parallel on multiple interfaces or SSH sessions, use 'a' (absolute UTC) or 'l' (absolute local) so the lines can be correlated.",
    });
  }

  // VLAN-tag stripping at high verbosity on any/VLAN interfaces.
  if ((iface === "any") && verbose >= 3) {
    notes.push({
      kind: "warn",
      text: "On the 'any' interface (and on VLAN interfaces), the VLAN tag is stripped from the output at verbose 3/6. To capture the VLAN tag, run the sniffer on the underlying physical interface and match on the tag, e.g. \"ether[14:2]=0x00db\" for VLAN 219.",
    });
  }

  // ASIC/NP offload can hide traffic from the kernel sniffer.
  notes.push({
    kind: "info",
    text: "If expected packets never appear, the session may be hardware-offloaded (NP/SoC). The kernel sniffer cannot see offloaded sessions; temporarily set 'set auto-asic-offload disable' in the matching firewall policy while troubleshooting.",
  });

  // Unbounded capture over SSH.
  if (count === 0 && filter === "none") {
    notes.push({
      kind: "warn",
      text: "An unlimited, unfiltered capture over SSH can flood your own session with the very traffic your SSH connection generates. Add a filter (or exclude 'not port 22') and/or a packet count.",
    });
  }

  return notes;
}

/** Tokenize a decode input, respecting single or double quotes for the filter. */
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    // Skip whitespace.
    while (i < n && /\s/.test(line[i])) i++;
    if (i >= n) break;
    const ch = line[i];
    if (ch === "'" || ch === '"') {
      // Quoted token: capture through the matching quote.
      const close = line.indexOf(ch, i + 1);
      if (close === -1) {
        tokens.push(line.slice(i + 1));
        break;
      }
      tokens.push(line.slice(i + 1, close));
      i = close + 1;
    } else {
      let j = i;
      while (j < n && !/\s/.test(line[j])) j++;
      tokens.push(line.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

/**
 * DECODE: read a pasted "diagnose sniffer packet ..." command back argument by
 * argument. Tolerant of the "diag sniff packet" abbreviation and of missing
 * trailing arguments (count/timestamp are optional on the device).
 */
function decode(input: string): SnifferResult {
  const line = input.trim();
  const notes: SnifferNote[] = [];

  // Strip a leading "diagnose sniffer packet" / "diag sniff packet" prefix.
  const stripped = line.replace(
    /^\s*diag(nose)?\s+sniff(er)?\s+packet\s+/i,
    "",
  );
  if (stripped === line) {
    notes.push({
      kind: "warn",
      text: "This does not start with 'diagnose sniffer packet'. Decoding the remaining tokens as best-effort positional arguments; the first token is treated as the interface.",
    });
  }

  const toks = tokenize(stripped);
  if (toks.length === 0) {
    return {
      mode: "decode",
      command: line,
      args: [],
      notes: [{ kind: "warn", text: "No arguments found after 'diagnose sniffer packet'." }],
      verbosity: VERBOSITY,
      tsformats: TSFORMATS,
    };
  }

  // Positional parse: <interface> <filter> <verbose> <count> <tsformat>.
  // The filter can be a bare word (none) or a quoted expression (already
  // de-quoted by the tokenizer). We reconstruct by consuming tokens until we
  // reach the first pure integer, which must be the verbosity.
  const iface = toks[0];
  let idx = 1;

  // Collect filter tokens up to (but not including) the first integer token.
  const filterTokens: string[] = [];
  while (idx < toks.length && !/^\d+$/.test(toks[idx])) {
    filterTokens.push(toks[idx]);
    idx++;
  }
  const filter = filterTokens.length ? filterTokens.join(" ") : "none";

  // Verbose (first integer), count (second integer), tsformat (a|l).
  let verbose: number | null = null;
  let count: string | null = null;
  let ts: string = "";
  if (idx < toks.length && /^\d+$/.test(toks[idx])) {
    verbose = clampVerbose(parseInt(toks[idx], 10));
    idx++;
  }
  if (idx < toks.length && /^\d+$/.test(toks[idx])) {
    count = String(parseInt(toks[idx], 10));
    idx++;
  }
  if (idx < toks.length && /^[al]$/i.test(toks[idx])) {
    ts = toks[idx].toLowerCase();
    idx++;
  }

  const args: SnifferArg[] = [];
  args.push(explainArgs(iface, filter, verbose ?? 1, count ?? "0", ts)[0]); // interface
  args.push(explainArgs(iface, filter, verbose ?? 1, count ?? "0", ts)[1]); // filter
  if (verbose !== null) {
    args.push(explainArgs(iface, filter, verbose, count ?? "0", ts)[2]);
  } else {
    notes.push({ kind: "warn", text: "No verbosity level found. FortiOS expects a level 1-6 after the filter." });
  }
  if (count !== null) {
    args.push(explainArgs(iface, filter, verbose ?? 1, count, ts)[3]);
  } else {
    notes.push({ kind: "info", text: "No packet count given. On the device this means the sniff runs until you press Ctrl+C." });
  }
  args.push(explainArgs(iface, filter, verbose ?? 1, count ?? "0", ts)[4]); // timestamp

  // Reuse the same warnings the builder produces for the decoded values.
  for (const nt of buildNotes(iface, filter, verbose ?? 1, count === null ? 0 : parseInt(count, 10), ts)) {
    notes.push(nt);
  }

  return {
    mode: "decode",
    command: line,
    args,
    notes,
    verbosity: VERBOSITY,
    tsformats: TSFORMATS,
  };
}

/**
 * Entry point. Empty input returns the reference (grammar + verbosity table);
 * input that looks like a sniffer command is decoded; anything else is decoded
 * best-effort as positional arguments.
 */
export function run(input: string): ToolRunResult {
  if (typeof input !== "string") {
    throw new Error("Input must be a string.");
  }
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    // Reference mode: show the grammar and the tables.
    return {
      result: {
        mode: "reference",
        command: "diagnose sniffer packet <interface> <'filter'> <verbose> <count> <tsformat>",
        args: [
          { label: "interface", value: "<interface>", explain: "Interface to capture from, e.g. port1 or wan1, or 'any' for all interfaces." },
          { label: "filter", value: "<'filter'>", explain: "BPF-style expression in single quotes, e.g. 'host 10.0.0.1 and tcp port 443'. Use none for no filter." },
          { label: "verbose", value: "<verbose>", explain: "Verbosity 1-6. 1-3 add more payload; 4-6 additionally print interface names." },
          { label: "count", value: "<count>", explain: "Number of packets before stopping. 0 (or omitted) captures until Ctrl+C." },
          { label: "tsformat", value: "<tsformat>", explain: "a = absolute UTC, l = absolute local, omitted = relative to sniff start." },
        ],
        notes: [
          { kind: "info", text: "Type or build a command, or paste an existing 'diagnose sniffer packet ...' line to have each argument explained." },
        ],
        verbosity: VERBOSITY,
        tsformats: TSFORMATS,
      },
    };
  }

  // If it mentions the sniffer command (even abbreviated), decode it.
  if (/sniff/i.test(trimmed)) {
    return { result: decode(trimmed) };
  }

  // Otherwise, best-effort decode as positional arguments.
  return { result: decode(trimmed) };
}
