// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/flags.ts
// ----------------------------------------------------------------------------
// COUNTRY FLAGS THAT RENDER EVERYWHERE (PRIME 10/11/2026 23:50: "ALWAYS when you use country flags, you use an
// alternative that ALWAYS renders on ANY regular browser (desktop, mobile)").
//
// Flag emoji are two regional indicator letters, and Windows ships no glyphs for them, so Chrome, Edge and Firefox
// on a Windows desktop show the letters "BR" where a phone shows a flag (the scores pages did exactly that until
// this change). The site therefore draws flags only as SVG: the hand-drawn inline set in src/components/CountryFlag.tsx
// for the industry pages and clocks, and for any other country the vendored flag-icons 4x3 files under
// public/flags/4x3 (MIT, see REUSE.toml), served from this origin with nothing fetched from a third party.
// scripts/check-no-emoji-flags.mjs fails the build if regional indicator flags come back.
//
// The list below is generated from public/flags/4x3 (257 two-letter files, 2026-11-10); "XX" is left out on
// purpose, because it is Cloudflare's "country unknown" and its file is a placeholder, not a flag.
// ============================================================================

/** Every upper-case two-letter code with a flag file under public/flags/4x3. */
const FLAG_FILE_CODES: ReadonlySet<string> = new Set([
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
  "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CP", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DG", "DJ",
  "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "EU", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB",
  "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN",
  "HR", "HT", "HU", "IC", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG",
  "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PC", "PE", "PF",
  "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC",
  "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD",
  "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "UN", "US", "UY",
  "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "XX", "YE", "YT", "ZA", "ZM", "ZW",
]);

/**
 * The flag file for a country code, or null when there is none (an unknown code, Tor's "T1", or "XX").
 *
 * @param code the two-letter code, any case
 * @returns the same-origin path of the 4x3 SVG, or null
 */
export function flagFileFor(code: string | null | undefined): string | null {
  // Nothing to look up.
  if (!code) return null;
  // Codes are stored upper case.
  const up = code.toUpperCase();
  // "XX" means unknown: no flag, by design.
  if (up === "XX" || !FLAG_FILE_CODES.has(up)) return null;
  // The vendored file, lower case on disk.
  return `/flags/4x3/${up.toLowerCase()}.svg`;
}
