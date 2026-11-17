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
  NO: "Norway", // added 2026-11-17 for nordic-semiconductor (Industry wave J3); the vendored flag file exists (src/lib/flags.ts)
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
  // ---- Industry wave I2 (16/11/2026): Brazilian financial-market records. Origin = where FOUNDED. ----
  // B3: the Bovespa began as the Bolsa Livre of São Paulo brokers (1890) and BM&F as the Bolsa de Mercadorias de São
  // Paulo (1986) (B3 Formulário de Referência 2024, item 1.1, read 2026-11-16); the founding place of the 2017
  // combination itself is not stated by any page read, and every predecessor named is Brazilian.
  "b3": "BR",
  // CERC: a Brazilian company authorized by the Banco Central do Brasil, head office at Avenida Paulista 37, São Paulo
  // (cerc.inf.br home, read 2026-11-16); the city of its 2015 founding is not stated by any page read.
  "cerc": "BR",
  // A5X: a Brazilian derivatives exchange project; its release of 14 September 2026 is datelined São Paulo (a5x.com.br,
  // read 2026-11-16); the place of the company's constitution is not stated by any page read.
  "a5x": "BR",
  // Base Exchange: based in Rio de Janeiro (Capital Aberto, 5 March 2025, read 2026-11-16) and grown from the Brazilian
  // Americas Trading Group (Reuters via Money Times, 6 February 2023); the place of constitution is not stated.
  "base-exchange": "BR",
  // BSM Supervisão de Mercados: a Brazilian civil association constituted to supervise the markets B3 administers
  // (bsmsupervisao.com.br, Quem Somos, read 2026-11-16); the city of its 2007 constitution is not stated.
  "bsm-supervisao-de-mercados": "BR",
  // CM Capital: established in Madrid in 1986 and in São Paulo in 1998 (Compagnie Financière Tradition release of
  // 3 December 2010); "1986 CM Capital was founded in Spain" (mkt.cmcapital.com.br/hft); both read 2026-11-16.
  "cm-capital": "ES",
  // RTM: created in 1997 by Andima (now ANBIMA) to interconnect the Brazilian financial sector, first on the Rio-São Paulo
  // axis (rtm.net.br, Institucional, read 2026-11-16); the city of its founding is not stated.
  "rtm": "BR",
  // Cedro Technologies: founded in 2005 as a start-up from a laboratory at the Universidade Federal de Uberlândia
  // (cedrotech.com, Sobre nós, read 2026-11-16).
  "cedro-technologies": "BR",
  // Intelitrader: founded in 2011 by a former BM&F and BM&FBovespa professional (intelitrader.com.br, Sobre nós, read
  // 2026-11-16); the founding place is NOT stated by any page read, the integrator decides.
  "intelitrader": "BR",
  // Inoa Sistemas: listed by B3 as INOA SISTEMAS LTDA, a Brazilian limited company (B3 certified-solution lists, read
  // 2026-11-16); the founding place is NOT stated by any page read, the integrator decides.
  "inoa-sistemas": "BR",
  // Bloomberg: founded 1981 as Innovative Market Systems by former Salomon Brothers people, the first terminals delivered to Merrill Lynch (IEEE Spectrum, 30 September 2026); Wikipedia: headquartered in Midtown Manhattan. The founding CITY is not stated on either page.
  bloomberg: "US",
  // Charles River Development: "the Burlington, Massachusetts company" (Bloomberg News, 2018, fetch tool only) and headquartered in Burlington (State Street presentation, 20 July 2018). The founding place itself is not stated.
  "charles-river-development": "US",
  // FlexTrade: NOT SOURCED. The about page gives no founding place; the contact page lists Great Neck and New York first among its offices. The code rests on that list only.
  flextrade: "US",
  // Fidessa: incorporated on 6 August 1996 as Royalblue Group plc on the UK register (Companies House, company 03234176); registered office in Woking, Surrey, until 3 December 2018 (filing history).
  fidessa: "GB",
  // Raptor Trading Systems: NOT SOURCED as a founding place. Founded 2003 and headquartered in New York (raptortrading.com/company); the code rests on the headquarters.
  "raptor-trading-systems": "US",
  // TORA: NOT SOURCED. LSEG's release gives 2004 and "an established presence in Asia and North America"; LSEG's Annual Report 2022 lists the acquired holding company, Tora Holdings, Inc., as a USA company. The code rests on that holding company's country only; the integrator decides.
  tora: "US",
  // Broadridge: Broadridge Financial Solutions, Inc. incorporated in Delaware on 29 March 2007, from ADP's brokerage services business (Form 10-K for fiscal 2007).
  broadridge: "US",
  // Eze Software: "Boston-based Eze Software" (SS&C release, 1 October 2018). The founding place itself is not stated.
  "eze-software": "US",
  // BlackRock Aladdin: BlackRock's own platform; BlackRock was founded in 1988 (BlackRock history page), place not stated on the page read. The code rests on BlackRock being a US company filing a Form 10-K, not on a stated founding place.
  "blackrock-aladdin": "US",
  // ---- Added 2026-11-16: Industry wave I4 (trading networks, colocation and measurement). Each is the FOUNDING
  // country of the card's own subject, as the file's header defines origin; where no page read states the founding
  // place, the comment says so and gives the nearest sourced fact (the integrator decides; REPORT.md lists them).
  // Pico: founding place not stated by any page read; FIA MarketVoice (26 July 2019) calls it "New York-based" and its
  // releases are datelined New York (2019 to 2026). Recorded as US on that basis, not on a founding statement.
  pico: "US",
  // Beeks Group: Beeks Financial Cloud Limited, incorporated 3 June 2010, "is incorporated and domiciled in Scotland";
  // the group "is headquartered in Glasgow" (AIM admission document, 21 November 2017, read 2026-11-16).
  "beeks-group": "GB",
  // Endace: no page read names the founding place; its 2016 buyout release says it "has once again become a wholly
  // New Zealand owned and operated company", and Emulex's 2013 compulsory acquisition ran under the New Zealand
  // Takeovers Code (Endace, 11 March 2016; Emulex 8-K exhibit, 1 April 2013; both read 2026-11-16).
  endace: "NZ",
  // cPacket Networks: founding place not stated; in 2011 "a start-up based in Mountain View, California" (Converge
  // Digest, 4 May 2011, read 2026-11-16). Recorded as US on that basis.
  "cpacket-networks": "US",
  // Metamako: "Metamako, founded in 2013, is based in Sydney, Australia" (PR Newswire, 7 December 2017) and Arista's
  // 10-Q calls it "Headquartered in Sydney, Australia" (both read 2026-11-16); "based in", not "founded in", Sydney.
  metamako: "AU",
  // Exablaze: "a privately held, Australia-based designer and manufacturer" (Cisco, 16 December 2019); spun off from
  // Zomojo, launched in May 2013 (WatersTechnology, 22 October 2013); Exablaze Pty Ltd, Australia (Cisco 10-K exhibit
  // 21.1, 2020); all read 2026-11-16. The founding place itself is not stated.
  exablaze: "AU",
  // Spread Networks: "Ridgeland, Miss.-based startup" (WatersTechnology, 16 August 2010, read 2026-11-16); the founding
  // place itself is not stated.
  "spread-networks": "US",
  // McKay Brothers: founding place NOT SOURCED. The trademarks belong to McKay Brothers, LLC and its releases are
  // datelined Oakland, California (2013 to 2024); recorded as US on that basis only (REPORT.md).
  "mckay-brothers": "US",
  // TNS: "TNS is founded in the USA to provide services to the Point of Sale (POS) industry" (TNS, About Our History,
  // 1990 entry, read 2026-11-16).
  tns: "US",
  // IPC Systems: founding place NOT SOURCED; headquartered in Jersey City, New Jersey (Silver Lake, 1 December 2014;
  // SVP release, 9 January 2024; both read 2026-11-16). Recorded as US on that basis only (REPORT.md).
  "ipc-systems": "US",
  // ---- Industry wave I1 (exchanges and their operators), 16/11/2026: where each company was FOUNDED. ----
  // NYSE: the Buttonwood Agreement of 1792 and the 1817 New York Stock & Exchange Board at 40 Wall Street, New York (NYSE, The History of NYSE, read 2026-11-16).
  nyse: "US",
  // LME: formally established in 1877 in Lombard Court, City of London (HKEX and LME research report, 8 July 2020, read 2026-11-16).
  lme: "GB",
  // Nasdaq: founded in 1971 as a subsidiary of the National Association of Securities Dealers, a US body; the founding city is not stated (Nasdaq Form 10-K for 2025; SEC Historical Society, read 2026-11-16). Country inferred from the US association that built it; flagged in REPORT.md.
  nasdaq: "US",
  // Cboe: the Chicago Board Options Exchange opened in Chicago on 26 April 1973 (Cboe, The Creation of Listed Options at Cboe, read 2026-11-16).
  cboe: "US",
  // Eurex: founded in 1998 by Deutsche Börse (Frankfurt) and the Swiss Stock Exchange as "the world's first cross-border futures exchange" (Deutsche Börse company history, read 2026-11-16). Genuinely two countries; DE chosen for the owner and the German predecessor DTB, flagged in REPORT.md for the integrator (CH is the other half).
  eurex: "DE",
  // SIX Swiss Exchange: formed in 1993 from the Geneva, Basel and Zurich exchanges, based in Zurich (Wikipedia, SIX Swiss Exchange, read 2026-11-16).
  "six-swiss-exchange": "CH",
  // ICE: founded in 2000; the founding city is not stated in the sources read, which give headquarters in Atlanta, Georgia and New York (ICE Form 10-K for 2025, read 2026-11-16). Flagged in REPORT.md.
  ice: "US",
  // CME Group: formed in Chicago on 12 July 2007 by the CME and CBOT merger, headquarters 20 S. Wacker Drive (merger release reposted by Mondo Visione, read 2026-11-16).
  "cme-group": "US",
  // LSEG: created in October 2007 when the London Stock Exchange merged with Borsa Italiana (LSEG, The history of LSEG, read 2026-11-16). Two countries in the merger; GB for the London exchange that names the group and keeps it, Borsa Italiana having been sold to Euronext in 2021. Flagged in REPORT.md.
  lseg: "GB",
  // TMX Group: the Toronto Stock Exchange's 1852 association of Toronto businessmen and the 2008 combination with the Montreal Exchange (TMX Group History at a Glance, read 2026-11-16).
  "tmx-group": "CA",
  // IEX: founded in 2012; the founding city is not stated in the sources read; a US national securities exchange approved by the SEC in 2016, its POP recorded in Secaucus, New Jersey (iex.io/about; SEC Release 34-78101, read 2026-11-16). Flagged in REPORT.md.
  iex: "US",
  // ---- Added 2026-11-16 (industry wave I5: post-trade, market data, regulation and standards). Origin is where the
  // card's own subject was FOUNDED (the file's header), sourced as each comment says.
  // DTCC: formed in 1999 as a New York corporation by DTC and NSCC (SEC Release 34-41786, 24 August 1999).
  dtcc: "US",
  // SIAC: founded in 1972 as a subsidiary of the New York Stock Exchange and the American Stock Exchange (NYSE Group 8-K
  // and press release of 25 October 2006); both founders were New York exchanges. The city of incorporation is not stated.
  siac: "US",
  // DataCT: NOT SOURCED. DataCT LLC's place of formation is stated nowhere read; its affiliate DataBP LLC is "a Delaware
  // based company" (datact.com, read 2026-11-16) and DataCT administers a United States plan. US is a judgement; the
  // integrator decides.
  datact: "US",
  // EuroCTP: EuroCTP B.V., a Dutch company incorporated on 23 August 2024 (EuroCTP release, Amsterdam, 5 December 2024);
  // ESMA: "a joint venture based in the Netherlands".
  euroctp: "NL",
  // Ediphy: founded 2018 by its own account; the active Ediphy companies on the UK register (from 10 March 2017) are
  // registered in England and Wales at 88 Wood Street, London (Companies House; ediphy.io/about). The founding city is
  // not stated by the company; GB rests on the register.
  ediphy: "GB",
  // Etrading Software: founded in 2004 and headquartered in London (LDC case study); Etrading Software Limited
  // incorporated in England on 22 September 2004 (Companies House 05237988).
  "etrading-software": "GB",
  // Consolidated Audit Trail, LLC: the plan's original company was "formed under Delaware state law" by the United States
  // exchanges and FINRA, and CAT LLC replaced it on 29 August 2019 (SEC Release 34-105003, 16 March 2026); CAT LLC's
  // own state of formation is not stated in the order. US either way.
  "consolidated-audit-trail": "US",
  // FINRA: formed in 2007 by the consolidation of NASD and NYSE member regulation, approved by the SEC in Washington on
  // 26 July 2007 (SEC press release 2007-151); the NASD it renamed registered with the SEC in 1939.
  finra: "US",
  // FIA: "founded in 1955 in New York as the Association of Commodity Exchange Firms" (fia.org/about).
  fia: "US",
  // FIX Trading Community: the brand of FIX Protocol Ltd, incorporated in the United Kingdom on 23 April 1999 (Companies
  // House 03760285). The protocol itself began as an experiment between Fidelity and Salomon Brothers (The TRADE,
  // 29 October 2020), whose place the source does not state; the card's subject is the UK company, so GB.
  "fix-trading-community": "GB",
  // ---- Added 2026-11-16: brokers and trading firms (industry wave I6). Each is the FOUNDING country of the card's
  // own subject, as the file's header defines origin, read from the records' own sources (read 2026-11-16).
  // TP ICAP: formed in London in 2016 when Tullett Prebon plc (155 Bishopsgate, London) bought ICAP's voice
  // business, and its heritage is a City of London broker of 1866 (TP ICAP, Our Heritage; Tullett Prebon Brasil,
  // History). The listed holding company has been registered in Jersey since 2021; that is domicile, not origin.
  "tp-icap": "GB",
  // Instinet: "founded in 1969 and ... continuously headquartered in New York since then" (Instinet Group, 10-K for
  // 2001, SEC EDGAR).
  instinet: "US",
  // Nomura: incorporated in Japan on 25 December 1925 from the securities division of The Osaka Nomura Bank (Nomura
  // Holdings, 20-F for the year ended 31 March 2026); the founder's money-changing business was in Osaka.
  nomura: "JP",
  // Virtu Financial: the founding PLACE is not stated by a source read. The 2015 prospectus dates the founding to
  // 2008 (Virtu East, founded by Vincent Viola), gives a New York headquarters, and the holding company was formed
  // in Delaware in 2013; recorded as US on that basis, for the integrator to confirm.
  "virtu-financial": "US",
  // Optiver: "a global market maker founded in Amsterdam ... Established in 1986" (Optiver, results for 2025,
  // 31 March 2026).
  optiver: "NL",
  // Citadel Securities: the founding PLACE is not stated by a source read. Sequoia dates the firm to 2002; the
  // broker-dealer is a Delaware limited liability company registered with the SEC, with a Miami address today
  // (EDGAR); recorded as US on that basis, for the integrator to confirm.
  "citadel-securities": "US",
  // ---- Added 2026-11-17: Industry wave J1 (hacking-gear makers and shops). Each is the FOUNDING country of the
  // card's own subject, as the file's header defines origin; where no page read states the founding place, the
  // comment says so and gives the nearest sourced fact (the integrator decides; the J1 report lists them). Two
  // records have no sourced place at all and are left as commented proposals for the integrator.
  // Hak5: founding place NOT stated. Hak5 LLC gives Dallas, Texas, and San Francisco addresses (hak5.org, read
  // 2026-11-17); the HAK5 mark, first used 5 August 2005, is registered to Darren Kitchen, a United States citizen,
  // at a San Francisco address (USPTO serial 87390067, read 2026-11-17). Recorded as US on that basis.
  hak5: "US",
  // Flipper Devices: SOURCES DISAGREE. The corporation is organized in Delaware (USPTO registration 6,660,671, filed
  // 18 August 2020, which also gives it an office in Moscow); TechCrunch (26 June 2023) says the company "started in
  // Russia in 2020", and the company's correction in the same article says it is not Russian. Recorded as US, the
  // place of incorporation, following the Veeam precedent in this file (incorporated in Baar, recorded CH); RU is the
  // alternative reading. Integrator to decide.
  "flipper-devices": "US",
  // Great Scott Gadgets: "Great Scott Gadgets, LLC", a limited liability company organized in Colorado (USPTO serial
  // 97471012, read 2026-11-17). Organization state, not a founding statement.
  "great-scott-gadgets": "US",
  // Mischief Gadgets: founding place NOT stated; "MISCHIEF GADGETS LLC", 548 Market Street, San Francisco
  // (mischiefgadgets.com, read 2026-11-17). Recorded as US on the address only.
  "mischief-gadgets": "US",
  // Lab401: "Lab401 (ETOILE 401 SAS) is an EU-Registered entity in France" (lab401.com FAQ); ETOILE 401, SAS created
  // 23 October 2020, seat Lyon (French State company search, SIRENE data); both read 2026-11-17. The place of the
  // 2016 establishment itself is not stated.
  lab401: "FR",
  // Hacker Warehouse: founding place NOT stated; owned and operated by Godai Group LLC, located in San Francisco and
  // Santa Ana, California (hackerwarehouse.com/about-us, read 2026-11-17). Recorded as US on that basis.
  "hacker-warehouse": "US",
  // High Code: the four Brazilian students "fundado a empresa High Code nos Estados Unidos" (Desbugados, 27 November
  // 2025, read 2026-11-17). Recorded as US, where the company was founded; the founders are Brazilian (BR is the
  // alternative reading if the integrator prefers the team's country).
  "high-code": "US",
  // JustCallMeKoko: founding place NOT SOURCED. "JustCallMeKoko LLC" (shop footer, read 2026-11-17) names no state or
  // country; no page read gives a location. Left for the integrator; US would rest only on the "LLC" form.
  // "justcallmekoko": "US",
  // ShareBrained Technology: founding place NOT stated; "we're located in a US state that has no sales tax"
  // (sharebrained.com/about, read 2026-11-17). Recorded as US on that location statement.
  "sharebrained-technology": "US",
  // RTL-SDR Blog: founding place NOT SOURCED. Its shop ships from "our warehouse in China" (rtl-sdr.com, read
  // 2026-11-17), which is a warehouse, not a founding place; no entity, founder or address was found. Left for the
  // integrator.
  // "rtl-sdr-blog": "??",
  // M5Stack: "Founded in China in 2017"; headquartered in Shenzhen (M5Stack Corporate Overview, 31 July 2025, read
  // 2026-11-17).
  m5stack: "CN",
  // LILYGO: founding place NOT stated; legal name Shenzhen Xinyuan Electronic Technology Co., Ltd, address in
  // Bantian, Longgang, Shenzhen (lilygo.cc/pages/about-us, read 2026-11-17). Recorded as CN on that basis.
  lilygo: "CN",
  // ---- Added 2026-11-17: Industry wave J2 (security research labs and testing firms). Each is the FOUNDING country
  // of the card's own subject, as the file's header defines origin; where no page read states the founding place,
  // the comment says so and gives the nearest sourced fact (the integrator decides; the J2 REPORT lists them).
  // SRLabs: "a hacking think tank in Berlin, working since 2010" (srlabs.de/about) and "from Berlin roots to a global
  // team" (SRLabs research index, A decade of hacking, 11 August 2020); both read 2026-11-17.
  srlabs: "DE",
  // Riscure: founding place NOT stated by any page read. "Delft-based security tools vendor Riscure" (Bits&Chips,
  // 18 February 2020) and "Riscure B.V.", country "The Netherlands, US and China" (ITEA pitch, 25 May 2023); both read
  // 2026-11-17. Recorded as NL on that basis.
  riscure: "NL",
  // Kasper & Oswald: founded in 2012 by Timo Kasper and David Oswald, a spin-off of the Chair for Embedded Security at
  // Ruhr University Bochum (informatik.rub.de spin-offs page); registered at the Amtsgericht Bochum, HRB 14184
  // (kasper-oswald.de imprint); both read 2026-11-17.
  "kasper-oswald": "DE",
  // RFID Research Group: founding place NOT SOURCED. proxmark.com says only "a company formed by four people
  // instrumental to the Proxmark 3"; its ChameleonUltra README lists distributors in six countries and an AliExpress
  // store, none of which is a founding place. Left out; the integrator decides.
  // "rfid-research-group": "??",
  // Kismet Wireless: founding place NOT SOURCED. An open-source project written by Mike Kershaw since 2001 (SharkFest
  // 2019 slides); no page read says where. Left out; the integrator decides.
  // "kismet-wireless": "??",
  // Bastille Networks: "an Atlanta-based startup ... The company was founded in April 2014" (CMSWire, 6 August 2015,
  // read 2026-11-17).
  "bastille-networks": "US",
  // Coalfire: founding place NOT stated ("Founded in 2001", Apax release of 13 December 2019, datelined Westminster,
  // Colorado and New York); Coalfire Labs is "a security firm based in Westminster, Colo." (KrebsOnSecurity, 31 January
  // 2020); both read 2026-11-17. Recorded as US on that basis.
  coalfire: "US",
  // EXPLIoT: founding place NOT stated. The company named in expliot.io's footer is "EXPLIoT BV", KvK number 92449530,
  // The Hague (read 2026-11-17 through the fetch tool), a Dutch legal form; the framework's author, Aseem Jakhar,
  // co-founded Payatu in Pune, India (payatu.com/about-us, read 2026-11-17). Recorded as NL for the BV; IN is the
  // alternative if the integrator reads the brand as Payatu's.
  expliot: "NL",
  // ---- Added 2026-11-17: Industry wave J3 (chips, cards and radios). Each is the FOUNDING country of the card's own
  // subject, as the file's header defines origin; where no page read states the founding place, the comment says so
  // and gives the nearest sourced fact (the integrator decides; the agent's REPORT lists them).
  // Espressif Systems: "April 2008, Espressif Systems Founded: Espressif Systems' headquarters are inaugurated in
  // Shanghai, China, at ZhangJiang Hi-Tech Park" (Espressif, Milestones, read 2026-11-17).
  "espressif-systems": "CN",
  // Microchip Technology: "incorporated in Delaware in 1989" (Form 10-K, fiscal 2026) and formed that year in connection
  // with a licence from General Instrument (Form 10-K, fiscal 1997), executive offices in Chandler, Arizona; the
  // founding place itself is not stated. Recorded as US on the incorporation.
  "microchip-technology": "US",
  // NXP Semiconductors: incorporated in the Netherlands on 2 August 2006 as KASLION Acquisition B.V. (IPO prospectus,
  // 6 August 2010); corporate seat in Eindhoven (Form 10-K for 2025); both read 2026-11-17.
  "nxp-semiconductors": "NL",
  // STMicroelectronics: formed and incorporated in 1987 from the Italian SGS Microelettronica and the French Thomson
  // Semiconducteurs, organized under Dutch law with its legal seat in Amsterdam (Form 20-F for 2025, read 2026-11-17).
  // Genuinely two founding countries (IT and FR) in a Dutch company, headquartered in Geneva; NL chosen for the
  // company that was formed, flagged in the REPORT for the integrator (IT and FR are the two halves).
  stmicroelectronics: "NL",
  // Nordic Semiconductor: "Nordic was established in 1983, headquartered in Norway" (About us, fetch tool) and "a
  // Norwegian company" in Trondheim; the Brønnøysund Register places Nordic Semiconductor ASA in Trondheim (both read
  // 2026-11-17). NOTE: "NO" (Norway) is NOT in COUNTRY_NAMES yet; the integrator adds NO: "Norway" (the vendored
  // flag file for NO exists in src/lib/flags.ts).
  "nordic-semiconductor": "NO",
  // HID Global: "In 1991, Hughes Identification Devices (HID) was created in the USA as a subsidiary of Hughes Aircraft
  // Company" (ASSA ABLOY interim report, 13 November 2000, read 2026-11-17).
  "hid-global": "US",
  // Ettus Research: founding place NOT SOURCED. Ettus Research LLC "started in a garage" (Matt Ettus, 5 February 2010)
  // and was acquired by National Instruments Corporation of Austin, Texas; recorded as US on that basis only.
  "ettus-research": "US",
  // Parallax: "The story starts in Sacramento, California"; "He and longtime friend Lance Walley formed Parallax in
  // 1987"; "Parallax began in a California apartment" (Parallax, Our Story, read 2026-11-17).
  parallax: "US",
  // SEGGER: "founded in 1992 by Rolf Segger in Hilden, Germany" (Wikipedia, read 2026-11-17); SEGGER's own history
  // gives 1992 and a move to Hilden in 1997, without naming the first town. Germany either way.
  segger: "DE",
  // ---- Added 2026-11-17: hardware-security toolmakers (industry wave J4). Each is the FOUNDING country of the card's
  // own subject, as the file's header defines origin, read from the records' own sources (read 2026-11-17). Where a
  // source states only the state of organization or today's base, the comment says so, for the integrator to confirm.
  // Grand Idea Studio: "a technology development, licensing, and consulting firm based in Portland, Oregon. Founded in
  // 2002 by Joe Grand" (Grand Idea Studio, About); the corporation is organized in Massachusetts (USPTO owner record,
  // JTAGULATOR; Oregon Secretary of State, foreign business corporation, jurisdiction MA). The founding CITY is not
  // stated; both states are in the United States.
  "grand-idea-studio": "US",
  // Saleae: the founders registered an LLC under the name in 2005 (Saleae Support, How Do You Pronounce Saleae?);
  // Saleae, Inc. is a Delaware corporation in South San Francisco (USPTO owner records, SALEAE). The founding place is
  // not stated beyond that; recorded as US on that basis.
  saleae: "US",
  // Dangerous Prototypes: "Ian started DangerousPrototypes.com in 2009" (its About page, which also gives Where Labs,
  // LLC an address in Muscatine, Iowa); Where Labs LLC is organized in Iowa (USPTO, BUS PIRATE, 2026). The founding
  // place of the venture itself is not stated; recorded as US on the company's Iowa organization.
  "dangerous-prototypes": "US",
  // Xipiter: XIPITER LLC, a domestic New York limited liability company, initial filing 22 September 2010, county New
  // York (New York Department of State).
  xipiter: "US",
  // Securing Hardware: HARDWARE SECURITY RESOURCES, LLC, a domestic Oregon limited liability company registered on
  // 1 February 2013 in Portland (Oregon Secretary of State); SecuringHardware.com is its assumed business name.
  "securing-hardware": "US",
  // lowRISC: "2014 lowRISC is founded in Cambridge, UK as a spin-off from the University of Cambridge" (lowRISC,
  // History); Companies House 09272283, incorporated 20 October 2014.
  lowrisc: "GB",
  // NewAE Technology: "NewAE Technology Inc. is a Canadian company", with products made in Nova Scotia (NewAE, About);
  // its founder lives in Nova Scotia (Colin O'Flynn, About Me). No Canadian registry record was read.
  "newae-technology": "CA",
};
