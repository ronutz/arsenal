// ============================================================================
// src/config/leadRouting.ts
// ----------------------------------------------------------------------------
// LEAD ROUTING — where a "Request this training" click is sent, per course.
//
// THE MODEL (and why): every course needs a destination for training inquiries.
// Right now that is Red Education (the authorized training center delivering
// these courses) for ALL courses. But that must be easy to change, either for
// one course, for a whole platform at once (batch), or globally, and it must be
// ready to route to Rodolfo directly in the future. So routing is resolved in a
// clear precedence order from the most specific override to the global default:
//
//     course-specific override  >  platform-wide override  >  global default
//
// To shift ONE course: add an entry to `courseOverrides`.
// To shift a WHOLE platform at once (batch): add an entry to `platformOverrides`.
// To shift EVERYTHING: change `globalDefault`.
// To route to Rodolfo directly: point any of the above at `SELF`.
//
// This is config-driven (static site, no backend); the resolver `routeFor()` is
// the seam that a future runtime settings service can feed without touching the
// components that call it.
// ============================================================================

import { redEducationUrl } from "@/config/redEducation";

export interface LeadDestination {
  /** Short label shown to users / used in the button. */
  name: string;
  /** Where the inquiry goes. */
  url: string;
  /** Kind of destination, for styling/analytics and future logic. */
  kind: "atc" | "self";
}

// ----------------------------------------------------------------------------
// Named destinations. Add new ATCs here, then reference them in the overrides.
// ----------------------------------------------------------------------------

/** Red Education — the current authorized training center for all courses. */
const RED_EDUCATION: LeadDestination = {
  name: "Red Education",
  // Lead-attributed URL: utm_campaign=training-cta marks this as the course/
  // platform "Request this training" placement. The UTM params ride the query
  // string and are safely ignored if Red Education does not consume them.
  url: redEducationUrl("training-cta"),
  kind: "atc",
};

/**
 * Rodolfo, directly. PREPARED FOR THE FUTURE: not used by default today, but
 * ready, point any override here to route inquiries to Rodolfo's own contact.
 * (Wired to the site's own contact route once that is the desired path.)
 */
const SELF: LeadDestination = {
  name: "Rodolfo Nützmann",
  url: "/contact",
  kind: "self",
};

// Example of how another ATC would be added (left here as a template, unused):
// const OTHER_ATC: LeadDestination = {
//   name: "Some ATC",
//   url: "https://example-atc.com/",
//   kind: "atc",
// };

// ----------------------------------------------------------------------------
// Routing configuration. EDIT THESE to change where inquiries go.
// ----------------------------------------------------------------------------

/** Global default: where everything goes unless overridden. */
const globalDefault: LeadDestination = RED_EDUCATION;

/**
 * Per-platform (BATCH) overrides. Key = platform slug ("f5", "extreme",
 * "fortinet", "netskope"). An entry here redirects EVERY course on that platform
 * at once. Empty today (all platforms use the global default).
 *
 * Example: to send all F5 courses to Rodolfo, add `f5: SELF`.
 */
const platformOverrides: Record<string, LeadDestination> = {
  // f5: SELF,
};

/**
 * Per-course overrides. Key = "platformSlug/courseSlug". An entry here redirects
 * a single course, taking precedence over the platform and global settings.
 * Empty today.
 *
 * Example: `"f5/developing-irules": SELF`.
 */
const courseOverrides: Record<string, LeadDestination> = {
  // "f5/configuring-ltm": SELF,
};

// ----------------------------------------------------------------------------
// The resolver — the seam every caller uses.
// ----------------------------------------------------------------------------

/**
 * Resolve where a training inquiry for a given course should go, honoring the
 * precedence: course override > platform override > global default.
 *
 * @param platform platform slug (e.g. "f5")
 * @param course   course slug (e.g. "configuring-ltm")
 */
export function routeFor(platform: string, course: string): LeadDestination {
  const courseKey = `${platform}/${course}`;
  if (courseOverrides[courseKey]) return courseOverrides[courseKey];
  if (platformOverrides[platform]) return platformOverrides[platform];
  return globalDefault;
}

/** Resolve the platform-level destination (for a platform page CTA). */
export function routeForPlatform(platform: string): LeadDestination {
  if (platformOverrides[platform]) return platformOverrides[platform];
  return globalDefault;
}
