// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against Accenture's own SEC
// filings, which are primary sources for this entry:
//   - Form S-1/A (2001): binding arbitration was REQUESTED 17 DECEMBER 1997;
//     the ICC tribunal's final award was DATED 28 JULY 2000 and the parties
//     notified 7 AUGUST 2000; and - the precision worth having - the tribunal
//     ruled that ***ANDERSEN WORLDWIDE***, the coordinating entity, "had
//     breached its material obligations under the member firm agreements",
//     which is a different finding from one about Arthur Andersen the
//     accounting firm. Both statements can hold at once because they concern
//     two different legal entities.
//   - Same filing: on 1 March 2001 the parties executed releases and entered
//     services agreements under which ***ARTHUR ANDERSEN WOULD PROVIDE
//     SERVICES, INCLUDING TAX SERVICES, TO ACCENTURE FOR SIX YEARS AT $60
//     MILLION PER YEAR.***
//   - Popular Timelines: from 1998 Andersen Consulting placed the 15% transfer
//     payment into ESCROW, so the settlement was paid from money already
//     withheld
//   - Umbrex: the new name was chosen to be "intentionally meaningless in any
//     language to avoid negative connotations"; Bermuda incorporation in 2001,
//     Dublin from 2009
//
// *** BODY READ AFTER DRAFTING, AND IT IS SUPERB. It has the 1953 GE UNIVAC
// study with the BUNCH cross-reference, the revenue-sharing grievance, the 1995
// rival consulting arm, the December 1997 unanimous vote, the arbitrator by
// name, the settlement, the four-month rename, Kim Petersen in Oslo, the
// mockery and the cost, the IPO, Enron, and - in [6] - THE FIREWALL INSIGHT
// ITSELF, stated better than research produced it.
//
// This adds precision on the ruling and two facts about how entangled the
// separation actually was. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const accentureProfile: VendorProfile = {
  slug: "accenture",
  foundings: [],
  timeline: [
    {
      year: 1997,
      title: "Three years, not one",
      detail:
        "The arbitration was requested in December 1997 and the award was not issued until July 2000. Two and a half years of proceedings, during which the consulting business continued operating inside an arrangement its partners had voted unanimously to dissolve. The duration is the part that gets lost: this was not an event but a condition, sustained for the length of a normal product cycle.",
    },
    {
      year: 1998,
      title: "Paid from money already withheld",
      detail:
        "From 1998 the transfer payments owed upward were placed into escrow rather than handed over. When the settlement came due, a substantial part of it was money the consultancy had been holding back for two years - which is a detail that changes how the figure should be read.",
    },
    {
      year: 2001,
      title: "And then they hired them",
      detail:
        "On 1 March, alongside the releases and indemnities that finalised the separation, the two sides entered service agreements under which Arthur Andersen would provide services including tax work to Accenture for six years at $60 million a year. Having fought for three years to get away, the first thing the new company did was sign a six-year contract with the firm it had left.",
    },
  ],
  products: [
    { name: "Strategy and consulting", what: "The advisory business the firm is named for, and the smaller half - the part that decides what the larger half will then be paid to build." },
    { name: "Technology services", what: "Systems integration, application development and cloud migration at industrial scale, delivered largely from offshore centres. This is the bulk of the revenue and the direct competitor to the Indian services firms elsewhere on this timeline." },
    { name: "Operations", what: "Running processes on a client's behalf - finance, procurement, customer service. The outsourcing business, and the one that turns a project firm into an annuity." },
    { name: "Song", what: "Marketing and creative services, assembled from dozens of agency acquisitions. A consultancy buying advertising agencies is a bet that the two disciplines were always adjacent, and the reviews have been mixed." },
  ],
  innovations: [
    {
      title: "The precision that matters about the ruling",
      detail:
        "The tribunal's finding is usually summarised as a defeat, and the company's own filing puts it more narrowly: Andersen Worldwide, the coordinating entity that sat above both businesses, was found to have breached its material obligations. That is not the same as a finding against the accounting firm, and the distinction is exactly the sort that matters when a criminal prosecution later reaches for everything connected to a name.",
    },
    {
      title: "Separation as a legal structure rather than a feeling",
      detail:
        "The point the entry above makes is worth restating in its narrow form: what protected the consultancy was not distance or reputation but the fact that a tribunal had already ruled it a distinct entity with no continuing obligations. Corporate separations are usually judged on whether they made commercial sense. This one is judged on whether it would hold under a prosecutor's reading, and it did.",
    },
    {
      title: "A name chosen to mean nothing",
      detail:
        "The brief for the rename was to find a word with no meaning in any language, precisely so that it could not carry a bad one. That is the opposite of how brands are usually built, and it is a rational response to having just discovered how quickly a name with eighty years of meaning can acquire the wrong one.",
    },
  ],
  markets: [
    "Large enterprises and governments across more than a hundred and twenty countries, at a scale where the firm is simultaneously a consultancy, a systems integrator, an outsourcer and an advertising group.",
    "It competes with the strategy houses at the top, the Indian services firms on delivery cost, and the technology vendors' own professional services arms - and increasingly with the software its clients buy, since automation reduces the hours it can bill.",
  ],
  analyst: [
    "Assessed as the largest firm in professional services by revenue and headcount, with the recurring analyst question being margin under offshore competition rather than demand.",
    "The structural exposure worth naming is that a business selling hours is the most direct beneficiary of complexity and the most direct casualty of its removal. Every tool that makes an integration simpler reduces the work it can charge for, and the firm's own advisory practice sells those tools. That tension is not new - it is the same one every consultancy has carried since the first systems study - but the rate at which software now removes labour is.",
  ],
};
