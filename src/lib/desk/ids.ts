// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/ids.ts
// ----------------------------------------------------------------------------
// THE NAMES OF THINGS A READER CAN KEEP ON "MY DESK" (PRIME 12/11/2026 12:42,
// PLAN-personal-desk-20261112, section 3.1).
//
// The desk stores identifiers, never titles: "tool:cidr", "learn:acme-protocol",
// "term:bfd", "game:patch-path", "series:psyops". A title comes from the site
// index of the page's language (src/lib/desk/siteIndex.ts) at the moment it is
// shown, so a renamed or retranslated item shows correctly and a removed one can
// say so. This file is the one place that says which kinds exist, how an
// identifier is written, where each kind's page is, and which section of the
// interest counts a kind belongs to. Pure: no window, no storage, no network, so
// the generator, the guards and the pages all read the same rules.
// ============================================================================

// The one place that says whether a game's page is under /arcade or /dev/fun.
import { funPagePath } from "@/config/funGames";

/**
 * The kinds of item, in the order the desk groups them.
 * tool: a tool page; learn: a Learn article; term: a glossary entry; game: a daily puzzle or arcade game;
 * series: a Learn series; training: a training series (/study-guides/<id>); reading: a curated reading path
 * (/study-guides#<id>); guide: a certification study guide (/certifications/<slug>).
 */
export const ITEM_KINDS = ["tool", "learn", "term", "game", "series", "training", "reading", "guide"] as const;

/** One of the kinds above. */
export type ItemKind = (typeof ITEM_KINDS)[number];

/** An identifier: a kind, a colon, a slug ("learn:acme-protocol"). */
export type ItemId = `${ItemKind}:${string}`;

/** The kinds that hold other items in order, so a reader can adopt them as a path. */
export const COLLECTION_KINDS: readonly ItemKind[] = ["series", "training", "reading"];

/** The kinds whose "read" state is better said as "done" (a tool used, a game played). */
export const DONE_KINDS: readonly ItemKind[] = ["tool", "game"];

/** A slug as the site writes them: lower-case letters, digits and hyphens, a letter or digit first, at most 96 long. */
export const ITEM_SLUG = /^[a-z0-9][a-z0-9-]{0,95}$/;

/**
 * Whether a value is a well-formed identifier of a known kind.
 *
 * @param value anything
 * @returns true for "kind:slug" with a known kind and a well-formed slug
 */
export function isItemId(value: unknown): value is ItemId {
  // Only strings can be identifiers.
  if (typeof value !== "string") return false;
  // The first colon splits kind from slug.
  const i = value.indexOf(":");
  // No colon, or nothing before it: not an identifier.
  if (i <= 0) return false;
  // The kind must be one of the list, the slug well formed.
  return (ITEM_KINDS as readonly string[]).includes(value.slice(0, i)) && ITEM_SLUG.test(value.slice(i + 1));
}

/**
 * Build an identifier from its two parts.
 *
 * @param kind the kind
 * @param slug the slug
 * @returns "kind:slug"
 */
export function itemId(kind: ItemKind, slug: string): ItemId {
  // Joined with a colon, the one separator the format has.
  return `${kind}:${slug}` as ItemId;
}

/**
 * Split an identifier into its kind and slug.
 *
 * @param id a well-formed identifier
 * @returns its kind and slug
 */
export function splitItemId(id: ItemId): { kind: ItemKind; slug: string } {
  // The first colon: slugs never contain one.
  const i = id.indexOf(":");
  // The two parts.
  return { kind: id.slice(0, i) as ItemKind, slug: id.slice(i + 1) };
}

/**
 * The page of an item, without the locale (the site's Link adds it, and sends an article or an entry to English in
 * a language that does not carry them).
 *
 * @param id the identifier
 * @returns a root-relative path, with a fragment for the kinds that live on an index page
 */
