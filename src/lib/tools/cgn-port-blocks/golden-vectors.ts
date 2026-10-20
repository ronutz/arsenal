// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/cgn-port-blocks/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the CGN port-block and MAP port-set calculator.
//
// Every accept vector names what supports its expected output:
//   * "RFC ..." - the number is printed in that RFC (read 2026-10-19 from
//     rfc-editor.org): RFC 7422 section 2.3's whole fourteen-row table and its
//     two reverse lookups, RFC 7422 section 3's configuration record, RFC 7597
//     Appendix A's port set for PSID 0x34 and Appendix B.2's two examples;
//   * "computed" - the number is not printed anywhere; it is computed from
//     the rule named in the vector (and was checked by hand and in Python on
//     2026-10-19 before being pinned).
// Reject vectors pin the stable error codes. verifyVectors() runs the set
// and returns { setId, total, passed, failures }.
// ============================================================================

import { run, CgnPortBlocksError, type CgnErrorCode } from "./compute";

/** The dated id of this vector set (scripts/api-sync.json records it). */
export const GOLDEN_VECTOR_SET_ID = "cgn-port-blocks/2026-10-19a";

/** An accept vector: a request and the values its answer must carry, by dot path. */
export interface AcceptVector {
  id: string; // a stable name
  source: string; // the document (section) or the rule behind the expected values
  input: string; // the request, as the API receives it
  expect: Record<string, unknown>; // dot path -> exact value (compared as JSON)
} // AcceptVector

/** A reject vector: a request and the error code it must raise. */
export interface RejectVector {
  id: string; // a stable name
  input: string; // the request
  code: CgnErrorCode; // the expected code
} // RejectVector

/** The RFC 7422 section 2.3 configuration, reused by several vectors. */
const RFC7422 = { mode: "deterministic", inside: "198.51.100.0/28", outside: "192.0.2.1", dynamicFactor: 2, maxPorts: 5040 }; // I, O, D, M as the RFC sets them

/** JSON text of a request object. */
const j = (o: unknown): string => JSON.stringify(o); // the API body

