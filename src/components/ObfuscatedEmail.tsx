"use client";

// ============================================================================
// src/components/ObfuscatedEmail.tsx
// ----------------------------------------------------------------------------
// SPAM-RESISTANT EMAIL CHANNEL.
//
// WHY: spam harvesters scrape the raw HTML for `mailto:` links and anything
// matching user@domain. On a static export the contact email would otherwise
// sit in the shipped HTML in plain sight. This renders the channel in two
// states:
//   - Before hydration / with no JS: a NON-clickable span showing
//     "user [at] domain" — readable by a human, but no `mailto:` and no literal
//     address pattern for a regex harvester to grab from the static HTML.
//   - After hydration (real browser): the normal clickable mailto link.
//
// The address is also assembled at runtime from separate `user` and `domain`
// props, so the full string is never a single literal in the page source. This
// defeats the common HTML-scraping harvesters; a JS-executing crawler could
// still read it, but those are not the spam bots this guards against.
// ============================================================================

import { useEffect, useState } from "react";

export default function ObfuscatedEmail({
  label,
  user,
  domain,
}: {
  label: string;
  user: string;
  domain: string;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(true), []);

  const address = `${user}@${domain}`;

  if (!revealed) {
    return (
      <span className="contact-channel" aria-label={`${label}: ${user} at ${domain}`}>
        <span className="contact-channel-label">{label}</span>
        <span className="contact-channel-desc">
          {user} [at] {domain}
        </span>
      </span>
    );
  }

  return (
    <a className="contact-channel" href={`mailto:${address}`}>
      <span className="contact-channel-label">{label}</span>
      <span className="contact-channel-desc">{address}</span>
    </a>
  );
}
