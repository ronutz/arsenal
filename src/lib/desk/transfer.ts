// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/transfer.ts
// ----------------------------------------------------------------------------
// MOVING A DESK WITHOUT A SERVER (PLAN-personal-desk-20261112, section 2,
// option A's answers to "the browser may clear it"): a file the reader keeps,
// and a transfer link that carries the desk after the "#".
//
// THE FILE: JSON, {"format": "ronutz-desk", "v": 1, "day": ..., "data": ...},
// with the synced part of the desk and its notes; never the sync code and
// never the bookkeeping. Made in the browser and handed to the reader as a
// download; nothing is sent anywhere.
//
// THE LINK: /<locale>/desk#desk=<data>. The part after "#" is never sent in a
// request, so the desk goes from one browser to another without reaching the
// site. The data is the same JSON, compressed with the browser's own
// CompressionStream where it has one ("z." + base64url of raw deflate), or
// plain ("j." + base64url) where it does not. Notes go only when the reader
// ticks them, as with the sync.
//
// Whatever comes in (a file, a link) is outside data: it is parsed, repaired
// by the same rules as a stored desk (src/lib/desk/store.ts, repairDesk), and
// only then offered to the reader to merge or to use instead.
// ============================================================================

// The base64url helpers the sync uses too, and the compression of the profile link.
import { base64UrlGunzip, fromBase64Url, gzipToBase64Url, toBase64Url } from "./crypto";
// The profile: what travels.
import { collectProfile, portableRule, type Profile } from "./portable";
// The desk's shapes and repair.
import { repairDesk, syncedPart, today, type DeskData, type DeskSynced } from "./store";

/** The file's format name. */
export const EXPORT_FORMAT = "ronutz-desk";

/** The fragment's name in a transfer link. */
export const TRANSFER_PARAM = "desk";

/**
 * The file's contents for a desk.
 *
 * @param d the desk
 * @returns the JSON text
 */
export function exportText(d: DeskData): string {
  // The wrapper, the day, and the synced part with the notes.
  return JSON.stringify({ format: EXPORT_FORMAT, v: 1, day: today(), data: syncedPart(d, true) }, null, 1);
}

/**
 * Hand the reader a text as a file to save (nothing is sent anywhere).
 *
 * @param name the file's name
 * @param text its contents
 * @param type its media type
 */
export function downloadText(name: string, text: string, type = "application/json"): void {
  // A blob in memory.
  const url = URL.createObjectURL(new Blob([text], { type }));
  // A temporary link that the browser saves.
  const a = document.createElement("a");
  // Its target.
  a.href = url;
  // Saved under this name.
  a.download = name;
  // Placed, clicked, removed.
  document.body.appendChild(a);
  // Saved.
  a.click();
  // Removed.
  a.remove();
  // The memory released a moment later (some browsers read it after the click returns).
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Save the desk as a file.
 *
 * @param d the desk
 */
export function downloadExport(d: DeskData): void {
  // Named by the day.
  downloadText(`ronutz-desk-${today()}.json`, exportText(d));
}

/**
 * Read an imported file, or any JSON that holds a desk.
 *
 * @param text the file's text
 * @returns the synced part it holds (repaired), or null when it holds no desk
 */
export function parseImport(text: string): DeskSynced | null {
  // The parsed value.
  let value: unknown;
  // Malformed JSON throws.
  try { value = JSON.parse(text); } catch { return null; }
  // The wrapper's data, or the value itself when it is a bare desk.
  const inner = typeof value === "object" && value !== null && (value as { format?: unknown }).format === EXPORT_FORMAT ? (value as { data?: unknown }).data : value;
  // Something that looks like a desk: an object with at least one of its parts.
  if (typeof inner !== "object" || inner === null || !["saved", "read", "paths", "layout"].some((k) => k in inner)) return null;
  // Repaired, then its synced part with the notes it carried.
  return syncedPart(repairDesk(inner).data, "notes" in inner);
}

/**
 * Bytes through one of the browser's compression streams.
 *
 * @param bytes the input
 * @param stream a CompressionStream or a DecompressionStream
 * @returns the output
 */
async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  // Written in, read out.
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  // All of it.
  return new Uint8Array(await out.arrayBuffer());
}

/**
 * A transfer link for a desk.
 *
 * @param d the desk
 * @param origin the site's origin ("https://ronutz.com")
 * @param locale the page's language
 * @param includeNotes whether the notes go too
 * @returns the address
 */
export async function makeTransferLink(d: DeskData, origin: string, locale: string, includeNotes: boolean): Promise<string> {
  // The JSON's bytes.
  const raw = new TextEncoder().encode(JSON.stringify(syncedPart(d, includeNotes)));
  // Compressed where the browser can.
  let data = `j.${toBase64Url(raw)}`;
  // CompressionStream with raw deflate (every current browser; a missing one leaves the plain form).
  try {
    // Only where it exists.
    if (typeof CompressionStream !== "undefined") data = `z.${toBase64Url(await pipe(raw, new CompressionStream("deflate-raw")))}`;
  } catch {
    // Plain it is.
  }
  // The page, with the data after the "#".
  return `${origin}/${locale}/desk#${TRANSFER_PARAM}=${data}`;
}

/**
 * Read a transfer link's fragment.
 *
 * @param hash location.hash ("#desk=...")
 * @returns the synced part it carries (repaired), or null when it carries none or cannot be read
 */
