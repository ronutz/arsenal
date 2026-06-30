// ============================================================================
// src/lib/tools/f5-ssl-profile-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface of the arsenal-local F5 SSL profile explainer. Pure and
// deterministic; liftable into an open library later.
// ============================================================================

export {
  explainSslProfile,
  run,
  SslProfileInputError,
} from "./compute";

export type {
  SslProfileAnalysis,
  SslField,
  SslFinding,
  CertKeyChain,
  Level,
} from "./compute";

export {
  GOLDEN_VECTOR_SET_ID,
  GOLDEN_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { SslVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "f5-ssl-profile-explainer",
  sources: [
    { id: "f5-clientssl", label: "F5 tmsh — ltm profile client-ssl reference", type: "vendor", url: "https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html", access_date: "2026-06-29", scope: "client-ssl profile fields", status: "active" },
    { id: "f5-serverssl", label: "F5 tmsh — ltm profile server-ssl reference", type: "vendor", url: "https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html", access_date: "2026-06-29", scope: "server-ssl profile fields", status: "active" },
    { id: "rfc5746", label: "RFC 5746 — TLS Renegotiation Indication Extension", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc5746", access_date: "2026-06-29", scope: "secure renegotiation", status: "active" },
    { id: "rfc6066", label: "RFC 6066 — TLS Extensions: Server Name Indication and OCSP stapling", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6066", access_date: "2026-06-29", scope: "SNI, status_request (stapling)", status: "active" },
    { id: "rfc8996", label: "RFC 8996 — Deprecating TLS 1.0 and TLS 1.1", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc8996", access_date: "2026-06-29", scope: "protocol deprecation", status: "active" },
  ],
});
