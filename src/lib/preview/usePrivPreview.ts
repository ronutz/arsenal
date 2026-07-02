"use client";

// ============================================================================
// src/lib/preview/usePrivPreview.ts
// ----------------------------------------------------------------------------
// A RENDER-ONLY privileged preview flag. It lets a privileged operator reveal
// affordances (for example the API panel) that are otherwise switched off in
// config, so work-in-progress surfaces can be reviewed in place before they go
// public. It is used by client components across the app; the Worker never
// consults it.
//
// HONEST SCOPE: this is NOT a security boundary. It gates only what is RENDERED
// in the browser; it never opens the API, never changes what the edge serves,
// and anyone with devtools can flip a React flag regardless. Its whole job is to
// avoid accidental exposure and to keep the raw activation token out of the
// shipped source. Real enablement and authorization live in the API surface
// config and, server-side, in the Worker.
//
// HARDENING over a plain token:
//   - The raw token is NEVER in the source. The build embeds only a SHA-256 hash
//     (NEXT_PUBLIC_PRIV_PREVIEW_HASH); the client hashes the ?priv= value and
//     compares. Reversing SHA-256 is infeasible, so reading the bundle does not
//     reveal the token.
//   - Once matched, preview persists for the browser SESSION (sessionStorage),
//     so it survives navigation without re-supplying ?priv= on every page.
//   - ?priv=off clears the persisted flag and turns preview off.
//   - SSR-safe: the flag starts false and is only ever set inside an effect, so
//     server and first client render agree (no hydration mismatch). It flips on
//     after mount for the privileged viewer.
//
// With NEXT_PUBLIC_PRIV_PREVIEW_HASH unset (the current state), no token can ever
// match, nothing is persisted, and preview is permanently false: every gated
// affordance stays dark. Turning preview on is purely a build-time env change
// plus visiting a URL with the matching ?priv= token.
//
// To configure later (never commit the raw token):
//   printf '%s' 'YOUR_TOKEN' | sha256sum        # -> set NEXT_PUBLIC_PRIV_PREVIEW_HASH
//   then visit any page with ?priv=YOUR_TOKEN
// ============================================================================

import { useEffect, useState } from "react";

/** sessionStorage key holding the "preview active for this session" flag. */
const SESSION_KEY = "ronutz.privPreview";

/** Hex SHA-256 of a string, via Web Crypto (browser only). */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns whether privileged preview is active. Always false during SSR and on
 * the first client render; may flip to true inside the mount effect for a
 * privileged viewer. Safe to call from any client component.
 */
export function usePrivPreview(): boolean {
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const provided = new URLSearchParams(window.location.search).get("priv");

        // Explicit off-switch: clear any persisted preview and stay off.
        if (provided === "off") {
          window.sessionStorage.removeItem(SESSION_KEY);
          if (!cancelled) setPreview(false);
          return;
        }

        // Already activated earlier in this browser session.
        if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
          if (!cancelled) setPreview(true);
          return;
        }

        // A fresh token in the URL, matched by hash. The raw token is not in the
        // source; only its SHA-256 is embedded at build time.
        const expected = process.env.NEXT_PUBLIC_PRIV_PREVIEW_HASH;
        if (provided && expected) {
          const got = await sha256Hex(provided);
          if (got === expected) {
            window.sessionStorage.setItem(SESSION_KEY, "1");
            if (!cancelled) setPreview(true);
          }
        }
      } catch {
        // Web Crypto or storage unavailable, or URL unparseable: preview stays off.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return preview;
}
