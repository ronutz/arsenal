"use client";

// ============================================================================
// src/components/PageCapabilities.tsx
// ----------------------------------------------------------------------------
// The bridge that lets a (mostly server-rendered) page declare its "." context
// capabilities to the global keyboard island (T-DOT, phase 1).
//
// A page - the tool page, a vendor hub, the boss-screen host - renders this
// client component with an already-built, already-localized capability set. On
// mount it publishes the set into the module-level page-capability store; on
// unmount (including the unmount that a route change causes) it clears it. The
// island reads that store when the user presses ".".
//
// It renders nothing. It is purely the write side of the store; the island is
// the read side and owns all the UI. Keeping the two apart means the island stays
// the single place that owns "." semantics, and any page can opt in by rendering
// this with its own descriptors - no page needs to know the island exists.
// ============================================================================

import { useEffect } from "react";
import {
  setPageCapabilities,
  clearPageCapabilities,
  type PageCapabilitySet,
} from "@/lib/pageCapabilities";

export default function PageCapabilities({ set }: { set: PageCapabilitySet }) {
  // Re-publish whenever the set identity changes (e.g. client-side navigation
  // between two tool pages that both render this). Clear on unmount so a page
  // with no capabilities does not inherit the previous page's set.
  //
  // The dependency is a stable JSON signature of the set: the parent rebuilds
  // the object on every render, so depending on the object reference would
  // re-run this effect every render. The signature only changes when the actual
  // contents change.
  const signature = JSON.stringify(set);

  useEffect(() => {
    setPageCapabilities(set);
    return () => clearPageCapabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return null;
}
