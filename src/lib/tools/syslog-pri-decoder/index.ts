// ============================================================================
// src/lib/tools/syslog-pri-decoder/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING SYSLOG PRI DECODER - a self-contained {manifest, run, vectors}
// triple. Decode a PRI value such as <134> into its facility and severity, or
// encode a facility and severity back into a PRI and its on-the-wire form.
// Every syslog message carries one; this tool reads and writes it. Bounded,
// offline, computes nothing it cannot show.
// ============================================================================

import { decodePri, type DecodeResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, DECODE_VECTORS, ENCODE_VECTORS } from "./golden-vectors";

export { decodePri, encodePri, run, FACILITIES, SEVERITIES } from "./compute";
export type { DecodeResult, EncodeResult, FacilityDef, SeverityDef } from "./compute";
export { GOLDEN_VECTOR_SET_ID, DECODE_VECTORS, ENCODE_VECTORS, verifyVectors } from "./golden-vectors";
export type { DecVector, EncVector } from "./golden-vectors";

/** The D-49 declarative manifest for the syslog-pri-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Protocol & packet decoders",
  toolSlug: "syslog-pri-decoder",
  canonicalAliases: ["syslog-priority-decoder", "pri-decoder", "syslog-facility-severity", "syslog-pri-encoder"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^<\\d{1,3}>$",
      priority: 7,
      example: "<134>",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param", // a PRI is a non-sensitive integer

  // -- Teaching & provenance --
  learnLinks: ["learn/syslog-pri-facility-severity", "learn/syslog-facilities-and-severities", "learn/syslog-on-network-devices", "learn/syslog-message-formats", "learn/syslog-transport"],
  sources: [
    {
      id: "rfc5424",
      label: "RFC 5424: The Syslog Protocol",
      type: "rfc",
      url: "https://datatracker.ietf.org/doc/html/rfc5424",
      access_date: "2026-06-29",
      scope: "the PRI formula and the facility and severity tables",
      status: "active",
    },
    {
      id: "rfc3164",
      label: "RFC 3164: The BSD syslog Protocol",
      type: "rfc",
      url: "https://datatracker.ietf.org/doc/html/rfc3164",
      access_date: "2026-06-29",
      scope: "the legacy BSD syslog format and PRI",
      status: "active",
    },
    {
      id: "syslog-facilities-guide",
      label: "ManageEngine: Understanding Syslog Facilities",
      type: "vendor-docs",
      url: "https://www.manageengine.com/products/eventlog/logging-guide/syslog/syslog-facilities.html",
      access_date: "2026-06-29",
      scope: "common facility usage and network-device defaults",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = [...DECODE_VECTORS, ...ENCODE_VECTORS];

export type ToolRunResult = DecodeResult;
