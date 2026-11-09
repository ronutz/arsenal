// ============================================================================
// src/lib/share/cases/ospf-cost-and-adjacency-checker.ts
// ----------------------------------------------------------------------------
// Share cases of the OSPF cost and adjacency checker (08/11/2026): a form, the
// mode's fields as typed, nothing of the other mode; each side of a link as
// thirteen words with "*" for a blank field. Values are the page's two Examples
// (golden vectors example-cost and example-adjacency, the OSPF lab of the
// course's chapter 4.1) and other golden-vector shapes. No key is ever in a
// link: the tool asks only whether the two keys are the same.
// 2026-11-08b: Arista EOS documents auto-cost reference-bandwidth (read in a
// browser that day), so its typed reference is an accepted link, a blank one
// arrives as "not configured", and the refused example is Switch Engine's.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OSPF_SHARE, type OspfShareState, type SideForm } from "../../tools/ospf-cost-and-adjacency-checker/share"; // the spec

/** SW-CORE-01's uplink as the form holds it (chapter 4.1 lab). */
const CORE: SideForm = { name: "SW-CORE-01", routerId: "10.255.0.1", area: "0", areaType: "normal", network: "point-to-point", address: "10.0.12.1/30", hello: "10", dead: "40", mtu: "1500", auth: "hmac-sha-256", keyId: "1", priority: "", instance: "0" }; // slides 409 and 437
/** The uplink router, with the Example's different Hello. */
const UPLINK: SideForm = { name: "uplink-router", routerId: "", area: "0", areaType: "normal", network: "point-to-point", address: "10.0.12.2/30", hello: "5", dead: "20", mtu: "1500", auth: "hmac-sha-256", keyId: "1", priority: "", instance: "0" }; // slide 437, step 8
/** CORE as its words. */
const CORE_WORDS = "SW-CORE-01 10.255.0.1 0 normal point-to-point 10.0.12.1/30 10 40 1500 hmac-sha-256 1 * 0"; // thirteen words
/** UPLINK as its words. */
const UPLINK_WORDS = "uplink-router * 0 normal point-to-point 10.0.12.2/30 5 20 1500 hmac-sha-256 1 * 0"; // blank Router ID and priority

