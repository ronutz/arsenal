// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/study-guides/training-series.ts
// ----------------------------------------------------------------------------
// THE TRAINING SERIES (milestone NF-1 of the student level-up, 2026-10-06;
// PRIME 18:24: "COMPLETE AND EFFECTIVE Study Guides"; the curriculum of
// PLAN-study-guides-fundamentals-curriculum-20261006: NetFun I to III, SecFun I
// to III, SRE-Fun, AppFun, DevFun).
//
// A training series is a level of a fundamentals curriculum: a sequence of
// MODULES, each a set of Learn articles in reading order with the outcome a
// student reaches at its end and the tools to practise on. A part is either an
// article that exists, or one that is planned and named, so a series shows its
// whole shape from the day it ships and says honestly which parts are still to
// come (the practice of the Learn series, src/content/learn/series.ts).
//
// WHY ITS OWN REGISTRY AND NOT NEW FIELDS ON ReadingPath (PLAN-nf1-netfun-i):
// every reading path takes part in the depth terciles, the subject families,
// the vendor groups and the vendor hubs of /study-guides; a 28-part series added
// there would move the terciles of the existing paths and appear three times on
// the page. Levels, prerequisites, modules and planned parts make it a different
// object, rendered in its own section, first, and guarded on its own.
//
// STRUCTURE ONLY: all copy lives in the "studyGuidesIndex" namespace under
// training.items.<id> (short name, title, lede, outcome, modules.<module>.title
// and .outcome, planned.<key>), authored in en and pt-BR. Guarded by
// scripts/check-training-series.mjs: every written part exists in both
// languages at its address; every planned part is named in both packs; no part
// twice in a series; every module has at least three parts; every tool is live,
// or the module says why it has none; levels contiguous from 1 within a
// curriculum; every prerequisite registered; every copy key in both packs.
// ============================================================================

/** One part of a module: an article that exists (by its address), or a planned one named in the packs. */
export type TrainingPart = { slug: string } | { planned: string };

/** One module: its parts in reading order, and the tools to practise on (or why there are none). */
export interface TrainingModule {
  /** Stable id within the series; copy at training.items.<series>.modules.<id>. */
  id: string;
  /** The parts, in reading order. */
  parts: TrainingPart[];
  /** Live tool ids (src/config/tools.ts), in first-use order. */
  tools: string[];
  /** When `tools` is empty: why no tool fits this module (the guard requires one or the other). */
  toolless?: string;
}

/** The curricula a series can belong to, in the order the curriculum plan lists them. */
export const TRAINING_CURRICULA = ["netfun", "secfun", "srefun", "appfun", "devfun"] as const;
/** One curriculum. */
export type TrainingCurriculum = (typeof TRAINING_CURRICULA)[number];

/** One training series: a level of a curriculum. */
export interface TrainingSeries {
  /** Stable id, used as the card's anchor (/study-guides#<id>) and as the i18n key. */
  id: string;
  /** The curriculum it belongs to, and its level inside it (contiguous from 1). */
  curriculum: TrainingCurriculum;
  level: 1 | 2 | 3;
  /** Category key for the accent dot (the key set of /category). */
  category: string;
  /** Series a student should have finished first (their ids); empty for a first level. */
  prerequisites: string[];
  /** The modules, in order. */
  modules: TrainingModule[];
}

/** The series, in the order /study-guides shows them. */
export const TRAINING_SERIES: TrainingSeries[] = [
  {
    // NetFun I, from bits to the LAN: layers 1 and 2. The curriculum plan's section 3, module by module; the six new
    // articles of NF-1b (2026-10-07) stand in the places where NF-1a named them (PLAN-nf1-netfun-i-20261006).
    id: "netfun-1",
    curriculum: "netfun",
    level: 1,
    category: "networking",
    prerequisites: [],
    modules: [
      {
        // The map and the units: the layer model, what a bit and a byte count, where the standards come from.
        id: "m1",
        parts: [
          { slug: "osi-model-in-practice" },
          { slug: "bits-bytes-and-the-two-kinds-of-kilo" },
          { slug: "how-networking-inherited-two-alphabets" },
          { slug: "ieee-802-working-groups" },
          { slug: "the-rfc-series" },
          { slug: "network-scopes-family-history" },
          { slug: "the-protocol-wars" },
        ],
        tools: ["bits-bytes"],
      },
      {
        // Layer 1, the physical path: the cable, the Ethernet physical layers, fibre, the transceiver, the last mile,
        // radio, and the cables under the sea.
        id: "m2",
        parts: [
          { slug: "structured-cabling" },
          { slug: "ethernet-physical-layers" },
          { slug: "fibre-basics" },
          { slug: "transceiver-family-history" },
          { slug: "last-mile-evolution-pots-to-fiber" },
          { slug: "gpon-how-one-fiber-serves-a-neighborhood" },
          { slug: "radio-spectrum" },
          { slug: "submarine-cables-and-the-physical-internet" },
        ],
        tools: ["cable-run-planner"],
      },
      {
        // Layer 2, frames and switching: the frame, the addresses in it, what the devices decide, then VLANs, spanning
        // tree, link aggregation and frame size.
        id: "m3",
        parts: [
          { slug: "the-ethernet-frame-field-by-field" },
          { slug: "what-is-an-oui" },
          { slug: "arp-and-mac-addresses" },
          { slug: "network-devices-switch-router-firewall" },
          { slug: "bridge-switch-family-history" },
          { slug: "vlans-and-8021q-trunking" },
          { slug: "spanning-tree-in-one-article" },
          { slug: "link-aggregation-and-lacp" },
          { slug: "jumbo-frames" },
        ],
        tools: ["oui-lookup", "mtu-mss"],
      },
      {
        // Wireless as layers 1 and 2: the history, the generations, the handshake and its attack, port-based access.
        id: "m4",
        parts: [
          { slug: "wireless-family-history" },
          { slug: "wireless-networking-from-802-11-to-wifi-7" },
          { slug: "krack-and-the-wifi-handshake" },
          { slug: "802-1x-and-eap-methods" },
        ],
        tools: [],
        toolless: "No live tool works at the wireless physical or link layer; the module is read, not practised, until one exists.",
      },
    ],
  },
];

/** Every written article of a series, in reading order. */
export function trainingArticles(s: TrainingSeries): string[] {
  return s.modules.flatMap((m) => m.parts.flatMap((p) => ("slug" in p ? [p.slug] : [])));
}
