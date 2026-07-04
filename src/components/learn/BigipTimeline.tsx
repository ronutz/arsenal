"use client";

// ============================================================================
// src/components/learn/BigipTimeline.tsx
// ----------------------------------------------------------------------------
// An interactive BIG-IP + TMOS version timeline, embedded in a Learn article.
// Drag the year slider; the card shows the BIG-IP software version of that era,
// the operating system underneath it (BSD -> TMOS -> F5OS), and, from 12.0
// onward, the lifecycle marks: End of Software Development (EoSD) and End of
// Technical Support (EoTS). Branches past EoTS are dimmed (already End of Life);
// still-supported branches are highlighted, and ones nearing EoTS are flagged
// amber as an upgrade reminder. Status is computed against the current date, so
// the reminder stays honest over time.
//
// GROUNDING (every date is sourced, not remembered):
//   - v9.0 = 2004, TMOS introduced (BSD -> Linux system management + the TMM
//     microkernel; hardware "BIG-IP" and software "TMOS" split): F5, Inc.
//     history + PacketPushers "What The Heck Is F5 Networks' TMOS?".
//   - Release dates: F5 K33062581 (TMOS Software Release Date Information) and
//     K9412 (the BIG-IP release matrix); 12.0 = 02 Sep 2015, 15.0 = 2019,
//     16.0 = 2020, 17.0 = 2022, 21.0 = 06 Nov 2025. The line jumps 17 -> 21
//     because 18-20 were BIG-IP Next, DISCONTINUED (final 20.3 EoL 30 Apr 2025;
//     K5903 / K000152956); TMOS resumes at 21. 10/11/13/14 use their widely
//     documented release year.
//   - EoSD / EoTS per branch: F5 K5903 (BIG-IP software support policy),
//     cross-checked against K9476. Note: for F5 SOFTWARE the milestones are
//     EoSD and EoTS (they coincide under the current policy, but differ for the
//     older 12.x/13.x branches); "End of Sale" is a HARDWARE term (K4309).
//   - F5OS (VELOS chassis / rSeries appliance, BIG-IP as a tenant): from ~2021,
//     per F5 K9412 / K86001294.
// ============================================================================

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "pt";
type OsKey = "bsd" | "tmos" | "f5os";

