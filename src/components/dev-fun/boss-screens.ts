// ============================================================================
// src/components/dev-fun/boss-screens.ts
// ----------------------------------------------------------------------------
// SHARED BOSS-SCREEN DATA (framework-neutral, NOT a client module).
//
// The screen id list, the id type, the per-screen metadata, and the shuffled-
// bag picker live here — deliberately WITHOUT "use client" — so that BOTH the
// client overlay (BossApp.tsx) AND server components (the /dev/fun boss-screens
// page, which resolves localized names/blurbs at build time) can import the
// real values. Importing these from a "use client" module into a server
// component fails at build (the client module's value exports become client
// references), which is exactly the prerender error this split fixes.
// ============================================================================

// The screen ids, in ALPHABETICAL order (arrow navigation walks this order).
export const BOSS_SCREENS = [
  "bsod",
  "c64",
  "commander",
  "dbase",
  "lotus",
  "norton",
  "turbopascal",
  "visicalc",
  "wordperfect",
  "wordstar",
] as const;

export type BossScreenKind = (typeof BOSS_SCREENS)[number];

// Human metadata for the /dev/fun viewer: a display name, era, and short blurb.
// (English base; the viewer localizes via the i18n label maps it is given —
// these are the fallback/reference strings.)
export interface BossScreenMeta {
  kind: BossScreenKind;
  name: string;
  year: string;
  blurb: string;
}

export const BOSS_SCREEN_META: BossScreenMeta[] = [
  { kind: "bsod", name: "Windows Blue Screen", year: "1990s", blurb: "The Blue Screen of Death: Windows' STOP error, arguably the most recognized screen in PC history." },
  { kind: "c64", name: "Commodore 64", year: "1982", blurb: "The best-selling home computer ever. Boots to a blue BASIC V2 prompt; here it types a little program by itself." },
  { kind: "commander", name: "Norton Commander", year: "1986", blurb: "The twin-panel DOS file manager that defined orthodox file management, in unmistakable blue." },
  { kind: "dbase", name: "dBASE III+", year: "1985", blurb: "The database that ran 1980s business, driven from its famous dot prompt." },
  { kind: "lotus", name: "Lotus 1-2-3", year: "1983", blurb: "The IBM PC's killer app and the archetypal boss-key screen: a spreadsheet that looks like real work." },
  { kind: "norton", name: "Norton Utilities", year: "1982", blurb: "Peter Norton's blue toolkit; the Disk Doctor rescued many a floppy." },
  { kind: "turbopascal", name: "Turbo Pascal", year: "1983", blurb: "Borland's beloved blue IDE that taught a generation to program, compiler and editor in one." },
  { kind: "visicalc", name: "VisiCalc", year: "1979", blurb: "The first spreadsheet, on the Apple II. The original boss screens imitated exactly this budget grid." },
  { kind: "wordperfect", name: "WordPerfect 5.1", year: "1989", blurb: "The near-blank blue writing screen that ruled DOS word processing, with just a status line in the corner." },
  { kind: "wordstar", name: "WordStar", year: "1978", blurb: "The word processor of the CP/M and early DOS era, remembered for its Ctrl-key command menus." },
];

// ---- shared shuffled-bag picker --------------------------------------------
// Every caller (the site-wide boss key AND the Mega Brain console dot) draws
// from this ONE bag so the distribution guarantee holds globally: draw without
// replacement until the bag empties, then refill + reshuffle (Fisher-Yates).
// No screen is starved and none repeats until all have shown. Module-level so
// it survives component re-renders and is shared across mounts.
let bossBag: BossScreenKind[] = [];
export function drawBossScreen(): BossScreenKind {
  if (bossBag.length === 0) {
    bossBag = [...BOSS_SCREENS];
    for (let i = bossBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bossBag[i], bossBag[j]] = [bossBag[j], bossBag[i]];
    }
  }
  return bossBag.pop() as BossScreenKind;
}
