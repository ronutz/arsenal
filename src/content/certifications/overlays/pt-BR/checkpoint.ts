// ============================================================================
// src/content/certifications/overlays/pt-BR/checkpoint.ts
// ----------------------------------------------------------------------------
// pt-BR PROSE OF THE CHECK POINT STUDY GUIDES (PRIME 26/10/2026). Each entry, keyed
// by guide slug, holds ONLY translated prose (GuideOverlay); facts, codes, names
// and objective text stay in study-guides.ts. Rules: src/content/certifications/
// localized.ts. Generated from the translation sources by the cert-pt batch and
// checked by scripts/check-cert-translation.mts (alignment) and
// scripts/check-ptbr-register.mjs (register). Edit here and rerun both.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";

/** Translated prose of the Check Point guides, keyed by guide slug. */
export const PT_BR_CHECKPOINT: Record<string, GuideOverlay> = {
  // 156-521: Check Point Certified Automation Specialist R81.20 (CCAS).
  "checkpoint-ccas-r8120": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
  // 156-561: Check Point Certified Cloud Specialist R81.20 (CCCS).
  "checkpoint-cccs-r8120": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
  // 156-536: Check Point Certified Harmony Endpoint Specialist R81.20 (CCES).
  "checkpoint-cces-r8120": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
  // 156-836: Check Point Certified Maestro Expert R81 (CCME).
  "checkpoint-ccme-r81": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
  // 156-541: Check Point Certified Multi-Domain Security Management Specialist - R81 (CCMS).
  "checkpoint-ccms-r81": {
    // The availability note.
    availabilityNote: "Registro criado a partir da página do programa Check Point na Pearson VUE, que publica o código e o pré-requisito desta prova. A Check Point não publica um exam prep guide para as Specialist accreditations, como faz para o CCSA e o CCSE, por isso ainda não há blueprint de objetivos. Pré-requisito: nenhum publicado.",
  },
  // 156-409: Check Point Certified PenTesting Expert - Advanced Infrastructure Hacking (CCPE-AI).
  "checkpoint-ccpe-ai-exam": {
    // The availability note.
    availabilityNote: "A trilha avançada de infraestrutura, que parte do curso introdutório. A Check Point publica uma sinopse de curso para as turmas HackingPoint, e não um blueprint de prova por objetivo; por isso, o conteúdo da turma é transcrito onde existe uma captura limpa da fonte oficial e fica vazio onde não existe. Nada aqui é preenchido a partir de resumos de terceiros.",
  },
  // 156-406: Check Point Certified PenTesting Expert - Cloud Security (CCPE-C).
  "checkpoint-ccpe-c-exam": {
    // The availability note.
    availabilityNote: "Pentest de infraestrutura de cloud e de serviços hospedados em cloud. A Check Point publica uma sinopse de curso para as turmas HackingPoint, e não um blueprint de prova por objetivo; por isso, o conteúdo da turma é transcrito onde existe uma captura limpa da fonte oficial e fica vazio onde não existe. Nada aqui é preenchido a partir de resumos de terceiros.",
  },
  // 156-402: Check Point Certified PenTesting Expert - Infrastructure Hacking (CCPE-I).
  "checkpoint-ccpe-i-exam": {
    // The availability note.
    availabilityNote: "Uma turma introdutória de dois dias e o pré-requisito recomendado para o Advanced Infrastructure Hacking. A Check Point publica uma sinopse de curso para as turmas HackingPoint, e não um blueprint de prova por objetivo; por isso, o conteúdo da turma é transcrito onde existe uma captura limpa da fonte oficial e fica vazio onde não existe. Nada aqui é preenchido a partir de resumos de terceiros.",
  },
  // 156-404: Check Point Certified PenTesting Expert - Hacking IoT (CCPE-IoT).
  "checkpoint-ccpe-iot-exam": {
    // The availability note.
    availabilityNote: "Pentest de dispositivos conectados: sistemas embarcados, firmware e os protocolos que os dispositivos IoT usam. A Check Point publica uma sinopse de curso para as turmas HackingPoint, e não um blueprint de prova por objetivo; por isso, o conteúdo da turma é transcrito onde existe uma captura limpa da fonte oficial e fica vazio onde não existe. Nada aqui é preenchido a partir de resumos de terceiros.",
  },
  // 156-403: Check Point Certified PenTesting Expert - Web Hacking (CCPE-W).
  "checkpoint-ccpe-w-exam": {
    // The availability note.
    availabilityNote: "Pentest de aplicações web, incluindo o OWASP Top 10 e o PCI DSS no que dizem respeito à segurança de aplicações web. A Check Point publica uma sinopse de curso para as turmas HackingPoint, e não um blueprint de prova por objetivo; por isso, o conteúdo da turma é transcrito onde existe uma captura limpa da fonte oficial e fica vazio onde não existe. Nada aqui é preenchido a partir de resumos de terceiros.",
  },
  // 156-215.82: Check Point Certified Security Administrator R82 (CCSA).
  "checkpoint-ccsa-r82": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "100 questões de múltipla escolha",
      passMark: "70%",
      cost: "USD 300 (varia conforme a região e o centro de testes)",
      note: "Segundo a Check Point, cerca de 80% das questões vêm do conteúdo oficial do curso e os 20% restantes do conhecimento do produto adquirido na documentação, nos artigos do SecureKnowledge ou na experiência prática. Há 15 minutos a mais quando o inglês não é a língua nativa do candidato. Aplicada em um centro de testes Pearson VUE ou online, com supervisão remota pelo OnVUE. A credencial é válida por dois anos.",
    },
  },
  // 156-315.82: Check Point Certified Security Expert R82 (CCSE).
  "checkpoint-ccse-r82": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "100 questões de múltipla escolha",
      passMark: "70%",
      cost: "USD 300 (varia conforme a região e o centro de testes)",
      note: "Segundo a Check Point, cerca de 80% das questões vêm do conteúdo oficial do curso e os 20% restantes do conhecimento do produto adquirido na documentação, nos artigos do SecureKnowledge ou na experiência prática. Há 15 minutos a mais quando o inglês não é a língua nativa do candidato. Aplicada em um centro de testes Pearson VUE ou online, com supervisão remota pelo OnVUE. A credencial é válida por dois anos.",
    },
  },
  // 156-582: Check Point Certified Troubleshooting Administrator - R81.20 (CCTA).
  "checkpoint-ccta-r8120": {
    // The availability note.
    availabilityNote: "Registro criado a partir da página do programa Check Point na Pearson VUE, que publica o código e o pré-requisito desta prova. A Check Point não publica um exam prep guide para as Specialist accreditations, como faz para o CCSA e o CCSE, por isso ainda não há blueprint de objetivos. Pré-requisito: aprovação em uma prova CCSA ou CCSE (versão R80 ou posterior).",
  },
  // 156-583: Check Point Certified Troubleshooting Administrator R82 (CCTA).
  "checkpoint-ccta-r82": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
  // 156-587: Check Point Certified Troubleshooting Expert - R81.20 (CCTE).
  "checkpoint-ccte-r8120": {
    // The availability note.
    availabilityNote: "Registro criado a partir da página do programa Check Point na Pearson VUE, que publica o código e o pré-requisito desta prova. A Check Point não publica um exam prep guide para as Specialist accreditations, como faz para o CCSA e o CCSE, por isso ainda não há blueprint de objetivos. Pré-requisito: aprovação em uma prova CCSE (versão R80 ou posterior). Uma versão anterior do CCTE não é pré-requisito.",
  },
  // 156-588: Check Point Certified Troubleshooting Expert - R82 (CCTE).
  "checkpoint-ccte-r82": {
    // The availability note, the vendor's own words kept as an English quotation.
    availabilityNote: [
      "Registro criado a partir da página do programa Check Point na Pearson VUE, que anuncia o código desta prova. A Check Point não publica um exam prep guide para as Specialist accreditations, como faz para o CCSA e o CCSE, por isso ainda não há blueprint de objetivos. Pré-requisito: a tabela de pré-requisitos da página não tem linha para a 156-588; a linha do CCTE R81.20 (156-587) diz ",
      { quoteEn: "The Candidate must have passed a CCSE exam (version R80 and up) to qualify to take the CCTE. (Note: A previous version of the CCTE certification is not a prerequisite)" },
      ".",
    ],
  },
  // 156-551: Check Point Certified VSX Specialist - R81 (CCVS).
  "checkpoint-ccvs-r81": {
    // The availability note.
    availabilityNote: "Registro criado a partir da página do programa Check Point na Pearson VUE, que publica o código e o pré-requisito desta prova. A Check Point não publica um exam prep guide para as Specialist accreditations, como faz para o CCSA e o CCSE, por isso ainda não há blueprint de objetivos. Pré-requisito: nenhum publicado.",
  },
  // 156-590: Check Point Certified Threat Prevention Specialist (CTPS).
  "checkpoint-ctps": {
    // The availability note.
    availabilityNote: "A Check Point publica o número da prova e o nome da accreditation desta trilha de especialista, mas não publica um blueprint por objetivo como faz para o CCSA e o CCSE. Os objetivos serão transcritos aqui quando houver uma fonte oficial para eles; nada é preenchido a partir de resumos de terceiros.",
  },
};
