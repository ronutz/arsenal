// ============================================================================
// src/lib/tools/iquery-protocol-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iQuery explainer. Each vector pins a specific input to
// the invariant parts of its decoded output, so a regression in the engine is
// caught by the build-time gate (verifyVectors, run by __selftest).
//
// The iqdump inputs are taken verbatim from F5's own published sample
// (K000139663: "DNS iQuery third party certificate validation ..."), so the
// decoder is checked against real device output, not invented text. The log
// vector uses the state-change message shape documented in the BIG-IP LTM-DNS
// Operations Guide. Topic vectors lock the keyword routing.
// ============================================================================

import { run, type IqueryMode, type TopicId } from "./compute";

export const SET_ID = "iquery-protocol-explainer/golden@1";

export interface IqueryVector {
  readonly name: string;
  readonly input: string;
  /** The mode the engine must select. */
  readonly mode: IqueryMode;
  /** Substrings that must appear in the rendered title. */
  readonly titleIncludes?: string;
  /** For decode modes: field labels that must be present. */
  readonly fieldLabels?: string[];
  /** For decode modes: a (label -> value) pair that must be decoded exactly. */
  readonly fieldValue?: { label: string; value: string };
  /** For topic mode: the topic id that must be selected. */
  readonly topicId?: TopicId;
  /** A note kind that must appear at least once. */
  readonly noteKind?: "info" | "good" | "warn";
}

// The real iqdump sample from K000139663 (IPv4-mapped IPv6 peer, default group).
const IQDUMP_SAMPLE = [
  "config # iqdump 10.10.10.20",
  "<!-- Local hostname: lc1.example.com -->",
  "<!-- Connected to big3d at: ::ffff:10.10.10.10:4353 -->",
  "<!-- Subscribing to syncgroup: default -->",
  "<!-- Fri Apr 26 15:23:30 2024 -->",
  "<xml_connection>",
  "<version>16.1.3.3</version>",
  "<big3d>big3d Version 16.1.3.3.0.0.3</big3d>",
  "<connection_id>847</connection_id>",
].join("\n");

// A documented /var/log/gtm iQuery state-change line (Operations Guide shape).
const GTM_LOG_LINE =
  "alert gtmd[8663]: 011a500c:1: SNMP_TRAP: Box 10.14.20.209 state change green --> red";

export const VECTORS: readonly IqueryVector[] = [
  {
    name: "iqdump sample decodes as iqdump with the big3d peer",
    input: IQDUMP_SAMPLE,
    mode: "iqdump",
    titleIncludes: "10.10.10.10",
    fieldLabels: ["Local hostname", "Connected to big3d at", "Subscribing to syncgroup", "version", "big3d", "connection_id"],
    noteKind: "good",
  },
  {
    name: "iqdump version field decodes to the exact version",
    input: IQDUMP_SAMPLE,
    mode: "iqdump",
    fieldValue: { label: "version", value: "16.1.3.3" },
  },
  {
    name: "iqdump connection_id decodes to the exact id",
    input: IQDUMP_SAMPLE,
    mode: "iqdump",
    fieldValue: { label: "connection_id", value: "847" },
  },
  {
    name: "gtm log state-change decodes as a log with the box transition",
    input: GTM_LOG_LINE,
    mode: "log",
    fieldValue: { label: "Box 10.14.20.209", value: "green --> red" },
    noteKind: "warn",
  },
  {
    name: "empty input returns the topic index",
    input: "",
    mode: "topics-index",
  },
  {
    name: "'topics' returns the topic index",
    input: "topics",
    mode: "topics-index",
  },
  {
    name: "keyword '4353' resolves to the port topic",
    input: "4353",
    mode: "topic",
    topicId: "port",
  },
  {
    name: "keyword 'mesh' resolves to the mesh topic",
    input: "what is the iquery mesh",
    mode: "topic",
    topicId: "mesh",
  },
  {
    name: "keyword 'bigip_add' resolves to the trust topic",
    input: "bigip_add",
    mode: "topic",
    topicId: "trust",
  },
  {
    name: "keyword 'big3d' resolves to the big3d topic",
    input: "big3d",
    mode: "topic",
    topicId: "big3d",
  },
] as const;

/** Run every vector; throw on the first mismatch. Invoked at build by __selftest. */
export function verifyVectors(): void {
  for (const v of VECTORS) {
    const r = run(v.input);
    if (r.mode !== v.mode) {
      throw new Error(`[${SET_ID}] ${v.name}: mode ${r.mode} != ${v.mode}`);
    }
    if (v.titleIncludes && !r.title.includes(v.titleIncludes)) {
      throw new Error(`[${SET_ID}] ${v.name}: title ${JSON.stringify(r.title)} missing ${JSON.stringify(v.titleIncludes)}`);
    }
    if (v.fieldLabels) {
      for (const label of v.fieldLabels) {
        if (!r.fields.some((f) => f.label === label)) {
          throw new Error(`[${SET_ID}] ${v.name}: missing field label ${JSON.stringify(label)}`);
        }
      }
    }
    if (v.fieldValue) {
      const f = r.fields.find((f) => f.label === v.fieldValue!.label);
      if (!f) throw new Error(`[${SET_ID}] ${v.name}: no field ${JSON.stringify(v.fieldValue.label)}`);
      if (f.value !== v.fieldValue.value) {
        throw new Error(`[${SET_ID}] ${v.name}: field ${v.fieldValue.label} value ${JSON.stringify(f.value)} != ${JSON.stringify(v.fieldValue.value)}`);
      }
    }
    if (v.topicId) {
      if (!r.topic || r.topic.id !== v.topicId) {
        throw new Error(`[${SET_ID}] ${v.name}: topic ${r.topic?.id} != ${v.topicId}`);
      }
    }
    if (v.noteKind && !r.notes.some((n) => n.kind === v.noteKind)) {
      throw new Error(`[${SET_ID}] ${v.name}: no note of kind ${v.noteKind}`);
    }
  }
}
