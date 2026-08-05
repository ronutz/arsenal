// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against SolarWinds press
// releases and SEC filings: Thoma Bravo and Silver Lake took the company
// private in 2016 for approximately $4.5B; it listed in October 2018 raising
// $375M at a $4.6B valuation; Turn/River Capital agreed to acquire it on
// 7 February 2025 at $18.50 per share, approximately $4.4B enterprise value,
// a ~35% premium to the 90-day average; the deal closed 16 April 2025 and the
// stock ceased trading on the NYSE. The SEC case was largely dismissed in
// November 2025 per contemporary market coverage.
//
// AN ARR FIGURE OF $1.899B appears in one market-commentary source and is NOT
// used: it is inconsistent with a $4.4B enterprise value and no filing
// corroborates it.
//
// THE BODY ALREADY ARGUES the commercial model, the full SUNBURST account,
// the 18,000 caveat, the SEC action, the CISO-liability consequence and the
// architectural tie to CrowdStrike. This profile adds the ownership arc, the
// product taxonomy, and what happened to the company afterwards.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const solarwindsProfile: VendorProfile = {
  slug: "solarwinds",
  foundings: [
    {
      company: "SolarWinds",
      year: 1999,
      place: "Tulsa, Oklahoma",
      founders: ["Donald Yonce", "David Yonce"],
      story:
        "Two brothers, one a former Walmart executive, building network monitoring for the people who run networks rather than for the people who sign for them. The company later moved to Austin, where it remains.",
    },
  ],
  timeline: [
    { year: 1999, title: "Founded in Tulsa", detail: "Affordable monitoring sold without an enterprise sales apparatus." },
    { year: 2016, title: "Taken private", detail: "Thoma Bravo and Silver Lake bought the company for approximately $4.5B." },
    { year: 2018, title: "Return to public markets", detail: "Listed in October, raising $375M at a $4.6B valuation, with the two private equity firms retaining roughly 65% of the voting stock." },
    { year: 2019, title: "The intrusion begins", detail: "October: the first test injections into the Orion build." },
    { year: 2020, title: "SUNBURST distributed, then found", detail: "26 March to December, from first backdoored update to discovery." },
    { year: 2021, title: "Attribution", detail: "In April the United States and United Kingdom attributed the operation to Russia's SVR." },
    {
      year: 2025,
      title: "Private again, at roughly the price it started",
      detail:
        "Turn/River Capital agreed to buy the company on 7 February at $18.50 a share, about $4.4B, and closed on 16 April; the stock left the New York Stock Exchange. Nine years earlier the same company had been taken private at approximately $4.5B. It went through a public listing and the largest software supply chain attack on record, and came out roughly where it went in.",
    },
    { year: 2025, title: "The SEC case largely ends", detail: "The remaining claims were dismissed in November, closing an action that had run since October 2023." },
  ],
  products: [
    { name: "Orion, and the SolarWinds Platform", what: "The monitoring platform - network performance, server and application monitoring, configuration management - and the product whose build system was compromised." },
    { name: "SolarWinds Observability", what: "The current platform, offered both as a hosted service and self-hosted, which for a substantial part of this customer base is not a preference but a requirement." },
    { name: "Database Performance Analyzer and SQL Sentry", what: "Database monitoring, sold under a combined licence - an unglamorous specialism with a loyal following among the people who actually tune queries." },
    { name: "Service Desk", what: "IT service management, added to put the ticket beside the alert." },
    { name: "Pingdom, Papertrail, Loggly and AppOptics", what: "Acquired external monitoring, log aggregation and application performance tools, bought rather than built - the pattern that took the company into adjacent categories quickly." },
  ],
  innovations: [
    { title: "The procurement bypass, and its second edge", detail: "Software bought without a procurement cycle is also software bought without a security review, an architecture board or an inventory entry. The model that made the company was the model that made its customers unable to answer, in December 2020, the only question that mattered: where is this installed." },
    { title: "Breadth at a price the mid-market pays", detail: "A catalogue of narrow tools rather than one expensive platform let a customer buy exactly the piece they needed. The commercial model and the install base are the same fact." },
    { title: "Rebuilding the build process in public", detail: "After 2020 the company reconstructed its software build to run the same source through multiple independent pipelines and compare results, so that a single compromised environment cannot produce a trusted artefact. It published the approach rather than keeping it, which is the useful response to having been the case study." },
  ],
  markets: [
    "IT operations teams across enterprise, mid-market and government, with a footprint that includes a large share of the Fortune 500 and, in 2020, much of the United States federal government - which is what made the compromise a national security event rather than a commercial one.",
    "It competes now against cloud-native observability vendors that grew up after its model was established, and its distinguishing position is the same as it always was: broad, affordable, and deployable on premises for customers who cannot use anything else.",
  ],
  analyst: [
    "Assessed as a substantial incumbent in network monitoring and IT operations management, with a customer base whose size is its principal asset and, in 2020, its principal liability.",
    "The commercial verdict is in the numbers: taken private at about $4.5B in 2016 and sold at about $4.4B in 2025. A company can survive the worst supply chain attack yet recorded and still be worth what it was - which says something about the durability of installed software that neither the attack nor the recovery narrative captures.",
  ],
};
