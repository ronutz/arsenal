// ============================================================================
// src/components/AdvisoryServiceSchema.tsx
// ----------------------------------------------------------------------------
// schema.org/Service as JSON-LD for the advisory page.
//
// WHY (PRIME 2026-10-03, from the advisory review). The page is the one place
// on the site that sells something, and it carried no structured data at all:
// a crawler could see the Person on /about and nothing that said this Person
// offers a service, of what kind, where, in which languages. This says exactly
// that, and nothing the prose does not already say.
//
// WHAT IT DELIBERATELY DOES NOT CLAIM. No price (the page says pricing comes
// only after scoping, from Red Education); no ratings or reviews (the
// endorsements are verbatim human text, not aggregate-rating markup); no
// ProfessionalService organisation, because the provider is a person and the
// contracting party is Red Education, and inventing an organisation entity for
// the practice would contradict the page. The provider is the SAME Person
// entity /about emits, referenced by @id so a crawler reconciles the two.
// ============================================================================

import { PERSON_ID } from "@/components/PersonSchema";

/** The advisory page's own URL for one locale, as the canonical does it. */
function pageUrl(locale: string): string {
  return `https://ronutz.com/${locale}/advisory/`;
}

/**
 * JSON-LD for the advisory page. `name` and `description` are the page's own
 * translated title and description, so the markup never says something the
 * visible page does not.
 */
export function AdvisoryServiceSchema({
  locale,
  name,
  description,
}: {
  locale: string;
  name: string;
  description: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl(locale)}#service`,
    name,
    description,
    url: pageUrl(locale),
    mainEntityOfPage: pageUrl(locale),
    inLanguage: locale,
    // The kind of service, in schema.org's free-text field for it.
    serviceType: "Independent technical advisory for network and security decisions",
    // The Person who writes the analysis; the entity /about describes in full.
    provider: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Rodolfo Nützmann",
    },
    // Delivered remotely in both authored languages; the page says so in prose.
    areaServed: "Worldwide",
    availableLanguage: ["en", "pt-BR"],
    // The buyer the page names, in schema.org's own vocabulary.
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Technology, infrastructure and security leadership",
    },
    // WHO MAKES THE OFFER (second review, 2026-10-04). The page says the work is
    // delivered by the Person and contracted, proposed and invoiced through Red
    // Education, and the markup should not reintroduce the ambiguity the copy
    // removed. schema.org's own definition of Service.provider covers exactly
    // this: "Another party (a seller) may offer those services or goods on
    // behalf of the provider" (schema.org/Service, read 2026-10-04), and
    // Offer.offeredBy is "A pointer to the organization or person making the
    // offer" (schema.org/offeredBy, read 2026-10-04). No price, for the reason
    // in the header: the figure is Red Education's to quote after scoping.
    offers: {
      "@type": "Offer",
      offeredBy: {
        "@type": "Organization",
        name: "Red Education",
        url: "https://www.rededucation.com/",
      },
      // The service this offer is for: the Service entity itself, by @id.
      itemOffered: { "@id": `${pageUrl(locale)}#service` },
    },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
