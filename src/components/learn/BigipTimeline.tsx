"use client";

// ============================================================================
// src/components/learn/BigipTimeline.tsx
// ----------------------------------------------------------------------------
// An interactive BIG-IP + TMOS version timeline, embedded in a Learn article.
// Drag the year slider; the card shows the BIG-IP software version of that era
// and the operating system underneath it (BSD -> TMOS -> F5OS). Year-level
// accuracy by design.
//
// GROUNDING (every date is sourced, not remembered):
//   - v9.0 = 2004, TMOS introduced (BSD -> Linux system management + the TMM
//     microkernel; hardware "BIG-IP" and software "TMOS" split): F5, Inc.
//     history + PacketPushers "What The Heck Is F5 Networks' TMOS?".
//   - 12.0 = 02 Sep 2015: F5 K33062581 (TMOS Software Release Date Information).
//   - 15.0 = 23 May 2019, 16.0 = 16 Jul 2020, 17.0 = 26 Apr 2022: F5 release
//     notes / endoflife.date (which links to the F5 release notes).
//   - 21.0 = 06 Nov 2025: F5 K9412 (the BIG-IP release matrix). The line jumps
//     17 -> 21 because 18-20 were BIG-IP Next, which F5 DISCONTINUED (final 20.3
//     reached end of life 30 Apr 2025; K5903 / K000152956); TMOS resumes at 21.
//   - 10.0 (2008), 11.0 (2011), 13.0 (2017), 14.0 (2018): the widely documented
//     major-release years for those (now end-of-life) branches.
//   - F5OS (VELOS chassis / rSeries appliance, BIG-IP as a tenant): from ~2021,
//     per F5 K9412 / K86001294.
// This widget states facts and computes nothing about a live system.
// ============================================================================

import { useMemo, useState } from "react";

type Lang = "en" | "pt";
type OsKey = "bsd" | "tmos" | "f5os";

interface Release {
  readonly year: number;
  readonly ver: string;
  readonly os: string;
  readonly osKey: OsKey;
  readonly note: { en: string; pt: string };
  readonly hard?: boolean; // hard F5-sourced date vs widely-documented year
}

