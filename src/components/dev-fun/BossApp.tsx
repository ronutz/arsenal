// ============================================================================
// src/components/dev-fun/BossApp.tsx
// ----------------------------------------------------------------------------
// THE "BOSS KEY". Press it and the Mega Brain vanishes behind a convincing
// 1980s work application; any key or click brings the console straight back.
// Two period-accurate mocks, chosen at random by the caller:
//
//   - Lotus 1-2-3 (DOS, Release 2.x): the A1 control panel with a READY mode
//     indicator, reverse-video column-letter / row-number frame, and a bottom
//     status line with CALC/NUM. The worksheet is a plausible FY budget whose
//     numbers actually add up (a nod to anyone who checks).
//   - WordStar (DOS): the status line (file, PAGE/LINE/COL, INSERT ON), the
//     iconic Main Menu block of Ctrl-key commands, a ruler line, and a memo.
//
// None of this computes anything — it is flavour. Client component: it installs
// a window keydown listener while mounted so ANY key dismisses, and the overlay
// itself dismisses on click.
// ============================================================================

"use client";

import { useEffect } from "react";

interface BossAppProps {
  kind: "lotus" | "wordstar";
  onDismiss: () => void;
}

// ---- Lotus 1-2-3 -----------------------------------------------------------
const LOTUS_COLS = ["A", "B", "C", "D", "E"] as const;
// [rowNumber, [A, B, C, D, E]]. Column A holds labels (left-aligned); B-E hold
// numbers (right-aligned). Totals foot: e.g. 12,500+13,200+14,100 = 39,800, and
// the Q columns sum to 155,900 both ways.
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

function Lotus() {
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
        <span className="boss-hint">‹ press any key ›</span>
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

function WordStar() {
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
      <div className="boss-hint ws-hint">‹ press any key ›</div>
    </div>
  );
}

export default function BossApp({ kind, onDismiss }: BossAppProps) {
  // Any key returns to the console. Listener lives on window so focus does not
  // matter; cleaned up when the boss app unmounts.
  useEffect(() => {
    const onKey = () => onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="boss-overlay"
      role="button"
      tabIndex={0}
      aria-label="Aplicação de trabalho. Pressione qualquer tecla ou clique para voltar ao console."
      onClick={onDismiss}
    >
      {kind === "lotus" ? <Lotus /> : <WordStar />}
    </div>
  );
}