/** The cases. */
export const OSPF_COST_AND_ADJACENCY_CHECKER_SHARE_CASES = defineShareCases<OspfShareState, OspfShareState>({
  spec: OSPF_SHARE, // the spec
  accept: [ // the list
    { id: "cost-example", state: { mode: "cost", vendor: "juniper-junos", reference: "", links: "100M, 1G, 10G" }, params: { mode: "cost", vendor: "juniper-junos", links: "100M, 1G, 10G" }, restored: { mode: "cost", vendor: "juniper-junos", reference: "", links: "100M, 1G, 10G" } }, // the cost Example: no reference typed
    { id: "cost-reference", state: { mode: "cost", vendor: "cisco-ios-xe", reference: "100000", links: "1G, 10G, 40G, 100G" }, params: { mode: "cost", vendor: "cisco-ios-xe", reference: "100000", links: "1G, 10G, 40G, 100G" }, restored: { mode: "cost", vendor: "cisco-ios-xe", reference: "100000", links: "1G, 10G, 40G, 100G" } }, // a typed reference
    { id: "cost-arista-reference", state: { mode: "cost", vendor: "arista-eos", reference: "59000", links: "10G" }, params: { mode: "cost", vendor: "arista-eos", reference: "59000", links: "10G" }, restored: { mode: "cost", vendor: "arista-eos", reference: "59000", links: "10G" } }, // Arista's own example: auto-cost 59000, a 10 Gbit/s interface at 5 (golden vector sent-arista-configured)
    { id: "adjacency-example", state: { mode: "adjacency", version: "2", sameKey: true, a: CORE, b: UPLINK }, params: { mode: "adjacency", version: "2", samekey: "1", a: CORE_WORDS, b: UPLINK_WORDS }, restored: { mode: "adjacency", version: "2", sameKey: true, a: CORE, b: UPLINK } }, // the adjacency Example
    { id: "adjacency-wrong-key", state: { mode: "adjacency", version: "2", sameKey: false, a: CORE, b: { ...UPLINK, hello: "10", dead: "40" } }, params: { mode: "adjacency", version: "2", samekey: "0", a: CORE_WORDS, b: "uplink-router * 0 normal point-to-point 10.0.12.2/30 10 40 1500 hmac-sha-256 1 * 0" }, restored: { mode: "adjacency", version: "2", sameKey: false, a: CORE, b: { ...UPLINK, hello: "10", dead: "40" } } }, // step 8's wrong key: only the switch travels, the tool never holds a key
    { id: "adjacency-v3", state: { mode: "adjacency", version: "3", sameKey: true, a: { ...CORE, address: "", auth: "none", keyId: "" }, b: { ...UPLINK, address: "", auth: "none", keyId: "", instance: "64" } }, params: { mode: "adjacency", version: "3", samekey: "1", a: "SW-CORE-01 10.255.0.1 0 normal point-to-point * 10 40 1500 none * * 0", b: "uplink-router * 0 normal point-to-point * 5 20 1500 none * * 64" }, restored: { mode: "adjacency", version: "3", sameKey: true, a: { ...CORE, address: "", auth: "none", keyId: "" }, b: { ...UPLINK, address: "", auth: "none", keyId: "", instance: "64" } } }, // OSPFv3: no address
  ],
  arrive: [ // the list
    { id: "adjacency-defaults", values: { mode: "adjacency", a: CORE_WORDS, b: UPLINK_WORDS }, restored: { mode: "adjacency", version: "2", sameKey: true, a: CORE, b: UPLINK } }, // version 2 and the same key when absent
    { id: "cost-no-reference", values: { mode: "cost", vendor: "frr", links: "1G" }, restored: { mode: "cost", vendor: "frr", reference: "", links: "1G" } }, // the default reference when absent
    { id: "cost-arista-not-configured", values: { mode: "cost", vendor: "arista-eos", links: "1G, 100G" }, restored: { mode: "cost", vendor: "arista-eos", reference: "", links: "1G, 100G" } }, // on Arista a blank reference is "not configured" (golden vector sent-arista-unset)
  ],
  empty: [ // the list
    { id: "cost-blank", state: { mode: "cost", vendor: "juniper-junos", reference: "", links: "" } }, // nothing typed
    { id: "cost-refused", state: { mode: "cost", vendor: "extreme-switch-engine", reference: "100000", links: "1G" } }, // the page shows its refusal: Switch Engine has a metric table, no reference (golden vector err-reference-none)
    { id: "adjacency-refused", state: { mode: "adjacency", version: "2", sameKey: true, a: { ...CORE, hello: "0" }, b: UPLINK } }, // a HelloInterval of 0 is refused
  ],
  blocked: [], // none: no reading is ever blocked
  reject: [ // the list
    { id: "no-mode", values: { vendor: "cisco-ios-xe", links: "1G" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "spf", links: "1G" } }, // not a mode the page has
    { id: "unknown-vendor", values: { mode: "cost", vendor: "cisco", links: "1G" } }, // not a vendor the page lists
    { id: "cost-no-links", values: { mode: "cost", vendor: "cisco-ios-xe" } }, // the speeds are required
    { id: "cost-with-side", values: { mode: "cost", vendor: "cisco-ios-xe", links: "1G", a: CORE_WORDS } }, // a field of the other mode
    { id: "adjacency-with-vendor", values: { mode: "adjacency", a: CORE_WORDS, b: UPLINK_WORDS, vendor: "frr" } }, // a field of the other mode
    { id: "adjacency-version-4", values: { mode: "adjacency", version: "4", a: CORE_WORDS, b: UPLINK_WORDS } }, // no such version
    { id: "adjacency-samekey-2", values: { mode: "adjacency", samekey: "2", a: CORE_WORDS, b: UPLINK_WORDS } }, // a switch is 1 or 0
    { id: "adjacency-one-side", values: { mode: "adjacency", a: CORE_WORDS } }, // both sides are required
    { id: "adjacency-twelve-words", values: { mode: "adjacency", a: "SW-CORE-01 10.255.0.1 0 normal point-to-point 10.0.12.1/30 10 40 1500 hmac-sha-256 1 *", b: UPLINK_WORDS } }, // thirteen words
    { id: "adjacency-double-space", values: { mode: "adjacency", a: CORE_WORDS.replace(" ", "  "), b: UPLINK_WORDS } }, // single spaces, as encode writes them
    { id: "adjacency-bad-network", values: { mode: "adjacency", a: CORE_WORDS.replace("point-to-point", "ptp"), b: UPLINK_WORDS } }, // an unknown network type
    { id: "adjacency-bad-auth", values: { mode: "adjacency", a: CORE_WORDS.replace("hmac-sha-256", "sha256"), b: UPLINK_WORDS } }, // an unknown authentication
    { id: "two-lines", values: { mode: "cost", vendor: "cisco-ios-xe", links: "1G\n10G" } }, // every field is one line
  ],
});
