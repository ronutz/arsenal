// ============================================================================
// src/lib/share/cases/packet-capture-plan-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the packet-capture-plan-builder (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CAPTURE_PLAN_SHARE, type CapturePlanShareState } from "../../tools/packet-capture-plan-builder/share"; // the spec

/** The cases. */
export const CAPTURE_PLAN_SHARE_CASES = defineShareCases<CapturePlanShareState, CapturePlanShareState>({
  spec: CAPTURE_PLAN_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"archetype": "load-balancer", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "load-balancer"}, "notes": {"labels": "", "reference": "", "notes": ""}}, params: {"archetype": "load-balancer", "symptom": "timeout", "trafficclass": "tcp", "intermediary": "none", "transform": "none", "access": "both-endpoints", "timebehavior": "constant", "preset": "load-balancer"}, restored: {"input": {"archetype": "load-balancer", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "load-balancer"}, "notes": {"labels": "", "reference": "", "notes": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"archetype": "direct", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "generic"}, "notes": {"labels": "app-frontend -> payments-api (10.8.4.20)", "reference": "INC-4211", "notes": "Resets only under the 18:00 peak"}}, params: {"archetype": "direct", "symptom": "timeout", "trafficclass": "tcp", "intermediary": "none", "transform": "none", "access": "both-endpoints", "timebehavior": "constant", "preset": "generic", "labels": "app-frontend -> payments-api (10.8.4.20)", "reference": "INC-4211", "notes": "Resets only under the 18:00 peak"}, restored: {"input": {"archetype": "direct", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "generic"}, "notes": {"labels": "app-frontend -> payments-api (10.8.4.20)", "reference": "INC-4211", "notes": "Resets only under the 18:00 peak"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"archetype": "firewall-nat", "symptom": "reset", "trafficClass": "tls", "intermediaries": "nat-snat", "transformation": "address-translation", "access": "endpoint-plus-intermediary", "timeBehavior": "load-related", "preset": "firewall"}, "notes": {"labels": "", "reference": "", "notes": "db_password=hunter2 on the replica"}}, params: {"archetype": "firewall-nat", "symptom": "reset", "trafficclass": "tls", "intermediary": "nat-snat", "transform": "address-translation", "access": "endpoint-plus-intermediary", "timebehavior": "load-related", "preset": "firewall", "notes": "db_password=hunter2 on the replica"}, restored: {"input": {"archetype": "firewall-nat", "symptom": "reset", "trafficClass": "tls", "intermediaries": "nat-snat", "transformation": "address-translation", "access": "endpoint-plus-intermediary", "timeBehavior": "load-related", "preset": "firewall"}, "notes": {"labels": "", "reference": "", "notes": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"archetype": "firewall-nat"}, restored: {"input": {"archetype": "firewall-nat", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "generic"}, "notes": {"labels": "", "reference": "", "notes": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"archetype": "load-balancer", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "load-balancer"}, "notes": {"labels": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "reference": "", "notes": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"archetype": "direct", "symptom": "timeout", "trafficClass": "tcp", "intermediaries": "none", "transformation": "none", "access": "both-endpoints", "timeBehavior": "constant", "preset": "generic"}, "notes": {"labels": "", "reference": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git", "notes": ""}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"archetype": "load-balancer", "symptom": "timeout", "trafficclass": "tcp", "intermediary": "none", "transform": "none", "access": "everywhere", "timebehavior": "constant", "preset": "load-balancer"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"archetype": "load-balancer", "symptom": "timeout", "trafficclass": "smtp", "intermediary": "none", "transform": "none", "access": "both-endpoints", "timebehavior": "constant", "preset": "load-balancer"} }, // another one
    { id: "note-with-a-line-break", values: {"archetype": "load-balancer", "symptom": "timeout", "trafficclass": "tcp", "intermediary": "none", "transform": "none", "access": "both-endpoints", "timebehavior": "constant", "preset": "load-balancer", "labels": "line one\nline two"} }, // a one-line field cannot hold a line break
  ],
});
