// ============================================================================
// src/content/vendors/profiles/parxtech.ts
// ----------------------------------------------------------------------------
// THIN DEMONSTRATOR (PRIME, 2026-08-04). The counterpart to the Cloudflare
// profile, and the reason the section fields were made optional.
//
// ONE SECTION. The public record for this company is its own website: a
// founding year, an ownership statement, a service list and a coverage claim.
// That supports a founding story and nothing else.
//
// There is no timeline, because no dated events are published. No products,
// because a service list is not a product line. No innovations, no markets
// section, no analyst standing - not because the company lacks them, but
// because no source establishes them, and inventing plausible content for a
// real company is the failure this whole approach exists to avoid.
//
// The page will be short. That is the correct outcome, and it is legible to a
// reader as "this is what is known" rather than "this was filled in".
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const parxtechProfile: VendorProfile = {
  slug: "parxtech",

  foundings: [
    {
      company: "Parxtech",
      year: 1992,
      place: "São Paulo, Brazil",
      founders: [],
      story:
        "Parxtech was founded in São Paulo in 1992 to supply connectivity and information technology services, and describes itself as wholly Brazilian-owned with national delivery reach. Its work spans networking, structured cabling, closed-circuit television, wireless intrusion prevention, electrical installation and outsourcing - a combination that places it in the physical layer of a building rather than only its network. The electrical line is the distinguishing one: many integrators stop at the patch panel, and a company that will also do the power is selling to whoever has to make the room work rather than to whoever has to make the network work.",
      sourceNote:
        "Founding year, ownership and service lines from the company's own site, which is the extent of the public record located. No founder names are published, and none are supplied here.",
    },
  ],

  // timeline, products, innovations, markets, analyst: deliberately absent.
};
