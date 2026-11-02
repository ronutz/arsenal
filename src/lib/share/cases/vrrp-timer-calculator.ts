// ============================================================================
// src/lib/share/cases/vrrp-timer-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the VRRP timer, virtual MAC and election calculator
// (02/11/2026): a form, the mode's fields as typed, nothing of the other
// modes; the router list as lines of "<name> <priority> <address>" with
// " owner" and "*" for a blank field. Values are the page's three Examples
// (golden vectors example-timers, example-election and example-mac, the VRRP
// lab of the course's chapter 4.2) and other golden-vector shapes.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { VRRP_SHARE, type VrrpShareState } from "../../tools/vrrp-timer-calculator/share"; // the spec

/** The lab's two switches as the form holds them. */
const LAB_ROUTERS = [
  { name: "SW-CORE-01", priority: "110", address: "10.1.10.2", owner: false }, // the intended Active Router
  { name: "SW-CORE-02", priority: "100", address: "10.1.10.3", owner: false }, // the Backup
]; // chapter 4.2

/** The cases. */
export const VRRP_TIMER_CALCULATOR_SHARE_CASES = defineShareCases<VrrpShareState, VrrpShareState>({
  spec: VRRP_SHARE, // the spec
  accept: [
    { id: "timers-example", state: { mode: "timers", version: "3", priority: "100", interval: "100" }, params: { mode: "timers", version: "3", priority: "100", interval: "100" }, restored: { mode: "timers", version: "3", priority: "100", interval: "100" } }, // the timers Example
    { id: "election-example", state: { mode: "election", version: "3", interval: "100", preempt: true, routers: LAB_ROUTERS }, params: { mode: "election", version: "3", routers: "SW-CORE-01 110 10.1.10.2\nSW-CORE-02 100 10.1.10.3", preempt: "1", interval: "100" }, restored: { mode: "election", version: "3", interval: "100", preempt: true, routers: LAB_ROUTERS } }, // the election Example
    { id: "mac-example", state: { mode: "mac", version: "3", vrid: "10", family: "ipv4" }, params: { mode: "mac", version: "3", vrid: "10", family: "ipv4" }, restored: { mode: "mac", version: "3", vrid: "10", family: "ipv4" } }, // the MAC Example
    { id: "election-owner-blank-fields", state: { mode: "election", version: "3", interval: "", preempt: false, routers: [{ name: "", priority: "", address: "fe80::1", owner: true }, { name: "edge-2", priority: "200", address: "fe80::2", owner: false }] }, params: { mode: "election", version: "3", routers: "* * fe80::1 owner\nedge-2 200 fe80::2", preempt: "0" }, restored: { mode: "election", version: "3", interval: "", preempt: false, routers: [{ name: "", priority: "", address: "fe80::1", owner: true }, { name: "edge-2", priority: "200", address: "fe80::2", owner: false }] } }, // an owner with no name or priority, IPv6, preemption off, no interval
    { id: "timers-v2-default", state: { mode: "timers", version: "2", priority: "254", interval: "" }, params: { mode: "timers", version: "2", priority: "254" }, restored: { mode: "timers", version: "2", priority: "254", interval: "" } }, // VRRPv2 at its default: the blank interval stays out
    { id: "mac-ipv6", state: { mode: "mac", version: "3", vrid: "255", family: "ipv6" }, params: { mode: "mac", version: "3", vrid: "255", family: "ipv6" }, restored: { mode: "mac", version: "3", vrid: "255", family: "ipv6" } }, // the IPv6 block
  ],
  arrive: [
    { id: "timers-no-version", values: { mode: "timers", priority: "200" }, restored: { mode: "timers", version: "3", priority: "200", interval: "" } }, // version 3 and the default interval when absent
    { id: "election-no-preempt-value", values: { mode: "election", routers: "R1 110 192.0.2.1\nR2 100 192.0.2.2" }, restored: { mode: "election", version: "3", interval: "", preempt: true, routers: [{ name: "R1", priority: "110", address: "192.0.2.1", owner: false }, { name: "R2", priority: "100", address: "192.0.2.2", owner: false }] } }, // Preempt_Mode on when absent
    { id: "mac-no-family", values: { mode: "mac", vrid: "1" }, restored: { mode: "mac", version: "3", vrid: "1", family: "ipv4" } }, // IPv4 when absent
  ],
  empty: [
    { id: "timers-blank", state: { mode: "timers", version: "3", priority: "", interval: "" } }, // nothing typed
    { id: "timers-priority-zero", state: { mode: "timers", version: "3", priority: "0", interval: "" } }, // the page shows its refusal
    { id: "election-one-address", state: { mode: "election", version: "3", interval: "", preempt: true, routers: [{ name: "", priority: "100", address: "192.0.2.1", owner: false }, { name: "", priority: "90", address: "", owner: false }] } }, // a router without an address
    { id: "mac-vrid-zero", state: { mode: "mac", version: "3", vrid: "0", family: "ipv4" } }, // refused: VRID 0
  ],
  blocked: [],
  reject: [
    { id: "no-mode", values: { priority: "100" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "hsrp", priority: "100" } }, // not a mode the page has
    { id: "version-4", values: { mode: "timers", version: "4", priority: "100" } }, // no such version
    { id: "timers-without-priority", values: { mode: "timers", interval: "100" } }, // the priority is required
    { id: "timers-with-routers", values: { mode: "timers", priority: "100", routers: "R1 1 192.0.2.1\nR2 2 192.0.2.2" } }, // a field of another mode
    { id: "mac-with-interval", values: { mode: "mac", vrid: "10", interval: "100" } }, // the MAC has no interval
    { id: "mac-family-ipx", values: { mode: "mac", vrid: "10", family: "ipx" } }, // not a family
    { id: "election-preempt-2", values: { mode: "election", preempt: "2", routers: "R1 110 192.0.2.1\nR2 100 192.0.2.2" } }, // a switch is 1 or 0
    { id: "election-one-line", values: { mode: "election", routers: "R1 110 192.0.2.1" } }, // at least two routers
    { id: "election-nine-lines", values: { mode: "election", routers: Array.from({ length: 9 }, (_, i) => `R${i + 1} 100 192.0.2.${i + 1}`).join("\n") } }, // at most eight
    { id: "election-two-words", values: { mode: "election", routers: "R1 110\nR2 100 192.0.2.2" } }, // three or four words per line
    { id: "election-bad-fourth-word", values: { mode: "election", routers: "R1 110 192.0.2.1 master\nR2 100 192.0.2.2" } }, // only "owner" may follow the address
    { id: "election-double-space", values: { mode: "election", routers: "R1  110 192.0.2.1\nR2 100 192.0.2.2" } }, // single spaces, as encode writes them
    { id: "election-with-vrid", values: { mode: "election", routers: "R1 110 192.0.2.1\nR2 100 192.0.2.2", vrid: "10" } }, // a field of another mode
    { id: "two-lines-priority", values: { mode: "timers", priority: "100\n200" } }, // every other field is one line
  ],
});
