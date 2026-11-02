// ============================================================================
// src/lib/share/cases/snmp-counter-wrap-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the SNMP interface counter wrap and rate calculator
// (02/11/2026): a form, the mode's fields as typed, nothing of the other mode,
// a packet size only with packets. Values are the page's two Examples (golden
// vectors example-10g-40pct-300s-c32 and rate-example-sysuptime-c64) and other
// golden-vector shapes.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SNMP_COUNTER_SHARE, type SnmpCounterShareState } from "../../tools/snmp-counter-wrap-calculator/share"; // the spec

/** The cases. */
export const SNMP_COUNTER_WRAP_CALCULATOR_SHARE_CASES = defineShareCases<SnmpCounterShareState, SnmpCounterShareState>({
  spec: SNMP_COUNTER_SHARE, // the spec
  accept: [
    { id: "wrap-example", state: { mode: "wrap", width: "32", kind: "octets", packetSize: "", speed: "10 Gb/s", utilisation: "40", poll: "300" }, params: { mode: "wrap", width: "32", kind: "octets", speed: "10 Gb/s", utilisation: "40", poll: "300" }, restored: { mode: "wrap", width: "32", kind: "octets", packetSize: "", speed: "10 Gb/s", utilisation: "40", poll: "300" } }, // the wrap Example: 10 Gb/s at 40 %, polled every 300 s
    { id: "rate-example", state: { mode: "rate", width: "64", kind: "octets", packetSize: "", first: "9876543210123", second: "10026543210123", firstTime: "123456700", secondTime: "123486700", timeUnit: "ticks", speed: "10 Gb/s" }, params: { mode: "rate", width: "64", kind: "octets", first: "9876543210123", second: "10026543210123", firsttime: "123456700", secondtime: "123486700", timeunit: "ticks", speed: "10 Gb/s" }, restored: { mode: "rate", width: "64", kind: "octets", packetSize: "", first: "9876543210123", second: "10026543210123", firstTime: "123456700", secondTime: "123486700", timeUnit: "ticks", speed: "10 Gb/s" } }, // the rate Example: sysUpTime ticks
    { id: "wrap-packets-size", state: { mode: "wrap", width: "32", kind: "packets", packetSize: "64", speed: "650000000", utilisation: "", poll: "" }, params: { mode: "wrap", width: "32", kind: "packets", speed: "650000000", packetsize: "64" }, restored: { mode: "wrap", width: "32", kind: "packets", packetSize: "64", speed: "650000000", utilisation: "", poll: "" } }, // RFC 2863's 64-byte packets: blank fields stay out
    { id: "rate-wrap-c64-seconds", state: { mode: "rate", width: "64", kind: "octets", packetSize: "", first: "18446744073709551000", second: "1000", firstTime: "100", secondTime: "400", timeUnit: "s", speed: "" }, params: { mode: "rate", width: "64", kind: "octets", first: "18446744073709551000", second: "1000", firsttime: "100", secondtime: "400", timeunit: "s" }, restored: { mode: "rate", width: "64", kind: "octets", packetSize: "", first: "18446744073709551000", second: "1000", firstTime: "100", secondTime: "400", timeUnit: "s", speed: "" } }, // a 64-bit wrap, no speed: the 20-digit value travels whole
  ],
  arrive: [
    { id: "wrap-speed-only", values: { mode: "wrap", width: "64", kind: "octets", speed: "100G" }, restored: { mode: "wrap", width: "64", kind: "octets", packetSize: "", speed: "100G", utilisation: "", poll: "" } }, // absent optional fields arrive blank (the engine's defaults)
    { id: "rate-no-unit", values: { mode: "rate", width: "32", kind: "packets", first: "1", second: "2", firsttime: "0", secondtime: "1" }, restored: { mode: "rate", width: "32", kind: "packets", packetSize: "", first: "1", second: "2", firstTime: "0", secondTime: "1", timeUnit: "s", speed: "" } }, // seconds when the unit is absent
  ],
  empty: [
    { id: "wrap-blank", state: { mode: "wrap", width: "32", kind: "octets", packetSize: "", speed: "", utilisation: "", poll: "" } }, // nothing typed
    { id: "wrap-refused-speed", state: { mode: "wrap", width: "32", kind: "octets", packetSize: "", speed: "fast", utilisation: "", poll: "" } }, // the page shows its error
    { id: "rate-zero-interval", state: { mode: "rate", width: "32", kind: "octets", packetSize: "", first: "10", second: "20", firstTime: "5", secondTime: "5", timeUnit: "s", speed: "" } }, // refused: no interval
  ],
  blocked: [],
  reject: [
    { id: "no-mode", values: { width: "32", kind: "octets", speed: "10G" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "both", width: "32", kind: "octets", speed: "10G" } }, // not a mode the page has
    { id: "width-16", values: { mode: "wrap", width: "16", kind: "octets", speed: "10G" } }, // no such counter
    { id: "kind-frames", values: { mode: "wrap", width: "32", kind: "frames", speed: "10G" } }, // not a kind the page offers
    { id: "wrap-without-speed", values: { mode: "wrap", width: "32", kind: "octets", utilisation: "40" } }, // the speed is required
    { id: "wrap-with-rate-field", values: { mode: "wrap", width: "32", kind: "octets", speed: "10G", first: "1" } }, // a field of the other mode
    { id: "rate-with-wrap-field", values: { mode: "rate", width: "32", kind: "octets", first: "1", second: "2", firsttime: "0", secondtime: "1", poll: "300" } }, // a field of the other mode
    { id: "rate-missing-second", values: { mode: "rate", width: "32", kind: "octets", first: "1", firsttime: "0", secondtime: "1" } }, // both readings are required
    { id: "rate-unit-ms", values: { mode: "rate", width: "32", kind: "octets", first: "1", second: "2", firsttime: "0", secondtime: "1", timeunit: "ms" } }, // s or ticks only
    { id: "size-with-octets", values: { mode: "wrap", width: "32", kind: "octets", speed: "10G", packetsize: "84" } }, // a packet size belongs to packets
    { id: "two-lines", values: { mode: "wrap", width: "32", kind: "octets", speed: "10G\n1G" } }, // every field is one line
  ],
});
