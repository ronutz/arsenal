// ============================================================================
// src/components/RequestTraining.tsx
// ----------------------------------------------------------------------------
// "REQUEST THIS TRAINING" CTA — the lead-generation button for training.
//
// Reads the `requestTraining` feature flag (renders NOTHING when off, so the
// admin switch fully controls its presence), then resolves where the inquiry
// goes through the lead router. Used in two shapes:
//   - course-level (a specific course's datasheet) -> routeFor(platform, course)
//   - platform-level (a platform page)             -> routeForPlatform(platform)
//
// The destination is whatever the routing config says (Red Education by default;
// another ATC or Rodolfo himself when configured). The button is a normal link;
// for internal self-routing ("/contact") it uses the localized Link, for an
// external ATC it uses a plain anchor opening in a new tab.
//
// Server component (no client state); all copy from the "training" namespace.
//
// BOOKING CONTEXT (Round 1, 2026-10-25; audit CC07-D). Red Education offers no
// verified course-level page or prefilled inquiry, so a course button lands on
// the vendor-level page. The line under the button says so plainly, gives the
// learner the course name to quote and keeps the instructor-allocation caveat;
// no partner query parameter is invented, and attribution stays as it was.
// ============================================================================

import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isEnabled } from "@/config/features";
import { routeFor, routeForPlatform } from "@/config/leadRouting";
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";
// The platform's display name, for the booking context line.
import { getPlatform } from "@/content/training/courses";

interface RequestTrainingProps {
  /** Platform slug (required). */
  platform: string;
  /** Course slug; omit for a platform-level CTA. */
  course?: string;
  /** The course's catalogue name, quoted in the booking context line (course pages only). */
  courseName?: string;
  /** Visual variant. */
  variant?: "block" | "inline";
}

export default async function RequestTraining({
  platform,
  course,
  courseName,
  variant = "block",
}: RequestTrainingProps) {
  // Admin switch: if the feature is off, render nothing at all.
  if (!isEnabled("requestTraining")) return null;

  const t = await getTranslations("training");
  const locale = await getLocale();

  // Resolve the destination via the routing config, then apply placement-level
  // attribution HERE, where the vendor/page/locale/CTA context lives (standing
  // rule, PRIME 2026-07-22). Non-Red-Education destinations pass through.
  const dest = course ? routeFor(platform, course) : routeForPlatform(platform);
  const isInternal = dest.url.startsWith("/");
  const destUrl = isInternal
    ? dest.url
    : attributeRedEducationUrl(dest.url, {
        vendor: platform,
        pageType: course ? "course" : "platform",
        pageSlug: course ?? platform,
        locale,
        cta: "request-training",
      });

  const label = t("requestTraining");
  const via = t("requestVia", { destination: dest.name });
  // The vendor's display name for the context line (falls back to the slug, which never happens for a catalogue platform).
  const vendor = getPlatform(platform)?.name ?? platform;
  // The context line exists only for an external training centre: an internal route needs no explanation.
  const context = isInternal
    ? null
    : courseName
      ? t("bookingContextCourse", { vendor, course: courseName, destination: dest.name })
      : t("bookingContextPlatform", { vendor, destination: dest.name });

  return (
    <div className={"request-training request-training--" + variant}>
      {isInternal ? (
        <Link href={destUrl} className="btn btn-primary request-training-btn">
          {label}
        </Link>
      ) : (
        <a
          href={destUrl}
          className="btn btn-primary request-training-btn"
          target="_blank"
          rel={externalRel(destUrl)}
        >
          {label}
        </a>
      )}
      <span className="request-training-via">{via}</span>
      {/* What the button opens and what to carry into it (CC07-D); below the button row, full width. */}
      {context && <p className="course-note">{context}</p>}
    </div>
  );
}
