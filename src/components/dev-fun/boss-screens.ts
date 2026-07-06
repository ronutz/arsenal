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
  "amiga",
  "apple1",
  "appleii",
  "appleii1977",
  "appleiic",
  "appleiigs",
  "appleiiplus",
  "at286",
  "atari800xl",
  "bbcmicro",
  "bsod",
  "c64",
  "coco",
  "commander",
  "cp300",
  "cp400",
  "cp500",
  "cpc464",
  "dbase",
  "expert",
  "hotbit",
  "ibmpc",
  "lotus",
  "macintosh",
  "msx1",
  "msxturbor",
  "norton",
  "pc386",
  "ti99",
  "tk82c",
  "tk90x",
  "tk95",
  "trs80",
  "turbopascal",
  "unitron",
  "vic20",
  "visicalc",
  "wordperfect",
  "wordstar",
  "zx81",
  "zxspectrum",
  "zxspectrum128",
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
  { kind: "amiga", name: "Commodore Amiga", year: "1985", blurb: "Kickstart's insert-disk screen: the animated hand offering a Workbench floppy, the friendliest boot in computing." },
  { kind: "apple1", name: "Apple I", year: "1976", blurb: "Wozniak's first: no OS, just the 256-byte WozMon. Press Reset and it prints a backslash and a blinking cursor, ready for hex." },
  { kind: "appleii", name: "Apple //e (enhanced)", year: "1985", blurb: "The enhanced //e that ran a generation of US schools. Its ROM shows Apple //e, then the Applesoft ] prompt." },
  { kind: "appleii1977", name: "Apple II", year: "1977", blurb: "The original. No autostart: it comes up in Wozniak's monitor at a * prompt; Ctrl-B enters Integer BASIC and its > prompt." },
  { kind: "appleiic", name: "Apple //c", year: "1984", blurb: "Apple's compact, portable II. With no disk it beeps, shows Apple //c, then Check Disk Drive; Ctrl-Reset drops to BASIC." },
  { kind: "appleiigs", name: "Apple IIgs", year: "1986", blurb: "The 16-bit II: colour, sound, and the friendly Check Startup Device screen where the Apple logo slides side to side." },
  { kind: "appleiiplus", name: "Apple ][+", year: "1979", blurb: "The Apple II Plus with Applesoft in ROM: the plain Apple ][ banner and the ] prompt where countless first programs ran." },
  { kind: "at286", name: "IBM PC/AT (286)", year: "1984", blurb: "The AT and its POST: a memory count marching upward before the operating system loads." },
  { kind: "atari800xl", name: "Atari 800XL", year: "1983", blurb: "Atari's 8-bit workhorse: a deep blue screen, Atari BASIC's READY, and colours that slowly cycle to spare your TV." },
  { kind: "bbcmicro", name: "BBC Micro", year: "1981", blurb: "Acorn's machine that taught Britain to code, from its terse grey banner and BASIC prompt." },
  { kind: "bsod", name: "Windows Blue Screen", year: "1990s", blurb: "The Blue Screen of Death: Windows' STOP error, arguably the most recognized screen in PC history." },
  { kind: "c64", name: "Commodore 64", year: "1982", blurb: "The best-selling home computer ever. Boots to a blue BASIC V2 prompt; here it types a little program by itself." },
  { kind: "coco", name: "TRS-80 Color Computer", year: "1980", blurb: "The CoCo: Microsoft Color BASIC in black-on-green, the OK prompt waiting on a TV set." },
  { kind: "commander", name: "Norton Commander", year: "1986", blurb: "The twin-panel DOS file manager that defined orthodox file management, in unmistakable blue." },
  { kind: "cp300", name: "Prologica CP-300", year: "1983", blurb: "Brazil's compact TRS-80 Model III clone. No disks, straight to cassette BASIC: Cass?, Memory Size?, then READY." },
  { kind: "cp400", name: "Prologica CP-400", year: "1984", blurb: "Brazil's TRS-80 Color clone (a CoCo 2 inside): Extended Color BASIC in black-on-green, the OK prompt waiting." },
  { kind: "cp500", name: "Prologica CP-500", year: "1982", blurb: "Brazil's TRS-80 Model III clone, in green phosphor. A reserva-de-mercado icon that ran BASIC and DOS 500." },
  { kind: "cpc464", name: "Amstrad CPC 464", year: "1984", blurb: "Unmistakable bright yellow on blue: Locomotive BASIC greeting you with Ready on a built-in cassette machine." },
  { kind: "dbase", name: "dBASE III+", year: "1985", blurb: "The database that ran 1980s business, driven from its famous dot prompt." },
  { kind: "expert", name: "Gradiente Expert", year: "1985", blurb: "Gradiente's Brazilian MSX. Standard MSX BASIC, a detached keyboard, and a soap-opera-famous look." },
  { kind: "hotbit", name: "Epcom Hotbit HB-8000", year: "1985", blurb: "Sharp/Epcom's Brazilian MSX. The other national MSX, booting MSX BASIC with Portuguese accents." },
  { kind: "ibmpc", name: "IBM PC / XT", year: "1981", blurb: "The machine that set the standard. Cassette BASIC in ROM: the IBM Personal Computer BASIC banner." },
  { kind: "lotus", name: "Lotus 1-2-3", year: "1983", blurb: "The IBM PC's killer app and the archetypal boss-key screen: a spreadsheet that looks like real work." },
  { kind: "macintosh", name: "Macintosh 128K", year: "1984", blurb: "Susan Kare's friendly boot: a blinking floppy with a question mark, then the smiling Happy Mac and Welcome to Macintosh." },
  { kind: "msx1", name: "MSX", year: "1983", blurb: "The Microsoft/ASCII home standard: the logo scrolls up, then MSX BASIC and its Ok prompt." },
  { kind: "msxturbor", name: "MSX turbo R", year: "1990", blurb: "The last, fastest MSX (Japan only). The logo assembles from the sides, then MSX BASIC 4.0 on its R800 CPU." },
  { kind: "norton", name: "Norton Utilities", year: "1982", blurb: "Peter Norton's blue toolkit; the Disk Doctor rescued many a floppy." },
  { kind: "pc386", name: "386DX-40 (AMI BIOS)", year: "1992", blurb: "A tricked-out 386 clone: the AMIBIOS POST counting memory, cache and turbo lit, Hit DEL for SETUP." },
  { kind: "ti99", name: "TI-99/4A", year: "1981", blurb: "Texas Instruments' 16-bit home computer: the cyan title screen, TEXAS INSTRUMENTS HOME COMPUTER, press any key to begin." },
  { kind: "tk82c", name: "Microdigital TK-82C", year: "1982", blurb: "Microdigital's ZX81 clone, where many Brazilians (this one's author included) first learned to program: a blank screen and one inverse K." },
  { kind: "tk90x", name: "Microdigital TK90X", year: "1985", blurb: "Brazil's ZX Spectrum clone with a tweaked ROM (© became Δ), where many Brazilians first typed real programs in colour." },
  { kind: "tk95", name: "Microdigital TK95", year: "1986", blurb: "The TK90X's successor: same Spectrum ROM family, a Plus/4-style case and a better keyboard. The last Brazilian Spectrum clone." },
  { kind: "trs80", name: "TRS-80 Model III", year: "1980", blurb: "Radio Shack's all-in-one. Cass? then Memory Size?, then Level II BASIC and its READY prompt." },
  { kind: "turbopascal", name: "Turbo Pascal", year: "1983", blurb: "Borland's beloved blue IDE that taught a generation to program, compiler and editor in one." },
  { kind: "unitron", name: "Unitron AP II", year: "1982", blurb: "Brazil's faithful Apple II Plus clone with a Portuguese ROM: the Apple ][ banner and ] prompt, made under market reserve." },
  { kind: "vic20", name: "Commodore VIC-20", year: "1980", blurb: "The friendly computer and the C64's older sibling: CBM BASIC V2 with 3583 bytes free." },
  { kind: "visicalc", name: "VisiCalc", year: "1979", blurb: "The first spreadsheet, on the Apple II. The original boss screens imitated exactly this budget grid." },
  { kind: "wordperfect", name: "WordPerfect 5.1", year: "1989", blurb: "The near-blank blue writing screen that ruled DOS word processing, with just a status line in the corner." },
  { kind: "wordstar", name: "WordStar", year: "1978", blurb: "The word processor of the CP/M and early DOS era, remembered for its Ctrl-key command menus." },
  { kind: "zx81", name: "Sinclair ZX81", year: "1981", blurb: "Minimalism itself: a blank screen and a single inverse K cursor waiting in the corner." },
  { kind: "zxspectrum", name: "ZX Spectrum 48K", year: "1982", blurb: "The machine that built the UK bedroom-coder scene. A blank white screen and one line: © 1982 Sinclair Research Ltd." },
  { kind: "zxspectrum128", name: "ZX Spectrum 128", year: "1986", blurb: "The 128K's blue menu: 128 BASIC, Tape Loader, Calculator, 48 BASIC, and that AY-driven ident." },
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