/** One supported/EoL branch with its lifecycle dates (ISO, for comparison). */
interface Branch {
  readonly branch: string;
  readonly eosd: string; // ISO yyyy-mm-dd
  readonly eots: string; // ISO yyyy-mm-dd
}
interface Release {
  readonly year: number;
  readonly ver: string;
  readonly os: string;
  readonly osKey: OsKey;
  readonly note: { en: string; pt: string };
  readonly hard?: boolean; // hard F5-sourced release date vs widely-documented year
  readonly lifecycle?: readonly Branch[]; // 12.0+ only
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
    pt: "A partir da 12.0, a F5 adota o modelo alternado de Major Release / Long-Term Stability Release que ainda rege a linha." },
    lifecycle: [{ branch: "12.1.x (LTS)", eosd: "2021-05-18", eots: "2022-05-18" }] },
  { year: 2017, ver: "BIG-IP 13.0", os: "TMOS 13.x", osKey: "tmos", note: {
    en: "The 13.x branch. From 13.0 the diagnostics (EUD) image is no longer bundled in the base install image.",
    pt: "O ramo 13.x. A partir da 13.0 a imagem de diagnóstico (EUD) deixa de vir embutida na imagem base de instalação." },
    lifecycle: [{ branch: "13.1.x (LTS)", eosd: "2022-12-31", eots: "2023-12-31" }] },
  { year: 2018, ver: "BIG-IP 14.0", os: "TMOS 14.x", osKey: "tmos", note: {
    en: "The 14.x branch, on the iSeries and VIPRION platforms of the day.",
    pt: "O ramo 14.x, nas plataformas iSeries e VIPRION da época." },
    lifecycle: [{ branch: "14.1.x (LTS)", eosd: "2023-12-31", eots: "2023-12-31" }] },
  { year: 2019, ver: "BIG-IP 15.0", os: "TMOS 15.x", osKey: "tmos", hard: true, note: {
    en: "The 15.x branch (15.1 is its Long-Term Stability release).",
    pt: "O ramo 15.x (a 15.1 é a sua versão Long-Term Stability)." },
    lifecycle: [{ branch: "15.1.x (LTS)", eosd: "2024-12-31", eots: "2024-12-31" }] },
  { year: 2020, ver: "BIG-IP 16.0", os: "TMOS 16.x", osKey: "tmos", hard: true, note: {
    en: "The 16.x branch (16.1 is its Long-Term Stability release).",
    pt: "O ramo 16.x (a 16.1 é a sua versão Long-Term Stability)." },
    lifecycle: [{ branch: "16.1.x (LTS)", eosd: "2025-07-31", eots: "2025-07-31" }] },
  { year: 2021, ver: "VELOS + F5OS", os: "F5OS", osKey: "f5os", note: {
    en: "A new platform OS arrives: F5OS. The VELOS chassis (F5OS-C) and, alongside it, the rSeries appliances (F5OS-A) run BIG-IP as a tenant on top of F5OS, rather than TMOS owning the whole box.",
    pt: "Um novo sistema operacional de plataforma chega: o F5OS. O chassis VELOS (F5OS-C) e, ao lado dele, os appliances rSeries (F5OS-A) rodam o BIG-IP como um tenant sobre o F5OS, em vez de o TMOS ser dono da caixa inteira." } },
  { year: 2022, ver: "BIG-IP 17.0", os: "TMOS 17.x", osKey: "tmos", hard: true, note: {
    en: "The 17.x branch, with two Long-Term Stability releases. It runs on iSeries and VIPRION, and as a tenant on VELOS and rSeries (F5OS).",
    pt: "O ramo 17.x, com duas versões Long-Term Stability. Roda em iSeries e VIPRION, e como tenant em VELOS e rSeries (F5OS)." },
    lifecycle: [
      { branch: "17.1.x (LTS)", eosd: "2027-03-31", eots: "2027-03-31" },
      { branch: "17.5.x (LTS)", eosd: "2029-01-01", eots: "2029-01-01" },
    ] },
  { year: 2025, ver: "BIG-IP 21.0", os: "TMOS 21.x", osKey: "tmos", hard: true, note: {
    en: "The version number jumps 17 -> 21. The 18-20 range was BIG-IP Next, which F5 discontinued (the final 20.3 reached end of life on 30 April 2025), returning to the modernized TMOS line at 21.0.",
    pt: "O número de versão salta de 17 para 21. A faixa 18-20 foi o BIG-IP Next, que a F5 descontinuou (a 20.3 final chegou ao fim de vida em 30 de abril de 2025), retornando à linha TMOS modernizada na 21.0." },
    lifecycle: [
      { branch: "21.0.x", eosd: "2026-08-06", eots: "2026-08-06" },
      { branch: "21.1.x (LTS)", eosd: "2029-05-05", eots: "2029-05-05" },
    ] },
];

const OS_LABEL: Record<OsKey, { en: string; pt: string }> = {
  bsd: { en: "BSD-based", pt: "Baseado em BSD" },
  tmos: { en: "TMOS (Linux host + TMM)", pt: "TMOS (host Linux + TMM)" },
  f5os: { en: "F5OS (BIG-IP runs as a tenant)", pt: "F5OS (BIG-IP roda como tenant)" },
};

