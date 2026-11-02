// ============================================================================
// src/lib/share/cases/tac-escalation-packet-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the tac-escalation-packet-builder (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TAC_PACKET_SHARE, type TacPacketShareState } from "../../tools/tac-escalation-packet-builder/share"; // the spec

/** The cases. */
export const TAC_PACKET_SHARE_CASES = defineShareCases<TacPacketShareState, TacPacketShareState>({
  spec: TAC_PACKET_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"vendor": "load-balancer", "severity": "sev1-down", "reproducibility": "reproducible", "collected": [], "tried": ["nothing-yet"]}, "notes": {"problemSummary": "", "environment": "", "caseReference": ""}}, params: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet"}, restored: {"input": {"vendor": "load-balancer", "severity": "sev1-down", "reproducibility": "reproducible", "collected": [], "tried": ["nothing-yet"]}, "notes": {"problemSummary": "", "environment": "", "caseReference": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"vendor": "generic", "severity": "sev3-question", "reproducibility": "reproducible", "collected": ["problem-statement"], "tried": ["kb-search"]}, "notes": {"problemSummary": "IPsec tunnels to the Recife branch drop every 4 hours", "environment": "FortiGate 600F, FortiOS 7.4.5, HA active-passive", "caseReference": "Case 0412-7781"}}, params: {"vendor": "generic", "severity": "sev3-question", "repro": "reproducible", "collected": "problem-statement", "tried": "kb-search", "summary": "IPsec tunnels to the Recife branch drop every 4 hours", "environment": "FortiGate 600F, FortiOS 7.4.5, HA active-passive", "caseref": "Case 0412-7781"}, restored: {"input": {"vendor": "generic", "severity": "sev3-question", "reproducibility": "reproducible", "collected": ["problem-statement"], "tried": ["kb-search"]}, "notes": {"problemSummary": "IPsec tunnels to the Recife branch drop every 4 hours", "environment": "FortiGate 600F, FortiOS 7.4.5, HA active-passive", "caseReference": "Case 0412-7781"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"vendor": "firewall", "severity": "sev2-degraded", "reproducibility": "intermittent", "collected": ["exact-error", "packet-capture", "logs"], "tried": ["restart", "failover"]}, "notes": {"problemSummary": "", "environment": "", "caseReference": "db_password=hunter2 on the replica"}}, params: {"vendor": "firewall", "severity": "sev2-degraded", "repro": "intermittent", "collected": "exact-error,packet-capture,logs", "tried": "restart,failover", "caseref": "db_password=hunter2 on the replica"}, restored: {"input": {"vendor": "firewall", "severity": "sev2-degraded", "reproducibility": "intermittent", "collected": ["exact-error", "packet-capture", "logs"], "tried": ["restart", "failover"]}, "notes": {"problemSummary": "", "environment": "", "caseReference": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"vendor": "firewall"}, restored: {"input": {"vendor": "firewall", "severity": "sev3-question", "reproducibility": "reproducible", "collected": [], "tried": []}, "notes": {"problemSummary": "", "environment": "", "caseReference": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"vendor": "load-balancer", "severity": "sev1-down", "reproducibility": "reproducible", "collected": [], "tried": ["nothing-yet"]}, "notes": {"problemSummary": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "environment": "", "caseReference": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"vendor": "generic", "severity": "sev3-question", "reproducibility": "reproducible", "collected": ["problem-statement"], "tried": ["kb-search"]}, "notes": {"problemSummary": "", "environment": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git", "caseReference": ""}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"vendor": "load-balancer", "severity": "sev0-apocalypse", "repro": "reproducible", "tried": "nothing-yet"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "never", "tried": "nothing-yet"} }, // another one
    { id: "note-with-a-line-break", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet", "summary": "line one\nline two"} }, // a one-line field cannot hold a line break
    { id: "collected-unknown-id", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet", "collected": "problem-statement,not-an-option"} }, // an id the group does not offer
    { id: "collected-out-of-order", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet", "collected": "timeline,exact-error"} }, // the encoder writes the form's order only
    { id: "collected-twice", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet", "collected": "exact-error,exact-error"} }, // an id twice
    { id: "tried-unknown-id", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet,not-an-option"} }, // an id the group does not offer
    { id: "tried-out-of-order", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "rollback,restart"} }, // the encoder writes the form's order only
    { id: "tried-twice", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "restart,restart"} }, // an id twice
    { id: "tried-exclusive-with-others", values: {"vendor": "load-balancer", "severity": "sev1-down", "repro": "reproducible", "tried": "nothing-yet,restart"} }, // nothing-yet never stands with others
  ],
});
