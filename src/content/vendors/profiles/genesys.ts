// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against Wikipedia, Preqin,
// Tracxn and company histories: incorporated 1 October 1990; $150,000 in family
// loans; T-Server as the first major product, delivering the screen pop; IPO
// June 1997 on NASDAQ as GCTI raising $45M at $18; Alcatel taking it private at
// ~$1.5B; Permira and TCV buying it out of Alcatel-Lucent in February 2012 at
// ~$1.5B; Hellman & Friedman's 2016 stake at a ~$3.8B valuation; Interactive
// Intelligence at ~$1.4B; revenue $2.0B in 2022; ~$2.98B raised in total across
// ten rounds; a confidential IPO filing in 2024; Tony Bates chief executive;
// 6,000+ employees.
//
// *** SECOND RUN OF THE INVERTED-ORDER EXPERIMENT: researched and drafted
// before reading the body. Reconciliation found the body ALREADY MAKES the
// central point I had reached independently - the $1.5B round trip and what it
// says about ownership. The body states it better. What it does NOT say is WHY
// ownership hurt, and that is what this profile contributes. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const genesysProfile: VendorProfile = {
  slug: "genesys",
  foundings: [
    {
      company: "Genesys Telecommunications Laboratories",
      year: 1990,
      place: "Daly City, California",
      founders: ["Gregory Shenkman", "Alec Miloslavsky"],
      story:
        "Incorporated on 1 October. The name points at genesis, and the ambition was narrower than the name: make the telephone system and the customer database exchange one piece of information at the moment a call connects.",
    },
  ],
  timeline: [
    { year: 1991, title: "T-Server", detail: "The middleware that made the connection, sitting between switches the customer already owned and the applications on their desks." },
    { year: 1995, title: "Out of California", detail: "A UK subsidiary, then one in Russia the following year - early international expansion for a company five years old and not yet public." },
    { year: 1997, title: "NASDAQ", detail: "June, as GCTI, raising $45M at $18 a share." },
    { year: 2016, title: "Interactive Intelligence", detail: "Bought for around $1.4B, and Hellman & Friedman took a stake the same year - the two moves that turned an on-premises business into a cloud one." },
    { year: 2024, title: "Filed to return", detail: "A confidential filing for a public listing, reportedly seeking up to $2B - which would make it the third distinct ownership structure since 1997." },
  ],
  products: [
    { name: "T-Server and the CTI layer", what: "The original middleware, and the architectural decision the whole company rests on: it integrates with the switch you already have rather than replacing it." },
    { name: "Skills-based routing", what: "Matching a caller to a competence rather than to an available body. It is the reason contact centres are organised the way they are, and it long outlived the telephone as the only channel." },
    { name: "Genesys Cloud CX", what: "The current platform: voice, digital channels, self-service, workforce management and analytics as one service rather than a stack of integrations." },
    { name: "Workforce engagement", what: "Forecasting, scheduling and quality management - the operational half of running a contact centre, which is where much of the actual budget goes." },
  ],
  innovations: [
    {
      title: "Solving a problem in the gap between two systems",
      detail:
        "Neither the telephone switch nor the customer database was broken. The failure was that they did not speak, and nobody owned the gap. Building a business in the space between two working systems is a recurring shape in this industry, and it requires being trusted by both sides.",
    },
    {
      title: "Why independence was structural, not sentimental",
      detail:
        "Middleware that connects to any switch is worth more when its owner sells no switches. Inside a telecommunications manufacturer, every integration with a competitor's equipment is a conversation about the parent's own product line, and every customer knows it. That is the same mechanism this timeline records at Kyndryl, whose advice was worth more once a cloud vendor stopped owning it, and at Nozomi, whose new owner manufactures the equipment it monitors.",
    },
    {
      title: "Routing on competence",
      detail:
        "The shift from is anyone free to is the right person free sounds small and reorganises everything behind it: how agents are trained, how teams are structured, how performance is measured. Most contact centre software since has been an elaboration of that idea.",
    },
    {
      title: "Raising nothing, then raising everything",
      detail:
        "It began on $150,000 borrowed from families and has since raised close to $3B across ten rounds. The first number bought a product; the second bought a transition from on-premises software to a cloud service, which is the more expensive of the two things.",
    },
  ],
  markets: [
    "Mid-sized and large organisations running contact operations - banks, airlines, insurers, telecommunications companies, public services - at around $2.0B of revenue and more than six thousand staff.",
    "It competes with the cloud-native contact centre providers that never carried an on-premises business, with the CRM vendors extending into service, and with the telephony platforms adding contact centre features. Its distinguishing asset remains the one it started with: it works with what the customer already has.",
  ],
  analyst: [
    "Consistently placed among the leaders in contact centre assessments across two decades and several owners, which is unusual - most of the companies it began against are gone or absorbed.",
    "The open question is the one the 2024 filing raises. A company that has been public, then owned by a manufacturer, then owned by private equity, is proposing to be public again. Each structure suited a different phase, and the record suggests the phase that suited it least was the one where its owner sold the equipment it was designed to be neutral about.",
  ],
};
