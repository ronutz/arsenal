// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/cgn-port-blocks/index.ts
// ----------------------------------------------------------------------------
// Public surface and the D-49 declarative manifest of the CGN port-block and
// MAP port-set calculator. Every source was downloaded on 2026-10-19 from
// rfc-editor.org (text, JSON record and errata page), HTTP 200.
// ============================================================================

import { run, type CgnResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, REJECT_VECTORS } from "./golden-vectors"; // the vectors

// The engine's public functions, constants and types, for the page and the API registry.
export { run, computeBlocks, computeDeterministic, computeMap, parseIpv4, formatIpv4, parseUtc, CgnPortBlocksError, DEFAULT_PORT_RANGE, DEFAULT_RESERVED, TABLE_LIMIT, RANGE_LIMIT, LOG_BYTES_NAT444, LOG_BYTES_DSLITE, CONNECTIONS_PER_DAY } from "./compute";
// The engine's types.
export type { CgnResult, CgnErrorCode, BlocksInput, BlocksResult, DeterministicInput, DeterministicResult, DeterministicRow, MapInput, MapResult, PortRange, AddressSet } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, REJECT_VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // -- Identity and routing --
  toolFamily: "Networking & addressing", // the catalogue family
  toolSlug: "cgn-port-blocks", // the slug (checked free of tool ids, glossary slugs and vendor keys on 2026-10-19)
  // Other names it answers to.
  canonicalAliases: ["cgnat port block calculator", "port block allocation", "deterministic nat", "rfc 7422", "map-e psid", "map-t port set", "psid calculator", "a+p port range"],
  // What pasted input it recognises: the API's JSON body (no free-text form is distinctive enough for the omnibox).
  inputDetectors: [
    {
      kind: "structured-form", // a JSON request, not a regex
      pattern: "mode (blocks | deterministic | map) + that mode's fields", // what the form carries
      priority: 1, // low: reached by intent
      example: '{"mode":"map","offset":6,"psidLength":8,"psid":"0x34"}', // golden vector map-rfc7597-psid-0x34
    },
  ],

  // -- Capability and execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // integer arithmetic; no network, no clock (timestamps are inputs)
  apiCapabilityClass: "local-equivalent", // the API runs this same engine

  // -- Correctness and security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the dated set
  dangerousInputHandling: [
    "bounded-parse", "json-only", // anchored parsers, capped lists, JSON request
    "share-input", // Share results (2026-10-27) builds a link only when pressed, carrying the open tab and its fields as typed, as named values after the #
  ],
  shareSafetyDefault: "param", // pools, prefixes and port numbers are not secrets; documentation addresses in every example

  // -- Teaching and provenance --
  // The tool's own article, the CGNAT article whose deterministic section it computes, and the IPv6 transition
  // article that introduces MAP-E and MAP-T.
  learnLinks: ["learn/port-blocks-and-port-sets", "learn/cgnat-address-sharing-and-attribution", "learn/ipv6-transition"],
  sources: [
    {
      id: "rfc7422", // the deterministic algorithm
      label: "RFC 7422, Deterministic Address Mapping to Reduce Logging in Carrier-Grade NAT Deployments, December 2014: sections 1, 2, 2.1, 2.2, 2.3, 3 and 3.1, with erratum 4211", // what was read
      type: "rfc", // Informational (Independent Submission)
      url: "https://www.rfc-editor.org/rfc/rfc7422.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "the variables I, O, C, D, M, A and R; the five allocation steps; algorithm 0 (Sequential); the section 2.3 table and its two reverse lookups; the section 3 configuration record; the 150- and 175-byte messages and 33,000 connections per day of section 1", // what it pins
      status: "active", // not obsoleted, not updated
    },
    {
      id: "rfc7768", // dynamic port blocks
      label: "RFC 7768, Port Management to Reduce Logging in Large-Scale NATs, January 2016: sections 1, 2, 3 and 5", // what was read
      type: "rfc", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc7768.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "ports allocated in blocks, one log per block, log generation reduced 'by a factor equal to the block size'; the 42.5 TB against 40.6 GB measurement; traceability needs the source port and synchronised clocks", // what it pins
      status: "active", // no errata
    },
    {
      id: "rfc6888", // the CGN requirements
      label: "RFC 6888, Common Requirements for Carrier-Grade NATs (CGNs), April 2013: sections 3 (REQ-2, REQ-4, REQ-8), 4 and 5", // what was read
      type: "standard", // BCP 127
      url: "https://www.rfc-editor.org/rfc/rfc6888.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "paired pooling (one external address per subscriber), per-subscriber port limits, the 120-second port quarantine and its static-assignment exception, the logged fields, and the three competing port-allocation goals", // what it pins
      status: "active", // no errata
    },
    {
      id: "rfc7597", // MAP-E and the port-mapping algorithm
      label: "RFC 7597, Mapping of Address and Port with Encapsulation (MAP-E), July 2015: section 5.1, Appendix A (Examples 1, 2 and 5) and Appendix B", // what was read
      type: "standard", // Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc7597.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "the port field A | PSID | j; a defaulting to 6 to exclude 0-1023; A > 0 when a > 0; sharing ratio 2^k; 2^(16-k) - 2^m ports per set; the PSID 0x34 port set; the Generalized Modulus Algorithm and its two examples", // what it pins
      status: "active", // no errata
    },
    {
      id: "rfc7599", // MAP-T
      label: "RFC 7599, Mapping of Address and Port using Translation (MAP-T), July 2015: section 5, Appendices A and B, with erratum 5324", // what was read
      type: "standard", // Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc7599.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "MAP-T uses the MAP-E mapping rules and port-mapping algorithm unchanged; Appendix A repeats the PSID 0x34 port set; verified erratum 5324 corrects Example 5's PSID from 0x20 to 0x34", // what it pins
      status: "active", // errata exist, none changing the algorithm
    },
    {
      id: "rfc6269", // the issues document
      label: "RFC 6269, Issues with IP Address Sharing, June 2011: sections 5, 5.1, 12 and Appendix B", // what was read
      type: "rfc", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc6269.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "ports in TIME-WAIT count against a subscriber; heavy-tailed port use favours dynamic allocation; [Source IP address, Source Port, Timestamp] and accurate time-keeping; pre-allocated port groups need only the group logged; the multiplicative factor and compression ratio", // what it pins
      status: "active", // no errata
    },
    {
      id: "rfc6302", // server-side logging
      label: "RFC 6302, Logging Recommendations for Internet-Facing Servers, June 2011: sections 1 to 4", // what was read
      type: "standard", // BCP 162
      url: "https://www.rfc-editor.org/rfc/rfc6302.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "servers should log the source port and a UTC timestamp accurate to the second; why the tool's timestamps are UTC to the second", // what it pins
      status: "active", // no errata
    },
    {
      id: "rfc6335", // the port ranges
      label: "RFC 6335, IANA Procedures for the Management of the Service Name and Transport Protocol Port Number Registry, August 2011: section 6", // what was read
      type: "standard", // BCP 165
      url: "https://www.rfc-editor.org/rfc/rfc6335.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read today
      scope: "the 16-bit port namespace and its three ranges: System Ports 0-1023, User Ports 1024-49151, Dynamic Ports 49152-65535", // what it pins
      status: "active", // not obsoleted
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the author
  ],
});

/**
 * runTool - the registry-facing entry point.
 * @param input the JSON request naming its mode
 * @returns the mode's result
 */
export function runTool(input: string): CgnResult {
  return run(input); // the same engine the page uses
} // runTool

// Vectors, by the conventional names the golden-vector runner expects.
export const goldenVectors = GOLDEN_VECTORS; // accept vectors
export const rejectVectors = REJECT_VECTORS; // reject vectors
