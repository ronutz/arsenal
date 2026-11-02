// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/snmp-counter-wrap-calculator/examples.ts
// ----------------------------------------------------------------------------
// The page's two Examples (D-83), in one small module that both the golden
// vectors (which pin their readings: example-10g-40pct-300s-c32 and
// rate-example-sysuptime-c64) and the component (whose Example button fills
// them) import, so the button can never drift from the vectors and the page
// does not carry the whole vector set.
// ============================================================================

/** The wrap Example: a 10 Gb/s port at 40 % polled every 300 s with Counter32 octets, which wraps between polls. */
export const EXAMPLE_WRAP_REQUEST = Object.freeze({ mode: "wrap", width: "32", kind: "octets", speed: "10 Gb/s", utilisation: "40", poll: "300" } as const); // about 35 wraps per poll

/** The rate Example: two ifHCInOctets (Counter64) readings 30000 sysUpTime ticks (300 s) apart on a 10 Gb/s port. */
export const EXAMPLE_RATE_REQUEST = Object.freeze({ mode: "rate", width: "64", kind: "octets", first: "9876543210123", second: "10026543210123", firstTime: "123456700", secondTime: "123486700", timeUnit: "ticks", speed: "10 Gb/s" } as const); // 4 Gb/s, 40 %
