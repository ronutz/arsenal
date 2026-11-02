// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vrrp-timer-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the VRRP timer, virtual MAC and election calculator.
//
// Every expected number and every election outcome below was derived on
// 2026-11-02 by a separate Python oracle (in the build's work folder), not by
// running this engine:
//   - the timers by the formulas of RFC 9568 s6.1 (VRRPv3, centiseconds) and
//     RFC 3768 s6.1 (VRRPv2, seconds) in exact fractions (fractions.Fraction),
//     printed as exact decimals: priorities 1, 100, 200, 254 and 255 at the
//     default interval, at the smallest (1 cs) and the largest (4095 cs,
//     verified erratum 8301) VRRPv3 intervals, and at the largest VRRPv2 one
//     (255 s, the 8-bit Adver Int field);
//   - the elections by a discrete-event simulation of the RFC 9568 s6.4 state
//     machine (Adver_Timer, Active_Down_Timer, priority-0 ADVERTISEMENTs,
//     Preempt_Mode, the address tie-break in the Active state) run through four
//     scenarios: all routers starting together, a silent failure of the Active
//     Router (just after an ADVERTISEMENT and just before the next one), a
//     clean shutdown, and the first Active Router's return; addresses compared
//     with Python's ipaddress module;
//   - the Virtual Router MACs of RFC 9568 s7.3 formatted by str.format.
// The tables below were written from the oracle's output by a script
// (make_vectors.py), so no number was typed by hand. The refusals, the
// interval spellings and the sentences are written out at the end, each with
// the rule it pins. The page's three Examples (D-83) are the VRRP lab values of
// chapter 4.2 of the course (examples.ts) and are pinned by example-timers,
// example-election and example-mac.
// GOLDEN_VECTOR_SET_ID changes whenever a vector changes (the api-sync rule).
// ============================================================================

import { run, runApi, type VrrpRequest, type VrrpResult } from "./compute"; // the engine's API entries
import { EXAMPLE_TIMERS_REQUEST, EXAMPLE_ELECTION_REQUEST, EXAMPLE_MAC_REQUEST } from "./examples"; // the page's Examples, pinned below

/** The set id: dated, changed with any vector (scripts/check-api-sync.mjs compares it with scripts/api-sync.json). */
export const GOLDEN_VECTOR_SET_ID = "vrrp-timer-calculator-golden-2026-11-02"; // the first set

/** One vector: a request (or raw API text), and either the fields expected or the error expected. */
export interface VrrpVector {
  /** A stable id. */
  id: string;
  /** Where the expected values come from. */
  note: string;
  /** The request object (run()). */
  request?: VrrpRequest;
  /** Or the raw API body (runApi()). */
  api?: string;
  /** The fields expected (a subset of the reading; objects compared as subsets, arrays element by element). */
  expect?: Record<string, unknown>;
  /** Text the reading's sentences must contain. */
  contains?: { notes?: string[]; warnings?: string[]; verdictText?: string; steps?: string[] };
  /** The error expected, as a pattern over its message. */
  expectError?: RegExp;
}

/** The page's three Examples (D-83), shared with the component through examples.ts and re-exported here. */
export { EXAMPLE_TIMERS_REQUEST, EXAMPLE_ELECTION_REQUEST, EXAMPLE_MAC_REQUEST }; // the timers, election and MAC Examples