const RELEASES: readonly Release[] = [
  { year: 1997, ver: "BIG-IP Controller", os: "BSD", osKey: "bsd", note: {
    en: "F5's first BIG-IP. Hardware and software were both simply called 'BIG-IP', running on a BSD base.",
    pt: "O primeiro BIG-IP da F5. Hardware e software eram ambos chamados apenas de 'BIG-IP', rodando sobre uma base BSD." } },
  { year: 2001, ver: "BIG-IP v4.x", os: "BSD", osKey: "bsd", note: {
    en: "The pre-TMOS era, still BSD-based. The platform and the software had not yet split.",
    pt: "A era pré-TMOS, ainda baseada em BSD. A plataforma e o software ainda não tinham se separado." } },
  { year: 2004, ver: "BIG-IP 9.0", os: "TMOS", osKey: "tmos", hard: true, note: {
    en: "TMOS is introduced. System management moves from BSD to Linux, and the Traffic Management Microkernel (TMM) is created to talk to the hardware. From here, the hardware is the 'BIG-IP platform' and the software is 'TMOS'.",
    pt: "O TMOS é introduzido. A gestão do sistema migra de BSD para Linux, e o Traffic Management Microkernel (TMM) é criado para falar com o hardware. A partir daqui, o hardware é a 'plataforma BIG-IP' e o software é o 'TMOS'." } },
  { year: 2008, ver: "BIG-IP 10.0", os: "TMOS 10.x", osKey: "tmos", note: {
    en: "The 10.x branch. TMM and the module model (LTM, GTM, ASM, APM) mature.",
    pt: "O ramo 10.x. O TMM e o modelo de módulos (LTM, GTM, ASM, APM) amadurecem." } },
  { year: 2011, ver: "BIG-IP 11.0", os: "TMOS 11.x", osKey: "tmos", note: {
    en: "The 11.x branch, a long-lived generation. vCMP and clustered multiprocessing spread across the VIPRION chassis line.",
    pt: "O ramo 11.x, uma geração de vida longa. vCMP e o clustered multiprocessing se espalham pela linha de chassis VIPRION." } },
  { year: 2015, ver: "BIG-IP 12.0", os: "TMOS 12.x", osKey: "tmos", hard: true, note: {
    en: "From 12.0, F5 adopts the alternating Major Release / Long-Term Stability Release model that still governs the line.",
    pt: "A partir da 12.0, a F5 adota o modelo alternado de Major Release / Long-Term Stability Release que ainda rege a linha." } },
  { year: 2017, ver: "BIG-IP 13.0", os: "TMOS 13.x", osKey: "tmos", note: {
    en: "The 13.x branch. From 13.0 the diagnostics (EUD) image is no longer bundled in the base install image.",
    pt: "O ramo 13.x. A partir da 13.0 a imagem de diagnóstico (EUD) deixa de vir embutida na imagem base de instalação." } },
  { year: 2018, ver: "BIG-IP 14.0", os: "TMOS 14.x", osKey: "tmos", note: {
    en: "The 14.x branch, on the iSeries and VIPRION platforms of the day.",
    pt: "O ramo 14.x, nas plataformas iSeries e VIPRION da época." } },
  { year: 2019, ver: "BIG-IP 15.0", os: "TMOS 15.x", osKey: "tmos", hard: true, note: {
    en: "The 15.x branch (15.1 is its Long-Term Stability release).",
    pt: "O ramo 15.x (a 15.1 é a sua versão Long-Term Stability)." } },
  { year: 2020, ver: "BIG-IP 16.0", os: "TMOS 16.x", osKey: "tmos", hard: true, note: {
    en: "The 16.x branch (16.1 is its Long-Term Stability release).",
    pt: "O ramo 16.x (a 16.1 é a sua versão Long-Term Stability)." } },
  { year: 2021, ver: "VELOS + F5OS", os: "F5OS", osKey: "f5os", note: {
    en: "A new platform OS arrives: F5OS. The VELOS chassis (F5OS-C) and, alongside it, the rSeries appliances (F5OS-A) run BIG-IP as a tenant on top of F5OS, rather than TMOS owning the whole box.",
    pt: "Um novo sistema operacional de plataforma chega: o F5OS. O chassis VELOS (F5OS-C) e, ao lado dele, os appliances rSeries (F5OS-A) rodam o BIG-IP como um tenant sobre o F5OS, em vez de o TMOS ser dono da caixa inteira." } },
  { year: 2022, ver: "BIG-IP 17.0", os: "TMOS 17.x", osKey: "tmos", hard: true, note: {
    en: "The 17.x branch (17.1 and 17.5 are Long-Term Stability releases). It runs on iSeries and VIPRION, and as a tenant on VELOS and rSeries (F5OS).",
    pt: "O ramo 17.x (a 17.1 e a 17.5 são versões Long-Term Stability). Roda em iSeries e VIPRION, e como tenant em VELOS e rSeries (F5OS)." } },
  { year: 2025, ver: "BIG-IP 21.0", os: "TMOS 21.x", osKey: "tmos", hard: true, note: {
    en: "The version number jumps 17 -> 21. The 18-20 range was BIG-IP Next, which F5 discontinued (the final 20.3 reached end of life on 30 April 2025), returning to the modernized TMOS line at 21.0.",
    pt: "O número de versão salta de 17 para 21. A faixa 18-20 foi o BIG-IP Next, que a F5 descontinuou (a 20.3 final chegou ao fim de vida em 30 de abril de 2025), retornando à linha TMOS modernizada na 21.0." } },
];

const OS_LABEL: Record<OsKey, { en: string; pt: string }> = {
  bsd: { en: "BSD-based", pt: "Baseado em BSD" },
  tmos: { en: "TMOS (Linux host + TMM)", pt: "TMOS (host Linux + TMM)" },
  f5os: { en: "F5OS (BIG-IP runs as a tenant)", pt: "F5OS (BIG-IP roda como tenant)" },
};

