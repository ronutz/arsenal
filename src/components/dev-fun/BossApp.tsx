// ============================================================================
// src/components/dev-fun/BossApp.tsx
// ----------------------------------------------------------------------------
// THE "BOSS KEY". Press it and the page vanishes behind a convincing vintage
// work application; a key or click brings the site straight back. Ten
// period-accurate mocks, each hand-built in CSS/JSX. Sourced from the boss-key
// and retro-computing record (Wikipedia "Boss key", How-To Geek's history, DOS
// Days, and each product's own documentation) so the layouts, status lines, and
// on-screen text read as authentic rather than approximate:
//
//   lotus       - Lotus 1-2-3 (DOS 2.x): THE archetypal boss screen. A1 control
//                 panel, READY mode, reverse-video frame, CALC/NUM. FY grid that
//                 foots.
//   wordstar    - WordStar (DOS): status line, the iconic Ctrl-key Main Menu,
//                 ruler, a memo.
//   visicalc    - VisiCalc (Apple II, 1979): the FIRST spreadsheet; the very
//                 first boss screens imitated exactly this budget grid.
//   norton      - Norton Utilities (Disk Doctor): blue NU panel, disk map, "No
//                 errors" diagnosis.
//   wordperfect - WordPerfect 5.1 (DOS): the legendary near-blank blue editor
//                 with just a "Doc 1 Pg 1 Ln .. Pos .." status bottom-right.
//   dbase       - dBASE III+ (DOS): the dot prompt, a query, a record count.
//   turbopascal - Turbo Pascal 7 (Borland blue IDE): menu bar, editor window
//                 with a small program, the F-key status line.
//   bsod        - Windows BSOD: the blue screen of death.
//   commander   - Norton Commander: twin blue panels + the function-key bar.
//   c64         - Commodore 64 boot: the blue BASIC V2 banner + an ANIMATED
//                 typed 10 PRINT / RUN sequence.
//
// NAVIGATION: while a screen is up, LEFT/RIGHT arrows move through the screens
// in ALPHABETICAL order starting from the current one (wrapping), so the user
// can browse without leaving the overlay. Esc, any other key, or a click
// dismisses. (Arrow keys navigate; they do NOT dismiss.)
//
// Client component: installs its own window keydown listener while mounted.
// BOSS_SCREENS + BOSS_SCREEN_META are exported for the shuffled-bag picker in
// KeyboardShortcuts and for the /dev/fun boss-screens viewer.
// ============================================================================

"use client";

import { useEffect } from "react";
import {
  BOSS_SCREENS,
  type BossScreenKind,
} from "@/components/dev-fun/boss-screens";

interface BossAppProps {
  kind: BossScreenKind;
  onDismiss: () => void;
  /** Navigate to another screen (left/right arrows) without dismissing. */
  onNavigate?: (kind: BossScreenKind) => void;
  /** Localized "press any key" hint (server-provided). */
  hint: string;
  /** Localized aria-label for the dismiss overlay (server-provided). */
  dismissLabel: string;
}

// ---- Lotus 1-2-3 -----------------------------------------------------------
const LOTUS_COLS = ["A", "B", "C", "D", "E"] as const;
const LOTUS_ROWS: Array<[number, string[]]> = [
  [1, ["FY2026 BUDGET"]],
  [2, [""]],
  [3, ["Region", "Q1", "Q2", "Q3", "Total"]],
  [4, ["North", "12,500", "13,200", "14,100", "39,800"]],
  [5, ["South", "9,800", "10,400", "11,200", "31,400"]],
  [6, ["East", "15,600", "16,100", "17,300", "49,000"]],
  [7, ["West", "11,200", "11,900", "12,600", "35,700"]],
  [8, ["", "======", "======", "======", "======"]],
  [9, ["Total", "49,100", "51,600", "55,200", "155,900"]],
  [10, [""]],
  [11, ["Growth", "4.2%", "5.1%", "7.0%", ""]],
];

function Lotus({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-lotus">
      <div className="lotus-panel">
        <span>A1: [W9] &apos;FY2026 BUDGET</span>
        <span className="lotus-mode">READY</span>
      </div>
      <div className="lotus-colhead">
        <span className="lotus-rownum lotus-corner"> </span>
        {LOTUS_COLS.map((c) => (
          <span key={c} className="lotus-col">
            {c}
          </span>
        ))}
      </div>
      {LOTUS_ROWS.map(([n, cells]) => (
        <div key={n} className="lotus-row">
          <span className="lotus-rownum">{String(n).padStart(2, " ")}</span>
          {LOTUS_COLS.map((c, i) => (
            <span key={c} className={`lotus-cell${i === 0 ? " lotus-cell-label" : ""}`}>
              {cells[i] ?? ""}
            </span>
          ))}
        </div>
      ))}
      <div className="lotus-fill" />
      <div className="lotus-status">
        <span>01-Aug-26</span>
        <span className="boss-hint">{hint}</span>
        <span>CALC NUM</span>
      </div>
    </div>
  );
}

