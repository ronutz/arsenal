// ============================================================================
// src/content/vendors/clients.ts
// ----------------------------------------------------------------------------
// INDUSTRIES AND CLIENTS, 1996 TO 2014 (PRIME, 2026-10-05 02:43: "I think we should include a section ... on
// industries and clients I have worked with, we will NOT use client logos and only mentioning their names
// should not cause any issues, I will not disclose any important information and all these engagements have
// been many years ago.")
//
// WHAT THIS IS. The organisations named as clients, customers or end customers in PRIME's own résumés, each
// tied to the career chapter (or the independent practice) it belongs to, the years the résumé gives, the
// capacity, and the sector. Names only: no logos (PRIME's rule), no engagement detail beyond the role the
// résumé states in one line, nothing that is not in the documents. The sector is an editorial grouping for
// the reader; the name, the years and the capacity are the résumé's.
//
// SOURCES (PRIME's files, read 2026-10-05): the résumé of 14 May 2008 (CV_RN_en_2008.05.doc; the files
// named 2008.04 and 2010.05 are the April 2008 and the same May 2008 text), and the later résumés of
// August 2009, October 2012, June 2013 (English) and April 2014 (Portuguese). Where two résumés disagree
// the one written closest to the engagement is followed and the difference is noted on the entry.
//
// CONFIDENTIALITY. Until 02:52 on 2026-10-05 four of these names were ruled confidential for public pages;
// PRIME lifted the ruling that night for everything catered to before full-time work at Red Education
// (DECISION-confidentiality-lifted-pre-red-education-20261005 in the canon), so every client the résumés carry
// is here, in its correct context. Nothing after 2020 is a client of this practice on this site.
// ============================================================================

/** The sectors the names are grouped under on the career record. Keys are message ids (vendors.clientSector.*). */
export type ClientSector =
  | "finance"
  | "energy"
  | "media"
  | "manufacturing"
  | "aerospace"
  | "government"
  | "education"
  | "telecom"
  | "technology"
  | "consumer";

/** Where an engagement sits: a career chapter (its slug under /industry/chapters/) or the independent practice. */
export type ClientContext = { chapter: string } | { independent: true };

/** One client, in one context, in the years the résumé gives. */
export interface ClientEngagement {
  /** The organisation, as the résumé names it (a later name in brackets where the résumés themselves changed it). */
  name: string;
  sector: ClientSector;
  /** The chapter or the independent practice. */
  context: ClientContext;
  /** The years the résumé gives: the first, and the last when the engagement spans more than one. */
  from: number;
  to?: number;
  /** The capacity, as a message id under vendors.clientCapacity.*. */
  capacity: "field" | "systems" | "support" | "postsales" | "presales" | "consulting" | "training" | "implementation" | "channel";
  /** The integrator or employer the work went through, when the résumé names one. */
  via?: string;
  /** A note the reader should have (a disagreement between résumés, a rename, the scope the résumé states), as a
   *  message id under vendors.clients.notes.* so it is authored in both locales. */
  noteKey?: string;
  /** The résumé the line comes from. */
  source: "2008-05" | "2009-08" | "2012-10" | "2013-06" | "2014-04";
}

/** The résumés, in date order, for the provenance line on the page (labels under vendors.clients.sources.*). */
export const CLIENT_SOURCES: readonly ClientEngagement["source"][] = ["2008-05", "2009-08", "2012-10", "2013-06", "2014-04"];

const CAB = { chapter: "cabletron-enterasys" } as const;
const RIV = { chapter: "riverstone" } as const;
const CIS = { chapter: "cisco" } as const;
const IRO = { chapter: "ironport" } as const;
const JUN = { chapter: "netscreen-juniper" } as const;
const IND = { independent: true } as const;