const T = {
  en: {
    heading: "BIG-IP + TMOS timeline",
    drag: "Drag the year",
    version: "BIG-IP software",
    os: "Operating system",
    approx: "release year (this branch is end-of-life; year is widely documented)",
    hard: "release date on F5's record",
    legend: "OS lineage",
    sources: "Dates from F5's release records (K33062581, K9412) and release notes; the TMOS-introduction year from F5 company history. BIG-IP Next (18-20) is discontinued and excluded.",
  },
  pt: {
    heading: "Linha do tempo BIG-IP + TMOS",
    drag: "Arraste o ano",
    version: "Software BIG-IP",
    os: "Sistema operacional",
    approx: "ano de lançamento (este ramo é fim de vida; o ano é amplamente documentado)",
    hard: "data de lançamento no registro da F5",
    legend: "Linhagem de SO",
    sources: "Datas dos registros de lançamento da F5 (K33062581, K9412) e das release notes; o ano de introdução do TMOS vem do histórico da empresa F5. O BIG-IP Next (18-20) está descontinuado e excluído.",
  },
} as const;

const MIN_YEAR = 1997;
const MAX_YEAR = 2026;

export default function BigipTimeline({ lang = "en" as Lang }: { lang?: Lang }) {
  const [year, setYear] = useState(2004);
  const t = T[lang];

  const active = useMemo(() => {
    let r = RELEASES[0];
    for (const cand of RELEASES) if (year >= cand.year) r = cand;
    return r;
  }, [year]);

  const pct = (y: number) => ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div className={`bt-widget bt-os-${active.osKey}`}>
      <div className="bt-head">
        <span className="bt-heading">{t.heading}</span>
        <span className="bt-year mono">{year}</span>
      </div>

      <div className="bt-track-wrap">
        <div className="bt-track" aria-hidden="true">
          {/* OS era bands */}
          <div className="bt-band bt-band-bsd" style={{ left: `${pct(MIN_YEAR)}%`, width: `${pct(2004) - pct(MIN_YEAR)}%` }} />
          <div className="bt-band bt-band-tmos" style={{ left: `${pct(2004)}%`, width: `${pct(MAX_YEAR) - pct(2004)}%` }} />
          <div className="bt-band bt-band-f5os" style={{ left: `${pct(2021)}%`, width: `${pct(MAX_YEAR) - pct(2021)}%` }} />
          {/* release ticks */}
          {RELEASES.map((r) => (
            <span key={r.year} className={`bt-tick ${year >= r.year ? "bt-tick-past" : ""}`} style={{ left: `${pct(r.year)}%` }} title={`${r.ver} (${r.year})`} />
          ))}
        </div>
        <input
          className="bt-slider"
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          aria-label={t.drag}
        />
        <div className="bt-scale mono" aria-hidden="true">
          <span>{MIN_YEAR}</span><span>2004</span><span>2015</span><span>{MAX_YEAR}</span>
        </div>
      </div>

      <div className="bt-card">
        <div className="bt-card-row">
          <span className="bt-card-label">{t.version}</span>
          <span className="bt-card-ver">{active.ver} <span className="bt-card-year mono">· {active.year}</span></span>
        </div>
        <div className="bt-card-row">
          <span className="bt-card-label">{t.os}</span>
          <span className={`bt-os-badge bt-osb-${active.osKey}`}>{OS_LABEL[active.osKey][lang]}</span>
        </div>
        <p className="bt-note">{active.note[lang]}</p>
        <p className="bt-date-kind mono">{active.hard ? `✓ ${t.hard}` : t.approx}</p>
      </div>

      <div className="bt-legend" aria-hidden="true">
        <span className="bt-legend-item"><span className="bt-legend-dot bt-osb-bsd" /> BSD</span>
        <span className="bt-legend-item"><span className="bt-legend-dot bt-osb-tmos" /> TMOS</span>
        <span className="bt-legend-item"><span className="bt-legend-dot bt-osb-f5os" /> F5OS</span>
      </div>

      <p className="bt-sources">{t.sources}</p>
    </div>
  );
}