// ---- WordStar --------------------------------------------------------------
const WS_MENU = `     <<<  M A I N   M E N U  >>>
 --Cursor--   --Delete--   --Menus--
 ^S ^D char   ^G char      ^J Help
 ^A ^F word   ^T word rt   ^K Block
 ^E ^X line   ^Y line      ^P Print
 ^R ^C scrn   ^L Find      ^O Screen`;

const WS_DOC = `                 STATUS REPORT

  TO:    Regional Management
  FROM:  Operations
  DATE:  August 1, 2026
  RE:    Q3 Progress

      Following our review of third-
  quarter performance, all regions are
  tracking above the revised budget
  targets. Figures are attached in the
  accompanying worksheet.

      No action is required at this time.`;

function WordStar({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-wordstar">
      <div className="ws-status">
        <span>B:REPORT.DOC</span>
        <span>PAGE 1 LINE 1 COL 01</span>
        <span>INSERT ON</span>
      </div>
      <pre className="ws-menu">{WS_MENU}</pre>
      <div className="ws-ruler">L---!---!---!---!---!---!---R</div>
      <pre className="ws-doc">
        {WS_DOC}
        <span className="ws-cursor">▮</span>
      </pre>
      <div className="ws-fill" />
      <div className="boss-hint ws-hint">{hint}</div>
    </div>
  );
}

// ---- VisiCalc (Apple II, 1979) ---------------------------------------------
const VC_COLS = ["A", "B", "C"] as const;
const VC_ROWS: Array<[number, string[]]> = [
  [1, ["HOUSEHOLD BUDGET", "", ""]],
  [2, ["", "", ""]],
  [3, ["Item", "Budget", "Actual"]],
  [4, ["Income", "5,200", "5,200"]],
  [5, ["Mortgage", "1,450", "1,450"]],
  [6, ["Utilities", "320", "298"]],
  [7, ["Food", "640", "672"]],
  [8, ["Auto", "410", "385"]],
  [9, ["Savings", "800", "800"]],
  [10, ["Remaining", "1,180", "1,595"]],
];

function VisiCalc({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-visicalc">
      <div className="vc-prompt">
        <span>C10 (V) /FR</span>
        <span className="vc-prompt-val">1595</span>
      </div>
      <div className="vc-colhead">
        <span className="vc-rownum vc-corner"> </span>
        {VC_COLS.map((c) => (
          <span key={c} className="vc-col">
            {c}
          </span>
        ))}
      </div>
      {VC_ROWS.map(([n, cells]) => (
        <div key={n} className="vc-row">
          <span className="vc-rownum">{String(n).padStart(2, " ")}</span>
          {VC_COLS.map((c, i) => (
            <span key={c} className={`vc-cell${i === 0 ? " vc-cell-label" : ""}`}>
              {cells[i] ?? ""}
            </span>
          ))}
        </div>
      ))}
      <div className="vc-fill" />
      <div className="boss-hint vc-hint">{hint}</div>
    </div>
  );
}

// ---- Norton Utilities (Disk Doctor) ----------------------------------------
function Norton({ hint }: { hint: string }) {
  const cells = Array.from({ length: 240 }, (_, i) => (i % 17 === 0 ? "sys" : "used"));
  return (
    <div className="boss-screen boss-norton">
      <div className="nu-titlebar">
        <span>Norton Disk Doctor</span>
        <span>Advanced Edition</span>
      </div>
      <div className="nu-body">
        <div className="nu-panel">
          <p className="nu-panel-title">Diagnosing Drive C:</p>
          <p className="nu-line">Analyzing Partition Table ......... OK</p>
          <p className="nu-line">Analyzing Boot Record ............. OK</p>
          <p className="nu-line">Analyzing File Allocation Table ... OK</p>
          <p className="nu-line">Analyzing Directory Structure ..... OK</p>
          <p className="nu-line nu-ok">No errors found on Drive C:</p>
        </div>
        <div className="nu-map" aria-hidden="true">
          {cells.map((c, i) => (
            <span key={i} className={c === "sys" ? "nu-map-sys" : "nu-map-used"}>
              {c === "sys" ? "▒" : "█"}
            </span>
          ))}
        </div>
      </div>
      <div className="nu-status">
        <span className="boss-hint">{hint}</span>
      </div>
    </div>
  );
}

