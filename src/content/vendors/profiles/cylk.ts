// ============================================================================
// src/content/vendors/profiles/cylk.ts
// ----------------------------------------------------------------------------
// WHY THIS ONE EARNED A TIMELINE, AND A CORRECTION IT FORCED IN THE ENTRY.
//
// *** THE ENTRY CONTRADICTED ITSELF, IN ADJACENT SENTENCES. *** Its body said
// "It is the third company of Grupo IHC, after HighCast (2003) and inLearn
// (2008)" and then, four lines later, "Grupo IHC, founded 2003, whose third
// company is HighCast". Both cannot be true. The entry's own sources settle it:
// HighCast dates to 2003, the same year as the group, inLearn to 2008, CYLK to
// June 2010, so CYLK is third and HighCast is first. The second sentence was
// wrong and is corrected in partners.ts as part of this change.
//
// The value of a guard-like reading is on display here: nothing in the build
// chain can catch a body that disagrees with itself, and the sentence had been
// sitting in public copy since the entry was written.
//
// VERIFICATION MANIFEST - read 2026-09-27:
//   - Baguete, 9 May 2016: "The CYLK, together with HighCast and InLearn
//     companies, is part of the IHC Group, founded in 2003." Confirms the
//     membership and the group's year; gives no per-company years.
//   - Baguete, 21 July 2014: Grupo IHC comprises InLearn, HighCast and CYLK in
//     "professional services, systems integration and IT training"; the group
//     had concentrated on network consulting SINCE 2003 and later expanded with
//     CYLK's implementation and training services. CYLK took an undisclosed
//     capital injection and hired CARLOS CARNEVALI JR. AS PRESIDENT, tasked with
//     new verticals (healthcare, retail, services) and Latin American
//     expansion, with a stated aim of doubling in size within two years.
//     *** THE INVESTOR WAS NOT DISCLOSED. *** The reporter SPECULATED it might
//     be Carlos Carnevali senior, who left the presidency of Cisco Brazil in
//     2007. That is the journalist's inference, not a fact, and it is recorded
//     below as the speculation it is or not at all.
//   - Entry's existing sources: Baguete and Resinfo, March 2015, both carrying
//     "Fundada em junho de 2010, a CYLK, membro do Grupo IHC", alongside an
//     ISO/IEC 20000 certification and a Juniper certification.
//   - cylk.com.br/grupo-ihc/ returned HTTP 500 on 2026-09-27, so the group's
//     own page could not be read and none of the above rests on it.
//
// PERSONAL EVENTS ARE PRIME'S OWN RECORD. partners.ts carries the comment
// "Employed here 2010-2011 and again in 2020" (PRIME, 2026-08-11). Those years
// come from PRIME and are marked personal below. No other vendor date here is
// personal, and none was inferred.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const cylkProfile: VendorProfile = {
  slug: "cylk",

  foundings: [
    {
      company: "CYLK",
      year: 2010,
      place: "Sao Paulo, Brazil",
      founders: [],
      story:
        "CYLK was founded in June 2010 as the third company of Grupo IHC, after HighCast in 2003 and inLearn in 2008, to do systems integration and managed services for networks, data centre and security. The group's shape is the interesting part: it did not grow by buying companies but by each one creating the next out of demand it had already generated. A consulting practice produces questions a training company can answer, and both produce estates somebody has to integrate. No founder names are published, and none are supplied here.",
      sourceNote:
        "June 2010 is stated in identical wording by Baguete and Resinfo in March 2015: \"Fundada em junho de 2010, a CYLK, membro do Grupo IHC\". The group's 2003 founding is confirmed by Baguete in May 2016. Per-company founding years for HighCast and inLearn are not in either of those two articles and come from the entry's existing sources.",
    },
  ],

  timeline: [
    {
      year: 2010,
      personal: true,
      title: "Rodolfo joins in the founding year",
      detail:
        "Rodolfo Nutzmann worked inside CYLK from 2010 to 2011, which is the company's first full stretch of existence. An integrator in its opening year is a particular place to work: the practices are not written down yet, and what a new engineer learns is how the decisions get made rather than what was decided.",
      sourceNote:
        "Dates from PRIME's own record in partners.ts, 2026-08-11. Not derived from any public source.",
    },
    {
      year: 2014,
      title: "Capital, a president, and a target",
      detail:
        "In July 2014 CYLK took an undisclosed capital injection and hired Carlos Carnevali Jr. as president, with a brief to open new vertical markets in healthcare, retail and services, to expand across Latin America, and to double the company's size within two years. It is the moment a group that had grown by internal generation started being run against an external number.",
      sourceNote:
        "Baguete, 21 July 2014. Neither the amount nor the investor was disclosed. The reporter speculated that the investor might be Carlos Carnevali senior, formerly president of Cisco Brazil until 2007; that is the journalist's inference and is not recorded here as fact.",
    },
    {
      year: 2015,
      title: "Certifications, which is what an integrator sells",
      detail:
        "By March 2015 the company was reported holding ISO/IEC 20000 for IT service management and a Juniper certification. For a business whose product is making other people's equipment work together, a vendor certification is not a badge but the permission to be in the room, and a service-management standard is the argument that the work will still be running next year.",
    },
  ],

  // products, innovations, markets, analyst: absent. An integrator's portfolio
  // is other companies' products, and nothing read establishes analyst standing.
};
