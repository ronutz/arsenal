// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/lib/protected-email.ts
// ----------------------------------------------------------------------------
// E-MAIL ADDRESSES THAT NO CRAWLER CAN LIFT FROM WHAT THE SITE SERVES.
//
// WHY (PRIME, 27/10/2026 23:12: "Yes on the CV, but the e-mail address needs to
// be spam-crawler-proof"). Harvesters read three things: the HTML, the page's
// data payload (the .txt RSC file next to it) and the JavaScript bundles. They
// match user@domain, and they also decode the usual disguises ("user [at]
// domain", "user AT domain DOT com", HTML entities). So an address here is
// never written in any of those forms, anywhere:
//   - it is stored as character codes, each XORed with a key and the whole
//     sequence reversed, so neither the bundle nor any payload holds the
//     address, its parts, or a pattern a regex would recognise;
//   - pages pass only an id ("cv", "site"), so the server never serialises the
//     address into the page data;
//   - the address is decoded in the visitor's browser, and only when the visitor
//     asks for it (ProtectedEmail's button) or prints the page.
// A crawler that executes JavaScript would still have to press the button; the
// ones that do are rare, and the ones that fill spam lists do not.
//
// The post-build guard scripts/check-no-plain-email.mjs fails the build if a
// full address on the site's domain appears in anything served, so a future
// edit cannot undo this silently.
// ============================================================================

/** The addresses a page may show, by id. */
export type ProtectedEmailId = "cv" | "site";

/** The XOR key applied to every character code (one byte). */
const KEY = 0x5a; // any byte works; it only has to match the codes below

/**
 * Each address as char codes XOR KEY, in reverse order (computed once by hand; the decoder below is the only reader).
 * cv: the address the CV publishes (PRIME's choice for résumés, 26/10/2026); site: the site's general contact address.
 */
const ENCODED: Readonly<Record<ProtectedEmailId, readonly number[]>> = Object.freeze({
  cv: Object.freeze([55, 53, 57, 116, 32, 46, 47, 52, 53, 40, 26, 62, 53, 40]), // the CV's address
  site: Object.freeze([55, 53, 57, 116, 32, 46, 47, 52, 53, 40, 26, 53, 54, 54, 63, 50]), // the site's contact address
});

/**
 * The address for an id, decoded. Call it in the browser, on the visitor's request, never during rendering on the
 * server (whatever the server renders ends up in the HTML and the page data).
 * @param id which address
 * @returns the address
 */
export function revealEmail(id: ProtectedEmailId): string {
  // Reverse the sequence back, undo the XOR on each code, and join the characters.
  return [...ENCODED[id]].reverse().map((c) => String.fromCharCode(c ^ KEY)).join("");
}

/** The custom event a "Save as PDF" button sends so every protected address on the page is revealed before printing. */
export const REVEAL_EMAIL_EVENT = "ronutz:reveal-email";
