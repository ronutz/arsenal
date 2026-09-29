// ============================================================================
// src/content/vendors/profiles/tdec.ts
// ----------------------------------------------------------------------------
// WHY THIS ONE, FROM THE THIN END OF THE DEPTH QUEUE. Most of the remaining
// queue is small Brazilian channel houses whose entire public record is a CNPJ
// and a page of service categories, and a profile built on that is padding.
// TDEC is the exception in that tier for three reasons: the entry already
// carries two matched CNPJ registrations and a named founder, PRIME's own record
// dates an employment inside it, and the company's current site states a
// position specific enough to date.
//
// *** WHAT I DID NOT DO HERE, AND IT MATTERS. *** The site's homepage brands the
// company "EST. 1993" while the entry carries founded: 1992. I read that as a
// new finding and was about to correct it. The entry had already found it, and
// handles it exactly as canon AUDIT-founding-dates-20260912 prescribes: 1992 is
// the CNPJ registration of TDEC Informatica Ltda. in Cotia on 6 March 1992, the
// site's own "est. 1993" is quoted beside it in the intro, and neither is
// picked over the other. Nothing was changed. The near-miss is recorded because
// a confident one-year "fix" to a public founding date is precisely the failure
// that audit exists to prevent.
//
// VERIFICATION MANIFEST - tdec.com.br rendered 2026-09-27:
//   - Homepage states "TDEC NETWORK GROUP / EST. 1993", "BRASIL - USA -
//     PORTUGAL", "For more than three decades we have designed, deployed and
//     operated enterprise networks, cybersecurity and global IT", and describes
//     the company as "Global leaders in IT, cybersecurity and structured
//     cabling solutions, with more than 30 years of experience as an IP network
//     integrator - now specialized in protecting Artificial Intelligence
//     environments, data and models". Solution headings: AI SECURITY, REAL-TIME
//     SOC, ZERO TRUST. A section is labelled "ECOSSISTEMA TDEC - 2026".
//   - Corporate facts below come from the entry's existing research, not from
//     the site: TDEC Informatica Ltda., CNPJ 67.521.195/0001-96, registered in
//     Cotia March 1992; TDec Redes de Computadores Ltda., CNPJ
//     06.093.568/0001-80, opened January 2004 and the active legal person today;
//     founder Jose Valter "Junior" Tavora de Castro.
//   - Employment dates are PRIME's own comment in partners.ts (2026-08-11):
//     "Employed here 2013-2014."
//
// NO 1993 EVENT, deliberately. There is no dated event for the "est. 1993"
// branding, only the branding itself, and inventing one would resolve by
// implication the discrepancy the entry deliberately leaves open.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const tdecProfile: VendorProfile = {
  slug: "tdec",

  foundings: [
    {
      company: "TDEC Informatica Ltda.",
      year: 1992,
      place: "Cotia, Sao Paulo, Brazil",
      founders: ["Jose Valter “Junior” Tavora de Castro"],
      story:
        "The founding entity was registered in Cotia in March 1992 as TDEC Informatica Ltda. The company's own site brands itself est. 1993 while describing more than thirty years in the business, and the one-year gap is left standing here rather than resolved, because a registration date and a company's account of when it started trading are two different facts and both are worth having. What the sequence does establish is the starting point: an IP network integrator, at the beginning of Brazilian commercial internet rather than after it.",
      sourceNote:
        "1992 is the CNPJ registration date (67.521.195/0001-96), a registration address rather than a place of work. The site's est. 1993 is quoted as the company's own claim. Neither is preferred. See canon AUDIT-founding-dates-20260912 for why a one-year discrepancy here is recorded instead of decided.",
    },
  ],

  timeline: [
    {
      year: 2004,
      title: "A second legal person, and why that is not a second founding",
      detail:
        "TDec Redes de Computadores Ltda. was opened in January 2004 and is the active legal person associated with the group today. It is worth stating plainly that this is not a 2004 founding: a Brazilian group routinely opens a new company for tax, contracting or partner-accreditation reasons while the business continues unbroken, and reading the newest CNPJ as the birth date is one of the easiest ways to get a Brazilian corporate history wrong.",
    },
    {
      year: 2013,
      personal: true,
      title: "Rodolfo works inside",
      detail:
        "Rodolfo Nutzmann worked inside TDec from 2013 to 2014. An integrator of this size is where the gap between a vendor's reference architecture and a customer's actual estate is most visible, because there is no layer of process between the engineer and the consequence.",
      sourceNote:
        "Dates from PRIME's own record in partners.ts, 2026-08-11. Not derived from any public source.",
    },
    {
      year: 2026,
      title: "Three countries, and a repositioning onto AI",
      detail:
        "The company now presents as TDEC Network Group across Brazil, the United States and Portugal, and has repositioned from IP network integration onto the protection of artificial-intelligence environments, data and models, with AI security, a real-time SOC and zero trust as its named solution lines. Structured cabling still appears in the same sentence as AI model protection, which is not incoherence: it is an accurate description of what a thirty-year integrator's customer base actually asks for at once.",
      sourceNote:
        "From the company's own site as rendered on 2026-09-27, where a section is labelled ECOSSISTEMA TDEC - 2026. The year marks the state of the site read on that date, not an announced event.",
    },
  ],

  // products, innovations, markets, analyst: absent. An integrator sells other
  // companies' products, and nothing read establishes analyst standing.
};
