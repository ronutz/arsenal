// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: CC-BY-4.0

// ============================================================================
// ORGANISATIONS REACHED THROUGH EARLIER EMPLOYERS
//
// Supplied by PRIME on 31/08/2026 and attributed, at his instruction, as work
// delivered THROUGH EARLIER EMPLOYERS — the vendors, distributors, resellers
// and integrators he worked for between 1996 and 2020. They are not clients of
// Mindstream, and nothing here is a current commercial relationship.
//
// PROVENANCE: this is the author's own account of where his work landed. Unlike
// the vendor entries on this page, which carry published citations, an
// engagement reached through an employer leaves no public record that could be
// cited — the contract was between two other parties. The page says so in its
// own words rather than implying a sourcing standard it cannot meet.
//
// The names are recorded as organisations whose networks the work touched. No
// endorsement is claimed in either direction, no project is described, and
// nothing is said about scope, dates or outcomes, because none of that is the
// author's to publish.
//
// SPELLING: official orthography, not colloquial — "Petrobras" carries no
// accent in the company's own name, and "NIC.br" capitalises as the registry
// writes it.
// ============================================================================

/** An organisation reached through an employer, and how it was reached. */
export interface ServedOrganisation {
  /** The organisation's own name, in its official spelling. */
  readonly name: string;
}

/**
 * End customers: reached while working for vendors, and through distributors
 * and resellers, with the service delivered to the customer's own network.
 */
export const SERVED_END_CUSTOMERS: readonly ServedOrganisation[] = [
  { name: "Unicamp" },
  { name: "USP" },
  { name: "Serpro" },
  { name: "Prodesp" },
  { name: "Prodam" },
  { name: "Petrobras" },
  { name: "Embraer" },
  { name: "Tecban" },
  { name: "CPqD" },
  { name: "Oi" },
  { name: "Brasil Telecom" },
  { name: "NIC.br" },
] as const;

/**
 * Partners: integrators, resellers and service providers reached through the
 * vendors and distributors, where the partner rather than the end customer was
 * the party being served.
 */
export const SERVED_PARTNERS: readonly ServedOrganisation[] = [
  { name: "Contacta" },
  { name: "Promon" },
  { name: "Logicalis" },
  { name: "Agility" },
  { name: "Teltec" },
  { name: "Parxtech" },
  { name: "TDec" },
  { name: "CYLK" },
  { name: "ISH" },
  { name: "Nava" },
  { name: "Yssy" },
  { name: "Cipher" },
  { name: "IT One" },
  { name: "HighCast" },
  { name: "Tivit" },
  { name: "Niva" },
  { name: "NTSec" },
  { name: "Proof" },
  { name: "NV7" },
  { name: "Multiplus" },
] as const;
