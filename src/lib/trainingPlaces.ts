// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/trainingPlaces.ts
// ----------------------------------------------------------------------------
// WHERE AN ARTICLE SITS IN THE TRAINING SERIES (row 58, PRIME 2026-10-07 06:52:
// "nothing indicating in the target page that it is part of a series, and there
// is no navigation pertaining to the series"). The registry
// (src/content/study-guides/training-series.ts) lists each series' modules and
// their parts, written or planned. This module answers, for one article, which
// series it belongs to and where: its module, its number in the module, its
// number among the series' written parts, and the written parts just before and
// after it. Planned parts are skipped, never linked. The article page carries
// the series around the article with it (TrainingRail); the series page uses
// the same stops to open the series at its first written part.
// ============================================================================

import { TRAINING_SERIES, type TrainingSeries } from "@/content/study-guides/training-series";

/** One written part of a series: its address, its module (counted from 0) and its number in that module (from 1). */
export interface TrainingStop {
  slug: string;
  module: number;
  part: number;
}

/** Where one article sits in one training series. */
export interface TrainingPlace {
  /** The series. */
  series: TrainingSeries;
  /** The article's module (counted from 0) and its number among the module's parts, written and planned (from 1). */
  module: number;
  part: number;
  /** How many parts its module has (written and planned), and how many modules the series has. */
  moduleParts: number;
  modules: number;
  /** Its number among the series' written parts (from 1), and how many written parts the series has. */
  index: number;
  total: number;
  /** The written parts just before and just after it, in reading order; null at either end of the series. */
  prev: TrainingStop | null;
  next: TrainingStop | null;
}

/** Every written part of a series, in reading order, with its module and its number in the module. */
export function trainingStops(series: TrainingSeries): TrainingStop[] {
  // Module by module, part by part; a planned part keeps its number in the module but is not a stop.
  return series.modules.flatMap((m, mi) =>
    m.parts.flatMap((p, pi) => ("slug" in p ? [{ slug: p.slug, module: mi, part: pi + 1 }] : [])),
  );
}

/** The training series an article belongs to, and its place in each (in practice one). */
export function trainingPlaces(slug: string): TrainingPlace[] {
  // One entry per series that lists the article among its written parts, in the registry's order.
  const out: TrainingPlace[] = [];
  for (const series of TRAINING_SERIES) {
    // The series' stops, and the article's among them.
    const stops = trainingStops(series);
    const i = stops.findIndex((s) => s.slug === slug);
    if (i < 0) continue;
    const here = stops[i];
    out.push({
      series,
      module: here.module,
      part: here.part,
      moduleParts: series.modules[here.module].parts.length,
      modules: series.modules.length,
      index: i + 1,
      total: stops.length,
      prev: i > 0 ? stops[i - 1] : null,
      next: i < stops.length - 1 ? stops[i + 1] : null,
    });
  }
  return out;
}

/** The series that names this one among its prerequisites: the next level, if there is one. */
export function nextLevel(series: TrainingSeries): TrainingSeries | null {
  return TRAINING_SERIES.find((s) => s.prerequisites.includes(series.id)) ?? null;
}

/** A training series by its id, or null. */
export function getTrainingSeries(id: string): TrainingSeries | null {
  return TRAINING_SERIES.find((s) => s.id === id) ?? null;
}
