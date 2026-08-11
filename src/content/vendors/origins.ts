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
 * indicator block.
 *
 * *** RETAINED BUT NO LONGER USED ON THE TIMELINE (PRIME 2026-08-06). ***
 *
 * Flag emoji DO NOT RENDER ON WINDOWS. Microsoft has never shipped country flag
 * glyphs in Segoe UI Emoji, so Chrome, Edge and Firefox on Windows fall back to
 * displaying the two regional indicator letters - a reader on Windows 11 saw
 * "BR" where a reader on macOS saw the Brazilian flag. That is a platform
 * decision, not a font-stack or CSS problem, and no amount of styling fixes it.
 *
 * Since Windows is most of this site's desktop audience, the cards now show the
 * ISO code with the country name beside it, which renders identically
 * everywhere. The function stays because it is correct and costs nothing, and
 * because a future decision to bundle SVG flags would want the code-to-country
 * mapping that sits beside it.
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
 * Country names for the codes this timeline actually uses.
 *
 * ENGLISH SHORT FORMS, deliberately: "United Kingdom" rather than "Great
 * Britain", because GB the ISO code covers the United Kingdom of Great Britain
 * AND Northern Ireland, and Great Britain excludes Northern Ireland. The two
 * are not synonyms and a site that argues about precision elsewhere should not
 * be loose here. Likewise "United States" rather than the full formal name,
 * which appears 108 times on one page and would dominate it.
 */
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  AT: "Austria",
  AU: "Australia",
  BR: "Brazil",
  CA: "Canada",
  CH: "Switzerland",
  CN: "China",
  DE: "Germany",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IT: "Italy",
  JP: "Japan",
  LV: "Latvia",
  NL: "Netherlands",
  RU: "Russia",
  SE: "Sweden",
  TW: "Taiwan",
  US: "United States",
};

/** "BR" -> "BR (Brazil)". Falls back to the bare code if a name is missing. */
export function countryLabel(code: CountryCode): string {
  const name = COUNTRY_NAMES[code];
  return name ? `${code} (${name})` : code;
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


  // ---- Added 2026-08-11 with the 45 entries written since this map was last
  // updated. Every code comes from a source already cited on the entry itself:
  // Baguete for the Brazilian firms, the Pelkey history for the Wave 3 US
  // institutions, and the short descriptions fetched for the contemporary ones.
  // Three new flags were needed and added to CountryFlag: IT, PL and ZA. ----
  "cylk": "BR",
  "tdec": "BR",
  "inlearn": "BR",
  "conviso": "BR",
  "flipside": "BR",
  "tempest": "BR",
  "cipher": "BR",
  "clm": "BR",
  "yssy": "BR",
  "serpro": "BR",
  "dataprev": "BR",
  "nava": "BR",
  "binario": "BR",
  "qos-training": "BR",
  "bbn": "US",
  "nbs-nist": "US",
  "mitre": "US",
  "ungermann-bass": "US",
  "proteon": "US",
  "excelan": "US",
  "wellfleet": "US",
  "synoptics": "US",
  "codex": "US",
  "micom": "US",
  "paradyne": "US",
  "sytek": "US",
  "bridge-communications": "US",
  "firemon": "US",
  "infoblox": "US",
  "proofpoint": "US",
  "barracuda": "US",
  "logrhythm": "US",
  "sailpoint": "US",
  "supermicro": "US",
  "dxc": "US",
  "hughes": "US",
  "spacex": "US",
  "tufin": "IL",
  "algosec": "IL",
  "skybox": "IL",
  "italtel": "IT",
  "atos": "FR",
  "orange": "FR",
  "versim": "PL",
  "dimension-data": "ZA",

};
