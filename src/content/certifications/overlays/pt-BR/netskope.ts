// ============================================================================
// src/content/certifications/overlays/pt-BR/netskope.ts
// ----------------------------------------------------------------------------
// pt-BR PROSE OF THE NETSKOPE STUDY GUIDES (PRIME 26/10/2026). Each entry, keyed
// by guide slug, holds ONLY translated prose (GuideOverlay); facts, codes, names
// and objective text stay in study-guides.ts. Rules: src/content/certifications/
// localized.ts. Generated from the translation sources by the cert-pt batch and
// checked by scripts/check-cert-translation.mts (alignment) and
// scripts/check-ptbr-register.mjs (register). Edit here and rerun both.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";

/** Translated prose of the Netskope guides, keyed by guide slug. */
export const PT_BR_NETSKOPE: Record<string, GuideOverlay> = {
  // TR-772-1: Netskope Administrator Accreditation.
  "netskope-administrator-accreditation": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "60 questões",
      passMark: "Não publicada no TR-772-1",
      cost: "Aplicada pela Netskope Academy (o TR-772-1 não publica uma taxa de prova à parte)",
      note: "Válida por dois anos a partir da data de aprovação na prova pela Netskope Academy. Esta accreditation substitui a antiga certificação Netskope Certified Cloud Security Administrator.",
    },
  },
  // TR-773-1: Netskope Integrator Accreditation.
  "netskope-integrator-accreditation": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "60 questões",
      passMark: "Não publicada no TR-773-1",
      cost: "Aplicada pela Netskope Academy (o TR-773-1 não publica uma taxa de prova à parte)",
      note: "Válida por dois anos a partir da data de aprovação na prova pela Netskope Academy. Esta accreditation substitui a antiga certificação Netskope Certified Cloud Security Integrator.",
    },
  },
};