export const GOLDEN_VECTORS: readonly AcceptVector[] = Object.freeze([
  // ---- Deterministic mapping: RFC 7422's own numbers -------------------------
  {
    id: "det-rfc7422-table", // the whole table of section 2.3
    source: "RFC 7422 section 2.3: (65536-1024)/16 = 4032 ports per inside address, the fourteen-row table, dynamic range 57472-65535, M = 5040 (so 1008 more ports from the dynamic pool)",
    input: j(RFC7422), // the RFC's configuration
    expect: {
      compressionRatio: 14, totalRatio: 16, candidatePorts: 64512, portsPerSubscriber: 4032, dynamicPoolPorts: 8064, // section 2.3's arithmetic
      dynamicRanges: [{ first: 57472, last: 65535 }], // "The dynamic port range thus contains ports 57472-65535"
      overflowPortsPerUser: 1008, // "allocates up to an additional 1008 ports"
      "table.rows.0": { inside: "198.51.100.1", outside: "192.0.2.1", ranges: [{ first: 1024, last: 5055 }], ports: 4032 }, // row 1
      "table.rows.1.ranges": [{ first: 5056, last: 9087 }], // row 2
      "table.rows.2.ranges": [{ first: 9088, last: 13119 }], // row 3
      "table.rows.3.ranges": [{ first: 13120, last: 17151 }], // row 4
      "table.rows.4.ranges": [{ first: 17152, last: 21183 }], // row 5
      "table.rows.5.ranges": [{ first: 21184, last: 25215 }], // row 6
      "table.rows.6.ranges": [{ first: 25216, last: 29247 }], // row 7
      "table.rows.7.ranges": [{ first: 29248, last: 33279 }], // row 8
      "table.rows.8.ranges": [{ first: 33280, last: 37311 }], // row 9
      "table.rows.9.ranges": [{ first: 37312, last: 41343 }], // row 10
      "table.rows.10.ranges": [{ first: 41344, last: 45375 }], // row 11
      "table.rows.11.ranges": [{ first: 45376, last: 49407 }], // row 12
      "table.rows.12.ranges": [{ first: 49408, last: 53439 }], // row 13
      "table.rows.13": { inside: "198.51.100.14", outside: "192.0.2.1", ranges: [{ first: 53440, last: 57471 }], ports: 4032 }, // row 14
      "table.reservedRanges": [{ first: 0, last: 1023 }], // "Reserved | 192.0.2.1:0-1023"
      translationLogging: "dynamic-blocks-only", // D > 0: step 4's MUST log
    },
  },
  {
    id: "det-rfc7422-reverse-2001", // the first abuse report of section 2.3
    source: "RFC 7422 section 2.3: a report for 192.0.2.1, port 2001 reverses to subscriber 1 (198.51.100.1) without the CGN logs",
    input: j({ ...RFC7422, reverse: { address: "192.0.2.1", port: 2001, time: "2026-10-19T14:32:52Z" } }), // the report
    expect: { "reverse.status": "deterministic", "reverse.inside": "198.51.100.1", "reverse.blockRanges": [{ first: 1024, last: 5055 }], "reverse.time": "2026-10-19T14:32:52Z", "reverse.timeInWindow": null },
  },
  {
    id: "det-rfc7422-reverse-58204", // the second abuse report of section 2.3
    source: "RFC 7422 section 2.3: port 58204 is within the dynamic pool range, so the operator consults the log file",
    input: j({ ...RFC7422, reverse: { address: "192.0.2.1", port: 58204 } }), // the report
    expect: { "reverse.status": "dynamic", "reverse.inside": null, "reverse.blockRanges": [{ first: 57472, last: 65535 }] },
  },
  {
    id: "det-rfc7422-forward-2", // function 1 for subscriber 2
    source: "RFC 7422 section 2.3: 198.51.100.2 maps to 192.0.2.1 ports 5056-9087",
    input: j({ ...RFC7422, lookup: "198.51.100.2" }), // the forward question
    expect: { forward: { inside: "198.51.100.2", status: "mapped", outside: "192.0.2.1", ranges: [{ first: 5056, last: 9087 }], ports: 4032 } },
  },
  {
    id: "det-rfc7422-record", // the configuration record of section 3
    source: "RFC 7422 section 3: the example record [Wed Oct 11 14:32:52 2000]:198.51.100.0:28:192.0.2.0:32:2:5040:0:1-1023,5004,5060 (the RFC's closing full stop is sentence punctuation); weekday computed for 2000-10-11",
    input: j({ mode: "deterministic", inside: "198.51.100.0/28", outside: "192.0.2.0/32", reserved: "1-1023,5004,5060", dynamicFactor: 2, maxPorts: 5040, recordTime: "2000-10-11T14:32:52Z" }), // the record's fields
    expect: { configRecord: "[Wed Oct 11 14:32:52 2000]:198.51.100.0:28:192.0.2.0:32:2:5040:0:1-1023,5004,5060", "reserved.systemPortsReserved": false, configRecordMissing: [] },
  },
  {
    id: "det-reserved-port", // a port below 1024
    source: "computed: RFC 7422 section 2 step 1 removes R (0-1023 here) from the candidate list, so port 1000 belongs to no subscriber",
    input: j({ ...RFC7422, reverse: { address: "192.0.2.1", port: 1000 } }), // a reserved port
    expect: { "reverse.status": "reserved", "reverse.inside": null },
  },
  {
    id: "det-two-outside", // the multi-address extension
    source: "computed: RFC 7422 section 2 steps 1 and 2 (64512 candidates, C = ceil(30/2) = 15, D = 0, 64512/15 = 4300 per address, 12 left over), Sequential filling the outside addresses in order",
    input: j({ mode: "deterministic", inside: "198.51.100.0/27", outside: "192.0.2.1-192.0.2.2", reverse: { address: "192.0.2.2", port: 1024 } }), // 30 inside, 2 outside
    expect: { compressionRatio: 15, portsPerSubscriber: 4300, dynamicPoolPorts: 12, dynamicDisabledButLeftover: true, translationLogging: "none", unusedSlots: 0, "reverse.status": "deterministic", "reverse.inside": "198.51.100.16", "reverse.blockRanges": [{ first: 1024, last: 5323 }] },
  },
  {
    id: "det-time-window", // a report outside the configuration's lifetime
    source: "computed: RFC 7422 section 3 (identification needs the configuration in force at the time); the timestamp precedes configFrom",
    input: j({ ...RFC7422, configFrom: "2026-01-01T00:00:00Z", reverse: { address: "192.0.2.1", port: 2001, time: "2025-12-31T23:59:59Z" } }), // before the window
    expect: { "reverse.status": "deterministic", "reverse.timeInWindow": false },
  },
  {
    id: "det-reserved-holes", // reserved ports inside a block
    source: "computed: RFC 7422 section 2 step 1 with R = 0-1023,5004,5060; 64510 candidates / 16 = 4031 per inside address, block 1 split around 5004 and block 2 around 5060 (checked independently in Python)",
    input: j({ mode: "deterministic", inside: "198.51.100.0/28", outside: "192.0.2.1", reserved: "0-1023,5004,5060", dynamicFactor: 2, lookup: "198.51.100.2" }), // two extra reserved ports
    expect: { candidatePorts: 64510, portsPerSubscriber: 4031, "forward.ranges": [{ first: 5056, last: 5059 }, { first: 5061, last: 9087 }], "forward.ports": 4031, "table.rows.0.ranges": [{ first: 1024, last: 5003 }, { first: 5005, last: 5055 }] },
  },
  // ---- Port blocks: RFC 7768 and RFC 7422 arithmetic --------------------------
  {
    id: "blocks-rfc7422-sixteen", // section 2.3's division seen as blocks
    source: "RFC 7422 section 2.3: (65536-1024)/16 = 4032, so 4032-port blocks give 16 per address with nothing left over",
    input: j({ mode: "blocks", pool: "192.0.2.1", blockSize: 4032 }), // one address
    expect: { "portRange.ports": 64512, blocksPerAddress: 16, leftoverPortsPerAddress: 0, subscribersPerAddress: 16, poolSubscribers: 16 },
  },
  {
    id: "blocks-rfc7768-300", // the block of RFC 7768 section 2
    source: "computed: RFC 7768 section 2's example block 2001~2300 holds 300 ports; 64512/300 = 215 blocks, 12 ports over; log lines divided by the block size (RFC 7768 section 2)",
    input: j({ mode: "blocks", pool: "192.0.2.0/24", blockSize: 300 }), // a /24 pool
    expect: { "pool.addresses": 256, blocksPerAddress: 215, leftoverPortsPerAddress: 12, subscribersPerAddress: 215, poolSubscribers: 55040, "log.reductionFactor": 300, "log.blockLinesPerSubscriberDay": 110 },
  },
  {
    id: "blocks-log-nat444", // the per-session baseline of RFC 7422 section 1
    source: "RFC 7422 section 1: 150-byte NAT444 messages and 33,000 connections per day (approximately 5 MB per subscriber per day); computed 33,000 x 150 = 4,950,000 bytes",
    input: j({ mode: "blocks", pool: 1, blockSize: 512, blocksPerSubscriber: 2, subscribers: 100 }), // a count pool
    expect: { "log.perSessionBytesPerSubscriberDay": 4950000, "log.perSessionBytesPerDayAll": 495000000, "log.blockBytesPerSubscriberDay": 9667.97, "demand.addressesNeeded": 2, "demand.fits": false, subscribersPerAddress: 63, portsPerSubscriber: 1024 },
  },
  {
    id: "blocks-log-dslite", // the DS-Lite message size
    source: "RFC 7422 section 1: 175-byte DS-Lite messages; computed 33,000 x 175 = 5,775,000 bytes per subscriber per day",
    input: j({ mode: "blocks", pool: "203.0.113.0/28", blockSize: 1024, logFormat: "ds-lite", inside: "100.64.0.0/22" }), // a /22 inside
    expect: { "log.messageBytes": 175, "log.perSessionBytesPerSubscriberDay": 5775000, "demand.subscribers": 1022, "demand.source": "inside", "demand.addressesNeeded": 17, "demand.fits": false, blocksPerAddress: 63 },
  },
  {
    id: "blocks-custom-range", // a pool that keeps the System Ports
    source: "computed: a usable range of 0-65535 holds 65536 ports, 64 blocks of 1024; the System Ports are not excluded",
    input: j({ mode: "blocks", pool: "192.0.2.0/30", portRange: "0-65535", blockSize: 1024, blocksPerSubscriber: 4 }), // the whole port space
    expect: { "portRange.systemPortsExcluded": false, blocksPerAddress: 64, subscribersPerAddress: 16, poolSubscribers: 64, poolPorts: 262144 },
  },
  // ---- MAP port sets: RFC 7597's own examples ----------------------------------
  {
    id: "map-rfc7597-psid-0x34", // Appendix A, Examples 1 and 5 (and RFC 7599 Appendix A, Example 1)
    source: "RFC 7597 Appendix A Examples 1 and 5: PSID offset 6, PSID length 8, PSID 0x34, available ports (63 ranges) 1232-1235, 2256-2259, ..., 63696-63699, 64720-64723; ports per set 2^(16-8) - 2^2 = 252 (section 5.1 formula, computed)",
    input: j({ mode: "map", offset: 6, psidLength: 8, psid: "0x34" }), // the RFC's rule
    expect: { m: 2, sharingRatio: 256, portsPerSet: 252, "portSet.rangeCount": 63, "portSet.ranges.0": { first: 1232, last: 1235 }, "portSet.ranges.1": { first: 2256, last: 2259 }, "portSet.ranges.61": { first: 63696, last: 63699 }, "portSet.ranges.62": { first: 64720, last: 64723 }, "portSet.psidHex": "0x34", excludedLow: { first: 0, last: 1023 }, systemPortsExcluded: true },
  },
  {
    id: "map-rfc7597-reverse-1232", // Appendix A, Example 2
    source: "RFC 7597 Appendix A Example 2: PSID length 8, 'PSID: 0x34 (1232)'",
    input: j({ mode: "map", offset: 6, psidLength: 8, port: 1232 }), // the BR's destination port
    expect: { reverse: { port: 1232, excluded: false, psid: 52, psidHex: "0x34", aValue: 1, j: 0 } },
  },
  {
    id: "map-rfc7597-b2-example1", // Appendix B.2, Example 1
    source: "RFC 7597 Appendix B.2 Example 1: R = 256, PSID = 0, a = 6, k = 8: available ports (63 ranges) 1024-1027, 2048-2051, ..., 63488-63491, 64512-64515",
    input: j({ mode: "map", offset: 6, psidLength: 8, psid: 0 }), // PSID 0
    expect: { "portSet.rangeCount": 63, "portSet.ranges.0": { first: 1024, last: 1027 }, "portSet.ranges.1": { first: 2048, last: 2051 }, "portSet.ranges.61": { first: 63488, last: 63491 }, "portSet.lastRange": { first: 64512, last: 64515 } },
  },
  {
    id: "map-rfc7597-b2-example2", // Appendix B.2, Example 2
    source: "RFC 7597 Appendix B.2 Example 2: R = 64, PSID = 0, a = 0, k = 6, no port exclusion: available ports (1 range) 0-1023",
    input: j({ mode: "map", offset: 0, psidLength: 6, psid: 0 }), // a = 0
    expect: { "portSet.rangeCount": 1, "portSet.ranges": [{ first: 0, last: 1023 }], portsPerSet: 1024, excludedLow: null, "portSet.includesSystemPorts": true, minPsidAvoidingSystemPorts: 1 },
  },
  {
    id: "map-offset-4", // section 5.1's a = 4 sentence
    source: "RFC 7597 section 5.1: \"'a' = 4 will exclude ports 0-4095\"; interval 2^(16-4) = 4096 (section 5.1 formula, computed)",
    input: j({ mode: "map", offset: 4, psidLength: 6, psid: 1 }), // a = 4
    expect: { excludedLow: { first: 0, last: 4095 }, interval: 4096, m: 6, "portSet.rangeCount": 15, "portSet.firstRange": { first: 4160, last: 4223 }, portsPerSet: 960 },
  },
  {
    id: "map-reverse-excluded", // a port in the A = 0 block
    source: "computed: RFC 7597 section 5.1 ('For 'a' > 0, A MUST be larger than 0'): with a = 6, port 80 has A = 0 and belongs to no CE",
    input: j({ mode: "map", offset: 6, psidLength: 8, port: 80 }), // a System Port
    expect: { reverse: { port: 80, excluded: true, psid: null, psidHex: null, aValue: 0, j: 0 } },
  },
  {
    id: "map-no-sharing", // k = 0
    source: "computed: RFC 7597 section 5.1 with k = 0 (sharing ratio 2^0 = 1): 2^16 - 2^10 = 64512 ports, every port but the System Ports",
    input: j({ mode: "map", offset: 6, psidLength: 0, psid: 0 }), // no sharing
    expect: { sharingRatio: 1, portsPerSet: 64512, "portSet.rangeCount": 63, "portSet.firstRange": { first: 1024, last: 2047 } },
  },
]);

