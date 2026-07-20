// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/http-header-order-fingerprint/index.ts — engine + manifest.
// ============================================================================

export { analyzeHeaders, parseHeaderBlock, run, HeaderInputError } from "./compute";
export type { HeaderAnalysis, ParsedHeader, OrderNote, ClientHint } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { HeaderVector, VerifyReport } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "http-header-order-fingerprint",
  sources: [
    { id: "rfc9110", label: "RFC 9110 — HTTP Semantics (field order)", type: "spec", url: "https://www.rfc-editor.org/rfc/rfc9110", access_date: "2026-07-19", scope: "header field semantics; order not significant to meaning but observable", status: "active" },
    { id: "rfc9113", label: "RFC 9113 — HTTP/2 (lowercased field names, :authority)", type: "spec", url: "https://www.rfc-editor.org/rfc/rfc9113", access_date: "2026-07-19", scope: "the wire lowercasing and pseudo-headers this tool notes", status: "active" },
    { id: "fetch-metadata", label: "W3C — Fetch Metadata Request Headers", type: "spec", url: "https://www.w3.org/TR/fetch-metadata/", access_date: "2026-07-19", scope: "Sec-Fetch-* headers emitted by browsers", status: "active" },
  ],
});
