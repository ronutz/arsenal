// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/materials/materials.ts
// ----------------------------------------------------------------------------
// THE OPEN MATERIALS REGISTRY: course material Rodolfo Nützmann shares on the
// site for anyone to use, starting on 2026-10-06 with the TCP/IP course (PRIME,
// 13:36: "I want to occasionally share content and material on the site,
// starting with a Networking Fundamentals training ... It is an ACTUAL
// INTRODUCTORY TRAINING complete with informative slide notes - it can be used
// not only by learners, but also by INSTRUCTORS to teach themselves. It should
// get a proper datasheeet-like page detailing the course contents and outline.")
//
// STRUCTURE ONLY, the house pattern of src/content/study-guides/reading-paths.ts:
// the copy (titles, outline topics, objectives, the then-and-now table, the
// licence wording) lives in the i18n "materials" namespace, authored en + pt-BR,
// English fallback elsewhere. What lives here are the facts a guard can check:
// the files on disk, their sizes and digests, the slide counts, the parts'
// slide ranges, the licence identifier and the Learn articles that teach the
// same ground.
//
// EVERY NUMBER HERE WAS MEASURED, not typed from memory: the slide and notes
// counts were read from the PPTX packages on 2026-10-06 (178 slides, a notes
// slide on all 178, in each language), the PDF page counts with pdfinfo (178,
// 960 x 540 pt, the slides alone, no notes), and the sizes and SHA-256 digests
// from the files as committed to public/materials/. A guard
// (scripts/check-materials.mjs) recomputes the sizes and digests at build time,
// so a replaced file cannot keep a stale fingerprint on its datasheet.
// ============================================================================

/** One downloadable file of a material. */
export interface MaterialFile {
  /** The language of the file's content. */
  lang: "en" | "pt-BR";
  /** pdf: the slides for reading and printing. pptx: the editable deck with the speaker notes. */
  format: "pdf" | "pptx";
  /** Public path, served from public/ (no locale prefix: the files are the same for every page locale). */
  path: string;
  /** Size in bytes, as committed; re-verified by scripts/check-materials.mjs. */
  bytes: number;
  /** SHA-256 of the file, lowercase hex; re-verified by scripts/check-materials.mjs. */
  sha256: string;
  /** Pages (PDF) or slides (PPTX). */
  pages: number;
}

/** One part of a course: the i18n key for its title and topics, and the slides it spans. */
export interface MaterialPart {
  /** i18n key under materials.items.<slug>.parts. */
  id: string;
  /** The module the part belongs to (1 or 2 for this course). */
  module: number;
  /** First and last slide of the part, inclusive, as numbered in the deck. */
  slides: [number, number];
}

/** The slide images a datasheet shows (PRIME 2026-10-06 16:02: "add a screenshot of the ... cover, and perhaps of a
 *  few of the more interesting images"): slides rendered from each language's PDF at 96 dpi (1280 x 720) and stored
 *  as WebP under public/<material dir>/slides/<lang>-slide-<NNN>.webp. The page shows its own language's images. */
export interface MaterialImages {
  /** The cover slide's number. */
  cover: number;
  /** The slides shown in the gallery, in deck order; their captions live at materials.items.<slug>.gallery.<n>. */
  gallery: number[];
  /** Pixel size of every image (they are rendered alike). */
  width: number;
  height: number;
}

/** The presenter's deck (milestone (m2), 2026-10-06; PRIME 19:21: "Can we allow presenting the slides on the site
 *  through the browser, without the need to download?"): every slide of each language's PDF rendered at 144 dpi
 *  (pdftoppm, 960 x 540 pt to 1920 x 1080 px) and stored as WebP at quality 80 under
 *  public/<material dir>/deck/<lang>/<NNN>.webp, beside that language's manifest, deck.json: every slide's number,
 *  its title (the slide's title placeholder) and its speaker notes, read from the PPTX package. The presenter page
 *  reads the titles at build time; the notes are fetched by the browser only when the reader opens them. */
