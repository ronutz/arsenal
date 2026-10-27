// ============================================================================
// src/lib/share/cases/ipv6.ts
// ----------------------------------------------------------------------------
// Share cases of the IPv6 toolkit: the address field goes as typed, alone.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { IPV6_SHARE } from "../../tools/ipv6/share"; // the spec

/** The cases. */
export const IPV6_SHARE_CASES = defineShareCases(Object.freeze({
  spec: IPV6_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "2001:db8:0:0:8:800:200c:417a" }, params: { input: "2001:db8:0:0:8:800:200c:417a" }, restored: { input: "2001:db8:0:0:8:800:200c:417a" } }, // the page's Example (RFC 3849 documentation range)
    { id: "prefix", state: { input: "2001:db8::/32" }, params: { input: "2001:db8::/32" }, restored: { input: "2001:db8::/32" } }, // a prefix: "/" travels encoded
    { id: "as-typed-spaces", state: { input: " ff02::1 " }, params: { input: " ff02::1 " }, restored: { input: " ff02::1 " } }, // as typed, spaces included
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
    { id: "white-space", state: { input: "  " } }, // only spaces
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "   " } }, // only spaces: nothing to fill
  ],
}));
