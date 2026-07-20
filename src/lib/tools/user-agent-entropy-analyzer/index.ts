// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/user-agent-entropy-analyzer/index.ts — engine + manifest.
// ============================================================================

export { analyzeUa, run, UaInputError } from "./compute";
export type { UaAnalysis, UaComponent } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { UaVector, VerifyReport } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "user-agent-entropy-analyzer",
  sources: [
    { id: "mdn-ua", label: "MDN — User-Agent header", type: "reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent", access_date: "2026-07-19", scope: "UA token structure and product/version conventions", status: "active" },
    { id: "ua-ch", label: "User-Agent Client Hints (W3C / WICG)", type: "spec", url: "https://wicg.github.io/ua-client-hints/", access_date: "2026-07-19", scope: "Sec-CH-UA hints, Accept-CH, the high-entropy request model", status: "active" },
    { id: "chrome-reduction", label: "Chrome — User-Agent reduction", type: "reference", url: "https://www.chromium.org/updates/ua-reduction/", access_date: "2026-07-19", scope: "the frozen minor version and capped platform detail", status: "active" },
    { id: "panopticlick", label: "EFF Cover Your Tracks — browser fingerprint entropy", type: "reference", url: "https://coveryourtracks.eff.org/", access_date: "2026-07-19", scope: "the distinguishing-bits framing this tool illustrates", status: "active" },
  ],
});
