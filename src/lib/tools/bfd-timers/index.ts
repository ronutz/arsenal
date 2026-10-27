// ============================================================================
// src/lib/tools/bfd-timers/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the BFD timer calculator
// and control packet decoder. Every source below was downloaded with curl on
// 2026-10-19 (generic User-Agent, no-cache headers, a cache-busting query) and
// answered HTTP 200; the files and the log are in the build's work folder.
// ============================================================================

import { run, runApi, type BfdRequest, type BfdResult } from "./compute"; // the engine's two entry points
import { GOLDEN_VECTOR_SET_ID, BFD_TIMERS_VECTORS, BFD_DECODE_VECTORS, BFD_REJECT_VECTORS } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, computeTimers, decodePacket, parseInterval, parseDetectMult, formatDuration, BfdError, ONE_SECOND_US, MAX_INTERVAL_US, COMMON_INTERVALS_US, GRACEFUL_RESTART_INTERVAL_US, VENDOR_FLOORS } from "./compute"; // values
export type { BfdErrorCode, BfdRequest, BfdResult, TimersRequest, TimersResult, DecodeRequest, DecodeResult, SystemInput, ResolvedSystem, DirectionResult, Detection, EchoResult, Explanation, IntervalField, VendorFloor } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, BFD_TIMERS_VECTORS, BFD_DECODE_VECTORS, BFD_REJECT_VECTORS, verifyVectors } from "./golden-vectors"; // vectors and their runner

