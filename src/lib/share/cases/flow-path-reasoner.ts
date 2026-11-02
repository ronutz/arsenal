// ============================================================================
// src/lib/share/cases/flow-path-reasoner.ts
// ----------------------------------------------------------------------------
// Share cases of the flow-path-reasoner (wave 4C, 2026-11-01): a fieldcraft form. Every choice goes by its id, the
// lists in the form's order, the notes as typed; a note holding a credential by its format gives no link (RFC
// 7617's published Basic credentials, a password in a URL); a secret-looking name still gives one. Test values
// are published examples or plainly made up; no real host, person or ticket.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FLOW_PATH_SHARE, type FlowPathShareState } from "../../tools/flow-path-reasoner/share"; // the spec

/** The cases. */
export const FLOW_PATH_SHARE_CASES = defineShareCases<FlowPathShareState, FlowPathShareState>({
  spec: FLOW_PATH_SHARE, // the spec
  accept: [
    { id: "example", state: {"input": {"archetype": "identity-federated", "resolution": "public-dns", "intermediaries": "proxy-waf", "transformation": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "", "nodeLabels": "", "notes": ""}}, params: {"archetype": "identity-federated", "resolution": "public-dns", "intermediary": "proxy-waf", "transform": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnpath": "known-symmetric", "preset": "generic"}, restored: {"input": {"archetype": "identity-federated", "resolution": "public-dns", "intermediaries": "proxy-waf", "transformation": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "", "nodeLabels": "", "notes": ""}} }, // the page's Example (a snapshot vector verbatim), no notes
    { id: "notes-with-hosts", state: {"input": {"archetype": "direct", "resolution": "public-dns", "intermediaries": "none", "transformation": "none", "tls": "end-to-end", "auth": "none", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "Branch to payments", "nodeLabels": "branch-fw = FGT-201F, app = payments", "notes": "Seen from the Recife branch only"}}, params: {"archetype": "direct", "resolution": "public-dns", "intermediary": "none", "transform": "none", "tls": "end-to-end", "auth": "none", "returnpath": "known-symmetric", "preset": "generic", "title": "Branch to payments", "nodelabels": "branch-fw = FGT-201F, app = payments", "notes": "Seen from the Recife branch only"}, restored: {"input": {"archetype": "direct", "resolution": "public-dns", "intermediaries": "none", "transformation": "none", "tls": "end-to-end", "auth": "none", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "Branch to payments", "nodeLabels": "branch-fw = FGT-201F, app = payments", "notes": "Seen from the Recife branch only"}} }, // the starting form with every note filled: host names and a ticket go, as typed
    { id: "other-choices-maybe-secret", state: {"input": {"archetype": "site-to-site-vpn", "resolution": "split-horizon", "intermediaries": "vpn", "transformation": "snat", "tls": "terminate-reencrypt", "auth": "local", "returnPath": "known-asymmetric", "preset": "firewall"}, "notes": {"title": "", "nodeLabels": "", "notes": "db_password=hunter2 on the replica"}}, params: {"archetype": "site-to-site-vpn", "resolution": "split-horizon", "intermediary": "vpn", "transform": "snat", "tls": "terminate-reencrypt", "auth": "local", "returnpath": "known-asymmetric", "preset": "firewall", "notes": "db_password=hunter2 on the replica"}, restored: {"input": {"archetype": "site-to-site-vpn", "resolution": "split-horizon", "intermediaries": "vpn", "transformation": "snat", "tls": "terminate-reencrypt", "auth": "local", "returnPath": "known-asymmetric", "preset": "firewall"}, "notes": {"title": "", "nodeLabels": "", "notes": "db_password=hunter2 on the replica"}} }, // other choices; a secret-looking name in a note still gets a link (the caution line names it)
  ],
  arrive: [
    { id: "one-choice", values: {"archetype": "site-to-site-vpn"}, restored: {"input": {"archetype": "site-to-site-vpn", "resolution": "public-dns", "intermediaries": "none", "transformation": "none", "tls": "end-to-end", "auth": "none", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "", "nodeLabels": "", "notes": ""}} }, // the other choices take the page's starting values; an absent list is its absent value; absent notes are empty
  ],
  empty: [], // a shown result always has something to share (the page passes nothing while the form is untouched)
  blocked: [
    { id: "credential-in-a-note", state: {"input": {"archetype": "identity-federated", "resolution": "public-dns", "intermediaries": "proxy-waf", "transformation": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "nodeLabels": "", "notes": ""}}, code: "secret" }, // RFC 7617's Basic credentials written into a note: no link
    { id: "url-password-in-a-note", state: {"input": {"archetype": "direct", "resolution": "public-dns", "intermediaries": "none", "transformation": "none", "tls": "end-to-end", "auth": "none", "returnPath": "known-symmetric", "preset": "generic"}, "notes": {"title": "", "nodeLabels": "pulled from https://svc:Pa55w0rd@git.example.com/infra.git", "notes": ""}}, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a note: no link
  ],
  reject: [
    { id: "unknown-choice", values: {"archetype": "identity-federated", "resolution": "public-dns", "intermediary": "proxy-waf", "transform": "proxy-source", "tls": "quantum", "auth": "redirect-idp", "returnpath": "known-symmetric", "preset": "generic"} }, // a choice the page does not offer
    { id: "unknown-choice-2", values: {"archetype": "identity-federated", "resolution": "public-dns", "intermediary": "a-goat", "transform": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnpath": "known-symmetric", "preset": "generic"} }, // another one
    { id: "note-with-a-line-break", values: {"archetype": "identity-federated", "resolution": "public-dns", "intermediary": "proxy-waf", "transform": "proxy-source", "tls": "terminate-once", "auth": "redirect-idp", "returnpath": "known-symmetric", "preset": "generic", "title": "line one\nline two"} }, // a one-line field cannot hold a line break
  ],
});
