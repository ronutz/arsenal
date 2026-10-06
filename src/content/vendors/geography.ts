// ============================================================================
// src/content/vendors/geography.ts
// ----------------------------------------------------------------------------
// WHERE THE LEARNING COMPANIES ARE, AND WHERE THEY WORK (PRIME 2026-10-05 22:20).
//
// PRIME: "In /industry/learning/ the cards need a flag indicating founding/HQ
// and its current activity geography (e.g. Red Education is Global). If unknown
// and not easily obtainable, leave activity = HQ, pending further research for
// international expansion/activity."
//
// Two facts per company, kept apart because they are different facts:
//
//   hq      WHERE THE COMPANY SITS TODAY: the headquarters country, and the city
//           when a source states it. Not the founding country, which origins.ts
//           records as "origin" and which the card shows as its flag. The two
//           usually agree; CloudShare (Tel Aviv to Denver) and Fast Lane (a
//           German founding, an American head office) are the reasons they are
//           separate fields.
//
//   scope   WHERE IT WORKS TODAY. Three values, deliberately coarse, because a
//           finer scale would demand research the sources do not support:
//             global         several continents, by the company's own account
//             international  named countries or regions beyond the HQ country,
//                            listed in `where`
//             national       the HQ country only
//
//   pending TRUE when no source states the footprint and the card shows the HQ
//           country as the activity BY DEFAULT, as PRIME ruled. The card marks
//           it, and the guard (scripts/check-learning-geography.mjs) requires
//           every pending row to be national, so a default can never read as a
//           sourced "global".
//
// EVERY ROW CITES ITS SOURCE. A footprint is a dated claim about a real company,
// so each row carries the page it was read from and the date, rendered on the
// learning page under the cards (the fields-are-read guard would flag a source
// nobody can see, and PRIME's standard says sources are published, not kept).
// Where a company's own industry entry already states the fact in sourced
// prose, that entry's source is cited again here rather than a new one.
//
// WHY A SEPARATE FILE. Same reason as origins.ts: thirty-seven rows visible at
// once can be reviewed by reading; thirty-seven fields scattered through
// partners.ts cannot.
// ============================================================================
import type { CountryCode } from "./origins";

/** A region named in a footprint; the labels live in the learning_page.geo.regions messages. */
export type RegionKey = "latinAmerica" | "mercosur" | "asiaPacific";

/** Where a company is active, as the three coarse values the header explains. */
export type ActivityScope = "global" | "international" | "national";

/** One company's geography: headquarters, footprint, and the source for both. */
export interface CompanyGeography {
  /** Headquarters today: the ISO 3166-1 alpha-2 country, and the city when a source names it. */
  hq: { country: CountryCode; city?: string };
  /** Where it works today. */
  scope: ActivityScope;
  /** The named countries and regions behind an `international` scope; unset otherwise. */
  where?: { countries?: CountryCode[]; regions?: RegionKey[] };
  /** True when the footprint is unsourced and the card shows the HQ country by default (PRIME's rule). */
  pending?: boolean;
  /** The page the headquarters and footprint were read from, with the date, published under the cards. */
  source: { label: string; url: string };
}

/**
 * Geography by entry slug, for every entry tagged "training" (the population of
 * /industry/learning). The guard fails the build when a training entry has no
 * row here, so a new learning company cannot ship without its flag.
 */
