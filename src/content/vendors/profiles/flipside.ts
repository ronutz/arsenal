// ============================================================================
// src/content/vendors/profiles/flipside.ts
// ----------------------------------------------------------------------------
// WHY THIS ONE EARNED A TIMELINE. The entry made a claim it could not then
// support with figures: that Roadsec's distinguishing choice was reach rather
// than prestige, touring Brazilian cities instead of concentrating in Sao Paulo.
// It also recorded, honestly, that "the event's public record is uneven". It is
// uneven, but it is not empty: the tour was covered city by city in the Brazilian
// trade press, and those reports carry the city counts and attendance that turn
// the entry's argument from an assertion into a measurement.
//
// VERIFICATION MANIFEST - read 2026-09-27:
//   - Portal Eventos, published 14 November 2018, on the Sao Paulo "mega
//     edition" of 10 November 2018: the event celebrated FIVE YEARS, which
//     places the FIRST EDITION IN 2013, and drew OVER 5,000 PEOPLE, with
//     finalists from ELEVEN STATES. Anderson Ramos appears as "idealizador do
//     Hackaflag" and "CTO da Flipside".
//   - Inforchannel, 17 August 2017: "Em 2017, o evento, que teve inicio em 18 de
//     fevereiro, vai passar 21 cidades nas 5 regioes", and for the prior year
//     "Em 2016, o Roadsec atraiu mais de 10 mil apaixonados por tecnologia nas
//     17 cidades por onde passou". The Rio edition was projected at about 400.
//     Hackaflag is described as the country's largest capture-the-flag
//     competition, and the previous year's winner received an all-expenses trip
//     to DEF CON in Las Vegas.
//   - Entry's existing sources: the company is Flipside Treinamento Editora e
//     Comercio LTDA - ME, CNPJ 09.058.270/0001-28, OPENED 11 SEPTEMBER 2007 in
//     Sao Paulo, principal activity professional and managerial training
//     (CNAE 8599-6/04). A related registration, Hackaflag Tecnologia em
//     Informatica, was opened 31 OCTOBER 2018.
//
// TWO THINGS DELIBERATELY NOT SMOOTHED.
//   1. Anderson Ramos is CTO in the 2017 and 2018 press and CEO on Roadsec's own
//      later site. Both are recorded; neither is preferred. Titles change, and a
//      profile that quietly picks one is hiding a fact rather than reporting it.
//   2. The 2016 figure (10,000 across 17 cities) and the 2018 figure (5,000 at
//      one Sao Paulo edition) MEASURE DIFFERENT THINGS - a season against a
//      single night - and are labelled as such below, because printing them in
//      a list would read as a collapse in attendance that the sources do not
//      show.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const flipsideProfile: VendorProfile = {
  slug: "flipside",

  foundings: [
    {
      company: "Flipside",
      year: 2007,
      place: "Sao Paulo, Brazil",
      founders: [],
      story:
        "Flipside was registered in Sao Paulo on 11 September 2007 as Flipside Treinamento Editora e Comercio, with professional and managerial training as its principal registered activity. The registration is worth reading literally, because it is not an events company on paper: it is a training and publishing business, and the festival it became known for is what that turned into. Six years passed between the registration and the first Roadsec.",
      sourceNote:
        "Legal name, CNPJ and opening date from the Brazilian federal tax registry, corroborated by the company's own privacy policy, which states the same legal entity and a Avenida Paulista address. No founder names are published in either, and none are supplied here.",
    },
  ],

  timeline: [
    {
      year: 2013,
      title: "The first Roadsec",
      detail:
        "Roadsec ran for the first time. The name states the format: a security event that travels, rather than one city's conference that everyone else flies to. That choice is the whole argument, because who can reach a venue determines who is in the room, and who is in the room determines who is in the field ten years later.",
      sourceNote:
        "Derived from the anniversary rather than from coverage of the first edition: the Sao Paulo edition of 10 November 2018 was reported as celebrating five years, which places the first in 2013. No report of a 2013 edition was located directly.",
    },
    {
      year: 2016,
      title: "Seventeen cities, ten thousand people",
      detail:
        "The 2016 tour passed through seventeen cities and drew more than ten thousand attendees across the season. A single large conference can claim a bigger room; it cannot claim seventeen cities, and the difference is precisely the entry's point about reach rather than prestige.",
    },
    {
      year: 2017,
      title: "Twenty-one cities, all five regions, and a trip to DEF CON",
      detail:
        "The 2017 season opened on 18 February and covered twenty-one cities across all five Brazilian regions. Individual stops were small by conference standards, with Rio de Janeiro projected at around four hundred, which is the shape of the model rather than a shortfall: many modest rooms in many places instead of one large one in Sao Paulo. Running alongside it was Hackaflag, reported as the country's largest capture-the-flag competition, whose previous winner had been sent to DEF CON in Las Vegas with expenses paid. For a student in a city with no security industry, that is a career path made visible.",
    },
    {
      year: 2018,
      title: "Five years, and the competition gets its own company",
      detail:
        "The Sao Paulo mega edition of 10 November 2018 marked five years and drew more than five thousand people, with competition finalists arriving from eleven states. Eleven states is the figure that shows the tour working: the finale was in Sao Paulo, but the pipeline into it was not. Two weeks earlier, on 31 October, Hackaflag Tecnologia em Informatica had been registered as a company of its own, several years after the competition it is named for had started running.",
      sourceNote:
        "The 5,000 attendance is for that single Sao Paulo night and is not comparable with the 10,000 recorded across the whole 2016 season. Anderson Ramos is described in this period's coverage as Flipside's CTO and as the originator of Hackaflag, while Roadsec's own later site lists him as CEO; both titles are on the record and neither is preferred here.",
    },
  ],

  // products, innovations, markets, analyst: absent. An events and training
  // organisation has a calendar, not a product line.
};
