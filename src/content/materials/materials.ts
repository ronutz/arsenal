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
    files: [
      {
        lang: "en",
        format: "pdf",
        path: "/materials/tcpip-concepts-and-ip-routing/TCPIP_Concepts_and_IP_Routing_2026_enUS.pdf",
        bytes: 1780890,
        sha256: "b9c7806b81194f631002338bc49b1fb6703ca677e2f121e74d7738218083d4ac",
        pages: 178,
      },
      {
        lang: "en",
        format: "pptx",
        path: "/materials/tcpip-concepts-and-ip-routing/TCPIP_Concepts_and_IP_Routing_2026_enUS.pptx",
        bytes: 813428,
        sha256: "70b1eae036f52375d3ab7fdb4bc69b0a0379151bf9b7e63a220a7d9367493b1a",
        pages: 178,
      },
      {
        lang: "pt-BR",
        format: "pdf",
        path: "/materials/tcpip-concepts-and-ip-routing/Curso_TCPIP_Conceitos_e_Roteamento_2026_ptBR.pdf",
        bytes: 1788004,
        sha256: "5f6765cd709796f7861e08058ea024d22a346d2447a8bf479b6b69b1e25808d1",
        pages: 178,
      },
      {
        lang: "pt-BR",
        format: "pptx",
        path: "/materials/tcpip-concepts-and-ip-routing/Curso_TCPIP_Conceitos_e_Roteamento_2026_ptBR.pptx",
        bytes: 776117,
        sha256: "f9edfa10316a100583fbe0606208c80d169af71a447f5ccd6bbf9364664a38a5",
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
  },
];

/** The public path of one slide image of a material, in one language (the files the guard checks for). */
export function slideImagePath(m: Material, lang: string, slide: number): string {
  // The material's directory is the one its files live in, so a material moved moves its images with it.
  const dir = m.files[0].path.slice(0, m.files[0].path.lastIndexOf("/"));
  return `${dir}/slides/${lang}-slide-${String(slide).padStart(3, "0")}.webp`;
}

/** Look one material up by slug. */
export function getMaterial(slug: string): Material | undefined {
  return MATERIALS.find((m) => m.slug === slug);
}
