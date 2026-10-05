"use client";

// ============================================================================
// src/components/ConsoleGreeting.tsx
// ----------------------------------------------------------------------------
// ONE LINE IN THE DEVELOPER CONSOLE (PRIME, 2026-10-04). The people who open
// DevTools on a networking toolbox are a self-selecting audience, and this is
// addressed to them: the method of the site stated as the joke it also is,
// with the link to the colophon paragraph that says it plainly and to the
// article on the small tradition of hidden messages in HTTP. It runs once per
// page load, after hydration, writes nothing anywhere else, and renders no
// markup. It is the console twin of the X-Collective response header; both
// cost the reader nothing and neither does anything.
// ============================================================================

import { useEffect } from "react";

export default function ConsoleGreeting() {
  useEffect(() => {
    // Guard against double logging under React strict mode's development double-invoke.
    const w = window as unknown as { __ronutzGreeted?: boolean };
    if (w.__ronutzGreeted) return;
    w.__ronutzGreeted = true;
    try {
      // Plain text so it reads the same in every console; no styling, no banner art.
      console.log("Resistance is futile. Good ideas are assimilated here, with their sources: https://ronutz.com/en/colophon/#principles");
      console.log("GNU Terry Pratchett. The headers explain themselves: https://ronutz.com/en/learn/hidden-messages-in-http-headers/");
    } catch {
      /* a console that throws is not worth a second try */
    }
  }, []);
  // Nothing to render: the component exists for its side effect only.
  return null;
}
