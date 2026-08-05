// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Texas State Historical Association and D Magazine: incorporated 27 June
//     1962 in Dallas; $1,000 borrowed from Margot Perot; one room, one desk,
//     $100 a month, fifth floor of the Blue Cross Blue Shield building; Perot
//     at IBM from 1957 after the Naval Academy and four years at sea, hitting
//     his annual sales quota by mid-January 1962; IBM declining his idea
//   - LinkedIn/company histories: Medicare 1965 opening government work;
//     Medicare and Medicaid about 25% of revenue by 1968; healthcare claims
//     nearly 40% by 1977; GM buying EDS for $2.5B in 1984 and spinning it out
//     in 1996, then becoming one of its largest customers
//   - Encyclopedia.com and FundingUniverse: the $41M Iran contract; operations
//     suspended December 1978 over six months of unpaid invoices; Gaylord and
//     Chiapparone detained with bail set at $12M; the rescue led by Colonel
//     Arthur D. "Bull" Simons
//   - Wikipedia: HP acquiring EDS for $13.9B, announced 13 May and completed
//     26 August 2008; 2007 revenue $22.1B and 136,000 staff; merged with CSC
//     into DXC Technology on 3 April 2017
//
// THE BODY IS SHORT (three paragraphs) and argues that the services model EDS
// created is the one the rest of the timeline inherited. Everything here is
// addition rather than restatement.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const edsProfile: VendorProfile = {
  slug: "eds",
  foundings: [
    {
      company: "Electronic Data Systems",
      year: 1962,
      place: "Dallas, Texas",
      founders: ["Ross Perot"],
      story:
        "Incorporated on 27 June with $1,000 borrowed from his wife Margot, in one room with one desk on the fifth floor of the Blue Cross Blue Shield building, at $100 a month. Perot had joined IBM in 1957 after the Naval Academy and four years at sea, and by January 1962 had already met the annual sales quota the company set him. He proposed that IBM sell the management of data processing rather than only the machines. IBM was not interested, so he left and did it himself.",
    },
  ],
  timeline: [
    {
      year: 1962,
      title: "Founded, and immediately capital-light",
      detail:
        "Rather than buy computers, EDS rented time on machines other organisations had already bought and were not fully using. That kept the capital requirement near zero and meant the company was national from very early, because the borrowed machines were spread across the country.",
    },
    { year: 1963, title: "The first long-term contracts", detail: "Frito-Lay through Herman Lay, and insurance data processing for Mercantile Security Life - the start of a line that by 1990 made EDS the largest insurance data processor in the United States." },
    {
      year: 1965,
      title: "Medicare",
      detail:
        "New federal healthcare programmes generated paperwork at a scale nobody had systems for. EDS built the claims processing. By 1968 Medicare and Medicaid were around a quarter of revenue; by 1977 healthcare claims were nearly forty per cent of it.",
    },
    { year: 1968, title: "Public offering", detail: "Seven per cent of the company sold, and revenues through this period roughly doubled year on year." },
    {
      year: 1979,
      title: "Iran",
      detail:
        "A three-year $41M contract with Iran's social security administration ended with the country six months behind on payments and EDS suspending work. Two executives, Bill Gaylord and Paul Chiapparone, were detained with bail set at $12M. With diplomatic channels closed, Perot assembled a private rescue team under a retired Green Beret colonel, Arthur Simons, whom he had previously employed searching for American servicemen missing in Vietnam. Both men got out.",
      sourceNote: "Contract value, the payment dispute, the detentions and the bail figure per Encyclopedia.com and FundingUniverse, which give substantially the same account.",
    },
    {
      year: 1984,
      title: "General Motors, twenty-two years to the day",
      detail:
        "GM bought EDS on 27 June 1984 for $2.5B, the largest sum paid for a computer services business to that point - and exactly twenty-two years after the company was incorporated. The terms required GM to keep EDS as a separate entity with its own performance stock, which is an unusual concession and a sign of what the seller was worth. Disputes over autonomy followed, and Perot's departure with them.",
    },
    { year: 1996, title: "Independent again", detail: "GM spun EDS back out, and promptly became one of its largest customers - which is the outsourcing argument stated as a corporate action." },
    {
      year: 2008,
      title: "Hewlett-Packard",
      detail:
        "Announced 13 May at $13.9B and completed 26 August. EDS had reported $22.1B of revenue and 136,000 staff the year before.",
    },
    { year: 2017, title: "Into DXC", detail: "Merged with Computer Sciences Corporation on 3 April to form DXC Technology, ending the name after fifty-five years." },
  ],
  products: [
    { name: "Facilities management", what: "The original service and the original word for it: EDS ran your data processing on your behalf, staff and machines included, on a long contract. Everything the industry later called outsourcing descends from this." },
    { name: "Healthcare claims processing", what: "Medicare and Medicaid administration for state programmes, and commercial insurance processing - unglamorous, enormous, and for a decade the largest part of the business." },
    { name: "Banking and transaction networks", what: "Among the systems that let cash machines interoperate between institutions, which is the kind of infrastructure nobody notices until it stops." },
    { name: "Systems integration and applications", what: "The later portfolio, competing with the consultancies as the market matured and the distinction between running systems and building them eroded." },
  ],
  innovations: [
    {
      title: "The long-term fixed-price contract",
      detail:
        "The industry sold short engagements; EDS sold multi-year commitments at a fixed price. That transferred the risk of running the systems from the customer to the supplier, which is precisely what made the offer attractive and precisely what made it hard to price. Every managed service contract since has been an argument about the same transfer.",
    },
    {
      title: "Selling the operation rather than the equipment",
      detail:
        "The proposition was that a company's computing was somebody else's core business and not its own. That idea is now so ordinary that cloud providers assume it, and it was strange enough in 1962 that the largest computer company in the world declined to pursue it.",
    },
    {
      title: "Renting capacity instead of owning it",
      detail:
        "Buying time on other organisations' underused machines is the same economic logic that later sold virtualisation and then cloud: capacity is expensive to own and cheap to share, and somebody has to be the one aggregating it.",
    },
    {
      title: "Government as an anchor customer",
      detail:
        "Winning the administration of new public programmes gave the company scale, predictability and a reference no commercial customer could match. It is the strategy behind a great many of the services firms that followed, and it ties a business's fortunes to legislation rather than to markets.",
    },
  ],
  markets: [
    "Large corporations and government, in that order at first and then increasingly the reverse. Healthcare administration, insurance, banking and eventually automotive under GM - by 2007 it was a $22B business employing 136,000 people worldwide.",
    "Its competitors became the systems integrators and consultancies, and eventually the cloud providers, who sell the same proposition with the labour removed.",
  ],
  analyst: [
    "Assessed in its time as the definitive outsourcing firm, and the reference against which every later services company was measured - which is a position no successor entity has occupied since.",
    "The longer verdict is that the model outlived the company. EDS invented the arrangement, was bought by a customer, spun back out, absorbed by a hardware manufacturer and merged into a successor that no longer carries the name - while the practice it created became the default way large organisations buy computing.",
  ],
};
