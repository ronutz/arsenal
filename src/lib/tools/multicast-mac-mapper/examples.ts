// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/multicast-mac-mapper/examples.ts
// ----------------------------------------------------------------------------
// The page's Example (D-83) and its sample chips, in one small module that both
// the golden vectors (which pin each of them: example-233-252-0-1,
// course-lab-239-1-1-1, ff05-101, rev-igmp-hyphen, rev-v6-solicited-dot) and
// the component import, so the buttons can never drift from the vectors and
// the page does not carry the vector set.
// ============================================================================

/** The Example: the Learn article's worked group, 233.252.0.1, in MCAST-TEST-NET (RFC 6676, section 2). */
export const EXAMPLE_INPUT = "233.252.0.1"; // -> 01-00-5E-7C-00-01, lost bits 10011

/** Samples, one per kind of reading: the course lab's group, an IPv6 group, an IPv4 MAC and an IPv6 MAC. */
export const SAMPLE_INPUTS: readonly string[] = Object.freeze([
  "239.1.1.1", // the course's lab group (chapter 4.7)
  "ff05::101", // the article's IPv6 pair (with ff02::101)
  "01-00-5E-00-00-16", // the article's captured IGMPv3 report destination (224.0.0.22)
  "3333.ff0e.8c6c", // RFC 4291's solicited-node example, in Cisco dot notation
]); // four chips
