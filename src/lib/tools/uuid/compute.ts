// ============================================================================
// src/lib/tools/uuid/compute.ts
// ----------------------------------------------------------------------------
// UUID v4 + v7 - the compute core for the UUID tool.
//
// Two halves:
//   - inspectUuid() is DETERMINISTIC and SYNC (pure string parsing): given a
//     UUID it reports validity, version, variant, and - for v7 - the embedded
//     48-bit Unix-millisecond timestamp. This is run(), golden-vector-tested.
//   - generateV4()/generateV7() are NON-DETERMINISTIC (crypto.getRandomValues),
//     so they are intentionally excluded from run/vectors.
//
// v4 = 122 random bits. v7 = 48-bit Unix-ms timestamp (most significant, so it
// sorts by time) + 74 random bits. Both carry the version nibble (byte 6 high)
// and the RFC 4122/9562 variant (byte 8 high = 10xx).
// References: RFC 9562 (current), RFC 4122 (original).
// ============================================================================

/** Canonical 8-4-4-4-12 hex form. */
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** The result of inspecting a UUID string. */
export interface UuidInfo {
  uuid: string;
  /** Matches the canonical 8-4-4-4-12 form. */
  valid: boolean;
  /** Version nibble (1-8), or null when invalid. */
  version: number | null;
  /** Human-readable variant, or null when invalid. */
  variant: string | null;
  /** For v7: the embedded Unix timestamp in ms. null otherwise. */
  timestampMs: number | null;
  /** For v7: the embedded timestamp as ISO 8601. null otherwise. */
  timestampIso: string | null;
}

/** Render 16 bytes as a canonical UUID string. */
function bytesToUuid(bytes: Uint8Array): string {
  const h: string[] = [];
  for (let i = 0; i < 16; i++) h.push(bytes[i].toString(16).padStart(2, "0"));
  return (
    `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-` +
    `${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`
  );
}

/**
 * inspectUuid - the deterministic (sync) entry point. Parses a UUID's version,
 * variant, and (for v7) embedded timestamp. Never throws.
 * @param uuid a UUID string
 */
export function inspectUuid(uuid: string): UuidInfo {
  const value = (uuid ?? "").trim();
  if (!UUID_RE.test(value)) {
    return { uuid: value, valid: false, version: null, variant: null, timestampMs: null, timestampIso: null };
  }
  const hex = value.replace(/-/g, "").toLowerCase();
  const version = parseInt(hex[12], 16); // 13th nibble = version
  const variantNibble = parseInt(hex[16], 16); // 17th nibble = variant

  let variant: string;
  if ((variantNibble & 0x8) === 0) variant = "NCS (legacy)";
  else if ((variantNibble & 0xc) === 0x8) variant = "RFC 4122/9562";
  else if ((variantNibble & 0xe) === 0xc) variant = "Microsoft (legacy)";
  else variant = "reserved (future)";

  let timestampMs: number | null = null;
  let timestampIso: string | null = null;
  if (version === 7) {
    // The first 48 bits (12 hex) are the Unix-ms timestamp - within 2^53, so
    // parseInt is exact.
    timestampMs = parseInt(hex.slice(0, 12), 16);
    timestampIso = new Date(timestampMs).toISOString();
  }

  return { uuid: value, valid: true, version, variant, timestampMs, timestampIso };
}

/**
 * generateV4 - a random version-4 UUID (122 random bits). NON-DETERMINISTIC,
 * so excluded from run/golden-vectors.
 */
export function generateV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(bytes);
}

/**
 * generateV7 - a time-ordered version-7 UUID: 48-bit Unix-ms timestamp followed
 * by 74 random bits, so values sort by creation time. NON-DETERMINISTIC, so
 * excluded from run/golden-vectors.
 */
export function generateV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const ms = Date.now();
  // Write the 48-bit millisecond timestamp into bytes 0..5 (big-endian). Uses
  // division, not bit-shifts, because the value exceeds 32 bits.
  bytes[0] = Math.floor(ms / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ms / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ms / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ms / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(bytes);
}
