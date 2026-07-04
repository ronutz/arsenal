"use client";

// ============================================================================
// src/components/dev-fun/MegaBrainConsole.tsx
// ----------------------------------------------------------------------------
// /dev/fun — CONSOLE DO MEGA BRAIN. A deliberately over-the-top pt-BR parody of
// the Thiago Finch "Mega Brain" meme ("use todo o poder do seu Mega Brain",
// "força total"), which the Brazilian dev community loves to mock. Drag the
// FORÇA lever to 100%, watch the brain go supernova, collect the catchphrases.
// It computes nothing and grounds nothing: it is a stress reliever. Pure client
// theatre. Strings are hard-coded pt-BR by design (the page redirects every
// other locale here).
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

// Milestone lines, drawn from the meme lore. Keyed by the threshold reached.
const MILESTONES: { at: number; line: string }[] = [
  { at: 0, line: "Mega Brain em repouso. 🧠" },
  { at: 1, line: "Aquecendo o Mega Brain…" },
  { at: 25, line: "Mega Brain aquecido! Sente a potência chegando. ⚡" },
  { at: 50, line: "ATIVA o Mega Brain! Usa MAIS contexto!" },
  { at: 75, line: "Quase na força total! Não é sobre a sintaxe do prompt, é sobre a INTENÇÃO! 🧠🔥" },
  { at: 100, line: "🧠🤯⚡ FORÇA TOTAL DO MEGA BRAIN! Usa TODO o poder e pesquisa termos inteligentes!" },
];

function milestoneFor(power: number): { at: number; line: string } {
  let m = MILESTONES[0];
  for (const cand of MILESTONES) if (power >= cand.at) m = cand;
  return m;
}

// Power tier drives the escalating visuals.
function tierFor(power: number): number {
  if (power >= 100) return 5;
  if (power >= 75) return 4;
  if (power >= 50) return 3;
  if (power >= 25) return 2;
  if (power >= 1) return 1;
  return 0;
}

// The Mano Deyvin homage button is hidden for now (PRIME request). Flip to
// true to bring the "🍺 O react do Mano" reality-check button (and its
// overlay) back.
const SHOW_MANO_BUTTON = false;

