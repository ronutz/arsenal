// ============================================================================
// src/lib/share/cases/fault-hypothesis-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the fault-hypothesis-builder (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FHB_SHARE, type FhbShareState } from "../../tools/fault-hypothesis-builder/share"; // the spec

/** The cases. */
export const FHB_SHARE_CASES = defineShareCases<FhbShareState, FhbShareState>({
  spec: FHB_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"symptom": "errors-for-some", "scope": "some-users", "changed": ["software-deploy"], "timing": "since-change", "clues": ["tcp-connects-but-app-errors", "http-5xx"], "preset": "load-balancer"}, "notes": {"summary": "", "impact": "", "alreadyTried": ""}}, params: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "tcp-connects-but-app-errors,http-5xx"}, restored: {"input": {"symptom": "errors-for-some", "scope": "some-users", "changed": ["software-deploy"], "timing": "since-change", "clues": ["tcp-connects-but-app-errors", "http-5xx"], "preset": "load-balancer"}, "notes": {"summary": "", "impact": "", "alreadyTried": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"symptom": "intermittent", "scope": "some-users", "changed": ["nothing-known"], "timing": "constant", "clues": [], "preset": "generic"}, "notes": {"summary": "Checkout API errors for EU customers", "impact": "About 8% of orders fail", "alreadyTried": "Restarted app-eu-02"}}, params: {"symptom": "intermittent", "scope": "some-users", "timing": "constant", "preset": "generic", "changed": "nothing-known", "summary": "Checkout API errors for EU customers", "impact": "About 8% of orders fail", "alreadytried": "Restarted app-eu-02"}, restored: {"input": {"symptom": "intermittent", "scope": "some-users", "changed": ["nothing-known"], "timing": "constant", "clues": [], "preset": "generic"}, "notes": {"summary": "Checkout API errors for EU customers", "impact": "About 8% of orders fail", "alreadyTried": "Restarted app-eu-02"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"symptom": "slow", "scope": "one-site", "changed": ["network-change", "provider-maintenance"], "timing": "time-of-day", "clues": ["timeouts", "slow-only-large-transfers"], "preset": "dns"}, "notes": {"summary": "", "impact": "", "alreadyTried": "db_password=hunter2 on the replica"}}, params: {"symptom": "slow", "scope": "one-site", "timing": "time-of-day", "preset": "dns", "changed": "network-change,provider-maintenance", "clues": "timeouts,slow-only-large-transfers", "alreadytried": "db_password=hunter2 on the replica"}, restored: {"input": {"symptom": "slow", "scope": "one-site", "changed": ["network-change", "provider-maintenance"], "timing": "time-of-day", "clues": ["timeouts", "slow-only-large-transfers"], "preset": "dns"}, "notes": {"summary": "", "impact": "", "alreadyTried": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"symptom": "slow"}, restored: {"input": {"symptom": "slow", "scope": "some-users", "changed": ["nothing-known"], "timing": "constant", "clues": [], "preset": "generic"}, "notes": {"summary": "", "impact": "", "alreadyTried": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"symptom": "errors-for-some", "scope": "some-users", "changed": ["software-deploy"], "timing": "since-change", "clues": ["tcp-connects-but-app-errors", "http-5xx"], "preset": "load-balancer"}, "notes": {"summary": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "impact": "", "alreadyTried": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"symptom": "intermittent", "scope": "some-users", "changed": ["nothing-known"], "timing": "constant", "clues": [], "preset": "generic"}, "notes": {"summary": "", "impact": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git", "alreadyTried": ""}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"symptom": "on-fire", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "sometimes", "preset": "load-balancer", "changed": "software-deploy", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // another one
    { id: "note-with-a-line-break", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "tcp-connects-but-app-errors,http-5xx", "summary": "line one\nline two"} }, // a one-line field cannot hold a line break
    { id: "changed-unknown-id", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "nothing-known,not-an-option", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // an id the group does not offer
    { id: "changed-out-of-order", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy,config-change", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // the encoder writes the form's order only
    { id: "changed-twice", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "config-change,config-change", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // an id twice
    { id: "changed-exclusive-with-others", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "nothing-known,config-change", "clues": "tcp-connects-but-app-errors,http-5xx"} }, // nothing-known never stands with others
    { id: "clues-unknown-id", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "dns-fails,not-an-option"} }, // an id the group does not offer
    { id: "clues-out-of-order", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "tls-errors,works-by-ip-not-name"} }, // the encoder writes the form's order only
    { id: "clues-twice", values: {"symptom": "errors-for-some", "scope": "some-users", "timing": "since-change", "preset": "load-balancer", "changed": "software-deploy", "clues": "works-by-ip-not-name,works-by-ip-not-name"} }, // an id twice
  ],
});
