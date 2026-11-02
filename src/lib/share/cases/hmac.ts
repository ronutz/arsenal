// ============================================================================
// src/lib/share/cases/hmac.ts
// ----------------------------------------------------------------------------
// Share cases of the HMAC tool: the message and the algorithm go; the key
// never does, except RFC 4231 test case 2's published key "Jefe" (the page's
// Example). The MAC is never carried either.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { HMAC_SHARE, type HmacShareInput, type HmacShareState } from "../../tools/hmac/share"; // the spec

/** RFC 4231 test case 2's message, the page's Example. */
const MSG = "what do ya want for nothing?"; // printed in the RFC
/** A key of the reader's own (made up for these cases). */
const OWN_KEY = "whsec_7Hq2Lr9Vx4Nc1Bm8Zk3Pd6Ty"; // a webhook-secret shape
/** A webhook body, with the characters a link must keep. */
const BODY = '{"event":"push","ref":"refs/heads/main","n":1}\n&#%+= ação'; // JSON, a line break, delimiters, accents
/** HMAC-SHA-256 of MSG under "Jefe" (RFC 4231 section 4.3), which a link never carries. */
const MAC_HEX = "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"; // printed in the RFC

/** The cases. */
const CASES: ShareCases<HmacShareInput, HmacShareState> = {
  spec: HMAC_SHARE, // the spec
  accept: [
    { // the Example: RFC 4231's published key goes with it
      id: "rfc4231-example", state: { message: MSG, key: "Jefe", algorithm: "SHA-256", hasResult: true },
      params: { input: MSG, key: "Jefe" }, restored: { message: MSG, algorithm: "SHA-256", key: "Jefe" },
      mustNotContain: [MAC_HEX], // never the MAC
    },
    { // a key of the reader's own never goes; another algorithm does
      id: "own-key-sha512", state: { message: BODY, key: OWN_KEY, algorithm: "SHA-512", hasResult: true },
      params: { input: BODY, algorithm: "SHA-512" }, restored: { message: BODY, algorithm: "SHA-512", key: null },
      mustNotContain: [OWN_KEY],
    },
    { // "Jefe" in another case is not the published key
      id: "near-published-key", state: { message: MSG, key: "jefe", algorithm: "SHA-384", hasResult: true },
      params: { input: MSG, algorithm: "SHA-384" }, restored: { message: MSG, algorithm: "SHA-384", key: null },
      mustNotContain: ["jefe"],
    },
  ],
  arrive: [
    { id: "algorithm-absent", values: { input: MSG, algorithm: null, key: null }, restored: { message: MSG, algorithm: "SHA-256", key: null } }, // the default
  ],
  empty: [
    { id: "no-key-yet", state: { message: MSG, key: "", algorithm: "SHA-256", hasResult: false } }, // the page shows a MAC only with both fields
    { id: "blank", state: { message: "", key: "", algorithm: "SHA-256", hasResult: false } }, // nothing typed
  ],
  reject: [
    { id: "real-key", values: { input: MSG, algorithm: null, key: OWN_KEY } }, // a key that is not the published one never fills a page
    { id: "unknown-algorithm", values: { input: MSG, algorithm: "MD5", key: null } }, // not offered
    { id: "no-message", values: { input: null, algorithm: "SHA-256", key: "Jefe" } }, // the message is required
  ],
};

/** The runner. */
export const HMAC_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
