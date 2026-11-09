-- SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
-- SPDX-License-Identifier: Apache-2.0

-- ============================================================================
-- migrations/0001_fun_scores.sql
-- ----------------------------------------------------------------------------
-- THE /dev/fun GAMES' PUBLIC SCOREBOARD (PRIME's decisions of 08/11/2026):
-- one Cloudflare D1 table, written and read by worker/scores.ts. Applied with
-- `wrangler d1 migrations apply ronutz-scores --remote` (wrangler's D1
-- migrations folder convention: ./migrations, numbered files, applied once).
--
-- ONE ROW PER FINISHED DAILY ROUND, and only what the board shows. The
-- server works every number out itself (src/lib/fun/verify.ts re-checks the
-- round against the day's puzzle); nothing the browser claims as a score is
-- stored.
--
-- WHAT IS NEVER STORED, and so has no column: the IP address, the user agent
-- or any other request header (the country comes from Cloudflare's own
-- request.cf.country, two letters), cookies, an account, any browser or device
-- identifier, and any time finer than a UTC day. As with the request counts
-- (worker/analytics.ts), the absence of those columns is the privacy promise:
-- a question nobody can answer from this table is a question nobody can ask.
--
-- WHY THERE IS NO ROW NUMBER. An ordinary SQLite table numbers its rows in
-- the order they arrive, and that order is a timeline: it would tell which
-- round of a day came before which, a finer clock than the day. The table is
-- WITHOUT ROWID, keyed by the submission's own random nonce, so rows are kept
-- in an order that means nothing.
--
-- Rows are kept for 400 days from the day they were received; the Worker
-- deletes older ones as it writes (worker/scores.ts, about one write in 200).
-- ============================================================================

CREATE TABLE IF NOT EXISTS fun_scores (
  -- 128 random bits made by the browser for this one submission, as 32 hex digits; the key, and the only thing that
  -- lets the same browser change this round's initials later the same day.
  nonce TEXT PRIMARY KEY CHECK (length(nonce) = 32),
  -- The game's id (a /dev/fun page slug).
  game TEXT NOT NULL,
  -- The puzzle's day, YYYY-MM-DD (UTC).
  day TEXT NOT NULL CHECK (length(day) = 10),
  -- "daily", or one of Spanning Tree's two daily levels ("easy", "hard").
  mode TEXT NOT NULL,
  -- Solved (or passed, or won) by the game's own rule: 1 or 0.
  won INTEGER NOT NULL CHECK (won IN (0, 1)),
  -- The headline number in the game's direction (tries, clues, milliseconds, answers right, points); NULL for an
  -- unsolved round that has none.
  score REAL,
  -- The time that breaks ties between equal scores, in milliseconds, or NULL.
  time_ms INTEGER,
  -- The parts the game shows, as JSON (checks, hints, assist, mistakes, waves...).
  parts TEXT NOT NULL DEFAULT '{}',
  -- Three characters A-Z 0-9, or ??? when none were given.
  initials TEXT NOT NULL DEFAULT '???' CHECK (length(initials) = 3),
  -- Two letters from Cloudflare's request.cf.country, or NULL when it gave none.
  country TEXT CHECK (country IS NULL OR length(country) = 2),
  -- 1 when the game's engine re-checked the round; 0 for the games held to plausibility bounds only.
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  -- 0 when the time is faster than a person could enter the solution: counted, kept out of the top ten.
  plausible INTEGER NOT NULL CHECK (plausible IN (0, 1)),
  -- The UTC date the row was received, YYYY-MM-DD; never a time of day.
  received TEXT NOT NULL CHECK (length(received) = 10)
) WITHOUT ROWID;

-- A day's board for one game and mode: every read of the board starts here.
CREATE INDEX IF NOT EXISTS fun_scores_board ON fun_scores (game, mode, day);

-- The shelf's totals over the last days, and the cleanup of rows past 400 days.
CREATE INDEX IF NOT EXISTS fun_scores_day ON fun_scores (day);

-- The cleanup reads the day of receipt.
CREATE INDEX IF NOT EXISTS fun_scores_received ON fun_scores (received);
