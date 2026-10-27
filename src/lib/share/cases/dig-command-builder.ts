// ============================================================================
// src/lib/share/cases/dig-command-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the dig command builder: the form goes field by field, the
// name to look up as #input=, switches as 1, choices by id; posture
// input-caution. A choice the form does not offer, a switch other than 1 or
// 0, or a value longer than its field makes the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { DIG_COMMAND_BUILDER_SHARE } from "../../tools/dig-command-builder/share"; // the spec
import { VECTORS } from "../../tools/dig-command-builder/golden-vectors"; // the tool's own vectors
import type { DigInput } from "../../tools/dig-command-builder"; // the form's shape

/** The page's Example: golden vector example-mx-dnssec ({ name, server, type MX, dnssec, multiline }). */
const EXAMPLE = (VECTORS.find((v) => v.id === "example-mx-dnssec")?.input ?? {}) as DigInput; // verbatim

/** A form using every kind of field: DNS over HTTPS with an endpoint, a source, EDNS options, timing and a key file. */
const FULL: DigInput = { name: "_443._tcp.www.example.com", type: "TLSA", klass: "IN", server: "2001:db8::53", port: "8443", ipv: "6", source: "2001:db8::10#5300", transport: "https", httpsEndpoint: "/dns-query?dns", bufsize: "1232", subnet: "198.51.100.0/24", nsid: true, timeout: "2", tries: "1", retry: "0", output: "short", identify: true, keyfile: "/etc/dig/key.conf", norc: true }; // every kind

/** The cases. */
export const DIG_COMMAND_BUILDER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<DigInput, DigInput>>({ // typed, so cases carrying different values check as one list
  spec: DIG_COMMAND_BUILDER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: EXAMPLE, params: { input: "example.com", server: "192.0.2.53", type: "MX", dnssec: "1", multiline: "1" }, restored: EXAMPLE }, // the page's Example
    { id: "reverse", state: { reverse: "192.0.2.1", trace: false, ipv: "" as const }, params: { reverse: "192.0.2.1" }, restored: { reverse: "192.0.2.1" } }, // -x alone: off switches and "any family" are not carried
    { id: "full", state: FULL, params: { input: "_443._tcp.www.example.com", type: "TLSA", class: "IN", server: "2001:db8::53", port: "8443", ipv: "6", source: "2001:db8::10#5300", transport: "https", endpoint: "/dns-query?dns", bufsize: "1232", subnet: "198.51.100.0/24", nsid: "1", timeout: "2", tries: "1", retry: "0", output: "short", identify: "1", keyfile: "/etc/dig/key.conf", norc: "1" }, restored: FULL }, // "#", "?", "/" and ":" inside values
  ],
  arrive: [ // decode only: defaults of absent optional values
    { id: "switch-off", values: { input: "example.com", trace: "0" }, restored: { name: "example.com" } }, // a switch sent as 0 is off
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: {} }, // the Clear state
    { id: "only-off", state: { trace: false, name: "", ipv: "" as const } }, // nothing set
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-transport", values: { input: "example.com", transport: "quic" } }, // not offered
    { id: "unknown-class", values: { input: "example.com", class: "ANY" } }, // not offered
    { id: "unknown-output", values: { input: "example.com", output: "json" } }, // not offered
    { id: "unknown-family", values: { input: "example.com", ipv: "5" } }, // not -4 or -6
    { id: "switch-not-binary", values: { input: "example.com", dnssec: "yes" } }, // a switch is 1 or 0
    { id: "name-too-long", values: { input: "a".repeat(301) } }, // past the field's 300 characters
    { id: "port-too-long", values: { input: "example.com", port: "853853" } }, // past the field's 5 characters
    { id: "only-off-switch", values: { trace: "0" } }, // nothing to fill
  ],
}));