export interface MaterialDeck {
  /** Pixel size of every deck image (they are rendered alike). */
  width: number;
  height: number;
}

/** One shared material. */
export interface Material {
  /** URL slug: /materials/<slug>. Copy at materials.items.<slug>. */
  slug: string;
  /** What kind of material it is; only "course" exists today. */
  kind: "course";
  /** The edition year printed on the material. */
  edition: number;
  /** The year the material was first taught or published, for the lineage line. */
  originYear: number;
  /** Slides per language edition (both editions carry the same slides). */
  slides: number;
  /** Slides that carry speaker notes, per language edition. */
  notesSlides: number;
  /** SPDX identifier of the licence the material is offered under. */
  license: "CC0-1.0";
  /** The licence's canonical deed, linked from the datasheet. */
  licenseUrl: string;
  /** The files, in the order the datasheet lists them. */
  files: MaterialFile[];
  /** The parts, in deck order. */
  parts: MaterialPart[];
  /** Learn articles that teach the same ground (validated against both locales by the guard). */
  relatedArticles: string[];
  /** The cover and the gallery slides shown on the datasheet. */
  images: MaterialImages;
  /** The presenter's deck: every slide, per language (milestone (m2)). */
  deck: MaterialDeck;
}

/** The materials, newest first. */
export const MATERIALS: Material[] = [
  {
    slug: "tcpip-concepts-and-ip-routing",
    kind: "course",
    edition: 2026,
    originYear: 1999,
    slides: 178,
    notesSlides: 178,
    // CC0 1.0 rather than CC BY 4.0 (the site's content licence): PRIME's terms
    // are "use it, modify it, at will. attribution would be nice but is not
    // mandatory", and CC BY's deed says "You must give appropriate credit" (read
    // 2026-10-06), which makes credit mandatory. CC0's deed: "You can copy,
    // modify, distribute and perform the work, even for commercial purposes, all
    // without asking permission." Credit is requested as a courtesy on the page.
    license: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    // The English files changed once after publication (2026-10-07, row 52 of PRIME's requests): the cover's
    // subtitle names the 1999 event in English, Technology Week, on slide 1 of the PPTX and page 1 of the PDF; nothing
    // else in either file, hence the new sizes and fingerprints. The Portuguese files keep Semana de Tecnologia.
    // Both PPTX files changed again on 2026-10-19 (PRIME 15:47: "Fix the TCP/IP course deck so it references the
    // correct DHCPv6 RFC"): RFC 8415 became RFC 9915 (STD 102, January 2026, obsoletes RFC 8415; rfc-editor.org/info
    // pages read 2026-10-19) in three XML parts of each package, slide 153's body and notes and slide 177's
    // references table; the other 733 parts were copied byte for byte, hence the new PPTX sizes and fingerprints.
    // The PDFs were then patched in place the same day (2026-10-19), not re-exported (LibreOffice substitutes Carlito
    // for Calibri and moves line breaks): on PDF pages 153 and 177 the two glyph codes "84" of "8415" became "99" in
    // the one TJ operator that draws it (font BCDFEE+Calibri, WinAnsi, embedded subset that holds "nine"; "8", "4"
    // and "9" all 507/1000 wide, so nothing moves). Only those two content streams were recompressed, each written
    // back inside its old byte span (space-padded after endobj), so every other byte, the xref and the file sizes
    // are PowerPoint's; renders of the other 176 pages are pixel-identical, hence new fingerprints at the same sizes.
    // deck/<lang>/153.webp and 177.webp were re-rendered from the patched PDFs by the pipeline that made every deck
    // image (pdftoppm to 1920 x 1080 PNG, Pillow WebP quality 80 method 6), which re-creates the old images byte for
    // byte from the old PDFs.
    // Both PPTX files changed again on 2026-10-25 (Round 1 package ARC-03): VRRP now cites RFC 9568 (April 2024,
    // obsoletes RFC 5798; rfc-editor.org text and info pages read 2026-10-20) and uses its term Active Router, with
    // RFC 5798 kept as the predecessor and Master explained as the RFC 5798 and vendor-interface name. Six XML parts
    // of each package changed (slides 3, 173 and 177 and their notes); the other 730 parts were copied as their
    // original compressed bytes, hence the new PPTX sizes and fingerprints below. The PDFs and the deck images of
    // slides 3, 173 and 177 were NOT changed in this step and still show RFC 5798 and Master: the new text does not
    // fit an in-place glyph patch and a LibreOffice export substitutes the fonts, so the PDFs await a PowerPoint
    // re-export (see the ARC-03 notes); their sizes and fingerprints below are still those of the files on disk.
    // A second pass the same day (PRIME 2026-10-25, "Change both"): slides 174 and 175 also say Active Router (R1's
    // diagram label, the two boxes and the notes of 174, recap question 7 in the notes of 175; R2's label became
    // Backup Router to match), and the Portuguese deck says "default gateway" wherever it said "gateway padrão"
    // (slides 63, 74, 85, 87, 153 and 173 with the 173 title, the notes of 63, 74, 85, 87, 95 and 173, and the title
    // list in docProps/app.xml). English: 3 parts changed, 733 copied as their compressed bytes; Portuguese: 16
    // changed, 720 copied. The PDFs and the deck and gallery images of the changed slides still await the re-export.
    // A third pass the same day (PRIME 2026-10-25): the Portuguese deck had no slide numbers at all, so slides 2 to
    // 177 received the English deck's slide-number placeholder, byte for byte (same shape id, position, size, 9 pt
    // grey, right-aligned field), as the last shape of each slide; slides 1 and 178 stay unnumbered as in English.
    // 176 slide parts changed, the other 560 entries were copied as their compressed bytes; the presenter manifest
    // is unaffected (it carries titles and notes only). Every Portuguese PDF page from 2 to 177 changes with it.
    // The PDFs, 2026-10-25 20:32: PRIME exported both from the staged PPTX in PowerPoint for Microsoft 365. ANVIL accepted
    // them with scripts/accept-pdfs.py (ARC-03 work folder): 178 pages at 960 x 540 pt, fonts embedded, tagged; the new
    // wording present and the old gone; every page rendered and compared with the previous PDF. The changed slides
    // differ as expected and every Portuguese page from 2 to 177 differs only by its slide number, except four pages
    // (English 1 and 2, Portuguese 5 and 160) whose glyphs sit up to one pixel apart with identical extracted text, a
    // layout micro-shift accepted by name. The English catalog's /Lang (pt) was set to (en) in place again; the
    // presenter and gallery images of every page whose pixels changed were remade by the byte-exact pipelines.
    files: [
      {
        lang: "en",
        format: "pdf",
        path: "/materials/tcpip-concepts-and-ip-routing/TCPIP_Concepts_and_IP_Routing_2026_enUS.pdf",
        bytes: 1779121,
    // 2026-10-19: the English PDF's catalog said /Lang (pt); set to (en) in place (same length, xref unchanged), new sha256.
        sha256: "adc493996183857495dd6f65438880a19f87122f4b4c18e6644f1bc9815f7f8f",
        pages: 178,
      },
      {
        lang: "en",
        format: "pptx",
        path: "/materials/tcpip-concepts-and-ip-routing/TCPIP_Concepts_and_IP_Routing_2026_enUS.pptx",
        bytes: 795900,
        sha256: "63c601c9af5a16a74a5b93adba538111b23ce28040841a1b4ff385650a2ed92d",
        pages: 178,
      },
      {
        lang: "pt-BR",
        format: "pdf",
        path: "/materials/tcpip-concepts-and-ip-routing/Curso_TCPIP_Conceitos_e_Roteamento_2026_ptBR.pdf",
        bytes: 1799300,
        sha256: "0ec8293c6db52562485e8946f0fdd53d85d1057a16f51067854305d3f103e0f1",
        pages: 178,
      },
      {
        lang: "pt-BR",
        format: "pptx",
        path: "/materials/tcpip-concepts-and-ip-routing/Curso_TCPIP_Conceitos_e_Roteamento_2026_ptBR.pptx",
        bytes: 812447,
        sha256: "7c8187d932654d1299694daa571f2cd6b60d30a88deb7acc203acc7a1cc42278",
        pages: 178,
      },
    ],
    // The ten parts as the deck's section dividers mark them (slides 4, 42, 67,
    // 94, 105, 135, 141, 146, 158 and 168, read from both PPTX packages), with
    // the course frame around them: slides 1 to 3 (title, agenda, 1999 to 2026)
    // and 176 to 178 (the references by topic and the close).
    parts: [
      { id: "p1", module: 1, slides: [4, 41] },
      { id: "p2", module: 2, slides: [42, 66] },
      { id: "p3", module: 2, slides: [67, 93] },
      { id: "p4", module: 2, slides: [94, 104] },
      { id: "p5", module: 2, slides: [105, 134] },
      { id: "p6", module: 2, slides: [135, 140] },
      { id: "p7", module: 2, slides: [141, 145] },
      { id: "p8", module: 2, slides: [146, 157] },
      { id: "p9", module: 2, slides: [158, 167] },
      { id: "p10", module: 2, slides: [168, 175] },
    ],
    relatedArticles: [
      "osi-model-in-practice",
      "network-devices-switch-router-firewall",
      "bridge-switch-family-history",
      "arp-and-mac-addresses",
      "ipv4-addressing",
      "subnetting-basics",
      "cidr-notation",
      "vlsm",
      "routing-tables-and-default-gateway",
      "dijkstra-and-the-twenty-minute-algorithm",
      "ospf-primer",
      "isis-primer",
      "bgp-primer",
      "dhcp-lease-lifecycle",
      "ipv6-addressing",
      "ipv6-neighbor-discovery",
      "ipv6-transition",
      "multicast-what-it-costs-to-not-flood",
      "mpls-primer",
      "first-hop-redundancy-vrrp-and-hsrp",
    ],
    // The cover and six diagrams across the course, chosen on 2026-10-06 from contact sheets of all 178 slides:
    // distance vector's count to infinity (26), an ARP request in broadcast (79), the routed example's first hop with
    // the frame and packet headers (97), OSPF's backbone and areas (121), PIM-SM's shared tree and switchover (166),
    // and a VRRP failover (174). The same slide numbers in both languages: the two decks share their layouts.
    images: { cover: 1, gallery: [26, 79, 97, 121, 166, 174], width: 1280, height: 720 },
    // All 178 slides of each language at 1920 x 1080 for the presenter (2026-10-06, (m2)): sharp on a 1080p projector,
    // about 62 KB a slide on average (10.8 MB for the English deck, 11.4 MB for the Portuguese).
    deck: { width: 1920, height: 1080 },
  },
];

/** The public path of one slide image of a material, in one language (the files the guard checks for). */
export function slideImagePath(m: Material, lang: string, slide: number): string {
  // The material's directory is the one its files live in, so a material moved moves its images with it.
  const dir = m.files[0].path.slice(0, m.files[0].path.lastIndexOf("/"));
  return `${dir}/slides/${lang}-slide-${String(slide).padStart(3, "0")}.webp`;
}

/** The material's directory: the one its files live in, so a material moved moves everything with it. */
function materialDir(m: Material): string {
  return m.files[0].path.slice(0, m.files[0].path.lastIndexOf("/"));
}

/** The presenter's image folder for one language, ending in a slash: a slide is `${base}${NNN}.webp`. */
export function deckImageBase(m: Material, lang: string): string {
  return `${materialDir(m)}/deck/${lang}/`;
}

/** The presenter's manifest for one language (every slide's title and notes). */
export function deckManifestPath(m: Material, lang: string): string {
  return `${materialDir(m)}/deck/${lang}/deck.json`;
}

/** Look one material up by slug. */
export function getMaterial(slug: string): Material | undefined {
  return MATERIALS.find((m) => m.slug === slug);
}
