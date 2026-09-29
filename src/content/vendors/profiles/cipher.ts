// ============================================================================
// src/content/vendors/profiles/cipher.ts
// ----------------------------------------------------------------------------
// WHY THIS ONE EARNED A TIMELINE. The entry already made the good point: two
// of Brazil's largest specialist security firms were bought within about two
// years by acquirers from outside the technology industry. What the entry could
// not do was follow what happened to the name afterwards, and that turns out to
// be the more unusual half of the story.
//
// VERIFICATION MANIFEST - read 2026-09-27:
//   - Prosegur's OWN press release, dated 10 December 2018, states that Cipher
//     was FOUNDED IN 2000, that EDUARDO BOUCAS is its founder and CEO and would
//     remain a shareholder and Global CEO of Prosegur Cybersecurity, that
//     ALEJANDRO ALONSO, formerly Prosegur's Cybersecurity Managing Director,
//     would become Executive Chairman, that Cipher operated in North America,
//     Latin America and Europe with two 24/7 security operations centres, and
//     that the combined group would hold six.
//     *** THIS RETIRES A sourceNote ON THE ENTRY. *** The entry recorded the
//     2000 founding year as coming from a directory listing, corroborated only
//     by Cipher's own "more than twenty years" phrasing. Prosegur's release is
//     a first-party statement of the year, from the acquirer, in the document
//     announcing the deal. The stake percentage is still NOT disclosed there,
//     so "majority" remains the reported term and no number is given below.
//   - CMU Portugal, on its own alumnus company: Prosegur acquired the Portuguese
//     startup DOGNAEDIS IN MARCH 2016, and "in 2019 all companies within the
//     Prosegur Cibersecurity Division including Dognaedis, transitioned towards
//     the global brand Cipher, a Prosegur Company".
//   - Prosegur's current pages carry the division as PROSEGUR CYBERSECURITY,
//     with the xMDR platform under that name.
//
// NO PERSONAL EVENT, DELIBERATELY. The entry carries
// relationships: ["worked-with-directly"], but nothing in this repository dates
// that involvement and PRIME has not stated the years. Guessing them to fill the
// pattern would put an invented date on a public career timeline, so the marker
// stays absent until PRIME supplies the years.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const cipherProfile: VendorProfile = {
  slug: "cipher",

  foundings: [
    {
      company: "Cipher",
      year: 2000,
      place: "Brazil",
      founders: ["Eduardo Boucas"],
      story:
        "Cipher was founded in 2000 and grew into one of Brazil's larger cybersecurity specialists, running its own security operations centres rather than reselling somebody else's. The detail that matters for what came later is that it built a managed service: a business whose value is people watching screens around the clock, in facilities, under contract. That is an asset a buyer can absorb and keep running on day one, which is not true of most things a technology company owns.",
      sourceNote:
        "The founding year and the founder's name are stated in Prosegur's own announcement of the acquisition, dated 10 December 2018, which is a first-party source for both. The city is not given there and is not invented here.",
    },
  ],

  timeline: [
    {
      year: 2016,
      title: "Prosegur buys a Portuguese security startup first",
      detail:
        "Before Brazil, Prosegur acquired Dognaedis, a cybersecurity company spun out of the Carnegie Mellon Portugal programme, in March 2016. Read forwards this looks like a footnote; read backwards it is the first move of a strategy, because a physical-security multinational assembling a digital division needs a second acquisition before the first one means anything.",
    },
    {
      year: 2018,
      title: "A guarding company buys a security operations business",
      detail:
        "On 10 December 2018 Prosegur announced an agreement for a majority stake in Cipher. Prosegur's own release put Cipher in North America, Latin America and Europe with two round-the-clock security operations centres, and the combined group at six. Eduardo Boucas, Cipher's founder and chief executive, stayed on as a shareholder and as Global CEO of Prosegur Cybersecurity; Alejandro Alonso, who had been running Prosegur's own cybersecurity unit, became Executive Chairman. The size of the stake was not disclosed.",
      sourceNote:
        "Prosegur's release says majority without a percentage, and gives no price. Neither figure is stated here, because the only numbers available for this deal are the ones Prosegur chose to publish.",
    },
    {
      year: 2019,
      title: "The acquired name becomes the group's name",
      detail:
        "In 2019 every company inside Prosegur's cybersecurity division, Dognaedis included, moved onto one global brand: Cipher, a Prosegur Company. This is the part worth pausing on. The ordinary outcome of an acquisition is that the buyer's name survives and the seller's is retired within a couple of years. Here it ran the other way: the Brazilian firm's name was applied to the acquirer's own pre-existing cybersecurity unit and to its earlier Portuguese acquisition. Prosegur bought a business and then adopted its brand. Since then the naming has moved once more, and the division presents as Prosegur Cybersecurity with its xMDR platform under that name, so the specialist's brand was promoted over the buyer's and later superseded by it anyway.",
      sourceNote:
        "The 2019 consolidation onto the Cipher brand is dated by CMU Portugal, writing about Dognaedis as its own alumnus company. The later move to Prosegur Cybersecurity is visible on Prosegur's current pages but no source located announces it with a date, so it is described here without one rather than given a year it cannot support.",
    },
  ],

  // products, innovations, markets, analyst: absent. This entry exists for an
  // ownership story, and the record read supports that and the brand sequence,
  // nothing more.
};
