// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/hooks/useFullscreen.ts
// ----------------------------------------------------------------------------
// A reusable fullscreen switch for the /dev/fun toys. Extracted verbatim in
// behavior from the MegaBrainConsole implementation so every toy fullscreens
// identically.
//
// Two mechanisms reach the same result:
//   1. The real Fullscreen API - desktop and Android Chrome give true OS
//      fullscreen on an element.
//   2. A CSS "fill the viewport" fallback (a class the caller applies to the
//      root) for browsers whose API cannot fullscreen a non-video element -
//      notably iPhone Safari, which only supports fullscreen for <video>.
//
// Two flags back the single `isFullscreen` the switch reads, so it reflects
// EITHER path. `nativeFs` is driven by the fullscreenchange event, so pressing
// Esc (which exits real fullscreen without going through our toggle) keeps the
// switch in sync. WebKit-prefixed variants cover older Safari.
//
// Usage:
//   const { ref, isFullscreen, toggle } = useFullscreen<HTMLDivElement>();
//   <div ref={ref} className={`my-root${isFullscreen ? " is-fullscreen" : ""}`}>
//     <button onClick={toggle} aria-pressed={isFullscreen}>...</button>
//   </div>
// The caller decides the CSS class name; only the JS behavior lives here. Pair
// with the .fs-fill / :fullscreen rules in components.css (or a component class).
// ============================================================================
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFullscreenResult<T extends HTMLElement> {
  /** Attach to the element that should fill the screen. */
  ref: React.RefObject<T | null>;
  /** True when in EITHER real or CSS fullscreen. */
  isFullscreen: boolean;
  /** Whether the CSS fallback (not the real API) is the active path. */
  cssFallbackActive: boolean;
  /** Enter if out, exit if in - handles both mechanisms. */
  toggle: () => void;
}

export function useFullscreen<T extends HTMLElement = HTMLDivElement>(): UseFullscreenResult<T> {
  const ref = useRef<T>(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const isFullscreen = nativeFs || cssFs;

  // Keep `nativeFs` honest even when the user exits via Esc.
  useEffect(() => {
    const sync = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const el = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setNativeFs(el === ref.current);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const doc = document as Document & {
      webkitExitFullscreen?: () => void;
      webkitFullscreenElement?: Element | null;
      webkitFullscreenEnabled?: boolean;
    };
    const node = el as T & { webkitRequestFullscreen?: () => void };
    // Exit whichever fullscreen we're in.
    if (cssFs) {
      setCssFs(false);
      return;
    }
    if (document.fullscreenElement ?? doc.webkitFullscreenElement) {
      (document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc))?.();
      return;
    }
    // Enter: real API where available, CSS fallback otherwise (iPhone Safari).
    const request = node.requestFullscreen?.bind(node) ?? node.webkitRequestFullscreen?.bind(node);
    const enabled = document.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false;
    if (request && enabled) {
      Promise.resolve(request()).catch(() => setCssFs(true));
    } else {
      setCssFs(true);
    }
  }, [cssFs]);

  return { ref, isFullscreen, cssFallbackActive: cssFs, toggle };
}
