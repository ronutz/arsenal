// ============================================================================
// src/lib/tools/http-message-decoder/registry-status.ts
// ----------------------------------------------------------------------------
// THE IANA HTTP STATUS CODE REGISTRY, read 2026-10-05 from
// https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv.
// The description column is the registry's own text (the reason phrase RFC 9110
// recommends, or the registering document's name for the code); the reference
// column is kept as written. Unassigned ranges are not rows: an unassigned code
// is reported by its class, as RFC 9110 Section 15 asks a client to treat it.
// ============================================================================

/** One registry row. */
export interface StatusRecord {
  /** The code. */
  code: number;
  /** The registry's description (the recommended reason phrase). */
  description: string;
  /** The registry's reference. */
  reference: string;
}

/** The rows, in registry order. */
export const STATUS_REGISTRY: readonly StatusRecord[] = [
  { code: 100, description: "Continue", reference: "RFC9110" },
  { code: 101, description: "Switching Protocols", reference: "RFC9110" },
  { code: 102, description: "Processing", reference: "RFC2518" },
  { code: 103, description: "Early Hints", reference: "RFC8297" },
  { code: 104, description: "Upload Resumption Supported (TEMPORARY - registered 2024-11-13, extension registered 2025-09-15, expires 2026-11-13)", reference: "draft-ietf-httpbis-resumable-upload-05" },
  { code: 200, description: "OK", reference: "RFC9110" },
  { code: 201, description: "Created", reference: "RFC9110" },
  { code: 202, description: "Accepted", reference: "RFC9110" },
  { code: 203, description: "Non-Authoritative Information", reference: "RFC9110" },
  { code: 204, description: "No Content", reference: "RFC9110" },
  { code: 205, description: "Reset Content", reference: "RFC9110" },
  { code: 206, description: "Partial Content", reference: "RFC9110" },
  { code: 207, description: "Multi-Status", reference: "RFC4918" },
  { code: 208, description: "Already Reported", reference: "RFC5842" },
  { code: 226, description: "IM Used", reference: "RFC3229" },
  { code: 300, description: "Multiple Choices", reference: "RFC9110" },
  { code: 301, description: "Moved Permanently", reference: "RFC9110" },
  { code: 302, description: "Found", reference: "RFC9110" },
  { code: 303, description: "See Other", reference: "RFC9110" },
  { code: 304, description: "Not Modified", reference: "RFC9110" },
  { code: 305, description: "Use Proxy", reference: "RFC9110" },
  { code: 306, description: "(Unused)", reference: "RFC9110" },
  { code: 307, description: "Temporary Redirect", reference: "RFC9110" },
  { code: 308, description: "Permanent Redirect", reference: "RFC9110" },
  { code: 400, description: "Bad Request", reference: "RFC9110" },
  { code: 401, description: "Unauthorized", reference: "RFC9110" },
  { code: 402, description: "Payment Required", reference: "RFC9110" },
  { code: 403, description: "Forbidden", reference: "RFC9110" },
  { code: 404, description: "Not Found", reference: "RFC9110" },
  { code: 405, description: "Method Not Allowed", reference: "RFC9110" },
  { code: 406, description: "Not Acceptable", reference: "RFC9110" },
  { code: 407, description: "Proxy Authentication Required", reference: "RFC9110" },
  { code: 408, description: "Request Timeout", reference: "RFC9110" },
  { code: 409, description: "Conflict", reference: "RFC9110" },
  { code: 410, description: "Gone", reference: "RFC9110" },
  { code: 411, description: "Length Required", reference: "RFC9110" },
  { code: 412, description: "Precondition Failed", reference: "RFC9110" },
  { code: 413, description: "Content Too Large", reference: "RFC9110" },
  { code: 414, description: "URI Too Long", reference: "RFC9110" },
  { code: 415, description: "Unsupported Media Type", reference: "RFC9110" },
  { code: 416, description: "Range Not Satisfiable", reference: "RFC9110" },
  { code: 417, description: "Expectation Failed", reference: "RFC9110" },
  { code: 418, description: "(Unused)", reference: "RFC9110" },
  { code: 421, description: "Misdirected Request", reference: "RFC9110" },
  { code: 422, description: "Unprocessable Content", reference: "RFC9110" },
  { code: 423, description: "Locked", reference: "RFC4918" },
  { code: 424, description: "Failed Dependency", reference: "RFC4918" },
  { code: 425, description: "Too Early", reference: "RFC8470" },
  { code: 426, description: "Upgrade Required", reference: "RFC9110" },
  { code: 428, description: "Precondition Required", reference: "RFC6585" },
  { code: 429, description: "Too Many Requests", reference: "RFC6585" },
  { code: 431, description: "Request Header Fields Too Large", reference: "RFC6585" },
  { code: 451, description: "Unavailable For Legal Reasons", reference: "RFC7725" },
  { code: 500, description: "Internal Server Error", reference: "RFC9110" },
  { code: 501, description: "Not Implemented", reference: "RFC9110" },
  { code: 502, description: "Bad Gateway", reference: "RFC9110" },
  { code: 503, description: "Service Unavailable", reference: "RFC9110" },
  { code: 504, description: "Gateway Timeout", reference: "RFC9110" },
  { code: 505, description: "HTTP Version Not Supported", reference: "RFC9110" },
  { code: 506, description: "Variant Also Negotiates", reference: "RFC2295" },
  { code: 507, description: "Insufficient Storage", reference: "RFC4918" },
  { code: 508, description: "Loop Detected", reference: "RFC5842" },
  { code: 510, description: "Not Extended (OBSOLETED)", reference: "RFC2774; Status change of HTTP experiments to Historic" },
  { code: 511, description: "Network Authentication Required", reference: "RFC6585" },
];

/** By code. */
const BY_CODE: Map<number, StatusRecord> = new Map(STATUS_REGISTRY.map((s) => [s.code, s]));

/** The registry row for a code, or undefined when the code is unassigned. */
export function lookupStatus(code: number): StatusRecord | undefined {
  // Direct lookup.
  return BY_CODE.get(code);
}

/** The date the registry was read. */
export const STATUS_REGISTRY_READ_DATE = "2026-10-05";
