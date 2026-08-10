// ============================================================================
// src/content/sources/pelkey.ts
// ----------------------------------------------------------------------------
// WAVE 0 (PRIME 2026-08-08, placement ratified 2026-08-10).
//
// The entry that had to land BEFORE the corpus starts drawing on this work
// dozens of times. Waves 1-4 of the enrichment plan use it as a source for
// glossary entries, market-window explainers, organisation entries and trade
// shows; none of them says what the work is or who made it.
//
// EVERY FACT HERE WAS VERIFIED 2026-08-10 BEFORE IT WAS WRITTEN:
//   - 81 interviews, 1988-1994, "venture capitalist and historian"
//       -> Computer History Museum catalogue 102746648, which also records
//          Extent: 81, acquisition number X5671.2010, and the credit line
//          "Gift of James Pelkey"
//   - the hypertext book's title and 1968-1988 span -> same record
//   - Circuits, Packets, and Protocols; 2022; Pelkey, Andrew L. Russell,
//     Loring Robbins -> Open Library
//
// TWO THINGS DELIBERATELY NOT WRITTEN:
//   - "Loring G. Robbins". The enrichment plan carried a middle initial; the
//     catalogue does not. Inventing a person's initial in an entry whose whole
//     purpose is to credit them properly would be a poor way to do it.
//   - The publisher's own page as a citation. dl.acm.org sits behind a
//     Cloudflare interstitial and could not be verified, so it is not cited.
//     A library catalogue that answered cleanly is cited instead.
// ============================================================================

import type { SourceWork } from "./source-types";

export const pelkeyWork: SourceWork = {
  slug: "history-of-computer-communications",
  title: "A History of Computer Communications, 1968-1988",
  kind: "Hypertext history, oral-history collection, and book",
  period: "Interviews 1988-1994; the history covers 1968-1988",
  url: "https://historyofcomputercommunications.info/",
  authors: [
    {
      name: "James L. Pelkey",
      role: "Venture capitalist and historian; conducted the interviews and wrote the history",
    },
    {
      name: "Andrew L. Russell",
      role: "Co-author of the 2022 book edition",
    },
    {
      name: "Loring Robbins",
      role: "Co-author of the 2022 book edition",
    },
  ],
  summary:
    "Between 1988 and 1994 James L. Pelkey travelled the world recording 81 interviews with the people who built computer communications, then turned them into a hypertext history of the industry from 1968 to 1988. The transcripts are held at the Computer History Museum, which makes the evidence behind the history publicly checkable.",
  sections: [
    {
      heading: "What it is",
      body: [
        "A history of the computer communications industry covering 1968 to 1988, published as a hypertext work and freely readable. Its foundation is not a reading of the secondary literature: it is 81 interviews that Pelkey conducted himself between 1988 and 1994, with the founders, engineers, executives and regulators who were there.",
        "The timing is the point. Pelkey began interviewing in 1988, which was early enough that the people who built the first data networks were still working, still reachable, and still able to remember why decisions were made rather than only what was decided. Much of what those transcripts contain exists nowhere else, and by now could not be collected at all.",
      ],
    },
    {
      heading: "The interviews are primary sources, and they are held publicly",
      body: [
        "The transcripts are archived at the Computer History Museum as the James L. Pelkey collection on the history of computer communications, catalogue number 102746648, with an extent of 81 items and the credit line \"Gift of James Pelkey\".",
        "That matters for how this site uses the work. When an entry here cites Pelkey for something a founder said about why a company chose a protocol, the underlying evidence is a transcript in a public collection rather than an assertion in a narrative. It can be checked by anybody, which is the property that makes a secondary source worth relying on.",
      ],
    },
    {
      heading: "Who made it",
      body: [
        "James L. Pelkey is described by the Computer History Museum as a venture capitalist and historian, which is an unusual pairing and part of why the work reads the way it does. He had been inside the industry he later went back to document, and the interviews show it: the questions are the ones somebody asks who already knows what a hard commercial decision looks like.",
        "The 2022 book edition, Circuits, Packets, and Protocols, is co-authored with Andrew L. Russell and Loring Robbins. It is a condensed telling with additional commentary rather than a replacement for the hypertext, which remains the fuller work.",
      ],
    },
    {
      heading: "The market-window idea is Pelkey's, and it is attributed",
      body: [
        "The analytical frame this site borrows most often is Pelkey's own: the observation that a technology succeeds or fails less on its merits than on whether it arrives during the window when a market can absorb it. That idea is why several entries on this site can say a product was correct and still lost.",
        "It is attributed by name wherever it is used, here and elsewhere. Borrowing a scholar's framework without naming them is the failure this entry was written to prevent.",
      ],
    },
    {
      heading: "How this site uses it",
      body: [
        "The industry corpus here draws on this work across many entries: organisation histories, the vocabulary of the period, and the sequence in which the field's problems were solved. It is the principal secondary source behind that corpus.",
        "Where this site and Pelkey's work disagree on a date or a detail, the disagreement is recorded rather than quietly resolved in favour of whichever is more convenient.",
      ],
    },
  ],
  citations: [
    {
      label:
        "Computer History Museum - James L. Pelkey collection: history of computer communications (catalogue 102746648; 81 interviews, 1988-1994)",
      url: "https://www.computerhistory.org/collections/catalog/102746648",
    },
    {
      label: "A History of Computer Communications, 1968-1988 - the work itself",
      url: "https://historyofcomputercommunications.info/",
    },
    {
      label:
        "Open Library - Circuits, Packets, and Protocols (2022); Pelkey, Andrew L. Russell, Loring Robbins",
      url: "https://openlibrary.org/search?q=Circuits%2C+Packets%2C+and+Protocols",
    },
  ],
};

/** Every reference work, in the order the index lists them. */
export const SOURCE_WORKS: SourceWork[] = [pelkeyWork];

export const sourceWorkSlugs = SOURCE_WORKS.map((w) => w.slug);

export function getSourceWork(slug: string): SourceWork | undefined {
  return SOURCE_WORKS.find((w) => w.slug === slug);
}
