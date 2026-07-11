"use client";

// ============================================================================
// src/lib/use-prefill.ts
// ----------------------------------------------------------------------------
// usePrefill - read an `input` query parameter once on mount and hand its value
// to the tool. This lets another surface deep-link a value into a tool: the
// WebSerial console's detected-token panel builds `/<locale>/tools/<slug>?input=<value>`,
// and the target tool pre-fills and computes as if the user had pasted it.
//
// It reads window.location directly (client-only) rather than next/navigation's
// useSearchParams, so it needs no Suspense boundary under the static export. The
// apply callback is held in a ref, so the effect runs exactly once on mount with
// no dependency churn.
// ============================================================================

import { useEffect, useRef } from "react";

export function usePrefill(apply: (value: string) => void): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("input");
    if (value) applyRef.current(value);
  }, []);
}
