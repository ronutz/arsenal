// ============================================================================
// src/lib/share/cases/cert-chain-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the certificate chain builder: the certificates go as
// pasted, with the chosen "as of" date; a combined PEM file with its key gets
// no link; a date the date field cannot hold makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CERT_CHAIN_BUILDER_SHARE, type CertChainBuilderShareState } from "../../tools/cert-chain-builder/share"; // the spec
import { GOLDEN_VECTORS } from "../../tools/cert-chain-builder/golden-vectors"; // the tool's own vectors

/** Leaf and intermediate, the normal TLS configuration (vector anchor-omitted). */
const CHAIN = GOLDEN_VECTORS.find((v) => v.id === "anchor-omitted")!.input.text; // pinned there
/** That vector's instant, as a date: what the page's "as of" field holds. */
const AS_OF = (GOLDEN_VECTORS.find((v) => v.id === "anchor-omitted")!.input.now ?? "").slice(0, 10); // 2026-10-04

/** The cases. */
export const CERT_CHAIN_BUILDER_SHARE_CASES = defineShareCases<CertChainBuilderShareState, CertChainBuilderShareState>({
  spec: CERT_CHAIN_BUILDER_SHARE, // the spec
  accept: [
    { id: "with-date", state: { certs: CHAIN, asOf: AS_OF }, params: { certs: CHAIN, asof: AS_OF }, restored: { certs: CHAIN, asOf: AS_OF } }, // the date travels
    { id: "clock", state: { certs: CHAIN, asOf: "" }, params: { certs: CHAIN }, restored: { certs: CHAIN, asOf: "" } }, // no date: the opener's clock
  ],
  arrive: [
    { id: "no-date", values: { certs: "x", asof: null }, restored: { certs: "x", asOf: "" } }, // absent date: the clock
  ],
  empty: [
    { id: "nothing", state: { certs: "", asOf: AS_OF } }, // no paste, even with a date
  ],
  blocked: [
    { id: "combined-pem", state: { certs: `${CHAIN}\n-----BEGIN EC PRIVATE KEY-----\nAAAA\n-----END EC PRIVATE KEY-----`, asOf: "" }, code: "private-key" }, // fullchain and key in one file
  ],
  reject: [
    { id: "no-certs", values: { certs: null, asof: AS_OF } }, // a date alone
    { id: "bad-date-form", values: { certs: CHAIN, asof: "04/10/2026" } }, // not the field's form
    { id: "not-a-day", values: { certs: CHAIN, asof: "2026-02-30" } }, // no such day
    { id: "blank-certs", values: { certs: "   ", asof: null } }, // nothing but spaces
  ],
});
