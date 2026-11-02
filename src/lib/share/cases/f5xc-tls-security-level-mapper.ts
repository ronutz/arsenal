// ============================================================================
// src/lib/share/cases/f5xc-tls-security-level-mapper.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC TLS security-level mapper (2026-11-01, wave 4B): the
// level's button carries the level, the cipher's button the cipher line once
// a cipher in it is recognised; a link may carry both; an unknown level, a
// blank line or neither name is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TLS_MAPPER_SHARE, type TlsMapperShareState } from "../../tools/f5xc-tls-security-level-mapper/share"; // the spec

/** The page's Example cipher line. */
const EXAMPLE_QUERY = "TLSv1.0  (0xc013)  ECDHE-RSA-AES128-SHA"; // as the component holds it

/** The cases. */
export const F5XC_TLS_MAPPER_SHARE_CASES = defineShareCases<TlsMapperShareState, TlsMapperShareState>({
  spec: TLS_MAPPER_SHARE, // the spec
  accept: [
    { id: "level-high", state: { level: "High" }, params: { level: "High" }, restored: { level: "High" } }, // the page as it opens
    { id: "level-low", state: { level: "Low" }, params: { level: "Low" }, restored: { level: "Low" } }, // another level
    { id: "cipher-example", state: { input: EXAMPLE_QUERY }, params: { input: EXAMPLE_QUERY }, restored: { input: EXAMPLE_QUERY } }, // the Example line, as typed
    { id: "cipher-iana", state: { input: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" }, params: { input: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" }, restored: { input: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" } }, // an IANA name
  ],
  arrive: [
    { id: "both-by-hand", values: { level: "Medium", input: EXAMPLE_QUERY }, restored: { level: "Medium", input: EXAMPLE_QUERY } }, // a link written by hand may carry both
  ],
  empty: [
    { id: "nothing", state: {} }, // neither
    { id: "blank-cipher", state: { input: "  " } }, // nothing typed
    { id: "unknown-cipher", state: { input: "NOT-A-CIPHER" } }, // nothing recognised: the page says so
  ],
  blocked: [],
  reject: [
    { id: "neither", values: { level: null, input: null } }, // nothing to set
    { id: "unknown-level", values: { level: "Ultra", input: null } }, // not a level
    { id: "lower-level", values: { level: "high", input: null } }, // ids are exact
    { id: "blank-input", values: { level: null, input: " " } }, // white space
  ],
});
