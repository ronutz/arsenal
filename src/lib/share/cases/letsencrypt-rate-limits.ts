// ============================================================================
// src/lib/share/cases/letsencrypt-rate-limits.ts
// ----------------------------------------------------------------------------
// Share cases of the Let's Encrypt rate-limit planner: the names go as typed,
// line breaks included.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LETSENCRYPT_RATE_LIMITS_SHARE, type LetsEncryptRateLimitsShareState } from "../../tools/letsencrypt-rate-limits/share"; // the spec

/** The Example: two registered domains, wildcards on both (the golden-vector set). */
const EXAMPLE = "www.example.com\napi.example.com\nblog.example.com\nshop.example.co.uk\nwww.example.co.uk"; // as the page loads it

/** The cases. */
export const LETSENCRYPT_RATE_LIMITS_SHARE_CASES = defineShareCases<LetsEncryptRateLimitsShareState, LetsEncryptRateLimitsShareState>({
  spec: LETSENCRYPT_RATE_LIMITS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // five names, line breaks kept
    { id: "wildcards-commas", state: { input: "*.example.com, example.com\r\nexample.org" }, params: { input: "*.example.com, example.com\r\nexample.org" }, restored: { input: "*.example.com, example.com\r\nexample.org" } }, // "*", commas and CR LF survive
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no names
    { id: "blank-lines", state: { input: "\n\n" } }, // only line breaks
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n " } }, // only white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
