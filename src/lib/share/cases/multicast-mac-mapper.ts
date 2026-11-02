// ============================================================================
// src/lib/share/cases/multicast-mac-mapper.ts
// ----------------------------------------------------------------------------
// Share cases of the multicast group <-> MAC mapper (02/11/2026): the field goes
// as typed, alone, and only while the engine reads it. Values are golden-vector
// inputs: the page's Example (example-233-252-0-1), a MAC in Cisco dot notation
// (rev-lab-dot), an IPv6 group with a zone index (v6-zone) and the field with
// spaces (spaces-trimmed); the empty states are a blank field and two inputs
// the engine refuses (a unicast address, a MAC from the upper half of 01-00-5E).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { MULTICAST_MAC_SHARE, type MulticastMacShareState } from "../../tools/multicast-mac-mapper/share"; // the spec

/** The cases. */
export const MULTICAST_MAC_MAPPER_SHARE_CASES = defineShareCases<MulticastMacShareState, MulticastMacShareState>({
  spec: MULTICAST_MAC_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "233.252.0.1" }, params: { input: "233.252.0.1" }, restored: { input: "233.252.0.1" } }, // the page's Example
    { id: "mac-dot", state: { input: "0100.5e01.0101" }, params: { input: "0100.5e01.0101" }, restored: { input: "0100.5e01.0101" } }, // a MAC in Cisco dot notation
    { id: "ipv6-zone", state: { input: "ff02::1%eth0" }, params: { input: "ff02::1%eth0" }, restored: { input: "ff02::1%eth0" } }, // "%" and ":" travel encoded
    { id: "as-typed-spaces", state: { input: "  239.1.1.1  " }, params: { input: "  239.1.1.1  " }, restored: { input: "  239.1.1.1  " } }, // as typed, spaces included
  ],
  arrive: [ // decode-only arrivals
    { id: "refused-text-still-fills", values: { input: "10.0.0.1" }, restored: { input: "10.0.0.1" } }, // left to the engine, which refuses it on the page as a paste would be
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "blank", state: { input: "" } }, // a blank field
    { id: "white-space", state: { input: "   " } }, // only spaces
    { id: "unicast-refused", state: { input: "10.0.0.1" } }, // the engine refuses it: no reading, no link
    { id: "upper-half-refused", state: { input: "01:00:5e:80:00:00" } }, // IANA's MPLS row: refused
  ],
  blocked: [],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "   " } }, // only spaces
    { id: "two-lines", values: { input: "239.1.1.1\n239.1.1.2" } }, // one address on one line
    { id: "too-long", values: { input: "1".repeat(81) } }, // over the engine's bound
  ],
});
