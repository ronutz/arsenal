// ============================================================================
// src/lib/share/cases/oidc.ts
// ----------------------------------------------------------------------------
// Share cases of the OIDC decoder: an ID token travels as "header.payload."
// with a flag, never with its signature; a discovery document travels as
// typed, unless it also holds a credential (client_secret, an access token, a
// private JWK) or the token's header holds a private key. The tokens and
// documents are the tool's own golden vectors.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { OIDC_SHARE, type OidcShareInput, type OidcShareState } from "../../tools/oidc/share"; // the spec
import { OIDC_GOLDEN_VECTORS } from "../../tools/oidc/golden-vectors"; // the tool's own vectors
import { analyzeOidc } from "../../tools/oidc/compute"; // the engine, for the report each state holds

/** A vector's input by id (pinned in the tool's set). */
const input = (id: string): string => OIDC_GOLDEN_VECTORS.find((v) => v.id === id)!.input; // found there
/** The RS256 ID token with profile and email claims. */
const FULL = input("id-token-rs256-full"); // signed, "sig" placeholder signature
/** The unsecured ID token. */
const NONE = input("id-token-alg-none"); // alg none, empty signature
/** A clean discovery document. */
const DISCOVERY = input("discovery-clean"); // public by design
/** A discovery document advertising alg none. */
const DISCOVERY_NONE = input("discovery-alg-none"); // a finding, still public

/** The copy of a token: its first two segments and an empty signature. */
const copyOf = (token: string): string => token.split(".").slice(0, 2).join(".") + "."; // as shareableToken builds it
/** The state the page holds for a box: the box and the engine's report. */
const state = (box: string): OidcShareInput => ({ input: box, report: analyzeOidc(box) }); // as the page computes it

/** An application's settings file beside the discovery members: it holds a client secret (RFC 7591's example value). */
const WITH_SECRET = JSON.stringify({ ...JSON.parse(DISCOVERY), client_id: "s6BhdRkqt3", client_secret: "cf136dc3c1fc93f31185e5885805d" }); // blocked
/** A discovery-shaped paste with a token response nested in it. */
const WITH_TOKEN = JSON.stringify({ ...JSON.parse(DISCOVERY), cached: { access_token: "2YotnFZFEjr1zCsicMWpAA", token_type: "Bearer" } }); // RFC 6749 section 4.1.4's example token
/** A discovery-shaped paste carrying a private JWK (RFC 7517 Appendix A.2's EC key). */
const WITH_PRIVATE_JWK = JSON.stringify({ ...JSON.parse(DISCOVERY), jwks: { keys: [{ kty: "EC", crv: "P-256", x: "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4", y: "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM", d: "870MB6gfuTJ4HtUnUvYMyJpr5eUZNP4Bk43bVdj3eAE" }] } }); // blocked
/** An ID token whose header holds an "oct" key (a symmetric secret). */
const PRIVATE_HEADER = `${btoa(JSON.stringify({ alg: "HS256", jwk: { kty: "oct", k: "GawgguFyGrWKav7AX4VKUg" } })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${FULL.split(".")[1]}.sig`; // RFC 7517 A.3's k, base64url

/** The cases. */
const CASES: ShareCases<OidcShareInput, OidcShareState> = {
  spec: OIDC_SHARE, // the spec
  accept: [
    { // a signed ID token: header and claims, and the flag
      id: "id-token-signed", state: state(FULL),
      params: { input: copyOf(FULL), signed: "1" }, restored: { input: copyOf(FULL), signed: true },
      mustNotContain: [FULL], // never the token as pasted
    },
    { // an unsecured ID token is its own copy, with no flag
      id: "id-token-alg-none", state: state(NONE),
      params: { input: NONE }, restored: { input: NONE, signed: false },
    },
    { // a discovery document goes as typed
      id: "discovery-as-typed", state: state(DISCOVERY),
      params: { input: DISCOVERY }, restored: { input: DISCOVERY, signed: false },
    },
    { // a document pasted with blank lines around it and a finding of its own
      id: "discovery-alg-none-spaced", state: state(`\n${DISCOVERY_NONE}\n`),
      params: { input: `\n${DISCOVERY_NONE}\n` }, restored: { input: `\n${DISCOVERY_NONE}\n`, signed: false },
    },
  ],
  empty: [
    { id: "blank", state: { input: "", report: null } }, // nothing typed
    { id: "refused", state: { input: "this is not a token", report: null } }, // the engine refused it
  ],
  blocked: [
    { id: "client-secret", state: state(WITH_SECRET), code: "secret" }, // RFC 7591's client_secret beside the document
    { id: "nested-access-token", state: state(WITH_TOKEN), code: "secret" }, // a token response inside it
    { id: "private-jwk-in-document", state: state(WITH_PRIVATE_JWK), code: "secret" }, // a JWK holding "d"
    { id: "private-key-in-header", state: state(PRIVATE_HEADER), code: "private-key" }, // an oct key's "k" in the header
  ],
  reject: [
    { id: "whole-token", values: { input: FULL, signed: "1" } }, // a signature never opens
    { id: "signed-document", values: { input: DISCOVERY, signed: "1" } }, // a document has no signature
    { id: "signed-alg-none", values: { input: NONE, signed: "1" } }, // an unsecured token was never signed
    { id: "flag-not-1", values: { input: copyOf(FULL), signed: "true" } }, // "1" or absent only
    { id: "document-with-secret", values: { input: WITH_SECRET, signed: null } }, // never a credential
    { id: "not-oidc", values: { input: '{"hello":"world"}', signed: null } }, // the engine refuses it
    { id: "private-key-header-copy", values: { input: copyOf(PRIVATE_HEADER), signed: "1" } }, // never a key
  ],
};

/** The runner. */
export const OIDC_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
