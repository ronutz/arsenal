// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/glossary/GlossaryHashForward.tsx
// ----------------------------------------------------------------------------
// OLD LETTER LINKS STILL LAND (client island on the glossary hub; PRIME 16/11/2026 04:27, splitting the glossary page).
//
// Until this day the hub held every entry, one section per letter, at #gloss-A to #gloss-Z and #gloss-hash, and its
// A to Z rail linked to those anchors. The letters now have their own pages, so a bookmark or an outside link to
// /glossary#gloss-C would land on a hub without a C section. A fragment never reaches the server (the Worker and
// public/_redirects cannot see it), so this reads it in the browser and replaces the address with the letter page,
// without adding a history entry. Renders nothing.
// ============================================================================
"use client";

import { useEffect } from "react";

export default function GlossaryHashForward() {
  useEffect(() => {
    const m = /^#gloss-([A-Z]|hash)$/.exec(window.location.hash); // an old letter anchor?
    if (!m) return; // anything else stays where it is
    const slug = m[1] === "hash" ? "0-9" : m[1].toLowerCase(); // the letter page's segment
    const path = window.location.pathname.replace(/\/glossary\/?$/, `/glossary/letter/${slug}/`); // the hub's path, made the letter's
    if (path !== window.location.pathname) window.location.replace(path); // forwarded, Back still leaves the site's history clean
  }, []);
  return null; // nothing to draw
}
