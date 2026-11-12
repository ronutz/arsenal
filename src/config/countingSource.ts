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

// THE GAMES' PUBLIC SCOREBOARD (PRIME 08/11/2026). The Privacy page's "Game scores" section links the three files that
// store, check and define the board's rounds, so what it says (the fields kept, the fields never kept, the 400 days)
// can be checked against the code the same way. They join the repository with the board; until that change is
// pushed the links name files that exist in this tree only (scripts/check-counting-source.mjs checks the tree).
/** The board's endpoints and its storage: what a row keeps, what it never keeps, the cleanup after 400 days. */
export const SCORES_WRITE_SOURCE = `${SOURCE_REPOSITORY}/blob/main/worker/scores.ts`;

/** The check every posted round goes through: the day's puzzle rebuilt and the round graded again. */
export const SCORES_VERIFY_SOURCE = `${SOURCE_REPOSITORY}/blob/main/src/lib/fun/verify.ts`;

/** The table itself: its columns, and the ones it does not have. */
export const SCORES_SCHEMA_SOURCE = `${SOURCE_REPOSITORY}/blob/main/migrations/0001_fun_scores.sql`;

// THE INTEREST COUNTS (PRIME 12/11/2026 02:35). The Privacy page's "Interest counts" section links the four files that
// decide what a count may hold, send it only after a yes, write it, and hold the code to the section at every build.
// They join the repository with the feature; until that change is pushed the links name files that exist in this tree
// only (scripts/check-counting-source.mjs checks the tree).
/** The rules for what a count may hold: the kinds, the sections, the fixed words, and when a search's words are plain. */
export const INTEREST_SHAPE_SOURCE = `${SOURCE_REPOSITORY}/blob/main/src/lib/interest/shape.ts`;

/** The page's side: the choice kept in the browser, and the one function that sends a count, only after a yes. */
export const INTEREST_CLIENT_SOURCE = `${SOURCE_REPOSITORY}/blob/main/src/lib/interest/client.ts`;

/** The server's side: what is refused, what is dropped, and the one row of five fields that is written. */
export const INTEREST_WRITE_SOURCE = `${SOURCE_REPOSITORY}/blob/main/worker/events.ts`;

/** The check run at every build, which holds the three files above to what the Privacy page says. */
export const INTEREST_CHECK_SOURCE = `${SOURCE_REPOSITORY}/blob/main/scripts/check-interest-counts.mts`;

// THE DESK'S OPTIONAL ENCRYPTED SYNC (PRIME 12/11/2026 12:42, "My desk"). For the Privacy page's description of the
// sync: the route that stores the encrypted copy, the table it is kept in, and the check that holds the route to its
// contract at every build. Like the interest files, they join the repository with the feature
// (scripts/check-counting-source.mjs checks each linked file exists in this tree).
/** The server's side: the three routes, the limits, what is refused, and the daily deletion of idle copies. */
export const DESK_SYNC_SOURCE = `${SOURCE_REPOSITORY}/blob/main/worker/desk.ts`;

/** The table: its seven columns, and the ones it does not have. */
export const DESK_SYNC_SCHEMA_SOURCE = `${SOURCE_REPOSITORY}/blob/main/migrations/0003_desk_sync.sql`;

/** The check run at every build, which holds the route to its contract. */
export const DESK_SYNC_CHECK_SOURCE = `${SOURCE_REPOSITORY}/blob/main/scripts/check-desk-sync.mts`;

// The browser's side of the same sync (DESK-UI, 12/11/2026): what the page sends and when, and how the code becomes a
// name and a key. Linked from the Privacy page's "My desk" section beside the three files above.
/** The browser's side: when a copy is read, merged and written, and what travels (never the code or the key). */
export const DESK_CLIENT_SOURCE = `${SOURCE_REPOSITORY}/blob/main/src/lib/desk/sync.ts`;

/** The encryption: the sync code, the name and the key derived from it, and the AES-GCM blob. */
export const DESK_CRYPTO_SOURCE = `${SOURCE_REPOSITORY}/blob/main/src/lib/desk/crypto.ts`;

/** Cloudflare's own statement of how long Analytics Engine keeps what is written to it (read 2026-10-26). */
export const COUNTING_RETENTION_SOURCE = "https://developers.cloudflare.com/analytics/analytics-engine/limits/";

/** The date the retention source was read, printed beside it in the copy and kept here for the next re-read. */
export const COUNTING_RETENTION_READ = "2026-10-26";