const MONTHS: Record<Lang, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
};
/** Deterministic date format (no toLocaleDateString -> no hydration drift). */
function fmt(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[lang][m - 1]} ${y}`;
}

const T = {
  en: {
    heading: "BIG-IP + TMOS timeline",
    drag: "Drag the year",
    version: "BIG-IP software",
    os: "Operating system",
    approx: "release year (this branch is end-of-life; year is widely documented)",
    hard: "release date on F5's record",
    legend: "OS lineage",
    lifecycle: "Support lifecycle",
    eosd: "EoSD",
    eots: "EoTS",
    eol: "End of Life",
    supported: "Supported",
    upgradeSoon: "upgrade soon",
    sources: "Release dates from F5's records (K33062581, K9412); EoSD/EoTS from F5 K5903 (software support policy). EoSD and EoTS are the software milestones and coincide under the current policy; 'End of Sale' is a hardware term. BIG-IP Next (18-20) is discontinued and excluded.",
  },
  pt: {
    heading: "Linha do tempo BIG-IP + TMOS",
    drag: "Arraste o ano",
    version: "Software BIG-IP",
    os: "Sistema operacional",
    approx: "ano de lançamento (este ramo é fim de vida; o ano é amplamente documentado)",
    hard: "data de lançamento no registro da F5",
    legend: "Linhagem de SO",
    lifecycle: "Ciclo de vida de suporte",
    eosd: "EoSD",
    eots: "EoTS",
    eol: "Fim de vida",
    supported: "Suportado",
    upgradeSoon: "atualize logo",
    sources: "Datas de lançamento dos registros da F5 (K33062581, K9412); EoSD/EoTS do F5 K5903 (política de suporte de software). EoSD e EoTS são os marcos de software e coincidem na política atual; 'End of Sale' é um termo de hardware. O BIG-IP Next (18-20) está descontinuado e excluído.",
  },
} as const;

const MIN_YEAR = 1997;
const MAX_YEAR = 2026;
const SOON_DAYS = 275; // ~9 months: an EoTS inside this window is flagged amber

type BranchStatus = "eol" | "soon" | "ok" | "neutral";

export default function BigipTimeline({ lang = "en" as Lang }: { lang?: Lang }) {
  const [year, setYear] = useState(2004);
  // Status depends on "today"; only apply it after mount so SSR and the first
  // client render agree (no hydration mismatch on a date-derived class).
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(Date.now()), []);

  const t = T[lang];

  const active = useMemo(() => {
    let r = RELEASES[0];
    for (const cand of RELEASES) if (year >= cand.year) r = cand;
    return r;
  }, [year]);

  const statusOf = (eotsIso: string): BranchStatus => {
    if (today === null) return "neutral";
    const eots = Date.parse(eotsIso + "T00:00:00Z");
    if (eots < today) return "eol";
    if (eots - today < SOON_DAYS * 86400_000) return "soon";
    return "ok";
  };

  const pct = (y: number) => ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div className={`bt-widget bt-os-${active.osKey}`}>
      <div className="bt-head">
        <span className="bt-heading">{t.heading}</span>
        <span className="bt-year mono">{year}</span>
      </div>

      <div className="bt-track-wrap">
        <div className="bt-track" aria-hidden="true">
          <div className="bt-band bt-band-bsd" style={{ left: `${pct(MIN_YEAR)}%`, width: `${pct(2004) - pct(MIN_YEAR)}%` }} />
          <div className="bt-band bt-band-tmos" style={{ left: `${pct(2004)}%`, width: `${pct(MAX_YEAR) - pct(2004)}%` }} />
          <div className="bt-band bt-band-f5os" style={{ left: `${pct(2021)}%`, width: `${pct(MAX_YEAR) - pct(2021)}%` }} />
          {RELEASES.map((r) => (
            <span key={r.year} className={`bt-tick ${year >= r.year ? "bt-tick-past" : ""}`} style={{ left: `${pct(r.year)}%` }} title={`${r.ver} (${r.year})`} />
          ))}
        </div>
        <input className="bt-slider" type="range" min={MIN_YEAR} max={MAX_YEAR} value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} aria-label={t.drag} />
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
        <p className="bt-date-kind mono">{active.hard ? `\u2713 ${t.hard}` : t.approx}</p>

        {active.lifecycle && (
          <div className="bt-life">
            <span className="bt-life-title">{t.lifecycle}</span>
            {active.lifecycle.map((b) => {
              const st = statusOf(b.eots);
              return (
                <div key={b.branch} className={`bt-life-row bt-life-${st}`}>
                  <span className="bt-life-branch mono">{b.branch}</span>
                  <span className="bt-life-dates">
                    <span className="bt-life-date">{t.eosd} {fmt(b.eosd, lang)}</span>
                    <span className="bt-life-sep">·</span>
                    <span className="bt-life-date">{t.eots} {fmt(b.eots, lang)}</span>
                  </span>
                  {st !== "neutral" && (
                    <span className={`bt-life-badge bt-lifeb-${st}`}>
                      {st === "eol" ? t.eol : st === "soon" ? `${t.supported} \u2014 ${t.upgradeSoon}` : t.supported}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