export function itemHref(id: ItemId): string {
  // The two parts.
  const { kind, slug } = splitItemId(id);
  // One address per kind.
  switch (kind) {
    case "tool":
      // The tool's own page.
      return `/tools/${slug}`;
    case "learn":
      // The article.
      return `/learn/${slug}`;
    case "term":
      // The glossary entry.
      return `/glossary/${slug}`;
    case "game":
      // /arcade/<id> or /dev/fun/<id>, as the games' registry says.
      return funPagePath(slug);
    case "series":
      // The series' card on the series index carries its id as an anchor.
      return `/learn/series#${slug}`;
    case "training":
      // A training series has a page of its own.
      return `/study-guides/${slug}`;
    case "reading":
      // A curated reading path's card on the study guides page carries its id as an anchor.
      return `/study-guides#${slug}`;
    case "guide":
      // A certification study guide.
      return `/certifications/${slug}`;
  }
}

/** The sections of the interest counts (src/lib/interest/shape.ts), repeated here so this file needs no import of it. */
export type DeskSection = "tools" | "learn" | "glossary" | "fun" | "site";

/**
 * The section of the interest counts an item belongs to, for the one count a save sends (track("save", ...)).
 *
 * @param kind the item's kind
 * @returns tools, learn, glossary, fun, or site for the collections and the guides
 */
export function interestSectionOf(kind: ItemKind): DeskSection {
  // Each kind to its part of the site.
  if (kind === "tool") return "tools";
  // Articles.
  if (kind === "learn") return "learn";
  // Glossary entries.
  if (kind === "term") return "glossary";
  // Games and puzzles.
  if (kind === "game") return "fun";
  // Series, training series, reading paths and certification guides belong to the site as a whole.
  return "site";
}

/**
 * The item a site address names, for the search dialog's "Add to..." and for anything else that only has a URL.
 * Accepts the locale-prefixed form the search returns ("/en/tools/cidr/") and the bare form ("/tools/cidr").
 *
 * @param url an absolute or root-relative address
 * @param gameIds the games' ids (FUN_GAMES), so a toy under /dev/fun is not mistaken for a game
 * @returns the identifier, or null when the address names nothing a desk can keep
 */
export function itemFromUrl(url: string, gameIds: readonly string[]): ItemId | null {
  // The path alone: an absolute address loses its origin, a query and a fragment are dropped.
  const path = url.replace(/^[a-z]+:\/\/[^/]+/i, "").split(/[?#]/)[0];
  // Its segments, empty ones dropped (leading and trailing slashes).
  let segs = path.split("/").filter(Boolean);
  // A locale segment in front (two letters, or a tag such as pt-BR or zh-Hans) is not part of the item.
  if (segs.length > 0 && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(segs[0])) segs = segs.slice(1);
  // Nothing left: the home page.
  if (segs.length === 0) return null;
  // A tool page, or its documentation page, names the tool.
  if (segs[0] === "tools" && segs[1] && (segs.length === 2 || (segs.length === 3 && segs[2] === "docs"))) return slugOr("tool", segs[1]);
  // An article (the series index under /learn/series is not one).
  if (segs[0] === "learn" && segs.length === 2 && segs[1] !== "series") return slugOr("learn", segs[1].replace(/\.md$/, ""));
  // A glossary entry (the domain and kind index pages are not).
  if (segs[0] === "glossary" && segs.length === 2) return slugOr("term", segs[1]);
  // A game, under either of its two sections, only when it is one of the games.
  if (((segs[0] === "arcade" && segs.length === 2) || (segs[0] === "dev" && segs[1] === "fun" && segs.length === 3)) && gameIds.includes(segs[segs.length - 1])) {
    return slugOr("game", segs[segs.length - 1]);
  }
  // A training series' own page.
  if (segs[0] === "study-guides" && segs.length === 2) return slugOr("training", segs[1]);
  // A certification study guide.
  if (segs[0] === "certifications" && segs.length === 2) return slugOr("guide", segs[1]);
  // Anything else names no item.
  return null;
}

/**
 * An identifier when the slug is well formed, null otherwise.
 *
 * @param kind the kind
 * @param slug the slug read from an address
 * @returns the identifier or null
 */
function slugOr(kind: ItemKind, slug: string): ItemId | null {
  // Only a slug the site could have written.
  return ITEM_SLUG.test(slug) ? itemId(kind, slug) : null;
}
