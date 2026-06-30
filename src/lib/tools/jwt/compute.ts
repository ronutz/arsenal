// ============================================================================
// src/lib/tools/jwt/compute.ts
// ----------------------------------------------------------------------------
// JWT DECODE - the pure compute core for the JWT tool.
//
// the tool contract: a tool is a {manifest, run, vectors} triple and `run`
// must be DETERMINISTIC so its golden vectors are stable. This file is that
// deterministic core: it decodes a compact JWS (header.payload.signature),
// parses the header and payload JSON, and converts the standard NumericDate
// claims (iat/nbf/exp) to ISO strings. It does NOT compute "is this expired
// right now" - that is time-relative and would break golden vectors, so the
// component layers status on top using the current clock. Signature
// verification is also out of scope here (it needs a secret/key and is async);
// the component does HS256 verification via Web Crypto.
//
// Runs identically in the browser and in Node (atob + TextDecoder are global in
// both modern runtimes), so the same module powers the UI today and can be
// lifted into an open library unchanged.
// ============================================================================

/** A NumericDate claim rendered both as its raw epoch and an ISO-8601 string. */
export interface JwtTime {
  /** Seconds since the Unix epoch, exactly as it appears in the token. */
  epoch: number;
  /** The same instant as an ISO-8601 UTC string (deterministic). */
  iso: string;
}

/** The deterministic result of decoding a compact JWS. */
export interface DecodedJwt {
  /** The trimmed input token, echoed back. */
  raw: string;
  /** The three raw base64url segments (signature may be ""). */
  segments: { header: string; payload: string; signature: string };
  /** The parsed JOSE header object. */
  header: Record<string, unknown>;
  /** The parsed claims set (payload) object. */
  payload: Record<string, unknown>;
  /** The raw base64url signature segment ("" for alg:none / detached). */
  signature: string;
  /** Convenience: header.alg if it is a string, else null. */
  alg: string | null;
  /** Convenience: header.typ if it is a string, else null. */
  typ: string | null;
  /** Convenience: header.kid if it is a string, else null. */
  kid: string | null;
  /** The three time claims, converted to {epoch, iso}, or null if absent. */
  times: { iat: JwtTime | null; nbf: JwtTime | null; exp: JwtTime | null };
}

/**
 * Distinct decode failure reasons. The component maps these to localized,
 * friendly messages; the codes themselves never reach the user.
 */
export type JwtDecodeErrorCode = "empty" | "format" | "header" | "payload";

/** A decode error carrying a stable, machine-checkable code. */
export class JwtDecodeError extends Error {
  code: JwtDecodeErrorCode;
  constructor(code: JwtDecodeErrorCode) {
    super(code);
    this.name = "JwtDecodeError";
    this.code = code;
  }
}

/** Decode one base64url segment to raw bytes. Tolerant of missing padding. */
function base64UrlToBytes(segment: string): Uint8Array {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decode one base64url segment to a UTF-8 string (handles unicode claims). */
function base64UrlToString(segment: string): string {
  return new TextDecoder().decode(base64UrlToBytes(segment));
}

/** Convert a NumericDate (seconds) to {epoch, iso}, or null if not a number. */
function toJwtTime(value: unknown): JwtTime | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return { epoch: value, iso: new Date(value * 1000).toISOString() };
}

/** True only for a plain (non-array, non-null) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * decodeJwt - the deterministic entry point.
 * @param input a compact JWS string (header.payload.signature)
 * @returns the decoded structure
 * @throws {JwtDecodeError} with a stable code on any malformed input
 */
export function decodeJwt(input: string): DecodedJwt {
  const token = (input ?? "").trim();
  if (!token) throw new JwtDecodeError("empty");

  const parts = token.split(".");
  // A compact JWS is header.payload.signature. We also accept header.payload
  // (an unsecured pair without the trailing dot) for convenience.
  if (parts.length < 2 || parts.length > 3) throw new JwtDecodeError("format");

  const headerSeg = parts[0];
  const payloadSeg = parts[1];
  const signatureSeg = parts[2] ?? "";

  let header: unknown;
  try {
    header = JSON.parse(base64UrlToString(headerSeg));
  } catch {
    throw new JwtDecodeError("header");
  }
  if (!isPlainObject(header)) throw new JwtDecodeError("header");

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlToString(payloadSeg));
  } catch {
    throw new JwtDecodeError("payload");
  }
  if (!isPlainObject(payload)) throw new JwtDecodeError("payload");

  return {
    raw: token,
    segments: { header: headerSeg, payload: payloadSeg, signature: signatureSeg },
    header,
    payload,
    signature: signatureSeg,
    alg: typeof header.alg === "string" ? header.alg : null,
    typ: typeof header.typ === "string" ? header.typ : null,
    kid: typeof header.kid === "string" ? header.kid : null,
    times: {
      iat: toJwtTime(payload.iat),
      nbf: toJwtTime(payload.nbf),
      exp: toJwtTime(payload.exp),
    },
  };
}
