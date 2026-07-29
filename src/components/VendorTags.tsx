// ============================================================================
// src/components/VendorTags.tsx
// ----------------------------------------------------------------------------
// The tag row beneath a vendor page's eyebrow (PRIME 2026-07-28).
//
// THREE INDEPENDENT FACTS, not one category. F5, Fortinet, Netskope and Extreme
// carry all three; Cisco, Check Point, Ping, Palo Alto and Zscaler carry two.
// Modelling them as alternatives is the mistake made on the industry timeline,
// where a company could only ever show one pill because two facts had been
// collapsed into a single field.
//
// They are deliberately DIFFERENT CLAIMS:
//   * "worked with directly" is autobiography
//   * "Red Education training partner" is a fact about Red Education
//   * "authorized instructor" is the narrowest - four vendors, not the nine Red
//     Education partners with. Conflating those two would overclaim.
//
// PURELY PRESENTATIONAL, taking finished strings. A first version called
// useTranslations here, which is the CLIENT hook, and check-client-messages
// correctly failed the build: it would have forced the partnerVendors namespace
// into every page's client bundle to render four short labels. Both parents are
// server components that already hold a partnerVendors translator, so the
// labels are resolved there and passed down.
// ============================================================================

export interface VendorTagsProps {
  /** Rodolfo worked inside or directly with this vendor. */
  workedWith?: boolean;
  /** Finished label for that tag, including the years. */
  workedWithLabel?: string;
  /** Red Education delivers this vendor's authorized training. */
  reduPartner?: boolean;
  reduLabel?: string;
  /** Rodolfo personally delivers this vendor's official training. */
  authorizedInstructor?: boolean;
  instructorLabel?: string;
}

export default function VendorTags({
  workedWith = false,
  workedWithLabel,
  reduPartner = false,
  reduLabel,
  authorizedInstructor = false,
  instructorLabel,
}: VendorTagsProps) {
  if (!workedWith && !reduPartner && !authorizedInstructor) return null;

  return (
    <div className="vendor-tag-row">
      {workedWith && workedWithLabel && (
        <span className="vendor-career-pill">{workedWithLabel}</span>
      )}
      {reduPartner && reduLabel && <span className="vendor-partner-pill">{reduLabel}</span>}
      {authorizedInstructor && instructorLabel && (
        <span className="vendor-instructor-pill">{instructorLabel}</span>
      )}
    </div>
  );
}
