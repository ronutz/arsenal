// ============================================================================
// src/lib/share/cases/change-blast-radius-mapper.ts
// ----------------------------------------------------------------------------
// Share cases of the change-blast-radius-mapper (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BLAST_SHARE, type BlastShareState } from "../../tools/change-blast-radius-mapper/share"; // the spec

/** The cases. */
export const BLAST_SHARE_CASES = defineShareCases<BlastShareState, BlastShareState>({
  spec: BLAST_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"target": "certificate", "colocation": "heavily-shared", "trafficPath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userReach": "everyone", "preset": "tls-pki"}, "notes": {"summary": "", "targetDetail": ""}}, params: {"target": "certificate", "colocation": "heavily-shared", "trafficpath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userreach": "everyone", "preset": "tls-pki"}, restored: {"input": {"target": "certificate", "colocation": "heavily-shared", "trafficPath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userReach": "everyone", "preset": "tls-pki"}, "notes": {"summary": "", "targetDetail": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"target": "single-server", "colocation": "dedicated", "trafficPath": "out-of-band", "dependents": "none-known", "redundancy": "ha-pair-healthy", "userReach": "internal-team", "preset": "generic"}, "notes": {"summary": "Rotate the wildcard certificate on lb-edge-01 (CHG-2041)", "targetDetail": "VIP 10.20.30.40:443, partition Common"}}, params: {"target": "single-server", "colocation": "dedicated", "trafficpath": "out-of-band", "dependents": "none-known", "redundancy": "ha-pair-healthy", "userreach": "internal-team", "preset": "generic", "summary": "Rotate the wildcard certificate on lb-edge-01 (CHG-2041)", "targetdetail": "VIP 10.20.30.40:443, partition Common"}, restored: {"input": {"target": "single-server", "colocation": "dedicated", "trafficPath": "out-of-band", "dependents": "none-known", "redundancy": "ha-pair-healthy", "userReach": "internal-team", "preset": "generic"}, "notes": {"summary": "Rotate the wildcard certificate on lb-edge-01 (CHG-2041)", "targetDetail": "VIP 10.20.30.40:443, partition Common"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"target": "load-balancer", "colocation": "some-shared", "trafficPath": "in-path", "dependents": "a-few", "redundancy": "standalone", "userReach": "customer-facing", "preset": "load-balancer"}, "notes": {"summary": "", "targetDetail": "db_password=hunter2 on the replica"}}, params: {"target": "load-balancer", "colocation": "some-shared", "trafficpath": "in-path", "dependents": "a-few", "redundancy": "standalone", "userreach": "customer-facing", "preset": "load-balancer", "targetdetail": "db_password=hunter2 on the replica"}, restored: {"input": {"target": "load-balancer", "colocation": "some-shared", "trafficPath": "in-path", "dependents": "a-few", "redundancy": "standalone", "userReach": "customer-facing", "preset": "load-balancer"}, "notes": {"summary": "", "targetDetail": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"target": "load-balancer"}, restored: {"input": {"target": "load-balancer", "colocation": "dedicated", "trafficPath": "out-of-band", "dependents": "none-known", "redundancy": "ha-pair-healthy", "userReach": "internal-team", "preset": "generic"}, "notes": {"summary": "", "targetDetail": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"target": "certificate", "colocation": "heavily-shared", "trafficPath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userReach": "everyone", "preset": "tls-pki"}, "notes": {"summary": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "targetDetail": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"target": "single-server", "colocation": "dedicated", "trafficPath": "out-of-band", "dependents": "none-known", "redundancy": "ha-pair-healthy", "userReach": "internal-team", "preset": "generic"}, "notes": {"summary": "", "targetDetail": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git"}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"target": "toaster", "colocation": "heavily-shared", "trafficpath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userreach": "everyone", "preset": "tls-pki"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"target": "certificate", "colocation": "heavily-shared", "trafficpath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userreach": "the-whole-internet", "preset": "tls-pki"} }, // another one
    { id: "note-with-a-line-break", values: {"target": "certificate", "colocation": "heavily-shared", "trafficpath": "in-path", "dependents": "many", "redundancy": "ha-pair-healthy", "userreach": "everyone", "preset": "tls-pki", "summary": "line one\nline two"} }, // a one-line field cannot hold a line break
  ],
});