/** Timers from the oracle: [version, priority, interval, skewTime, skewTimeSeconds, downInterval, downIntervalSeconds, intervalSeconds, failover]. */
const TIMER_TABLE: readonly [2 | 3, number, number, string, string, string, string, string, null | Record<string, string>][] = [
  [3, 1, 100, "99.609375", "0.99609375", "399.609375", "3.99609375", "1", {"silentFrom": "299.609375", "silentFromSeconds": "2.99609375", "silentTo": "399.609375", "silentToSeconds": "3.99609375", "shutdown": "99.609375", "shutdownSeconds": "0.99609375"}], // v3, priority 1, 100 cs
  [3, 100, 100, "60.9375", "0.609375", "360.9375", "3.609375", "1", {"silentFrom": "260.9375", "silentFromSeconds": "2.609375", "silentTo": "360.9375", "silentToSeconds": "3.609375", "shutdown": "60.9375", "shutdownSeconds": "0.609375"}], // v3, priority 100, 100 cs
  [3, 200, 100, "21.875", "0.21875", "321.875", "3.21875", "1", {"silentFrom": "221.875", "silentFromSeconds": "2.21875", "silentTo": "321.875", "silentToSeconds": "3.21875", "shutdown": "21.875", "shutdownSeconds": "0.21875"}], // v3, priority 200, 100 cs
  [3, 254, 100, "0.78125", "0.0078125", "300.78125", "3.0078125", "1", {"silentFrom": "200.78125", "silentFromSeconds": "2.0078125", "silentTo": "300.78125", "silentToSeconds": "3.0078125", "shutdown": "0.78125", "shutdownSeconds": "0.0078125"}], // v3, priority 254, 100 cs
  [3, 255, 100, "0.390625", "0.00390625", "300.390625", "3.00390625", "1", null], // v3, priority 255, 100 cs
  [3, 1, 1, "0.99609375", "0.0099609375", "3.99609375", "0.0399609375", "0.01", {"silentFrom": "2.99609375", "silentFromSeconds": "0.0299609375", "silentTo": "3.99609375", "silentToSeconds": "0.0399609375", "shutdown": "0.99609375", "shutdownSeconds": "0.0099609375"}], // v3, priority 1, 1 cs
  [3, 100, 1, "0.609375", "0.00609375", "3.609375", "0.03609375", "0.01", {"silentFrom": "2.609375", "silentFromSeconds": "0.02609375", "silentTo": "3.609375", "silentToSeconds": "0.03609375", "shutdown": "0.609375", "shutdownSeconds": "0.00609375"}], // v3, priority 100, 1 cs
  [3, 254, 1, "0.0078125", "0.000078125", "3.0078125", "0.030078125", "0.01", {"silentFrom": "2.0078125", "silentFromSeconds": "0.020078125", "silentTo": "3.0078125", "silentToSeconds": "0.030078125", "shutdown": "0.0078125", "shutdownSeconds": "0.000078125"}], // v3, priority 254, 1 cs
  [3, 255, 1, "0.00390625", "0.0000390625", "3.00390625", "0.0300390625", "0.01", null], // v3, priority 255, 1 cs
  [3, 1, 4095, "4079.00390625", "40.7900390625", "16364.00390625", "163.6400390625", "40.95", {"silentFrom": "12269.00390625", "silentFromSeconds": "122.6900390625", "silentTo": "16364.00390625", "silentToSeconds": "163.6400390625", "shutdown": "4079.00390625", "shutdownSeconds": "40.7900390625"}], // v3, priority 1, 4095 cs
  [3, 100, 4095, "2495.390625", "24.95390625", "14780.390625", "147.80390625", "40.95", {"silentFrom": "10685.390625", "silentFromSeconds": "106.85390625", "silentTo": "14780.390625", "silentToSeconds": "147.80390625", "shutdown": "2495.390625", "shutdownSeconds": "24.95390625"}], // v3, priority 100, 4095 cs
  [3, 254, 4095, "31.9921875", "0.319921875", "12316.9921875", "123.169921875", "40.95", {"silentFrom": "8221.9921875", "silentFromSeconds": "82.219921875", "silentTo": "12316.9921875", "silentToSeconds": "123.169921875", "shutdown": "31.9921875", "shutdownSeconds": "0.319921875"}], // v3, priority 254, 4095 cs
  [3, 255, 4095, "15.99609375", "0.1599609375", "12300.99609375", "123.0099609375", "40.95", null], // v3, priority 255, 4095 cs
  [3, 100, 50, "30.46875", "0.3046875", "180.46875", "1.8046875", "0.5", {"silentFrom": "130.46875", "silentFromSeconds": "1.3046875", "silentTo": "180.46875", "silentToSeconds": "1.8046875", "shutdown": "30.46875", "shutdownSeconds": "0.3046875"}], // v3, priority 100, 50 cs
  [3, 110, 100, "57.03125", "0.5703125", "357.03125", "3.5703125", "1", {"silentFrom": "257.03125", "silentFromSeconds": "2.5703125", "silentTo": "357.03125", "silentToSeconds": "3.5703125", "shutdown": "57.03125", "shutdownSeconds": "0.5703125"}], // v3, priority 110, 100 cs
  [3, 100, 300, "182.8125", "1.828125", "1082.8125", "10.828125", "3", {"silentFrom": "782.8125", "silentFromSeconds": "7.828125", "silentTo": "1082.8125", "silentToSeconds": "10.828125", "shutdown": "182.8125", "shutdownSeconds": "1.828125"}], // v3, priority 100, 300 cs
  [3, 150, 25, "10.3515625", "0.103515625", "85.3515625", "0.853515625", "0.25", {"silentFrom": "60.3515625", "silentFromSeconds": "0.603515625", "silentTo": "85.3515625", "silentToSeconds": "0.853515625", "shutdown": "10.3515625", "shutdownSeconds": "0.103515625"}], // v3, priority 150, 25 cs
  [2, 1, 1, "0.99609375", "0.99609375", "3.99609375", "3.99609375", "1", {"silentFrom": "2.99609375", "silentFromSeconds": "2.99609375", "silentTo": "3.99609375", "silentToSeconds": "3.99609375", "shutdown": "0.99609375", "shutdownSeconds": "0.99609375"}], // v2, priority 1, 1 s
  [2, 100, 1, "0.609375", "0.609375", "3.609375", "3.609375", "1", {"silentFrom": "2.609375", "silentFromSeconds": "2.609375", "silentTo": "3.609375", "silentToSeconds": "3.609375", "shutdown": "0.609375", "shutdownSeconds": "0.609375"}], // v2, priority 100, 1 s
  [2, 254, 1, "0.0078125", "0.0078125", "3.0078125", "3.0078125", "1", {"silentFrom": "2.0078125", "silentFromSeconds": "2.0078125", "silentTo": "3.0078125", "silentToSeconds": "3.0078125", "shutdown": "0.0078125", "shutdownSeconds": "0.0078125"}], // v2, priority 254, 1 s
  [2, 255, 1, "0.00390625", "0.00390625", "3.00390625", "3.00390625", "1", null], // v2, priority 255, 1 s
  [2, 1, 255, "0.99609375", "0.99609375", "765.99609375", "765.99609375", "255", {"silentFrom": "510.99609375", "silentFromSeconds": "510.99609375", "silentTo": "765.99609375", "silentToSeconds": "765.99609375", "shutdown": "0.99609375", "shutdownSeconds": "0.99609375"}], // v2, priority 1, 255 s
  [2, 100, 255, "0.609375", "0.609375", "765.609375", "765.609375", "255", {"silentFrom": "510.609375", "silentFromSeconds": "510.609375", "silentTo": "765.609375", "silentToSeconds": "765.609375", "shutdown": "0.609375", "shutdownSeconds": "0.609375"}], // v2, priority 100, 255 s
  [2, 254, 255, "0.0078125", "0.0078125", "765.0078125", "765.0078125", "255", {"silentFrom": "510.0078125", "silentFromSeconds": "510.0078125", "silentTo": "765.0078125", "silentToSeconds": "765.0078125", "shutdown": "0.0078125", "shutdownSeconds": "0.0078125"}], // v2, priority 254, 255 s
  [2, 255, 255, "0.00390625", "0.00390625", "765.00390625", "765.00390625", "255", null], // v2, priority 255, 255 s
  [2, 100, 3, "0.609375", "0.609375", "9.609375", "9.609375", "3", {"silentFrom": "6.609375", "silentFromSeconds": "6.609375", "silentTo": "9.609375", "silentToSeconds": "9.609375", "shutdown": "0.609375", "shutdownSeconds": "0.609375"}], // v2, priority 100, 3 s
]; // 26 rows

/** The timer vectors, one per row. */
const TIMER_VECTORS: VrrpVector[] = TIMER_TABLE.map(([version, priority, interval, skewTime, skewTimeSeconds, downInterval, downIntervalSeconds, intervalSeconds, failover]) => ({
  id: `timers-v${version}-p${priority}-i${interval}`, // e.g. timers-v3-p100-i100
  note: `VRRPv${version}, priority ${priority}, interval ${interval} ${version === 3 ? "cs" : "s"}: ${version === 3 ? "RFC 9568 s6.1" : "RFC 3768 s6.1"} in exact fractions (oracle).`, // where the numbers come from
  request: { mode: "timers", version, priority, interval: String(interval) }, // the request
  expect: { version, priority, owner: priority === 255, interval: String(interval), intervalSeconds, skewTime, skewTimeSeconds, downInterval, downIntervalSeconds, failover }, // the oracle's figures
})); // 26 vectors

