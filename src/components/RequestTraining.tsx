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
// ============================================================================

import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isEnabled } from "@/config/features";
import { routeFor, routeForPlatform } from "@/config/leadRouting";
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";

interface RequestTrainingProps {
  /** Platform slug (required). */
  platform: string;
  /** Course slug; omit for a platform-level CTA. */
  course?: string;
  /** Visual variant. */
  variant?: "block" | "inline";
}

export default async function RequestTraining({
  platform,
  course,
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
    </div>
  );
}
