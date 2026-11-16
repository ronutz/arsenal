#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-desk-store.mts — MY DESK KEEPS ITS PROMISES (PRIME 12/11/2026
// 12:42; PLAN-personal-desk-20261112, section 4: "the Privacy page's key list
// matching the code, no network call from the page's module"; the build
// spec's sync contract).
// ----------------------------------------------------------------------------
// Runs the desk's own code (src/lib/desk/) against stand-ins, with no network,
// and reads the pages and packs, and fails the build when any of these stops
// being true:
//   1. THE STORE: whatever is stored comes back as a desk (repaired, not
//      thrown away); identifiers only, days only; the limits hold (20 paths of
//      300 items); saving, read marks, paths (create, add, move, remove, delete
//      and restore), live paths not edited, renames followed, clearing leaves
//      removals so a sync cannot bring everything back;
//   2. THE MERGE (the sync contract): unions of saved and read, a removal
//      winning only when its day is later; paths by id with the higher
//      revision, a deletion beating the copy it deleted and a restored path
//      beating the deletion; settings and layout from the newer side; notes
//      only when they travel; the synced part never carries the sync code or
//      the bookkeeping;
//   3. THE ENCRYPTION, checked against Node's own crypto, not against itself:
//      the code is 20 random bytes in 32 Crockford characters; the id is the
//      first 32 hex of SHA-256("ronutz-desk-id:" + code); the key is HKDF-SHA-256
//      (salt "ronutz-desk", info "aes-gcm-256 v1") of the code's bytes; the blob
//      is base64url without padding of a 12-byte IV and the AES-256-GCM
//      ciphertext of the JSON; the server's 98,304-byte limit is the client's;
//   4. THE PRIVACY PAGE: the key ronutz:desk:v1 is the code's key and is named
//      in browserBody and deskBody in all six written packs; the desk section,
//      its sync paragraphs and their five source links are rendered; the
//      revision is recorded; saving is named among the interest counts;
//   5. NO OTHER NETWORK CALL: in src/lib/desk and src/components/desk, fetch
//      appears only in the sync client (to /api/desk/) and the index loader
//      (the site's own index files); no XMLHttpRequest, sendBeacon, WebSocket,
//      EventSource or absolute address; the one interest count is "save";
//   6. THE KEYS: the desk's three shortcuts are registered and named in all six
//      packs.
// PORTABLE STORAGE (PRIME 12/11/2026 13:38, "a guard checks that every
// localStorage key the code writes is registered"):
//   7. THE REGISTRY: every key the site's code writes with localStorage or
//      sessionStorage.setItem (a literal, a constant, a template's prefix, a
//      storageKey prop, a generic writer's callers) is in PORTABLE_KEYS or
//      LOCAL_ONLY_KEYS (src/lib/desk/portable.ts); a sessionStorage key is
//      local-only and registered as a session key; every entry is written
//      somewhere; the Privacy page names every entry in all six packs; the
//      profile collected from storage leaves out what is local-only and the
//      games' public board choices;
//   8. THE PROFILE BLOB, against Node's own crypto and zlib: version 2 is
//      {"v":2,"keys":{...}} gzip-compressed, then sealed as in 3; a version 1
//      blob (the desk alone) opens as a profile holding the desk;
//   9. THE THREE-WAY MERGE: a key changed on one side takes that side; changed
//      on both, its rule (the desk's merge; the games' records combined, counts
//      added from the last synced values, the longer streak; the recent pages
//      united newest first, six at most; the drill's best and added totals; a
//      setting from the browser in use, from the other side on a first sync); a
//      deletion against an unchanged value deletes, a change beats a deletion; a
//      key the registry does not list is dropped; notes not sent are kept from
//      the other side; the pairing link, the profile link and the profile file
//      read back what was written;
//  10. THE QR CODE: the in-house encoder (src/lib/desk/qr.ts) draws, for eight
//      fixed texts (pairing links, versions 1 to 10, UTF-8), the same matrices
//      that OpenCV's QR decoder read back to the same texts on 12/11/2026; their
//      SHA-256 hashes are the golden vectors; a text past version 10 is refused.
// MY DESK, PART 2 (phases 3 and 4, 12/11/2026):
//  11. THE LAYOUT: every catalogue widget is well formed and named in the six
//      packs; the starter layouts are valid as stored; moving, resizing,
//      removing and adding behave and never edit the list they were given; a
//      widget held once is not added twice; the page's limit holds.
//  12. NEW FOR YOU: against a small index, an item changed after its read
//      mark is listed under its current name; an unread item of a followed
//      series dated since the previous visit is listed once; a tool of a kept
//      family likewise, not another family's; the first visit looks back
//      thirty days.
//  13. THE SETTINGS' CHANGE TIMES (the site owner, 12/11/2026 14:42): by
//      default a setting changed on both sides takes the later change (a tie
//      keeps the browser in use, a first sync too when both times are known);
//      an older copy without times, and a browser where the reader chose to
//      keep its own value, merge as before; the merged times are the kept
//      side's; the times travel inside the encrypted copy only (read back by
//      Node); a write is noted to the minute, the first look stamps nothing,
//      the sync's own writes keep the time they came with; the option deletes
//      the times and records none; both keys are local-only; Settings states
//      the default and offers the option in the six packs.
//  14. THE INDEX LABELS: read the desk's key without the store, write
//      nothing, placed after paint and absolutely; on the three index pages.
//  15. NOTES: emptying keeps an empty note one revision newer, which wins a
//      merge; a removed notes widget's note is emptied on Done, other notes
//      stay; an emptied note is forgotten after 120 days; notes widgets can be
//      added more than once.
//  16. THE EXAM COUNTDOWN: a name and a day kept as stored; several allowed;
//      whole calendar days, never a time.
//  17. QUICK TOOLS: the manifests declaring deskQuick are the desk's quick
//      tools; each engine is a lazy import of its compute.ts alone; each
//      example answers with labelled rows, nonsense never throws, the subnet
//      answer is right by value; every row label is in the six packs.
//  19. GUIDE PAGES: each certification guide's page carries Save, Mark as
//      read and Add to path for guide:<slug>, with "Continue this path" under
//      them; the guide's identifier and address name each other; every guide
//      is in each language's site index; a saved guide counts in the site's
//      section.
//  20. READING STREAKS AND MILESTONES (the site owner, 12/11/2026 15:22):
//      runs counted in whole days; an older desk seeded from its marks' days;
//      a mark today lengthens the run and records a week's milestone once,
//      celebrated once; undoing today's only mark leaves no day, and a
//      milestone reached today that no longer holds is withdrawn (one reached
//      on an earlier day stays); every held mark's day is a reading day; a
//      milestone is dated the day it was in fact reached (the tenth mark's
//      day, the seventh day of the first week's run); ten items and a finished
//      path are milestones; records merge by union, longer run, earlier day;
//      the record travels with the desk; the celebration moves only without
//      reduced motion; the words never speak of a loss.
//  21. CONTINUE THIS PATH (the site owner, 12/11/2026 15:22): the next item
//      is the first unread one after the page, then before it, never the page
//      itself; "last" and "finished" said; paths in the reader's order with
//      My desk's own progress; nothing drawn for an item in no path, the list
//      of items loaded only when there is a path to show; mounted at the end
//      of every Learn article, near its top on a phone, and on tool pages;
//      the finish moves only without reduced motion; the link opens the path
//      on My desk; its words in six packs.
//  22. PRIVACY AND SETTINGS (the site owner, 12/11/2026 15:27): one widget,
//      in every starter; its controls are Settings' own (the counting switch,
//      the sync client's choices loaded only when used, the merge rule, the
//      read-mark setting); emptying asked in words, never a browser dialog,
//      undone by the page; its links land on real anchors; six packs.
// Prints what it checked.
// ============================================================================

// Files, Node's own crypto and zlib, for the independent checks.
import fs from "node:fs";
import path from "node:path";
import nodeCrypto from "node:crypto";
import zlib from "node:zlib";

/** The tag on every line. */
const TAG = "[check-desk-store]";
/** What went wrong. */
const errors: string[] = [];
/** How many things were checked. */
let checks = 0;

/**
 * Record one check.
 *
 * @param ok whether it held
 * @param what the promise, in words
 */
function check(ok: boolean, what: string): void {
  // Counted.
  checks += 1;
  // Kept when it failed.
  if (!ok) errors.push(what);
}

// ---- A browser stand-in: localStorage and the window's events, enough for the store -------------------------------
/** The stand-in storage. */
const mem = new Map<string, string>();
// The window the store reads (with the length and key() the profile's collector walks).
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
    setItem: (k: string, v: string) => { mem.set(k, String(v)); },
    removeItem: (k: string) => { mem.delete(k); },
    get length() { return mem.size; },
    key: (i: number) => [...mem.keys()][i] ?? null,
  },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
  location: { pathname: "/en/my-desk/" },
};

// The page's root element, for the theme and hints a merged profile applies at once.
(globalThis as unknown as { document: unknown }).document = { documentElement: { setAttribute: () => undefined, removeAttribute: () => undefined } };

// The desk's code, loaded after the stand-in exists.
const store = await import("../src/lib/desk/store");
const ids = await import("../src/lib/desk/ids");
const cryptoMod = await import("../src/lib/desk/crypto");
const sync = await import("../src/lib/desk/sync");
const portable = await import("../src/lib/desk/portable");
const transfer = await import("../src/lib/desk/transfer");
const qr = await import("../src/lib/desk/qr");

