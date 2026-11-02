// ============================================================================
// src/lib/share/cases/fortigate-security-profile-coverage-checker.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate security profile coverage checker (input): the box goes as
// pasted once a profile is listed; a credential pasted beside the
// directives blocks the link; a box with no profile has nothing to share.
// The secrets are invented for these cases (the ENC value is base64 for "this
// is not a real secret") or published examples (RFC 7617 section 2).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_PROFILE_COVERAGE_SHARE, type CoverageShareState } from "../../tools/fortigate-security-profile-coverage-checker/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "traffic: https\nssl: certificate\nmode: flow\nprofiles: antivirus, ips, application-control, web-filter"; // as the component holds it

/** The cases. */
export const FORTIGATE_SECURITY_PROFILE_COVERAGE_CHECKER_SHARE_CASES = defineShareCases<CoverageShareState, CoverageShareState>({
  spec: FORTIGATE_PROFILE_COVERAGE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "proxy-two-profiles", state: { input: "traffic: https\nssl: certificate\nmode: proxy\nprofiles: antivirus, ips" }, params: { input: "traffic: https\nssl: certificate\nmode: proxy\nprofiles: antivirus, ips" }, restored: { input: "traffic: https\nssl: certificate\nmode: proxy\nprofiles: antivirus, ips" } }, // proxy mode, two profiles (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "traffic: https\nssl: deep\nprofiles: antivirus\n# fortiguard_token=not-pasted-here" }, params: { input: "traffic: https\nssl: deep\nprofiles: antivirus\n# fortiguard_token=not-pasted-here" }, restored: { input: "traffic: https\nssl: deep\nprofiles: antivirus\n# fortiguard_token=not-pasted-here" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-profile", state: { input: "traffic: https\nssl: deep" } }, // no profile listed
  ],
  blocked: [
    { id: "enc-value", state: { input: "traffic: https\nssl: deep\nprofiles: antivirus\nset password ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" }, code: "secret" }, // an ENC value pasted beside the directives
    { id: "radius-secret-plain", state: { input: "traffic: https\nprofiles: ips\nset secret not-a-real-secret" }, code: "secret" }, // a RADIUS secret in clear (type password)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: "profiles: antivirus\nset psksecret ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" } }, // a credential: never in a link
  ],
});
