// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/registry.ts
// ----------------------------------------------------------------------------
// THE /dev/fun GAMES' ENGINES, for the check before every build
// (scripts/check-fun-games.mts). Each game keeps its rules in a pure module,
// src/lib/fun/games/<id>/engine.ts, and exports selfTest(): it regenerates a
// long run of daily puzzles (or levels) and proves each one well formed,
// deterministic and solvable (with a unique solution where the game promises
// one). A daily puzzle that cannot be solved fails the build, not a player.
// The games are toys outside the /tools framework (no catalogue, no golden
// vectors), but their puzzles are still checked.
// ============================================================================

// ---- The engines, one import per game (shelf order) ----
// Prefix of the Day: the daily subnetting puzzle.
import { selfTest as prefixOfTheDaySelfTest } from "./games/prefix-of-the-day/engine";
// Five Clues: the daily IT category puzzle.
import { selfTest as fiveCluesSelfTest } from "./games/five-clues/engine";
// Access Points: the daily floor-plan puzzle.
import { selfTest as accessPointsSelfTest } from "./games/access-points/engine";
// Bit Balance: the daily 6 x 6 bit puzzle.
import { selfTest as bitBalanceSelfTest } from "./games/bit-balance/engine";
// Patch Path: the daily cable puzzle.
import { selfTest as patchPathSelfTest } from "./games/patch-path/engine";
// Spanning Tree: the IEEE 802.1D puzzle.
import { selfTest as spanningTreeSelfTest } from "./games/spanning-tree/engine";
// Log Detective: a daily incident in a log.
import { selfTest as logDetectiveSelfTest } from "./games/log-detective/engine";
// Phish or Legit: links and senders, judged.
import { selfTest as phishOrLegitSelfTest } from "./games/phish-or-legit/engine";
// Whack-a-Bug's rules and self-test.
import { selfTest as whackABugSelfTest } from "./games/whack-a-bug/engine";
// Aggregate: the route-summarisation sliding game.
import { selfTest as aggregateSelfTest } from "./games/aggregate/engine";
// First Match: access-list ordering, judged by the site's ACL first-match evaluator.
import { selfTest as firstMatchSelfTest } from "./games/first-match/engine";
// Exit the Editor's programs and self-test.
import { selfTest as exitTheEditorSelfTest } from "./games/exit-the-editor/engine";
// Incident Commander's simulation and self-test.
import { selfTest as incidentCommanderSelfTest } from "./games/incident-commander/engine";

/** What a self-test reports. */
export interface SelfTestReport {
  /** How many puzzles, levels or cases were checked. */
  checked: number;
  /** One line per problem; empty when all is well. */
  failures: string[];
}

/** One registered engine. */
export interface FunEngine {
  /** The game's stable id, the same as its folder under src/lib/fun/games/. */
  id: string;
  /** Its self-test. */
  selfTest: () => SelfTestReport;
}

/** Every game's engine, in shelf order; each game adds its line when it lands. */
export const FUN_ENGINES: FunEngine[] = [
  // Prefix of the Day: 400 days and 2,000 practice puzzles, each against the CIDR tool's own engine.
  { id: "prefix-of-the-day", selfTest: prefixOfTheDaySelfTest },
  // Five Clues: every puzzle in both languages, and the daily order over 400 days.
  { id: "five-clues", selfTest: fiveCluesSelfTest },
  // Access Points: 400 days, each unique and rated.
  { id: "access-points", selfTest: accessPointsSelfTest },
  // Bit Balance: 400 days, each unique and rated.
  { id: "bit-balance", selfTest: bitBalanceSelfTest },
  // Patch Path: 400 days, each a unique cable.
  { id: "patch-path", selfTest: patchPathSelfTest },
  // Spanning Tree: ten hand cases, then 800 daily puzzles checked by two solvers.
  { id: "spanning-tree", selfTest: spanningTreeSelfTest },
  // Log Detective: 400 daily cases, parsed and answered from the log alone.
  { id: "log-detective", selfTest: logDetectiveSelfTest },
  // Phish or Legit: the punycode samples, every card, 400 daily rounds.
  { id: "phish-or-legit", selfTest: phishOrLegitSelfTest },
  // Whack-a-Bug: 400 daily rounds and 100 practice seeds, played by bots.
  { id: "whack-a-bug", selfTest: whackABugSelfTest },
  // Aggregate: slides against the CIDR tool's aggregate(), and 400 daily games played twice.
  { id: "aggregate", selfTest: aggregateSelfTest },
  // First Match: 20 levels and 400 dailies, every verdict from the ACL evaluator.
  { id: "first-match", selfTest: firstMatchSelfTest },
  // Exit the Editor: every documented exit, every listed wrong attempt, and random keys on each level.
  { id: "exit-the-editor", selfTest: exitTheEditorSelfTest },
  // Incident Commander: the scripted player, time away, and random actions that never break the numbers.
  { id: "incident-commander", selfTest: incidentCommanderSelfTest },
];