// ---- 1. The store --------------------------------------------------------------------------------------------------
// Garbage in, a desk out.
for (const raw of [null, 42, "x", [], { v: 9, saved: "nope", read: [1], paths: {}, layout: 3 }]) {
  const { data } = store.repairDesk(raw, "2026-11-12");
  check(data.v === 1 && Array.isArray(data.paths) && typeof data.saved === "object" && data.layout.widgets.length > 0, `repairDesk turns ${JSON.stringify(raw)} into a desk`);
}
// Bad entries dropped, good ones kept, repairs counted.
{
  const { data, repairs } = store.repairDesk({ v: 1, saved: { "tool:cidr": "2026-11-01", "nope:x": "2026-11-01", "learn:Bad Slug": "2026-11-01", "term:bfd": true }, read: { "learn:acme-protocol": "2026-11-02" } }, "2026-11-12");
  check(Object.keys(data.saved).join(",") === "tool:cidr,term:bfd" && data.saved["term:bfd"] === "2026-11-12" && repairs >= 3, "repairDesk keeps well-formed identifiers, dates a bare yes today, drops the rest and counts the repairs");
  check("learn:acme-protocol" in data.read, "repairDesk keeps read marks");
}
// Limits: 20 paths of 300 items.
{
  const many = Array.from({ length: 25 }, (_, i) => ({ id: `path${String(i).padStart(4, "0")}`, name: `p${i}`, items: Array.from({ length: 320 }, (_, j) => `learn:a${j}`), rev: 1, from: null, day: "2026-11-12" }));
  const { data } = store.repairDesk({ v: 1, paths: many }, "2026-11-12");
  check(data.paths.length === store.DESK_LIMITS.paths && data.paths.every((p) => p.items.length === store.DESK_LIMITS.pathItems), "a stored desk is cut to 20 paths of 300 items");
  check(store.DESK_LIMITS.paths === 20 && store.DESK_LIMITS.pathItems === 300, "the limits are 20 paths of 300 items");
}
// The live store, through the stand-in.
{
  // Saving, unsaving with a removal day, read marks.
  check(store.saveItem("tool:cidr" as never) === "saved" && store.saveItem("tool:cidr" as never) === "already", "saveItem saves once");
  check(store.getDeskState().data.meta.persistAsked === true, "the first save asks for persistent storage (once)");
  store.unsaveItem("tool:cidr" as never);
  const d1 = store.getDeskState().data;
  check(!("tool:cidr" in d1.saved) && store.isDay(d1.tomb.saved["tool:cidr"]), "unsaveItem removes and remembers the day");
  check(store.markRead("learn:acme-protocol" as never) && store.isRead(store.getDeskState().data, "learn:acme-protocol" as never), "markRead marks");
  // The stored text: identifiers and days only, no titles, no times.
  const stored = mem.get(store.DESK_KEY) ?? "";
  check(stored.length > 0 && !/T\d{2}:\d{2}/.test(stored), "the stored desk carries days, never times");
  // Paths: create, add, move, remove with undo, delete with undo.
  const r = store.createPath("My path", ["learn:a" as never, "learn:a" as never, "learn:b" as never]);
  check(r.ok && r.added === 2 && r.skipped === 1, "createPath keeps each item once");
  const pid = r.ok ? r.id : "";
  store.addToPath(pid, ["tool:x509" as never]);
  store.moveInPath(pid, 2, -1);
  const p1 = store.getDeskState().data.paths.find((p) => p.id === pid);
  check(p1?.items.join(",") === "learn:a,tool:x509,learn:b", "addToPath appends, moveInPath moves by one");
  const gone = store.removeFromPath(pid, 0);
  if (gone) store.insertIntoPath(pid, 0, gone);
  check(store.getDeskState().data.paths.find((p) => p.id === pid)?.items[0] === "learn:a", "removeFromPath is undone by insertIntoPath");
  const del = store.deletePath(pid);
  check(!!del && !store.getDeskState().data.paths.some((p) => p.id === pid) && (store.getDeskState().data.tomb.paths[pid] ?? 0) > (del?.path.rev ?? 0), "deletePath removes and remembers the revision after the path's last");
  if (del) store.restorePath(del);
  check(store.getDeskState().data.paths.some((p) => p.id === pid) && !(pid in store.getDeskState().data.tomb.paths), "restorePath puts it back and forgets the removal");
  // A live path is not edited until frozen.
  const live = store.createPath("", ["learn:a" as never], { id: "series:s" as never, mode: "live" });
  const lid = live.ok ? live.id : "";
  check(!store.addToPath(lid, ["learn:c" as never]).ok, "a live path refuses edits");
  store.refreshLivePaths(() => ["learn:a" as never, "learn:z" as never]);
  check(store.getDeskState().data.paths.find((p) => p.id === lid)?.items.join(",") === "learn:a,learn:z", "refreshLivePaths follows the collection");
  store.freezePath(lid);
  check(store.addToPath(lid, ["learn:c" as never]).ok, "a frozen copy can be edited");
  // Renames followed.
  store.saveItem("term:foobar" as never);
  store.followRedirects({ "term:foobar": "term:foo-bar" });
  check("term:foo-bar" in store.getDeskState().data.saved && !("term:foobar" in store.getDeskState().data.saved), "followRedirects renames saved items");
  // The path limit.
  for (let i = 0; i < 30; i += 1) store.createPath(`x${i}`);
  check(store.getDeskState().data.paths.length === 20 && !store.createPath("one more").ok, "no more than 20 paths");
  // Clearing leaves removals behind, keeps the sync settings, and undoes.
  const before = store.clearDesk();
  const cleared = store.getDeskState().data;
  check(cleared.paths.length === 0 && Object.keys(cleared.saved).length === 0 && "term:foo-bar" in cleared.tomb.saved && Object.keys(cleared.tomb.paths).length === 20, "clearDesk empties the desk and remembers the removals");
  store.restoreDesk(before);
  check(store.getDeskState().data.paths.length === 20, "restoreDesk undoes the clear");
}

// ---- 2. The merge --------------------------------------------------------------------------------------------------
{
  // Two sides.
  const base = store.emptyDesk("2026-11-01");
  const a = store.syncedPart({ ...base, saved: { "tool:a": "2026-11-05", "tool:b": "2026-11-05" }, tomb: { saved: { "tool:c": "2026-11-09" }, read: {}, paths: {} }, read: { "learn:x": "2026-11-05" } }, false);
  const b = store.syncedPart({ ...base, saved: { "tool:c": "2026-11-08", "tool:d": "2026-11-06" }, tomb: { saved: { "tool:b": "2026-11-05", "tool:a": "2026-11-06" }, read: {}, paths: {} }, read: { "learn:y": "2026-11-07" } }, false);
  const m = store.mergeDesks(a, b);
  check(Object.keys(m.saved).sort().join(",") === "tool:b,tool:d", "saved merges as a union where a removal wins only when later (a removed later, b kept on a same-day removal, c removed later)");
  check("learn:x" in m.read && "learn:y" in m.read, "read marks merge as a union");
  // Paths: higher revision; a deletion beats the copy it deleted; a restored path beats the deletion.
  const pA = { id: "pathaaaa", name: "A", items: [], rev: 3, from: null, day: "2026-11-01" };
  const pB = { id: "pathbbbb", name: "B", items: [], rev: 2, from: null, day: "2026-11-01" };
  const left = { ...store.syncedPart(base, false), paths: [pA, { ...pB, rev: 2 }] };
  const right = { ...store.syncedPart(base, false), paths: [{ ...pA, name: "A2", rev: 5 }], tomb: { saved: {}, read: {}, paths: { pathbbbb: 3 } } };
  const mp = store.mergeDesks(left, right);
  check(mp.paths.length === 1 && mp.paths[0].name === "A2", "paths merge by id, the higher revision winning, a deletion beating the copy it deleted");
  const restored = store.mergeDesks({ ...left, paths: [{ ...pB, rev: 4 }] }, right);
  check(restored.paths.some((p) => p.id === "pathbbbb"), "a path restored after its deletion beats the deletion");
  // Settings and layout from the newer side.
  const s1 = store.mergeDesks({ ...left, settings: { rev: 1, density: "compact", autoRead: true } }, { ...right, settings: { rev: 2, density: "comfortable", autoRead: false } });
  check(s1.settings.density === "comfortable" && s1.layout.rev === 0, "settings and layout come from the newer side");
  // The synced part carries neither the code nor the bookkeeping; notes only on request.
  const withSync = { ...base, sync: { code: "0".repeat(32), version: 1, auto: true, includeNotes: false, lastDay: null }, notes: { n1: { text: "private", day: "2026-11-01", rev: 1 } } };
  const sp = store.syncedPart(withSync, false) as unknown as Record<string, unknown>;
  check(!("sync" in sp) && !("meta" in sp) && !("notes" in sp), "the synced part leaves out the sync code, the bookkeeping and (by default) the notes");
  check("notes" in (store.syncedPart(withSync, true) as unknown as Record<string, unknown>), "notes travel only when asked");
}

// ---- 3. The encryption, against Node's own crypto --------------------------------------------------------------------
{
  // An independent Crockford encoder for known bytes.
  const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = Uint8Array.from({ length: 20 }, (_, i) => (i * 37 + 11) & 255);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  const code = (bits.match(/.{5}/g) ?? []).map((g) => ALPH[parseInt(g, 2)]).join("");
  check(code.length === 32 && cryptoMod.isValidCode(code), "a 20-byte code is 32 Crockford characters");
  check(cryptoMod.normalizeCode(cryptoMod.formatCode(code).toLowerCase()) === code, "a code survives its display form, lower case and hyphens");
  check(cryptoMod.normalizeCode("o1il") === "0111", "O reads as 0, I and L as 1");
  check(cryptoMod.newSyncCode().length === 32 && cryptoMod.newSyncCode() !== cryptoMod.newSyncCode(), "new codes are 32 characters and random");
  // The module's derivation.
  const keys = await cryptoMod.deriveKeys(code);
  // Node's: the id.
  const idNode = nodeCrypto.createHash("sha256").update(`ronutz-desk-id:${code}`, "utf8").digest("hex").slice(0, 32);
  check(keys.id === idNode && /^[0-9a-f]{32}$/.test(keys.id), "the id is the first 32 hex of SHA-256(\"ronutz-desk-id:\" + code)");
  // Node's: the key, from the code's bytes.
  const keyNode = Buffer.from(nodeCrypto.hkdfSync("sha256", Buffer.from(bytes), Buffer.from("ronutz-desk"), Buffer.from("aes-gcm-256 v1"), 32));
  // The module's blob.
  const value = { v: 1, saved: { "tool:cidr": "2026-11-12" } };
  const sealed = await cryptoMod.sealBlob(keys.key, value);
  check(/^[A-Za-z0-9_-]+$/.test(sealed.data), "the blob is base64url without padding");
  // Decrypted by Node with the independently derived key.
  const raw = Buffer.from(sealed.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  let plain = "";
  try {
    const dec = nodeCrypto.createDecipheriv("aes-256-gcm", keyNode, raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(raw.length - 16));
    plain = Buffer.concat([dec.update(raw.subarray(12, raw.length - 16)), dec.final()]).toString("utf8");
  } catch {
    plain = "";
  }
  check(plain === JSON.stringify(value), "Node decrypts the blob with HKDF-SHA-256(code bytes, \"ronutz-desk\", \"aes-gcm-256 v1\"): 12-byte IV, then AES-256-GCM");
  check(JSON.stringify(await cryptoMod.openBlob(keys.key, sealed.data)) === JSON.stringify(value), "the module opens its own blob");
  // Two seals of the same value differ (a fresh IV each time).
  check((await cryptoMod.sealBlob(keys.key, value)).data !== sealed.data, "every write has a fresh IV");
  check(sync.SYNC_MAX_BYTES === 98_304, "the client's size limit is the server's 98,304 bytes");
}

// ---- 4. The privacy page ---------------------------------------------------------------------------------------------
{
  check(store.DESK_KEY === "ronutz:desk:v1", "the store's key is ronutz:desk:v1");
  const page = fs.readFileSync("src/app/[locale]/privacy/page.tsx", "utf8");
  for (const needle of ['"deskTitle", "deskBody"', '"deskSync"', '"deskSyncKept"', '"deskSyncSource"', "DESK_SYNC_SOURCE", "DESK_SYNC_SCHEMA_SOURCE", "DESK_SYNC_CHECK_SOURCE", "DESK_CLIENT_SOURCE", "DESK_CRYPTO_SOURCE"]) {
    check(page.includes(needle), `the Privacy page renders ${needle}`);
  }
  check(fs.readFileSync("src/config/privacyRevisions.ts", "utf8").includes('key: "r20261112desk"'), "the Privacy page's revision record has the desk's row");
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    const pp = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")).privacy_page ?? {};
    check(typeof pp.browserBody === "string" && pp.browserBody.includes(store.DESK_KEY), `${loc}: browserBody names ${store.DESK_KEY}`);
    check(typeof pp.deskBody === "string" && pp.deskBody.includes(store.DESK_KEY), `${loc}: deskBody names ${store.DESK_KEY}`);
    check(typeof pp.deskSyncKept === "string" && ["365", "300", "98"].every((n) => pp.deskSyncKept.includes(n)), `${loc}: deskSyncKept states the 98,304 bytes, the 300 writes and the 365 days`);
    check(typeof pp.deskSyncSource === "string" && ["code", "schema", "client", "crypto", "check"].every((t) => pp.deskSyncSource.includes(`<${t}>`)), `${loc}: deskSyncSource keeps its five links`);
    check(typeof pp.revisions?.r20261112desk === "string", `${loc}: the desk's revision note exists`);
    check(typeof pp.interestBody === "string" && /desk|bancada|escritorio|Schreibtisch|bureau|scrivania/.test(pp.interestBody), `${loc}: interestBody names saving to the desk`);
  }
}