export const REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "not-json", input: "map 6 8", code: "json" }, // not a JSON object
  { id: "unknown-mode", input: j({ mode: "nat" }), code: "mode" }, // no such mode
  { id: "map-too-many-bits", input: j({ mode: "map", offset: 10, psidLength: 8 }), code: "map-bits" }, // a + k = 18
  { id: "psid-too-big", input: j({ mode: "map", offset: 6, psidLength: 8, psid: 256 }), code: "psid" }, // 2^8 values only
  { id: "port-too-big", input: j({ mode: "map", offset: 6, psidLength: 8, port: 65536 }), code: "port" }, // 16 bits only
  { id: "block-too-big", input: j({ mode: "blocks", pool: "192.0.2.1", blockSize: 64513 }), code: "block-size" }, // larger than 1024-65535
  { id: "blocks-do-not-fit", input: j({ mode: "blocks", pool: "192.0.2.1", blockSize: 32768, blocksPerSubscriber: 2 }), code: "blocks-per-subscriber" }, // one block per address
  { id: "no-block-size", input: j({ mode: "blocks", pool: "192.0.2.1" }), code: "field" }, // blockSize is required
  { id: "bad-address", input: j({ mode: "blocks", pool: "300.1.1.1", blockSize: 512 }), code: "address" }, // octet above 255
  { id: "bad-prefix", input: j({ mode: "blocks", pool: "192.0.2.0/33", blockSize: 512 }), code: "prefix" }, // length above 32
  { id: "ratio-too-small", input: j({ ...RFC7422, compressionRatio: 10 }), code: "ratio" }, // 10 blocks for 14 subscribers
  { id: "no-ports-left", input: j({ ...RFC7422, dynamicFactor: 65536 }), code: "no-ports" }, // C + D above 64512
  { id: "bad-reserved", input: j({ ...RFC7422, reserved: "low" }), code: "reserved" }, // not a port list
  { id: "bad-time", input: j({ ...RFC7422, reverse: { address: "192.0.2.1", port: 2001, time: "2026-02-31T00:00:00Z" } }), code: "time" }, // 31 February
  { id: "backwards-window", input: j({ ...RFC7422, configFrom: "2026-10-19T00:00:00Z", configUntil: "2026-10-18T00:00:00Z" }), code: "window" }, // ends first
]);

