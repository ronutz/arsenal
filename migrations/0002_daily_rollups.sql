-- SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
-- SPDX-License-Identifier: Apache-2.0

-- ============================================================================
-- migrations/0002_daily_rollups.sql
-- ----------------------------------------------------------------------------
-- DAILY TOTALS, KEPT PAST THE COUNTING STORE'S THREE MONTHS (PRIME 12/11/2026
-- 02:35). The request counts and the interest counts live in Cloudflare's
-- Workers Analytics Engine, which keeps what is written to it for three
-- months. To see a trend longer than that, the Worker adds each finished UTC
-- day up once (worker/rollup.ts, on a daily schedule) and writes the day's
-- TOTALS here, in the same D1 database as the games' scoreboard.
--
-- WHAT A ROW IS. A sum for a day: so many pages served to people at this
-- address; so many uses of this tool; so many searches that found nothing for
-- these words. A row never describes a request or a reader, and nothing in
-- these tables can be laid beside anything else to make one: there is no
-- country, no device, no referrer beside a page, no identifier, and no time
-- finer than the UTC day.
--
-- THREE TABLES, as apart as the datasets they are added up from:
--   daily_pages   pages served to people, per address
--   daily_events  the interest counts (sent only by readers who said yes)
--   daily_totals  a handful of whole-site figures per day
--
-- All three are WITHOUT ROWID for the reason migrations/0001 gives: an
-- ordinary table numbers its rows in arrival order, a clock nobody asked for.
--
-- Rows are kept for 760 days (about 25 months) and then deleted by the same
-- daily job; a day can be added up again at any time while its counts are
-- still in the counting store (the job replaces the day's rows whole).
-- Applied with `wrangler d1 migrations apply ronutz-scores --remote`.
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_pages (
  -- The UTC day the pages were served, YYYY-MM-DD.
  day TEXT NOT NULL CHECK (length(day) = 10),
  -- The page's language, as its address spells it ("en", "pt-BR"); "" for an address without one.
  locale TEXT NOT NULL,
  -- The part of the site, from the address: tools, learn, glossary, fun (the puzzles and the arcade), home, ...
  section TEXT NOT NULL,
  -- The address served, as the counting store holds it ("/en/tools/cidr/").
  path TEXT NOT NULL,
  -- How many times it was served to people that day.
  views INTEGER NOT NULL CHECK (views >= 0),
  -- One row per address per day.
  PRIMARY KEY (day, path)
) WITHOUT ROWID;

-- One address over time (an entry before and after it was rewritten).
CREATE INDEX IF NOT EXISTS daily_pages_by_path ON daily_pages (path, day);
-- No index by section: every question about a section is asked over a stretch of days, which the primary key
-- (day first) already walks, and a second index would add a third to what each day writes and keeps.

CREATE TABLE IF NOT EXISTS daily_events (
  -- The UTC day of the uses, YYYY-MM-DD.
  day TEXT NOT NULL CHECK (length(day) = 10),
  -- What was done: one of the kinds in src/lib/interest/shape.ts (tool_use, game_start, search, ...).
  kind TEXT NOT NULL,
  -- The part of the site: tools, learn, glossary, fun, site.
  section TEXT NOT NULL,
  -- The thing's slug; for a search, "hit" or "empty".
  item TEXT NOT NULL,
  -- The page's language.
  locale TEXT NOT NULL,
  -- One of the kind's fixed words (won, lost, link, ...), the plain words of a search that found nothing, or "".
  detail TEXT NOT NULL,
  -- How many that day.
  n INTEGER NOT NULL CHECK (n >= 0),
  -- One row per combination per day.
  PRIMARY KEY (day, kind, section, item, locale, detail)
) WITHOUT ROWID;

-- No second index: every read of this table is over a stretch of days, which the primary key (day first) walks.

CREATE TABLE IF NOT EXISTS daily_totals (
  -- The UTC day, YYYY-MM-DD.
  day TEXT NOT NULL CHECK (length(day) = 10),
  -- The figure's name: people (pages served to people), automation (pages served to crawlers and other machines),
  -- missing (requests for addresses that are not pages), source:search, source:ai, source:social, source:other
  -- (arrivals by the family of the referring site), and rolled (when the day was added up, in Unix seconds).
  metric TEXT NOT NULL,
  -- The figure.
  value INTEGER NOT NULL,
  -- One row per figure per day.
  PRIMARY KEY (day, metric)
) WITHOUT ROWID;