export const CLIENT_ENGAGEMENTS: readonly ClientEngagement[] = [
  // ---- Cabletron Systems, field engineering 1996 to 1999 and systems engineering 1999 to 2000 (résumé 2008-05,
  //      "Customers: ... and many others").
  { name: "Petrobras", sector: "energy", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "TV Globo", sector: "media", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Bombril", sector: "consumer", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Mannesmann", sector: "manufacturing", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Henkel", sector: "manufacturing", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Infraero", sector: "aerospace", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Embraer", sector: "aerospace", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "BM&F", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "ING Bank", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Merrill Lynch", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "ABN AMRO", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Banco Noroeste (Santander)", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05", noteKey: "banco-noroeste-santander" },
  { name: "Bradesco", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Banespa", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Unibanco", sector: "finance", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Editora Abril", sector: "media", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "USP", sector: "education", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "UNICAMP", sector: "education", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Fiat", sector: "manufacturing", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },
  { name: "Volkswagen", sector: "manufacturing", context: CAB, from: 1996, to: 1999, capacity: "field", source: "2008-05" },

  // ---- Riverstone Networks, product support engineer, tier III, Santa Clara, 2000 to 2002 ("Main customers").
  { name: "BT", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Cox Communications", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Verizon", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Telseon", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Terayon", sector: "technology", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "MCI WorldCom", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "EarthLink", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Korea Telecom", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "NTT", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Telindus", sector: "technology", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Completel", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },
  { name: "Telefónica de España", sector: "telecom", context: RIV, from: 2000, to: 2002, capacity: "support", source: "2008-05" },

  // ---- The independent practice (NTZ Tecnologia, from 2003): the clients the résumés list under it.
  { name: "Symnetics", sector: "technology", context: IND, from: 2003, capacity: "consulting", source: "2008-05", noteKey: "symnetics" },
  { name: "Universidade Presbiteriana Mackenzie", sector: "education", context: IND, from: 2005, capacity: "implementation", source: "2009-08" },
  { name: "Arkhe DTVM", sector: "finance", context: IND, from: 2005, to: 2008, capacity: "implementation", source: "2008-05", noteKey: "arkhe-dtvm" },
  { name: "Petrobras", sector: "energy", context: IND, from: 2007, capacity: "training", via: "Parxtech", source: "2008-05", noteKey: "petrobras" },
  { name: "Unicom Datagroup", sector: "technology", context: IND, from: 2008, capacity: "presales", source: "2009-08", noteKey: "unicom-datagroup" },
  { name: "CM Capital Markets", sector: "finance", context: IND, from: 2010, to: 2011, capacity: "consulting", via: "Highcast Informática", source: "2012-10", noteKey: "cm-capital-markets" },
  { name: "Cylk IT Solutions", sector: "technology", context: IND, from: 2010, to: 2011, capacity: "implementation", via: "Highcast Informática", source: "2012-10", noteKey: "cylk-it-solutions" },
  { name: "Mapfre", sector: "finance", context: IND, from: 2008, capacity: "consulting", via: "Lemenet", source: "2009-08", noteKey: "mapfre" },
  { name: "Porto Seguro", sector: "finance", context: IND, from: 2011, capacity: "consulting", via: "Inmetrics", source: "2012-10", noteKey: "porto-seguro" },
  { name: "Martini Meat", sector: "consumer", context: IND, from: 2012, capacity: "implementation", via: "Sigmafone", source: "2012-10", noteKey: "martini-meat" },
  { name: "IBOPE", sector: "media", context: IND, from: 2012, capacity: "implementation", via: "NTSS", source: "2013-06", noteKey: "ibope" },

  // ---- Cisco Systems, Brasília, network consulting engineer, 2003 to 2004.
  { name: "SERPRO", sector: "government", context: CIS, from: 2003, to: 2004, capacity: "postsales", source: "2008-05" },
  { name: "ECT (Correios)", sector: "government", context: CIS, from: 2003, to: 2004, capacity: "postsales", source: "2008-05" },

  // ---- IronPort Systems, systems engineering and channel development, 2005 (the 2012 and later résumés write 2004).
  { name: "TV Globo", sector: "media", context: IRO, from: 2005, capacity: "presales", source: "2008-05", noteKey: "tv-globo" },
  { name: "Unibanco", sector: "finance", context: IRO, from: 2005, capacity: "presales", source: "2008-05", noteKey: "unibanco" },
  { name: "Whirlpool", sector: "manufacturing", context: IRO, from: 2005, capacity: "presales", source: "2008-05", noteKey: "whirlpool" },

  // ---- M/TEL and Aynil (integrators), pre-sales systems engineering, 2005: public institutions and enterprises.
  { name: "Prodesp", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05", noteKey: "prodesp" },
  { name: "IPEM", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "FUNDAP", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "CDHU", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "FDE", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "Polícia Civil de São Paulo", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "Polícia Federal", sector: "government", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },
  { name: "Coop", sector: "consumer", context: IND, from: 2005, capacity: "presales", via: "M/TEL & Aynil", source: "2008-05" },

  // ---- Enterasys Networks, post-sales support management 2005 to 2006 and pre-sales systems engineering 2007.
  { name: "Petrobras", sector: "energy", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "Embraer", sector: "aerospace", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "TV Globo", sector: "media", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "Volkswagen", sector: "manufacturing", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "WEG", sector: "manufacturing", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "Foxconn", sector: "manufacturing", context: CAB, from: 2005, to: 2007, capacity: "postsales", source: "2008-05" },
  { name: "Santander", sector: "finance", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "Bradesco", sector: "finance", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "BM&F", sector: "finance", context: CAB, from: 2005, to: 2006, capacity: "postsales", source: "2008-05" },
  { name: "Gerdau", sector: "manufacturing", context: CAB, from: 2007, capacity: "presales", source: "2008-05" },
  { name: "Univali", sector: "education", context: CAB, from: 2007, capacity: "presales", source: "2008-05" },
  { name: "Usina Santa Adélia", sector: "manufacturing", context: CAB, from: 2007, capacity: "presales", source: "2008-05" },
  { name: "Siemens", sector: "manufacturing", context: CAB, from: 2007, capacity: "presales", source: "2008-05" },

  // ---- Juniper Networks, network consulting engineer, 2009 to 2010 (through Highcast Informática).
  { name: "Telefônica Empresas", sector: "telecom", context: JUN, from: 2009, to: 2010, capacity: "presales", via: "Highcast Informática", source: "2012-10", noteKey: "telefonica-empresas" },
  { name: "Global Crossing", sector: "telecom", context: JUN, from: 2009, to: 2010, capacity: "training", via: "Highcast Informática", source: "2012-10", noteKey: "global-crossing" },
];

/** The sectors in display order (largest groups first on the record, by count, ties by this order). */
export const CLIENT_SECTORS: readonly ClientSector[] = ["finance", "government", "telecom", "manufacturing", "media", "energy", "aerospace", "education", "technology", "consumer"];

/** The engagements of one chapter, for its page. */
export function clientsForChapter(slug: string): ClientEngagement[] {
  return CLIENT_ENGAGEMENTS.filter((e) => "chapter" in e.context && e.context.chapter === slug);
}

/** The engagements of the independent practice. */
export function independentClients(): ClientEngagement[] {
  return CLIENT_ENGAGEMENTS.filter((e) => "independent" in e.context);
}

/** Distinct organisation count (a name met in two chapters counts once). */
export const CLIENT_COUNT = new Set(CLIENT_ENGAGEMENTS.map((e) => e.name)).size;
