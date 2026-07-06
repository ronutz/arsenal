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
// The 128's blue-bordered start MENU (the English +2/128 layout).
const S128_MENU = ["128 BASIC", "Calculator", "48 BASIC", "Tape Tester"] as const;
function ZXSpectrum128() {
  return (
    <div className="boss-screen boss-s128">
      <div className="s128-inner">
        <div className="s128-copy">© 1986 Sinclair Research Ltd</div>
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
// NOTE for PRIME: the login-prompt wording ("First name:") is kept generic;
// the exact PCBoard default prompt was not source-verified this session.
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
          First name: RODOLFO<span className="bbs-cursor">▌</span>
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
// The real machine boots to a blank paper screen with its OWN name on the
// bottom line: "TK90X - Color Computer". No Sinclair line, no (c), no year.
// Verbatim from the ROM: the v1 and v2 dumps both carry the string at 0x3AAE,
// padded with leading spaces to centre it on the 32-column screen (hence the
// text-align: center rule). Cross-checked against real-hardware video.
function TK90X() {
  return (
    <div className="boss-screen boss-tk90x">
      <div className="spectrum-field" />
      <div className="tk90x-copy">TK90X - Color Computer</div>
      <div className="spectrum-stripes" aria-hidden="true">
        <span style={{ background: "#d7d700" }} />
        <span style={{ background: "#00d7d7" }} />
        <span style={{ background: "#00d700" }} />
        <span style={{ background: "#d700d7" }} />
      </div>
    </div>
  );
}

// ---- Microdigital TK95 (BR ZX Spectrum clone, TK90X successor) -------------
// Per Coopermiti's museum notes the TK95's only ROM change from the TK90X was
// the boot line, and the ROM dump agrees: at 0x3AB1 it reads simply
// "TK Color Computer", centred by leading spaces baked into the string.
function TK95() {
  return (
    <div className="boss-screen boss-tk95">
      <div className="spectrum-field" />
      <div className="tk90x-copy">TK Color Computer</div>
      <div className="spectrum-stripes" aria-hidden="true">
        <span style={{ background: "#d7d700" }} />
        <span style={{ background: "#00d7d7" }} />
        <span style={{ background: "#00d700" }} />
        <span style={{ background: "#d700d7" }} />
      </div>
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
