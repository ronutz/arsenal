// ============================================================================
// src/components/CertNoteText.tsx
// ----------------------------------------------------------------------------
// A certification note's segments as inline content (PRIME 26/10/2026). A
// translated note may quote the vendor's own words; those stay English and are
// rendered as <q lang="en"> inside the translated sentence, so a reader and
// assistive technology both know which words are the vendor's. Plain running
// text renders as plain text, so a note without quotations produces exactly the
// same markup as the string it replaces (the English pages stay unchanged).
// No hooks: usable from the server pages and from the hub's client component.
// ============================================================================

import type { NoteSegment } from "@/content/certifications/localized";

/** Render a note's segments in order: text as is, each quotation as an English <q>. */
export default function CertNoteText({ parts }: { parts: readonly NoteSegment[] }) {
  // One child per segment, keyed by position (the list never reorders).
  return (
    <>
      {parts.map((p, i) =>
        // Running text: a plain string child, identical to rendering the string itself.
        typeof p === "string" ? p : (
          // A quotation in the vendor's English, marked as such.
          <q key={i} lang="en">
            {p.quoteEn}
          </q>
        ),
      )}
    </>
  );
}
