// ============================================================================
// src/lib/tools/http-message-decoder/index.ts
// ----------------------------------------------------------------------------
// THE HTTP MESSAGE DECODER: the self-describing {manifest, run, vectors} triple.
//
// Paste a raw HTTP/1.1 request or response and read it decoded: the request
// line or status line against the registries, every field filed under the part
// of the specification that defines it, the framing decision RFC 9112 makes
// for the body (which of its eight rules, Content-Length against the body,
// Transfer-Encoding overriding it, the chunks decoded with their trailers),
// and the credentials and cookies the message carries, surfaced and masked.
// The decode-only half of an interception proxy's inspector; it never sends,
// replays, tampers or fuzzes (D-53). Local and deterministic.
// ============================================================================

import { run as compute, type HttpMessageInput, type HttpMessageResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { HttpMessageInput, HttpMessageResult, HttpFinding, FieldLine, Framing, ChunkedDecode, Chunk, Credential, CookiePair, SetCookie, Handoff, RequestLine, StatusLine, TargetForm, Severity } from "./compute";
// The size limit and the rule list, for pages that quote them.
export { MESSAGE_MAX_CHARS, RULES } from "./compute";
// The registries, for pages that list them.
export { FIELD_REGISTRY, lookupField, FIELD_REGISTRY_READ_DATE } from "./registry-fields";
export type { FieldGroup, FieldStatus, FieldRecord } from "./registry-fields";
export { STATUS_REGISTRY, lookupStatus, STATUS_REGISTRY_READ_DATE } from "./registry-status";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "HTTP & web",
  // The slug.
  toolSlug: "http-message-decoder",
  // Other names it answers to.
  canonicalAliases: ["http-decoder", "raw-http-decoder", "http-response-decoder", "http-request-decoder", "chunked-decoder", "http-inspector"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 4, pattern: "^(HTTP/\\d(\\.\\d)?\\s+\\d{3}\\b|[A-Z]+\\s+(/|https?://|\\*\\s)\\S*\\s+HTTP/\\d)", example: "{\"message\":\"HTTP/1.1 200 OK\\r\\nContent-Type: text/plain\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n4\\r\\nWiki\\r\\n5\\r\\npedia\\r\\n0\\r\\n\\r\\n\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-replays", "never-fetches", "secrets-masked"],
  // The default for share links: a message routinely carries a cookie or a token, so a share is reviewed first.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/http-message-framing-content-length-and-chunked"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["http-request-translator", "curl-command-explainer", "http-status-code-explainer", "http-methods-comparison", "secure-headers", "jwt", "url-inspector"],
  // Sources, each read live on its access date.
  sources: [
    // RFC 9112: the HTTP/1.1 message syntax and framing.
    { id: "rfc9112", label: "RFC 9112: HTTP/1.1 (message format, request line, status line, field syntax, obsolete line folding, Transfer-Encoding, Content-Length, message body length, chunked transfer coding)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9112.html", access_date: "2026-10-05", scope: "Sections 2.1 and 2.2 (message format, leading empty lines, bare CR, LF alone), 2.3 (HTTP-version), 3 and 3.2 (request line, the four request-target forms, Host required in HTTP/1.1), 4 (status line, reason phrase), 5 and 5.2 (field lines, no whitespace before the colon, obs-fold), 6.1 (Transfer-Encoding, chunked final, HTTP/1.0), 6.3 (the eight message body length rules), 7.1 (chunked coding and its decoding algorithm)", status: "active" },
    // RFC 9110: HTTP semantics.
    { id: "rfc9110", label: "RFC 9110: HTTP Semantics (field names, field order, field values, HTTP-date, Host, Connection, Content-Length, safe and idempotent methods, authentication, status code classes)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9110.html", access_date: "2026-10-05", scope: "Sections 5.1 (field names case-insensitive), 5.3 (combining field lines; the Set-Cookie exception), 5.5 (CR, LF, NUL in values), 5.6.7 (the three HTTP-date formats), 7.2 (Host), 7.6.1 (Connection), 8.6 (Content-Length), 9.2.1 and 9.2.2 (safe and idempotent methods), 11.1 and 11.6.2 (authentication schemes, Authorization), 15 and 15.1 (status code classes, reason phrases as recommendations)", status: "active" },
    // RFC 9111: the caching fields.
    { id: "rfc9111", label: "RFC 9111: HTTP Caching (Age, Cache-Control, Expires, Pragma deprecated, Warning obsoleted)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9111.html", access_date: "2026-10-05", scope: "the caching fields the registry refers to it for, with Pragma deprecated (Section 5.4) and Warning obsoleted (Section 5.5)", status: "active" },
    // The IANA field name registry.
    { id: "iana-fields", label: "IANA: Hypertext Transfer Protocol (HTTP) Field Name Registry (permanent, deprecated and obsoleted rows)", type: "registry", url: "https://www.iana.org/assignments/http-fields/field-names.csv", access_date: "2026-10-05", scope: "the registered field names, their status and their defining reference, used to name each field, mark deprecated and obsoleted ones and tell registered from unregistered", status: "active" },
    // The IANA status code registry.
    { id: "iana-status", label: "IANA: Hypertext Transfer Protocol (HTTP) Status Code Registry", type: "registry", url: "https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv", access_date: "2026-10-05", scope: "the assigned status codes, their descriptions (the recommended reason phrases) and references, used to read the status line and mark unassigned codes", status: "active" },
    // The cookie draft the registry refers to.
    { id: "rfc6265bis", label: "draft-ietf-httpbis-rfc6265bis-22: Cookies: HTTP State Management Mechanism (the registry's reference for Cookie and Set-Cookie)", type: "draft", url: "https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.html", access_date: "2026-10-05", scope: "Set-Cookie and Cookie syntax (Sections 4.1.1 and 4.2.1), the __Secure- and __Host- prefix requirements (4.1.3), SameSite's default of Lax, Secure cookies sent only over secure channels, Max-Age over Expires", status: "active" },
    // Basic authentication.
    { id: "rfc7617", label: "RFC 7617: The 'Basic' HTTP Authentication Scheme", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc7617.html", access_date: "2026-10-05", scope: "credentials are user-id, a colon and the password, Base64-encoded; a user-id cannot contain a colon; the scheme is not a secure method of user authentication and transmits the entity in cleartext", status: "active" },
    // The X- prefix.
    { id: "rfc6648", label: "RFC 6648 (BCP 178): Deprecating the X- Prefix and Similar Constructs in Application Protocols", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc6648.html", access_date: "2026-10-05", scope: "new parameters SHOULD NOT be prefixed with X-; implementations MUST NOT make assumptions about a parameter's status from the prefix", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: HttpMessageInput): HttpMessageResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
