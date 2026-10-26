// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/config/countingSource.ts
// ----------------------------------------------------------------------------
// WHERE A READER CAN CHECK THE COUNTING (Round 1 batch B, B9, 2026-10-26).
//
// WHY. The production audit of 2026-10-19 scored the Privacy and Stats pages
// well but noted that what they say about the server-side count (what is
// written, what is never written, how long it is kept) is an operational claim
// a reader cannot verify from the browser. The count is made by code that is
// already public, so the two pages now link it, and the one retention figure
// the code cannot show (how long the store keeps a row) cites the provider's
// own documentation with its read date.
//
// WHAT. The public repository the footer, the home page, the License page and
// the Contribute page already link (https://github.com/ronutz/arsenal), and
// three files on its main branch: the write side of the count, the read side
// behind the Stats page, and the configuration that binds the two datasets.
// Each was read on 2026-10-26 from raw.githubusercontent.com (HTTP 200) and is
// byte-identical to the file in this tree that day.
//
// The retention figure: "Data written to Workers Analytics Engine is stored for
// three months." (Cloudflare, Workers Analytics Engine, Limits, "Data
// retention"; read 2026-10-26, HTTP 200). The datasets are Analytics Engine
// datasets by wrangler.jsonc's analytics_engine_datasets binding.
// ============================================================================

/** The public source repository, exactly as the site's footer links it. */
export const SOURCE_REPOSITORY = "https://github.com/ronutz/arsenal";

/** The write side of the count: what each request records, and what it never records. */
export const COUNTING_WRITE_SOURCE = `${SOURCE_REPOSITORY}/blob/main/worker/analytics.ts`;

/** The read side: the aggregation behind the Stats page and the per-page counters. */
export const COUNTING_READ_SOURCE = `${SOURCE_REPOSITORY}/blob/main/worker/stats.ts`;

/** The configuration that binds the two Analytics Engine datasets to the Worker. */
export const COUNTING_CONFIG_SOURCE = `${SOURCE_REPOSITORY}/blob/main/wrangler.jsonc`;

/** Cloudflare's own statement of how long Analytics Engine keeps what is written to it (read 2026-10-26). */
export const COUNTING_RETENTION_SOURCE = "https://developers.cloudflare.com/analytics/analytics-engine/limits/";

/** The date the retention source was read, printed beside it in the copy and kept here for the next re-read. */
export const COUNTING_RETENTION_READ = "2026-10-26";
