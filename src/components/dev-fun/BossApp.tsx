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

import { useEffect, useState } from "react";
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

// ============================================================================
// MICRO BOOT SCREENS (added batch) — each hand-built to the verified power-on
// text of the real machine. Animation is used only where the real machine (or
// its most iconic moment) actually moved: the ZX81's blinking K, the MSX logo
// scrolling up, a PC/AT + 386 POST counting memory upward, the Amiga Kickstart
// disk waggling in the hand, and the various BASIC-prompt cursors blinking.
// Static machines (Spectrum copyright line, CoCo/Apple prompts at rest) don't
// invent motion. Sources: each machine's ROM/boot record (Wikipedia, MSX.org,
// Sinclair/□TK, CoCopedia, Prologica/CP-500 and Expert/Hotbit museum pages).
// ============================================================================

// ---- Sinclair ZX81 ---------------------------------------------------------
// Power-on: a blank white/grey raster with a single inverse-video "K" cursor
// in the very bottom-left. Then the machine shows life: it types LOAD "" (the
// universal ZX81 first command) a character at a time, the cursor flipping from
// K (keyword mode) to L (letter mode) as real keys land — exactly as the ROM did.
function ZX81() {
  return (
    <div className="boss-screen boss-zx81">
      <div className="zx81-field">
        <span className="zx81-line" aria-hidden="true">
          <span className="zx81-typed">LOAD </span>
          <span className="zx81-quotes">&quot;&quot;</span>
        </span>
        <span className="zx81-k">K</span>
      </div>
    </div>
  );
}

// ---- ZX Spectrum 48K -------------------------------------------------------
// Black on white, otherwise blank, with the copyright line at the bottom and
// the four-colour border ident in the corner.
function ZXSpectrum() {
  return (
    <div className="boss-screen boss-spectrum">
      <div className="spectrum-field" />
      <div className="spectrum-copy">© 1982 Sinclair Research Ltd</div>
      <div className="spectrum-stripes" aria-hidden="true">
        <span style={{ background: "#d7d700" }} />
        <span style={{ background: "#00d7d7" }} />
        <span style={{ background: "#00d700" }} />
        <span style={{ background: "#d700d7" }} />
      </div>
    </div>
  );
}

