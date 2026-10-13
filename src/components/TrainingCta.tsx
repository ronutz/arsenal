// ============================================================================
// src/components/TrainingCta.tsx
// ----------------------------------------------------------------------------
// INSTRUCTOR-LED TRAINING CTA (subtle, reusable).
//
// A quiet, tasteful prompt reminding high-intent visitors (certification
// candidates especially) that they can learn these courses live with an
// authorized instructor at Red Education, a global Authorized Training Center
// where Rodolfo teaches (PRIME 2026-07-09). It links INWARD to /training (the
// on-site training showcase), which in turn carries the single, lead-attributed
// outbound link to Red Education. Keeping the CTA -> /training keeps strong
// internal linking and one canonical attributed external link.
//
// Deliberately understated (amber accent, one line + one link), so it reads as
// a natural next step rather than an ad. Copy lives in the `trainingCta` i18n
// namespace (en + native pt-BR). Server component.
//
// IT SPEAKS ONLY FOR THE COURSES TAUGHT (2026-10-07, row 70; PRIME 23:3x: "Hide
// it there"). Until then the box said "I teach ... these courses live at Red
// Education" on all 105 certification guides, the 34 of Check Point, Ping
// Identity and Zscaler included, whose courses are not taught here. Now the
// caller names the vendors the box is about, and the box keeps only those that
// are platforms of the teaching catalogue (src/content/training/courses.ts),
// names them ("I teach official F5 courses ..."), and renders nothing when none
// is left. scripts/check-teaching-and-authorship-claims.mts holds the built
// pages to that rule.
// ============================================================================

import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
// MARK (PRIME 2026-10-04): the Red Education wordmark on the card that names it.
import VendorMark from "@/components/VendorMark";
// The teaching catalogue: the only source of which vendors' courses are taught.
import { PLATFORMS } from "@/content/training/courses";

/** The vendor keys whose official courses are taught (the catalogue's platforms), for callers that gate on them. */
export const TAUGHT_VENDORS: readonly string[] = PLATFORMS.map((p) => p.slug);

export default async function TrainingCta({
  vendors,
}: {
  /** The vendors this box is about, as vendor keys ("f5", "checkpoint"...), in the order to name them. Only those
   *  the teaching catalogue holds are kept; with none left the box renders nothing. */
  vendors: readonly string[];
}) {
  // The catalogue's platforms among the vendors asked for, in the caller's order, each once.
  const taught = [...new Set(vendors)]
    .map((v) => PLATFORMS.find((p) => p.slug === v))
    .filter((p): p is (typeof PLATFORMS)[number] => p !== undefined);
  // Nothing taught here: no claim, no box.
  if (taught.length === 0) return null;
  const t = await getTranslations("trainingCta");
  // The era caption for the mark's alt text.
  const tMarks = await getTranslations("partnerVendors");
  // The names as a list in the page's language ("F5, Fortinet, Extreme Networks and Netskope"; British English
  // for "en", so no serial comma, as the house writes it).
  const locale = await getLocale();
  const listLocale = locale === "en" ? "en-GB" : locale;
  const names = new Intl.ListFormat(listLocale, { style: "long", type: "conjunction" }).format(taught.map((p) => p.name));
  return (
    <aside className="training-cta">
      <span className="training-cta-eyebrow">{t("eyebrow")}</span>
      <VendorMark vendor="rededucation" year={new Date().getFullYear()} eraLabel={(e) => tMarks("markEra", { era: e })} since={(y) => tMarks("markSince", { year: y })} compact />
      <p className="training-cta-body">
        {/* Rich body: the vendors named, and the <redu> tag wrapping "Red Education" as an internal link to the
            /red-education profile page (site-wide internal linking). */}
        {t.rich("body", {
          vendors: names,
          redu: (chunks) => (
            <Link href="/red-education" className="training-cta-redu-link">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <Link href="/training" className="training-cta-link">
        {t("link")}
        <span aria-hidden="true"> &#8594;</span>
      </Link>
    </aside>
  );
}
