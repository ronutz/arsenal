"use client";

// ============================================================================
// src/lib/share/use-share-arrival.ts
// ----------------------------------------------------------------------------
// useShareArrival - open a "Share results" link: on mount, and whenever the
// fragment changes in place (a link pasted into the address bar of the open
// page), read the tool's values from the fragment, decode them with the tool's
// spec and hand the state to the tool, which fills its fields as if the reader
// had pasted them. The rule itself is resolveArrival() in spec.ts (pure,
// tested by the central harness); this hook only applies its answer:
//   - the address loses the tool's values at once, accepted or not, with
//     history.replaceState (no request, no history entry), so a reload, a
//     bookmark or the page's own Share button carries nothing the reader did
//     not choose to share again;
//   - a malformed or over-long share is ignored: the tool shows nothing of it;
//   - the hook never presses anything: a tool that sends a request (the red
//     room) or loads an engine (WebAssembly) waits for the reader as always.
//
// A tool that already reads #input= with usePrefill (18 did on 2026-10-27)
// keeps usePrefill and does NOT add this hook: both would read the same value.
// ============================================================================

import { useEffect, useRef } from "react"; // the mount effect, and the latest callbacks
import { resolveArrival, type ShareSpec } from "./spec"; // the arrival rule

/**
 * Apply an arriving share link to a tool.
 * @param spec the tool's share spec (its names and decode)
 * @param apply receives the decoded state; called at most once per arrival
 */
export function useShareArrival<E, D>(spec: ShareSpec<E, D>, apply: (state: D) => void): void {
  // The latest spec and apply, so the effect needs no dependencies and runs once.
  const specRef = useRef(spec);
  specRef.current = spec;
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    // Client only: the pages are static.
    if (typeof window === "undefined") return;
    /** Read the address, clean it, then apply what was accepted. */
    const take = (): void => {
      const out = resolveArrival(window.location.href, specRef.current); // the pure rule
      if (out.cleaned) window.history.replaceState(window.history.state, "", out.cleaned); // the values leave the address
      if (out.state !== null) applyRef.current(out.state); // fill the tool as a paste would
    };
    // The arrival.
    take();
    // A link pasted into the address bar of the open page changes only the fragment: no reload, a hashchange.
    window.addEventListener("hashchange", take);
    // Stop listening when the tool unmounts.
    return () => window.removeEventListener("hashchange", take);
  }, []);
}
