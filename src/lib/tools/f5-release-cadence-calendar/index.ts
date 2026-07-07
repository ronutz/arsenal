// ============================================================================
// index.ts — self-describing F5 release cadence calendar {manifest, run, vectors}
// Pure local date arithmetic: executionClass "localOnly", no dangerous inputs,
// shareSafetyDefault "safe" (nothing sensitive; the schedule is public).
// ============================================================================

import { run as computeCadence, type CadenceResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, F5_RELEASE_CADENCE_CALENDAR_GOLDEN_VECTORS } from "./golden-vectors";

export { GOLDEN_VECTOR_SET_ID, F5_RELEASE_CADENCE_CALENDAR_GOLDEN_VECTORS } from "./golden-vectors";
export type { CadenceInput, CadenceResult, CadenceCycle } from "./compute";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-release-cadence-calendar",
  canonicalAliases: [
    "f5-patch-calendar",
    "f5-release-schedule",
    "f5-security-notification-schedule",
    "f5-hardened-release-dates",
    "bigip-patch-tuesday",
  ],
  inputDetectors: [],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [],
  shareSafetyDefault: "safe",
  learnLinks: ["learn/f5-monthly-release-cadence"],
  sources: [
    {
      id: "f5-cadence-blog",
      label: "F5 blog — A faster release cadence: What's changing at F5 (Kunal Anand, CPO, 2026-07-06)",
      type: "reference",
      url: "https://www.f5.com/company/blog/release-cadence-security-notifications-frontier-ai",
      access_date: "2026-07-07",
      scope: "monthly hardened releases on the third Wednesday from 2026-07-15; monthly security notifications one month after each release, first on 2026-08-19 covering the 2026-07-15 release; out-of-band alerts and EHFs continue; F5 retains flexibility on notification timing",
      status: "active",
    },
    {
      id: "f5-sirt-email",
      label: "F5 SIRT — Announcement of Monthly Security Notifications (2026-07-07)",
      type: "reference",
      url: "https://www.f5.com/company/blog/release-cadence-security-notifications-frontier-ai",
      access_date: "2026-07-07",
      scope: "official SIRT notification confirming the monthly cadence dates and recommended actions (F5 Insight for ADSP, Ansible automation, Professional Services)",
      status: "active",
    },
    {
      id: "f5-frontier-ai",
      label: "F5 blog — Securing our code with frontier AI: What F5 built and learned (Kunal Anand)",
      type: "reference",
      url: "https://www.f5.com/company/blog/securing-our-code-with-frontier-ai-what-f5-built-and-learned",
      access_date: "2026-07-07",
      scope: "the rationale: an AI-driven scan/triage/fix/test/release cycle surfacing more issues, motivating the move off a quarterly cadence",
      status: "active",
    },
    {
      id: "f5-k4602",
      label: "F5 — Vulnerability disclosure policy (K4602)",
      type: "reference",
      url: "https://my.f5.com/manage/s/article/K4602",
      access_date: "2026-07-07",
      scope: "F5's overarching vulnerability disclosure policy referenced by the cadence blog",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export function run(input: { from?: string; months?: number }): CadenceResult {
  return computeCadence(input);
}

export const goldenVectors = F5_RELEASE_CADENCE_CALENDAR_GOLDEN_VECTORS;
export const rejectVectors = [];
