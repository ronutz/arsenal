// ============================================================================
// src/lib/share/cases/f5xc-ce-egress-checklist.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC CE egress checklist (2026-11-01, wave 4B): the file
// goes as pasted with the site type, every time; a bare #input= hand-off takes
// the default site type; a credential in the text blocks the link; an unknown
// site type is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CE_EGRESS_SHARE, type CeEgressShareState } from "../../tools/f5xc-ce-egress-checklist/share"; // the spec

/** The page's Example: a trimmed sample of F5's ips-domains.txt, as the component holds it. */
const EXAMPLE = `## F5 Distributed Cloud SaaS Services
### Public IPv4 subnet ranges for F5 regional edges
#### REs in the Americas
5.182.215.0/25
159.60.190.0/24
## Firewall requirements for Secure Mesh v2 CE sites
### Egress IP-Address Rules
#### Public IPv4 Addresses for Site Registration and Updates
159.60.141.140
### Egress Domain Rules
## F5 Domains: Single wildcard domain
*.volterra.io
## Domains required for registration with F5 Distributed Cloud SaaS services
register.ves.volterra.io
downloads.volterra.io
## Webroot URL Classification Database Domains
localdb-url-daily.brightcloud.com
### Firewall requirements for Legacy CE sites
### Egress Domain Rules (Legacy)
docker.io
*.gcr.io gcr.io storage.googleapis.com
quay.io
## Additional firewall requirements for Customer Edge sites
### Default DNS for Site Registration and Updates
8.8.8.8
### Default NTP for Site Registration and Updates
216.239.35.4`; // verbatim

/** An edited copy with a note holding an AWS access key ID (AWS's own documentation example, standing in for a live one): no link. */
const WITH_KEY = `${EXAMPLE}\n## Mirror bucket credentials\nAKIAIOSFODNN7EXAMPLE`; // the site's aws-access-key-id rule

/** The cases. */
export const F5XC_CE_EGRESS_SHARE_CASES = defineShareCases<CeEgressShareState, CeEgressShareState>({
  spec: CE_EGRESS_SHARE, // the spec
  accept: [
    { id: "example-both", state: { input: EXAMPLE, site: "both" }, params: { input: EXAMPLE, site: "both" }, restored: { input: EXAMPLE, site: "both" } }, // the Example at the default site type
    { id: "example-smsv2", state: { input: EXAMPLE, site: "smsv2" }, params: { input: EXAMPLE, site: "smsv2" }, restored: { input: EXAMPLE, site: "smsv2" } }, // another site type
    { id: "one-line-legacy", state: { input: "docker.io", site: "legacy" }, params: { input: "docker.io", site: "legacy" }, restored: { input: "docker.io", site: "legacy" } }, // a single domain parses
  ],
  arrive: [
    { id: "bare-input-handoff", values: { input: "quay.io", site: null }, restored: { input: "quay.io", site: "both" } }, // the default site type
  ],
  empty: [
    { id: "blank", state: { input: "", site: "both" } }, // nothing pasted
    { id: "white-space", state: { input: " \n ", site: "legacy" } }, // nothing to parse
  ],
  blocked: [
    { id: "aws-key", state: { input: WITH_KEY, site: "both" }, code: "secret" }, // a definite credential
  ],
  reject: [
    { id: "empty", values: { input: "", site: "both" } }, // nothing
    { id: "absent", values: { input: null, site: "both" } }, // not there
    { id: "unknown-site", values: { input: EXAMPLE, site: "sm2" } }, // not a site type
    { id: "case-site", values: { input: EXAMPLE, site: "Both" } }, // ids are exact
  ],
});
