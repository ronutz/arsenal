// ============================================================================
// src/lib/tools/fortios-sniffer-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the FortiOS sniffer builder/decoder. Each vector pins an
// input to invariant parts of the decoded/built output, so a regression is
// caught by the build-time gate (verifyVectors, run by __selftest).
//
// The command shapes are the canonical examples from Fortinet's own sniffer
// documentation and CLI reference: the five-argument form
//   diagnose sniffer packet <interface> <'filter'> <verbose> <count> <tsformat>
// with the documented verbosity meanings (4-6 add interface names) and the
// a/l/relative timestamp codes. Inputs are decoded through run(); the builder
// path is covered by build() via the "build composes" vector.
// ============================================================================

import { run, build, type SnifferMode } from "./compute";

export const SET_ID = "fortios-sniffer-builder/golden@1";

export interface SnifferVector {
  readonly name: string;
  /** Decode input (ignored when `buildParams` is set). */
  readonly input?: string;
  /** Build params, for the builder-path vector. */
  readonly buildParams?: Parameters<typeof build>[0];
  /** The mode the engine must select. */
  readonly mode: SnifferMode;
  /** Substrings that must appear in the composed/echoed command. */
  readonly commandIncludes?: readonly string[];
  /** (label -> value) pairs that must be present in the args breakdown. */
  readonly argValues?: ReadonlyArray<{ label: string; value: string }>;
  /** Substrings that must appear in at least one arg explanation. */
  readonly explainIncludes?: readonly string[];
  /** A note kind that must appear at least once. */
  readonly noteKind?: "info" | "good" | "warn";
}

// A canonical documented capture: one host, both directions, verbose 4 (adds
// interface name), unlimited, absolute-local timestamp.
const CAP_HOST = "diagnose sniffer packet any 'host 192.168.1.10' 4 0 l";

// The abbreviated form, on a named interface, TCP 443, 100 packets, UTC.
const CAP_ABBR = "diag sniff packet port1 'tcp port 443' 6 100 a";

export const VECTORS: readonly SnifferVector[] = [
  {
    name: "empty input returns the grammar reference",
    input: "",
    mode: "reference",
    commandIncludes: ["diagnose sniffer packet", "<interface>", "<verbose>"],
  },
  {
    name: "documented host capture decodes with all five arguments",
    input: CAP_HOST,
    mode: "decode",
    commandIncludes: ["diagnose sniffer packet any"],
    argValues: [
      { label: "interface", value: "any" },
      { label: "filter", value: "host 192.168.1.10" },
      { label: "verbose", value: "4" },
      { label: "count", value: "0" },
      { label: "timestamp", value: "l" },
    ],
    explainIncludes: ["all interfaces"],
  },
  {
    name: "verbose 4 is reported as showing interface names",
    input: CAP_HOST,
    mode: "decode",
    explainIncludes: ["Interface names are shown"],
  },
  {
    name: "abbreviated diag sniff form is accepted and decoded",
    input: CAP_ABBR,
    mode: "decode",
    argValues: [
      { label: "interface", value: "port1" },
      { label: "filter", value: "tcp port 443" },
      { label: "verbose", value: "6" },
      { label: "count", value: "100" },
      { label: "timestamp", value: "a" },
    ],
  },
  {
    name: "verbose 6 mentions the fgt2eth pcap conversion",
    input: CAP_ABBR,
    mode: "decode",
    explainIncludes: ["fgt2eth"],
  },
  {
    name: "relative timestamp (omitted) warns for parallel captures",
    input: "diagnose sniffer packet any none 4",
    mode: "decode",
    noteKind: "warn",
  },
  {
    name: "builder composes the canonical command from parts",
    buildParams: { iface: "any", host: "192.168.1.10", verbose: 4, count: 0, tsformat: "l" },
    mode: "build",
    commandIncludes: ["diagnose sniffer packet any 'host 192.168.1.10' 4 0 l"],
  },
];

/** Run all vectors; throw on the first mismatch. Invoked by __selftest. */
export function verifyVectors(): void {
  for (const v of VECTORS) {
    const res = v.buildParams ? build(v.buildParams) : run(v.input ?? "").result;

    if (res.mode !== v.mode) {
      throw new Error(`[${SET_ID}] ${v.name}: mode ${res.mode} != ${v.mode}`);
    }

    for (const s of v.commandIncludes ?? []) {
      if (!res.command.includes(s)) {
        throw new Error(`[${SET_ID}] ${v.name}: command missing "${s}" (got: ${res.command})`);
      }
    }

    for (const av of v.argValues ?? []) {
      const hit = res.args.find((a) => a.label === av.label && a.value === av.value);
      if (!hit) {
        throw new Error(`[${SET_ID}] ${v.name}: no arg ${av.label}="${av.value}"`);
      }
    }

    for (const s of v.explainIncludes ?? []) {
      const hit = res.args.some((a) => a.explain.includes(s));
      if (!hit) {
        throw new Error(`[${SET_ID}] ${v.name}: no arg explanation includes "${s}"`);
      }
    }

    if (v.noteKind) {
      const hit = res.notes.some((n) => n.kind === v.noteKind);
      if (!hit) {
        throw new Error(`[${SET_ID}] ${v.name}: no note of kind ${v.noteKind}`);
      }
    }
  }
}