export async function readTransferFragment(hash: string): Promise<DeskSynced | null> {
  // The value after "#desk=".
  const m = new RegExp(`^#${TRANSFER_PARAM}=([jz])\\.([A-Za-z0-9_-]+)$`).exec(hash);
  // Not a transfer link.
  if (!m) return null;
  // The bytes.
  const bytes = fromBase64Url(m[2]);
  // Not decodable.
  if (!bytes) return null;
  // The JSON text.
  let text: string;
  // Decompression can fail on a damaged link, or be missing in an old browser.
  try {
    // Compressed or plain.
    text = new TextDecoder().decode(m[1] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes);
  } catch {
    // Not readable here.
    return null;
  }
  // Read like an imported file.
  return parseImport(text);
}

// ---------------------------------------------------------------------------
// THE WHOLE PORTABLE PROFILE, WITHOUT THE SERVER (PRIME 12/11/2026 13:38, "Portable storage": "Move with a file" and
// "Move with a link"), and the pairing link that joins another browser to the sync.
//   - The file: {"format": "ronutz-profile", "v": 2, "day": ..., "keys": {...}}, every portable key
//     (src/lib/desk/portable.ts) with the desk's notes; never the sync code, never a local-only key.
//   - The link: /<locale>/desk/#profile=<base64url of the gzip of that JSON>; for small profiles only (the page says
//     when it is too long and offers the file).
//   - The pairing link: /<locale>/desk/#pair=<sync code>. The code travels after the "#", which browsers never send.
// Whatever comes in is merged by the profile's rules (or used instead, the reader's choice) and can be undone.
// ---------------------------------------------------------------------------


/** The profile file's format name. */
export const PROFILE_FORMAT = "ronutz-profile";

/** The longest profile link offered; past it the page offers the file instead (messengers and mail cut long links). */
export const PROFILE_LINK_MAX = 16_000;

/**
 * Keep only portable keys of a profile read from outside (a file, a link).
 *
 * @param keys what was read
 * @returns the portable part
 */
function portableOnly(keys: Record<string, unknown>): Profile {
  // Each key the registry lists.
  return Object.fromEntries(Object.entries(keys).filter(([k]) => portableRule(k) !== null));
}

/**
 * Save the whole portable profile as a file.
 */
export function downloadProfile(): void {
  // The profile, notes included (the file is the reader's own).
  const text = JSON.stringify({ format: PROFILE_FORMAT, v: 2, day: today(), keys: collectProfile(true) }, null, 1);
  // Named by the day.
  downloadText(`ronutz-profile-${today()}.json`, text);
}

/**
 * Read a profile file (or an older desk file, read as a profile holding the desk alone).
 *
 * @param text the file's text
 * @returns the profile, or null when the file holds neither
 */
export function parseProfileFile(text: string): Profile | null {
  // Parsed.
  let value: unknown;
  // Malformed JSON.
  try { value = JSON.parse(text); } catch { return null; }
  // A profile file.
  if (typeof value === "object" && value !== null && (value as { format?: unknown }).format === PROFILE_FORMAT) {
    // Its keys.
    const keys = (value as { keys?: unknown }).keys;
    // Portable ones only.
    return keys && typeof keys === "object" ? portableOnly(keys as Record<string, unknown>) : null;
  }
  // A desk file (or a bare desk): the desk alone.
  const desk = parseImport(text);
  // As a profile.
  return desk ? { "ronutz:desk:v1": desk } : null;
}

/**
 * A link that carries the whole portable profile after the "#".
 *
 * @param origin the site's origin
 * @param locale the page's language
 * @param includeNotes whether the notes go too
 * @returns the link and its length, or the length alone when it is too long to offer
 */
export async function makeProfileLink(origin: string, locale: string, includeNotes: boolean): Promise<{ link: string | null; length: number }> {
  // Compressed.
  const data = await gzipToBase64Url(JSON.stringify({ v: 2, keys: collectProfile(includeNotes) }));
  // The link.
  const link = `${origin}/${locale}/desk/#profile=${data}`;
  // Offered only when short enough.
  return { link: link.length <= PROFILE_LINK_MAX ? link : null, length: link.length };
}

/**
 * Read a profile link's fragment.
 *
 * @param hash location.hash ("#profile=...")
 * @returns the profile, or null
 */
export async function readProfileFragment(hash: string): Promise<Profile | null> {
  // The data.
  const m = /^#profile=([A-Za-z0-9_-]+)$/.exec(hash);
  // Not a profile link.
  if (!m) return null;
  // Decompressed.
  const text = await base64UrlGunzip(m[1]);
  // Not readable.
  if (!text) return null;
  // Parsed.
  try {
    // The value.
    const v = JSON.parse(text) as { v?: unknown; keys?: unknown };
    // A profile.
    return v.v === 2 && v.keys && typeof v.keys === "object" ? portableOnly(v.keys as Record<string, unknown>) : null;
  } catch {
    // Not a profile.
    return null;
  }
}

/**
 * The pairing link for a sync code.
 *
 * @param origin the site's origin
 * @param locale the page's language
 * @param code the normalized sync code
 * @returns the link
 */
export function pairLink(origin: string, locale: string, code: string): string {
  // The code after the "#".
  return `${origin}/${locale}/desk/#pair=${code}`;
}

/**
 * The sync code a pairing link's fragment carries.
 *
 * @param hash location.hash ("#pair=...")
 * @returns the code as written, or null
 */
export function readPairFragment(hash: string): string | null {
  // The code.
  const m = /^#pair=([0-9A-Za-z-]{20,48})$/.exec(hash);
  // Found or not.
  return m ? m[1] : null;
}