// ---- WordPerfect 5.1 (DOS) -------------------------------------------------
const WP_DOC = `Dear Team,

     Please find attached the third-quarter
summary for your review. All figures have been
reconciled against the ledger and are ready for
the board meeting on Thursday.

     Kind regards,
     Operations`;

function WordPerfect({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-wordperfect">
      <pre className="wp-doc">
        {WP_DOC}
        <span className="wp-cursor">_</span>
      </pre>
      <div className="wp-fill" />
      <div className="wp-status">
        <span className="wp-hint boss-hint">{hint}</span>
        <span>Doc 1 Pg 1 Ln 2&quot; Pos 1&quot;</span>
      </div>
    </div>
  );
}

// ---- dBASE III+ (DOS) ------------------------------------------------------
const DBASE_LINES = [
  ". USE clients",
  ". LIST name, city, balance FOR balance > 0",
  "Record#  name              city            balance",
  "      1  Acme Corp         Chicago            2,480",
  "      2  Globex Ltd        Boston             1,150",
  "      3  Initech           Austin               920",
  "      4  Umbrella Inc      Seattle            3,300",
  ". COUNT",
  "        4 records",
  ".",
];

function DBase({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-dbase">
      <pre className="dbase-body">
        {DBASE_LINES.join("\n")}
        <span className="dbase-cursor">▬</span>
      </pre>
      <div className="dbase-fill" />
      <div className="dbase-status">
        <span>Command</span>
        <span>&lt;C:&gt; clients</span>
        <span>Rec: 4/4</span>
        <span className="boss-hint">{hint}</span>
      </div>
    </div>
  );
}

// ---- Turbo Pascal 7 (Borland blue IDE) -------------------------------------
const TP_CODE = `program Payroll;
uses Crt;
var hours, rate, gross: Real;
begin
  ClrScr;
  Write('Hours worked: ');
  ReadLn(hours);
  Write('Hourly rate:  ');
  ReadLn(rate);
  gross := hours * rate;
  WriteLn('Gross pay: ', gross:0:2);
  ReadLn;
end.`;

function TurboPascal({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-turbopascal">
      <div className="tp-menubar">
        <span className="tp-menu-hi">F</span>ile{"  "}
        <span className="tp-menu-hi">E</span>dit{"  "}
        <span className="tp-menu-hi">S</span>earch{"  "}
        <span className="tp-menu-hi">R</span>un{"  "}
        <span className="tp-menu-hi">C</span>ompile{"  "}
        <span className="tp-menu-hi">D</span>ebug{"  "}
        <span className="tp-menu-hi">O</span>ptions
      </div>
      <div className="tp-window">
        <div className="tp-window-title">PAYROLL.PAS</div>
        <pre className="tp-code">
          {TP_CODE}
          <span className="tp-cursor">▮</span>
        </pre>
      </div>
      <div className="tp-status">
        <span>F1 Help</span>
        <span>F2 Save</span>
        <span>F3 Open</span>
        <span>F9 Make</span>
        <span>F10 Menu</span>
        <span className="boss-hint">{hint}</span>
      </div>
    </div>
  );
}

// ---- Windows BSOD ----------------------------------------------------------
function Bsod({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-bsod">
      <div className="bsod-body">
        <p className="bsod-head">
          <span className="bsod-head-inv">Windows</span>
        </p>
        <p className="bsod-line">
          A problem has been detected and Windows has been shut down to prevent
          damage to your computer.
        </p>
        <p className="bsod-line">DRIVER_IRQL_NOT_LESS_OR_EQUAL</p>
        <p className="bsod-line">
          If this is the first time you&apos;ve seen this stop error screen,
          restart your computer. If this screen appears again, follow these
          steps:
        </p>
        <p className="bsod-line">
          Check to make sure any new hardware or software is properly installed.
        </p>
        <p className="bsod-line bsod-tech">
          *** STOP: 0x000000D1 (0x0000000C, 0x00000002, 0x00000000, 0xF86B5A89)
        </p>
        <p className="bsod-line">Beginning dump of physical memory</p>
        <p className="bsod-line">Physical memory dump complete.</p>
        <p className="bsod-line bsod-hint boss-hint">{hint}</p>
      </div>
    </div>
  );
}

// ---- Norton Commander (twin panels) ----------------------------------------
const NC_LEFT: string[][] = [
  ["..", "<UP-DIR>"],
  ["REPORTS", "<DIR>"],
  ["BUDGET  XLS", "24,192"],
  ["MEMO    DOC", "8,704"],
  ["Q3      WK1", "31,008"],
  ["CONFIG  SYS", "512"],
  ["AUTOEXEC BAT", "418"],
];
const NC_RIGHT: string[][] = [
  ["..", "<UP-DIR>"],
  ["ARCHIVE", "<DIR>"],
  ["LEDGER  DBF", "52,480"],
  ["CLIENTS DBF", "18,944"],
  ["INVOICE TXT", "6,229"],
  ["NOTES   TXT", "1,104"],
];

