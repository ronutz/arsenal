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

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isEnabled } from "@/config/features";
import { routeFor, routeForPlatform } from "@/config/leadRouting";

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

  // Resolve the destination via the routing config.
  const dest = course ? routeFor(platform, course) : routeForPlatform(platform);
  const isInternal = dest.url.startsWith("/");

  const label = t("requestTraining");
  const via = t("requestVia", { destination: dest.name });

  return (
    <div className={"request-training request-training--" + variant}>
      {isInternal ? (
        <Link href={dest.url} className="btn btn-primary request-training-btn">
          {label}
        </Link>
      ) : (
        <a
          href={dest.url}
          className="btn btn-primary request-training-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      )}
      <span className="request-training-via">{via}</span>
    </div>
  );
}
