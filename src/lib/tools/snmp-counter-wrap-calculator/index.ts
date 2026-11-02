// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/snmp-counter-wrap-calculator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the SNMP interface counter
// wrap and rate calculator (02/11/2026). Every source below was downloaded
// with curl on 2026-11-02 (generic User-Agent, no-cache headers, a
// cache-busting query) and answered HTTP 200; the files and the log are in the
// build's work folder. The RFC Editor's index (rfc-index.xml, read the same
// day) gives each RFC's current status: RFC 2578, 2579 and 3418 are Internet
// Standards (STD 58, STD 58, STD 62), RFC 2863 is a Draft Standard updated by
// RFC 8892 (interface-type registration only), RFC 2544 is Informational,
// updated by RFC 6201, 6815 and 9004; none is obsoleted. The Net-SNMP pages and
// the 5.9.4 source file behind the pasted-line forms (02/11/2026) were read the
// same way the same day.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, COUNTER_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, wrapLocalisable, rateLocalisable, parseSpeed, decimalText, SnmpCounterInputError, SPEED_PRESETS, DEFAULT_PACKET_OCTETS, MAX_FIELD, MAX_TICKS, RFC2863_OCTETS_THRESHOLD, RFC2863_PACKETS_THRESHOLD } from "./compute"; // values
export type { CounterWidth, CounterKind, TimeUnit, WrapRequest, RateRequest, CounterRequest, Rfc2863Band, Rfc2863Reading, PollVerdict, WrapResult, RateVerdict, RateResult, CounterResult } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, COUNTER_VECTORS, EXAMPLE_WRAP_REQUEST, EXAMPLE_RATE_REQUEST, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { CounterVector, VerifyReport } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the SNMP interface counter wrap and rate calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "snmp-counter-wrap-calculator", // the route segment and API path
  canonicalAliases: [
    "snmp counter wrap", // the obvious search
    "counter32 wrap time", // the 32-bit question
    "counter64", // the fix
    "snmp polling interval", // the operational question
    "ifHCInOctets rate", // the counter people poll
    "snmp interface utilisation", // the number people want
  ],
  inputDetectors: [
    {
      // A form, not a paste: nothing to detect in free text. The example is the page's wrap Example as an API body.
      kind: "structured-form",
      pattern: "mode (wrap | rate) + width + kind + speed / readings",
      priority: 1,
      example: '{"mode":"wrap","width":32,"kind":"octets","speed":"10 Gb/s","utilisation":"40","poll":"300"}', // golden vector example-10g-40pct-300s-c32
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // arithmetic only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: COUNTER_VECTORS.length, // 105: 28 presets and 77 others (20 of them, set "b", for pasted snmpget lines)
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // every field at most 144 characters (the longest documented snmpget line for an IF-MIB counter is 135), counter values at most 20 digits
    "bigint-exact", // 2^64 does not fit a double: every quantity is an exact rational of BigInts
    "unsafe-json-number-refused", // a JSON number past 2^53 has lost digits, so the API asks for a string
    "share-input", // Share results (2026-11-02) builds a link only when pressed, carrying the mode and its fields as typed after the #
  ],
  shareSafetyDefault: "param", // interface speeds, percentages, intervals, counter values and times name nothing about the reader

  // -- Teaching & provenance --
  learnLinks: ["learn/snmp-on-network-devices"], // the article whose "Counters need care" paragraph this tool computes
  sources: [
    {
      id: "rfc2578", // SMIv2
      label: "RFC 2578, Structure of Management Information Version 2 (SMIv2), April 1999 (STD 58): sections 7.1.6 Counter32, 7.1.8 TimeTicks and 7.1.10 Counter64", // what the engine applies
      type: "standard", // Internet Standard
      url: "https://www.rfc-editor.org/rfc/rfc2578.txt", // fetched 2026-11-02, HTTP 200; errata page: "No matching errata found."
      access_date: "2026-11-02", // read the day the tool was built
      scope: "a counter's maximum 2^32-1 or 2^64-1 and its wrap to zero; no defined initial value, so a single value has no information content; discontinuities at re-initialisation; TimeTicks modulo 2^32 in hundredths of a second", // what it pins
      status: "active", // Internet Standard, STD 58; not obsoleted or updated
    },
    {
      id: "rfc2863", // IF-MIB
      label: "RFC 2863, The Interfaces Group MIB, June 2000: section 3.1.6 Counter Size, the counter objects, ifSpeed, ifHighSpeed and ifCounterDiscontinuityTime", // what the engine applies
      type: "standard", // Draft Standard
      url: "https://www.rfc-editor.org/rfc/rfc2863.txt", // fetched 2026-11-02, HTTP 200; errata: one verified (4820, ifSpeed's range), none on counters
      access_date: "2026-11-02", // read the day the tool was built
      scope: "the 20,000,000 and 650,000,000 bit/s thresholds for 64-bit octet and packet counters, quoted exactly; the section's own wrap times; ifInOctets and ifHCInOctets; discontinuities indicated by ifCounterDiscontinuityTime", // what it pins
      status: "active", // Draft Standard, updated by RFC 8892 (interface-type registration only); not obsoleted
    },
    {
      id: "rfc3418", // SNMPv2-MIB
      label: "RFC 3418, Management Information Base (MIB) for the Simple Network Management Protocol (SNMP), December 2002 (STD 62): sysUpTime", // what the engine applies
      type: "standard", // Internet Standard
      url: "https://www.rfc-editor.org/rfc/rfc3418.txt", // fetched 2026-11-02, HTTP 200; errata: 276 (verified, a reference heading) and 6219 (rejected), neither on sysUpTime
      access_date: "2026-11-02", // read the day the tool was built
      scope: "sysUpTime: hundredths of a second since the network management portion of the system was last re-initialized", // what it pins
      status: "active", // Internet Standard, STD 62
    },
    {
      id: "rfc2579", // SMIv2 textual conventions
      label: "RFC 2579, Textual Conventions for SMIv2, April 1999 (STD 58): TimeStamp", // what the engine applies
      type: "standard", // Internet Standard
      url: "https://www.rfc-editor.org/rfc/rfc2579.txt", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the tool was built
      scope: "sysUpTime reaches 2^32-1 after approximately 497 days without a re-initialisation and goes round to zero; a reset of sysUpTime resets every TimeStamp, such as ifCounterDiscontinuityTime", // what it pins
      status: "active", // Internet Standard, STD 58
    },
    {
      id: "rfc2544", // the Ethernet frame on the wire
      label: "RFC 2544, Benchmarking Methodology for Network Interconnect Devices, March 1999: Appendix B, Maximum frame rates reference", // what the engine applies
      type: "rfc", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc2544.txt", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the tool was built
      scope: "an Ethernet frame of N octets takes a 64-bit preamble, 8 x N bits and a 96-bit gap: 84 octets of line time for the smallest, 64-octet frame (14880 frames/s at 10 Mb/s), the default packet size for packet counters", // what it pins
      status: "active", // Informational, updated by RFC 6201, 6815 and 9004; not obsoleted
    },
    {
      id: "netsnmp-snmpget-tutorial", // the default output line, as the project's tutorial prints it
      label: "Net-SNMP Wiki, TUT:snmpget", // the project's own tutorial page
      type: "vendor-doc", // first-party documentation of Net-SNMP
      url: "https://www.net-snmp.org/wiki/index.php/TUT:snmpget", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the paste forms were added
      scope: "snmpget's default output line, '<MIB>::<object>.<index> = <Type>: <value>', with sysUpTime printed as 'Timeticks: (<ticks>) <days>, <h:mm:ss.cc>'; the SNMPv2c 'No Such Instance currently exists' answer", // what it pins
      status: "active", // the project's current wiki
    },
    {
      id: "netsnmp-snmpcmd", // the -O output options
      label: "Net-SNMP, snmpcmd(1) manual page: OUTPUT OPTIONS", // the options every Net-SNMP command shares
      type: "vendor-doc", // first-party documentation of Net-SNMP
      url: "https://www.net-snmp.org/docs/man/snmpcmd.html", // fetched 2026-11-02, HTTP 200
      access_date: "2026-11-02", // read the day the paste forms were added
      scope: "-On numeric OIDs, -Of full OIDs, -Os and -OS short names, -Ov the value only, -OQ without the type, -Oq without '=' and type (not read), -Ot TimeTicks as raw numbers", // what it pins
      status: "active", // the project's current manual pages
    },
    {
      id: "netsnmp-mib-c", // the type labels the printers write
      label: "Net-SNMP 5.9.4 source, snmplib/mib.c (the value printers)", // the code that prints each type
      type: "vendor-doc", // the project's own source, at its current release tag
      url: "https://raw.githubusercontent.com/net-snmp/net-snmp/v5.9.4/snmplib/mib.c", // fetched 2026-11-02, HTTP 200; 5.9.4 is the release net-snmp.org names as current
      access_date: "2026-11-02", // read the day the paste forms were added
      scope: "the labels 'Counter32: ', 'Counter64: ', 'Timeticks: (<ticks>) ', 'Gauge32: ', 'INTEGER: ', 'STRING: ', 'Hex-STRING: ', 'OID: ', 'IpAddress: ', 'BITS: ', 'NsapAddress: ', 'Opaque: ', 'UInt64: ', 'Int64: '; -Ot prints the ticks alone", // what it pins
      status: "active", // the current release
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = COUNTER_VECTORS; // every vector
