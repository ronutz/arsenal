// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Memorial da Democracia: at the 29 July 1998 auction, the São Paulo fixed
//     line lot went to Telefônica for R$ 5.8B at a premium of 64.29% over the
//     R$ 3.52B minimum, while Tele Centro Sul went to a consortium of Banco
//     Opportunity, Telecom Italia and pension funds for R$ 2.07B at a premium
//     of just 6.15%; Tele Norte Leste went for R$ 3.4B and Embratel to MCI for
//     R$ 2.65B at 47.22%; MORE THAN 3,000 POLICE protected the Rio exchange
//     against MST, CUT and union protests, the MST having entered the BNDES
//     lobby the previous day, and the auction began only after several court
//     injunctions were overturned
//   - Brasil Telecom SEC filings (2009): Region II covered 33.5% of Brazilian
//     national territory - Acre, Rondônia, Mato Grosso, Mato Grosso do Sul,
//     Tocantins, Goiás, Paraná, Santa Catarina, Rio Grande do Sul and the
//     Federal District; 8.1M fixed lines, 5.6M mobile, 1.8M ADSL, ~20,000 staff
//   - Encyclopedia.com: the concession area held over 41 million people, close
//     to 25% of the national population
//   - InfoMoney and pt.wikipedia: CRT acquired in 2000 for R$ 1.4B; GlobeNet
//     submarine cable system and 19.9% of MetroRED in late 2002; mobile from
//     2004, past 4 million subscribers in three years; the Oi brand replaced
//     Brasil Telecom on 17 May 2009
//
// *** BODY READ AFTER DRAFTING. The body is short and strategic: it uses this
// entry to argue that the pieces reconsolidated, and states honestly that the
// same happened in countries that privatised differently. It does not have the
// AUCTION ECONOMICS that explain why this piece in particular was cheap. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const brasilTelecomProfile: VendorProfile = {
  slug: "brasil-telecom",
  foundings: [
    {
      company: "Tele Centro Sul Participações",
      year: 1998,
      place: "Brasília",
      founders: ["Banco Opportunity", "Telecom Italia", "Brazilian pension funds"],
      story:
        "Incorporated on 22 May and auctioned in July to a consortium rather than to a single operator - a domestic bank, an Italian carrier and pension funds, which is a fair description of who could raise that much capital in Brazil at the time. It took the Brasil Telecom name in April 2002.",
    },
  ],
  timeline: [
    {
      year: 1998,
      title: "The premium tells you what was worth having",
      detail:
        "São Paulo's fixed-line concession sold at a premium of 64% over its reserve price. This one sold at 6%. The buyers were not confused about which lot they wanted; the difference between those two numbers is the difference between a city and a continent, priced on the day.",
    },
    {
      year: 1998,
      title: "The auction was not uncontested",
      detail:
        "More than three thousand police protected the Rio de Janeiro exchange against demonstrations by the landless workers' movement, the unions and the central trade union confederation. The MST had entered the development bank's lobby the day before, and the sale began only after several court injunctions were overturned.",
    },
    { year: 2000, title: "CRT", detail: "The Rio Grande do Sul operator bought for around R$1.4B, making the group second in the country by coverage area - the first move in a decade of buying rather than building." },
    { year: 2002, title: "Submarine cable", detail: "The GlobeNet submarine fibre system acquired, along with a stake in MetroRED - a regional fixed-line operator buying intercontinental capacity, which is a larger ambition than its concession implied." },
    { year: 2009, title: "The brand goes", detail: "Control passed on 8 January through a chain of holding companies, and the Oi brand replaced Brasil Telecom on 17 May." },
  ],
  products: [
    { name: "Fixed-line concession, Region II", what: "Local and intra-regional service across the Federal District and nine states, reaching 8.1 million lines at its peak." },
    { name: "CSP 14 long distance", what: "The carrier selection code, from 1999 regionally and 2004 nationally and internationally - the mechanism by which a regional concessionaire competed outside its own region." },
    { name: "Mobile", what: "Entered in 2004, six years after the fixed business, and past four million subscribers within three years. The late start is itself the story: the mobile licences had been sold separately in 1998." },
    { name: "Broadband and data centre", what: "1.8 million ADSL subscribers and hosting services - the businesses that grew while fixed voice declined." },
  ],
  innovations: [
    {
      title: "The geography was the business case, and it was a bad one",
      detail:
        "Region II covered about a third of Brazil's territory and roughly a quarter of its people. Telecommunications economics reward density, and a concession with a third of the land and a quarter of the population is the inverse of what an operator wants. The 6% premium was not pessimism; it was arithmetic.",
    },
    {
      title: "Buying reach instead of building it",
      detail:
        "A regional operator that acquires another operator, then a submarine cable system, then a stake in a metropolitan network, is trying to escape the boundaries of its own concession. The strategy is coherent and it is also an admission: the licensed territory alone was not a sufficient business.",
    },
    {
      title: "Competing outside your own region by code",
      detail:
        "Carrier selection codes let a customer choose whose network carried a long-distance call by dialling two extra digits. It is a regulatory device rather than an engineering one, and it is how a market designed as separate regional monopolies was made to have competition in it at all.",
    },
  ],
  markets: [
    "Around 41 million people across the Federal District and nine states, served with 8.1 million fixed lines, 5.6 million mobile subscribers and 1.8 million broadband connections at its largest, with roughly twenty thousand employees.",
    "Its competitors were the other concessionaires operating across regional boundaries by the same mechanisms it used, and eventually the group that bought it.",
  ],
  analyst: [
    "Any assessment now is of the successor group rather than of this company, and the record of that group is its own subject.",
    "The number worth carrying away is the one from the first day. A 6% premium meant the market thought this concession was worth almost exactly its reserve price, while São Paulo went for two thirds more than its own. Eleven years later the cheap lot was absorbed by the group that had bought a different one, and the expensive lot had become a Spanish multinational's Brazilian business. The consolidation the entry above describes was visible in the auction prices before any of it happened.",
  ],
};
