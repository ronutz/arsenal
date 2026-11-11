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
// THE FLAG IS DRAWN, NEVER STORED. An ISO 3166-1 alpha-2 code picks an SVG flag (CountryFlag.tsx, or the
// vendored files through src/lib/flags.ts); emoji flags are not used, because Windows shows them as letters.
// ============================================================================

/** ISO 3166-1 alpha-2, uppercase. */
export type CountryCode = string;

// flagFor (the regional indicator flag emoji builder) was removed on 2026-11-10 (PRIME 23:50: flags must ALWAYS
// render on any regular browser, and Windows draws flag emoji as two letters). Flags are SVG: CountryFlag.tsx for the
// hand-drawn set, src/lib/flags.ts for the vendored files; scripts/check-no-emoji-flags.mjs keeps emoji flags out.

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
  AE: "United Arab Emirates", // added 2026-10-05: the training clocks (Dubai row) carry a flag per row (PRIME)
  AR: "Argentina", // added 2026-10-05 for the learning page footprints (Microcamp)
  AT: "Austria",
  AU: "Australia",
  BG: "Bulgaria", // added 2026-10-05 for the learning page footprints (Versim)
  BR: "Brazil",
  CA: "Canada",
  CH: "Switzerland",
  CN: "China",
  DE: "Germany",
  DK: "Denmark", // added 2026-10-05: the Ørsted milestone (1820) carried DK with no name and no flag (PRIME)
  ES: "Spain", // added 2026-10-05 for the learning page footprints (Microcamp)
  EU: "European Union", // not a country: the exceptionally reserved ISO 3166 code, used for the Central European Time row of the training clocks (2026-10-05)
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea", // added 2026-10-05 for the training clocks (Seoul row)
  LV: "Latvia",
  MX: "Mexico", // added 2026-10-05 for the learning page footprints (Udemy offices)
  NL: "Netherlands",
  NZ: "New Zealand", // added 2026-10-05 for the training clocks (Auckland row)
  PH: "Philippines", // added 2026-10-05 for the training clocks (Manila row)
  PL: "Poland", // added 2026-10-05: Versim's origin had no name, so the timeline showed a bare PL
  PT: "Portugal", // added 2026-10-05 for the learning page footprints (Microcamp)
  RU: "Russia",
  SE: "Sweden",
  SG: "Singapore", // added 2026-10-05 for the training clocks
  TH: "Thailand", // added 2026-10-05 for the training clocks (Bangkok row)
  TR: "Turkey", // added 2026-10-05 for the learning page footprints (Udemy offices)
  TW: "Taiwan",
  US: "United States",
  ZA: "South Africa", // added 2026-10-05 for the learning page footprints (Kryterion offices)
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
  // Accenture (corrected 2026-11-08: it read IE, its domicile, which this file does not record): the practice began as
  // the consulting division of Arthur Andersen, a Chicago firm founded in 1913, and was constituted in 1989 as Andersen
  // Consulting, a unit of Andersen Worldwide Societe Cooperative, a Swiss coordinating entity; incorporated in Bermuda
  // in 2001 and in Ireland from 2009 (Wikipedia, Accenture and Arthur Andersen; Britannica Money, Accenture; read
  // 2026-11-08). The flag follows where the business was founded and grew, the United States.
  accenture: "US",
  "red-education": "AU",

  // ---- Rest of the world --------------------------------------------------
  "nozomi-networks": "CH",
  audiocodes: "IL",
  hcl: "IN",
  elastic: "NL",
  kaspersky: "RU",
  "check-point": "IL",
  sophos: "GB",
  netcraft: "GB", // Bath, England, 1994; London since 2023 (Wikipedia, Companies House, read 2026-10-06)
  beyondtrust: "US", // Symark, 1985; Atlanta since the 2018 combination (Wikipedia, read 2026-10-06)
  cybereason: "US", // incorporated in Delaware, 2012; Boston from 2014 (Wikipedia, read 2026-10-06)
  levelblue: "US", // Dallas; launched 6 May 2024 (LevelBlue newsroom, read 2026-10-06)
  trustwave: "US", // Chicago, 1995 (Wikipedia, read 2026-10-06)
  spiderlabs: "US", // Trustwave's team, Chicago (Trustwave, 2011, read 2026-10-06)
  // PRIME's batch of 2026-10-06 (07:37, 07:57, 08:03, 08:42), each from the page cited on the record.
  "q1-labs": "CA", // Fredericton, New Brunswick; a University of New Brunswick spinout (Entrevestor, 2011)
  "tivoli-systems": "US", // Austin, Texas (Wikipedia: Tivoli Software)
  "eeye-digital-security": "US", // Irvine, California (socaltech, 2012)
  metageek: "US", // Boise, Idaho (ChannelE2E, 2022)
  oscium: "US", // Oklahoma City (Wikipedia: Oscium; oscium.com/about)
  auvik: "CA", // Waterloo, Ontario (auvik.com/about; ChannelE2E, 2022)
  ekahau: "FI", // Helsinki; University of Helsinki and HIIT researchers (FCAI, 2018)
  tamosoft: "NZ", // Christchurch (tamos.com/about)
  "opennms-group": "US", // The OpenNMS Group; Morrisville, North Carolina at the 2020 sale, Lewisville, Texas today (NantHealth 8-K; opennms.com)
  nagios: "US", // St. Paul, Minnesota (nagios.com/about)
  zabbix: "LV", // Riga, Latvia (Wikipedia: Zabbix; zabbix.com/about says headquarters in Latvia)
  // "grafana-labs" is deliberately ABSENT: founded as Raintank in 2014, and no page read on 2026-10-06 (grafana.com/about,
  // Wikipedia: Grafana, TechCrunch 21 Aug 2024) names the founding country or city. The card renders without a flag, which is
  // the honest reading until a page states it; a guess here would be exactly what this file's header forbids.
  okta: "US", // San Francisco (Wikipedia: Okta, Inc.)
  "hewlett-packard": "US", // Palo Alto, California (Wikipedia: Hewlett-Packard)
  borland: "US", // Scotts Valley, California; the Danish Borland Ltd of 1981 preceded the 1983 US company (Wikipedia: Borland)
  "ashton-tate": "US", // Torrance / Culver City, California (Wikipedia: Ashton-Tate)
  // "nantucket" is deliberately ABSENT for the same reason: the Clipper article read on 2026-10-06 names Nantucket's founders,
  // president and buyer but no country or city of founding. Add the flag when a page states it.
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
  // Coyote Point: its earliest releases (1999, 2000) are datelined Sunnyvale and Santa Clara, California (2026-11-02).
  "coyote-point": "US",
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


  // ---- Added 2026-08-11 with the 30 entries written since the map was last
  // filled. FOUND BY A QUERY, NOT BY A GUARD: PRIME asked for a list of Brazilian
  // VARs and VADs, the answer looked short, and 30 entries turned out to carry no
  // origin at all - so the country toggles were silently omitting them. Quad9 is
  // CH (Swiss-based by design), BlueCat CA, EfficientIP FR, Capgemini FR. ----
  "usp": "BR",
  "unicamp": "BR",
  "fatec": "BR",
  "prodesp": "BR",
  "prodam": "BR",
  "highcast": "BR",
  "ihc-group": "BR",
  "conversys": "BR",
  "gantech": "BR",
  "contacta": "BR",
  "totvs": "BR",
  "microsiga": "BR",
  "bematech": "BR",
  "elgin": "BR",
  "it-one": "BR",
  "proof": "BR",
  "ish": "BR",
  "multiplus": "BR",
  "sisco": "BR",
  "altasnet": "BR",
  "e-safer": "BR",
  "cobra": "BR",
  "ax4b": "BR",
  "opendns": "US",
  "dyn": "US",
  "quad9": "CH",
  "bluecat": "CA",
  "efficientip": "FR",
  "nextdns": "US",
  "capgemini": "FR",

  "wdc": "BR",

  "goldnet": "BR",
  "unentel": "BR",

  "ntsec": "BR",

  "cpm-braxis": "BR",

  "etek-novared": "BR",

  "sek": "BR",
  "neosecure": "CL",
  "proteus": "BR",

  "fast-lane": "DE",
  "global-knowledge": "US",

  "adistec": "US",
  "teltec": "BR",

  "xylan": "US",

  "ruckus": "US",

  "sonda": "CL",

  "tecban": "BR",

  "damovo": "DE",

  "exclusive-networks": "FR",

  "afina": "ES",

  "lanpro": "BR",

  "broadcom": "US",

  "intel": "US",
  "tsmc": "TW",

  "amd": "US",
  "xilinx": "US",

  "marvell": "US",
  "arm": "GB",

  "qualcomm": "US",
  "texas-instruments": "US",
  "raspberry-pi": "GB",

  "oi": "BR",
  "algar-telecom": "BR",

  "d-link": "TW",

  "sagemcom": "FR",

  "procera-networks": "US",

  "quest-software": "US",

  "skytap": "US",
  "readytech": "US",

  "agility": "BR",

  "wztech": "BR",

  "cyble": "US",

  "mude": "BR",

  "q13": "BR",

  "qd7": "BR",

  "penso": "BR",

  "netbr": "BR",

  "seal": "BR",
  "sage-networks": "BR",

  "tecnocomp": "BR",

  // ---- Added 2026-10-05: the three entries written for the credentialed vendors that had none
  // (PRIME 21:44 and 22:17), and the seven training entries of the learning page that never
  // received an origin because they sit outside the industry timeline's guard. Each is the
  // FOUNDING country, as the file's header defines origin; the entries' own sourced intros state
  // them (Polycom: San Francisco; Corvil: Dublin; CommScope: Hickory, North Carolina; StartSe:
  // Minas Gerais; Coursera: Stanford; Udemy: founded in Turkey by its founders' own account but
  // incorporated and headquartered in San Francisco, recorded as US with that note; SANS: United
  // States, 1989; Pluralsight: Farmington, Utah; edX: MIT and Harvard, Cambridge; Alura: São Paulo).
  polycom: "US",
  corvil: "IE",
  commscope: "US",
  startse: "BR",
  coursera: "US",
  udemy: "US", // see the note above: the founders began in Turkey; the company was formed in San Francisco (Wikipedia, read 2026-10-05)
  "sans-institute": "US",
  pluralsight: "US",
  edx: "US",
  alura: "BR",
  // ---- Added 2026-11-08: the Brazil-rooted and Brazil-focused batch of PRIME's list of 08/11/2026. Each is the
  // FOUNDING country, as the file's header defines origin, read from each record's own sourced copy: CI&T,
  // Campinas 1995 (investor FAQ); Sensedia, Campinas 2007 (company history); Radix, Rio de Janeiro 2010
  // (company page and federal registry); IT Forum, a Brazilian licence of Byte in the early 1990s (IT Forum,
  // 20 August 2025); Aranda, São Paulo 1976 (home page); SoftDesign, Porto Alegre 1997 (federal registry).
  "ci-and-t": "BR",
  sensedia: "BR",
  radix: "BR",
  "it-forum": "BR",
  aranda: "BR",
  softdesign: "BR",
  // Encora took its name in Scottsdale, Arizona, in 2020 (AZ Big Media, 4 August 2020); its Brazilian part,
  // Daitan, keeps no record of its own. Recorded as US, the country where the company named Encora was formed.
  encora: "US",
  // Udacity: Mountain View, California, 2011 (Accenture newsroom, 20 May 2024; Wikipedia, read 2026-11-08).
  udacity: "US",
  // Thoughtworks: founded in Chicago in 1993 (thoughtworks.com, About us, read 2026-11-08).
  thoughtworks: "US",
  // ---- Added 2026-11-08: the consultancy and audit networks of PRIME's list of 08/11/2026. Each is the FOUNDING
  // country of the card's own subject, as the file's header defines origin; the records' sourced intros state them.
  // Deloitte: William Welch Deloitte's London office of 1845, the card's own founding.
  deloitte: "GB",
  // EY: Ernst & Young was formed in 1989 by a merger of firms on both sides of the Atlantic (Ernst & Whinney, itself
  // British and American, and Arthur Young); GB is chosen because its oldest component (Harding & Pullein, London) and
  // its coordinating company (Ernst & Young Global Limited, London) are British. A judgement, recorded as one.
  ey: "GB",
  // PwC: formed in 1998 by the merger of Price Waterhouse and Coopers & Lybrand, both of London origin, with the
  // coordinating company PwCIL incorporated in London on 24 June 1998.
  pwc: "GB",
  // McKinsey & Company: Chicago, 1926.
  mckinsey: "US",
  // Boston Consulting Group: Boston, 1963, as a unit of the Boston Safe Deposit and Trust Company.
  bcg: "US",
  // Bain & Company: Boston, 1973.
  bain: "US",
  // Avanade: announced in 2000 with headquarters in the Seattle area.
  avanade: "US",
  // KPMG (added 2026-11-08): formed in 1987 by the merger of Peat Marwick International and Klynveld Main Goerdeler.
  // GB, by the same judgement as EY: its oldest component (William Barclay Peat & Co., London, 1891) and its
  // coordinating company (KPMG International, company 12474966, 15 Canada Square, London) are British.
  kpmg: "GB",
};
