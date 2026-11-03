// ============================================================================
// src/components/dev/fun/cat-share.ts
// ----------------------------------------------------------------------------
// THE CAT'S SHARE LINK (PRIME 03/11/2026, "Yes on all your suggested ideas"):
// The Global Cat Distribution System's result, shareable. The link is the
// toy's own address with the application after the "#", in the site's one
// link format (src/lib/share/format.ts):
//
//   https://ronutz.com/en/dev/fun/cat-distribution/#input=Ada&city=S%C3%A3o+Paulo
//
// The name is the primary value, so it is named "input" like every tool's
// (format.ts, rule 1); the city, when the applicant gave one, rides as "city",
// because the System's answer depends on both (the same name in another city
// is another cat), and a link that dropped it would deliver someone else's.
// Neither is ever in the query string, so neither is sent in a request; the
// address keeps them in the address bar and history of whoever opens it, which
// the toy says beside the Copy button (share.stateNote).
//
// Opening such a link fills the two fields and tracks at once (the toy reads
// it with useShareArrival, src/lib/share/use-share-arrival.ts, which takes the
// values back out of the address with history.replaceState, as for the tools).
// A malformed value is ignored: a name or city that is empty after trimming,
// longer than MAX_FIELD characters, or holds a control character.
//
// Pure: no window, no React, so a round trip runs in Node.
// ============================================================================

// The share spec shape the site's arrival hook reads.
import type { ShareEncoding, ShareSpec } from "@/lib/share/spec";
// The name of the primary value ("input").
import { SHARE_PRIMARY } from "@/lib/share/format";

/** An application to the System: the name, and the city (empty when none was given). */
export interface CatApplication {
  name: string;
  city: string;
}

/** The longest name or city a link may carry (characters): far more than any name, far less than the format's bound. */
export const MAX_FIELD = 200;

/**
 * Whether one field is fit to carry or to accept.
 *
 * @param v the trimmed value
 * @returns true when it is short enough and holds no control character (C0 or DEL), which a one-line field never types
 */
function fieldOk(v: string): boolean {
  // Too long for a name or a city.
  if (v.length > MAX_FIELD) return false;
  // Each character in turn.
  for (let i = 0; i < v.length; i++) {
    // Its code unit.
    const c = v.charCodeAt(i);
    // A control character: not plain text.
    if (c < 0x20 || c === 0x7f) return false;
  }
  // Plain text within the bound.
  return true;
}

/** The cat toy's share spec: the name as "input", the city as "city". */
export const CAT_SHARE_SPEC: ShareSpec<CatApplication> = {
  // The toy's slug under /dev/fun.
  tool: "cat-distribution",
  // The input as typed, with the site's standard warning beside it.
  posture: "input",
  // The "what this link carries" line, catDistribution.shareCarriesName (or ...NameCity), passed by the page.
  carriesKey: "shareCarriesName",
  // The primary value first, then the city.
  names: [SHARE_PRIMARY, "city"],
  /**
   * An application to the link's values.
   *
   * @param state the tracked application
   * @returns the values, or why there are none
   */
  encode(state: CatApplication): ShareEncoding {
    // The name as the System read it (trimmed).
    const name = state.name.trim();
    // The city, likewise; empty when none was given.
    const city = state.city.trim();
    // No name, no application.
    if (!name) return { ok: false, reason: "empty" };
    // Over-long or not plain text: no link (the toy then shows no share line).
    if (!fieldOk(name) || !fieldOk(city)) return { ok: false, reason: "blocked", code: "field" };
    // The name always; the city only when there is one.
    return { ok: true, params: city ? { [SHARE_PRIMARY]: name, city } : { [SHARE_PRIMARY]: name } };
  },
  /**
   * The link's values back to an application.
   *
   * @param values the values read from the fragment, by name (null when absent)
   * @returns the application, or null for anything malformed (ignored, and stripped from the address)
   */
  decode(values: Readonly<Record<string, string | null>>): CatApplication | null {
    // The name, trimmed.
    const name = (values[SHARE_PRIMARY] ?? "").trim();
    // The city, trimmed (absent is empty).
    const city = (values.city ?? "").trim();
    // A name is required.
    if (!name) return null;
    // Both must be plain text within the bound.
    if (!fieldOk(name) || !fieldOk(city)) return null;
    // The application to track.
    return { name, city };
  },
};
