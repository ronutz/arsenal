// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Chief Learning Officer and Reworked (Jan-Feb 2022): the Pearson
//     acquisition valued at ~$200M; Credly had issued 50 MILLION credentials to
//     25 MILLION people across more than 2,000 organisations; 2021 revenue rose
//     47% to $13.3M (Reuters); Pearson already held a stake of nearly 20%;
//     Credly was to be combined with Faethm, acquired September 2021, in
//     Pearson's Workforce Skills division
//   - PitchBook and Tracxn: total funding raised of roughly $18M-$23M across
//     the company's life; around 60 employees; investors included the Lumina
//     Foundation, City & Guilds and the IBM Blockchain Accelerator
//   - Getting Smart / Forbes: customers including IBM, Microsoft, AWS, Dell and
//     Oracle
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL - AND CONTAINS A MAJOR
// FACT RESEARCH MISSED ENTIRELY: Credly holds United States patents over the
// creation, management and tracking of digital credentials, held beside an open
// standard it implements, with a non-assertion promise that "survives at the
// discretion of whoever owns the patent next". It also has the exam-versus-
// claim distinction, the ownership-independence observation, the full corporate
// reversal, and a three-way comparison with USRobotics and Dynatrace.
//
// What research adds is what the PRICE says about what was bought. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const credlyProfile: VendorProfile = {
  slug: "credly",
  foundings: [],
  timeline: [
    {
      year: 2013,
      title: "The first badge",
      detail: "Issued a year after founding, on a specification the company did not own - which is the decision everything else on this page follows from.",
    },
    {
      year: 2022,
      title: "Fifteen times revenue",
      detail:
        "The purchase price was around $200M against 2021 revenue of $13.3M. That is not a multiple anybody pays for an earnings stream. It is the price of a registry: fifty million credentials held by twenty-five million people, issued by two thousand organisations including the largest technology vendors. What was bought was the record of who holds what.",
    },
  ],
  products: [
    { name: "The credential platform", what: "Issuing, hosting and verifying badges, sold to the organisations that award them rather than to the people who hold them - which is worth knowing, because it means the customer is the issuer and the holder is the product's subject rather than its buyer." },
    { name: "The verification endpoint", what: "The thing that actually matters: a link that resolves to the issuer's own current record, including revocation. A certificate that can answer for itself is a different object from a PDF." },
    { name: "Analytics for issuers", what: "Which credentials are earned, shared and acted on. For a vendor running a certification programme this is the feedback loop that was previously absent entirely." },
  ],
  innovations: [
    {
      title: "Making the claim checkable, not just the exam",
      detail:
        "The verification problem has two halves and the industry solved one of them first. Establishing that the right person sat the test was addressed decades ago by proctoring; establishing that a claim on a CV is true was left to whoever was doing the hiring, which usually meant it was not established at all.",
    },
    {
      title: "The registry is the asset",
      detail:
        "A platform holding twenty-five million people's credentials has something no competitor can build by writing better software: the records themselves, and the switching cost of moving them. That is why the price bore no relation to the revenue, and it is the same asset shape as an exchange or a certificate authority - value that accrues to whoever is already holding everybody's data.",
    },
    {
      title: "Portable by specification, concentrated by market",
      detail:
        "Open Badges exists so that a credential belongs to the person and travels between platforms. The specification succeeded and the market consolidated anyway, because portability of the data does not prevent concentration of the service. That is a general result worth carrying: an open format constrains lock-in without preventing dominance.",
    },
  ],
  markets: [
    "Certification bodies, technology vendors, universities and professional associations - the organisations that award something and need it to be believed afterwards. The technology vendors on the customer list are the same ones whose certifications appear throughout this timeline.",
    "Its competitors are the other credentialing platforms and, increasingly, the issuers themselves deciding whether to run their own verification rather than delegate it.",
  ],
  analyst: [
    "The market is small enough that formal coverage is thin, and the position is better described by concentration than by ranking: one platform holds a large share of the technology industry's issued credentials.",
    "The observation that follows from the price is the one worth keeping. A company with roughly $13M of revenue and sixty staff sold for two hundred million because of what it held rather than what it earned. Anybody thinking about where the leverage sits in the certification chain should notice that the most valuable position turned out to be neither writing the exam nor delivering it, but keeping the list of who passed.",
  ],
};