// ---- ZX Spectrum 128 -------------------------------------------------------
// The 128's start MENU. Real hardware shows no copyright line here (that only
// appears on the Amstrad +2/+2A/+3); just the menu, with Tape Loader selected.
// Order per the machine's own menu: Tape Loader, 128 BASIC, Calculator, 48 BASIC.
const S128_MENU = ["Tape Loader", "128 BASIC", "Calculator", "48 BASIC"] as const;
function ZXSpectrum128() {
  return (
    <div className="boss-screen boss-s128">
      <div className="s128-inner">
        <div className="s128-menu">
          {S128_MENU.map((m, i) => (
            <div key={m} className={`s128-item${i === 0 ? " s128-item-sel" : ""}`}>
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Novell NetWare 3.12: MONITOR.NLM -------------------------------------
// The LAN era's server heartbeat. MONITOR is loaded at the console's colon
// prompt; its General Information screen refreshes utilization about once a
// second (Novell docs), and Novell tuning guidance says Total Cache Buffers
// below 40% of Original means the server needs RAM (TID 10012765) -- this
// server sits at a healthy 75%. Release: September 1993 (OS/2 Museum timeline).
function NetWare({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-netware">
      <div className="nw-titlebar">
        <span>NetWare v3.12 Console Monitor</span>
        <span>NetWare Loadable Module</span>
      </div>
      <div className="nw-body">
        <div className="nw-panel">
          <p className="nw-panel-title">Information For Server RONUTZ</p>
          <div className="nw-grid">
            <span>File Server Up Time:</span>
            <span>142 Days 6 Hours 51 Minutes 12 Seconds</span>
            <span>Utilization:</span>
            <span className="nw-util" aria-hidden="true" />
            <span>Original Cache Buffers:</span>
            <span>2,096</span>
            <span>Total Cache Buffers:</span>
            <span>1,585</span>
            <span>Dirty Cache Buffers:</span>
            <span>0</span>
            <span>Current Disk Requests:</span>
            <span>0</span>
            <span>Packet Receive Buffers:</span>
            <span>100</span>
            <span>Directory Cache Buffers:</span>
            <span>78</span>
            <span>Service Processes:</span>
            <span>3</span>
            <span>Connections In Use:</span>
            <span>18</span>
            <span>Open Files:</span>
            <span>29</span>
          </div>
        </div>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- PCBoard BBS: dialing Salt Air -----------------------------------------
// Clark Development's PCBoard (1983), the high-end commercial DOS BBS of the
// modem era. An AT-command modem dials CDC's own support board, Salt Air
// (801-261-8976, straight from the PPL manual), the carrier locks at 2400 bps,
// and the v15.22 node banner answers. Line pacing mimics a real call.
// The login identity on PCBoard was the user's HANDLE -- whatever alias the
// caller chose under each board's policy served as the logon name (the PCBoard
// manual itself refers to "the logon name that you use for your Salt Air
// account"). PRIME ran a real PCBoard (INTELECTA) and confirms the handle was
// the login name; the handle shown here, kr34t0r, is PRIME's own.
function PCBoard({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-pcboard">
      <div className="bbs-field">
        <p className="bbs-echo">
          <span className="bbs-type">ATDT 8012618976</span>
        </p>
        <p className="bbs-line bbs-d2">CONNECT 2400</p>
        <p className="bbs-line bbs-d3">&nbsp;</p>
        <p className="bbs-line bbs-d4 bbs-banner">PCBoard (R) v15.22 - Node 1</p>
        <p className="bbs-line bbs-d5 bbs-welcome">Welcome to Salt Air BBS</p>
        <p className="bbs-line bbs-d6">&nbsp;</p>
        <p className="bbs-line bbs-d7">
          Enter your handle: kr34t0r<span className="bbs-cursor">▌</span>
        </p>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- TELESP Videotexto: the index painting at 1200 bps ---------------------
// Brazil's videotex. TELESP ran the country's first service in Sao Paulo
// (experimental 1982, official Dec 1982), adapting France's ANTIOPE standard
// with home micros as terminals over V.23 modems (1200 bps down / 75 up).
// Pages were 40x24 cells, eight colours, mosaic semigraphics -- and a full
// screen painted top to bottom at 1200 bps, the reveal recreated here. Menu
// entries are documented period services; accents are stripped the way the
// era's alphanumeric character set stripped them.
function Videotexto({ hint }: { hint: string }) {
  const colours = ["#fc5454", "#54fc54", "#fcfc54", "#5454fc", "#fc54fc", "#54fcfc", "#ffffff", "#fc5454"];
  return (
    <div className="boss-screen boss-vdt">
      <div className="vdt-mosaic vdt-paint vdt-p1" aria-hidden="true">
        {colours.map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
      <p className="vdt-title vdt-paint vdt-p2">VIDEOTEXTO</p>
      <p className="vdt-sub vdt-paint vdt-p3">TELESP - TELECOMUNICACOES DE SAO PAULO</p>
      <p className="vdt-item vdt-paint vdt-p4"><span className="vdt-num">1</span>NOTICIAS</p>
      <p className="vdt-item vdt-paint vdt-p5"><span className="vdt-num">2</span>COTACOES DA BOLSA</p>
      <p className="vdt-item vdt-paint vdt-p6"><span className="vdt-num">3</span>CORREIO ELETRONICO</p>
      <p className="vdt-item vdt-paint vdt-p7"><span className="vdt-num">4</span>LISTA TELEFONICA</p>
      <p className="vdt-item vdt-paint vdt-p8"><span className="vdt-num">5</span>HOROSCOPO</p>
      <p className="vdt-prompt vdt-paint vdt-p9">
        DIGITE O NUMERO DESEJADO <span className="vdt-cursor">█</span>
      </p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- RemoteAccess BBS: the sysop's Waiting-For-Caller console --------------
// Andrew Milner's RemoteAccess (Wantree Development, Australia; shareware from
// January 1990) ran multiple nodes under DESQview and OS/2 when almost nothing
// else could, and its sysop interface was styled after the FrontDoor mailer
// with its author's permission. This is the other side of a BBS: node 1 idle,
// the sysop's stats on screen, waiting for the phone to ring.
function RemoteAccess({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-ra">
      <div className="ra-titlebar">
        <span>RemoteAccess v2.50</span>
        <span>ARSENAL BBS - Node 1</span>
      </div>
      <div className="ra-body">
        <div className="ra-panel">
          <p className="ra-panel-title">Today</p>
          <div className="ra-grid">
            <span>Calls</span>
            <span>27</span>
            <span>Messages</span>
            <span>14</span>
            <span>Uploads</span>
            <span>3</span>
            <span>Downloads</span>
            <span>12</span>
          </div>
        </div>
        <div className="ra-panel">
          <p className="ra-panel-title">Last caller</p>
          <div className="ra-grid">
            <span>Name</span>
            <span>RODOLFO</span>
            <span>Off at</span>
            <span>14:02</span>
            <span>Baud</span>
            <span>2400</span>
            <span>Node</span>
            <span>1</span>
          </div>
        </div>
      </div>
      <p className="ra-status">
        Waiting for caller<span className="ra-cursor"> ...</span>
      </p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Oblivion/2 BBS: a scene board's front door -----------------------------
// OBV/2, the DOS BBS the ANSI art scene loved best; its modern remake is
// themed by Blocktronics artists. Freeware from 1997 under Transcentral
// Enterprises; v2.40 closed the decade. The shade-block header here is an
// original composition from generic block characters -- no artist's ANSI
// work is reproduced.
function Oblivion({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-obv">
      <p className="obv-shade" aria-hidden="true">░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░</p>
      <p className="obv-name">OBLIVION/2</p>
      <p className="obv-shade" aria-hidden="true">░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░</p>
      <p className="obv-sub">v2.40 - Transcentral Enterprises - Node 1</p>
      <p className="obv-login">
        login: <span className="obv-cursor">▌</span>
      </p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Telegard BBS: the main menu --------------------------------------------
// Telegard grew out of leaked WWIV 3.21 source through Carl Mueller, Eric Oman
// and Martin Pollard, passed to Tim Strike in 1993, and is Renegade's ancestor.
// Shown in its final 3.09/g2 form (1998, DOS and OS/2): the classic hobbyist
// main menu over JAM/Squish message bases, tagged file areas and doors.
function Telegard({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-tg">
      <div className="tg-titlebar">
        <span>Telegard v3.09/g2</span>
        <span>ARSENAL BBS - Node 1</span>
      </div>
      <div className="tg-menu">
        <p><span className="tg-key">[M]</span> Message areas</p>
        <p><span className="tg-key">[F]</span> File areas</p>
        <p><span className="tg-key">[D]</span> Doors</p>
        <p><span className="tg-key">[B]</span> Bulletins</p>
        <p><span className="tg-key">[U]</span> User settings</p>
        <p><span className="tg-key">[G]</span> Goodbye</p>
      </div>
      <p className="tg-status">[Main] - Time left: 58 min</p>
      <p className="tg-prompt">
        Command: <span className="tg-cursor">▌</span>
      </p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- XTreePro: the tree that tamed hard disks -------------------------------
// Executive Systems' XTree (April 1, 1985, USD 39.95) grew into XTreePro in
// 1988: multiple drives and more speed. The command words on the bottom rows
// are XTree's documented set (Attribute, Available, Copy, Delete, Filespec,
// Log, Makedir, Rename, Showall, Tag, Untag, View, Volume, eXecute); the
// panel arrangement follows the classic layout.
function XTreePro({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-xp">
      <p className="xp-path">Path: C:\ARSENAL</p>
      <div className="xp-body">
        <div className="xp-tree">
          <p>C:\</p>
          <p>├─ARSENAL</p>
          <p>│ ├─DOCS</p>
          <p>│ └─TOOLS</p>
          <p>└─DOS</p>
        </div>
        <div className="xp-stats">
          <p className="xp-stats-title">DISK C:</p>
          <p>Available</p>
          <p className="xp-num">11,462,656</p>
          <p>Bytes</p>
        </div>
      </div>
      <div className="xp-files">
        <span>AUTOEXEC.BAT</span>
        <span>COMMAND.COM</span>
        <span>CONFIG.SYS</span>
        <span>README.TXT</span>
      </div>
      <div className="xp-cmds">
        <p><b>A</b>ttribute <b>C</b>opy <b>D</b>elete <b>F</b>ilespec <b>L</b>og <b>M</b>akedir <b>R</b>ename</p>
        <p><b>S</b>howall <b>T</b>ag <b>U</b>ntag <b>V</b>iew v<b>O</b>lume e<b>X</b>ecute a<b>V</b>ailable</p>
      </div>
      <p className="xp-brand">XTreePro</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- XTreeGold: the gilded edition ------------------------------------------
// XTreeGold (1989) added pull-down menus and a Norton Commander-style split
// pane; Gold 2.0 (December 1990) folded ZIP archives into the file window.
// All three sourced signatures are on screen: the menu bar, the twin panes,
// and a ZIP sitting among the files.
function XTreeGold({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-xg">
      <p className="xg-menubar">File  Directory  Tag  Volume  Window  Help</p>
      <div className="xg-body">
        <div className="xg-pane">
          <p className="xg-path">C:\ARSENAL</p>
          <p>├─DOCS</p>
          <p>└─TOOLS</p>
        </div>
        <div className="xg-pane">
          <p className="xg-path">D:\BACKUP</p>
          <p>├─1990</p>
          <p>└─ZIPS</p>
        </div>
      </div>
      <div className="xp-files xg-files">
        <span>BACKUP.ZIP</span>
        <span>NOTES.TXT</span>
        <span>REPORT.DOC</span>
        <span>VENDAS.DBF</span>
      </div>
      <div className="xp-cmds">
        <p><b>A</b>ttribute <b>C</b>opy <b>D</b>elete <b>F</b>ilespec <b>L</b>og <b>M</b>akedir <b>R</b>ename <b>T</b>ag</p>
      </div>
      <p className="xg-brand">XTreeGold 2.0</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Microsoft Works (DOS): one program, four tools --------------------------
// Unveiled September 14, 1987 (Microsoft's own history page): word processor,
// spreadsheet, database and a communications tool in one monolithic program
// that ran in 256 KB. The chooser dialog is composed; the four tool names are
// the sourced component set.
function MSWorks({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-wk">
      <p className="wk-menubar">File  Edit  Print  Select  Format  Options  Window</p>
      <div className="wk-dialog">
        <p className="wk-dialog-title">Create New File</p>
        <p className="wk-item wk-item-sel">Word Processor</p>
        <p className="wk-item">Spreadsheet</p>
        <p className="wk-item">Database</p>
        <p className="wk-item">Communications</p>
        <p className="wk-ok">&lt; New &gt;   &lt; Cancel &gt;</p>
      </div>
      <p className="wk-status">Microsoft Works  ─  Press ALT to choose commands</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- MultiMate Advantage: the Wang that moved into a PC ---------------------
// Born as WordMate (December 1982) so Connecticut Mutual's Wang operators
// would not need retraining, down to a clip-on keyboard template. Ashton-Tate
// paid about USD 20 million for MultiMate in December 1985. The numbered main
// menu here is composed in the product's style.
function MultiMate({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-mm">
      <p className="mm-title">MultiMate Advantage</p>
      <p className="mm-sub">Ashton-Tate</p>
      <div className="mm-menu">
        <p><span className="mm-num">1</span> Edit an Old Document</p>
        <p><span className="mm-num">2</span> Create a New Document</p>
        <p><span className="mm-num">3</span> Print Document Utility</p>
        <p><span className="mm-num">4</span> Merge Print Utility</p>
        <p><span className="mm-num">5</span> Document Handling Utilities</p>
        <p><span className="mm-num">6</span> Other Utilities</p>
        <p><span className="mm-num">9</span> Return to DOS</p>
      </div>
      <p className="mm-prompt">DESIRED FUNCTION: <span className="mm-cursor">▌</span></p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Harvard Graphics: the slide factory -------------------------------------
// SPC's Harvard Presentation Graphics (1986) let a text-mode DOS PC assemble
// text, charts and clip art into slide shows; version 2.0 (1987) gave it the
// famous short name. Menu wording is composed in the product's numbered style.
function HarvardGraphics({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-hg">
      <p className="hg-title">Harvard Graphics</p>
      <div className="hg-menu">
        <p className="hg-menu-title">Main Menu</p>
        <p><span className="hg-num">1</span> Create new chart</p>
        <p><span className="hg-num">2</span> Enter/edit chart</p>
        <p><span className="hg-num">3</span> Draw/annotate</p>
        <p><span className="hg-num">4</span> Get/save/remove</p>
        <p><span className="hg-num">5</span> Import/export</p>
        <p><span className="hg-num">6</span> Produce output</p>
        <p><span className="hg-num">7</span> Slide show menu</p>
        <p><span className="hg-num">8</span> Setup</p>
      </div>
      <p className="hg-fkeys">F1-Help    F10-Continue</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Professional Write: letters, minus the pain ------------------------------
// Software Publishing Corporation replaced pfs:Write with Professional Write
// in 1986: pull-down menus and context-sensitive help, the friendly option
// next to WordPerfect and Word. Menu wording composed in the SPC style.
function ProfessionalWrite({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-pw">
      <p className="pw-title">Professional Write</p>
      <div className="pw-menu">
        <p className="pw-menu-title">Main Menu</p>
        <p><span className="pw-num">1</span> Create/Edit a document</p>
        <p><span className="pw-num">2</span> Get a file</p>
        <p><span className="pw-num">3</span> Dictionary</p>
        <p><span className="pw-num">4</span> Setup</p>
        <p><span className="pw-num">5</span> Exit</p>
      </div>
      <p className="pw-foot">Software Publishing Corporation</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Ami Pro: Windows before Word got there -----------------------------------
// Samna's Amí (1988) was the first fully functional Windows word processor,
// a year ahead of Word for Windows; tables arrived and it became Ami Pro.
// Lotus bought Samna in November 1990 for USD 65 million. The colourful
// SmartIcons strip was its sourced signature; icons here are abstract squares.
function AmiPro({ hint }: { hint: string }) {
  const icons = ["#c04040", "#40a040", "#4060c0", "#c0a040", "#a040a0", "#40a0a0", "#c07040", "#6040c0", "#40c070", "#c04070"];
  return (
    <div className="boss-screen boss-ap">
      <div className="ap-titlebar"><span className="ap-sys">─</span>Ami Pro - [Untitled]</div>
      <p className="ap-menubar">File  Edit  View  Text  Style  Tools  Window  Help</p>
      <div className="ap-icons" aria-hidden="true">
        {icons.map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
      <div className="ap-page">
        <p>Quarterly training report</p>
        <p>The new lab pods are ready for the next class,<span className="ap-caret">|</span></p>
      </div>
      <p className="ap-status">Insert</p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- dBASE II: the dot that started xBase -------------------------------------
// Wayne Ratliff's Vulcan from JPL, licensed by Ashton-Tate and shipped as
// dBASE II (no dBASE I ever existed; the II was marketing). A CP/M standard
// alongside WordStar and SuperCalc, USD 700, PC port in September 1982. Its
// sourced signature is the dot-prompt interpreter; the version line is
// composed (2.3b is a magazine-reviewed release).
function DBase2({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-d2">
      <p className="d2-banner">dBASE II ver 2.3b</p>
      <p className="d2-line">.USE CLIENTES</p>
      <p className="d2-line">.<span className="d2-cursor">▌</span></p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Clipper Summer '87: compiling the family business ------------------------
// Nantucket's dBASE compiler (Winter '84 shipped May 25, 1985). Summer '87,
// released December 21, 1987, stayed in production use for a decade. The two
// copyright lines are verbatim from a preserved banner; the header and the
// code-size line are composed. CA bought Nantucket in 1992 for USD 190M.
function Clipper({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-cl">
      <p className="cl-line cl-prompt">C:\ARSENAL&gt;clipper vendas</p>
      <p className="cl-line">The Clipper Compiler, Summer &#39;87</p>
      <p className="cl-line">Copyright (c) Nantucket Corp 1985-1987.  All Rights Reserved.</p>
      <p className="cl-line">Microsoft C Runtime Library Routines,</p>
      <p className="cl-line">Copyright (c) Microsoft Corp 1984-1987.</p>
      <p className="cl-line cl-gap">&nbsp;</p>
      <p className="cl-line">Compiling VENDAS.PRG</p>
      <p className="cl-line">Code size:38214  Symbols:512  Constants:2048</p>
      <p className="cl-line cl-prompt">C:\ARSENAL&gt;<span className="cl-cursor">▌</span></p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Borland SideKick: the pop-up over everything -----------------------------
// Philippe Kahn's USD 49.95 TSR (June 1984), invoked with Ctrl-Alt over
// whatever was running; a million copies in three years. The tool names are
// the sourced 1.x set; the function-key mapping is composed. InfoWorld, 1984:
// it "stands in the shadows behind whatever program you are using".
function SideKick({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-sk">
      <div className="sk-back" aria-hidden="true">
        <p>C:\&gt;dir /w</p>
        <p>COMMAND.COM   AUTOEXEC.BAT   CONFIG.SYS   ARSENAL</p>
        <p>C:\&gt;_</p>
      </div>
      <div className="sk-window">
        <p className="sk-title">SideKick</p>
        <p className="sk-item">F1  Help</p>
        <p className="sk-item">F2  Notepad</p>
        <p className="sk-item">F3  Calculator</p>
        <p className="sk-item">F4  Calendar</p>
        <p className="sk-item">F5  Dialer</p>
        <p className="sk-item">F6  ASCII table</p>
        <p className="sk-foot">Borland</p>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Windows for Workgroups 3.11: Program Manager ---------------------------
// The grey-chrome Windows 3.x shell that ran offices worldwide, shipped
// November 8, 1993 (codenamed Snowball) with peer-to-peer networking baked in.
// Program Manager hosts program groups of icons; the Main group and a Network
// group are shown. Icons are drawn as simple glyphs, not reproductions.
function WinWorkgroups({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-wfw">
      <div className="wfw-titlebar">
        <span className="wfw-sysbox">-</span>
        <span className="wfw-title-text">Program Manager</span>
      </div>
      <p className="wfw-menubar">File  Options  Window  Help</p>
      <div className="wfw-group">
        <p className="wfw-group-title">Main</p>
        <div className="wfw-icons">
          <span className="wfw-ico"><b>&#9707;</b>File Manager</span>
          <span className="wfw-ico"><b>&#9636;</b>Control Panel</span>
          <span className="wfw-ico"><b>&#9707;</b>Print Manager</span>
          <span className="wfw-ico"><b>&#9670;</b>Clipboard</span>
        </div>
      </div>
      <div className="wfw-group wfw-group-net">
        <p className="wfw-group-title">Network</p>
        <div className="wfw-icons">
          <span className="wfw-ico"><b>&#9707;</b>Net Setup</span>
          <span className="wfw-ico"><b>&#9993;</b>Mail</span>
        </div>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- OS/2 Warp 3: the Workplace Shell desktop -------------------------------
// IBM's object-oriented desktop (the Workplace Shell arrived in OS/2 2.0, 1992;
// Warp 3 shipped October 1994). Desktop icons drag and drop; the LaunchPad sits
// at the bottom and the Shredder is IBM's wastebasket. Icons are plain glyphs.
function OS2Warp({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-os2">
      <div className="os2-desktop">
        <div className="os2-ico"><span className="os2-glyph">&#128421;</span>OS/2 System</div>
        <div className="os2-ico"><span className="os2-glyph">&#128193;</span>Templates</div>
        <div className="os2-ico"><span className="os2-glyph">&#128462;</span>Information</div>
        <div className="os2-ico os2-ico-shred"><span className="os2-glyph">&#9986;</span>Shredder</div>
      </div>
      <div className="os2-launchpad">
        <span>Drives</span>
        <span>OS/2 Window</span>
        <span>Printer</span>
        <span>Settings</span>
        <span>Lockup</span>
        <span>Shutdown</span>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Macintosh Finder: the desktop that taught the metaphor -----------------
// Distinct from the Mac power-on (Happy Mac) screen: this is the Finder desktop
// introduced with the Macintosh 128K in 1984. Menu bar, a hard-disk icon at top
// right, and the Trash in the bottom-right corner (a real folder from System 7,
// May 13 1991). The striped title bar and glyphs are drawn, not reproduced.
function MacFinder({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-macf">
      <div className="macf-menubar">
        <span className="macf-apple">&#63743;</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Special</span>
      </div>
      <div className="macf-desktop">
        <div className="macf-disk">
          <span className="macf-disk-glyph">&#128190;</span>
          <span>Macintosh HD</span>
        </div>
        <div className="macf-trash">
          <span className="macf-trash-glyph">&#128465;</span>
          <span>Trash</span>
        </div>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- NCSA Mosaic: the browser that opened the web ---------------------------
// Built at NCSA (University of Illinois) by Marc Andreessen and Eric Bina,
// released 1993; the team went on to make Netscape. Grey X/Motif chrome, a row
// of navigation buttons, a URL bar, and a simple page with a link and inline
// image placeholder. The NCSA spinning-globe sat at the top right while loading.
function Mosaic({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-mosaic">
      <p className="mosaic-menubar">File  Edit  Options  Navigate  Annotate  Help</p>
      <div className="mosaic-btns">
        <span>Back</span>
        <span>Forward</span>
        <span>Home</span>
        <span>Reload</span>
        <span>Open</span>
      </div>
      <div className="mosaic-url">
        <span className="mosaic-url-label">URL:</span>
        <span className="mosaic-url-val">http://www.ncsa.uiuc.edu/</span>
      </div>
      <div className="mosaic-page">
        <p className="mosaic-h1">NCSA Mosaic Home Page</p>
        <p>Welcome to NCSA Mosaic, an Internet information browser.</p>
        <p className="mosaic-link">What's New | Demo Documents | Help</p>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- CompuServe: the numbered menu and the ! prompt -------------------------
// The first big consumer online service (Columbus, Ohio; consumer launch
// September 24, 1979). Before the CIM GUI, this was the classic terminal view:
// a numbered top menu over a mono link, and the lone "!" command prompt where
// you typed GO commands. Menu items are period-typical.
function CompuServe({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-cis">
      <p className="cis-head">CompuServe Information Service</p>
      <p className="cis-copy">Copyright (c) CompuServe Incorporated</p>
      <div className="cis-menu">
        <p><span className="cis-num">1</span> Access Basic Services</p>
        <p><span className="cis-num">2</span> Member Assistance</p>
        <p><span className="cis-num">3</span> Communications/Bulletin Bds.</p>
        <p><span className="cis-num">4</span> News/Weather/Sports</p>
        <p><span className="cis-num">5</span> Travel</p>
        <p><span className="cis-num">6</span> The Electronic MALL/Shopping</p>
        <p><span className="cis-num">7</span> Money Matters/Markets</p>
        <p><span className="cis-num">8</span> Entertainment/Games</p>
      </div>
      <p className="cis-prompt">Enter choice !<span className="cis-cursor">&#9612;</span></p>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- America Online: the Welcome screen -------------------------------------
// For millions, the internet was this blue screen and the friendly voice.
// Quantum's Q-Link became America Online in 1991; Steve Case mailed the world a
// floppy. The Welcome window with the mailbox and the channel list is drawn in
// AOL's blue; the running-man and mail glyphs are simple stand-ins.
function AOL({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-aol">
      <div className="aol-titlebar">America Online</div>
      <div className="aol-welcome">
        <p className="aol-hello">Welcome, Rodolfo!</p>
        <div className="aol-mail">
          <span className="aol-mail-glyph">&#9993;</span>
          <span>You've Got Mail</span>
        </div>
        <div className="aol-channels">
          <span>Today's News</span>
          <span>Sports</span>
          <span>Entertainment</span>
          <span>Computing</span>
          <span>Travel</span>
          <span>Internet Connection</span>
        </div>
        <p className="aol-keyword">Keyword: <span className="aol-kw-field">welcome</span></p>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- ZX Spectrum +2A / +3: the Amstrad-era start menu ------------------------
// The +2A (black case, cassette) and +3 (black case, 3-inch floppy) share the
// same Amstrad +3 ROM, so BOTH show the identical menu whose second item reads
// "+3 BASIC" even on the +2A -- the +2A is, in the manual's words, a +3 with a
// cassette deck. Verbatim from the +3 manual: Loader / +3 BASIC / Calculator /
// 48 BASIC, with Loader highlighted. The bottom line is the machine's own
// copyright, "(c)1982, 1986, 1987 Amstrad Plc.", matched to a real-hardware
// photo. Both run +3DOS, so drive M: (the RAMdisk) is available on each; only
// the +3 adds a physical disk. Header badge and drive text distinguish them.
const AMSTRAD_MENU = ["Loader", "+3 BASIC", "Calculator", "48 BASIC"] as const;
function AmstradSpectrum({ badge, cls, drive, hint }: { badge: string; cls: string; drive: string; hint: string }) {
  return (
    <div className={`boss-screen ${cls}`}>
      <div className="s2a-frame">
        <div className="s2a-header">
          <span className="s2a-badge">{badge}</span>
          <span className="s2a-stripes" aria-hidden="true">
            <span style={{ background: "#d70000" }} />
            <span style={{ background: "#d7d700" }} />
            <span style={{ background: "#00d700" }} />
            <span style={{ background: "#00d7d7" }} />
          </span>
        </div>
        <div className="s2a-menu">
          {AMSTRAD_MENU.map((m, i) => (
            <div key={m} className={`s2a-item${i === 0 ? " s2a-item-sel" : ""}`}>
              {m}
            </div>
          ))}
        </div>
      </div>
      <div className="s2a-foot">
        <p>&copy;1982, 1986, 1987 Amstrad Plc.</p>
        <p>{drive}</p>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Network General Sniffer: the DOS protocol analyzer ----------------------
// The tool that named a whole category (and Wireshark's distant ancestor),
// first sold by Network General (Mountain View, CA) in December 1986. It ran
// over MS-DOS on a 40-line text display, navigated by three-panel Miller
// columns. The main menu here is verbatim from a Sniffer v4.4 tutorial:
// Traffic generator / Capture filters / Trigger / Schedule / Capture / Display
// / Files / Options / Exit, with executable items marked by an arrow and the
// function-key legend (F1 Help, F10 New Capture) along the bottom.
const SNIFFER_MENU: Array<{ label: string; exec: boolean }> = [
  { label: "Traffic generator", exec: true },
  { label: "Capture filters", exec: false },
  { label: "Trigger", exec: false },
  { label: "Schedule", exec: true },
  { label: "Capture", exec: true },
  { label: "Display", exec: true },
  { label: "Files", exec: false },
  { label: "Options", exec: false },
  { label: "Exit", exec: true },
];
function Sniffer({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-sniffer">
      <div className="snf-title">The Sniffer Network Analyzer &#8212; Ethernet</div>
      <div className="snf-body">
        <div className="snf-menu">
          {SNIFFER_MENU.map((m, i) => (
            <p key={m.label} className={`snf-item${i === 0 ? " snf-item-sel" : ""}`}>
              <span className="snf-mark">{i === 0 ? "\u00bb" : " "}</span>
              {m.label}
              <span className="snf-arrow">{m.exec ? "\u2190" : " "}</span>
            </p>
          ))}
        </div>
        <div className="snf-desc">
          Generate frames onto the network to test a station or a path.
        </div>
      </div>
      <div className="snf-fkeys">
        <span>F1 Help</span>
        <span>F10 New Capture</span>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- VMware ESXi 6.7: the DCUI ----------------------------------------------
// The bare-metal hypervisor's Direct Console User Interface, the yellow-on-grey
// screen an admin meets at the physical host. ESXi 6.7 went GA April 17, 2018.
// The layout follows the real DCUI: a title bar, the running version, a host
// resource summary, the "download vSphere Client" line, and the two-key legend
// at the bottom (F2 to customize, F12 to shut down). IP and hardware strings
// are placeholders in the product's format.
function ESXi({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-esxi">
      <div className="esxi-titlebar">VMware ESXi 6.7.0 (VMKernel Release Build 8169922)</div>
      <div className="esxi-main">
        <p className="esxi-line">VMware, Inc. VMware Virtual Platform</p>
        <p className="esxi-line">2 x Intel(R) Xeon(R) CPU E5-2670</p>
        <p className="esxi-line">32 GiB Memory</p>
        <p className="esxi-spacer">&nbsp;</p>
        <p className="esxi-line">Download tools to manage this host from:</p>
        <p className="esxi-line esxi-url">http://arsenal.local/</p>
        <p className="esxi-line esxi-url">https://192.168.1.20/ (DHCP)</p>
      </div>
      <div className="esxi-footbar">
        <span>&lt;F2&gt; Customize System/View Logs</span>
        <span>&lt;F12&gt; Shut Down/Restart</span>
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// ---- Sniffer packet-decode screens ------------------------------------------
// These reuse the Sniffer's authentic three-pane analysis view (the layout its
// own manual describes: summary list, single-packet decoded detail, and raw
// hex). Each screen shows a different historically-recognizable capture.
//
// SAFETY NOTE (deliberate design): a real decode shows bytes on the wire. For
// the worms, the "recognizable" bytes ARE the weapon (shellcode / exploit
// triggers / propagation payloads), so this NEVER reproduces them. Instead:
//   - HTTP 420 and ILOVEYOU are benign application-layer artifacts (an HTTP
//     rate-limit response; an email envelope). Their real, sourced strings are
//     shown in full -- there is no exploit code in either.
//   - The six network worms are shown at the HEADER level only: the summary and
//     detail panes carry the real flow metadata (ports, protocol, CVE, date)
//     that an analyst's summary would show, and the hex pane carries ONLY
//     benign protocol-header bytes (Ethernet/IP/TCP), capped by an explicit
//     "payload omitted" marker naming the worm and its vector. No payload,
//     shellcode, or exploit bytes appear anywhere.
// Every on-screen string is grounded in a cited source (F5/vendor docs, CISA,
// CAIDA, Microsoft/MSRC, F-Secure/Kaspersky, and the Twitter API 420 record).

type DecodeRow = { proto: string; info: string; sel?: boolean };
type DecodeLine = { indent?: number; text: string };
type SnifferCapture = {
  suite: string; // title-bar suite label (e.g. "Ethernet")
  summary: DecodeRow[]; // top pane: multiple-packet summary
  detail: DecodeLine[]; // middle pane: decoded detail of the selected packet
  hex: string[]; // bottom pane: raw bytes (headers only for worm captures)
  note?: string; // optional footer note (used to label omitted payloads)
};

function SnifferDecode({ capture, hint }: { capture: SnifferCapture; hint: string }) {
  return (
    <div className="boss-screen boss-snfd">
      <div className="snfd-title">
        The Sniffer Network Analyzer &#8212; {capture.suite} &#8212; Display
      </div>
      <div className="snfd-pane snfd-summary">
        {capture.summary.map((r, i) => (
          <p key={i} className={`snfd-row${r.sel ? " snfd-row-sel" : ""}`}>
            <span className="snfd-proto">{r.proto}</span>
            <span className="snfd-info">{r.info}</span>
          </p>
        ))}
      </div>
      <div className="snfd-pane snfd-detail">
        {capture.detail.map((l, i) => (
          <p key={i} className="snfd-dline" style={{ paddingLeft: `${(l.indent ?? 0) * 1.2}em` }}>
            {l.text}
          </p>
        ))}
      </div>
      <div className="snfd-pane snfd-hex">
        {capture.hex.map((h, i) => (
          <p key={i} className="snfd-hline">{h}</p>
        ))}
        {capture.note ? <p className="snfd-note">{capture.note}</p> : null}
      </div>
      <span className="boss-hint">{hint}</span>
    </div>
  );
}

// -- Capture 1: HTTP 420 Enhance your calm (Twitter Search/Trends v1.0 API) ----
// Fully benign: an HTTP response. Status line, headers and JSON body are the
// real, documented artifact (http.dev / evertpot). Deprecated later for 429.
const CAP_HTTP420: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "80 -> 51194  ACK  Len=0" },
    { proto: "HTTP", info: "HTTP/1.1 420 Enhance your calm  (application/json)", sel: true },
    { proto: "TCP", info: "51194 -> 80  ACK  Len=0" },
  ],
  detail: [
    { text: "HTTP: ----- Hypertext Transfer Protocol -----" },
    { indent: 1, text: "HTTP: Status-Line = HTTP/1.1 420 Enhance your calm" },
    { indent: 1, text: "HTTP: Content-Type = application/json" },
    { indent: 1, text: "HTTP: Retry-After = 60" },
    { indent: 1, text: "HTTP: (rate limited; Twitter Search/Trends v1.0 API)" },
    { indent: 1, text: 'HTTP: Body = {"errors":[{"message":"Enhance your calm","code":420}]}' },
  ],
  hex: [
    "0000  48 54 54 50 2f 31 2e 31  20 34 32 30 20 45 6e 68   HTTP/1.1 420 Enh",
    "0010  61 6e 63 65 20 79 6f 75  72 20 63 61 6c 6d 0d 0a   ance your calm..",
    "0020  52 65 74 72 79 2d 41 66  74 65 72 3a 20 36 30 0d   Retry-After: 60.",
  ],
};

// -- Capture 2: ILOVEYOU / LoveLetter (May 2000) -------------------------------
// Benign email envelope ONLY. Subject/body/attachment are the documented mail
// artifact (F-Secure, Microsoft, Kaspersky, Bishop analysis). NO VBScript.
const CAP_ILOVEYOU: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "SMTP", info: "MAIL FROM / RCPT TO  (queued)" },
    { proto: "SMTP", info: "DATA: Subject: ILOVEYOU", sel: true },
    { proto: "SMTP", info: "250 Message accepted for delivery" },
  ],
  detail: [
    { text: "SMTP: ----- Simple Mail Transfer Protocol -----" },
    { indent: 1, text: "SMTP: From = <current-user>@example.com" },
    { indent: 1, text: "SMTP: Subject = ILOVEYOU" },
    { indent: 1, text: "SMTP: Body = kindly check the attached LOVELETTER coming from me." },
    { indent: 1, text: "SMTP: Attachment = LOVE-LETTER-FOR-YOU.TXT.vbs" },
    { indent: 1, text: "SMTP: (VBS/LoveLetter, spreads via Outlook address book)" },
  ],
  hex: [
    "0000  53 75 62 6a 65 63 74 3a  20 49 4c 4f 56 45 59 4f   Subject: ILOVEYO",
    "0010  55 0d 0a 6b 69 6e 64 6c  79 20 63 68 65 63 6b 20   U..kindly check ",
    "0020  74 68 65 20 61 74 74 61  63 68 65 64 20 2e 2e 2e   the attached ...",
  ],
  note: "Attachment body (VBScript) omitted -- mail envelope shown only.",
};

// -- Capture 3: Morris Worm (Nov 2, 1988) -------------------------------------
// Header-level: fingerd (TCP/79) + sendmail (TCP/25 debug). TCP/IP only.
// Sources: Wikipedia, MIT 6.805, Grokipedia, arXiv study. NO shellcode.
const CAP_MORRIS: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1024 -> 79   SYN   (finger daemon)", sel: true },
    { proto: "TCP", info: "1025 -> 25   SYN   (sendmail / SMTP)" },
    { proto: "TCP", info: "79 -> 1024   SYN, ACK" },
  ],
  detail: [
    { text: "IP:  ----- Internet Protocol -----" },
    { indent: 1, text: "IP:  Protocol = 6 (TCP)" },
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 79 (finger)" },
    { indent: 1, text: "TCP: Flags = ....S. (SYN)" },
    { indent: 1, text: "TCP: [Internet Worm of 1988 -- fingerd + sendmail debug vectors]" },
  ],
  hex: [
    "0000  45 00 00 2c 1c 46 40 00  40 06 b1 e6 0a 00 00 01   E..,.F@.@.......",
    "0010  0a 00 00 02 04 00 00 4f  00 00 00 00 00 00 00 00   .......O........",
  ],
  note: "Payload omitted -- Morris Worm fingerd/sendmail exploit not shown.",
};

// -- Capture 4: Stuxnet (2010) ------------------------------------------------
// Header-level: SMB print-spooler (MS10-061) + MS08-067, TCP/445. Targets
// Siemens WinCC. Sources: CISA, Symantec Dossier, MSRC, ESET. NO payload.
const CAP_STUXNET: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1039 -> 445  SYN   (SMB / print spooler)", sel: true },
    { proto: "SMB", info: "Negotiate Protocol Request" },
    { proto: "SMB", info: "Tree Connect: \\\\HOST\\print$" },
  ],
  detail: [
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 445 (microsoft-ds / SMB)" },
    { text: "SMB: ----- Server Message Block -----" },
    { indent: 1, text: "SMB: Command = Tree Connect (print spooler share)" },
    { indent: 1, text: "SMB: [Stuxnet -- MS10-061 spooler + MS08-067; target: WinCC]" },
  ],
  hex: [
    "0000  45 00 00 30 3a 21 40 00  80 06 00 00 c0 a8 01 0a   E..0:!@.........",
    "0010  c0 a8 01 20 04 0f 01 bd  00 00 00 00 00 00 00 00   ... ............",
  ],
  note: "Payload omitted -- Stuxnet spooler/SMB exploit not shown.",
};

// -- Capture 5: Conficker / Downadup (Nov 2008) -------------------------------
// Header-level: TCP/445 SMB SYN scan, MS08-067 (CVE-2008-4250). Sources:
// CAIDA telescope, Grokipedia, Cisco IPS notes. NO payload.
const CAP_CONFICKER: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1055 -> 445  SYN   (scanning)", sel: true },
    { proto: "TCP", info: "1056 -> 445  SYN   (scanning)" },
    { proto: "TCP", info: "1057 -> 445  SYN   (scanning)" },
  ],
  detail: [
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 445 (microsoft-ds / SMB)" },
    { indent: 1, text: "TCP: Flags = ....S. (SYN)  -- high-rate host sweep" },
    { indent: 1, text: "TCP: [Conficker/Downadup -- MS08-067, CVE-2008-4250]" },
  ],
  hex: [
    "0000  45 00 00 30 5b 12 40 00  80 06 00 00 c0 a8 01 0a   E..0[.@.........",
    "0010  c0 a8 01 c8 04 1f 01 bd  00 00 00 00 00 00 00 00   ................",
  ],
  note: "Payload omitted -- Conficker MS08-067 exploit not shown.",
};

// -- Capture 6: Mirai (2016) --------------------------------------------------
// Header-level: Telnet (TCP/23) brute-force against IoT. Credential list is
// NOT shown. Sources: Krebs, US-CERT/CISA, MalwareTech analyses. NO creds.
const CAP_MIRAI: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1071 -> 23   SYN   (Telnet)", sel: true },
    { proto: "TELNET", info: "login attempt (IoT device)" },
    { proto: "TELNET", info: "login attempt (IoT device)" },
  ],
  detail: [
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 23 (telnet)" },
    { text: "TELNET: ----- Telnet Protocol -----" },
    { indent: 1, text: "TELNET: Login prompt / credential guess" },
    { indent: 1, text: "TELNET: [Mirai -- IoT Telnet brute force; credential list omitted]" },
  ],
  hex: [
    "0000  45 00 00 2c 6a 3f 40 00  40 06 00 00 c0 a8 01 0a   E..,j?@.@.......",
    "0010  c0 a8 01 64 04 2f 00 17  00 00 00 00 00 00 00 00   ...d./..........",
  ],
  note: "Credential list omitted -- Mirai hardcoded logins not shown.",
};

// -- Capture 7: WannaCry (May 12, 2017) ---------------------------------------
// Header-level: SMBv1 TCP/445, EternalBlue / MS17-010 (CVE-2017-0144).
// Sources: CISA IOCs, Mandiant, Wikipedia. NO exploit bytes.
const CAP_WANNACRY: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1083 -> 445  SYN   (SMBv1)", sel: true },
    { proto: "SMB", info: "Negotiate Protocol Request" },
    { proto: "SMB", info: "Session Setup AndX Request" },
  ],
  detail: [
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 445 (microsoft-ds / SMBv1)" },
    { text: "SMB: ----- Server Message Block v1 -----" },
    { indent: 1, text: "SMB: Command = Negotiate / Session Setup" },
    { indent: 1, text: "SMB: [WannaCry -- EternalBlue, MS17-010, CVE-2017-0144]" },
  ],
  hex: [
    "0000  45 00 00 30 7c 55 40 00  80 06 00 00 c0 a8 01 0a   E..0|U@.........",
    "0010  c0 a8 01 32 04 3b 01 bd  00 00 00 00 00 00 00 00   ...2.;..........",
  ],
  note: "Payload omitted -- WannaCry EternalBlue exploit not shown.",
};

// -- Capture 8: NotPetya (2017) -----------------------------------------------
// Header-level: same EternalBlue / MS17-010 SMB TCP/445 vector as WannaCry
// (NotPetya is a wiper). Sources: SpamTitan, ESET, CISA. NO exploit bytes.
const CAP_PETYA: SnifferCapture = {
  suite: "Ethernet",
  summary: [
    { proto: "TCP", info: "1090 -> 445  SYN   (SMBv1)", sel: true },
    { proto: "SMB", info: "Negotiate Protocol Request" },
    { proto: "SMB", info: "Tree Connect AndX Request" },
  ],
  detail: [
    { text: "TCP: ----- Transmission Control Protocol -----" },
    { indent: 1, text: "TCP: Destination Port = 445 (microsoft-ds / SMBv1)" },
    { text: "SMB: ----- Server Message Block v1 -----" },
    { indent: 1, text: "SMB: Command = Negotiate / Tree Connect" },
    { indent: 1, text: "SMB: [NotPetya -- EternalBlue, MS17-010; wiper]" },
  ],
  hex: [
    "0000  45 00 00 30 8e 61 40 00  80 06 00 00 c0 a8 01 0a   E..0.a@.........",
    "0010  c0 a8 01 46 04 42 01 bd  00 00 00 00 00 00 00 00   ...F.B..........",
  ],
  note: "Payload omitted -- NotPetya EternalBlue exploit not shown.",
};

// ---- Microdigital TK-82C (BR ZX81 clone) -----------------------------------
// Microdigital's first widely sold machine and a faithful ZX81 clone, so it
// boots exactly like one: a blank raster and a single inverse K in the corner.
// Here it types its author's first program — 10 PRINT "RONUTZ" — the way a ZX81
// did, the cursor flipping K (keyword) to L (letter) as the line is entered.
function TK82C() {
  return (
    <div className="boss-screen boss-tk82c">
      <div className="zx81-field">
        <span className="zx81-line" aria-hidden="true">
          <span className="zx81-typed tk82c-typed">10 PRINT </span>
          <span className="zx81-quotes tk82c-quotes">&quot;RONUTZ&quot;</span>
        </span>
        <span className="zx81-k">K</span>
      </div>
    </div>
  );
}

// ---- Microdigital TK90X (BR ZX Spectrum clone) -----------------------------
// Corrected against PRIME's own photographs of real hardware. The power-on
// screen is paper-white with the machine's name near the top, "TK90X - Color
// Computer" (verbatim from the ROM at 0x3AAE, five leading spaces centring it
// on the 32-column screen), AND a thin horizontal eight-colour bar low on the
// screen. The bar is the Spectrum BRIGHT palette in descending order: white,
// yellow, cyan, green, magenta, red, blue, black (sampled from the photos as
// ~0xC0-level RGB, e.g. white 191,191,191; yellow 188,195,4). This bar is an
// on-screen boot element, distinct from the Spectrum's case/logo rainbow.
function TK90X() {
  const bar = ["#ffffff", "#d7d700", "#00d7d7", "#00d700", "#d700d7", "#d70000", "#0000d7", "#000000"];
  return (
    <div className="boss-screen boss-tk90x">
      <div className="tk90x-copy tk90x-copy-top">TK90X - Color Computer</div>
      <div className="spectrum-field" />
      <div className="tk-colorbar" aria-hidden="true">
        {bar.map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

// ---- Microdigital TK95 (BR ZX Spectrum clone, TK90X successor) -------------
// Corrected against PRIME's photograph of a real Brazilian TK95: the boot line
// reads "Microdigital TK95", bottom-left aligned. (An earlier build used a
// "TK95ES" ROM dump that renders "TK Color Computer"; the ES/Spanish-variant
// dump disagrees with the real Brazilian hardware, so the photograph governs
// -- a ROM is only evidence if it is the RIGHT ROM.) The TK95 shows a taller
// eight-colour vertical-band field, same Spectrum BRIGHT palette and order as
// the TK90X's bar, faintly tiled with the year in the original; here rendered
// as clean vertical colour bands.
function TK95() {
  const bar = ["#ffffff", "#d7d700", "#00d7d7", "#00d700", "#d700d7", "#d70000", "#0000d7", "#000000"];
  return (
    <div className="boss-screen boss-tk95">
      <div className="tk95-bands" aria-hidden="true">
        {bar.map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
      <div className="tk90x-copy tk95-copy">Microdigital TK95</div>
    </div>
  );
}

// ---- MSX 1 -----------------------------------------------------------------
// The logo scrolls up from mid-screen, then it drops into MSX BASIC.
function Msx1({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-msx">
      <div className="msx-logo" aria-hidden="true">
        <span className="msx-logo-word">MSX</span>
      </div>
      <pre className="msx-basic">{`MSX BASIC version 1.0
Copyright 1983 by Microsoft
28815 Bytes free

Ok`}<span className="msx-cursor">█</span></pre>
      <div className="msx-fkeys" aria-hidden="true">
        <span>color</span><span>auto</span><span>goto</span><span>list</span><span>run</span>
      </div>
      <div className="boss-hint msx-hint">{hint}</div>
    </div>
  );
}

// ---- Gradiente Expert (BR MSX) ---------------------------------------------
function Expert({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-msx boss-expert">
      <div className="msx-logo msx-logo-expert" aria-hidden="true">
        <span className="msx-logo-word">MSX</span>
        <span className="expert-brand">expert</span>
      </div>
      <pre className="msx-basic">{`MSX BASIC version 1.0
Copyright 1983 by Microsoft
28599 Bytes free

Ok`}<span className="msx-cursor">█</span></pre>
      <div className="msx-fkeys" aria-hidden="true">
        <span>color</span><span>auto</span><span>goto</span><span>list</span><span>run</span>
      </div>
      <div className="boss-hint msx-hint">{hint}</div>
    </div>
  );
}

// ---- Epcom Hotbit HB-8000 (BR MSX) -----------------------------------------
function Hotbit({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-msx boss-hotbit">
      <div className="msx-logo msx-logo-hotbit" aria-hidden="true">
        <span className="msx-logo-word">MSX</span>
        <span className="hotbit-brand">HOTBIT</span>
      </div>
      <pre className="msx-basic">{`MSX BASIC version 1.0
Copyright 1983 by Microsoft
28599 Bytes free

Ok`}<span className="msx-cursor">█</span></pre>
      <div className="msx-fkeys" aria-hidden="true">
        <span>color</span><span>auto</span><span>goto</span><span>list</span><span>run</span>
      </div>
      <div className="boss-hint msx-hint">{hint}</div>
    </div>
  );
}

// ---- TRS-80 Model III ------------------------------------------------------
// White phosphor on black. Cass? / Memory Size? then Level II READY + prompt.
function Trs80({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-trs80">
      <pre className="trs80-text">{`Cass?
Memory Size?

RADIO SHACK LEVEL II BASIC
READY
>`}<span className="trs80-cursor">_</span></pre>
      <div className="boss-hint trs80-hint">{hint}</div>
    </div>
  );
}

// ---- Prologica CP-500 (BR TRS-80 Model III clone) --------------------------
// GREEN phosphor 16x64. DOS 500 banner then BASIC READY.
function Cp500({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-cp500">
      <pre className="cp500-text">{`PROLOGICA CP-500
DOS 500 V1.0
READY
>`}<span className="cp500-cursor">_</span></pre>
      <div className="boss-hint cp500-hint">{hint}</div>
    </div>
  );
}

// ---- TRS-80 Color Computer (CoCo) ------------------------------------------
// Black text on GREEN. Microsoft Color BASIC. OK + blinking cursor.
function Coco({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-coco">
      <pre className="coco-text">{`COLOR BASIC 1.0
(C) 1980 TANDY

OK`}<span className="coco-cursor">█</span></pre>
      <div className="boss-hint coco-hint">{hint}</div>
    </div>
  );
}

// ---- Apple //e (enhanced) --------------------------------------------------
// The ENHANCED //e ROM shows "Apple //e" (the unenhanced //e and the II+ show
// "Apple ]["). Applesoft ] prompt on black. This keeps //e distinct from the
// II+ screen. (Verified: Applefritter — enhanced //e boots showing "Apple //e".)
function AppleII({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-apple2">
      <pre className="apple2-text">{`Apple //e

]`}<span className="apple2-cursor">▉</span></pre>
      <div className="boss-hint apple2-hint">{hint}</div>
    </div>
  );
}

// ---- IBM PC / XT -----------------------------------------------------------
// Cassette BASIC in ROM — the banner an IBM PC shows with no disk.
function IbmPc({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-ibmpc">
      <pre className="ibmpc-text">{`The IBM Personal Computer Basic
Version C1.10 Copyright IBM Corp 1981
62940 Bytes free
Ok`}<span className="ibmpc-cursor">_</span></pre>
      <div className="boss-hint ibmpc-hint">{hint}</div>
    </div>
  );
}

// A POST-style memory counter that ramps from 0 up to `target` (in KB), the way
// a real BIOS counts RAM on power-on. Honors reduced-motion by jumping straight
// to the final value. `pad` zero-pads the displayed number to match BIOS output.
function useMemoryCount(target: number, pad: number, stepKb = 128, tickMs = 45): string {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let cur = 0;
    const id = window.setInterval(() => {
      cur += stepKb;
      if (cur >= target) {
        cur = target;
        window.clearInterval(id);
      }
      setValue(cur);
    }, tickMs);
    return () => window.clearInterval(id);
  }, [target, stepKb, tickMs]);
  return String(value).padStart(pad, "0");
}

// ---- IBM PC/AT (286) POST --------------------------------------------------
// The AT's memory count marches upward, then a boot line. Count animates.
function At286({ hint }: { hint: string }) {
  const kb = useMemoryCount(640, 4);
  return (
    <div className="boss-screen boss-at286">
      <pre className="at286-text">{`Phoenix ROM BIOS PLUS Version 3.10
Copyright (C) 1985 Phoenix Technologies Ltd.

IBM Personal Computer AT
`}<span className="at286-count">{kb}</span>{` KB OK
`}</pre>
      <div className="boss-hint at286-hint">{hint}</div>
    </div>
  );
}

// ---- Pimped 386DX-40 (AMI BIOS POST) ---------------------------------------
// AMIBIOS blue-ish POST: memory count-up, cache + turbo lit, Hit DEL for SETUP.
function Pc386({ hint }: { hint: string }) {
  const kb = useMemoryCount(8192, 4, 256, 30);
  return (
    <div className="boss-screen boss-pc386">
      <pre className="pc386-top">{`AMIBIOS (C) 1992 American Megatrends Inc.
386DX-40  CPU at 40MHz, 8K Cache Enabled

`}<span className="pc386-count">{kb}</span>{` KB OK

Hit <DEL> if you want to run SETUP`}</pre>
      <pre className="pc386-bottom">{`(C) American Megatrends Inc.,
40-0100-ZZ1343-00101111-101292-AMSAMI-H`}</pre>
      <div className="boss-hint pc386-hint">{hint}</div>
    </div>
  );
}

// ---- Commodore VIC-20 ------------------------------------------------------
// Cyan-bordered CBM BASIC V2; 3583 bytes free. The C64's older sibling.
function Vic20() {
  return (
    <div className="boss-screen boss-vic20">
      <pre className="vic20-banner">{`    **** CBM BASIC V2 ****

 3583 BYTES FREE

READY.`}<span className="vic20-cursor">█</span></pre>
    </div>
  );
}

// ---- Commodore Amiga (Kickstart 1.x insert-disk) ---------------------------
// The friendliest boot: a hand holding a Workbench floppy, gently waggling.
function Amiga() {
  return (
    <div className="boss-screen boss-amiga">
      <div className="amiga-scene">
        <div className="amiga-hand" aria-hidden="true">
          <div className="amiga-arm" />
          <div className="amiga-disk">
            <div className="amiga-disk-shutter" />
            <div className="amiga-disk-label" />
          </div>
        </div>
        <div className="amiga-caption">Kickstart 1.3</div>
      </div>
    </div>
  );
}

// ---- BBC Micro Model B -----------------------------------------------------
// Terse grey banner + BASIC prompt on black. The UK school machine.
function BbcMicro({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-bbc">
      <pre className="bbc-text">{`BBC Computer 32K

Acorn DFS

BASIC

>`}<span className="bbc-cursor">▉</span></pre>
      <div className="boss-hint bbc-hint">{hint}</div>
    </div>
  );
}

// ---- Amstrad CPC 464 -------------------------------------------------------
// Bright yellow on blue, Locomotive BASIC, Ready.
function Cpc464({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-cpc">
      <pre className="cpc-text">{`Amstrad 64K Microcomputer  (v1)

©1984 Amstrad Consumer Electronics plc
       and Locomotive Software Ltd.

BASIC 1.0

Ready`}<span className="cpc-cursor">▉</span></pre>
      <div className="boss-hint cpc-hint">{hint}</div>
    </div>
  );
}

// ---- Apple I ---------------------------------------------------------------
// WozMon: no OS, uppercase only. After Reset it prints a backslash and a
// blinking @ cursor on the next line, ready for hex commands. (Verified:
// apple1software.com, Applefritter, apple2history.)
function Apple1() {
  return (
    <div className="boss-screen boss-apple1">
      <pre className="apple1-text">{`\\
`}<span className="apple1-cursor">@</span></pre>
    </div>
  );
}

// ---- Apple II (original, 1977) ---------------------------------------------
// No autostart ROM: it comes up in Wozniak's machine-language monitor at a *
// prompt; Ctrl-B enters Integer BASIC (> prompt). Shown together so the
// monitor origin is legible. (Verified: Integer BASIC/Wikipedia, Computer
// History Wiki, apple2history ah06.)
function AppleII1977({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-apple2 boss-apple2og">
      <pre className="apple2-text">{`*

>`}<span className="apple2-cursor">▉</span></pre>
      <div className="boss-hint apple2-hint">{hint}</div>
    </div>
  );
}

// ---- Macintosh 128K --------------------------------------------------------
// Susan Kare's boot: a blinking floppy-with-? (no boot disk found) resolves to
// the smiling Happy Mac and "Welcome to Macintosh". Monochrome, centered.
// (Verified: Wikipedia Macintosh startup, Apple Wiki Happy Mac.)
function Macintosh() {
  return (
    <div className="boss-screen boss-mac">
      <div className="mac-inner">
        <div className="mac-icon" aria-hidden="true">
          {/* the "?" floppy and the Happy Mac cross-fade via CSS */}
          <div className="mac-disk">
            <div className="mac-disk-q">?</div>
          </div>
          <div className="mac-happy">
            <div className="mac-happy-face">
              <span className="mac-eye mac-eye-l" />
              <span className="mac-eye mac-eye-r" />
              <span className="mac-smile" />
            </div>
          </div>
        </div>
        <div className="mac-welcome">Welcome to Macintosh</div>
      </div>
    </div>
  );
}

// ---- Apple ][+ -------------------------------------------------------------
// Applesoft in ROM: the plain "Apple ][" banner and the ] prompt on black.
// (Verified: II Plus autostart ROM shows "Apple ][" then drops to "]".)
function AppleIIPlus({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-apple2">
      <pre className="apple2-text">{`Apple ][

]`}<span className="apple2-cursor">▉</span></pre>
      <div className="boss-hint apple2-hint">{hint}</div>
    </div>
  );
}

// ---- Apple //c -------------------------------------------------------------
// Verified power-on with no disk: beep, "Apple //c" at top, drive whirs, then
// "Check Disk Drive" at the bottom. Green-ish mono like the other Apple IIs.
function AppleIIc({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-apple2 boss-apple2c">
      <pre className="apple2-text">{`Apple //c`}</pre>
      <pre className="apple2c-check">{`Check Disk Drive`}</pre>
      <div className="boss-hint apple2-hint">{hint}</div>
    </div>
  );
}

// ---- Apple IIgs ------------------------------------------------------------
// The 16-bit II's "Check Startup Device" screen, where the colour Apple logo
// slides gently side to side. Lighter background than the mono IIs.
function AppleIIgs({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-iigs">
      <div className="iigs-inner">
        <div className="iigs-logo" aria-hidden="true">
          <span className="iigs-logo-mark" />
          <span className="iigs-logo-text">Apple <span className="iigs-logo-ii">IIGS</span></span>
        </div>
        <div className="iigs-check">Check Startup Device</div>
      </div>
      <div className="boss-hint iigs-hint">{hint}</div>
    </div>
  );
}

// ---- Atari 800XL -----------------------------------------------------------
// Deep blue Atari BASIC: READY with a white block cursor. (Verified: 800XL
// owner's manual — blue screen, "READY", white square cursor.)
function Atari800XL({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-atari">
      <pre className="atari-text">{`READY
`}<span className="atari-cursor">█</span></pre>
      <div className="boss-hint atari-hint">{hint}</div>
    </div>
  );
}

// ---- TI-99/4A --------------------------------------------------------------
// The cyan title screen: TEXAS INSTRUMENTS / HOME COMPUTER, press any key.
// (Verified: TI-99/4A title screen colour + "PRESS ANY KEY TO BEGIN".)
function Ti99() {
  return (
    <div className="boss-screen boss-ti99">
      <div className="ti99-frame">
        <div className="ti99-title">
          <div>TEXAS INSTRUMENTS</div>
          <div>HOME COMPUTER</div>
        </div>
        <div className="ti99-press">PRESS ANY KEY TO BEGIN</div>
        <div className="ti99-bars" aria-hidden="true">
          <span style={{ background: "#000000" }} />
          <span style={{ background: "#2020e0" }} />
          <span style={{ background: "#e02020" }} />
          <span style={{ background: "#20c0c0" }} />
          <span style={{ background: "#20c020" }} />
          <span style={{ background: "#e0e020" }} />
          <span style={{ background: "#e0e0e0" }} />
        </div>
      </div>
    </div>
  );
}

// ---- MSX turbo R -----------------------------------------------------------
// The last MSX. Same power-up look as MSX2+, but the logo assembles from the
// sides (not scroll-up), then MSX BASIC 4.0. Thicker Japanese-machine font.
// (Verified: BASIC v4.0 on FS-A1ST; logo-from-sides animation; ~25302 free.)
function MsxTurboR({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-msx boss-msxtr">
      <div className="msx-logo msxtr-logo" aria-hidden="true">
        <span className="msx-logo-word">MSX</span>
        <span className="msxtr-badge">turbo R</span>
      </div>
      <pre className="msx-basic msxtr-basic">{`MSX BASIC version 4.0
Copyright 1990 by Microsoft
25302 Bytes free

Ok`}<span className="msx-cursor">█</span></pre>
      <div className="msx-fkeys" aria-hidden="true">
        <span>color</span><span>auto</span><span>goto</span><span>list</span><span>run</span>
      </div>
      <div className="boss-hint msx-hint">{hint}</div>
    </div>
  );
}

// ---- Prologica CP-300 (BR TRS-80 Model III clone, compact/no-disk) ---------
// Verified: Model III-compatible, compact home version WITHOUT disk drives, so
// it goes straight to cassette Level II BASIC. Green phosphor, CP-300 branding.
function Cp300({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-cp500 boss-cp300">
      <pre className="cp500-text">{`Cass?
Memory Size?

PROLOGICA CP-300
MICROSOFT LEVEL II BASIC
READY
>`}<span className="cp500-cursor">_</span></pre>
      <div className="boss-hint cp500-hint">{hint}</div>
    </div>
  );
}

// ---- Prologica CP-400 (BR TRS-80 Color clone — a CoCo 2 inside) ------------
// Verified: CoCo 2 clone, so EXTENDED COLOR BASIC (not plain Color BASIC).
// Black text on green, Tandy/Microsoft lineage with Prologica branding.
function Cp400({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-coco boss-cp400">
      <pre className="coco-text">{`PROLOGICA CP-400 COLOR
EXTENDED COLOR BASIC 1.1
(C) 1982 TANDY

OK`}<span className="coco-cursor">█</span></pre>
      <div className="boss-hint coco-hint">{hint}</div>
    </div>
  );
}

// ---- Unitron AP II (BR Apple II Plus clone, Portuguese ROM) ----------------
// Verified: faithful Apple II+ clone with a Portuguese-translated ROM and
// Apple DOS 3.3. Shows the "Apple ][" banner and ] prompt; here with a small
// Portuguese "PRONTO" nod to its localized ROM.
function Unitron({ hint }: { hint: string }) {
  return (
    <div className="boss-screen boss-apple2 boss-unitron">
      <pre className="apple2-text">{`Apple ][

UNITRON AP II

]`}<span className="apple2-cursor">▉</span></pre>
      <div className="boss-hint apple2-hint">{hint}</div>
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
    case "amiga":
      return <Amiga />;
    case "apple1":
      return <Apple1 />;
    case "appleii":
      return <AppleII hint={hint} />;
    case "appleii1977":
      return <AppleII1977 hint={hint} />;
    case "appleiic":
      return <AppleIIc hint={hint} />;
    case "appleiigs":
      return <AppleIIgs hint={hint} />;
    case "appleiiplus":
      return <AppleIIPlus hint={hint} />;
    case "atari800xl":
      return <Atari800XL hint={hint} />;
    case "at286":
      return <At286 hint={hint} />;
    case "bbcmicro":
      return <BbcMicro hint={hint} />;
    case "coco":
      return <Coco hint={hint} />;
    case "cp300":
      return <Cp300 hint={hint} />;
    case "cp400":
      return <Cp400 hint={hint} />;
    case "cp500":
      return <Cp500 hint={hint} />;
    case "cpc464":
      return <Cpc464 hint={hint} />;
    case "expert":
      return <Expert hint={hint} />;
    case "hotbit":
      return <Hotbit hint={hint} />;
    case "ibmpc":
      return <IbmPc hint={hint} />;
    case "macintosh":
      return <Macintosh />;
    case "msx1":
      return <Msx1 hint={hint} />;
    case "msxturbor":
      return <MsxTurboR hint={hint} />;
    case "pc386":
      return <Pc386 hint={hint} />;
    case "ti99":
      return <Ti99 />;
    case "trs80":
      return <Trs80 hint={hint} />;
    case "netware":
      return <NetWare hint={hint} />;
    case "pcboard":
      return <PCBoard hint={hint} />;
    case "videotexto":
      return <Videotexto hint={hint} />;
    case "oblivion":
      return <Oblivion hint={hint} />;
    case "remoteaccess":
      return <RemoteAccess hint={hint} />;
    case "telegard":
      return <Telegard hint={hint} />;
    case "amipro":
      return <AmiPro hint={hint} />;
    case "clipper":
      return <Clipper hint={hint} />;
    case "dbase2":
      return <DBase2 hint={hint} />;
    case "harvard":
      return <HarvardGraphics hint={hint} />;
    case "msworks":
      return <MSWorks hint={hint} />;
    case "multimate":
      return <MultiMate hint={hint} />;
    case "profwrite":
      return <ProfessionalWrite hint={hint} />;
    case "sidekick":
      return <SideKick hint={hint} />;
    case "xtreegold":
      return <XTreeGold hint={hint} />;
    case "xtreepro":
      return <XTreePro hint={hint} />;
    case "aol":
      return <AOL hint={hint} />;
    case "compuserve":
      return <CompuServe hint={hint} />;
    case "macfinder":
      return <MacFinder hint={hint} />;
    case "mosaic":
      return <Mosaic hint={hint} />;
    case "os2warp":
      return <OS2Warp hint={hint} />;
    case "wfw311":
      return <WinWorkgroups hint={hint} />;
    case "zxspectrum2a":
      return (
        <AmstradSpectrum badge="128 +2A" cls="boss-s2a" drive="Drive M: available." hint={hint} />
      );
    case "zxspectrum3":
      return (
        <AmstradSpectrum badge="128 +3" cls="boss-s3" drive="Drive M: available." hint={hint} />
      );
    case "esxi":
      return <ESXi hint={hint} />;
    case "sniffer":
      return <Sniffer hint={hint} />;
    case "snifferconficker":
      return <SnifferDecode capture={CAP_CONFICKER} hint={hint} />;
    case "snifferhttp420":
      return <SnifferDecode capture={CAP_HTTP420} hint={hint} />;
    case "snifferiloveyou":
      return <SnifferDecode capture={CAP_ILOVEYOU} hint={hint} />;
    case "sniffermirai":
      return <SnifferDecode capture={CAP_MIRAI} hint={hint} />;
    case "sniffermorris":
      return <SnifferDecode capture={CAP_MORRIS} hint={hint} />;
    case "snifferpetya":
      return <SnifferDecode capture={CAP_PETYA} hint={hint} />;
    case "snifferstuxnet":
      return <SnifferDecode capture={CAP_STUXNET} hint={hint} />;
    case "snifferwannacry":
      return <SnifferDecode capture={CAP_WANNACRY} hint={hint} />;
    case "tk82c":
      return <TK82C />;
    case "tk90x":
      return <TK90X />;
    case "tk95":
      return <TK95 />;
    case "unitron":
      return <Unitron hint={hint} />;
    case "vic20":
      return <Vic20 />;
    case "zx81":
      return <ZX81 />;
    case "zxspectrum":
      return <ZXSpectrum />;
    case "zxspectrum128":
      return <ZXSpectrum128 />;
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
