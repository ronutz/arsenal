// ============================================================================
// src/lib/tools/oui-lookup/compute.ts
// ----------------------------------------------------------------------------
// MAC / OUI analysis. Pure logic: it normalizes a MAC address in any common
// format, extracts the 24-bit OUI, and reads the two significant bits of the
// first octet (unicast vs multicast, universally vs locally administered). The
// vendor lookup is injected as a function so this module never imports the large
// OUI dataset - callers pass a lookup backed by the snapshot (server/tests) or a
// lazy-loaded copy (the client component).
// ============================================================================

export interface OuiResult {
  ok: boolean;
  input: string;
  /** Normalized hex (6, 12, or 16 digits), uppercase, no separators. */
  hex?: string;
  /** Colon-formatted full address, e.g. 00:11:22:33:44:55. */
  formatted?: string;
  /** The 24-bit OUI as 6 hex digits. */
  oui?: string;
  ouiFormatted?: string;
  /** Registered organization, or null when unknown / not applicable. */
  vendor?: string | null;
  /** I/G bit: true = multicast (group), false = unicast. */
  multicast?: boolean;
  /** U/L bit: true = locally administered (no manufacturer). */
  local?: boolean;
  /** The input was a bare OUI (3 bytes) rather than a full MAC. */
  isOuiOnly?: boolean;
  notes?: string[];
  error?: { message: string };
}

const HEX_RE = /^[0-9a-f]+$/i;

/** Strip common separators (colon, hyphen, dot, whitespace); validate hex. */
function cleanHex(input: string): string | null {
  const h = input.replace(/[\s:.\-]/g, "").toUpperCase();
  if (!h || !HEX_RE.test(h)) return null;
  return h;
}

/** Group a hex string into colon-separated byte pairs. */
function formatPairs(hex: string): string {
  return (hex.match(/.{1,2}/g) ?? []).join(":");
}

/**
 * Parse and classify a MAC or OUI without touching vendor data. Accepts a full
 * MAC-48/EUI-48 (12 hex), an EUI-64 (16 hex), or a bare OUI (6 hex), in colon,
 * hyphen, dot (Cisco 0011.2233.4455), or unseparated form.
 */
export function normalizeMac(input: string): OuiResult {
  const s = input.trim();
  if (!s) return { ok: false, input: s, error: { message: "Enter a MAC address or OUI." } };
  const hex = cleanHex(s);
  if (!hex) {
    return {
      ok: false,
      input: s,
      error: { message: "That is not valid hex. Use a MAC address, optionally separated by colons, hyphens, or dots." },
    };
  }
  if (hex.length !== 6 && hex.length !== 12 && hex.length !== 16) {
    return {
      ok: false,
      input: s,
      error: { message: `A MAC is 12 hex digits (16 for EUI-64) and an OUI is 6; got ${hex.length}.` },
    };
  }
  const oui = hex.slice(0, 6);
  const b0 = parseInt(hex.slice(0, 2), 16);
  return {
    ok: true,
    input: s,
    hex,
    formatted: formatPairs(hex),
    oui,
    ouiFormatted: formatPairs(oui),
    multicast: (b0 & 0x01) !== 0,
    local: (b0 & 0x02) !== 0,
    isOuiOnly: hex.length === 6,
  };
}

/**
 * Full analysis: normalize, then resolve the vendor via the injected lookup.
 * A locally administered address has no manufacturer, so the lookup is skipped
 * and a note explains why.
 */
export function analyzeMac(input: string, lookup: (oui: string) => string | null): OuiResult {
  const base = normalizeMac(input);
  if (!base.ok) return base;

  const notes: string[] = [];
  let vendor: string | null = null;

  if (base.local) {
    notes.push(
      "This is a locally administered address (the U/L bit is set): it was assigned by software, not by a manufacturer, so it has no OUI vendor.",
    );
  } else {
    vendor = lookup(base.oui as string);
    if (!vendor) {
      notes.push(
        "This OUI is not in the IEEE MA-L snapshot. It may be unassigned, newer than the snapshot, or from the MA-M / MA-S registries this tool does not yet include.",
      );
    }
  }
  if (base.multicast) {
    notes.push("The I/G bit is set, so this is a multicast (group) address rather than a single interface.");
  }

  return { ...base, vendor, notes };
}
