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
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TrainingCta() {
  const t = await getTranslations("trainingCta");
  return (
    <aside className="training-cta">
      <span className="training-cta-eyebrow">{t("eyebrow")}</span>
      <p className="training-cta-body">
        {/* Rich body: the <redu> tag wraps "Red Education" as an internal link
            to the /red-education profile page (site-wide internal linking). */}
        {t.rich("body", {
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