function ncPanel(rows: string[][], active: boolean, path: string) {
  return (
    <div className={`nc-panel${active ? " nc-panel-active" : ""}`}>
      <div className="nc-panel-path">{path}</div>
      <div className="nc-panel-head">
        <span>Name</span>
        <span>Size</span>
      </div>
      <div className="nc-panel-rows">
        {rows.map(([name, size], i) => (
          <div key={name} className={`nc-row${active && i === 2 ? " nc-row-sel" : ""}`}>
            <span className="nc-name">{name}</span>
            <span className="nc-size">{size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Commander({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-commander">
      <div className="nc-panels">
        {ncPanel(NC_LEFT, true, "C:\\WORK")}
        {ncPanel(NC_RIGHT, false, "C:\\DATA")}
      </div>
      <div className="nc-cmdline mono">
        <span>C:\WORK&gt;</span>
        <span className="nc-cursor">▮</span>
        <span className="boss-hint nc-hint">{hint}</span>
      </div>
      <div className="nc-fnbar">
        <span>1Help</span>
        <span>2Menu</span>
        <span>3View</span>
        <span>4Edit</span>
        <span>5Copy</span>
        <span>6RenMov</span>
        <span>7Mkdir</span>
        <span>8Delete</span>
        <span>9PullDn</span>
        <span>10Quit</span>
      </div>
    </div>
  );
}

// ---- Commodore 64 boot (animated typing) -----------------------------------
function C64({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-c64">
      <pre className="c64-banner">{`    **** COMMODORE 64 BASIC V2 ****

 64K RAM SYSTEM  38911 BASIC BYTES FREE

READY.`}</pre>
      <div className="c64-typed" aria-hidden="true">
        <div className="c64-line c64-line-1">10 PRINT &quot;RONUTZ.COM&quot;</div>
        <div className="c64-line c64-line-2">20 GOTO 10</div>
        <div className="c64-line c64-line-3">RUN</div>
        <div className="c64-line c64-line-4">RONUTZ.COM</div>
        <div className="c64-line c64-line-5">RONUTZ.COM</div>
        <div className="c64-line c64-line-6">RONUTZ.COM<span className="c64-cursor">█</span></div>
      </div>
      <div className="boss-hint c64-hint">{hint}</div>
    </div>
  );
}

// ---- screen dispatch -------------------------------------------------------
function renderScreen(kind: BossScreenKind, hint: string) {
  switch (kind) {
    case "lotus":
      return <Lotus hint={hint} />;
    case "wordstar":
      return <WordStar hint={hint} />;
    case "visicalc":
      return <VisiCalc hint={hint} />;
    case "norton":
      return <Norton hint={hint} />;
    case "wordperfect":
      return <WordPerfect hint={hint} />;
    case "dbase":
      return <DBase hint={hint} />;
    case "turbopascal":
      return <TurboPascal hint={hint} />;
    case "bsod":
      return <Bsod hint={hint} />;
    case "commander":
      return <Commander hint={hint} />;
    case "c64":
      return <C64 hint={hint} />;
  }
}

// A static, non-interactive preview of a single screen's content (no overlay,
// no key listeners), for the /dev/fun boss-screens viewer thumbnails. Same
// screen markup as the live overlay, so previews are faithful; the caller
// scales it down with CSS. hint is empty so the "press any key" line stays out.
export function BossScreenThumb({ kind }: { kind: BossScreenKind }) {
  return <div className="boss-thumb-inner">{renderScreen(kind, "")}</div>;
}

export default function BossApp({ kind, onDismiss, onNavigate, hint, dismissLabel }: BossAppProps) {
  // While a screen is up: LEFT/RIGHT arrows walk the alphabetical screen list
  // (wrapping) without dismissing; Esc or ANY other key dismisses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && onNavigate) {
        e.preventDefault();
        const idx = BOSS_SCREENS.indexOf(kind);
        const n = BOSS_SCREENS.length;
        const next =
          e.key === "ArrowRight"
            ? BOSS_SCREENS[(idx + 1) % n]
            : BOSS_SCREENS[(idx - 1 + n) % n];
        onNavigate(next);
        return;
      }
      onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, onDismiss, onNavigate]);

  return (
    <div
      className="boss-overlay"
      role="button"
      tabIndex={0}
      aria-label={dismissLabel}
      onClick={onDismiss}
    >
      {renderScreen(kind, hint)}
    </div>
  );
}
