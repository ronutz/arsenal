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
import BossApp from "@/components/dev-fun/BossApp";

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

// FAIL-SAFE LORE: when the Mega Brain burns out, the console fails over to
// "modo Go Horse", a homage to eXtreme Go Horse (XGH), the legendary Brazilian
// satire of deadline-driven development (gohorseprocess.com.br, 22 axioms).
// Axiom nº 1 is quoted verbatim (its four-word signature line, with credit in
// the banner); every other line below is an ORIGINAL Mega Brain riff written in
// the same spirit, deliberately NOT a reproduction of the manifesto.
const XGH_AXIOMS: string[] = [
  "Axioma nº 1: “Pensou, não é XGH.”",
  "Deploy na sexta: o cérebro descansa, a produção se vira.",
  "Se compilou, tá pronto. Se rodou, tá entregue.",
  "Bug em produção é só um teste executado pelo cliente.",
  "Gambiarra que funciona de primeira vira arquitetura oficial.",
  "A documentação é o código. Boa sorte aí.",
  "Rollback é para quem planejou ter volta.",
  "“Funciona na minha máquina” agora é SLA.",
  "Estimativa de prazo: era pra ontem, então relaxa.",
];

export default function MegaBrainConsole() {
  const [power, setPower] = useState(0);
  const [terms, setTerms] = useState(0); // fake "termos inteligentes pesquisados" counter
  const rampRef = useRef<number | null>(null);
  const [reacting, setReacting] = useState(false); // Mano Deyvin reality-check overlay
  const manoTimerRef = useRef<number | null>(null);
  // Boss key: which mock work-app is showing (null = console visible).
  const [bossApp, setBossApp] = useState<null | "lotus" | "wordstar">(null);
  // FAIL-SAFE (red dot): `burnout` is the brief overload transition, `goHorse`
  // the engaged mode. prevPowerRef remembers the power to restore on disengage;
  // failTimerRef drives the burnout -> Go Horse handover; axiomIdx cycles lore.
  const [burnout, setBurnout] = useState(false);
  const [goHorse, setGoHorse] = useState(false);
  const [axiomIdx, setAxiomIdx] = useState(0);
  const failTimerRef = useRef<number | null>(null);
  const prevPowerRef = useRef(0);

  // Visuals run on fxPower: Go Horse mode pins the meter at "infinite
  // productivity" (100) regardless of the real power, which burnout zeroed.
  const fxPower = goHorse ? 100 : power;
  const tier = tierFor(fxPower);
  const milestone = milestoneFor(power);
  const atTotal = power >= 100;

  // The "termos inteligentes" counter only ticks at total force. Dopamine.
  useEffect(() => {
    if (!atTotal) return;
    const id = window.setInterval(() => setTerms((t) => t + Math.floor(3 + Math.random() * 12)), 130);
    return () => window.clearInterval(id);
  }, [atTotal]);

  // Go Horse mode: cycle the axiom lore on a lazy interval.
  useEffect(() => {
    if (!goHorse) return;
    const id = window.setInterval(() => setAxiomIdx((i) => (i + 1) % XGH_AXIOMS.length), 3200);
    return () => window.clearInterval(id);
  }, [goHorse]);

  // Cancel any ramp on unmount.
  useEffect(() => () => {
    if (rampRef.current) cancelAnimationFrame(rampRef.current);
    if (manoTimerRef.current) window.clearTimeout(manoTimerRef.current);
    if (failTimerRef.current) window.clearTimeout(failTimerRef.current);
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

  // "desligar" is the master reset: it also clears a burnout / Go Horse state.
  const desligar = () => {
    stopRamp();
    if (failTimerRef.current) { window.clearTimeout(failTimerRef.current); failTimerRef.current = null; }
    setBurnout(false);
    setGoHorse(false);
    setPower(0);
    setTerms(0);
  };

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

  // Boss key: hide the console behind a random 1980s work app (Lotus 1-2-3
  // or WordStar). Any key/click in BossApp brings the console back.
  const bossKey = () => setBossApp(Math.random() < 0.5 ? "lotus" : "wordstar");

  // FAIL-SAFE (the red dot). First press: the Mega Brain overloads (burnout
  // shudder, ~1.5s), then the console fails over to "modo Go Horse", where
  // thinking is disabled by design (Axioma nº 1) and productivity reads ∞.
  // Second press restores the exact pre-burnout power. PRIME's spec: "Mega
  // Brain is suffering burnout, ENGAGE GO-HORSE FTW!"
  const failSafe = () => {
    if (failTimerRef.current) { window.clearTimeout(failTimerRef.current); failTimerRef.current = null; }
    if (goHorse || burnout) {
      // Disengage: bring the Mega Brain back exactly where it was.
      setBurnout(false);
      setGoHorse(false);
      setPower(prevPowerRef.current);
      return;
    }
    stopRamp();
    prevPowerRef.current = power;
    setPower(0); // the brain gives out
    setTerms(0);
    setBurnout(true);
    failTimerRef.current = window.setTimeout(() => {
      setBurnout(false);
      setAxiomIdx(0);
      setGoHorse(true);
      failTimerRef.current = null;
    }, 1500);
  };

  // Brain scale + glow scale with power.
  const scale = 1 + (fxPower / 100) * 0.7;
  const glow = 6 + (fxPower / 100) * 60;

  return (
    <>
    <div className={`mb-console mb-tier-${tier}${burnout ? " mb-burnout" : ""}${goHorse ? " mb-goh" : ""}`} data-total={atTotal ? "1" : "0"}>
      <div className="mb-titlebar">
        <button
          type="button"
          className="mb-dot mb-dot-failsafe"
          onClick={failSafe}
          aria-pressed={goHorse || burnout}
          aria-label={goHorse || burnout ? "Desativar o fail-safe e restaurar o Mega Brain" : "Fail-safe: em caso de burnout, engajar modo Go Horse"}
          title={goHorse || burnout ? "Restaurar o Mega Brain" : "FAIL-SAFE: burnout? ENGAGE GO-HORSE FTW!"}
        />
        <button type="button" className="mb-dot mb-dot-mano" onClick={reactDoMano} aria-label="Homenagem ao Mano Deyvin" title="O react do Mano" />
        <button type="button" className="mb-dot mb-dot-boss" onClick={bossKey} aria-label="Botão do chefe: minimiza o console" title="Botão do chefe" />
        <span className="mb-titlebar-text mono">/dev/fun — console_do_mega_brain.exe</span>
        {/* PRIME 04/07/2026: the frame carries the site's own address, and both
            it and the ✕ exit to the home page (the ✕ used to go to /tools). */}
        <Link href="/" className="mb-titlebar-url mono" title="ronutz.com">ronutz.com/</Link>
        <Link href="/" className="mb-close" aria-label="Fechar janela e voltar à página inicial" title="Fechar janela">✕</Link>
      </div>

      <div className="mb-stage" aria-hidden="true">
        <div className="mb-aura" style={{ opacity: 0.15 + (fxPower / 100) * 0.85, transform: `scale(${1 + fxPower / 60})` }} />
        <div className="mb-brain-scale" style={{ transform: `scale(${scale})` }}>
          <div
            className="mb-brain"
            style={{ filter: `drop-shadow(0 0 ${glow}px rgba(255,45,149,${0.3 + fxPower / 130})) drop-shadow(0 0 ${glow / 2}px rgba(34,211,238,${fxPower / 160}))` }}
          >
            {goHorse ? "🐴" : burnout ? "🫠" : "🧠"}
          </div>
        </div>
        {tier >= 4 && <div className="mb-rays" />}
        {goHorse && <div className="mb-gallop">🐴</div>}
      </div>

      {/* aria-live goes quiet in Go Horse mode; the axiom carousel would spam
          screen readers on every 3.2s tick otherwise. */}
      <div className="mb-readout" role="status" aria-live={goHorse ? "off" : "polite"}>
        <div className="mb-percent mono">{goHorse ? "∞" : burnout ? "ERR" : power}<span className="mb-percent-sign">%</span></div>
        <div key={goHorse ? `xgh-${axiomIdx}` : burnout ? "burnout" : milestone.at} className="mb-milestone">
          {goHorse ? XGH_AXIOMS[axiomIdx] : burnout ? "⚠ SOBRECARGA CRÍTICA: BURNOUT DO MEGA BRAIN DETECTADO" : milestone.line}
        </div>
      </div>

      <div className="mb-powerbar">
        <div className={`mb-powerbar-fill${goHorse ? " mb-powerbar-fill-goh" : ""}`} style={{ width: `${fxPower}%` }} />
        <span className="mb-powerbar-label mono">{goHorse ? "PRODUTIVIDADE XGH" : "POTÊNCIA DO MEGA BRAIN"}</span>
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
          disabled={goHorse || burnout}
          title={goHorse ? "Pensou, não é XGH." : undefined}
        />
      </div>
      <p className="mb-lever-hint mono">{goHorse ? "pensar está temporariamente desativado (Axioma nº 1)" : "arraste o controle para carregar o poder"}</p>

      <div className="mb-buttons">
        <button type="button" className="mb-btn mb-btn-forca" onClick={forcaTotal} disabled={goHorse || burnout} title={goHorse || burnout ? "Pensou, não é XGH." : undefined}>
          ⚡ FORÇA TOTAL
        </button>
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

      {(burnout || goHorse) && (
        <div className={`mb-goh-banner ${goHorse ? "is-goh" : "is-burnout"}`} role="status">
          {goHorse ? (
            <>
              <p className="mb-goh-line">🐴 FAIL-SAFE ATIVADO: ENGAGE GO-HORSE FTW!</p>
              <p className="mb-goh-sub mono">pensar: DESATIVADO · produtividade: ∞ · qualidade: detalhe</p>
              <p className="mb-goh-fine">
                Homenagem ao lendário{" "}
                <a href="https://gohorseprocess.com.br/extreme-go-horse-xgh/" target="_blank" rel="noopener noreferrer">eXtreme Go Horse (XGH)</a>
                . O botão vermelho restaura o Mega Brain.
              </p>
            </>
          ) : (
            <>
              <p className="mb-goh-line">⚠ BURNOUT DO MEGA BRAIN DETECTADO</p>
              <p className="mb-goh-sub mono">acionando fail-safe…</p>
            </>
          )}
        </div>
      )}

      <p className="mb-disclaimer">
        Isto não computa, não otimiza e não pesquisa termo nenhum. É um alívio de estresse. Se sentiu a dopamina, funcionou.
      </p>
    </div>
    {bossApp && <BossApp kind={bossApp} onDismiss={() => setBossApp(null)} />}
    </>
  );
}
