// ============================================================================
// src/lib/share/cases/x509.ts
// ----------------------------------------------------------------------------
// Share cases of the X.509 decoder: the certificate goes as pasted, as the
// #input= handoff usePrefill already reads; a paste that also holds a private
// key gets no link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { X509_SHARE, type X509ShareState } from "../../tools/x509/share"; // the spec
import { X509_GOLDEN_VECTORS } from "../../tools/x509/golden-vectors"; // the tool's own vectors

/** The RSA leaf (the Example's certificate). */
const LEAF = X509_GOLDEN_VECTORS.find((v) => v.id === "rsa-leaf")!.pem; // pinned there
/** The EC CA certificate. */
const EC_CA = X509_GOLDEN_VECTORS.find((v) => v.id === "ec-ca")!.pem; // pinned there
/** A PKCS #8 private key block (RFC 7468 section 10's label; the body is a placeholder, never a key). */
const PKCS8 = "-----BEGIN PRIVATE KEY-----\nTk9ULUEtUkVBTC1LRVktb25seS1hLWxhYmVs\n-----END PRIVATE KEY-----"; // the label is what matters

/** The cases. */
export const X509_SHARE_CASES = defineShareCases<X509ShareState, X509ShareState>({
  spec: X509_SHARE, // the spec
  accept: [
    { id: "rsa-leaf", state: { input: LEAF }, params: { input: LEAF }, restored: { input: LEAF } }, // PEM with line breaks, "+", "/" and "="
    { id: "ec-ca-crlf", state: { input: EC_CA.replace(/\n/g, "\r\n") }, params: { input: EC_CA.replace(/\n/g, "\r\n") }, restored: { input: EC_CA.replace(/\n/g, "\r\n") } }, // CR LF kept
    { id: "public-key-block-is-fine", state: { input: `${LEAF}\n-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----` }, params: { input: `${LEAF}\n-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----` }, restored: { input: `${LEAF}\n-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----` } }, // a public key is not a secret
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no paste
    { id: "white-space", state: { input: " \n" } }, // nothing but white space
  ],
  blocked: [
    { id: "pkcs8-key", state: { input: `${PKCS8}\n${LEAF}` }, code: "private-key" }, // a combined PEM file
    { id: "rsa-traditional", state: { input: `${LEAF}\n-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\n-----END RSA PRIVATE KEY-----` }, code: "private-key" }, // OpenSSL's traditional form
    { id: "encrypted-pkcs8", state: { input: `-----BEGIN ENCRYPTED PRIVATE KEY-----\nAAAA\n-----END ENCRYPTED PRIVATE KEY-----\n${LEAF}` }, code: "private-key" }, // RFC 7468 section 11
    { id: "openssh", state: { input: `${LEAF}\n-----BEGIN OPENSSH PRIVATE KEY-----\nAAAA\n-----END OPENSSH PRIVATE KEY-----` }, code: "private-key" }, // OpenSSH's form
    { id: "openpgp", state: { input: `${LEAF}\n-----BEGIN PGP PRIVATE KEY BLOCK-----\nAAAA\n-----END PGP PRIVATE KEY BLOCK-----` }, code: "private-key" }, // OpenPGP's armour (RFC 4880 section 6.2)
    { id: "pgp2-secret", state: { input: `-----BEGIN PGP SECRET KEY BLOCK-----\nAAAA\n-----END PGP SECRET KEY BLOCK-----\n${LEAF}` }, code: "private-key" }, // PGP 2.x's label (RFC 4880 section 6.2)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