/** The D-49 declarative manifest for the BFD timer calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "bfd-timers", // the route segment and API path
  canonicalAliases: [
    "bfd timers", // the obvious search
    "bfd detection time", // the number people want
    "bfd calculator", // the generic name
    "bidirectional forwarding detection", // the expansion
    "bfd packet decoder", // the second mode
    "detect multiplier", // the knob
  ],
  inputDetectors: [
    {
      // A 24-byte BFD Control packet in hex: version 1 makes the first digit 2 or 3.
      // Anchored, fixed repetition count, one optional separator per byte: linear (ReDoS-safe).
      kind: "regex",
      pattern: "^\\s*(?:0x)?[23][0-9a-fA-F](?:[\\s:]?[0-9a-fA-F]{2}){23}\\s*$",
      priority: 5, // below the protocol-specific detectors that match more exactly
      example: "20 c0 03 18 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00", // golden vector up-300ms
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // arithmetic and byte reading; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: BFD_TIMERS_VECTORS.length + BFD_DECODE_VECTORS.length + BFD_REJECT_VECTORS.length, // 16 + 13 + 13
  dangerousInputHandling: [
    "redos-guard", "length-bound", // anchored linear patterns; interval text at most 32 characters, packet text at most 1024
    "share-input", // Share results (2026-10-27) builds a link only when pressed, carrying the fields or the packet hex as typed after the #; none for a packet with an Authentication Section
  ],
  shareSafetyDefault: "param", // timer values and a captured BFD header are not sensitive; authentication data is never displayed

  // -- Teaching & provenance --
  // The companion article computes with this tool; the BFD article teaches the protocol.
  learnLinks: ["learn/bfd-timers-the-arithmetic-of-detection", "learn/bfd-when-a-link-is-up-and-dead"],
  sources: [
    {
      id: "rfc5880", // the protocol
      label: "RFC 5880, Bidirectional Forwarding Detection (BFD), June 2010: sections 4.1, 6.5, 6.6, 6.8.1, 6.8.2, 6.8.3, 6.8.4, 6.8.6, 6.8.7 and 6.8.9", // what the engine applies
      type: "standard", // IETF Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc5880.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      scope: "the field layout and units; the 1 s floor while not Up; the agreed interval as the larger of Desired Min TX and the remote Required Min RX; the 0 to 25% jitter and the 75 to 90% rule for Detect Mult 1; the Detection Time in Asynchronous and Demand modes; the receive checks; the Echo transmission rules", // what it pins
      status: "active", // updated by RFC 7419, 7880, 8562 and 9747; not obsoleted
    },
    {
      id: "rfc5880-errata", // the errata, read for anything that changes the arithmetic
      label: "RFC Editor, errata for RFC 5880 (4 verified, 3 held for document update, 1 rejected)", // the record
      type: "reference", // an errata listing
      url: "https://www.rfc-editor.org/errata/rfc5880", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read with the RFC
      scope: "none changes the timer arithmetic: 5205 (held) would set diagnostic 1 on a timeout in any state, 4410 (held) words the Demand-mode timeout, 7082 and 7083 order the authentication checks, 2530 and 6926 are wording", // why the engine follows the published text
      status: "active", // current
    },
    {
      id: "rfc5881", // single hop
      label: "RFC 5881, Bidirectional Forwarding Detection (BFD) for IPv4 and IPv6 (Single Hop), June 2010: sections 4 and 5", // ports and TTL
      type: "standard", // IETF Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc5881.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      scope: "UDP destination port 3784 for Control and 3785 for Echo; TTL or Hop Limit 255; erratum 2293 (verified) corrects 3875 to 3785 in section 8", // what it pins
      status: "active", // current
    },
    {
      id: "rfc5883", // multihop
      label: "RFC 5883, Bidirectional Forwarding Detection (BFD) for Multihop Paths, June 2010: sections 3 and 5", // echo and port
      type: "standard", // IETF Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc5883.txt", // fetched 2026-10-19, HTTP 200; errata page: no errata
      access_date: "2026-10-19", // read the day the tool was built
      scope: "the Echo function MUST NOT be used over multiple hops; multihop Control packets use UDP destination port 4784", // what it pins
      status: "active", // current
    },
    {
      id: "rfc7419", // common intervals
      label: "RFC 7419, Common Interval Support in Bidirectional Forwarding Detection, December 2014: sections 1, 2, 3 and Appendix A", // the set
      type: "rfc", // IETF Informational RFC (updates RFC 5880)
      url: "https://www.rfc-editor.org/rfc/rfc7419.txt", // fetched 2026-10-19, HTTP 200; errata page: "No matching errata found."
      access_date: "2026-10-19", // read the day the tool was built
      scope: "the Common Interval set 3.3, 10, 20, 50, 100 ms and 1 s; 10 s and multipliers up to 255 for graceful restart (42.5 minutes); adjustment always towards larger intervals; the 10 ms against 20 ms example; 9 x 100 ms in place of 3 x 300 ms", // what it pins
      status: "active", // current
    },
    {
      id: "frr-bfd", // a common implementation's documented floor and defaults
      label: "FRRouting documentation, BFD (bfdd), latest: Peer / Profile Configuration and Status", // the page
      type: "vendor", // implementation documentation
      url: "https://docs.frrouting.org/en/latest/bfd.html", // fetched 2026-10-19, HTTP 200; undated "latest" page
      access_date: "2026-10-19", // read the day the tool was built
      scope: "receive-interval, transmit-interval and echo receive-interval accept 10 to 4294967 milliseconds; defaults 300 ms and multiplier 3; the 900 ms detect-multiplier example; the show bfd peers sample with Detection timeout 3000ms", // what it pins
      status: "active", // current documentation
    },
    {
      id: "junos-13-1-bfd", // a second implementation's documented floor
      label: "Juniper Networks, Junos OS 13.1, bfd-liveness-detection (Protocols BGP), published 2013-08-15", // an old release, named as such
      type: "vendor", // implementation documentation
      url: "https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html", // fetched 2026-10-19, HTTP 200 (redirected to www.juniper.net)
      access_date: "2026-10-19", // read the day the tool was built
      scope: "minimum-interval, minimum-receive-interval and transmit-interval minimum-interval: Range 1 through 255,000 milliseconds; multiplier 1 through 255, default 3", // what it pins
      status: "active", // the page answers; the release is old and the warning says so
    },
    {
      id: "iana-bfd-parameters", // the registries
      label: "IANA, Bidirectional Forwarding Detection (BFD) Parameters: BFD Diagnostic Codes and BFD Authentication Types (CSV)", // the two sub-registries
      type: "registry", // IANA
      url: "https://www.iana.org/assignments/bfd-parameters/bfd-parameters.xhtml", // the CSVs bfd-parameters-1.csv and -2.csv fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      scope: "diagnostic 9 mis-connectivity defect (RFC 6428), 10 to 31 unassigned; authentication types 6 NULL (RFC 9978), 7 and 8 Meticulous Keyed ISAAC (RFC 9986), 9 to 255 unassigned", // what it pins
      status: "active", // current
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/**
 * runTool - the registry-facing entry point for a request object.
 * @param input a timers request or a decode request
 * @returns the result of that mode
 */
export function runTool(input: BfdRequest): BfdResult {
  return run(input); // the same engine
} // runTool

/**
 * runToolApi - the API entry point: the body as a JSON string.
 * @param input the JSON text
 * @returns the result of the mode it names
 */
export function runToolApi(input: string): BfdResult {
  return runApi(input); // parse, then the same engine
} // runToolApi

// Vectors, exposed by the conventional names some runners expect.
export const goldenVectors = BFD_TIMERS_VECTORS; // calculator vectors
export const decodeVectors = BFD_DECODE_VECTORS; // decoder vectors
export const rejectVectors = BFD_REJECT_VECTORS; // reject vectors