export default function MegaBrainConsole() {
  const [power, setPower] = useState(0);
  const [terms, setTerms] = useState(0); // fake "termos inteligentes pesquisados" counter
  const rampRef = useRef<number | null>(null);
  const [reacting, setReacting] = useState(false); // Mano Deyvin reality-check overlay
  const manoTimerRef = useRef<number | null>(null);

  const tier = tierFor(power);
  const milestone = milestoneFor(power);
  const atTotal = power >= 100;

  // The "termos inteligentes" counter only ticks at total force. Dopamine.
  useEffect(() => {
    if (!atTotal) return;
    const id = window.setInterval(() => setTerms((t) => t + Math.floor(3 + Math.random() * 12)), 130);
    return () => window.clearInterval(id);
  }, [atTotal]);

  // Cancel any ramp on unmount.
  useEffect(() => () => {
    if (rampRef.current) cancelAnimationFrame(rampRef.current);
    if (manoTimerRef.current) window.clearTimeout(manoTimerRef.current);
  }, []);

  const stopRamp = () => { if (rampRef.current) { cancelAnimationFrame(rampRef.current); rampRef.current = null; } };

  // FORÇA TOTAL button: satisfying ramp from wherever you are to 100%.
  const forcaTotal = useCallback(() => {
    stopRamp();
    const start = performance.now();
    const from = power;
    const dur = 1400;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      // easeOutCubic for a punchy finish
      const eased = 1 - Math.pow(1 - p, 3);
      setPower(Math.round(from + (100 - from) * eased));
      if (p < 1) rampRef.current = requestAnimationFrame(step);
      else rampRef.current = null;
    };
    rampRef.current = requestAnimationFrame(step);
  }, [power]);

  const desligar = () => { stopRamp(); setPower(0); setTerms(0); };

  const onLever = (v: number) => { stopRamp(); setPower(v); };

  // Shout-out to Mano Deyvin, whose react sparked the whole meme. Fittingly,
  // his button is the reality check: it deflates the hype (that is his bit).
  const reactDoMano = () => {
    stopRamp();
    setPower(0);
    setTerms(0);
    setReacting(true);
    if (manoTimerRef.current) window.clearTimeout(manoTimerRef.current);
    manoTimerRef.current = window.setTimeout(() => setReacting(false), 4200);
  };

  // Brain scale + glow scale with power.
  const scale = 1 + (power / 100) * 0.7;
  const glow = 6 + (power / 100) * 60;

  return (
    <div className={`mb-console mb-tier-${tier}`} data-total={atTotal ? "1" : "0"}>
      <div className="mb-titlebar">
        <span className="mb-dot" /><span className="mb-dot" /><span className="mb-dot" />
        <span className="mb-titlebar-text mono">/dev/fun — console_do_mega_brain.exe</span>
        <Link href="/tools" className="mb-close" aria-label="Fechar janela e voltar às ferramentas" title="Fechar janela">✕</Link>
      </div>

      <div className="mb-stage" aria-hidden="true">
        <div className="mb-aura" style={{ opacity: 0.15 + (power / 100) * 0.85, transform: `scale(${1 + power / 60})` }} />
        <div className="mb-brain-scale" style={{ transform: `scale(${scale})` }}>
          <div
            className="mb-brain"
            style={{ filter: `drop-shadow(0 0 ${glow}px rgba(255,45,149,${0.3 + power / 130})) drop-shadow(0 0 ${glow / 2}px rgba(34,211,238,${power / 160}))` }}
          >
            🧠
          </div>
        </div>
        {tier >= 4 && <div className="mb-rays" />}
      </div>

      <div className="mb-readout" role="status" aria-live="polite">
        <div className="mb-percent mono">{power}<span className="mb-percent-sign">%</span></div>
        <div key={milestone.at} className="mb-milestone">{milestone.line}</div>
      </div>

      <div className="mb-powerbar">
        <div className="mb-powerbar-fill" style={{ width: `${power}%` }} />
        <span className="mb-powerbar-label mono">POTÊNCIA DO MEGA BRAIN</span>
      </div>

      <div className="mb-lever-wrap">
        <label htmlFor="mb-lever" className="mb-lever-label mono">FORÇA</label>
        <input
          id="mb-lever"
          className="mb-lever"
          type="range"
          min={0}
          max={100}
          value={power}
          onChange={(e) => onLever(parseInt(e.target.value, 10))}
          aria-label="Força do Mega Brain"
        />
      </div>

      <div className="mb-buttons">
        <button type="button" className="mb-btn mb-btn-forca" onClick={forcaTotal}>
          ⚡ FORÇA TOTAL
        </button>
        {SHOW_MANO_BUTTON && (
          <button type="button" className="mb-btn mb-btn-mano" onClick={reactDoMano}>
            🍺 O react do Mano
          </button>
        )}
        <button type="button" className="mb-btn mb-btn-off" onClick={desligar}>
          desligar
        </button>
      </div>

      {reacting && (
        <div className="mb-mano-overlay" role="status" onClick={() => setReacting(false)}>
          <div className="mb-mano-card">
            <p className="mb-mano-emoji">🍺</p>
            <p className="mb-mano-line">REALITY CHECK</p>
            <p className="mb-mano-sub">Calma no hype: no fim, é só engenharia de prompt com boa comunicação. E tá tudo bem.</p>
            <p className="mb-mano-credit">
              Homenagem ao{" "}
              <a href="https://youtube.com/@manodeyvin" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Mano Deyvin</a>
              , o react que começou a zoeira. 🤙
            </p>
          </div>
        </div>
      )}

      {atTotal && (
        <div className="mb-total-banner">
          <p className="mb-total-line">MODO FORÇA TOTAL ATIVADO 🧠🤯⚡</p>
          <p className="mb-total-sub mono">termos inteligentes pesquisados: {terms.toLocaleString("pt-BR")}</p>
          <p className="mb-total-fine">Copy Chief acionado no sistema. Investigando a atualidade do mercado…</p>
        </div>
      )}

      <p className="mb-disclaimer">
        Isto não computa, não otimiza e não pesquisa termo nenhum. É um alívio de estresse. Se sentiu a dopamina, funcionou.
      </p>
    </div>
  );
}
