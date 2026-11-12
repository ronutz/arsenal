-- SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
-- SPDX-License-Identifier: Apache-2.0

-- ============================================================================
-- migrations/0003_desk_sync.sql
-- ----------------------------------------------------------------------------
-- THE DESK'S OPTIONAL ENCRYPTED SYNC (PRIME 12/11/2026 12:42, "My desk",
-- phase 4): one table in the site's one D1 database, written and read by
-- worker/desk.ts under /api/desk/<id>, and only for readers who turn sync on.
-- Applied with `wrangler d1 migrations apply ronutz-scores --remote`.
--
-- WHAT A ROW IS. An encrypted copy of one reader's desk, under an id the
-- reader's browser derived from a sync code the server never sees. The copy
-- is AES-GCM ciphertext made in the browser; the server holds no key and
-- cannot read it.
--
-- WHAT IS NEVER STORED, and so has no column: the IP address, the user agent
-- or any other request header, a cookie, an account, the sync code, the key,
-- and any time finer than a UTC day. As in migrations/0001, the absence of
-- those columns is the promise.
--
-- WITHOUT ROWID for the reason migrations/0001 gives: an ordinary table
-- numbers its rows in arrival order, a clock nobody asked for.
--
-- A row nobody has read or written for more than 365 days is deleted by the
-- Worker's daily scheduled run (worker/desk.ts, cleanIdleDesks); a reader can
-- delete their own row at any time (DELETE /api/desk/<id>).
-- ============================================================================

CREATE TABLE IF NOT EXISTS desk_sync (
  -- The first 32 hex characters of SHA-256 over "ronutz-desk-id:" and the sync code, computed in the browser.
  id TEXT PRIMARY KEY CHECK (length(id) = 32),
  -- The copy as stored: base64url (no padding) of a 12-byte IV followed by the AES-GCM ciphertext.
  data TEXT NOT NULL,
  -- The copy's version: 1 for the first write, one more for each accepted write.
  version INTEGER NOT NULL CHECK (version >= 1),
  -- The bytes the copy decodes to (the Worker accepts at most 98,304; the limit lives in code, not in this table).
  size INTEGER NOT NULL CHECK (size >= 0),
  -- The UTC day the row was last read or written, YYYY-MM-DD: what the idle deletion reads.
  touched_day TEXT NOT NULL CHECK (length(touched_day) = 10),
  -- The UTC day the write count below belongs to, YYYY-MM-DD.
  writes_day TEXT NOT NULL CHECK (length(writes_day) = 10),
  -- Writes accepted on writes_day (the Worker accepts at most 300 a day).
  writes INTEGER NOT NULL CHECK (writes >= 0)
) WITHOUT ROWID;

-- The daily idle deletion reads touched_day alone; this index lets it do so without reading the stored copies.
CREATE INDEX IF NOT EXISTS desk_sync_touched ON desk_sync (touched_day);
