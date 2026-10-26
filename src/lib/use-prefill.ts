"use client";

// ============================================================================
// src/lib/use-prefill.ts
// ----------------------------------------------------------------------------
// usePrefill - read a handed-over value from the address once on mount and hand
// it to the tool, so another surface can deep-link a value into a tool (the
// home page's quick CIDR box, the HTTP message decoder, the serial console's
// detected-token panel, the ASCII table and the Unicode inspector all do), and
// the target tool pre-fills and computes as if the reader had pasted it.
//
// SINCE 2026-10-20 (Round 1 RT01) the value travels in the FRAGMENT
// (#input=<value>), which no HTTP request carries; the address format, the
// bounds and the legacy rules live in src/lib/handoff.ts, and links are built
// there with handoffHref(). This hook:
//   - reads the fragment first and, for a legacy link, the query (?input=);
//   - after reading a legacy query, rewrites the address to the fragment form
//     with history.replaceState, which is not a request, so a reload, a
//     bookmark or a share from then on no longer sends the value (the first
//     request of a legacy link has already reached the host; nothing in the
//     page can undo that, and the copy says so);
//   - refuses an over-long value (MAX_HANDOFF_CHARS) rather than parse it;
//   - follows a fragment the reader changes in place (hashchange, and back or
//     forward between two such addresses), so the address and the tool agree;
//   - given the tool's current value, drops the handoff from the address once
//     the reader clears or edits the value, so the address (and a share or a
//     reload of it) never describes a value the page no longer shows;
//   - returns whether the page was opened by a legacy query link, so a tool can
//     say plainly that this one request carried the value to the host.
//
// It reads window.location directly (client-only) rather than next/navigation's
// useSearchParams, so it needs no Suspense boundary under the static export. The
// apply callback is held in a ref, so the effects run with no dependency churn.
// Every history call passes window.history.state through, so the router's own
// entry state survives the rewrite.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { hrefWithoutHandoff, migrateLegacyHref, readHandoff } from "./handoff";

/**
 * Hand the address's handoff value to a tool.
 * @param apply receives the value once on mount (and again when the reader changes the fragment in place)
 * @param current the tool's own value for the field the handoff fills; when given, the handoff leaves the address
 *   as soon as the field stops holding the handed-over value (Clear, Example, an edit). Omit it for a tool whose
 *   apply spreads the value over several fields; the address then keeps the handoff until the reader leaves.
 * @returns true when the page was opened by a legacy ?input= link (its request carried the value to the host)
 */
export function usePrefill(apply: (value: string) => void, current?: string): boolean {
  // The latest apply, so the effects never need it as a dependency.
  const applyRef = useRef(apply);
  applyRef.current = apply;
  // The value last handed to the tool from the address, or null once the address no longer carries one.
  const appliedRef = useRef<string | null>(null);
  // Whether the tool's field has shown the handed-over value yet: until it has, a different current value is the
  // field's initial state (the update from apply has not landed), not an edit, and must not drop the handoff.
  const landedRef = useRef(false);
  // Whether the arrival was a legacy query link, for the tool's one-line notice (false during prerender and on any
  // other arrival).
  const [legacy, setLegacy] = useState(false);

  // Mount: read the address once, and follow in-place fragment changes after that.
  useEffect(() => {
    // Client-only, as the page is static.
    if (typeof window === "undefined") return;
    /** Read the address and hand its value over; `initial` allows the legacy query, which only an arrival carries. */
    const take = (initial: boolean) => {
      // The fragment first, then (on arrival only) the legacy query.
      const read = readHandoff(window.location.hash, initial ? window.location.search : "");
      // Nothing usable: no value, or one over the bound (refused, never parsed).
      if (read.kind !== "value") return;
      // The same value again (our own rewrite, or a repeated event): nothing new to apply.
      if (!initial && read.value === appliedRef.current) return;
      // Remember it, and wait for the field to show it before judging edits.
      appliedRef.current = read.value;
      landedRef.current = false;
      // Fill the tool as if the reader had pasted the value.
      applyRef.current(read.value);
      // A legacy link: move the value from the query into the fragment, without a request.
      if (read.source === "query") {
        // The tool may say that this arrival's request already carried the value.
        setLegacy(true);
        const next = migrateLegacyHref(window.location.href, read.value);
        if (next) window.history.replaceState(window.history.state, "", next);
      }
    };
    // The arrival.
    take(true);
    // A fragment changed in place (typed in the address bar, or back and forward between two handoff addresses).
    const onHash = () => take(false);
    window.addEventListener("hashchange", onHash);
    // Stop listening when the tool unmounts.
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Edits: once the field has shown the handed-over value, any other value drops the handoff from the address.
  useEffect(() => {
    // Not tracked by this tool, or no handoff in force.
    if (current === undefined || appliedRef.current === null) return;
    // The field now shows the handed-over value: from here on, a difference is the reader's own change.
    if (current === appliedRef.current) {
      landedRef.current = true;
      return;
    }
    // Still the field's initial state, before the apply landed.
    if (!landedRef.current) return;
    // Cleared or edited: the address stops carrying the old value, without a request or a history entry.
    appliedRef.current = null;
    landedRef.current = false;
    const next = hrefWithoutHandoff(window.location.href);
    if (next) window.history.replaceState(window.history.state, "", next);
  }, [current]);

  // Whether this page arrived by a legacy query link.
  return legacy;
}
