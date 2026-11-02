// ============================================================================
// src/lib/share/cases/acl-first-match-evaluator.ts
// ----------------------------------------------------------------------------
// Share cases of the ACL first-match evaluator (02/11/2026): the list as
// pasted goes as #input=, the packet's fields as typed under their own names,
// the list chosen as list; posture input-caution. A list holding a credential
// by its format (here a password in a URL inside a remark) gets no link.
// Addresses are the course lab's and the documentation ranges (RFC 5737).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { ACL_FIRST_MATCH_SHARE, type AclShareState } from "../../tools/acl-first-match-evaluator/share"; // the spec and its state
import { LAB_ACL } from "../../tools/acl-first-match-evaluator/golden-vectors"; // the course lab's list (the page's Example)

/** A state with nothing but the list. */
const only = (input: string): AclShareState => ({ input, list: "", protocol: "", source: "", srcport: "", destination: "", dstport: "", ackrst: false }); // empty packet

/** The page's Example: golden vector course-lab-vlan20-ssh-denied. */
const EXAMPLE: AclShareState = { input: LAB_ACL, list: "", protocol: "tcp", source: "10.1.20.25", srcport: "51514", destination: "10.1.99.10", dstport: "22", ackrst: false }; // the Example's state

/** Two lists, the second chosen, a reply segment (ACK set). */
const TWO_LISTS = "access-list 10 permit any\nip access-list extended EDGE\n permit tcp any any established\n deny ip any any"; // two lists

/** The cases. */
export const ACL_FIRST_MATCH_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<AclShareState, AclShareState>>({
  spec: ACL_FIRST_MATCH_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: EXAMPLE, params: { input: LAB_ACL, protocol: "tcp", source: "10.1.20.25", srcport: "51514", destination: "10.1.99.10", dstport: "22" }, restored: EXAMPLE }, // the page's Example
    { id: "list-and-ack", state: { input: TWO_LISTS, list: "EDGE", protocol: "tcp", source: "198.51.100.9", srcport: "443", destination: "192.0.2.10", dstport: "51514", ackrst: true }, params: { input: TWO_LISTS, list: "EDGE", protocol: "tcp", source: "198.51.100.9", srcport: "443", destination: "192.0.2.10", dstport: "51514", ackrst: "1" }, restored: { input: TWO_LISTS, list: "EDGE", protocol: "tcp", source: "198.51.100.9", srcport: "443", destination: "192.0.2.10", dstport: "51514", ackrst: true } }, // a chosen list and the ACK box
    { id: "list-only", state: only("access-list 10 permit 10.1.10.0 0.0.0.255"), params: { input: "access-list 10 permit 10.1.10.0 0.0.0.255" }, restored: only("access-list 10 permit 10.1.10.0 0.0.0.255") }, // no packet typed: the lint alone
    { id: "icmp-no-ports", state: { input: LAB_ACL, list: "", protocol: "icmp", source: "10.1.20.5", srcport: "", destination: "192.0.2.80", dstport: "", ackrst: false }, params: { input: LAB_ACL, protocol: "icmp", source: "10.1.20.5", destination: "192.0.2.80" }, restored: { input: LAB_ACL, list: "", protocol: "icmp", source: "10.1.20.5", srcport: "", destination: "192.0.2.80", dstport: "", ackrst: false } }, // empty ports are left out
  ],
  arrive: [ // decode only: defaults of absent optional values
    { id: "packet-absent", values: { input: "access-list 1 permit any", list: null, protocol: null, source: null, srcport: null, destination: null, dstport: null, ackrst: null }, restored: only("access-list 1 permit any") }, // every field empty, box not ticked
    { id: "ackrst-zero", values: { input: "access-list 1 permit any", ackrst: "0" }, restored: only("access-list 1 permit any") }, // "0": not ticked
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "blank-list", state: { ...EXAMPLE, input: "  \n" } }, // a packet alone is nothing
  ],
  blocked: [ // no link may carry it
    { id: "url-password-in-remark", state: only("ip access-list extended BACKUP\n remark pushed from https://netops:Pa55w0rd@192.0.2.9/acl\n permit ip any any"), code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1)
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " " } }, // blank
    { id: "ackrst-yes", values: { input: "access-list 1 permit any", ackrst: "yes" } }, // the box holds 1 or 0
    { id: "with-a-credential", values: { input: "access-list 1 remark https://netops:Pa55w0rd@192.0.2.9/\naccess-list 1 permit any" } }, // the encoder never builds one
  ],
}));
