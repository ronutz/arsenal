// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - "The Architecture of Lotus Notes": a note carries a NOTEID (local), ITEMS
//     (fields), and an ORIGINATORID that identifies the same document across
//     every replica AND stamps its last modification, which is what makes
//     conflict detection possible
//   - SWING Software: data, structure (forms, views) and code all live in the
//     single NSF file, making it a self-contained portable application
//   - ServerWatch: replication is BIDIRECTIONAL and incremental, designed for
//     very slow networks; NSF is document-oriented with varied field values
//   - Grokipedia/HCL: store-and-forward queuing in the local replica, conflict
//     resolution on timestamps and document IDs, full offline operation
//   - RockTeam (2026): Domino 14.5 with Domino+ and Domino IQ running AI inside
//     the customer's own environment; REST and gRPC APIs, containerisation
//
// THE BODY IS EXCELLENT AND LONG (nine paragraphs): the founding, the $1M
// forecast against $53M, the VisiCalc succession and Software Arts purchase,
// Manzi, Notes, the IBM and HCL sales, the cc:Mail/Qualys link, and the closing
// argument that Lotus was bought for technology that outlasted its buyer.
// This profile adds ONLY the architecture, which explains WHY that happened.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const lotusProfile: VendorProfile = {
  slug: "lotus",
  foundings: [
    {
      company: "Lotus Development",
      year: 1982,
      place: "Cambridge, Massachusetts",
      founders: ["Mitch Kapor", "Jonathan Sachs"],
      story:
        "One founder who had built products for the company that distributed VisiCalc, and one who then spent ten months writing the replacement in assembly language. The division of labour is the whole story: somebody who understood what the market wanted next, and somebody who could write it fast enough to matter.",
    },
    {
      company: "Iris Associates",
      year: 1984,
      place: "Westford, Massachusetts",
      founders: ["Ray Ozzie", "Tim Halvorsen", "Len Kawell"],
      story:
        "The separate company that built Notes, funded by Lotus and acquired by it in 1994. Its founders had worked on PLATO, the university teaching system whose notesfiles were among the first online discussion spaces, and the lineage shows: Notes is a descendant of an academic collaboration tool rather than of an email product.",
    },
  ],
  timeline: [
    { year: 1983, title: "1-2-3 ships", detail: "26 January, written for machines with 256K of memory when its predecessor had been built for less - a deliberate bet that the hardware would arrive." },
    { year: 1989, title: "Notes 1.0", detail: "Group messaging, discussions, contacts, encryption, message authentication and document links, on DOS and OS/2 - a feature list that took the rest of the industry most of a decade to match." },
    { year: 1991, title: "cc:Mail", detail: "Acquired, and its founder later ran another company on this timeline for two decades." },
    { year: 1994, title: "Iris acquired", detail: "The developer of Notes brought inside, a year before IBM bought the whole thing." },
    { year: 2026, title: "Domino 14.5", detail: "An AI layer running inside the customer's own environment rather than a vendor's cloud, alongside REST and gRPC interfaces and container support - architectural work, not maintenance." },
  ],
  products: [
    { name: "Lotus 1-2-3", what: "The spreadsheet that defined the category on the IBM PC, and whose macro language turned it from a calculator into a programming environment that finance departments genuinely programmed." },
    { name: "Notes and Domino", what: "The client and the server: replicated document stores with application logic inside them, which is a description that sounds unremarkable now and had no equivalent in 1989." },
    { name: "cc:Mail", what: "Corporate email, acquired in 1991 and eventually displaced by the company's own Notes mail." },
    { name: "SmartSuite", what: "The office bundle - Word Pro, Freelance Graphics, Approach - which lost to Microsoft's for reasons that had more to do with distribution than with quality." },
  ],
  innovations: [
    {
      title: "The application lives inside its own database file",
      detail:
        "An NSF file holds the documents, the forms that display them, the views that index them and the code that processes them, all together. That is why a Notes application is portable and why leaving is so expensive: you are not migrating a database, you are migrating an application whose logic has no existence outside its own storage format. The body above notes that a business process is harder to move than a file format - this is the mechanism.",
    },
    {
      title: "Every document knows what it is everywhere",
      detail:
        "A note carries a local identifier and, separately, an originator identifier that names the same document across every replica and stamps its last modification. That pair is what makes bidirectional replication tractable: two copies edited independently can be recognised as the same document and compared, rather than silently overwriting each other.",
    },
    {
      title: "Replication built for networks that did not work",
      detail:
        "Both ends push and pull, only changes travel, and edits made offline queue locally until a connection appears. That was designed for dial-up and expensive leased lines - and it produced software that worked on a laptop on a train in 1993, which is roughly when the rest of the industry decided that was impossible.",
    },
    {
      title: "Schema-less documents, decades early",
      detail:
        "Fields could hold varied content and documents in the same store need not have the same shape. The document database was not invented in 2009; it was shipping in 1989, in a product most people remember for its email client.",
    },
  ],
  markets: [
    "Large organisations that built internal applications - approvals, case handling, registers, the workflows that never justified a bespoke system but ran the business anyway. Those applications are why the software outlived three owners: they were written by people who left, in a language nobody replaced, doing work nobody fully documented.",
    "It lost the office suite market to Microsoft and the mail market to Exchange, and kept the one thing neither competitor directly replaced: a place where a department could build a working application without asking anybody's permission.",
  ],
  analyst: [
    "There is no current analyst position to report for a company that stopped existing as one in 1995. What can be assessed is the software, and the assessment is unusual: still sold, still developed, still receiving architectural work three decades after the market declared it legacy.",
    "The reason, in one line: what was acquired was not a product but a place other people had put their work.",
  ],
};
