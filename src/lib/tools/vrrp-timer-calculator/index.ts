// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vrrp-timer-calculator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the VRRP timer, virtual
// MAC and election calculator (02/11/2026). Every source below was downloaded
// with curl on 2026-11-02 (generic User-Agent, no-cache headers, a
// cache-busting query) and answered HTTP 200; the files and the log are in the
// build's work folder. The RFC Editor's index (rfc-index.xml, read the same
// day) gives each RFC's current status: RFC 9568 is a Proposed Standard that
// obsoletes RFC 5798 and is itself neither obsoleted nor updated; RFC 5798
// (Proposed Standard) obsoletes RFC 3768 and is obsoleted by RFC 9568; RFC 3768
// (Draft Standard, VRRP version 2) obsoletes RFC 2338 and is obsoleted by RFC
// 5798, so it is read here only for the VRRPv2 arithmetic of older equipment
// and labelled as obsoleted wherever it is cited; RFC 4291 is a Draft
// Standard, updated (not obsoleted) by RFC 5952, 6052, 7136, 7346, 7371 and
// 8064.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, VRRP_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, timersLocalisable, electionLocalisable, macLocalisable, exactDecimal, VrrpInputError, MAX_FIELD, MAX_NAME, OWNER_PRIORITY, DEFAULT_PRIORITY, V3_DEFAULT_INTERVAL_CS, V3_MAX_INTERVAL_CS, V2_DEFAULT_INTERVAL_S, V2_MAX_INTERVAL_S, MIN_ROUTERS, MAX_ROUTERS } from "./compute"; // values
export type { VrrpVersion, AddressFamily, TimerUnit, TimersRequest, RouterInput, ElectionRequest, MacRequest, VrrpRequest, TimerNames, TimerFigures, TimersResult, RouterRow, ElectionOutcome, ElectionStep, ElectionResult, MacResult, VrrpResult } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, VRRP_VECTORS, EXAMPLE_TIMERS_REQUEST, EXAMPLE_ELECTION_REQUEST, EXAMPLE_MAC_REQUEST, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { VrrpVector, VerifyReport } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the VRRP timer, virtual MAC and election calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "vrrp-timer-calculator", // the route segment and API path
  canonicalAliases: [
    "vrrp timer calculator", // the obvious search
    "vrrp skew time", // the formula people look up
    "active down interval", // RFC 9568's name
    "master down interval", // the older name routers still print
    "vrrp virtual mac", // 00-00-5E-00-01-{VRID}
    "vrrp election", // who becomes Active
    "vrrp preemption", // what happens when the router comes back
  ],
  inputDetectors: [
    {
      // A form, not a paste: nothing to detect in free text. The example is the page's timers Example as an API body.
      kind: "structured-form",
      pattern: "mode (timers | election | mac) + version + priority / routers / vrid",
      priority: 1,
      example: '{"mode":"timers","version":"3","priority":"100","interval":"100"}', // golden vector example-timers
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // arithmetic and a state-machine reading only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: VRRP_VECTORS.length, // 133: 26 timer rows, 14 simulated elections, 12 MACs and 81 written out
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // every field at most 64 characters, router names at most 32, at most 8 routers
    "exact-arithmetic", // every timer is a whole number of 256ths, printed exactly: nothing rounded
    "share-input-caution", // Share results (2026-11-02) builds a link only when pressed, carrying the mode's fields as typed after the #, with a caution line in election mode (router names and addresses name a private network)
  ],
  shareSafetyDefault: "fragment", // the election mode's router names and primary addresses name infrastructure on a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/first-hop-redundancy-vrrp-and-hsrp"], // the article whose timers, election and MAC sections this tool computes
  sources: [
    {
      id: "rfc9568", // VRRP version 3
      label: "RFC 9568, Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, April 2024 (obsoletes RFC 5798): sections 1.7, 5.2.4, 5.2.7, 6.1, 6.4, 7.3 and 8.3.2", // what the engine applies
      type: "standard", // Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc9568.txt", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the tool was built
      scope: "priorities 255, 1 to 254 (default 100) and 0; VRID 1 to 255; Skew_Time and Active_Down_Interval in centiseconds; Preempt_Mode and the owner's exception; the state machine of section 6.4 with the address tie-break; the primary address (link-local in IPv6); the Virtual Router MAC 00-00-5E-00-01-{VRID} and 00-00-5E-00-02-{VRID}; one owner and distinct priorities", // what it pins
      status: "active", // Proposed Standard, neither obsoleted nor updated
    },
    {
      id: "rfc9568-errata", // the six verified errata
      label: "RFC Editor, errata for RFC 9568: verified errata 8301 (Advertisement_Interval 1 to 4095 centiseconds) and 8298 (an address owner receiving ADVERTISEMENTs)", // what the engine applies
      type: "reference", // the RFC Editor's errata record
      url: "https://www.rfc-editor.org/errata/rfc9568", // fetched 2026-11-02, HTTP 200: six verified errata (7947, 7949, 8298, 8299, 8300, 8301)
      access_date: "2026-11-02", // read the day the tool was built
      scope: "the interval range 1 to 4095 centiseconds and why zero is refused; two owners (section 7.1 as published and as corrected); 7947 and 7949 correct the gratuitous ARP text, 8299 and 8300 add receive checks, none of them changes a timer", // what it pins
      status: "active", // verified errata
    },
    {
      id: "rfc3768", // VRRP version 2
      label: "RFC 3768, Virtual Router Redundancy Protocol (VRRP), April 2004 (VRRP version 2, obsoleted by RFC 5798 and now RFC 9568): sections 1.2, 5.1, 5.3.7, 6.1, 6.4 and 7.3", // what the engine applies, labelled as history
      type: "standard", // Draft Standard, obsoleted
      url: "https://www.rfc-editor.org/rfc/rfc3768.txt", // fetched 2026-11-02, HTTP 200; errata page: "No matching errata found."
      access_date: "2026-11-02", // read the day the tool was built
      scope: "VRRPv2 for older equipment: IPv4 only; Adver Int in whole seconds (an 8-bit field, default 1); Skew_Time = (256 - Priority) / 256 seconds and Master_Down_Interval = 3 x Advertisement_Interval + Skew_Time; the same priorities, preemption, tie-break and IPv4 MAC", // what it pins
      status: "active", // the link resolves; the RFC is obsoleted, and every label says so
    },
    {
      id: "rfc4291", // IPv6 addressing
      label: "RFC 4291, IP Version 6 Addressing Architecture, February 2006: sections 2.2 (text forms) and 2.5.6 (link-local addresses, fe80::/10)", // what the engine applies
      type: "standard", // Draft Standard
      url: "https://www.rfc-editor.org/rfc/rfc4291.txt", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the tool was built
      scope: "how an IPv6 primary address is read (eight groups, one \"::\", an IPv4 tail) and the fe80::/10 test for the link-local address VRRPv3 compares", // what it pins
      status: "active", // Draft Standard, updated by RFC 5952, 6052, 7136, 7346, 7371 and 8064; not obsoleted
    },
    {
      id: "rfc-index", // currency
      label: "RFC Editor, RFC index (XML): the current status of RFC 9568, RFC 5798, RFC 3768 and RFC 4291", // what it pins
      type: "registry", // the RFC Editor's own record
      url: "https://www.rfc-editor.org/rfc-index.xml", // fetched 2026-11-02, HTTP 200, 13,742,743 bytes
      access_date: "2026-11-02", // read the day the tool was built
      scope: "RFC 9568 obsoletes RFC 5798, which obsoletes RFC 3768, which obsoletes RFC 2338; RFC 9568 is neither obsoleted nor updated", // what it pins
      status: "active", // the index
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = VRRP_VECTORS; // every vector
