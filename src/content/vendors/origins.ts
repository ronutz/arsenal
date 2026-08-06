// ============================================================================
// src/content/vendors/origins.ts
// ----------------------------------------------------------------------------
// COUNTRY OF ORIGIN for every entry on the industry timeline (PRIME 2026-08-06).
//
// WHY A SEPARATE FILE RATHER THAN A FIELD ON EACH ENTRY. partners.ts is already
// several thousand lines of prose, and adding a one-word field to 164 records
// scattered through it would be almost impossible to review. Here the whole map
// is visible at once, which means an error is findable by reading rather than
// by grepping.
//
// *** WHAT "ORIGIN" MEANS HERE, PRECISELY. *** This is where the company was
// FOUNDED, not where it is headquartered today and not who owns it now. Those
// three answers differ for a large share of this timeline and conflating them
// would make the flags actively misleading:
//
//   - Cyclades was founded in Brazil and ended up inside an American company.
//     The flag stays Brazilian, because the entry is about a Brazilian company.
//   - Ubiquiti, Ivanti and others have moved domicile for tax or listing
//     reasons without moving anything else.
//   - Nortel, DEC, Sun and Compaq no longer exist anywhere; the flag records
//     where they were, which is the only honest reading for a historical entry.
//
// Where a company was genuinely founded across two countries, or where the
// sources disagree, the entry carries a comment rather than a confident flag.
//
// THE FLAG IS COMPUTED, NEVER STORED. An ISO 3166-1 alpha-2 code converts to a
// flag by mapping each letter to its regional indicator symbol. Storing the
// emoji instead would mean two representations of one fact that could drift,
// which is the failure this codebase has already had once with the Red
// Education partner list.
// ============================================================================

/** ISO 3166-1 alpha-2, uppercase. */
export type CountryCode = string;

/**
 * Turn "BR" into the flag emoji by offsetting each letter into the regional
 * indicator block. No lookup table, no stored emoji, nothing to keep in step.
 */
export function flagFor(code: CountryCode): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const A = 0x1f1e6; // REGIONAL INDICATOR SYMBOL LETTER A
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65,
  );
}

/**
 * Founding country by entry slug. Every slug on the timeline appears here; a
 * guard fails the build if one is added without an origin, because a card with
 * no flag beside cards that have one reads as an omission rather than a
 * decision.
 */
export const VENDOR_ORIGINS: Record<string, CountryCode> = {
  // ---- Brazil -------------------------------------------------------------
  compugraf: "BR",
  "brazilian-market-reserve": "BR",
  cpqd: "BR",
  "brasil-telecom": "BR",
  "telebras-system": "BR",
  "promon-logicalis": "BR",
  olitel: "BR",
  nv7: "BR",
  niva: "BR",
  parxtech: "BR",
  "ka-solution": "BR",
  microcamp: "BR",
  network1: "BR",
  tivit: "BR",
  stefanini: "BR",
  datacom: "BR",
  // Cyclades was founded in São Paulo in 1989. It was later acquired by Avocent
  // and then Vertiv, both American, and the timeline carries that arc - but the
  // company was Brazilian and the flag says so.
  "cyclades-avocent-vertiv": "BR",

  // ---- United States ------------------------------------------------------
  nutanix: "US",
  openai: "US",
  anthropic: "US",
  "google-search": "US",
  sixdegrees: "US",
  genesys: "US",
  arcsight: "US",
  honeywell: "US",
  datadog: "US",
  // Dynatrace was founded in Linz in 2005 and is Austrian in origin, whatever
  // the current listing says.
  dynatrace: "AT",
  veeam: "CH", // (see Switzerland block; Veeam was founded by Russian founders and incorporated in Baar)
  anixter: "US",
  cloudshare: "IL",
  kryterion: "US",
  "ec-council": "US",
  offsec: "US",
  prometric: "US",
  credly: "US",
  "pearson-vue": "US",
  kentik: "US",
  brightcloud: "US",
  "websense-forcepoint": "US",
  usrobotics: "US",
  "ixia-keysight": "US",
  "arrow-electronics": "US",
  "tech-data-synnex": "US",
  "ingram-micro": "US",
  scansource: "US",
  "westcon-comstor": "US",
  equinix: "US",
  kyndryl: "US",
  comptia: "US",
  freeradius: "US",
  lotus: "US",
  qualys: "US",
  illumio: "US",
  apple: "US",
  solarwinds: "US",
  tenable: "US",
  rapid7: "US",
  "lumen-centurylink-level3": "US",
  akamai: "US",
  cloudflare: "US",
  f5: "US",
  fortinet: "US",
  netskope: "US",
  "ping-identity": "US",
  zscaler: "US",
  extreme: "US",
  "pulse-secure": "US",
  cisco: "US",
  "palo-alto": "US",
  "netscreen-juniper": "US",
  "cabletron-enterasys": "US",
  riverstone: "US",
  ironport: "US",
  "tandy-radioshack": "US",
  crowdstrike: "US",
  splunk: "US",
  netapp: "US",
  ivanti: "US",
  emc: "US",
  eds: "US",
  altavista: "US",
  apache: "US",
  arista: "US",
  avaya: "US",
  aws: "US",
  microsoft: "US",
  mobileiron: "US",
  "red-hat": "US",
  riverbed: "US",
  symantec: "US",
  "hpe-juniper-aruba": "US",
  "brocade-broadcom": "US",
  "mcafee-fireeye-trellix": "US",
  versa: "US",
  "sun-microsystems": "US",
  "silicon-graphics": "US",
  xerox: "US",
  dec: "US",
  novell: "US",
  oracle: "US",
  ibm: "US",
  "3com": "US",
  compaq: "US",
  netscape: "US",
  motorola: "US",
  unisys: "US",
  "data-general": "US",
  wang: "US",
  tandem: "US",
  banyan: "US",
  "bell-labs-lucent-alcatel": "US",
  "intel-amd": "US",
  rand: "US",
  ncsa: "US",
  ciena: "US",
  "sniffer-lineage": "US",
  dolch: "US",
  "blue-coat-packeteer": "US",
  "dell-force10": "US",
  fluke: "US",
  "dns-bind": "US",
  "http-gopher": "US",
  nvidia: "US",
  ubiquiti: "US",
  "access-home-fleet": "US",
  watchguard: "US",
  a10: "US",
  "red-education": "AU",

  // ---- Rest of the world --------------------------------------------------
  accenture: "IE", // Andersen Consulting's successor; incorporated Bermuda 2001, Dublin from 2009
  "nozomi-networks": "CH",
  audiocodes: "IL",
  hcl: "IN",
  elastic: "NL",
  kaspersky: "RU",
  "check-point": "IL",
  sophos: "GB",
  getronics: "NL",
  cyberark: "IL",
  epi: "NL",
  paessler: "DE",
  mikrotik: "LV",
  radware: "IL",
  "imperva-thales": "US",
  "nortel-bay": "CA",
  madge: "GB",
  nokia: "FI",
  ericsson: "SE",
  huawei: "CN",
  siemens: "DE",
  sap: "DE",
  marconi: "GB",
  fujitsu: "JP",
  nec: "JP",
  "cyclades-network": "FR", // the French research network, distinct from the Brazilian company
  toshiba: "JP",
  hitachi: "JP",
  bull: "FR",
  zte: "CN",
  kemp: "IE",
  "asus-askey": "TW",
  netgear: "US",
  "tp-link": "CN",
  zyxel: "TW",
  "allied-telesis": "JP",
};
