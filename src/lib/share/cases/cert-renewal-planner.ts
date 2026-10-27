// ============================================================================
// src/lib/share/cases/cert-renewal-planner.ts
// ----------------------------------------------------------------------------
// Share cases of the certificate renewal planner: the two dates go; anything
// a date field cannot hold makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CERT_RENEWAL_PLANNER_SHARE, type CertRenewalShareState } from "../../tools/cert-renewal-planner/share"; // the spec

/** The cases. */
export const CERT_RENEWAL_PLANNER_SHARE_CASES = defineShareCases<CertRenewalShareState, CertRenewalShareState>({
  spec: CERT_RENEWAL_PLANNER_SHARE, // the spec
  accept: [
    { id: "example", state: { notBefore: "2026-01-01", notAfter: "2027-02-02" }, params: { input: "2026-01-01", notafter: "2027-02-02" }, restored: { notBefore: "2026-01-01", notAfter: "2027-02-02" } }, // the Example (over the cap)
    { id: "ninety-days", state: { notBefore: "2026-06-01", notAfter: "2026-08-30" }, params: { input: "2026-06-01", notafter: "2026-08-30" }, restored: { notBefore: "2026-06-01", notAfter: "2026-08-30" } }, // the other example button
    { id: "leap-day", state: { notBefore: "2028-02-29", notAfter: "2028-05-29" }, params: { input: "2028-02-29", notafter: "2028-05-29" }, restored: { notBefore: "2028-02-29", notAfter: "2028-05-29" } }, // a real 29 February
  ],
  empty: [
    { id: "one-date", state: { notBefore: "2026-01-01", notAfter: "" } }, // no plan without both
    { id: "none", state: { notBefore: "", notAfter: "" } }, // nothing chosen
  ],
  reject: [
    { id: "no-expiry", values: { input: "2026-01-01", notafter: null } }, // one date
    { id: "no-issue", values: { input: null, notafter: "2027-02-02" } }, // one date
    { id: "not-iso", values: { input: "01/01/2026", notafter: "2027-02-02" } }, // not the field's form
    { id: "no-such-day", values: { input: "2027-02-29", notafter: "2027-06-01" } }, // 2027 is not a leap year
    { id: "with-time", values: { input: "2026-01-01T00:00:00Z", notafter: "2027-02-02" } }, // a date field holds a day only
  ],
});
