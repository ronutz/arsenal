-- SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
-- SPDX-License-Identifier: Apache-2.0

-- ============================================================================
-- migrations/0004_fun_first_today.sql
-- ----------------------------------------------------------------------------
-- HOW MANY BROWSERS POSTED A ROUND EACH DAY, WITHOUT KNOWING WHICH (the site
-- owner, 12/11/2026 17:06 to 17:09). One more column on the scoreboard's table
-- (migrations/0001_fun_scores.sql), holding one bit per round, and a small
-- index to add the bits up. Applied with
-- `wrangler d1 migrations apply ronutz-scores --remote`.
--
-- WHAT THE BIT IS. The browser already knows whether it has published a round
-- today: it keeps the UTC day of its last published round in its own storage
-- (ronutz:fun:posted-day, which never leaves it; src/lib/fun/board.ts). With
-- the first round it publishes on a puzzle day it sends `first: true`, with
-- every other round `first: false`. The Worker (worker/scores.ts) writes that
-- yes or no beside the new round and nothing else: a round sent again with a
-- nonce already stored, or a round the server refuses, adds nothing.
--
-- WHAT IT COUNTS. The sum of the bits over a day's rows is how many browsers
-- published at least one round that day. Browsers, not people and not devices:
-- a phone and a laptop count as two, two browsers on one computer count as
-- two, and a private window or cleared site data counts again. The day is the
-- puzzle's day (the `day` column), the same day the scoreboard's "rounds
-- today" counts by.
--
-- WHY IT IS NOT AN IDENTIFIER. The bit is the same for every browser's first
-- round of a day; it names no browser, it is not derived from anything about
-- the browser or the request, and nothing in a row with it set says which
-- other rows came from the same browser, on that day or any other. The
-- promise of migrations/0001 stands as written: no IP address, no user agent,
-- no cookie, no browser or device identifier, no time finer than the UTC day.
--
-- Rows written before this migration, and rows from pages loaded before the
-- browser side shipped, keep the default 0; the Worker shows the days before
-- the first set bit as "no data", never as zero (worker/scores.ts). The daily
-- adding-up keeps each day's sum as the "fun_browsers" figure in daily_totals
-- (worker/rollup.ts), so the count outlives the rows' 400 days.
-- ============================================================================

-- 1 when the browser said this was the first round it published on the round's puzzle day; 0 otherwise (and for
-- every row stored before this column existed). One bit, the same for every browser: never an identifier.
ALTER TABLE fun_scores ADD COLUMN first_today INTEGER NOT NULL DEFAULT 0 CHECK (first_today IN (0, 1));

-- The rows with the bit set, by day: the day's count and the first day counted are read from here, without
-- walking the rows that do not carry it.
CREATE INDEX IF NOT EXISTS fun_scores_first_today ON fun_scores (day) WHERE first_today = 1;