/** Elections, each simulated by the oracle (a discrete-event run of RFC 9568 s6.4): who is Active, when, and how. */
const ELECTION_VECTORS: VrrpVector[] = [
  {
    id: "election-course-lab", // the case
    note: "The course's lab (chapter 4.2): SW-CORE-01 110 and SW-CORE-02 100, preemption on; failover 3.609375 s, shutdown 0.609375 s, preemption back after 3.5703125 s. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "57.03125", "downInterval": "357.03125", "startState": "active"}, {"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "357.03125", "afterSeconds": "3.5703125", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "357.03125", "afterSeconds": "3.5703125"}]}, // the oracle's outcome and times
  },
  {
    id: "election-course-lab-no-preempt", // the case
    note: "The lab with Preempt_Mode off: SW-CORE-01 comes back and stays Backup (RFC 9568 s6.4.2). (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": false, "interval": "100", "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "57.03125", "downInterval": "357.03125", "startState": "active"}, {"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "357.03125", "afterSeconds": "3.5703125", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "stays-no-preempt", "active": 1, "subject": 0, "after": null, "afterSeconds": null}]}, // the oracle's outcome and times
  },
  {
    id: "election-tie-by-address", // the case
    note: "Equal priorities: both time out together and the higher primary address stays Active (s6.4.3); the first Active comes back and stays Backup. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "R1", "priority": 100, "address": "192.0.2.2"}, {"name": "R2", "priority": 100, "address": "192.0.2.3"}]}, // the routers
    expect: {"active": 1, "ranking": [1, 0], "routers": [{"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}, {"rank": 1, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "active"}], "steps": [{"event": "start", "outcome": "tie-at-start", "active": 1, "after": "360.9375", "afterSeconds": "3.609375", "tied": [1, 0]}, {"event": "failure", "outcome": "failover", "active": 0, "subject": 1, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 0, "subject": 1, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "stays-equal", "active": 0, "subject": 1, "after": null, "afterSeconds": null}]}, // the oracle's outcome and times
  },
  {
    id: "election-tie-numeric-not-text", // the case
    note: "The address compares as an unsigned integer: 192.0.2.10 beats 192.0.2.9, which a text comparison would get wrong. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "R9", "priority": 100, "address": "192.0.2.9"}, {"name": "R10", "priority": 100, "address": "192.0.2.10"}]}, // the routers
    expect: {"active": 1, "ranking": [1, 0], "routers": [{"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}, {"rank": 1, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "active"}], "steps": [{"event": "start", "outcome": "tie-at-start", "active": 1, "after": "360.9375", "afterSeconds": "3.609375", "tied": [1, 0]}, {"event": "failure", "outcome": "failover", "active": 0, "subject": 1, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 0, "subject": 1, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "stays-equal", "active": 0, "subject": 1, "after": null, "afterSeconds": null}]}, // the oracle's outcome and times
  },
  {
    id: "election-owner-no-preempt", // the case
    note: "An owner with Preempt_Mode off: Active at once, and back at once after a failure (s6.1, s6.4.1). (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": false, "interval": "100", "routers": [{"name": "R1", "priority": 255, "address": "192.0.2.1", "owner": true}, {"name": "R2", "priority": 200, "address": "192.0.2.2"}, {"name": "R3", "priority": 150, "address": "192.0.2.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1, 2], "routers": [{"rank": 1, "skewTime": "0.390625", "downInterval": "300.390625", "startState": "active"}, {"rank": 2, "skewTime": "21.875", "downInterval": "321.875", "startState": "backup"}, {"rank": 3, "skewTime": "41.40625", "downInterval": "341.40625", "startState": "backup"}], "steps": [{"event": "start", "outcome": "owner-at-start", "active": 0, "after": "0", "afterSeconds": "0", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "321.875", "afterSeconds": "3.21875", "from": "221.875", "fromSeconds": "2.21875", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "21.875", "afterSeconds": "0.21875"}, {"event": "return", "outcome": "owner-preempts", "active": 0, "subject": 0, "after": "0", "afterSeconds": "0"}]}, // the oracle's outcome and times
  },
  {
    id: "election-owner-preempt", // the case
    note: "The owner listed second, with a numerically lower address: ownership, not the address, decides. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "R2", "priority": 200, "address": "192.0.2.2"}, {"name": "R1", "priority": 255, "address": "192.0.2.1", "owner": true}]}, // the routers
    expect: {"active": 1, "ranking": [1, 0], "routers": [{"rank": 2, "skewTime": "21.875", "downInterval": "321.875", "startState": "backup"}, {"rank": 1, "skewTime": "0.390625", "downInterval": "300.390625", "startState": "active"}], "steps": [{"event": "start", "outcome": "owner-at-start", "active": 1, "after": "0", "afterSeconds": "0", "tied": []}, {"event": "failure", "outcome": "failover", "active": 0, "subject": 1, "after": "321.875", "afterSeconds": "3.21875", "from": "221.875", "fromSeconds": "2.21875", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 0, "subject": 1, "after": "21.875", "afterSeconds": "0.21875"}, {"event": "return", "outcome": "owner-preempts", "active": 1, "subject": 1, "after": "0", "afterSeconds": "0"}]}, // the oracle's outcome and times
  },
  {
    id: "election-backup-tie", // the case
    note: "Two Backups tie after the failure: the higher address stays; the first Active preempts back. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "A", "priority": 120, "address": "192.0.2.10"}, {"name": "B", "priority": 100, "address": "192.0.2.20"}, {"name": "C", "priority": 100, "address": "192.0.2.30"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 2, 1], "routers": [{"rank": 1, "skewTime": "53.125", "downInterval": "353.125", "startState": "active"}, {"rank": 3, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}, {"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "353.125", "afterSeconds": "3.53125", "tied": []}, {"event": "failure", "outcome": "failover-tie", "active": 2, "subject": 0, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": [2, 1]}, {"event": "shutdown", "outcome": "shutdown-tie", "active": 2, "subject": 0, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "353.125", "afterSeconds": "3.53125"}]}, // the oracle's outcome and times
  },
  {
    id: "election-ipv6-link-local-tie", // the case
    note: "IPv6 link-local primary addresses compare as 128-bit integers: fe80::1:0 beats fe80::ff. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "R1", "priority": 100, "address": "fe80::ff"}, {"name": "R2", "priority": 100, "address": "fe80::1:0"}]}, // the routers
    expect: {"active": 1, "ranking": [1, 0], "routers": [{"rank": 2, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "backup"}, {"rank": 1, "skewTime": "60.9375", "downInterval": "360.9375", "startState": "active"}], "steps": [{"event": "start", "outcome": "tie-at-start", "active": 1, "after": "360.9375", "afterSeconds": "3.609375", "tied": [1, 0]}, {"event": "failure", "outcome": "failover", "active": 0, "subject": 1, "after": "360.9375", "afterSeconds": "3.609375", "from": "260.9375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 0, "subject": 1, "after": "60.9375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "stays-equal", "active": 0, "subject": 1, "after": null, "afterSeconds": null}]}, // the oracle's outcome and times
  },
  {
    id: "election-v2-course", // the case
    note: "VRRPv2 at its 1-second default: the same numbers as VRRPv3 at 100 cs, in seconds. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 2, "preempt": true, "interval": "1", "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "0.5703125", "downInterval": "3.5703125", "startState": "active"}, {"rank": 2, "skewTime": "0.609375", "downInterval": "3.609375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "3.5703125", "afterSeconds": "3.5703125", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "3.609375", "afterSeconds": "3.609375", "from": "2.609375", "fromSeconds": "2.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "0.609375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "3.5703125", "afterSeconds": "3.5703125"}]}, // the oracle's outcome and times
  },
  {
    id: "election-v2-three-seconds", // the case
    note: "VRRPv2 at 3 s: the skew stays (256 - P)/256 s, so the failover is 9.609375 s. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 2, "preempt": true, "interval": "3", "routers": [{"name": "R1", "priority": 200, "address": "192.0.2.2"}, {"name": "R2", "priority": 100, "address": "192.0.2.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "0.21875", "downInterval": "9.21875", "startState": "active"}, {"rank": 2, "skewTime": "0.609375", "downInterval": "9.609375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "9.21875", "afterSeconds": "9.21875", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "9.609375", "afterSeconds": "9.609375", "from": "6.609375", "fromSeconds": "6.609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "0.609375", "afterSeconds": "0.609375"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "9.21875", "afterSeconds": "9.21875"}]}, // the oracle's outcome and times
  },
  {
    id: "election-v3-three-seconds", // the case
    note: "VRRPv3 at 300 cs: the skew scales with the interval, so the failover is 1082.8125 cs. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "300", "routers": [{"name": "R1", "priority": 200, "address": "192.0.2.2"}, {"name": "R2", "priority": 100, "address": "192.0.2.3"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "65.625", "downInterval": "965.625", "startState": "active"}, {"rank": 2, "skewTime": "182.8125", "downInterval": "1082.8125", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "965.625", "afterSeconds": "9.65625", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "1082.8125", "afterSeconds": "10.828125", "from": "782.8125", "fromSeconds": "7.828125", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "182.8125", "afterSeconds": "1.828125"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "965.625", "afterSeconds": "9.65625"}]}, // the oracle's outcome and times
  },
  {
    id: "election-sub-second", // the case
    note: "VRRPv3 at 10 cs, priorities 254 and 1. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "10", "routers": [{"name": "R1", "priority": 254, "address": "198.51.100.1"}, {"name": "R2", "priority": 1, "address": "198.51.100.2"}]}, // the routers
    expect: {"active": 0, "ranking": [0, 1], "routers": [{"rank": 1, "skewTime": "0.078125", "downInterval": "30.078125", "startState": "active"}, {"rank": 2, "skewTime": "9.9609375", "downInterval": "39.9609375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 0, "after": "30.078125", "afterSeconds": "0.30078125", "tied": []}, {"event": "failure", "outcome": "failover", "active": 1, "subject": 0, "after": "39.9609375", "afterSeconds": "0.399609375", "from": "29.9609375", "fromSeconds": "0.299609375", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 1, "subject": 0, "after": "9.9609375", "afterSeconds": "0.099609375"}, {"event": "return", "outcome": "preempts", "active": 0, "subject": 0, "after": "30.078125", "afterSeconds": "0.30078125"}]}, // the oracle's outcome and times
  },
  {
    id: "election-eight-routers", // the case
    note: "Eight routers: the ranking, and a tie between two Backups at 150 after the failure. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": true, "interval": "100", "routers": [{"name": "R1", "priority": 10, "address": "203.0.113.1"}, {"name": "R2", "priority": 80, "address": "203.0.113.2"}, {"name": "R3", "priority": 80, "address": "203.0.113.3"}, {"name": "R4", "priority": 200, "address": "203.0.113.4"}, {"name": "R5", "priority": 150, "address": "203.0.113.5"}, {"name": "R6", "priority": 150, "address": "203.0.113.6"}, {"name": "R7", "priority": 30, "address": "203.0.113.7"}, {"name": "R8", "priority": 1, "address": "203.0.113.8"}]}, // the routers
    expect: {"active": 3, "ranking": [3, 5, 4, 2, 1, 6, 0, 7], "routers": [{"rank": 7, "skewTime": "96.09375", "downInterval": "396.09375", "startState": "backup"}, {"rank": 5, "skewTime": "68.75", "downInterval": "368.75", "startState": "backup"}, {"rank": 4, "skewTime": "68.75", "downInterval": "368.75", "startState": "backup"}, {"rank": 1, "skewTime": "21.875", "downInterval": "321.875", "startState": "active"}, {"rank": 3, "skewTime": "41.40625", "downInterval": "341.40625", "startState": "backup"}, {"rank": 2, "skewTime": "41.40625", "downInterval": "341.40625", "startState": "backup"}, {"rank": 6, "skewTime": "88.28125", "downInterval": "388.28125", "startState": "backup"}, {"rank": 8, "skewTime": "99.609375", "downInterval": "399.609375", "startState": "backup"}], "steps": [{"event": "start", "outcome": "elected-at-start", "active": 3, "after": "321.875", "afterSeconds": "3.21875", "tied": []}, {"event": "failure", "outcome": "failover-tie", "active": 5, "subject": 3, "after": "341.40625", "afterSeconds": "3.4140625", "from": "241.40625", "fromSeconds": "2.4140625", "tied": [5, 4]}, {"event": "shutdown", "outcome": "shutdown-tie", "active": 5, "subject": 3, "after": "41.40625", "afterSeconds": "0.4140625"}, {"event": "return", "outcome": "preempts", "active": 3, "subject": 3, "after": "321.875", "afterSeconds": "3.21875"}]}, // the oracle's outcome and times
  },
  {
    id: "election-max-interval-tie", // the case
    note: "The largest interval, 4095 cs, priority 1 on both, Preempt_Mode off. (oracle simulation)", // what it shows
    request: {"mode": "election", "version": 3, "preempt": false, "interval": "4095", "routers": [{"name": "R1", "priority": 1, "address": "192.0.2.1"}, {"name": "R2", "priority": 1, "address": "192.0.2.2"}]}, // the routers
    expect: {"active": 1, "ranking": [1, 0], "routers": [{"rank": 2, "skewTime": "4079.00390625", "downInterval": "16364.00390625", "startState": "backup"}, {"rank": 1, "skewTime": "4079.00390625", "downInterval": "16364.00390625", "startState": "active"}], "steps": [{"event": "start", "outcome": "tie-at-start", "active": 1, "after": "16364.00390625", "afterSeconds": "163.6400390625", "tied": [1, 0]}, {"event": "failure", "outcome": "failover", "active": 0, "subject": 1, "after": "16364.00390625", "afterSeconds": "163.6400390625", "from": "12269.00390625", "fromSeconds": "122.6900390625", "tied": []}, {"event": "shutdown", "outcome": "shutdown-handover", "active": 0, "subject": 1, "after": "4079.00390625", "afterSeconds": "40.7900390625"}, {"event": "return", "outcome": "stays-equal", "active": 0, "subject": 1, "after": null, "afterSeconds": null}]}, // the oracle's outcome and times
  },
]; // 14 vectors

/** Virtual Router MACs (RFC 9568 s7.3), formatted by the oracle: [vrid, family, hyphen, colon, dotted, vridHex]. */
const MAC_TABLE: readonly [number, "ipv4" | "ipv6", string, string, string, string][] = [
  [1, "ipv4", "00-00-5E-00-01-01", "00:00:5e:00:01:01", "0000.5e00.0101", "01"], // VRID 1, ipv4
  [1, "ipv6", "00-00-5E-00-02-01", "00:00:5e:00:02:01", "0000.5e00.0201", "01"], // VRID 1, ipv6
  [10, "ipv4", "00-00-5E-00-01-0A", "00:00:5e:00:01:0a", "0000.5e00.010a", "0A"], // VRID 10, ipv4
  [10, "ipv6", "00-00-5E-00-02-0A", "00:00:5e:00:02:0a", "0000.5e00.020a", "0A"], // VRID 10, ipv6
  [15, "ipv4", "00-00-5E-00-01-0F", "00:00:5e:00:01:0f", "0000.5e00.010f", "0F"], // VRID 15, ipv4
  [15, "ipv6", "00-00-5E-00-02-0F", "00:00:5e:00:02:0f", "0000.5e00.020f", "0F"], // VRID 15, ipv6
  [16, "ipv4", "00-00-5E-00-01-10", "00:00:5e:00:01:10", "0000.5e00.0110", "10"], // VRID 16, ipv4
  [16, "ipv6", "00-00-5E-00-02-10", "00:00:5e:00:02:10", "0000.5e00.0210", "10"], // VRID 16, ipv6
  [128, "ipv4", "00-00-5E-00-01-80", "00:00:5e:00:01:80", "0000.5e00.0180", "80"], // VRID 128, ipv4
  [128, "ipv6", "00-00-5E-00-02-80", "00:00:5e:00:02:80", "0000.5e00.0280", "80"], // VRID 128, ipv6
  [255, "ipv4", "00-00-5E-00-01-FF", "00:00:5e:00:01:ff", "0000.5e00.01ff", "FF"], // VRID 255, ipv4
  [255, "ipv6", "00-00-5E-00-02-FF", "00:00:5e:00:02:ff", "0000.5e00.02ff", "FF"], // VRID 255, ipv6
]; // 12 rows

/** The MAC vectors, one per row. */
const MAC_VECTORS: VrrpVector[] = MAC_TABLE.map(([vrid, family, hyphen, colon, dotted, vridHex]) => ({
  id: `mac-${family}-vrid${vrid}`, // e.g. mac-ipv4-vrid10
  note: `RFC 9568 s7.3: 00-00-5E-00-0${family === "ipv4" ? 1 : 2}-{VRID} for VRID ${vrid} (oracle).`, // the rule
  request: { mode: "mac", vrid: String(vrid), family }, // the request
  expect: { vrid, family, hyphen, colon, dotted, vridHex, block: family === "ipv4" ? "00-01" : "00-02", multicastGroup: family === "ipv4" ? "224.0.0.18" : "ff02::12", ipProtocol: 112 }, // the three notations
})); // 12 vectors

/** The lab's two switches (the election Example's routers), reused by the hand-written vectors. */
const LAB = [{ name: "SW-CORE-01", priority: 110, address: "10.1.10.2" }, { name: "SW-CORE-02", priority: 100, address: "10.1.10.3" }]; // chapter 4.2's values

/** The hand-written vectors: the Examples, spellings, sentences, refusals and the API's text. */
const OTHER_VECTORS: VrrpVector[] = [
  // ---- The three Examples (D-83): the course's VRRP lab ------------------------------------------------------------
  {
    id: "example-timers", // the timers Example
    note: "The lab's Backup at priority 100 and 1 s: 60.9375 cs of skew, 360.9375 cs (the deck's \"about 3.6 s\") after a cut link, 0.609375 s (\"about 0.6 s\") after a clean shutdown (oracle row timers-v3-p100-i100).",
    request: EXAMPLE_TIMERS_REQUEST as VrrpRequest, // the Example, verbatim
    expect: { version: 3, unit: "cs", priority: 100, interval: "100", intervalDefault: false, skewTime: "60.9375", downInterval: "360.9375", downIntervalSeconds: "3.609375", skewNumerator: "15600", arithmetic: { skew: "Skew_Time = ((256 - 100) * 100) / 256 = 15600 / 256 = 60.9375 cs", down: "Active_Down_Interval = (3 * 100) + 60.9375 = 360.9375 cs" }, failover: { silentFromSeconds: "2.609375", silentToSeconds: "3.609375", shutdownSeconds: "0.609375" }, names: { rfc: "RFC 9568", down: "Active_Down_Interval", activeRole: "Active Router" } }, // the arithmetic shown
    contains: { notes: ["takes over when its Active_Down_Timer fires", "RFC 5798, which it obsoletes"] }, // the failover note and the names
  },
  {
    id: "example-election", // the election Example
    note: "The lab: SW-CORE-01 (110) Active, SW-CORE-02 (100) takes over 3.609375 s after the last ADVERTISEMENT or 0.609375 s after a clean shutdown, and SW-CORE-01 preempts back 3.5703125 s after it returns (oracle election-course-lab).",
    request: EXAMPLE_ELECTION_REQUEST as unknown as VrrpRequest, // the Example, verbatim
    expect: { family: "ipv4", preempt: true, preemptDefault: false, active: 0, activeReason: "priority", steps: [{ outcome: "elected-at-start", afterSeconds: "3.5703125" }, { outcome: "failover", activeName: "SW-CORE-02", afterSeconds: "3.609375", fromSeconds: "2.609375" }, { outcome: "shutdown-handover", afterSeconds: "0.609375" }, { outcome: "preempts", activeName: "SW-CORE-01", afterSeconds: "3.5703125" }] }, // the account
    contains: { verdictText: "SW-CORE-01 is the Active Router: it has the highest priority, 110.", steps: ["No router owns the virtual address", "Preempt_Mode is on and its priority, 110, is higher than SW-CORE-02's, 100"] }, // the sentences
  },
  {
    id: "example-mac", // the MAC Example
    note: "The lab's VRID 10: 00-00-5E-00-01-0A, as the deck's notes give it (RFC 9568 s7.3).",
    request: EXAMPLE_MAC_REQUEST as VrrpRequest, // the Example, verbatim
    expect: { version: 3, family: "ipv4", vrid: 10, vridHex: "0A", hyphen: "00-00-5E-00-01-0A", colon: "00:00:5e:00:01:0a", dotted: "0000.5e00.010a" }, // three notations
    contains: { notes: ["IANA's Organizationally Unique Identifier", "224.0.0.18, IP protocol 112"] }, // the layout and the destination
  },
  // ---- VRRPv2 arithmetic and sentences -------------------------------------------------------------------------------
  {
    id: "timers-v2-arithmetic", // the RFC 3768 formulas shown
    note: "RFC 3768 s6.1: Skew_Time = (256 - P) / 256 s, Master_Down_Interval = 3 x I + Skew_Time (oracle row timers-v2-p100-i1).",
    request: { mode: "timers", version: 2, priority: 100, interval: "1" }, // VRRPv2 defaults
    expect: { unit: "s", skewNumerator: "156", arithmetic: { skew: "Skew_Time = (256 - 100) / 256 = 156 / 256 = 0.609375 s", down: "Master_Down_Interval = (3 * 1) + 0.609375 = 3.609375 s" }, names: { rfc: "RFC 3768", down: "Master_Down_Interval", downTimer: "Master_Down_Timer", activeRole: "Master" } }, // the v2 words
    contains: { notes: ["does not grow with the interval", "discards an ADVERTISEMENT whose Adver Int differs", "renamed them Active Router and Active_Down_Interval"] }, // the v2 notes
  },
  {
    id: "timers-v2-vs-v3-at-3s", // the difference beyond the unit
    note: "At 3 s the v2 skew is still 0.609375 s (oracle timers-v2-p100-i3) while v3 at 300 cs gives 182.8125 cs (oracle timers-v3-p100-i300).",
    request: { mode: "timers", version: 2, priority: 100, interval: "3" }, // VRRPv2 at 3 s
    expect: { skewTime: "0.609375", downInterval: "9.609375" }, // the skew does not scale
  },
  {
    id: "timers-v3-300cs", // the other side of the comparison
    note: "RFC 9568 s6.1 at 300 cs: (156 x 300) / 256 = 182.8125 cs (oracle).",
    request: { mode: "timers", version: 3, priority: 100, interval: "3 s" }, // three seconds, with a unit
    expect: { interval: "300", skewTime: "182.8125", downInterval: "1082.8125", downIntervalSeconds: "10.828125" }, // the skew scales
  },
  // ---- Interval spellings and defaults -------------------------------------------------------------------------------
  { id: "interval-1s", note: "1 s is 100 cs.", request: { mode: "timers", priority: 100, interval: "1 s" }, expect: { version: 3, interval: "100", downInterval: "360.9375" } }, // seconds with a unit
  { id: "interval-250ms", note: "250 ms is 25 cs.", request: { mode: "timers", priority: 150, interval: "250 ms" }, expect: { interval: "25", skewTime: "10.3515625", downInterval: "85.3515625" } }, // oracle row timers-v3-p150-i25
  { id: "interval-half-second", note: "0.5 s is 50 cs: a sub-second interval, with RFC 9568 s2.5's warning.", request: { mode: "timers", priority: 100, interval: "0.5 s" }, expect: { interval: "50", skewTime: "30.46875", downInterval: "180.46875" }, contains: { notes: ["many times per second"] } }, // oracle row timers-v3-p100-i50
  { id: "interval-max-seconds", note: "40.95 s is 4095 cs, the largest (erratum 8301).", request: { mode: "timers", priority: 100, interval: "40.95 s" }, expect: { interval: "4095", downInterval: "14780.390625" } }, // oracle row timers-v3-p100-i4095
  { id: "interval-cs-unit", note: "An explicit cs unit.", request: { mode: "timers", priority: 254, interval: "1 cs" }, expect: { interval: "1", skewTime: "0.0078125", downInterval: "3.0078125", downIntervalSeconds: "0.030078125" } }, // the article's "about 30 milliseconds" (oracle row timers-v3-p254-i1)
  { id: "interval-upper-case-unit", note: "Units in any case.", request: { mode: "timers", priority: 100, interval: "1S" }, expect: { interval: "100" } }, // 1S
  { id: "interval-json-number", note: "A JSON number is the version's unit.", request: { mode: "timers", priority: 100, interval: 100 as unknown as string }, expect: { interval: "100" } }, // centiseconds
  { id: "interval-default-v3", note: "Blank: RFC 9568's default, 100 cs.", request: { mode: "timers", priority: 100, interval: "" }, expect: { interval: "100", intervalDefault: true, downInterval: "360.9375" }, contains: { notes: ["No interval entered: the default, 100 centiseconds"] } }, // the default
  { id: "interval-default-v2", note: "Blank: RFC 3768's default, 1 s.", request: { mode: "timers", version: "2", priority: 100 }, expect: { interval: "1", intervalDefault: true }, contains: { notes: ["No interval entered: the default, 1 second"] } }, // the default
  { id: "interval-v2-seconds-unit", note: "VRRPv2 with an s unit.", request: { mode: "timers", version: 2, priority: 1, interval: "255 s" }, expect: { interval: "255", downInterval: "765.99609375" } }, // oracle row timers-v2-p1-i255
  { id: "priority-json-number", note: "A JSON number priority.", request: { mode: "timers", priority: 254 as unknown as string }, expect: { priority: 254 } }, // a number
  // ---- The owner -----------------------------------------------------------------------------------------------------
  { id: "timers-owner-note", note: "Priority 255: the owner's timers are computed, but it never waits as a Backup (RFC 9568 s6.4.1, s8.3.2).", request: { mode: "timers", priority: 255, interval: "100" }, expect: { owner: true, failover: null, skewTime: "0.390625" }, contains: { notes: ["Priority 255 belongs to the address owner", "only one SHOULD"] } }, // oracle row timers-v3-p255-i100
  { id: "election-owner-blank-priority", note: "An owner without a priority is 255.", request: { mode: "election", routers: [{ name: "GW", owner: true, address: "192.0.2.1" }, { priority: 100, address: "192.0.2.2" }] }, expect: { active: 0, activeReason: "owner", routers: [{ name: "GW", priority: 255, owner: true }, { name: "R2", priority: 100 }] }, contains: { verdictText: "GW is the Active Router: it owns the virtual address." } }, // RFC 9568 s5.2.4
  { id: "election-owner-text-switches", note: "Owner and Preempt_Mode as text.", request: { mode: "election", preempt: "off", routers: [{ name: "A", priority: "255", owner: "true", address: "192.0.2.1" }, { name: "B", priority: "254", owner: "false", address: "192.0.2.2" }] }, expect: { preempt: false, active: 0, steps: [{ outcome: "owner-at-start", after: "0" }, {}, {}, { outcome: "owner-preempts", after: "0" }] }, contains: { notes: ["always preempts, independent of the setting of this flag"] } }, // the owner's exception
  // ---- Election sentences --------------------------------------------------------------------------------------------
  { id: "election-tie-sentences", note: "A tie: the warning of RFC 9568 s8.3.2 and the address verdict.", request: { mode: "election", routers: [{ name: "R1", priority: 100, address: "192.0.2.2" }, { name: "R2", priority: 100, address: "192.0.2.3" }] }, expect: { activeReason: "address-tie", active: 1 }, contains: { warnings: ["R2 and R1 have the same priority, 100", "sufficient differences"], verdictText: "it shares the highest priority, 100, and has the highest primary address", steps: ["each of them turns Active", "with or without preemption"], notes: ["unsigned integer in network byte order"] } }, // ties
  { id: "election-no-preempt-sentence", note: "Preempt_Mode off: the first Active Router comes back and stays Backup.", request: { mode: "election", preempt: false, routers: LAB }, expect: { steps: [{}, {}, {}, { outcome: "stays-no-preempt", activeName: "SW-CORE-02", after: null }] }, contains: { steps: ["but Preempt_Mode is off"] } }, // RFC 9568 s6.4.2
  { id: "election-three-way-list", note: "Three routers tied: the list reads 'R3, R2 and R1'.", request: { mode: "election", routers: [{ priority: 90, address: "192.0.2.1" }, { priority: 90, address: "192.0.2.2" }, { priority: 90, address: "192.0.2.3" }] }, expect: { active: 2 }, contains: { steps: ["R3, R2 and R1 share the highest priority, 90"] } }, // a list of three
  { id: "election-ipv6-note", note: "IPv6: the link-local primary address note (RFC 9568 s1.7).", request: { mode: "election", routers: [{ priority: 120, address: "fe80::1" }, { priority: 110, address: "FE80::2" }] }, expect: { family: "ipv6", active: 0 }, contains: { notes: ["unsigned 128-bit number"] } }, // IPv6
  { id: "election-ipv6-embedded-v4", note: "An IPv6 link-local address with an IPv4 tail parses (RFC 4291 s2.2): fe80::c000:201 beats fe80::1.", request: { mode: "election", routers: [{ priority: 100, address: "fe80::1" }, { priority: 100, address: "fe80::192.0.2.1" }] }, expect: { active: 1 } }, // the tail form
  { id: "election-default-preempt", note: "Preempt_Mode absent: True (RFC 9568 s6.1).", request: { mode: "election", routers: LAB }, expect: { preempt: true, preemptDefault: true }, contains: { notes: ["Preempt_Mode was not given: the default, True (on)"] } }, // the default
  { id: "election-v2-words", note: "VRRPv2: the same rules in RFC 3768's words.", request: { mode: "election", version: 2, routers: LAB }, expect: { unit: "s", names: { rfc: "RFC 3768", activeRole: "Master" } }, contains: { verdictText: "SW-CORE-01 is the Master", steps: ["its Master_Down_Timer fires one Master_Down_Interval after the last ADVERTISEMENT"] } }, // v2 words
  // ---- Timers refusals -----------------------------------------------------------------------------------------------
  { id: "err-priority-zero", note: "Priority 0 is reserved for an Active Router relinquishing responsibility (RFC 9568 s5.2.4, s6.1).", request: { mode: "timers", priority: "0" }, expectError: /Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility/ },
  { id: "err-priority-256", note: "The priority field is 8 bits (RFC 9568 s5.2.4).", request: { mode: "timers", priority: "256" }, expectError: /Priority 256 does not exist: the field is 8 bits/ },
  { id: "err-priority-negative", note: "Not a whole number from 1 to 255.", request: { mode: "timers", priority: "-1" }, expectError: /"-1" is not a priority/ },
  { id: "err-priority-decimal", note: "Priorities are whole numbers.", request: { mode: "timers", priority: "99.5" }, expectError: /"99\.5" is not a priority/ },
  { id: "err-priority-empty", note: "The priority is required.", request: { mode: "timers", priority: "" }, expectError: /Enter the router's priority/ },
  { id: "err-interval-zero-v3", note: "Verified erratum 8301: 1 to 4095 cs.", request: { mode: "timers", priority: 100, interval: "0" }, expectError: /verified erratum 8301 to RFC 9568 makes the range 1 to 4095 centiseconds/ },
  { id: "err-interval-4096", note: "The 12-bit field (RFC 9568 s5.2.7).", request: { mode: "timers", priority: 100, interval: "4096" }, expectError: /12 bits of centiseconds, 1 to 4095/ },
  { id: "err-interval-4096-seconds", note: "40.96 s is 4096 cs.", request: { mode: "timers", priority: 100, interval: "40.96 s" }, expectError: /12 bits of centiseconds/ },
  { id: "err-interval-fraction-ms", note: "255 ms is 25.5 cs: not whole.", request: { mode: "timers", priority: 100, interval: "255 ms" }, expectError: /not a whole number of centiseconds/ },
  { id: "err-interval-fraction-cs", note: "1.5 cs is not whole.", request: { mode: "timers", priority: 100, interval: "1.5" }, expectError: /not a whole number of centiseconds/ },
  { id: "err-interval-bad-v3", note: "Not an interval.", request: { mode: "timers", priority: 100, interval: "fast" }, expectError: /enter whole centiseconds from 1 to 4095/ },
  { id: "err-v2-centiseconds", note: "Mixed arithmetic: centiseconds belong to VRRPv3.", request: { mode: "timers", version: 2, priority: 100, interval: "50 cs" }, expectError: /The two versions' arithmetic does not mix/ },
  { id: "err-v2-milliseconds", note: "VRRPv2 counts whole seconds.", request: { mode: "timers", version: 2, priority: 100, interval: "500 ms" }, expectError: /is a sub-second unit, and VRRPv2 counts the advertisement interval in whole seconds/ },
  { id: "err-v2-fraction", note: "1.5 s does not fit the whole-second field.", request: { mode: "timers", version: 2, priority: 100, interval: "1.5" }, expectError: /not a whole number of seconds/ },
  { id: "err-v2-zero", note: "No interval.", request: { mode: "timers", version: 2, priority: 100, interval: "0" }, expectError: /cannot be zero: an ADVERTISEMENT every 0 seconds/ },
  { id: "err-v2-256", note: "The 8-bit Adver Int field (RFC 3768 s5.1).", request: { mode: "timers", version: 2, priority: 100, interval: "256" }, expectError: /8 bits of whole seconds, at most 255/ },
  { id: "err-v2-bad", note: "Not an interval.", request: { mode: "timers", version: 2, priority: 100, interval: "1 minute" }, expectError: /enter whole seconds from 1 to 255/ },
  { id: "err-version", note: "Only versions 3 and 2.", request: { mode: "timers", version: "4", priority: 100 }, expectError: /Choose VRRP version 3 \(RFC 9568\) or version 2/ },
  { id: "err-too-long", note: "Every field is bounded.", request: { mode: "timers", priority: "1".repeat(65) }, expectError: /longer than this tool reads/ },
  // ---- Election refusals ---------------------------------------------------------------------------------------------
  { id: "err-one-router", note: "An election needs a Backup.", request: { mode: "election", routers: [LAB[0]] }, expectError: /from 2 to 8 routers/ },
  { id: "err-nine-routers", note: "At most eight.", request: { mode: "election", routers: Array.from({ length: 9 }, (_, i) => ({ priority: 100 + i, address: `192.0.2.${i + 1}` })) }, expectError: /from 2 to 8 routers/ },
  { id: "err-routers-not-list", note: "The API sends a list.", request: { mode: "election", routers: "R1 100 10.0.0.1" as unknown as [] }, expectError: /as a list of objects/ },
  { id: "err-two-owners", note: "Only one router SHOULD have 255 (RFC 9568 s8.3.2); erratum 8298 changed s7.1.", request: { mode: "election", routers: [{ name: "A", owner: true, address: "192.0.2.1" }, { name: "B", owner: true, address: "192.0.2.2" }] }, expectError: /A and B both claim to own the virtual address.*erratum 8298/ },
  { id: "err-owner-not-255", note: "The owner MUST be 255 (RFC 9568 s5.2.4).", request: { mode: "election", routers: [{ name: "A", owner: true, priority: 200, address: "192.0.2.1" }, { name: "B", priority: 100, address: "192.0.2.2" }] }, expectError: /^A: The address owner's priority MUST be 255 \(RFC 9568, section 5\.2\.4\), not 200\./ },
  { id: "err-255-not-owner", note: "255 is reserved for the owner (RFC 9568 s6.1).", request: { mode: "election", routers: [{ name: "A", priority: 255, address: "192.0.2.1" }, { name: "B", priority: 100, address: "192.0.2.2" }] }, expectError: /^A: Priority 255 is reserved for the router that owns the virtual address/ },
  { id: "err-router-priority-zero", note: "A router's priority 0, named.", request: { mode: "election", routers: [LAB[0], { name: "SW-CORE-02", priority: 0, address: "10.1.10.3" }] }, expectError: /^SW-CORE-02: Priority 0 is never configured/ },
  { id: "err-router-default-name", note: "An unnamed router is called R2 in a refusal.", request: { mode: "election", routers: [LAB[0], { priority: 300, address: "10.1.10.3" }] }, expectError: /^R2: Priority 300 does not exist/ },
  { id: "err-family-mix", note: "IPv4 and IPv6 are separate Virtual Routers (RFC 9568, Abstract).", request: { mode: "election", routers: [{ priority: 110, address: "192.0.2.1" }, { priority: 100, address: "fe80::1" }] }, expectError: /mix IPv4 and IPv6/ },
  { id: "err-v2-ipv6", note: "VRRPv2 is IPv4 only (RFC 3768 s1.2).", request: { mode: "election", version: 2, routers: [{ priority: 110, address: "fe80::1" }, { priority: 100, address: "fe80::2" }] }, expectError: /VRRPv2 is for IPv4 only/ },
  { id: "err-ipv6-global", note: "IPv6 primary addresses are link-local (RFC 9568 s1.7; RFC 4291 s2.5.6).", request: { mode: "election", routers: [{ name: "A", priority: 110, address: "2001:db8::1" }, { name: "B", priority: 100, address: "fe80::2" }] }, expectError: /^A: "2001:db8::1" is not a link-local address/ },
  { id: "err-duplicate-address", note: "Two routers cannot share a primary address.", request: { mode: "election", routers: [{ name: "A", priority: 110, address: "192.0.2.1" }, { name: "B", priority: 100, address: "192.0.2.1" }] }, expectError: /A and B have the same primary address/ },
  { id: "err-duplicate-address-v6-forms", note: "fe80::1 and fe80:0:0:0:0:0:0:1 are the same address.", request: { mode: "election", routers: [{ name: "A", priority: 110, address: "fe80::1" }, { name: "B", priority: 100, address: "fe80:0:0:0:0:0:0:1" }] }, expectError: /A and B have the same primary address/ },
  { id: "err-duplicate-name", note: "Names must differ.", request: { mode: "election", routers: [{ name: "A", priority: 110, address: "192.0.2.1" }, { name: "A", priority: 100, address: "192.0.2.2" }] }, expectError: /Two routers are called "A"/ },
  { id: "err-name-space", note: "Names have no spaces (the share link's line form).", request: { mode: "election", routers: [{ name: "SW CORE", priority: 110, address: "192.0.2.1" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /"SW CORE" is not a router name/ },
  { id: "err-address-octet", note: "256 is not an octet.", request: { mode: "election", routers: [{ priority: 110, address: "192.0.2.256" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /^R1: "192\.0\.2\.256" is not an IPv4 or IPv6 address/ },
  { id: "err-address-leading-zero", note: "A leading zero is refused.", request: { mode: "election", routers: [{ priority: 110, address: "192.0.2.01" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /not an IPv4 or IPv6 address/ },
  { id: "err-address-prefix", note: "A prefix length is not part of the address.", request: { mode: "election", routers: [{ priority: 110, address: "192.0.2.1/24" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /without a prefix length or a zone/ },
  { id: "err-address-zone", note: "A zone index is not part of the address.", request: { mode: "election", routers: [{ priority: 110, address: "fe80::1%eth0" }, { priority: 100, address: "fe80::2" }] }, expectError: /without a prefix length or a zone/ },
  { id: "err-address-double-compression", note: "\"::\" may appear once (RFC 4291 s2.2).", request: { mode: "election", routers: [{ priority: 110, address: "fe80::1::2" }, { priority: 100, address: "fe80::2" }] }, expectError: /not an IPv4 or IPv6 address/ },
  { id: "err-address-empty", note: "The address is required.", request: { mode: "election", routers: [{ priority: 110, address: "" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /^R1: Enter the router's primary address/ },
  { id: "err-preempt", note: "On or off.", request: { mode: "election", preempt: "maybe", routers: LAB }, expectError: /Preempt_Mode is on or off/ },
  { id: "err-owner-switch", note: "Owner is true or false.", request: { mode: "election", routers: [{ priority: 110, address: "192.0.2.1", owner: "perhaps" }, { priority: 100, address: "192.0.2.2" }] }, expectError: /^R1: Owner is true or false/ },
  // ---- MAC refusals --------------------------------------------------------------------------------------------------
  { id: "err-vrid-zero", note: "VRID 1 to 255, no default (RFC 9568 s1.7, s6.1).", request: { mode: "mac", vrid: "0" }, expectError: /VRID 0 does not exist/ },
  { id: "err-vrid-256", note: "The VRID field is 8 bits.", request: { mode: "mac", vrid: "256" }, expectError: /the field is 8 bits, 1 to 255/ },
  { id: "err-vrid-hex", note: "The VRID is entered in decimal.", request: { mode: "mac", vrid: "0x0A" }, expectError: /"0x0A" is not a VRID/ },
  { id: "err-vrid-empty", note: "The VRID is required.", request: { mode: "mac", vrid: "" }, expectError: /Enter the VRID/ },
  { id: "err-mac-v2-ipv6", note: "VRRPv2 has no IPv6 block (RFC 3768 s1.2; RFC 9568 s7.3).", request: { mode: "mac", version: 2, vrid: "10", family: "ipv6" }, expectError: /no IPv6 virtual MAC/ },
  { id: "err-family", note: "ipv4 or ipv6.", request: { mode: "mac", vrid: "10", family: "ipx" }, expectError: /Choose the address family/ },
  { id: "mac-v2-ipv4", note: "VRRPv2 uses the IPv4 block (RFC 3768 s7.3).", request: { mode: "mac", version: 2, vrid: "200", family: "ipv4" }, expect: { version: 2, hyphen: "00-00-5E-00-01-C8" }, contains: { notes: ["VRRPv2 uses the same IPv4 block"] } }, // C8 = 200
  // ---- The API's text ------------------------------------------------------------------------------------------------
  { id: "api-timers", note: "The API body as JSON text.", api: '{"mode":"timers","version":3,"priority":100,"interval":100}', expect: { downIntervalSeconds: "3.609375" } }, // numbers as JSON numbers
  { id: "api-election", note: "An election as JSON text.", api: '{"mode":"election","routers":[{"name":"SW-CORE-01","priority":110,"address":"10.1.10.2"},{"name":"SW-CORE-02","priority":100,"address":"10.1.10.3"}]}', expect: { active: 0 } }, // the lab
  { id: "err-json", note: "The body must be JSON.", api: "{", expectError: /not valid JSON/ },
  { id: "err-json-array", note: "The body must be an object.", api: "[1]", expectError: /not valid JSON/ },
  { id: "err-mode", note: "The mode is required.", api: '{"mode":"hsrp"}', expectError: /Choose a mode: timers, election or mac/ },
]; // the written-out vectors

/** Every vector, in order. */
export const VRRP_VECTORS: readonly VrrpVector[] = Object.freeze([...TIMER_VECTORS, ...ELECTION_VECTORS, ...MAC_VECTORS, ...OTHER_VECTORS]); // tables first, then the rest

/**
 * Whether `actual` holds `expected`: objects as subsets, arrays of the same length element by element, anything else
 * exactly as JSON.
 * @param actual the reading's value
 * @param expected the vector's value
 * @returns true when it matches
 */
function matches(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) { // a list
    if (!Array.isArray(actual) || actual.length !== expected.length) return false; // the same length
    return expected.every((e, i) => matches(actual[i], e)); // each element
  } // array
  if (expected !== null && typeof expected === "object") { // a subset object
    if (actual === null || typeof actual !== "object") return false; // nothing to compare with
    return Object.entries(expected as Record<string, unknown>).every(([k, v]) => matches((actual as Record<string, unknown>)[k], v)); // each field
  } // object
  return JSON.stringify(actual) === JSON.stringify(expected); // exact, as JSON
} // matches

/** The report verifyVectors returns. */
export interface VerifyReport {
  /** The set id. */
  setId: string;
  /** Vectors run. */
  total: number;
  /** Vectors that passed. */
  passed: number;
  /** One line per failure (empty when all pass). */
  failures: string[];
}

/**
 * Run every vector.
 * @returns the report (failures empty when all pass)
 */
export function verifyVectors(): VerifyReport {
  const failures: string[] = []; // collected
  for (const v of VRRP_VECTORS) { // each vector
    let r: VrrpResult | null = null; // the reading
    try {
      r = v.api !== undefined ? runApi(v.api) : run(v.request as VrrpRequest); // the API text or the request
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e); // the refusal
      if (!v.expectError) failures.push(`${v.id}: unexpected error: ${msg}`); // should have computed
      else if (!v.expectError.test(msg)) failures.push(`${v.id}: error mismatch: ${msg}`); // the wrong refusal
      continue; // next vector
    } // ran
    if (v.expectError) { failures.push(`${v.id}: expected an error, got a reading`); continue; } // should have refused
    if (v.expect && !matches(r, v.expect)) failures.push(`${v.id}: fields differ: ${JSON.stringify(r).slice(0, 400)}`); // a number or a flag moved
    const c = v.contains ?? {}; // the texts expected
    const rec = r as unknown as { notes?: string[]; warnings?: string[]; verdictText?: string; steps?: { text: string }[] }; // the sentence fields
    for (const s of c.notes ?? []) if (!(rec.notes ?? []).some((n) => n.includes(s))) failures.push(`${v.id}: no note contains "${s}"`); // notes
    for (const s of c.warnings ?? []) if (!(rec.warnings ?? []).some((w) => w.includes(s))) failures.push(`${v.id}: no warning contains "${s}"`); // warnings
    if (c.verdictText && !String(rec.verdictText ?? "").includes(c.verdictText)) failures.push(`${v.id}: verdict text lacks "${c.verdictText}"`); // the verdict
    for (const s of c.steps ?? []) if (!(rec.steps ?? []).some((st) => st.text.includes(s))) failures.push(`${v.id}: no step contains "${s}"`); // steps
  } // vectors
  return { setId: GOLDEN_VECTOR_SET_ID, total: VRRP_VECTORS.length, passed: VRRP_VECTORS.length - new Set(failures.map((f) => f.split(":")[0])).size, failures }; // the report
} // verifyVectors
