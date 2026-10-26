// ============================================================================
// src/content/certifications/overlays/pt-BR/fortinet.ts
// ----------------------------------------------------------------------------
// pt-BR PROSE OF THE FORTINET STUDY GUIDES (PRIME 26/10/2026). Each entry, keyed
// by guide slug, holds ONLY translated prose (GuideOverlay); facts, codes, names
// and objective text stay in study-guides.ts. Rules: src/content/certifications/
// localized.ts. Generated from the translation sources by the cert-pt batch and
// checked by scripts/check-cert-translation.mts (alignment) and
// scripts/check-ptbr-register.mjs (register). Edit here and rerun both.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";

/** Translated prose of the Fortinet guides, keyed by guide slug. */
export const PT_BR_FORTINET: Record<string, GuideOverlay> = {
  // OT Security: OT Security Architect.
  "fortinet-industry-ot-security-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idioma: inglês. Versão do produto: FortiOS 7.6, FortiAnalyzer 7.6, FortiSIEM 7.4 e FortiNAC 7.6.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 4: FortiOS 8.0 Administrator.
  "fortinet-nse-4-fortios-80-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "50–60 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 100 minutos. Idioma: inglês. Versão do produto: FortiOS 8.0.0.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 4: FortiOS 7.6 Administrator.
  "fortinet-nse-4-fortios-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "50–55 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 100 minutos. Idiomas: inglês e japonês. Versão do produto: FortiOS 7.6.0.",
    },
  },
  // NSE 5: FortiAnalyzer Analyst.
  "fortinet-nse-5-fortianalyzer-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idiomas: inglês, japonês. Versão do produto: FortiAnalyzer 7.6.",
    },
  },
  // NSE 5: FortiAppSec Cloud Administrator.
  "fortinet-nse-5-fortiappsec-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idioma: inglês. Versão do produto: FortiAppSec Cloud 26.2.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 5: FortiSwitch Administrator.
  "fortinet-nse-5-fortiswitch-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idiomas: inglês e japonês. Versão do produto: FortiSwitchOS 7.6, FortiOS 7.6.",
    },
  },
  // NSE 5: FortiWeb Administrator.
  "fortinet-nse-5-fortiweb-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idiomas: inglês e japonês. Versão do produto: FortiWeb 8.0.",
    },
  },
  // NSE 5: FortiSASE and SD-WAN 26 Core Administrator.
  "fortinet-nse-5-sase-sdwan-26-core-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 5: FortiSASE and SD-WAN 7.6 Core Administrator.
  "fortinet-nse-5-sase-sdwan-core-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30-35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idioma: inglês. Versão do produto: FortiSASE 25, FortiOS 7.6, FortiClient 7.0, FortiAuthenticator 6.5, FortiManager 7.6.",
    },
  },
  // NSE 5: SD-WAN Core Administrator.
  "fortinet-nse-5-sdwan-core-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 60–70 minutos. Idioma: inglês. Versão do produto: FortiOS 7.6 e FortiManager 7.6.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 5: Secure Wireless LAN Administrator.
  "fortinet-nse-5-secure-wireless-lan-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idioma: inglês. Versão do produto: FortiGate 7.6, FortiAP 7.6 e FortiPresence 2.0.",
    },
  },
  // NSE 6: FortiClient EMS Administrator.
  "fortinet-nse-6-forticlient-ems-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idiomas: inglês, japonês. Versão do produto: FortiClient EMS 7.4, FortiGate 7.6, FortiClient 7.4.",
    },
  },
  // NSE 6: FortiCNAPP Analyst.
  "fortinet-nse-6-forticnapp-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idioma: inglês. Versão do produto: FortiCNAPP 26.",
    },
  },
  // NSE 6: FortiDDoS Administrator.
  "fortinet-nse-6-fortiddos-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 60 minutos. Idioma: inglês. Versão do produto: FortiDDoS 7.2.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 6: FortiDeceptor Administrator.
  "fortinet-nse-6-fortideceptor-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 60 minutos. Idioma: inglês. Versão do produto: FortiDeceptor 6.2.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 6: FortiDLP Administrator.
  "fortinet-nse-6-fortidlp-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idioma: inglês. Versão do produto: FortiDLP 26.",
    },
  },
  // NSE 6: FortiEDR Administrator.
  "fortinet-nse-6-fortiedr-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idioma: inglês. Versão do produto: FortiEDR 7.0.",
    },
  },
  // NSE 6: FortiMail Administrator.
  "fortinet-nse-6-fortimail-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idiomas: inglês, japonês. Versão do produto: FortiMail 7.4.",
    },
  },
  // NSE 6: FortiManager Administrator.
  "fortinet-nse-6-fortimanager-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idiomas: inglês, japonês. Versão do produto: FortiManager 7.6.1, FortiOS 7.6.",
    },
  },
  // NSE 6: FortiNAC Administrator.
  "fortinet-nse-6-fortinac-administrator": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–35 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 60 minutos. Idioma: inglês. Versão do produto: FortiNAC-F 7.6, FortiOS 7.6.",
    },
  },
  // NSE 6: FortiNDR Cloud Analyst.
  "fortinet-nse-6-fortindr-cloud-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 65 minutos. Idioma: inglês. Versão do produto: FortiNDR Cloud 26.",
    },
  },
  // NSE 6: FortiRecon Analyst.
  "fortinet-nse-6-fortirecon-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "30–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 60 minutos. Idioma: inglês. Versão do produto: FortiRecon 26.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // NSE 6: FortiSIEM Analyst.
  "fortinet-nse-6-fortisiem-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 70 minutos. Idioma: inglês. Versão do produto: FortiSIEM 7.4.",
    },
  },
  // NSE 6: FortiSOAR Analyst.
  "fortinet-nse-6-fortisoar-analyst": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35–45 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idioma: inglês. Versão do produto: FortiSOAR 7.6.",
    },
  },
  // NSE 7: Public Cloud Security Architect.
  "fortinet-nse-7-public-cloud-security-architect": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35–40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idioma: inglês. Versão do produto: FortiOS 7.6, FortiWeb 7.4.",
    },
  },
  // NSE 7: SASE Architect.
  "fortinet-nse-7-sase-architect": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "40–50 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idiomas: inglês e japonês. Versão do produto: FortiSASE 26, FortiOS 7.4 e 7.6.",
    },
  },
  // NSE 7: Secure Networking Architect.
  "fortinet-nse-7-secure-networking-architect": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "40–50 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idiomas: inglês e japonês. Versão do produto: FortiGate 7.6, FortiManager 7.6, FortiAnalyzer 7.6.",
    },
  },
  // NSE 7: Security Operations Architect.
  "fortinet-nse-7-security-operations-architect": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "35-40 questões",
      passMark: "Aprovado ou reprovado. O relatório de pontuação fica disponível na sua conta da Pearson VUE.",
      cost: "Consulte o preço atual na Pearson VUE",
      note: "Tempo de prova: 75 minutos. Idioma: inglês. Versão do produto: FortiSOAR 7.6., FortiSIEM 7.3.",
    },
  },
};
