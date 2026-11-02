// ============================================================================
// src/lib/share/cases/health-snapshot-comparator.ts
// ----------------------------------------------------------------------------
// Share cases of the health-snapshot-comparator (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { HEALTH_SNAPSHOT_SHARE, type HealthSnapshotShareState } from "../../tools/health-snapshot-comparator/share"; // the spec

/** The cases. */
export const HEALTH_SNAPSHOT_SHARE_CASES = defineShareCases<HealthSnapshotShareState, HealthSnapshotShareState>({
  spec: HEALTH_SNAPSHOT_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "load-balancer"}, "notes": {"title": "", "changeRef": "", "notes": ""}}, params: {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "before": "captured-verified", "after": "captured-verified", "window": "operational", "churn": "normal", "preset": "load-balancer"}, restored: {"input": {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "load-balancer"}, "notes": {"title": "", "changeRef": "", "notes": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"context": "post-change-validation", "target": "firewall", "scope": "single-device", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "generic"}, "notes": {"title": "LB pair after the 17.1.2 upgrade", "changeRef": "CHG-2041", "notes": "bigip-a and bigip-b compared"}}, params: {"context": "post-change-validation", "target": "firewall", "scope": "single-device", "before": "captured-verified", "after": "captured-verified", "window": "operational", "churn": "normal", "preset": "generic", "title": "LB pair after the 17.1.2 upgrade", "changeref": "CHG-2041", "notes": "bigip-a and bigip-b compared"}, restored: {"input": {"context": "post-change-validation", "target": "firewall", "scope": "single-device", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "generic"}, "notes": {"title": "LB pair after the 17.1.2 upgrade", "changeRef": "CHG-2041", "notes": "bigip-a and bigip-b compared"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"context": "rollback-decision", "target": "dns", "scope": "service-population", "beforeConfidence": "from-memory", "afterState": "partial", "window": "immediate", "churn": "high-dynamic", "preset": "dns"}, "notes": {"title": "", "changeRef": "", "notes": "db_password=hunter2 on the replica"}}, params: {"context": "rollback-decision", "target": "dns", "scope": "service-population", "before": "from-memory", "after": "partial", "window": "immediate", "churn": "high-dynamic", "preset": "dns", "notes": "db_password=hunter2 on the replica"}, restored: {"input": {"context": "rollback-decision", "target": "dns", "scope": "service-population", "beforeConfidence": "from-memory", "afterState": "partial", "window": "immediate", "churn": "high-dynamic", "preset": "dns"}, "notes": {"title": "", "changeRef": "", "notes": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"context": "rollback-decision"}, restored: {"input": {"context": "rollback-decision", "target": "firewall", "scope": "single-device", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "generic"}, "notes": {"title": "", "changeRef": "", "notes": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "load-balancer"}, "notes": {"title": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "changeRef": "", "notes": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"context": "post-change-validation", "target": "firewall", "scope": "single-device", "beforeConfidence": "captured-verified", "afterState": "captured-verified", "window": "operational", "churn": "normal", "preset": "generic"}, "notes": {"title": "", "changeRef": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git", "notes": ""}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "before": "captured-verified", "after": "looks-fine", "window": "operational", "churn": "normal", "preset": "load-balancer"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "before": "captured-verified", "after": "captured-verified", "window": "operational", "churn": "chaotic", "preset": "load-balancer"} }, // another one
    { id: "note-with-a-line-break", values: {"context": "post-change-validation", "target": "load-balancer", "scope": "ha-pair", "before": "captured-verified", "after": "captured-verified", "window": "operational", "churn": "normal", "preset": "load-balancer", "title": "line one\nline two"} }, // a one-line field cannot hold a line break
  ],
});