export const LEARNING_GEOGRAPHY: Record<string, CompanyGeography> = {
  // ---- Authorised training centres and delivery partners ------------------
  "red-education": {
    hq: { country: "AU", city: "Sydney" },
    scope: "global",
    source: { label: "Red Education: founded in Sydney in 2005; vendor-accredited training across Asia Pacific, the Americas, Europe, India and the Middle East (the entry's sourced profile; rededucation.com read 2026-10-05)", url: "https://www.rededucation.com/" },
  },
  "global-knowledge": {
    hq: { country: "US", city: "Cary, North Carolina" },
    scope: "global",
    source: { label: "Global Knowledge, About us: \"Our U.S.-based corporate headquarters is located in Cary, North Carolina\"; 15 offices around the world, in Belgium, Canada, Denmark, Egypt, France, Ireland, the Netherlands, Norway, Qatar, Saudi Arabia, Spain, Sweden, the UAE, the UK and the US, with partners in Colombia, India and Mexico (read 2026-10-05)", url: "https://www.globalknowledge.com/us-en/company/about-us/" },
  },
  "fast-lane": {
    // Founded in Germany (origins.ts: DE); the group's head office is in North Carolina per the profile the entry cites.
    hq: { country: "US", city: "Morrisville, North Carolina" },
    scope: "global",
    source: { label: "CB Insights profile cited by the entry: Fast Lane founded 1996, headquarters Morrisville, North Carolina; Fast Lane's own awards page: ranked among the top 20 IT training companies worldwide every year since 2008, Cisco Learning Partner of the Year in regions including LATAM and Global (read 2026-10-05)", url: "https://www.cbinsights.com/company/fast-lane-1" },
  },
  inlearn: {
    hq: { country: "BR", city: "Barueri, São Paulo" },
    scope: "national",
    source: { label: "Monitor CNPJ: INLEARN EDUCACAO LTDA, Barueri/SP (the entry's source); the company presents Brazilian delivery of the vendors' courses (inlearn.com.br, read 2026-10-05)", url: "https://monitorcnpj.com.br/cnpj/05042433000123/" },
  },
  "ka-solution": {
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    source: { label: "Ka Solution: training and consultancy in São Paulo since 1993, two São Paulo locations, the largest official SAP training centre in Latin America by its own account (the entry's sourced profile, read 2026-10-05)", url: "https://www.kasolution.com.br/Home" },
  },
  versim: {
    hq: { country: "PL", city: "Poznań" },
    scope: "international",
    where: { countries: ["BG"] },
    source: { label: "Versim, About us: on the Polish market since 2005, headquartered at ul. Jasielska 10, Poznań; authorised Extreme Networks distributor for Poland (2017) and for Bulgaria (2023) (read 2026-10-05)", url: "https://www.versim.pl/o-nas/" },
  },
  ntsec: {
    hq: { country: "BR", city: "Brasília" },
    scope: "national",
    source: { label: "NTSec Group: head office in Brasília, branches in eight Brazilian states, close to four hundred specialists (the entry's sourced profile, read 2026-10-05)", url: "https://grupontsec.com.br/br/sobre/" },
  },
  "ihc-group": {
    // The group's companies register in Barueri (InLearn) and São Paulo (CYLK); no single head-office city is stated.
    hq: { country: "BR" },
    scope: "national",
    source: { label: "Grupo IHC history published by CYLK: HighCast (2003), inLearn (2008) and CYLK (2010), all Brazilian, serving Brazilian enterprises (the entry's source, read 2026-10-05)", url: "https://www.cylk.com.br/grupo-ihc/" },
  },
  lanpro: {
    hq: { country: "BR", city: "São Paulo" },
    scope: "international",
    where: { regions: ["mercosur"] },
    source: { label: "LAN Professional (LWS Comércio e Serviços em Informática), Rua Bacaetava 35, Brooklin, São Paulo; distributed Cabletron and Enterasys across Brazil and Mercosur, and from 2005 was the authorised training centre for Brazil and Mercosur for F5 Networks and IronPort (the entry's sourced profile; a historical footprint, the company having ceased trading)", url: "https://www.trustdobrasil.com.br/smart/modulos/arquivos/arquivos/plano-de-recuperacao-judicial-apresentado-pelas-recuperandas_475-22.pdf" },
  },
  "qos-training": {
    hq: { country: "BR", city: "São Paulo" },
    scope: "international",
    where: { regions: ["latinAmerica"] },
    source: { label: "QoS, the professional-services division of Grupo Binario: a Juniper training centre for Latin America, delivering the manufacturer's certification courses since 2006 (the entry's sourced profile, read 2026-10-05)", url: "https://www.segs.com.br/2016/info-ti/16355-qos-empresa-do-grupo-binario-oferece-certificacao-juniper-na-mesma-data-do-treinamento" },
  },
  binario: {
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    source: { label: "Grupo Binario: created in São Paulo in 2005, implementing networks for the major Brazilian operators, around 160 staff across five branches (the entry's sourced profile, read 2026-10-05)", url: "https://www.binario.net/quem-somos/" },
  },
  flipside: {
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    source: { label: "Flipside privacy policy: Flipside Treinamento Editora e Comércio LTDA, headquartered on Avenida Paulista, São Paulo; Roadsec toured Brazilian cities (the entry's sources, read 2026-10-05)", url: "https://www.roadsec.com.br/" },
  },
  microcamp: {
    hq: { country: "BR", city: "Campinas" },
    scope: "international",
    where: { countries: ["PT", "ES", "AR"] },
    source: { label: "Microcamp: moved to Campinas in 1981; reports more than two million students taught in Brazil, Portugal, Spain and Argentina (the entry's sourced profile, read 2026-10-05)", url: "https://pt.wikipedia.org/wiki/Microcamp" },
  },
  qd7: {
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    source: { label: "QD7: a São Paulo cybersecurity company positioned around the Brazilian regulatory landscape and the LGPD (the entry's sourced profile, read 2026-10-05)", url: "https://qd7.com.br/" },
  },
  stefanini: {
    // Founded in São Paulo; the current head-office city is not stated by the page read, so the country stands alone.
    hq: { country: "BR" },
    scope: "global",
    source: { label: "Stefanini: \"among the top 100 technology companies in the world, with operations in 104 countries\"; an older section of the same page says 46 countries, recorded as a discrepancy (stefanini.com, read 2026-10-05)", url: "https://stefanini.com/en" },
  },
  hcl: {
    hq: { country: "IN", city: "Noida" },
    scope: "global",
    source: { label: "Wikipedia: HCLTech, headquarters Noida, Uttar Pradesh, India; offices in 60 countries (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/HCLTech" },
  },
  epi: {
    hq: { country: "SG", city: "Singapore" },
    scope: "global",
    source: { label: "EPI: Singapore-headquartered (the entry's sourced profile); \"EPI, part of TÜV NORD GROUP, is the leading global certification body for data centre facilities, operations, and professionals\" (epi-ap.com, read 2026-10-05)", url: "https://www.epi-ap.com/" },
  },

  // ---- Certification bodies and exam delivery -----------------------------
  comptia: {
    hq: { country: "US", city: "Downers Grove, Illinois" },
    scope: "global",
    source: { label: "Wikipedia: CompTIA, headquarters 3500 Lacey Road, Downers Grove, Illinois; certifications issued in over 120 countries (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/CompTIA" },
  },
  "ec-council": {
    hq: { country: "US", city: "Albuquerque, New Mexico" },
    scope: "global",
    source: { label: "Wikipedia: EC-Council, headquarters 101 Sun Ave NE, Albuquerque, New Mexico; CEH courses offered in more than 60 countries by 2007 (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/EC-Council" },
  },
  offsec: {
    hq: { country: "US", city: "New York" },
    scope: "global",
    source: { label: "Wikipedia: Offensive Security (OffSec), headquarters New York City; area served international (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Offensive_Security" },
  },
  "sans-institute": {
    hq: { country: "US", city: "North Bethesda, Maryland" },
    scope: "global",
    source: { label: "SANS Institute, Contact: 11200 Rockville Pike, Suite 200, North Bethesda, MD 20852; regional offices for EMEA (Swansea), the Middle East and Africa (Dubai) and Asia Pacific (Singapore, Japan, Australia, India, Indonesia, Thailand) (read 2026-10-05)", url: "https://www.sans.org/about/contact/" },
  },
  "pearson-vue": {
    hq: { country: "US", city: "Bloomington, Minnesota" },
    scope: "global",
    source: { label: "Pearson VUE, Locations: headquarters 5601 Green Valley Drive, Bloomington, MN 55437, USA; offices in Philadelphia, Lehi, Noida, Richmond (Australia), Beijing, Tokyo, Manchester, London and Dubai; About: 5,500 test centres in 180+ countries and territories, nearly 21 million exams a year (read 2026-10-05)", url: "https://www.pearsonvue.com/us/en/about/locations.html" },
  },
  prometric: {
    hq: { country: "US", city: "Baltimore, Maryland" },
    scope: "global",
    source: { label: "Wikipedia: Prometric, headquarters Baltimore, Maryland; 3,000 test centres in 160 countries; owner EQT Private Capital Asia (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Prometric" },
  },
  kryterion: {
    hq: { country: "US", city: "Phoenix, Arizona" },
    scope: "international",
    where: { countries: ["GB", "ZA"], regions: ["asiaPacific"] },
    source: { label: "Kryterion: runs from Phoenix, Arizona, with offices in the United Kingdom, South Africa and Asia (the entry's sourced profile, read 2026-10-05)", url: "https://www.kryterion.com/about-kryterion/" },
  },
  credly: {
    // Founded in New York (the entry); now Credly by Pearson. A web platform whose issuers span the vendors on this
    // site's own credentials page, from Australia to the United States: global by its own figures, which give
    // providers and credentials rather than countries.
    hq: { country: "US", city: "New York" },
    scope: "global",
    source: { label: "Credly by Pearson: 3,700+ certification, assessment and training providers and employers, 200,000 available credentials, 123 million+ credentials earned and managed, 650,000+ shared monthly; founded in New York in 2012 per the entry (info.credly.com, read 2026-10-05)", url: "https://info.credly.com/" },
  },

  // ---- Learning platforms and lab environments ----------------------------
  coursera: {
    hq: { country: "US", city: "Mountain View, California" },
    scope: "global",
    source: { label: "Wikipedia: Coursera, headquarters Mountain View, California; area served worldwide; 168 million registered learners as of 2024, 40 languages (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Coursera" },
  },
  udemy: {
    hq: { country: "US", city: "San Francisco, California" },
    scope: "global",
    source: { label: "Wikipedia: Udemy, headquarters San Francisco, California; offices in the United States, Australia, India, Ireland, Mexico and Turkey; courses in sixteen languages (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Udemy" },
  },
  pluralsight: {
    hq: { country: "US", city: "Westlake, Texas" },
    scope: "global",
    source: { label: "Wikipedia: Pluralsight, headquarters Westlake, Texas; 18,000 corporate clients by 2020 including 70 percent of the Fortune 500; 2,000 employees (2025) (read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Pluralsight" },
  },
  edx: {
    hq: { country: "US", city: "Arlington, Virginia" },
    scope: "global",
    source: { label: "edX terms of service: edX LLC, a 2U, LLC company, 2345 Crystal Drive, Suite 1100, Arlington, VA 22202; edX About: 100 million learners in 190+ countries (read 2026-10-05)", url: "https://www.edx.org/edx-terms-service" },
  },
  alura: {
    // Brazil's largest online technology school, São Paulo; no footprint beyond Brazil is stated by the sources read.
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    pending: true,
    source: { label: "Alura: born in 2011 as the online platform of Caelum, the São Paulo classroom school founded in 2004; Brazil's largest online technology school (the entry's sourced profile, read 2026-10-05); activity beyond Brazil not stated, pending research", url: "https://www.alura.com.br/sobre" },
  },
  startse: {
    // Founded in Minas Gerais; the head-office city is not stated by the sources read, so the country stands alone.
    hq: { country: "BR" },
    scope: "international",
    where: { countries: ["US"] },
    source: { label: "StartSe: Brazilian executive-education company founded in 2015, immersion missions to Silicon Valley, China and Israel, and a campus in Palo Alto opened in 2019 (the entry's sourced profile, NeoFeed August 2020, read 2026-10-05)", url: "https://neofeed.com.br/blog/home/do-mea-culpa-a-virada-o-maior-aprendizado-da-startse-na-crise/" },
  },
  cloudshare: {
    hq: { country: "US", city: "Denver, Colorado" },
    scope: "global",
    source: { label: "CloudShare, About us: 1801 California St, Suite 1050, Denver, Colorado, with an office in Tel Aviv; \"100 Number of countries CloudShare operates in\"; 500+ enterprise customers (read 2026-10-05)", url: "https://www.cloudshare.com/company/about-us/" },
  },
  skytap: {
    // Seattle since the 2006 founding; acquired by Kyndryl in 2024. No footprint is stated by the pages read.
    hq: { country: "US", city: "Seattle, Washington" },
    scope: "national",
    pending: true,
    source: { label: "Wikipedia: Skytap, headquarters Seattle, Washington; founded 2006; acquired by Kyndryl in 2024 (read 2026-10-05); activity beyond the United States not stated, pending research", url: "https://en.wikipedia.org/wiki/Skytap" },
  },
  readytech: {
    hq: { country: "US", city: "Oakland, California" },
    scope: "international",
    where: { countries: ["NL", "SG"] },
    source: { label: "ReadyTech, About: \"headquartered in Uptown Oakland, with international offices in the Netherlands and data centers in California, Singapore, and Amsterdam\"; launched in 2003 (read 2026-10-05)", url: "https://www.readytech.com/about-rt-training-delivery-solutions/" },
  },

  // ---- Schools, universities and research institutes ----------------------
  fatec: {
    hq: { country: "BR", city: "São Paulo" },
    scope: "national",
    source: { label: "The Fatecs are São Paulo state technology faculties run by the Centro Paula Souza, with campuses across the state (the entry's sourced profile, read 2026-10-05)", url: "https://pt.wikipedia.org/wiki/Faculdade_de_Tecnologia_do_Estado_de_S%C3%A3o_Paulo" },
  },
  cpqd: {
    // Campinas since 1976; CPqD sells abroad, but the pages read state no footprint, so the HQ stands by default.
    hq: { country: "BR", city: "Campinas" },
    scope: "national",
    pending: true,
    source: { label: "CPqD: created by Telebrás in Campinas in 1976 (the entry's sourced profile, read 2026-10-05); activity beyond Brazil not stated, pending research", url: "https://www.cpqd.com.br" },
  },
  "raspberry-pi": {
    hq: { country: "GB", city: "Cambridge" },
    scope: "global",
    source: { label: "Wikipedia: Raspberry Pi Foundation, based on Hills Road, Cambridge (the entry's source); the computers are developed in the United Kingdom and sold worldwide (Wikipedia: Raspberry Pi, read 2026-10-05)", url: "https://en.wikipedia.org/wiki/Raspberry_Pi" },
  },
};