// ---- 5. No other network call --------------------------------------------------------------------------------------
{
  // The files.
  const files = [
    ...fs.readdirSync("src/lib/desk").map((f) => path.join("src/lib/desk", f)),
    ...fs.readdirSync("src/components/desk").map((f) => path.join("src/components/desk", f)),
  ].filter((f) => /\.(ts|tsx)$/.test(f));
  // Code without comments.
  const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  for (const f of files) {
    const body = code(fs.readFileSync(f, "utf8"));
    const fetches = (body.match(/\bfetch\s*\(/g) ?? []).length;
    const allowed = f.endsWith("sync.ts") ? body.includes('const ENDPOINT = "/api/desk/"') && /fetch\(ENDPOINT \+ id/.test(body) : f.endsWith("siteIndex.ts") ? /fetch\(file, \{ credentials: "omit" \}\)/.test(body) : false;
    check(fetches === 0 || (allowed && fetches === 1), `${f}: no fetch except the sync client's and the index loader's own`);
    check(!/XMLHttpRequest|sendBeacon|new WebSocket|new EventSource/.test(body), `${f}: no XMLHttpRequest, sendBeacon, WebSocket or EventSource`);
    check(!/["'`]https?:\/\//.test(body), `${f}: no absolute address`);
    const tracks = [...body.matchAll(/\btrack\(\s*"([a-z_]+)"/g)].map((m) => m[1]);
    check(tracks.every((k) => k === "save"), `${f}: the only interest count is "save"`);
  }
  check(ids.interestSectionOf("tool") === "tools" && ids.interestSectionOf("term") === "glossary" && ids.interestSectionOf("series") === "site", "a save is counted in the item's own section");
}

// ---- 6. The keys ---------------------------------------------------------------------------------------------------
{
  const { SHORTCUT_ACTIONS, DEFAULT_BINDINGS } = await import("../src/config/shortcuts");
  for (const id of ["nav-desk", "cmd-desk-save", "cmd-desk-read"]) {
    const a = SHORTCUT_ACTIONS.find((x) => x.id === id);
    check(!!a && Object.values(DEFAULT_BINDINGS).includes(id), `the shortcut ${id} is registered and bound`);
    for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
      const sh = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")).shortcuts ?? {};
      check(!!a && typeof sh[a.labelKey] === "string", `${loc}: the shortcut ${id} has its label`);
    }
  }
}

// ---- 7. The registry: every key the code writes is portable or local-only ------------------------------------------
{
  /**
   * Every .ts/.tsx file under a directory.
   *
   * @param dir the directory
   * @param out the list so far
   * @returns the files
   */
  const walk = (dir: string, out: string[] = []): string[] => {
    // Each entry.
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      // Its path.
      const f = path.join(dir, e.name);
      // Down, or kept.
      if (e.isDirectory()) walk(f, out); else if (/\.(ts|tsx)$/.test(e.name)) out.push(f);
    }
    // The files.
    return out;
  };
  // The site's code, without comments.
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  // Every file's code.
  const src = new Map(walk("src").map((f) => [f, strip(fs.readFileSync(f, "utf8"))]));
  /**
   * A constant's string value: in the same file first, then any file that exports it.
   *
   * @param name the identifier
   * @param file the file it is used in
   * @returns the value, or null
   */
  const constant = (name: string, file: string): string | null => {
    // The declaration.
    const re = new RegExp(`\\bconst\\s+${name}\\b(?:\\s*:[^=]+)?\\s*=\\s*(["'\`])([^"'\`]*)\\1`);
    // Here.
    const here = re.exec(src.get(file) ?? "");
    // Found.
    if (here) return here[2];
    // Exported elsewhere.
    for (const body of src.values()) { const m = new RegExp(`export\\s+${re.source.slice(2)}`).exec(body); if (m) return m[2]; }
    // Not found.
    return null;
  };
  /**
   * A key as written: a literal, or a template's fixed prefix followed by "*".
   *
   * @param lit the literal's text
   * @returns the key
   */
  const keyOf = (lit: string): string => (lit.includes("${") ? `${lit.slice(0, lit.indexOf("${"))}*` : lit);
  // The keys written, with where.
  const writes: { key: string; storage: "local" | "session"; where: string }[] = [];
  // The storageKey props passed to the index switches (ViewToggle, HubViewSwitch).
  const props = [...src.values()].flatMap((b) => [...b.matchAll(/storageKey=(?:"([^"]+)"|\{`([^`]+)`\})/g)].map((m) => keyOf(m[1] ?? m[2])));
  // Each file's writes.
  for (const [f, body] of src) {
    // Each setItem on a storage.
    for (const m of body.matchAll(/\b(localStorage|sessionStorage)\.setItem\(\s*([^,]+?)\s*,/g)) {
      // The storage and the argument.
      const storage = m[1] === "sessionStorage" ? "session" : "local";
      const arg = m[2].trim();
      // Where.
      const where = `${f}: ${m[1]}.setItem(${arg}, ...)`;
      // A literal.
      const lit = /^(["'`])([^"'`]*)\1$/.exec(arg);
      if (lit) { writes.push({ key: keyOf(lit[2]), storage, where }); continue; }
      // The index switches' prop.
      if (arg === "storageKey") { check(props.length > 0, `${where}: the storageKey props are found`); for (const k of props) writes.push({ key: k, storage, where: `${where} <- storageKey="${k}"` }); continue; }
      // The profile's own writer: it writes only keys the registry lists (portableRule), by construction.
      if (f.endsWith(path.join("lib", "desk", "portable.ts")) && (arg === "k" || arg === "key")) continue;
      // A generic writer's parameter: its callers' keys.
      if (f.endsWith(path.join("lib", "preferences.ts")) && arg === "key") {
        // The callers.
        const callers = [...body.matchAll(/\bwriteJSON\(\s*([A-Z_][A-Z0-9_]*)\s*,/g)].map((c) => constant(c[1], f));
        check(callers.length > 0 && callers.every((c) => c !== null), `${where}: every writeJSON caller's key resolves`);
        for (const c of callers) if (c) writes.push({ key: keyOf(c), storage, where: `${where} <- writeJSON` });
        continue;
      }
      // A constant.
      const v = /^[A-Za-z_$][\w$]*$/.test(arg) ? constant(arg, f) : null;
      check(v !== null, `${where}: the key resolves to a string (a literal, a constant, a storageKey prop or a declared writer)`);
      if (v !== null) writes.push({ key: keyOf(v), storage, where });
    }
  }
  /**
   * Whether a written key (exact, or a prefix ending in "*") falls under a registry entry.
   *
   * @param key the written key
   * @param match the entry
   * @returns true when it does
   */
  const under = (key: string, match: string): boolean => (key.endsWith("*") ? match.endsWith("*") && key.startsWith(match.slice(0, -1)) : portable.keyMatches(key, match));
  // Each write.
  for (const w of writes) {
    // Its entries.
    const p = portable.PORTABLE_KEYS.find((e) => under(w.key, e.match));
    const l = portable.LOCAL_ONLY_KEYS.find((e) => under(w.key, e.match));
    check(!!p || !!l, `${w.where}: the key "${w.key}" is registered as portable or local-only`);
    check(!(p && l), `${w.where}: the key "${w.key}" is not both portable and local-only`);
    if (w.storage === "session") check(!!l && l.storage === "session", `${w.where}: a sessionStorage key ("${w.key}") is registered as a local-only session key`);
    else check(!l || l.storage === "local", `${w.where}: a localStorage key ("${w.key}") is not registered as a session key`);
  }
  // Every entry written somewhere (the registry holds no stale names).
  for (const e of [...portable.PORTABLE_KEYS, ...portable.LOCAL_ONLY_KEYS]) check(writes.some((w) => under(w.key, e.match)), `the registry's "${e.match}" is written somewhere in src`);
  check(writes.length >= 15, `the scan finds the site's storage writes (${writes.length})`);
  // The Privacy page names every entry in all six packs.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    // The paragraph.
    const text = (JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")).privacy_page ?? {}).deskPortable ?? "";
    for (const e of [...portable.PORTABLE_KEYS, ...portable.LOCAL_ONLY_KEYS]) check(typeof text === "string" && text.includes(e.match), `${loc}: privacy_page.deskPortable names ${e.match}`);
  }
  check(fs.readFileSync("src/app/[locale]/privacy/page.tsx", "utf8").includes('t("deskPortable")'), "the Privacy page renders deskPortable");
  // The collector: local-only keys and the games' board stay behind; a setting travels as its string.
  mem.set("ronutz:fun:v1", JSON.stringify({ v: 1, games: { g: { played: 1 } }, board: { share: true, initials: "AB" } }));
  mem.set("ronutz:interest:v1", JSON.stringify({ answer: "yes" }));
  mem.set("ronutz-search-fresh", "1");
  mem.set(portable.BASE_KEY, JSON.stringify({ version: 1, at: 0, keys: {} }));
  mem.set("ronutz-theme", "paper");
  mem.set("ronutz:view:learn", "list");
  const prof = portable.collectProfile(false);
  check(!("ronutz:interest:v1" in prof) && !("ronutz-search-fresh" in prof) && !(portable.BASE_KEY in prof), "the collected profile leaves out the local-only keys");
  check(!!prof["ronutz:fun:v1"] && !("board" in (prof["ronutz:fun:v1"] as object)), "the games' public board choices stay in this browser");
  check(prof["ronutz-theme"] === "paper" && prof["ronutz:view:learn"] === "list" && typeof prof[store.DESK_KEY] === "object", "settings travel as their stored strings, the desk always");
  check(!("sync" in (prof[store.DESK_KEY] as object)) && !("notes" in (prof[store.DESK_KEY] as object)), "the collected desk carries neither the sync code nor (by default) the notes");
}

// ---- 8. The profile blob (version 2), against Node's own crypto and zlib ---------------------------------------------
{
  // The same fixed code as in 3.
  const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = Uint8Array.from({ length: 20 }, (_, i) => (i * 37 + 11) & 255);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  const code = (bits.match(/.{5}/g) ?? []).map((g) => ALPH[parseInt(g, 2)]).join("");
  const keys = await cryptoMod.deriveKeys(code);
  const keyNode = Buffer.from(nodeCrypto.hkdfSync("sha256", Buffer.from(bytes), Buffer.from("ronutz-desk"), Buffer.from("aes-gcm-256 v1"), 32));
  // A profile, sealed by the module.
  const profile = { "ronutz:desk:v1": { v: 1, saved: { "tool:cidr": "2026-11-12" } }, "ronutz-theme": "paper", "ronutz:recent:v1": [{ path: "/en/tools/cidr", at: 1 }] };
  const sealed = await cryptoMod.sealProfile(keys.key, profile);
  // Opened by Node: AES-256-GCM, then gunzip.
  const raw = Buffer.from(sealed.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  check(/^[A-Za-z0-9_-]+$/.test(sealed.data) && sealed.bytes === raw.length, "the profile blob is base64url without padding, and its size is counted in decoded bytes (as the server counts it)");
  let inner = Buffer.alloc(0);
  try {
    const dec = nodeCrypto.createDecipheriv("aes-256-gcm", keyNode, raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(raw.length - 16));
    inner = Buffer.concat([dec.update(raw.subarray(12, raw.length - 16)), dec.final()]);
  } catch {
    inner = Buffer.alloc(0);
  }
  check(inner[0] === 0x1f && inner[1] === 0x8b, "a version 2 blob is gzip inside the encryption");
  let text = "";
  try { text = zlib.gunzipSync(inner).toString("utf8"); } catch { text = ""; }
  check(text === JSON.stringify({ v: 2, keys: profile }), "Node reads {\"v\":2,\"keys\":{...}} back from a version 2 blob");
  // Opened by the module.
  const back = await cryptoMod.openProfile(keys.key, sealed.data);
  check(back.version === 2 && JSON.stringify(back.keys) === JSON.stringify(profile), "the module opens its own version 2 blob");
  // A version 1 blob (the desk alone) opens as a profile holding the desk.
  const v1 = await cryptoMod.sealBlob(keys.key, profile["ronutz:desk:v1"]);
  const up = await cryptoMod.openProfile(keys.key, v1.data);
  check(up.version === 1 && JSON.stringify(up.keys) === JSON.stringify({ "ronutz:desk:v1": profile["ronutz:desk:v1"] }), "a version 1 blob opens as a profile holding the desk (read, then upgraded on the next write)");
  // A wrong key opens nothing.
  let refused = false;
  try { await cryptoMod.openProfile((await cryptoMod.deriveKeys(cryptoMod.newSyncCode())).key, sealed.data); } catch { refused = true; }
  check(refused, "another code's key cannot open the blob");
}

// ---- 9. The three-way merge, and the links and files that carry a profile --------------------------------------------
{
  // The merge, by key.
  const m = (b: Record<string, unknown> | null, l: Record<string, unknown>, r: Record<string, unknown>) => portable.mergeProfiles(b, l, r, false);
  check(m({ "ronutz-theme": "dark" }, { "ronutz-theme": "dark" }, { "ronutz-theme": "paper" })["ronutz-theme"] === "paper", "a setting changed only on the other side comes here");
  check(m({ "ronutz-theme": "dark" }, { "ronutz-theme": "paper" }, { "ronutz-theme": "dark" })["ronutz-theme"] === "paper", "a setting changed only here goes there");
  check(m({ "ronutz-theme": "dark" }, { "ronutz-theme": "paper" }, { "ronutz-theme": "light" })["ronutz-theme"] === "paper", "a setting changed on both sides: the browser in use");
  check(m(null, { "ronutz-theme": "paper" }, { "ronutz-theme": "light" })["ronutz-theme"] === "light", "on a first sync (pairing), the other browser's settings");
  check(!("ronutz:view:learn" in m({ "ronutz:view:learn": "list" }, { "ronutz:view:learn": "list" }, {})), "a deletion against an unchanged value deletes");
  check(m({ "ronutz:view:learn": "list" }, { "ronutz:view:learn": "cards" }, {})["ronutz:view:learn"] === "cards", "a change beats a deletion");
  check(!("ronutz:interest:v1" in m(null, { "ronutz:interest:v1": { a: 1 } }, { "ronutz:interest:v1": { a: 2 } })), "a key the registry does not list as portable is dropped");
  // The games: counts added from the last synced values, the longer streak, results united.
  const fun = (played: number, streak: number, results: Record<string, number>) => ({ v: 1, games: { sudo: { played, streak, results } } });
  const g = (m({ "ronutz:fun:v1": fun(2, 1, { "2026-11-10": 1 }) }, { "ronutz:fun:v1": fun(3, 2, { "2026-11-10": 1, "2026-11-11": 1 }) }, { "ronutz:fun:v1": fun(4, 1, { "2026-11-10": 1, "2026-11-12": 1 }) })["ronutz:fun:v1"] as { games: Record<string, { played: number; streak: number; results: Record<string, number> }> }).games.sudo;
  check(g.played === 5 && g.streak === 2 && Object.keys(g.results).sort().join(",") === "2026-11-10,2026-11-11,2026-11-12", "the games' records: counts added from the last synced values, the longer streak, results from both sides");
  // The recent pages: united, newest first, each once, six at most.
  const rl = Array.from({ length: 5 }, (_, i) => ({ path: `/en/l${i}`, at: 10 + i }));
  const rr = [{ path: "/en/l4", at: 30 }, ...Array.from({ length: 4 }, (_, i) => ({ path: `/en/r${i}`, at: 20 + i }))];
  const rec = m({ "ronutz:recent:v1": [] }, { "ronutz:recent:v1": rl }, { "ronutz:recent:v1": rr })["ronutz:recent:v1"] as { path: string }[];
  check(rec.length === 6 && rec[0].path === "/en/l4" && new Set(rec.map((x) => x.path)).size === 6, "the recent pages: united, newest first, each once, six at most");
  // The drill: the higher best streak, totals added.
  const dr = m({ "ronutz:subnet-drill:stats": { bestStreak: 3, totalCorrect: 10, totalAnswered: 12 } }, { "ronutz:subnet-drill:stats": { bestStreak: 5, totalCorrect: 12, totalAnswered: 15 } }, { "ronutz:subnet-drill:stats": { bestStreak: 4, totalCorrect: 11, totalAnswered: 14 } })["ronutz:subnet-drill:stats"] as Record<string, number>;
  check(dr.bestStreak === 5 && dr.totalCorrect === 13 && dr.totalAnswered === 17, "the drill: the higher best streak, totals added from the last synced values");
  // The desk: its own merge; notes this browser does not send are kept from the other side.
  const base = store.emptyDesk("2026-11-01");
  const dl = store.syncedPart({ ...base, saved: { "tool:a": "2026-11-05" } }, false);
  const drm = { ...store.syncedPart({ ...base, saved: { "tool:b": "2026-11-06" } }, false), notes: { n1: { text: "kept", day: "2026-11-06", rev: 1 } } };
  const dm = m({ [store.DESK_KEY]: store.syncedPart(base, false) }, { [store.DESK_KEY]: dl }, { [store.DESK_KEY]: drm })[store.DESK_KEY] as { saved: Record<string, string>; notes?: Record<string, unknown> };
  check("tool:a" in dm.saved && "tool:b" in dm.saved && !!dm.notes && "n1" in dm.notes, "the desk merges by its own rules, and notes this browser does not send stay as the other side has them");
  // The pairing link.
  const code = cryptoMod.newSyncCode();
  const pl = transfer.pairLink("https://ronutz.com", "pt-BR", code);
  check(pl === `https://ronutz.com/pt-BR/my-desk/#pair=${code}` && transfer.readPairFragment(pl.slice(pl.indexOf("#"))) === code, "the pairing link is /<locale>/my-desk/#pair=<code>, read back");
  check(transfer.readPairFragment("#pair=short") === null, "a cut pairing link is refused");
  // The profile link and file, from the stand-in's storage.
  const link = await transfer.makeProfileLink("https://ronutz.com", "en", false);
  check(!!link.link && link.link.startsWith("https://ronutz.com/en/my-desk/#profile=") && link.length <= transfer.PROFILE_LINK_MAX, "the profile link carries the profile after the #");
  const fromLink = link.link ? await transfer.readProfileFragment(link.link.slice(link.link.indexOf("#"))) : null;
  check(!!fromLink && fromLink["ronutz-theme"] === "paper" && store.DESK_KEY in fromLink && !("ronutz:interest:v1" in fromLink), "the profile link reads back the portable keys only");
  check(JSON.stringify(transfer.parseProfileFile(JSON.stringify({ format: transfer.PROFILE_FORMAT, keys: { "ronutz-theme": "paper", "ronutz:interest:v1": {} } }))) === JSON.stringify({ "ronutz-theme": "paper" }), "a profile file reads back its portable keys only");
  check(!!transfer.parseProfileFile(transfer.exportText(store.getDeskState().data))?.[store.DESK_KEY], "an older desk file opens as a profile holding the desk");
  check(transfer.parseProfileFile("not json") === null, "a file that is not a profile is refused");
}

// ---- 10. The QR code: golden vectors read back by OpenCV's decoder on 12/11/2026 ------------------------------------
{
  // Text, version, first 32 hex of SHA-256 over the rows of 0s and 1s. The two links below are encoder inputs read back
  // by OpenCV on 12/11/2026, kept as they were when the page moved to /my-desk (15/11/2026): they test the QR encoder, not the route.
  const GOLDEN: [string, number, string][] = [
    ["A", 1, "2092585037e9da5651bc5530c31a5a1f"],
    ["https://ronutz.com/pt-BR/desk/#pair=7K2M9QXA4B5C6D7E8F9GHJKMNPQRSTVW", 5, "1aee3c1f3f6fc25ccb386b080b99f74d"],
    ["x".repeat(60), 4, "3b239892bb588062e913f00f9ee21b01"],
    ["y".repeat(100), 6, "058cebbfc8fda720ae1bbea012d2193f"],
    ["Olá, São Paulo ★ ünïcödé", 3, "2b7e33fcae7be482d514b73561e37e37"],
    ["z".repeat(150), 8, "a3be48e2ab70578d35a62a6a2643d492"],
    ["w".repeat(200), 10, "c4722f2ebf4d79926fe374312776e1aa"],
    ["https://ronutz.com/en/desk/#pair=0123456789ABCDEFGHJKMNPQRSTVWXYZ", 5, "e93d24e1bf6c6bf0bab2d19e38924596"],
  ];
  for (const [t, v, h] of GOLDEN) {
    const q = qr.encodeQr(t);
    const hash = nodeCrypto.createHash("sha256").update(q.modules.map((r) => r.map((b) => (b ? 1 : 0)).join("")).join("")).digest("hex").slice(0, 32);
    check(q.version === v && q.size === 17 + 4 * v && hash === h, `QR golden vector: ${JSON.stringify(t.length > 24 ? `${t.slice(0, 24)}...` : t)} is version ${v} with the matrix OpenCV read back`);
  }
  let refused = false;
  try { qr.encodeQr("q".repeat(400)); } catch { refused = true; }
  check(refused && qr.QR_MAX_VERSION === 10, "a text past version 10 is refused");
}

// ---- 13. The settings' change times (the site owner, 12/11/2026 14:42: "the latest change wins") ----------------------
{
  // The watch's code and the merge's.
  const st = await import("../src/lib/desk/settingTimes");
  // Minutes, as times.
  const M = (n: number) => n * 60_000;
  // A setting changed on both sides since the last sync.
  const base = { "ronutz-theme": "paper" };
  // This browser's and the other side's values.
  const local = { "ronutz-theme": "obsidian" };
  const remote = { "ronutz-theme": "dawn" };
  // Default mode, the other side changed later: its value wins.
  check(portable.mergeProfiles(base, local, remote, false, { local: { "ronutz-theme": M(10) }, remote: { "ronutz-theme": M(20) } })["ronutz-theme"] === "dawn", "default: a setting changed on both sides takes the later change (the other side's)");
  // This browser changed later: its value wins.
  check(portable.mergeProfiles(base, local, remote, false, { local: { "ronutz-theme": M(30) }, remote: { "ronutz-theme": M(20) } })["ronutz-theme"] === "obsidian", "default: a setting changed on both sides takes the later change (this browser's)");
  // The same minute: the browser in use.
  check(portable.mergeProfiles(base, local, remote, false, { local: { "ronutz-theme": M(20) }, remote: { "ronutz-theme": M(20) } })["ronutz-theme"] === "obsidian", "default: changes in the same minute keep the browser in use");
  // On a first sync too, the later change wins when both times are known.
  check(portable.mergeProfiles(null, local, remote, false, { local: { "ronutz-theme": M(30) }, remote: { "ronutz-theme": M(20) } })["ronutz-theme"] === "obsidian", "default: a first sync takes the later change when both times are known");
  // An older copy without times merges as before: the browser in use, or the other side's on a first sync.
  check(portable.mergeProfiles(base, local, remote, false, { local: { "ronutz-theme": M(10) }, remote: {} })["ronutz-theme"] === "obsidian" && portable.mergeProfiles(null, local, remote, false, { local: { "ronutz-theme": M(10) }, remote: {} })["ronutz-theme"] === "dawn", "an older copy without times merges as before (the browser in use; the other side's on a first sync)");
  // "Keep this browser's value": no times passed, the browser in use wins even against a later change elsewhere.
  check(portable.mergeProfiles(base, local, remote, false)["ronutz-theme"] === "obsidian" && portable.mergeProfiles(null, local, remote, false)["ronutz-theme"] === "dawn", "keep this browser's value: the browser in use wins; a first sync takes the other side's");
  // The times that go up with the merge: the kept side's.
  const mt = portable.mergedSettingTimes({ "ronutz-theme": "dawn", "ronutz-lang": "en" }, { "ronutz-theme": "obsidian", "ronutz-lang": "en" }, { "ronutz-theme": "dawn", "ronutz-lang": "en" }, { local: { "ronutz-theme": M(10), "ronutz-lang": M(5) }, remote: { "ronutz-theme": M(20), "ronutz-lang": M(7) } });
  // The other side's for the theme, the later of the two for the same language.
  check(mt["ronutz-theme"] === M(20) && mt["ronutz-lang"] === M(7), "the merged times are the kept side's (the later one for a value both sides hold)");
  // The times travel inside the encrypted copy only: sealed, opened by Node and by the module.
  const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = Uint8Array.from({ length: 20 }, (_, i) => (i * 53 + 7) & 255);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  const code = (bits.match(/.{5}/g) ?? []).map((g) => ALPH[parseInt(g, 2)]).join("");
  const keys = await cryptoMod.deriveKeys(code);
  const keyNode = Buffer.from(nodeCrypto.hkdfSync("sha256", Buffer.from(bytes), Buffer.from("ronutz-desk"), Buffer.from("aes-gcm-256 v1"), 32));
  const sealed = await cryptoMod.sealProfile(keys.key, local, { "ronutz-theme": M(30) });
  const raw = Buffer.from(sealed.data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  let text = "";
  try {
    const dec = nodeCrypto.createDecipheriv("aes-256-gcm", keyNode, raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(raw.length - 16));
    text = zlib.gunzipSync(Buffer.concat([dec.update(raw.subarray(12, raw.length - 16)), dec.final()])).toString("utf8");
  } catch { text = ""; }
  check(text === JSON.stringify({ v: 2, keys: local, times: { "ronutz-theme": M(30) } }), "the times travel inside the encrypted copy, as {\"v\":2,\"keys\":{...},\"times\":{...}}");
  const back = await cryptoMod.openProfile(keys.key, sealed.data);
  check(JSON.stringify(st.cleanSettingTimes(back.times)) === JSON.stringify({ "ronutz-theme": M(30) }), "the module reads the times back from its own copy");
  const plain = await cryptoMod.sealProfile(keys.key, local);
  check((await cryptoMod.openProfile(keys.key, plain.data)).times === undefined, "a copy sealed without times carries none (keep this browser's value, or nothing recorded)");
  check(JSON.stringify(st.cleanSettingTimes({ "ronutz-theme": M(3) + 59_999, "ronutz:desk:v1": M(1), "ronutz-lang": "x", "ronutz:view:tools": -1 })) === JSON.stringify({ "ronutz-theme": M(3) }), "incoming times are cleaned: settings only, whole minutes, positive numbers");
  // The record in this browser (the stand-in storage): the first look stamps nothing.
  for (const key of [...mem.keys()]) mem.delete(key);
  mem.set("ronutz-theme", "paper");
  st.observeSettings(M(100));
  check(mem.has(st.TIMES_KEY) && JSON.stringify(st.localSettingTimes()) === "{}", "the first look records the values present without a time");
  // A write is noted with its minute; a non-setting key is not.
  mem.set("ronutz-theme", "dawn");
  st.noteSettingWrite("ronutz-theme", "dawn", M(120) + 42_000);
  st.noteSettingWrite("ronutz:fun:v1", "{}", M(121));
  check(JSON.stringify(st.localSettingTimes()) === JSON.stringify({ "ronutz-theme": M(120) }) && !String(mem.get(st.TIMES_KEY)).includes("ronutz:fun:v1"), "a setting's write is noted to the minute; other keys are not");
  // A value changed without the watch is stamped at the next look.
  mem.set("ronutz-theme", "paper");
  st.observeSettings(M(130));
  check(st.localSettingTimes()["ronutz-theme"] === M(130), "a value changed while no watch ran is stamped at the next look");
  // The sync's own write takes the time it came with.
  st.quietly(() => st.noteSettingWrite("ronutz-theme", "obsidian", M(140)));
  mem.set("ronutz-theme", "obsidian");
  st.adoptSettingTimes({ "ronutz-theme": "obsidian" }, { "ronutz-theme": M(90) });
  check(st.localSettingTimes()["ronutz-theme"] === M(90), "a value the sync wrote keeps the time it came with");
  // The option on: times deleted, none recorded, none given.
  st.setKeepThisBrowser(true);
  check(!st.timesOn() && mem.get(st.NO_TIMES_KEY) === "1" && !mem.has(st.TIMES_KEY), "keep this browser's value: the choice is kept and the stored times are deleted");
  st.noteSettingWrite("ronutz-theme", "dawn", M(150));
  st.observeSettings(M(151));
  check(!mem.has(st.TIMES_KEY) && JSON.stringify(st.localSettingTimes()) === "{}", "keep this browser's value: no time is recorded or given");
  // The option off again: values present recorded without a time.
  st.setKeepThisBrowser(false);
  check(st.timesOn() && !mem.has(st.NO_TIMES_KEY) && mem.has(st.TIMES_KEY) && JSON.stringify(st.localSettingTimes()) === "{}", "turning the option off records again, starting without times");
  // Both stores are local-only in the registry, and the Settings panel says what the default stores.
  check(["ronutz:portable:times", "ronutz:portable:no-times"].every((k) => portable.LOCAL_ONLY_KEYS.some((e) => e.match === k && e.storage === "local")) && st.TIMES_KEY === "ronutz:portable:times" && st.NO_TIMES_KEY === "ronutz:portable:no-times", "the times and the choice are local-only keys of the registry");
  // The Settings panel shows the option and the words.
  const panel = fs.readFileSync("src/components/desk/DeskDataPanel.tsx", "utf8");
  check(["timesTitle", "timesBody", "timesKeep", "timesKeepNote"].every((k) => panel.includes(`t("${k}")`)), "Settings states the default and offers the option");
  // In the six packs, and the Privacy page says the same.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    const pack = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")) as { deskData?: Record<string, string>; privacy_page?: Record<string, string> };
    check(["timesTitle", "timesBody", "timesKeep", "timesKeepNote"].every((k) => !!pack.deskData?.[k]), `${loc}: the option and its words are written`);
  }
  // The watch is installed on every page.
  check(fs.readFileSync("src/components/desk/DeskRuntime.tsx", "utf8").includes("installSettingWatch();"), "the settings' watch is installed on every page");
  // Clean for the sections after this one.
  for (const key of [...mem.keys()]) mem.delete(key);
}

// ---- 11. The layout (phase 3): the catalogue, the starters and the changes the editor makes --------------------------
{
  // The pure layout code.
  const lay = await import("../src/lib/desk/layout");
  // Every catalogue type is a well-formed type and carries a known size.
  check(lay.WIDGET_CATALOGUE.every((s) => /^[a-z][a-z0-9-]{0,31}$/.test(s.type) && (store.WIDGET_SIZES as readonly string[]).includes(s.size)), "every widget in the catalogue has a well-formed type and a known size");
  // The first layout draws only catalogue types.
  check(store.defaultLayout().widgets.every((w) => lay.DESK_WIDGET_TYPES.includes(w.type)), "the first layout holds only widgets the page draws");
  // Each starter: not empty, catalogue types only, unique ids, and unchanged by the store's own repair.
  for (const id of lay.STARTER_IDS) {
    // Its widgets.
    const ws = lay.starterWidgets(id);
    // Repaired as a stored layout would be.
    const fixed = store.repairDesk({ v: 1, layout: { rev: 3, widgets: ws } }, "2026-11-12").data.layout.widgets;
    // All four promises.
    check(ws.length > 0 && ws.every((w) => lay.DESK_WIDGET_TYPES.includes(w.type)) && new Set(ws.map((w) => w.id)).size === ws.length && JSON.stringify(fixed) === JSON.stringify(ws), `the starter layout "${id}" is valid as stored`);
  }
  // A list to change.
  const base = store.defaultLayout().widgets;
  // A copy to prove nothing edits its input.
  const before = JSON.stringify(base);
  // Moving the last widget first.
  const moved = lay.moveWidget(base, base[base.length - 1].id, 0);
  // The same widgets, the last now first.
  check(!!moved && moved[0].id === base[base.length - 1].id && moved.length === base.length, "moving a widget puts it at its new place");
  // A move to where it already is changes nothing.
  check(lay.moveWidget(base, base[0].id, -5) === null, "a move past the start of the list changes nothing");
  // Resizing.
  const resized = lay.resizeWidget(base, base[0].id, "small");
  // The new size, the rest unchanged.
  check(!!resized && resized[0].size === "small" && resized.slice(1).every((w, i) => w.size === base[i + 1].size), "resizing changes one widget's size");
  // The size steps stop at either end.
  check(lay.stepSize("wide", 1) === "wide" && lay.stepSize("small", -1) === "small" && lay.stepSize("medium", 1) === "wide", "the size steps stop at small and wide");
  // Removing.
  const removed = lay.removeWidget(base, base[1].id);
  // Gone, and its place given.
  check(!!removed && removed.index === 1 && !removed.list.some((w) => w.id === base[1].id), "removing a widget takes it out and says where it was");
  // A widget held once cannot be added twice; added back once removed.
  check(lay.addWidget(base, base[0].type) === null && !!removed && !!lay.addWidget(removed.list, base[1].type), "a widget held once is added only when it is not on the page");
  // The input lists were never edited.
  check(JSON.stringify(base) === before, "the layout's changes never edit the list they were given");
  // The page's limit.
  const full = Array.from({ length: store.DESK_LIMITS.widgets }, (_, i) => ({ id: `w${i}`, type: "zz-unknown", size: "small" as const, settings: {} }));
  // Nothing more fits.
  check(!lay.canAddWidget(full, "search"), `the page holds at most ${store.DESK_LIMITS.widgets} widgets`);
  // Settings: set, then removed with null.
  const set1 = lay.setWidgetSettingsIn(base, base[0].id, { name: "x" });
  // And removed.
  const set2 = set1 ? lay.setWidgetSettingsIn(set1, base[0].id, { name: null }) : null;
  // Both.
  check(!!set1 && set1[0].settings.name === "x" && !!set2 && !("name" in set2[0].settings), "a widget's own settings are set and removed");
  // Every catalogue type has a name and a line in all six packs, and every starter a name and a line.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    // The pack.
    const pack = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")) as { desk?: { widgets?: Record<string, string>; widgetInfo?: Record<string, string>; starters?: Record<string, { name?: string; body?: string }> } };
    // Each widget.
    check(lay.WIDGET_CATALOGUE.every((s) => !!pack.desk?.widgets?.[s.type] && !!pack.desk?.widgetInfo?.[s.type]), `${loc}: every widget has a name and a line`);
    // Each starter.
    check(lay.STARTER_IDS.every((id) => !!pack.desk?.starters?.[id]?.name && !!pack.desk?.starters?.[id]?.body), `${loc}: every starter layout has a name and a line`);
  }
}

// ---- 12. New for you (phase 3): the index's dates against the desk and the previous visit ----------------------------
{
  // The comparison.
  const nw = await import("../src/lib/desk/news");
  // A small index: a series of three articles, two tools of one family and one of another, a renamed entry.
  const items = [
    { k: "learn", s: "a1", t: "A1", u: "2026-11-01" },
    { k: "learn", s: "a2", t: "A2", u: "2026-11-10" },
    { k: "learn", s: "a3", t: "A3", u: "2026-11-11" },
    { k: "tool", s: "t1", t: "T1", u: "2026-10-01", c: "pki" },
    { k: "tool", s: "t2", t: "T2", u: "2026-11-10", c: "pki" },
    { k: "tool", s: "t3", t: "T3", u: "2026-11-10", c: "encoding" },
    { k: "term", s: "new-name", t: "N", u: "2026-11-09" },
    { k: "series", s: "s1", t: "S1", m: ["learn:a1", "learn:a2", "learn:a3"] },
  ] as const;
  // Indexed as the loader does.
  const byId = new Map(items.map((it) => [`${it.k}:${it.s}`, it]));
  // The index.
  const index = { locale: "en", day: "2026-11-12", items, byId, redirects: { "term:old-name": "term:new-name" }, memberOf: new Map() } as unknown as Parameters<typeof nw.newsFor>[1];
  // A desk: the series saved, t1 saved, a3 read on the 11th, the old glossary name read on the 5th, last visit the 8th.
  const desk = store.repairDesk({ v: 1, saved: { "series:s1": "2026-11-01", "tool:t1": "2026-11-01" }, read: { "learn:a3": "2026-11-11", "term:old-name": "2026-11-05" }, meta: { prevVisit: "2026-11-08", lastVisit: "2026-11-12" } }, "2026-11-12").data;
  // Compared.
  const n = nw.newsFor(desk, index, "2026-11-12");
  // Since the previous visit.
  check(n.basis === "visit" && n.since === "2026-11-08", "New for you counts from the previous visit");
  // The renamed entry read before it changed: updated, under its new name; a3 read on its own day is not.
  check(n.updated.rows.length === 1 && n.updated.rows[0].id === "term:new-name", "an item changed after its read mark is listed as updated, under its current name");
  // The series: a2 (unread, after the visit) only; a1 is older, a3 is read.
  check(n.follow.rows.length === 1 && n.follow.rows[0].id === "learn:a2" && n.follow.rows[0].from === "series:s1", "an unread item of a followed series dated since the last visit is listed, once");
  // The family of the saved tool: t2 only (t1 is saved, t3 is another family).
  check(n.family.rows.length === 1 && n.family.rows[0].id === "tool:t2", "a tool of a kept family dated since the last visit is listed; other families are not");
  // No previous visit: the thirty-day window.
  const first = nw.newsFor({ ...desk, meta: { ...desk.meta, prevVisit: null } }, index, "2026-11-12");
  // From the 13th of October.
  check(first.basis === "window" && first.since === "2026-10-13", "the first visit looks back thirty days");
}

// ---- 14. Saved and read on the index pages (phase 3): placed after paint, reading the desk without the store ----------
{
  // The marker component's code without comments.
  const body = fs.readFileSync("src/components/desk/DeskListMarks.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  // It reads the store's key, never imports the store, and writes nothing.
  check(body.includes(`"${store.DESK_KEY}"`) && !/from\s+"@\/lib\/desk\/store"/.test(body) && !/setItem\(/.test(body), "the index labels read the desk's key without loading the store, and write nothing");
  // Placed after paint (an effect, at idle), absolutely (the CSS), so the page does not move.
  const css = fs.readFileSync("src/app/components.css", "utf8");
  check(/useEffect\(/.test(body) && /requestIdleCallback/.test(body) && /\.desk-mark \{ position: absolute;/.test(css), "the index labels are placed after paint and positioned absolutely");
  // Mounted on the three index pages, each with the words "Saved", "Read" and "Done".
  for (const page of ["learn", "tools", "glossary"]) {
    // The page's source.
    const src = fs.readFileSync(`src/app/[locale]/${page}/page.tsx`, "utf8");
    // The component with its three words.
    check(/<DeskListMarks selector="[^"]+" labels=\{\{ saved: tDesk\("saved"\), read: tDesk\("readOn"\), done: tDesk\("doneOn"\) \}\} \/>/.test(src), `the ${page} index page carries the saved and read labels`);
  }
}

// ---- 15. Notes (phase 4): emptying wins a merge, orphaned widget notes are emptied, old empty ones forgotten ----------
{
  // A desk with two widget notes and one other note.
  store.restoreDesk(store.repairDesk({ v: 1, notes: { "widget:notes-aaaaaa": { text: "keep", day: "2026-11-01", rev: 1 }, "widget:notes-bbbbbb": { text: "orphan", day: "2026-11-01", rev: 2 }, other: { text: "x", day: "2026-11-01", rev: 1 } } }).data);
  // Emptying a note keeps it, empty, one revision newer.
  store.setNote("widget:notes-aaaaaa", "");
  // Read back.
  const a = store.getDeskState().data.notes["widget:notes-aaaaaa"];
  check(!!a && a.text === "" && a.rev === 2, "emptying a note keeps it empty with a raised revision");
  // The emptying wins a merge against the other browser's older text.
  const mine = store.syncedPart(store.getDeskState().data, true);
  // The other side still has the text at revision 1.
  const theirs = { ...mine, notes: { "widget:notes-aaaaaa": { text: "keep", day: "2026-11-01", rev: 1 } } };
  check(store.mergeDesks(theirs, mine).notes?.["widget:notes-aaaaaa"]?.text === "", "an emptied note wins a merge, so a sync cannot bring it back");
  // Pruning: only widget notes whose widget is gone are emptied.
  const n = store.pruneWidgetNotes(new Set(["notes-aaaaaa"]));
  // The notes now.
  const notes = store.getDeskState().data.notes;
  check(n === 1 && notes["widget:notes-bbbbbb"].text === "" && notes["widget:notes-bbbbbb"].rev === 3 && notes.other.text === "x", "a removed notes widget's note is emptied on Done; other notes stay");
  // An emptied note older than the limit is forgotten on load.
  const old = store.repairDesk({ v: 1, notes: { gone: { text: "", day: "2026-01-01", rev: 4 }, recent: { text: "", day: "2026-11-01", rev: 4 } } }, "2026-11-12").data.notes;
  check(!("gone" in old) && "recent" in old, `an emptied note is forgotten after ${store.DESK_LIMITS.tombDays} days`);
  // The notes widget is in the catalogue and may be added more than once.
  const lay = await import("../src/lib/desk/layout");
  // Two notes widgets.
  const one = lay.addWidget([], "notes");
  // A second.
  const two = one ? lay.addWidget(one.list, "notes") : null;
  check(!!two && two.list.length === 2 && two.list[0].id !== two.list[1].id, "notes widgets can be added more than once, each with its own id");
}

// ---- 16. The exam countdown (phase 4): a name and a day in the widget's own settings, kept as stored ------------------
{
  // The layout code.
  const lay = await import("../src/lib/desk/layout");
  // A countdown added, then given its exam and day.
  const added = lay.addWidget([], "countdown");
  // Its settings set.
  const set = added ? lay.setWidgetSettingsIn(added.list, added.id, { exam: "F5CAB1", date: "2027-01-15" }) : null;
  // Through the store's own repair, as a stored layout is read.
  const back = set ? store.repairDesk({ v: 1, layout: { rev: 1, widgets: set } }, "2026-11-12").data.layout.widgets[0] : null;
  check(!!back && back.type === "countdown" && back.settings.exam === "F5CAB1" && back.settings.date === "2027-01-15", "a countdown's exam and day are kept as stored");
  // More than one countdown.
  check(lay.widgetSpec("countdown")?.multi === true, "the page may hold several countdowns");
  // The component counts calendar days and never stores a time.
  const src = fs.readFileSync("src/components/desk/DeskCountdown.tsx", "utf8");
  check(/T12:00:00Z/.test(src) && /isDay\(draft\.date\)/.test(src) && !/toISOString\(\)/.test(src), "the countdown counts whole calendar days and keeps a day, never a time");
}

// ---- 17. Quick tools (phase 4): the manifests and the adapters agree; each example answers; engines load lazily -------
{
  // The adapters.
  const qt = await import("../src/lib/desk/quickTools");
  // The tools whose manifest declares deskQuick: true.
  const declared = fs.readdirSync("src/lib/tools").filter((d) => fs.existsSync(`src/lib/tools/${d}/index.ts`) && /\bdeskQuick:\s*true\b/.test(fs.readFileSync(`src/lib/tools/${d}/index.ts`, "utf8"))).sort();
  // The two lists agree.
  check(JSON.stringify(declared) === JSON.stringify([...qt.QUICK_TOOL_SLUGS].sort()) && declared.length > 0, `the tools declared eligible in their manifests (${declared.join(", ")}) are the quick tools the desk has`);
  // The adapters' source.
  const src = fs.readFileSync("src/lib/desk/quickTools.ts", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  // Every engine is a dynamic import of a compute.ts alone; nothing is imported statically.
  const dyn = [...src.matchAll(/import\("([^"]+)"\)/g)].map((m) => m[1]);
  check(!/^import\s/m.test(src) && dyn.length === qt.QUICK_TOOL_SLUGS.length && dyn.every((d) => /^@\/lib\/tools\/[a-z0-9-]+\/compute$/.test(d)), "each quick tool's engine is loaded lazily, its compute.ts alone");
  // Each example answers, with rows the packs name.
  for (const slug of qt.QUICK_TOOL_SLUGS) {
    // The engine, loaded as the widget loads it.
    const run = await qt.QUICK_TOOLS[slug].load();
    // The example's answer.
    const r = run(qt.QUICK_TOOLS[slug].example);
    // An answer with known rows.
    check(r.ok && r.rows.length > 0 && r.rows.every((x) => qt.QUICK_ROW_KEYS.includes(x.key)), `the quick tool "${slug}" answers its example with labelled rows`);
    // A nonsense input is a "cannot read" answer or rows, never a throw (the call above would have thrown).
    let threw = false;
    try { run("%%% not an input %%%"); } catch { threw = true; }
    check(!threw, `the quick tool "${slug}" never throws on input it cannot read`);
  }
  // The subnet calculator's answer, checked by value.
  const cidrRun = await qt.QUICK_TOOLS.cidr.load();
  // The example's numbers.
  const c = cidrRun("192.168.1.0/24");
  check(c.ok && c.rows.find((x) => x.key === "usable")?.value === 254 && c.rows.find((x) => x.key === "broadcast")?.value === "192.168.1.255", "the subnet quick tool gives 254 usable hosts and .255 as the broadcast of 192.168.1.0/24");
  // Every row label in the six packs.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    // The pack.
    const pack = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")) as { desk?: { quick?: { rows?: Record<string, string> } } };
    check(qt.QUICK_ROW_KEYS.every((k) => !!pack.desk?.quick?.rows?.[k]), `${loc}: every quick tool row has its label`);
  }
}

// ---- 20. Reading streaks and milestones (the site owner, 12/11/2026 15:22): days only, local and portable ------------
{
  // Today, as the store counts it, and the days before it.
  const day = store.today();
  // A day n days before today.
  const ago = (n: number) => new Date(Date.parse(`${day}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
  // Runs: three days ending today, a gap, two more.
  const set = new Set([day, ago(1), ago(2), ago(4), ago(5)]);
  check(store.runEndingAt(set, day) === 3 && store.runEndingAt(set, ago(3)) === 0 && store.longestRun([...set]) === 3, "the run ending on a day and the longest run are counted in whole days");
  // An older desk without a record is given one from its read marks' days (days only).
  const seeded = store.repairDesk({ v: 1, read: { "learn:a": ago(2), "learn:b": ago(1), "learn:c": ago(1) } }, day).data.reading;
  check(JSON.stringify(seeded.days) === JSON.stringify([ago(2), ago(1)]) && seeded.best === 2 && seeded.days.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)), "an older desk's reading days are seeded from its read marks, days only");
  // A fresh desk with six reading days before today: marking today makes a week, and the milestone is recorded once.
  store.restoreDesk(store.repairDesk({ v: 1, reading: { days: [ago(6), ago(5), ago(4), ago(3), ago(2), ago(1)], best: 6, marks: {} } }, day).data);
  // Marked today.
  store.markRead("learn:streak-a" as never);
  // The record now.
  let r = store.getDeskState().data.reading;
  check(r.days.includes(day) && r.best === 7 && r.marks.week?.d === day && r.marks.week?.s === false, "a read mark today records the day, lengthens the run to a week and records that milestone");
  // Celebrated once.
  check(JSON.stringify(store.takeUnseenMilestones()) === JSON.stringify(["week"]) && store.takeUnseenMilestones().length === 0, "a milestone's celebration is taken once");
  // The Undo of today's mark takes today's reading day back (no other mark carries it); the milestone stays.
  store.restoreRead("learn:streak-a" as never, null);
  // The record now.
  r = store.getDeskState().data.reading;
  check(!r.days.includes(day) && r.best === 6 && !r.marks.week, "undoing today's only mark leaves no reading day behind, and the week it made is withdrawn (six days are not a week)");
  // A week reached on an earlier day stays when today's mark is undone: it was true that day.
  store.restoreDesk(store.repairDesk({ v: 1, reading: { days: [ago(9), ago(8), ago(7), ago(6), ago(5), ago(4), ago(3)], best: 7, marks: { week: { d: ago(3), s: true } } } }, day).data);
  // Marked and undone today.
  store.markRead("learn:streak-b" as never);
  store.restoreRead("learn:streak-b" as never, null);
  check(store.getDeskState().data.reading.marks.week?.d === ago(3), "a milestone reached on an earlier day stays when a mark is undone today");
  // Every held mark's day is a reading day, even when the stored record missed it (a desk from a file or an older copy).
  const missed = store.repairDesk({ v: 1, read: { "learn:m": ago(1), "learn:n": day }, reading: { days: [ago(5)], best: 1, marks: {} } }, day).data.reading;
  check(missed.days.includes(ago(1)) && missed.days.includes(day) && missed.days.includes(ago(5)) && missed.best === 2, "every read mark's day counts as a reading day, and the run follows");
  // A milestone is dated the day it was reached: the tenth mark's day, the seventh day of the first run of seven.
  const dated = store.repairDesk({ v: 1, read: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`learn:d${i}`, ago(20 - i)])), reading: { days: [], best: 0, marks: {} } }, day).data;
  check(store.milestoneDay(dated, "read10") === ago(11) && store.milestoneDay(dated, "week") === ago(14) && store.milestoneDay(dated, "path1") === day, "a milestone is dated the day it was in fact reached, never later than today");
  // Clean again for the rest of this section.
  store.restoreDesk(store.emptyDesk());
  // Ten marks: ten items read; a path all read: the first path finished.
  for (let i = 0; i < 10; i += 1) store.markRead(`learn:streak-${i}` as never);
  // A path of two read items.
  store.createPath("done", ["learn:streak-0", "learn:streak-1"] as never);
  // Recorded by the desk's own check (the page and the next mark run it).
  store.noteMilestones(store.deskMilestones(store.getDeskState().data));
  // The record now.
  r = store.getDeskState().data.reading;
  check(!!r.marks.read10 && !!r.marks.path1 && !r.marks.read50, "ten items read and a finished path are milestones; fifty is not reached by ten");
  // Taking a same-day mark off while others carry the day keeps the day.
  store.markUnread("learn:streak-9" as never);
  check(store.getDeskState().data.reading.days.includes(day), "taking one mark off keeps a day other marks still carry");
  // The merge: days united, the longer best, a milestone's earlier day, celebrated when either side celebrated it.
  const mine = store.syncedPart(store.getDeskState().data, false);
  // The other browser: an older day, a longer best, read10 reached earlier and celebrated.
  const theirs = { ...mine, reading: { days: [ago(30)], best: 12, marks: { read10: { d: ago(20), s: true } } } };
  // Merged.
  const m = store.mergeDesks(mine, theirs).reading;
  check(!!m && m.days.includes(ago(30)) && m.days.includes(day) && m.best === 12 && m.marks.read10?.d === ago(20) && m.marks.read10?.s === true && !!m.marks.path1, "reading records merge: days united, the longer run, each milestone's earlier day");
  // The record travels in the synced part, and a copy without one keeps this browser's.
  check("reading" in mine && store.withSynced(store.getDeskState().data, { ...mine, reading: undefined }).reading.days.includes(day), "the reading record travels with the desk, and an older copy without one keeps this browser's");
  // The widget: in the catalogue, once; the celebration moves only when motion is welcome; no wording of loss.
  const lay = await import("../src/lib/desk/layout");
  check(lay.widgetSpec("streak")?.multi === false, "the reading streak is one widget on the page");
  // The stylesheet.
  const css = fs.readFileSync("src/app/components.css", "utf8");
  check(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.desk-celebrate, \.desk-toast-milestone \{ animation:/.test(css) && !/\.desk-celebrate \{[^}]*animation/.test(css), "a celebration moves only when the reader has not asked for reduced motion");
  // The English words of the streak: no loss, no shame.
  const en = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8")) as { desk: { streak: Record<string, string> } };
  check(!/\b(lost|lose|broke|broken|missed|fail|shame|reset)\b/i.test(JSON.stringify(en.desk.streak)), "the streak's words never speak of a loss when a run ends");
  // Clean for the sections after this one.
  store.restoreDesk(store.emptyDesk());
}

// ---- 19. The certification guide pages carry Save, Mark as read and Add to path ---------------------------------------
{
  // The guide page's source.
  const src = fs.readFileSync("src/app/[locale]/certifications/[exam]/page.tsx", "utf8");
  // The controls, for this guide's identifier, inside a slice carrying their words.
  check(/<MessageSlice namespaces=\{\["deskItem", "deskPath"\]\}>\s*<DeskItemControls item=\{`guide:\$\{guide\.slug\}`\} \/>\s*<DeskPathNext item=\{`guide:\$\{guide\.slug\}`\} \/>\s*<\/MessageSlice>/.test(src), "a certification guide's page carries the desk's controls for guide:<slug>, and \"Continue this path\" under them");
  // Every guide page's identifier is in the site index (the list of items the desk names things by), in every language.
  const { studyGuides } = await import("../src/content/certifications/study-guides");
  // The index files of the languages.
  const { DESK_INDEX_FILES } = await import("../src/generated/desk-index");
  // Each language's index.
  for (const [loc, file] of Object.entries(DESK_INDEX_FILES)) {
    // Its guide items.
    const idx = JSON.parse(fs.readFileSync(path.join("public", file), "utf8")) as { items: { k: string; s: string }[] };
    // As a set of slugs.
    const guides = new Set(idx.items.filter((it) => it.k === "guide").map((it) => it.s));
    check(studyGuides.every((g) => guides.has(g.slug)), `${loc}: every certification guide page is in the site index as guide:<slug>`);
  }
  // A saved guide is counted in the site's own section, as series, training series and reading paths are.
  check(ids.interestSectionOf("guide") === "site", "a saved guide is counted in the site's section");
  // A guide's address names the guide, so search's "Add to..." and the controls agree.
  check(ids.itemFromUrl("/en/certifications/f5-ca-install-config-upgrade/", []) === "guide:f5-ca-install-config-upgrade" && ids.itemHref("guide:f5-ca-install-config-upgrade" as never) === "/certifications/f5-ca-install-config-upgrade", "a guide's identifier and its page's address name each other");
}

// ---- 21. "Continue this path" on item pages (the site owner, 12/11/2026 15:22) -------------------------------------
{
  // The rule.
  const pn = await import("../src/lib/desk/pathNext");
  // A path of four: a, b (this page), c, d.
  const items = ["learn:a", "learn:b", "learn:c", "learn:d"] as never[];
  // The next unread after this page, never this page itself.
  check(JSON.stringify(pn.nextInPath({ items }, "learn:b" as never, { "learn:a": "2026-11-01" })) === JSON.stringify({ state: "next", next: "learn:c" }), "the next item is the first unread one after this page");
  // Everything after it read: back to the first unread before it.
  check(JSON.stringify(pn.nextInPath({ items }, "learn:c" as never, { "learn:d": "2026-11-01" })) === JSON.stringify({ state: "next", next: "learn:a" }), "when everything after this page is read, the next item is the first unread one before it");
  // Only this page left: the last one; every item read: finished; not in the path: nothing.
  const allBut = { "learn:a": "2026-11-01", "learn:c": "2026-11-01", "learn:d": "2026-11-01" };
  check(pn.nextInPath({ items }, "learn:b" as never, allBut)?.state === "last" && pn.nextInPath({ items }, "learn:b" as never, { ...allBut, "learn:b": "2026-11-02" })?.state === "finished" && pn.nextInPath({ items }, "learn:z" as never, {}) === null, "only this page left is the last one, every item read is finished, and an item in no path gives nothing");
  // The paths holding an item, in the reader's order, with the desk's own progress.
  const desk = store.emptyDesk();
  // Two paths hold b, one does not.
  desk.paths = [
    { id: "pa11", name: "one", items, rev: 1, from: null, day: "2026-11-01" },
    { id: "pb22", name: "two", items: ["learn:x"] as never[], rev: 1, from: null, day: "2026-11-01" },
    { id: "pc33", name: "three", items: ["learn:b"] as never[], rev: 1, from: null, day: "2026-11-01" },
  ];
  // One read mark.
  desk.read = { "learn:a": "2026-11-01" };
  // Held by two.
  const held = pn.pathsHolding(desk, "learn:b" as never);
  check(held.map((h) => h.path.id).join() === "pa11,pc33" && held[0].done === 1 && held[0].total === 4 && held[1].state === "last", "the paths holding a page are listed in the reader's order with My desk's own progress");
  // The component: nothing drawn for an item in no path; the index loaded only when there is something to name.
  const comp = fs.readFileSync("src/components/desk/DeskPathNext.tsx", "utf8");
  check(/if \(hits\.length === 0 \|\| \(!index && !failed\)\) return null;/.test(comp) && /useSiteIndex\(locale, hits\.length > 0\)/.test(comp) && !/fetch\(/.test(comp), "the control draws nothing for an item in no path, and loads the list of items only when it has a path to show");
  // Mounted at the end of every Learn article (and near its top on a phone) and on every tool page, inside slices with its words.
  const learnPage = fs.readFileSync("src/app/[locale]/learn/[slug]/page.tsx", "utf8");
  // The tool page.
  const toolPage = fs.readFileSync("src/app/[locale]/tools/[slug]/page.tsx", "utf8");
  check(/<MessageSlice namespaces=\{\["deskPath"\]\}>\s*<DeskPathNext item=\{`learn:\$\{slug\}`\} placement="top" \/>/.test(learnPage) && /namespaces=\{\["share", "deskItem", "deskPath"\]\}>[\s\S]*?<DeskPathNext item=\{`learn:\$\{slug\}`\} \/>/.test(learnPage) && /namespaces=\{\["share", "deskItem", "deskPath"\]\}>[\s\S]*?<DeskPathNext item=\{`tool:\$\{slug\}`\} \/>/.test(toolPage), "Learn articles carry the control at their end and near their top, tool pages under their controls, each inside a slice with its words");
  // The stylesheet: the top copy only on a narrow screen; the finish moves only when motion is welcome.
  const css = fs.readFileSync("src/app/components.css", "utf8");
  check(/@media \(min-width: 48rem\) \{ \.desk-pathnext--top \{ display: none; \} \}/.test(css) && /@media \(prefers-reduced-motion: no-preference\) \{\s*\.desk-pathnext-done--now \{[^}]*animation:/.test(css) && (css.match(/\.desk-pathnext-done--now \{/g) ?? []).length === 1, "the copy near an article's top shows only on a narrow screen, and a path finished on the page moves only without reduced motion");
  // The desk opens a path named in its address (/my-desk#path=<id>), the link the control gives.
  const pathsSrc = fs.readFileSync("src/components/desk/DeskPaths.tsx", "utf8");
  check(/\^#path=\(\[a-z0-9\]\{4,24\}\)\$/.test(pathsSrc) && /id=\{`desk-path-\$\{p\.id\}`\}/.test(pathsSrc) && /href=\{`\/my-desk#path=\$\{h\.path\.id\}`\}/.test(comp), "the control links to its path on My desk, which opens that path from its address");
  // Every word of the control in the six packs.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    // The pack.
    const pack = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")) as { deskPath?: Record<string, string> };
    check(["label", "next", "last", "finished", "onDesk", "more", "progress", "untitled", "open"].every((k) => !!pack.deskPath?.[k]), `${loc}: every word of "Continue this path" is there`);
  }
}

// ---- 22. Privacy and settings on the desk (the site owner, 12/11/2026 15:27) ---------------------------------------
{
  // The catalogue and the starters.
  const lay = await import("../src/lib/desk/layout");
  check(lay.widgetSpec("privacy")?.multi === false && lay.widgetSpec("privacy")?.size === "medium" && lay.STARTER_IDS.every((id) => lay.starterWidgets(id).some((w) => w.type === "privacy")), "Privacy and settings is one widget on the page, medium by default, in every starter layout");
  // The widget's source.
  const w = fs.readFileSync("src/components/desk/DeskPrivacy.tsx", "utf8");
  // The same controls as Settings: the counting switch itself, the sync client's own functions, the change-times choice, the read-mark setting.
  check(/import InterestToggle[^;]*from "@\/components\/InterestToggle"/.test(w) && /<InterestToggle labels=/.test(w) && /m\.forgetThisDevice\(\)/.test(w) && /m\.setSyncChoice\(\{ includeNotes: on \}\)/.test(w) && /setKeepThisBrowser\(keep\)/.test(w) && /timesOn\(\)/.test(w) && /updateSettings\(\{ autoRead: e\.target\.checked \}\)/.test(w), "the widget's controls are Settings' own: the counting switch, the sync's choices, the merge rule, automatic read marks");
  // The sync client is loaded only when used (or drawn for a browser that syncs), and nothing is fetched here.
  check(!/from "@\/lib\/desk\/sync"/.test(w) && /import\("@\/lib\/desk\/sync"\)/.test(w) && /dynamic\(\(\) => import\("\.\/DeskSyncLine"\)/.test(w) && !/fetch\(/.test(w), "the widget loads the sync client only when it is used, and sends nothing itself");
  // Emptying is asked in the page, never in a browser dialog, and the page keeps the Undo.
  const page = fs.readFileSync("src/components/desk/DeskPage.tsx", "utf8");
  check(!/\b(confirm|alert|prompt)\(/.test(w) && /privacy\.emptyAsk/.test(w) && /onEmpty=\{\(\) => setEmptied\(clearDesk\(\)\)\}/.test(page) && /restoreDesk\(emptied\)/.test(page), "emptying is asked in words on the page (no browser dialog), done by the store, and undone by the page");
  // The two links land on real anchors: the desk's section of Settings, and the desk's section of the Privacy page.
  const settings = fs.readFileSync("src/app/[locale]/settings/page.tsx", "utf8");
  // The Privacy page.
  const privacy = fs.readFileSync("src/app/[locale]/privacy/page.tsx", "utf8");
  // The Settings panel's sync heading.
  const panel = fs.readFileSync("src/components/desk/DeskDataPanel.tsx", "utf8");
  check(/href="\/settings#desk"/.test(w) && /href="\/privacy#desk"/.test(w) && /href="\/settings#desk-sync"/.test(w) && /<section className="section" id="desk">/.test(settings) && /titleKey === "deskTitle" \? "desk"/.test(privacy) && /id="desk-sync"/.test(panel), "the widget's links land on the desk's sections of Settings and of the Privacy page");
  // The counting switch's words are the Settings page's own, given by the desk's route.
  const route = fs.readFileSync("src/app/[locale]/my-desk/page.tsx", "utf8");
  check(/getTranslations\("settings_page"\)/.test(route) && /interestLabels=\{\{/.test(route), "the counting switch on the desk speaks the Settings page's own words");
  // Every word of the widget in the six packs.
  for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) {
    // The pack.
    const pack = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")) as { desk?: { privacy?: Record<string, string> } };
    check(["counting", "sync", "syncOff", "syncStart", "syncStop", "syncStopped", "notes", "merge", "mergeLatest", "mergeKeep", "autoRead", "empty", "emptyAsk", "emptyYes", "emptyNo", "emptied", "allSettings", "privacyPage"].every((k) => !!pack.desk?.privacy?.[k]), `${loc}: every word of Privacy and settings is there`);
  }
}

// The verdict.
if (errors.length) {
  // Said.
  console.error(`${TAG} FAIL: ${errors.length} of ${checks} check(s):`);
  // Each.
  for (const e of errors) console.error(`  - ${e}`);
  // Stopped.
  process.exit(1);
}
// Passed.
console.log(`${TAG} OK: ${checks} checks: the store repairs and limits, the merge rules of the sync contract, the encryption checked against Node's own crypto, the Privacy page in six packs, no network call but the sync's and the index's, the three shortcuts, the portable registry against every storage write, the version 2 profile blob against Node's crypto and zlib, the three-way merge and the links and files that carry a profile, and the QR code's golden vectors.`);
