// ============================================================================
// src/lib/tools/cron-expression-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the cron expression
// explainer, the standing tools queue's rank-1 item.
// ============================================================================
import { run, type CronResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  CRON_GOLDEN_VECTORS,
  CRON_REJECT_VECTORS,
} from "./golden-vectors";

export { run, CronError } from "./compute";
export type { CronResult, CronField, CronPart, CronWarning, CronErrorCode } from "./compute";
export { GOLDEN_VECTOR_SET_ID, CRON_GOLDEN_VECTORS, CRON_REJECT_VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the cron expression explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "cron-expression-explainer",
  canonicalAliases: ["cron", "crontab", "cron expression", "cron schedule", "@daily"],
  inputDetectors: [
    {
      // Five whitespace-separated cron tokens, or an @macro. Anchored, linear,
      // bounded token classes - ReDoS-safe.
      kind: "regex",
      pattern:
        "^\\s*(@(yearly|annually|monthly|weekly|daily|midnight|hourly|reboot)|([\\d*,/\\-A-Za-z]+\\s+){4}[\\d*,/\\-A-Za-z]+)\\s*$",
      priority: 6,
      example: "*/15 2 * * 1-5",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"], // pure parse + date arithmetic on a caller-given instant
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"],
  shareSafetyDefault: "param", // schedules are non-sensitive

  // -- Teaching & provenance --
  learnLinks: [],
  sources: [
    {
      id: "crontab5-man7",
      label: "crontab(5), man7.org - the five fields and their ranges, lists/ranges/steps, month and weekday names, 0 and 7 both meaning Sunday, the day-of-month OR day-of-week rule, and the @-macro table",
      type: "manual",
      url: "https://man7.org/linux/man-pages/man5/crontab.5.html",
      access_date: "2026-08-27",
      scope: "the whole field grammar, the OR rule, and every @macro expansion",
      status: "active",
    },
    {
      id: "posix-crontab",
      label: "POSIX crontab (The Open Group Base Specifications) - the portable core of the format the Vixie extensions build on",
      type: "standard",
      url: "https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html",
      access_date: "2026-08-27",
      scope: "the baseline five-field grammar and field domains",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo N\u00fctzmann", role: "implementation", public: true },
  ],
});

/**
 * runTool - the registry-facing entry point.
 * @param input a crontab schedule or @macro, e.g. "*\/15 2 * * 1-5"
 */
export function runTool(input: string): CronResult {
  return run(input);
}

export const goldenVectors = CRON_GOLDEN_VECTORS;
export const rejectVectors = CRON_REJECT_VECTORS;