/** Read a dot path ("table.rows.0.ranges") from a result. */
function at(value: unknown, path: string): unknown {
  let cur: unknown = value; // the walk
  for (const key of path.split(".")) { // each step
    if (cur === null || typeof cur !== "object") return undefined; // nothing deeper
    cur = (cur as Record<string, unknown>)[key]; // one step (array indices are keys too)
  } // steps
  return cur; // the value found
} // at

/** Run every vector; collect failures rather than stopping at the first. */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every mismatch
  for (const v of GOLDEN_VECTORS) { // each accept vector
    try {
      const result = JSON.parse(JSON.stringify(run(v.input))); // through JSON, as the API serialises it
      for (const [path, want] of Object.entries(v.expect)) { // each expectation
        const got = at(result, path); // the value
        if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`[${v.id}] ${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); // mismatch
      } // expectations
    } catch (e) {
      failures.push(`[${v.id}] threw ${(e as Error).message}`); // an accept vector must not throw
    } // ran
  } // accept vectors
  for (const v of REJECT_VECTORS) { // each reject vector
    try {
      run(v.input); // should throw
      failures.push(`[${v.id}] expected "${v.code}", but the request was accepted`); // it did not
    } catch (e) {
      if (!(e instanceof CgnPortBlocksError) || e.code !== v.code) failures.push(`[${v.id}] expected "${v.code}", got ${e instanceof CgnPortBlocksError ? e.code : (e as Error).message}`); // wrong code
    } // ran
  } // reject vectors
  const total = GOLDEN_VECTORS.length + REJECT_VECTORS.length; // every vector
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - new Set(failures.map((f) => f.slice(1, f.indexOf("]")))).size, failures }; // the report
} // verifyVectors
