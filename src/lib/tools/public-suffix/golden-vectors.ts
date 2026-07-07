// ============================================================================
// src/lib/tools/public-suffix/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Public Suffix / registered-domain tool
// (set id: "public-suffix/golden@1").
//
// Anchored on cases straight from the publicsuffix.org algorithm test suite:
//   - a plain gTLD (example.com),
//   - a multi-label eTLD (a.b.example.co.uk -> example.co.uk),
//   - a wildcard rule (*.ck),
//   - an exception rule (!www.ck; the exception drops the leftmost label so the
//     public suffix becomes "ck" and www.ck is registrable),
//   - a PRIVATE-section suffix (github.io) with the divergent ICANN-only view,
//   - a punycode IDN host,
//   - and non-domain inputs (empty / IPv4 / IPv6) as reject vectors.
// Values below mirror exactly what compute.run() returns for each host.
// ============================================================================

import type { PublicSuffixResult } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "public-suffix/golden@1";

/** A success case: `input.host` must produce a result matching `expected`. */
export interface PublicSuffixGoldenVector {
  name: string;
  input: { host: string };
  expected: PublicSuffixResult;
}

/** A case whose result must not be a resolved domain (kind !== "domain"). */
export interface PublicSuffixRejectVector {
  name: string;
  input: { host: string };
  expectedKind: PublicSuffixResult["kind"];
}

export const PUBLIC_SUFFIX_GOLDEN_VECTORS: PublicSuffixGoldenVector[] = [
  {
    name: "plain-gtld",
    input: { host: "example.com" },
    expected: {
      input: "example.com", kind: "domain", publicSuffix: "com",
      registrableDomain: "example.com", subdomain: "", section: "icann",
      rule: "com", isException: false, hostIsPublicSuffix: false, icann: null,
    },
  },
  {
    name: "subdomains-share-registered-domain",
    input: { host: "www.api.example.com" },
    expected: {
      input: "www.api.example.com", kind: "domain", publicSuffix: "com",
      registrableDomain: "example.com", subdomain: "www.api", section: "icann",
      rule: "com", isException: false, hostIsPublicSuffix: false, icann: null,
    },
  },
  {
    name: "multi-label-etld",
    input: { host: "a.b.example.co.uk" },
    expected: {
      input: "a.b.example.co.uk", kind: "domain", publicSuffix: "co.uk",
      registrableDomain: "example.co.uk", subdomain: "a.b", section: "icann",
      rule: "co.uk", isException: false, hostIsPublicSuffix: false, icann: null,
    },
  },
  {
    name: "wildcard-rule",
    input: { host: "foo.bar.ck" },
    expected: {
      input: "foo.bar.ck", kind: "domain", publicSuffix: "bar.ck",
      registrableDomain: "foo.bar.ck", subdomain: "", section: "icann",
      rule: "*.ck", isException: false, hostIsPublicSuffix: false, icann: null,
    },
  },
  {
    name: "exception-rule",
    input: { host: "www.ck" },
    expected: {
      input: "www.ck", kind: "domain", publicSuffix: "ck",
      registrableDomain: "www.ck", subdomain: "", section: "icann",
      rule: "!www.ck", isException: true, hostIsPublicSuffix: false, icann: null,
    },
  },
  {
    name: "private-section-with-icann-view",
    input: { host: "user.github.io" },
    expected: {
      input: "user.github.io", kind: "domain", publicSuffix: "github.io",
      registrableDomain: "user.github.io", subdomain: "", section: "private",
      rule: "github.io", isException: false, hostIsPublicSuffix: false,
      icann: { publicSuffix: "io", registrableDomain: "github.io" },
    },
  },
  {
    name: "wildcard-input-stripped",
    input: { host: "*.example.com" },
    expected: {
      input: "example.com", kind: "domain", publicSuffix: "com",
      registrableDomain: "example.com", subdomain: "", section: "icann",
      rule: "com", isException: false, hostIsPublicSuffix: false, icann: null,
      note: "Analysed the base name after the leading \"*.\" wildcard label.",
    },
  },
  {
    name: "punycode-idn",
    input: { host: "xn--mnchen-3ya.de" },
    expected: {
      input: "xn--mnchen-3ya.de", kind: "domain", publicSuffix: "de",
      registrableDomain: "xn--mnchen-3ya.de", subdomain: "", section: "icann",
      rule: "de", isException: false, hostIsPublicSuffix: false, icann: null,
    },
  },
];

export const PUBLIC_SUFFIX_REJECT_VECTORS: PublicSuffixRejectVector[] = [
  { name: "empty", input: { host: "" }, expectedKind: "invalid" },
  { name: "ipv4", input: { host: "192.168.0.1" }, expectedKind: "ipv4" },
  { name: "ipv6", input: { host: "2001:db8::1" }, expectedKind: "ipv6" },
];
