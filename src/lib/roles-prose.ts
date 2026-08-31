// ============================================================================
// roles-prose  —  the Portuguese side of The Roles.
// ----------------------------------------------------------------------------
// *** WHY THIS EXISTS (PRIME, 2026-08-16) ***
//
// The standing rule is that content is CREATED bilingual: English and Brazilian
// Portuguese, both authored natively, neither machine-translated. Learn follows
// it. The Practice follows it. The glossary follows it - 1,242 entries with
// native def/context/depth in both message files.
//
// THE ROLES CORPUS DID NOT. Thirty-nine roles, roughly 1,250 prose strings, in
// English only, so a Portuguese reader got translated headings above English
// paragraphs. That was a failure against a rule that was already established.
//
// The repair takes the shape the glossary proves: STRUCTURE stays in roles.ts
// (slugs, groups, adjacency, provenance - none of it language), PROSE lives in
// the message files where both languages sit side by side and a guard can count
// them.
//
// INCREMENTAL BY DESIGN. Thirty-nine roles cannot be authored well in one
// sitting, and bulk output is exactly what PRIME refused. So a field falls back
// to the English in roles.ts until its Portuguese is written, and
// `check-roles-bilingual` counts what remains and refuses to let it grow.
//
// THE FALLBACK IS A MIGRATION AID, NOT A DESTINATION. The baseline goes to zero.
// ============================================================================

/** The `roles` namespace of a loaded message file, as far as this needs it. */
type RoleMessages = {
  entries?: Record<string, Record<string, unknown> | undefined>;
};

/** One authored field for one role, or undefined when not yet written. */
function field(messages: unknown, slug: string, name: string): unknown {
  const entries = (messages as RoleMessages | undefined)?.entries;
  return entries?.[slug]?.[name];
}

/**
 * One prose string in the reader's language, falling back to the English held
 * in roles.ts when the Portuguese has not been authored yet.
 */
export function prose(messages: unknown, slug: string, name: string, english: string): string {
  const v = field(messages, slug, name);
  return typeof v === "string" && v.length > 0 ? v : english;
}

/**
 * A prose list. Message files store lists as objects keyed "0", "1", ...
 * because next-intl messages are objects rather than arrays.
 *
 * The ENGLISH array decides the length, which means a Portuguese list cannot
 * silently be shorter than its English counterpart: any item not yet authored
 * renders its English, and the guard reports the role as partial.
 */
export function proseList(
  messages: unknown,
  slug: string,
  name: string,
  english: readonly string[],
): string[] {
  const v = field(messages, slug, name) as Record<string, string> | undefined;
  return english.map((en, i) => {
    const item = v?.[String(i)];
    return typeof item === "string" && item.length > 0 ? item : en;
  });
}

/** A who/what pair as stored in messages (objects keyed "0","1",… like proseList). */
type PairMsg = { who?: unknown; what?: unknown };

/**
 * A prose PAIR list — receivesFrom / serves, each item { who, what }. Same
 * contract as proseList: the ENGLISH array decides the length, every item falls
 * back to its English until the Portuguese pair is authored, and the guard
 * counts the field as authored only when it exists in the pt entry at all.
 */
export function prosePairs(
  messages: unknown,
  slug: string,
  name: string,
  english: readonly { who: string; what: string }[]
): { who: string; what: string }[] {
  const v = field(messages, slug, name) as Record<string, PairMsg> | undefined;
  return english.map((en, i) => {
    const it = v?.[String(i)];
    const who = typeof it?.who === "string" && it.who.length > 0 ? it.who : en.who;
    const what = typeof it?.what === "string" && it.what.length > 0 ? it.what : en.what;
    return { who, what };
  });
}
