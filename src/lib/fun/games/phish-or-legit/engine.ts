// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/phish-or-legit/engine.ts
// ----------------------------------------------------------------------------
// PHISH OR LEGIT, the rules (PRIME 03/11/2026). A card shows one thing to
// judge: a URL as a link preview or an address bar shows it, or an email's
// From line. The player says Phish or Legit and is told the tell.
//
// The pool is built, not drawn: eight invented brands (a bank, a mail service,
// a cloud provider, a shop, a parcel courier, a payroll provider, a tax office
// with an invented country, and a ferry line whose real name has an umlaut),
// each run through every generator below, about 230 cards. Real brands live
// under .example (RFC 2606); attackers live under other .example and .test
// names, documentation addresses (RFC 5737), and, for the lookalike-TLD lesson
// only, invented names under real top-level domains, always shown as plain text.
//
// The explanations are composed here, in English and Brazilian Portuguese,
// from each card's own parts (the host, the swapped letters, the code points),
// so the self-test can prove every card complete in both languages; the other
// locales show the English text, as the packs' per-key fallback would.
//
// The daily round is 15 cards drawn by dailyRng: 6 to 9 phish, the rest legit,
// one tell per card as far as the tells go round. Pure: no DOM, no clock.
// ============================================================================

// The seeded generators.
import { dailyRng, makeRng, addDays, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";
// Punycode, for A-labels and their decoding.
import { hostToAscii, hostToUnicode, isAscii, punycodeSelfTest, punyDecode, ACE_PREFIX } from "./punycode";

/** The game's stable id. */
export const GAME_ID = "phish-or-legit";

/** Cards in a daily round. */
export const DAILY_SIZE = 15;

/** The fewest phish (and legit) cards a daily round may hold. */
export const MIN_SIDE = 6;

/** The most phish (and legit) cards a daily round may hold. */
export const MAX_SIDE = 9;

/** Correct answers that count a daily round as won (for the streak). */
export const PASS_MARK = 10;

/** Seconds in a speed run. */
export const SPEED_SECONDS = 60;

/** Seconds a wrong answer costs in a speed run. */
export const SPEED_PENALTY = 3;

/** The two answers. */
export type Verdict = "phish" | "legit";

/** The languages the explanations are written in. */
export type Lang = "en" | "pt";

/** A text in both authored languages. */
export interface Bi {
  /** British English. */
  en: string;
  /** Brazilian Portuguese. */
  pt: string;
}

/** Every tell the game names: what made a card phish, or what makes a legit one look odd but fine. */
export type Tell =
  | "homoglyph"
  | "punycode"
  | "brand-subdomain"
  | "lookalike-tld"
  | "userinfo"
  | "ip-host"
  | "typosquat"
  | "ascii-lookalike"
  | "display-name"
  | "shortener"
  | "https-padlock"
  | "combosquat"
  | "brand-in-path"
  | "legit-plain"
  | "legit-subdomain"
  | "legit-tracking"
  | "legit-sender"
  | "legit-case"
  | "legit-long"
  | "legit-port"
  | "legit-idn";

/** Each tell's verdict and its name in both languages. */
export const TELLS: Readonly<Record<Tell, { verdict: Verdict; name: Bi }>> = {
  // A letter from another script, or an accented one, standing in for a Latin letter.
  homoglyph: { verdict: "phish", name: { en: "Homoglyph", pt: "Homóglifo" } },
  // An A-label that decodes to a lookalike.
  punycode: { verdict: "phish", name: { en: "Punycode (xn--)", pt: "Punycode (xn--)" } },
  // The brand's name on the left of somebody else's domain.
  "brand-subdomain": { verdict: "phish", name: { en: "Brand in someone else's subdomain", pt: "Marca no subdomínio de outro" } },
  // The brand's name under another top-level domain.
  "lookalike-tld": { verdict: "phish", name: { en: "Lookalike top-level domain", pt: "Domínio de topo trocado" } },
  // Text before an @ in the authority.
  userinfo: { verdict: "phish", name: { en: "Userinfo trick (@)", pt: "Truque do userinfo (@)" } },
  // A numeric host.
  "ip-host": { verdict: "phish", name: { en: "Bare IP address", pt: "IP no lugar do nome" } },
  // A letter swapped, doubled, dropped or stripped of its accent.
  typosquat: { verdict: "phish", name: { en: "Typosquat", pt: "Typosquat" } },
  // ASCII characters that read as other ones (rn for m, 1 for l).
  "ascii-lookalike": { verdict: "phish", name: { en: "Lookalike letters", pt: "Letras que se confundem" } },
  // A display name that the address does not back up.
  "display-name": { verdict: "phish", name: { en: "Display name mismatch", pt: "Nome de exibição enganoso" } },
  // A short link that hides its target.
  shortener: { verdict: "phish", name: { en: "URL shortener", pt: "Encurtador de URL" } },
  // https on a domain that is not the brand's.
  "https-padlock": { verdict: "phish", name: { en: "https is not proof", pt: "https não é prova" } },
  // The brand plus a word, registered by someone else.
  combosquat: { verdict: "phish", name: { en: "Brand plus a word", pt: "Marca com palavra extra" } },
  // The brand's domain as a folder on another host.
  "brand-in-path": { verdict: "phish", name: { en: "Brand in the path", pt: "Marca no caminho" } },
  // The brand's own domain, plainly.
  "legit-plain": { verdict: "legit", name: { en: "The brand's own domain", pt: "O domínio da própria marca" } },
  // A subdomain of the brand's own domain.
  "legit-subdomain": { verdict: "legit", name: { en: "Subdomain of the real domain", pt: "Subdomínio do domínio real" } },
  // The real domain with tracking parameters.
  "legit-tracking": { verdict: "legit", name: { en: "Tracking parameters", pt: "Parâmetros de rastreamento" } },
  // A From line that matches the brand's domain.
  "legit-sender": { verdict: "legit", name: { en: "Matching sender", pt: "Remetente confere" } },
  // Capitals in the host.
  "legit-case": { verdict: "legit", name: { en: "Capitals in the host", pt: "Maiúsculas no host" } },
  // A long, code-filled but genuine address.
  "legit-long": { verdict: "legit", name: { en: "Long but genuine", pt: "Longa, mas legítima" } },
  // The default port written out.
  "legit-port": { verdict: "legit", name: { en: "Default port written out", pt: "Porta padrão explícita" } },
  // A genuine international name, in either form.
  "legit-idn": { verdict: "legit", name: { en: "Genuine international name", pt: "Nome internacional legítimo" } },
};

/** The tells that make a card phish, in a fixed order. */
export const PHISH_TELLS: readonly Tell[] = (Object.keys(TELLS) as Tell[]).filter((t) => TELLS[t].verdict === "phish");

/** The tells of legit cards, in a fixed order. */
export const LEGIT_TELLS: readonly Tell[] = (Object.keys(TELLS) as Tell[]).filter((t) => TELLS[t].verdict === "legit");

/** One invented brand. */
export interface Brand {
  /** A stable id. */
  id: string;
  /** Its name in both languages. */
  name: Bi;
  /** Its second-level label, the part attackers imitate. */
  sld: string;
  /** Its one real domain. */
  domain: string;
  /** Two subdomains it really uses. */
  subs: [string, string];
  /** Two paths on its site. */
  paths: [string, string];
  /** Two mailbox names it sends from; the second on a notify subdomain. */
  senders: [string, string];
  /** Two lines of context its messages carry. */
  contexts: [Bi, Bi];
}

/** The brands, all invented; their real domains are under .example (RFC 2606). */
export const BRANDS: readonly Brand[] = [
  // The bank.
  {
    id: "bank", name: { en: "Quorvel Bank", pt: "Quorvel Bank" }, sld: "quorvel", domain: "quorvel.example",
    subs: ["login", "app"], paths: ["/accounts/statements", "/cards/limits"], senders: ["alerts", "statements"],
    contexts: [
      { en: "Your bank asks you to confirm a payment.", pt: "Seu banco pede para confirmar um pagamento." },
      { en: "A new device signed in to your account.", pt: "Um aparelho novo entrou na sua conta." },
    ],
  },
  // The mail service.
  {
    id: "mail", name: { en: "Postmoth Mail", pt: "Postmoth Mail" }, sld: "postmoth", domain: "postmoth.example",
    subs: ["mail", "accounts"], paths: ["/inbox", "/settings/storage"], senders: ["no-reply", "security"],
    contexts: [
      { en: "Your mailbox is 98% full.", pt: "Sua caixa postal está 98% cheia." },
      { en: "Confirm your recovery phone number.", pt: "Confirme o celular de recuperação." },
    ],
  },
  // The cloud provider.
  {
    id: "cloud", name: { en: "Nimbrel Cloud", pt: "Nimbrel Cloud" }, sld: "nimbrel", domain: "nimbrel.example",
    subs: ["console", "status"], paths: ["/billing/invoices", "/docs/getting-started"], senders: ["billing", "alerts"],
    contexts: [
      { en: "Your monthly invoice could not be charged.", pt: "Não deu para cobrar a fatura do mês." },
      { en: "An access key was created in your project.", pt: "Uma chave de acesso foi criada no seu projeto." },
    ],
  },
  // The shop.
  {
    id: "shop", name: { en: "Bazarillo", pt: "Bazarillo" }, sld: "bazarillo", domain: "bazarillo.example",
    subs: ["orders", "help"], paths: ["/orders/8841-2207", "/deals/weekend"], senders: ["orders", "receipts"],
    contexts: [
      { en: "Your order is on hold.", pt: "Seu pedido está retido." },
      { en: "You have a refund waiting.", pt: "Você tem um reembolso esperando." },
    ],
  },
  // The parcel courier.
  {
    id: "courier", name: { en: "Parcelwren", pt: "Parcelwren" }, sld: "parcelwren", domain: "parcelwren.example",
    subs: ["track", "help"], paths: ["/track/PW7731042", "/delivery/reschedule"], senders: ["tracking", "delivery"],
    contexts: [
      { en: "A parcel is waiting: pay the customs fee.", pt: "Uma encomenda espera: pague a taxa de importação." },
      { en: "We missed you: choose a new delivery day.", pt: "Ninguém atendeu: escolha outro dia de entrega." },
    ],
  },
  // The payroll provider.
  {
    id: "payroll", name: { en: "Ledgerkite Payroll", pt: "Ledgerkite Payroll" }, sld: "ledgerkite", domain: "ledgerkite.example",
    subs: ["my", "hr"], paths: ["/payslips/2026-10", "/profile/bank-details"], senders: ["payslips", "hr"],
    contexts: [
      { en: "Your payslip is ready.", pt: "Seu holerite está disponível." },
      { en: "Update your bank details before payday.", pt: "Atualize seus dados bancários antes do dia do pagamento." },
    ],
  },
  // The tax office of an invented country.
  {
    id: "tax", name: { en: "Arventia Revenue Office", pt: "Receita de Arventia" }, sld: "arventiatax", domain: "arventiatax.example",
    subs: ["online", "refunds"], paths: ["/returns/2026", "/refunds/status"], senders: ["notices", "refunds"],
    contexts: [
      { en: "You are owed a tax refund.", pt: "Você tem uma restituição a receber." },
      { en: "Your tax return has an error.", pt: "Sua declaração tem uma pendência." },
    ],
  },
  // The ferry line, whose real name is international (its own small set of cards).
  {
    id: "ferry", name: { en: "Fjördlin Ferries", pt: "Fjördlin Ferries" }, sld: "fjördlin", domain: "fjördlin.example",
    subs: ["tickets", "status"], paths: ["/timetable", "/booking/FJ-20417"], senders: ["bookings", "alerts"],
    contexts: [
      { en: "Your crossing time has changed.", pt: "O horário da sua travessia mudou." },
      { en: "Pay now to keep your cabin.", pt: "Pague agora para não perder a cabine." },
    ],
  },
];

/** A character that stands in for a Latin letter, with what Unicode calls it (checked against confusables.txt). */
export interface Glyph {
  /** The character itself. */
  ch: string;
  /** The Latin letter it imitates. */
  latin: string;
  /** Its script. */
  script: "Greek" | "Cyrillic" | "Latin";
  /** Its Unicode name. */
  name: string;
}

/** Greek letters listed in Unicode's confusables data as lookalikes of Latin ones, in the order the game prefers them. */
const GREEK: readonly Glyph[] = [
  // ν → v.
  { ch: String.fromCodePoint(0x03BD), latin: "v", script: "Greek", name: "GREEK SMALL LETTER NU" },
  // α → a.
  { ch: String.fromCodePoint(0x03B1), latin: "a", script: "Greek", name: "GREEK SMALL LETTER ALPHA" },
  // ρ → p.
  { ch: String.fromCodePoint(0x03C1), latin: "p", script: "Greek", name: "GREEK SMALL LETTER RHO" },
  // ι → i.
  { ch: String.fromCodePoint(0x03B9), latin: "i", script: "Greek", name: "GREEK SMALL LETTER IOTA" },
  // ο → o.
  { ch: String.fromCodePoint(0x03BF), latin: "o", script: "Greek", name: "GREEK SMALL LETTER OMICRON" },
];

/** Cyrillic letters listed as lookalikes of Latin ones. */
const CYRILLIC: readonly Glyph[] = [
  // о → o.
  { ch: String.fromCodePoint(0x043E), latin: "o", script: "Cyrillic", name: "CYRILLIC SMALL LETTER O" },
  // е → e.
  { ch: String.fromCodePoint(0x0435), latin: "e", script: "Cyrillic", name: "CYRILLIC SMALL LETTER IE" },
  // а → a.
  { ch: String.fromCodePoint(0x0430), latin: "a", script: "Cyrillic", name: "CYRILLIC SMALL LETTER A" },
  // с → c.
  { ch: String.fromCodePoint(0x0441), latin: "c", script: "Cyrillic", name: "CYRILLIC SMALL LETTER ES" },
  // р → p.
  { ch: String.fromCodePoint(0x0440), latin: "p", script: "Cyrillic", name: "CYRILLIC SMALL LETTER ER" },
  // х → x.
  { ch: String.fromCodePoint(0x0445), latin: "x", script: "Cyrillic", name: "CYRILLIC SMALL LETTER HA" },
  // і → i.
  { ch: String.fromCodePoint(0x0456), latin: "i", script: "Cyrillic", name: "CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I" },
];

/** Accented Latin letters that pass for plain ones at a glance. */
const ACCENTED: readonly Glyph[] = [
  // é for e.
  { ch: String.fromCodePoint(0x00E9), latin: "e", script: "Latin", name: "LATIN SMALL LETTER E WITH ACUTE" },
  // ö for o.
  { ch: String.fromCodePoint(0x00F6), latin: "o", script: "Latin", name: "LATIN SMALL LETTER O WITH DIAERESIS" },
  // á for a.
  { ch: String.fromCodePoint(0x00E1), latin: "a", script: "Latin", name: "LATIN SMALL LETTER A WITH ACUTE" },
  // í for i.
  { ch: String.fromCodePoint(0x00ED), latin: "i", script: "Latin", name: "LATIN SMALL LETTER I WITH ACUTE" },
];

/** Every stand-in the game uses, by character, for the self-test and the code-point line. */
export const GLYPHS: ReadonlyMap<string, Glyph> = new Map([...GREEK, ...CYRILLIC, ...ACCENTED].map((g) => [g.ch, g]));

/** The ferry's own letter, so its name can be explained too. */
const FERRY_O: Glyph = { ch: String.fromCodePoint(0x00F6), latin: "o", script: "Latin", name: "LATIN SMALL LETTER O WITH DIAERESIS" };

/** Attackers' domains: RFC 2606 names that are not any brand's. */
const ATTACKER_DOMAINS: readonly string[] = [
  "acct-verify.example", "secure-session.example", "login-check.test", "id-confirm.example",
  "portal-auth.example", "user-safety.test", "web-hosting.example.net", "cdn-files.example.org",
];

/** Free-mail style domains for display-name cards. */
const FREEMAIL: readonly string[] = ["freemail.example", "mailbox.test", "inbox.example.net"];

/** Shortener hosts (invented). */
const SHORTENERS: readonly string[] = ["tiny.example", "s.test", "go.example.net", "lnk.example"];

/** Hosting domains for the brand-in-path lesson. */
const HOSTING: readonly string[] = ["files.example.net", "sites.example.org", "pages.example.com", "share.test"];

/** Top-level domains for the lookalike-TLD lesson (real TLDs, invented names, plain text only). */
const OTHER_TLDS: readonly string[] = ["co", "net", "app", "support", "info", "online", "site", "com"];

/** Words that attackers bolt onto a brand. */
const BOLT_ON: readonly string[] = ["login", "verify", "support", "account", "billing", "refund", "help", "secure"];

/** A code point in the U+XXXX form. */
export function codePoint(ch: string): string {
  // Four hex digits at least, upper case.
  return "U+" + (ch.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, "0");
}

/** One code point explained on a card. */
export interface CodePointNote {
  /** The character. */
  ch: string;
  /** U+XXXX. */
  cp: string;
  /** Its Unicode name. */
  name: string;
  /** Its script. */
  script: Glyph["script"];
}

/** One card. */
export interface Card {
  /** A stable id: tell, brand and variant. */
  id: string;
  /** A URL, or an email From line. */
  kind: "url" | "email";
  /** The URL, or the address inside the From line. */
  text: string;
  /** For an email, the display name. */
  display?: string;
  /** The brand the card claims to be. */
  brand: string;
  /** The right answer. */
  verdict: Verdict;
  /** What gives it away (or why it is fine). */
  tell: Tell;
  /** The line of context shown with it, if any. */
  context: Bi | null;
  /** The explanation, both languages. */
  explain: Bi;
  /** Code points worth showing (homoglyph and punycode cards). */
  points: CodePointNote[];
  /** For homoglyph and punycode cards: the Unicode label the game claims, for the self-test. */
  ulabel?: string;
  /** For punycode cards: the A-label shown. */
  alabel?: string;
}

/**
 * Fill {name} slots in a template.
 *
 * @param template the text with slots
 * @param args the values
 * @returns the filled text (a slot with no value stays, and the self-test catches it)
 */
function fill(template: string, args: Record<string, string>): string {
  // Each slot replaced by its value, if there is one.
  return template.replace(/\{([a-zA-Z]+)\}/g, (m, k: string) => (k in args ? args[k] : m));
}

/**
 * A text in both languages, from two templates and one set of values.
 *
 * @param en the English template
 * @param pt the Portuguese template
 * @param args the values
 * @returns both texts filled
 */
function bi(en: string, pt: string, args: Record<string, string>): Bi {
  // Both filled from the same values.
  return { en: fill(en, args), pt: fill(pt, args) };
}

/** The script names, both languages. */
const SCRIPT_NAMES: Readonly<Record<Glyph["script"], Bi>> = {
  // Greek.
  Greek: { en: "Greek", pt: "grego" },
  // Cyrillic.
  Cyrillic: { en: "Cyrillic", pt: "cirílico" },
  // Latin.
  Latin: { en: "Latin", pt: "latino" },
};

/** The explanation templates, by tell and variant; {slots} are filled per card. */
const T = {
  // A Greek or Cyrillic letter in a Latin name.
  mixed: {
    en: "{host} is not {real}. Letter {pos} is {glyph} ({cp}, {cpname}), a {script} letter, not the Latin {latin}. To DNS this is {alabel}, a different name. Browsers that apply Unicode's mixed-script rules show a name like this as xn--, and that is the clue to look for.",
    pt: "{host} não é {real}. A letra {pos} é {glyph} ({cp}, {cpname}), do alfabeto {script}, e não o {latin} latino. Para o DNS isto é {alabel}, outro nome. Navegadores que aplicam as regras de mistura de alfabetos do Unicode mostram um nome assim como xn--, e essa é a pista.",
  },
  // An accented Latin letter.
  accent: {
    en: "{host} is not {real}. Letter {pos} is {glyph} ({cp}, {cpname}), not a plain {latin}. One accent makes a different name: to DNS this is {alabel}. A name in a single script like this one is usually shown as it is, so read every letter.",
    pt: "{host} não é {real}. A letra {pos} é {glyph} ({cp}, {cpname}), e não um {latin} simples. Um acento já faz outro nome: para o DNS isto é {alabel}. Nome num alfabeto só, como este, costuma aparecer como está, então leia letra por letra.",
  },
  // An A-label of a lookalike.
  punycode: {
    en: "xn-- marks an A-label: an international name written in ASCII by the Punycode algorithm (RFC 3492, RFC 5890). {alabel} decodes to {ulabel}, where letter {pos} is {glyph} ({cp}, {cpname}). It imitates {real} and is not it.",
    pt: "xn-- marca um A-label: um nome internacional escrito em ASCII pelo algoritmo Punycode (RFC 3492, RFC 5890). {alabel} decodifica para {ulabel}, em que a letra {pos} é {glyph} ({cp}, {cpname}). Imita {real}, mas não é.",
  },
  // The brand on the left of another domain.
  subdomain: {
    en: "Read a host from the right. The domain here is {reg}; everything to its left is a name chosen by whoever owns {reg}, so {real} written on the left proves nothing.",
    pt: "Leia o host da direita para a esquerda. O domínio aqui é {reg}; tudo à esquerda dele é um nome escolhido por quem é dono de {reg}, então {real} escrito à esquerda não prova nada.",
  },
  // Same name, another top-level domain.
  tld: {
    en: "Same name, different ending: {host} ends in .{tld}, and {brand} lives at {real}. A domain runs all the way to its top-level label, so this is a separate registration that anyone could have made.",
    pt: "Mesmo nome, final diferente: {host} termina em .{tld}, e {brand} fica em {real}. O domínio vai até o rótulo de topo, então este é outro registro, que qualquer um poderia ter feito.",
  },
  // Text before the @.
  userinfo: {
    en: "Everything between // and @ is userinfo, not the host (RFC 3986, section 3.2.1). The host is what follows the @: {hostpart}. The {real} in front of it is a decoy, the very trick RFC 3986 warns about in section 7.6.",
    pt: "Tudo entre // e @ é userinfo, não o host (RFC 3986, seção 3.2.1). O host é o que vem depois do @: {hostpart}. O {real} na frente é isca, o mesmo truque contra o qual a RFC 3986 alerta na seção 7.6.",
  },
  // A numeric host.
  ip: {
    en: "The host is a bare IP address, {hostpart}, with no name at all. {brand} sends you to {real}; a numeric host tells you nothing about who answers.",
    pt: "O host é um endereço IP puro, {hostpart}, sem nome nenhum. {brand} manda você para {real}; um host numérico não diz nada sobre quem responde.",
  },
  // Two letters swapped.
  swap: {
    en: "Typosquat with two letters swapped: {host} has {fake} where {real} has {orig}. One slip of the fingers, a different owner.",
    pt: "Typosquat com duas letras trocadas: {host} tem {fake} onde {real} tem {orig}. Um escorregão no teclado, outro dono.",
  },
  // A doubled letter.
  double: {
    en: "Typosquat with a doubled letter: {host} repeats the {letter} of {real}. One extra keystroke, a different owner.",
    pt: "Typosquat com letra dobrada: {host} repete o {letter} de {real}. Uma tecla a mais, outro dono.",
  },
  // A missing letter.
  missing: {
    en: "Typosquat with a missing letter: {host} drops the {letter} of {real}. One keystroke short, a different owner.",
    pt: "Typosquat com letra faltando: {host} perdeu o {letter} de {real}. Uma tecla a menos, outro dono.",
  },
  // The accent dropped from a real international name.
  dropped: {
    en: "{host} drops the diaeresis: o ({plain}) where the real name has ö ({accented}). To DNS {real} is {alabel}, so the plain spelling is a different name with a different owner.",
    pt: "{host} perdeu o trema: o ({plain}) onde o nome real tem ö ({accented}). Para o DNS, {real} é {alabel}, então a grafia sem trema é outro nome, de outro dono.",
  },
  // rn for m.
  rn: {
    en: "No Unicode needed: {host} puts r and n side by side where {real} has m. Unicode's confusables data lists rn as a lookalike of m, and at a glance they read the same.",
    pt: "Nem precisa de Unicode: {host} põe r e n lado a lado onde {real} tem m. Os dados de confusáveis do Unicode listam rn como sósia de m, e numa olhada rápida dá na mesma.",
  },
  // 1 for l.
  one: {
    en: "{host} uses the digit 1 where {real} has the letter l. Unicode's confusables data lists them as lookalikes, and in many fonts only a tiny serif gives it away.",
    pt: "{host} usa o dígito 1 onde {real} tem a letra l. Os dados de confusáveis do Unicode listam os dois como sósias, e em muitas fontes só uma serifinha entrega.",
  },
  // The brand's name over another address.
  display: {
    en: "The display name says {display}, but a display name is free text that anyone can type (RFC 5322, section 3.4). The address in the angle brackets is what counts: {addr}, at {reg}, not {real}.",
    pt: "O nome de exibição diz {display}, mas nome de exibição é texto livre, que qualquer um digita (RFC 5322, seção 3.4). O que vale é o endereço entre os sinais < e >: {addr}, em {reg}, e não {real}.",
  },
  // A display name dressed as an address.
  displayAddr: {
    en: "The display name is dressed up as an address, {display}, but it is only a label. The real sender is in the angle brackets: {addr}, at {reg}.",
    pt: "O nome de exibição está fantasiado de endereço, {display}, mas é só um rótulo. O remetente de verdade está entre os sinais < e >: {addr}, em {reg}.",
  },
  // A short link.
  shortener: {
    en: "A shortener hides the destination: you only learn where {host} goes when it answers with a redirect (an HTTP 3xx with a Location, RFC 9110). A message in {brand}'s name that will not show where it leads fails the check; type {real} yourself.",
    pt: "O encurtador esconde o destino: você só descobre para onde {host} leva quando ele responde com um redirecionamento (um HTTP 3xx com Location, RFC 9110). Mensagem em nome de {brand} que não mostra para onde vai não passa; digite {real} você mesmo.",
  },
  // https on a stranger's domain.
  https: {
    en: "https and the padlock only mean the connection to {host} is encrypted; whoever registered {reg} can get a certificate for it. Chrome's own team says the lock icon does not indicate trustworthiness. The domain is the test, and {reg} is not {real}.",
    pt: "https e cadeado só dizem que a conexão com {host} é criptografada; quem registrou {reg} consegue um certificado para ele. A própria equipe do Chrome diz que o cadeado não indica que o site é confiável. O teste é o domínio, e {reg} não é {real}.",
  },
  // The brand plus a word.
  combo: {
    en: "{reg} is a separate domain that someone registered with the brand's name inside it. {brand} uses {real}; a hyphen and an extra word make a brand-new name, owned by whoever paid for it.",
    pt: "{reg} é outro domínio, registrado por alguém com o nome da marca dentro. {brand} usa {real}; um hífen e uma palavra a mais fazem um nome novinho, de quem pagou por ele.",
  },
  // The brand as a folder.
  path: {
    en: "The host ends at the first slash after //: here it is {hostpart}. The {real} after it is only a folder name on someone else's server.",
    pt: "O host termina na primeira barra depois de //: aqui ele é {hostpart}. O {real} depois disso é só nome de pasta no servidor de outra pessoa.",
  },
  // The real domain, plainly.
  plain: {
    en: "The host is {hostpart}, the domain {brand} really uses, with nothing hiding before or after it. What follows the slash is the brand's own business.",
    pt: "O host é {hostpart}, o domínio que {brand} usa de verdade, sem nada escondido antes ou depois. O que vem depois da barra é assunto da própria marca.",
  },
  // A real subdomain.
  realSub: {
    en: "Read from the right: the domain is {real}, and {sub} is a name the brand chose under it. A subdomain of the real domain belongs to the same owner.",
    pt: "Lendo da direita: o domínio é {real}, e {sub} é um nome que a marca criou abaixo dele. Subdomínio do domínio real tem o mesmo dono.",
  },
  // Tracking parameters.
  tracking: {
    en: "Everything after the ? is the query (RFC 3986, section 3.4). It can be long and full of tracking tags, but it never changes the host, and the host is {hostpart}, on {real}.",
    pt: "Tudo depois do ? é a query (RFC 3986, seção 3.4). Pode ser longa e cheia de parâmetros de rastreamento, mas nunca muda o host, e o host é {hostpart}, em {real}.",
  },
  // A matching sender.
  sender: {
    en: "The display name matches and the address, {addr}, is on {real}. That is as much as a From line can show; whether a forged From is delivered depends on the brand's DMARC policy and your mail provider (RFC 9989).",
    pt: "O nome de exibição confere e o endereço, {addr}, está em {real}. É o máximo que uma linha From mostra; se um From forjado é entregue ou não depende da política DMARC da marca e do seu provedor (RFC 9989).",
  },
  // Capitals.
  caps: {
    en: "Capitals do not matter in a host name: the host is case-insensitive (RFC 3986, section 3.2.2), so {hostpart} is {real}. The path is another matter, but it is the brand's own.",
    pt: "Maiúscula não faz diferença no host: ele não distingue maiúsculas de minúsculas (RFC 3986, seção 3.2.2), então {hostpart} é {real}. O caminho é outra história, mas é da própria marca.",
  },
  // Long but fine.
  long: {
    en: "Long is not the same as fake. A query full of codes is normal after a sign-in redirect, and the host is {hostpart}, the brand's own subdomain of {real}.",
    pt: "Longa não quer dizer falsa. Uma query cheia de códigos é normal depois do redirecionamento de um login, e o host é {hostpart}, subdomínio da própria marca em {real}.",
  },
  // :443.
  port: {
    en: ":443 is the default port of https written out (RFC 9110, section 4.2.2). It changes nothing: the host is still {real}.",
    pt: ":443 é a porta padrão do https escrita por extenso (RFC 9110, seção 4.2.2). Não muda nada: o host continua sendo {real}.",
  },
  // A genuine A-label.
  idn: {
    en: "xn-- is not a tell by itself. {alabel} is the A-label of {ulabel}, the same name written in ASCII for DNS (RFC 3492). What it decodes to is what matters, and here it is the domain {brand} really uses.",
    pt: "xn-- sozinho não é pista. {alabel} é o A-label de {ulabel}, o mesmo nome escrito em ASCII para o DNS (RFC 3492). O que importa é o que ele decodifica, e aqui é o domínio que {brand} usa de verdade.",
  },
} as const;

/**
 * The parts of a URL, split the way RFC 3986 does (Appendix B's regular expression, then the authority).
 *
 * @param url the URL as written
 * @returns scheme, userinfo, host, port, path and query (empty strings where absent)
 */
export function parseUrl(url: string): { scheme: string; userinfo: string; host: string; port: string; path: string; query: string } {
  // RFC 3986, Appendix B: scheme, authority, path, query, fragment.
  const m = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/.exec(url);
  // The regular expression matches any string, but stay safe.
  if (!m) return { scheme: "", userinfo: "", host: "", port: "", path: "", query: "" };
  // The authority, if any.
  const authority = m[4] ?? "";
  // userinfo ends at the last @ (RFC 3986, section 3.2: the host follows the @).
  const at = authority.lastIndexOf("@");
  // Before it.
  const userinfo = at >= 0 ? authority.slice(0, at) : "";
  // After it: host and maybe a port.
  const hostport = at >= 0 ? authority.slice(at + 1) : authority;
  // The port follows the last colon (no IP-literals in this game).
  const colon = hostport.lastIndexOf(":");
  // The host.
  const host = colon >= 0 ? hostport.slice(0, colon) : hostport;
  // The port.
  const port = colon >= 0 ? hostport.slice(colon + 1) : "";
  // All the parts.
  return { scheme: m[2] ?? "", userinfo, host, port, path: m[5] ?? "", query: m[7] ?? "" };
}

/**
 * The registrable domain of a host, as this game's names have it: the last two labels (no multi-label suffixes are used).
 *
 * @param host a host name
 * @returns its last two labels, lower-cased, in ASCII form
 */
export function registrable(host: string): string {
  // ASCII form, lower case, so lookalikes compare as the different names they are.
  const ascii = hostToAscii(host).toLowerCase();
  // The last two labels.
  return ascii.split(".").slice(-2).join(".");
}

/**
 * The domain of an email address.
 *
 * @param addr the address
 * @returns what follows its @
 */
export function addressDomain(addr: string): string {
  // After the last @.
  return addr.slice(addr.lastIndexOf("@") + 1);
}

/**
 * The host a card points at: the URL's host, or the domain of the address.
 *
 * @param card a card
 * @returns the host
 */
export function cardHost(card: Card): string {
  // Email: the address's domain; URL: the parsed host.
  return card.kind === "email" ? addressDomain(card.text) : parseUrl(card.text).host;
}

/**
 * Replace the first letter that has a stand-in from a list.
 *
 * @param label the label to fake
 * @param glyphs the stand-ins, in order of preference
 * @returns the faked label, the stand-in used and its 1-based position, or null when no letter fits
 */
function swapGlyph(label: string, glyphs: readonly Glyph[]): { fake: string; glyph: Glyph; pos: number } | null {
  // Each stand-in in turn.
  for (const g of glyphs) {
    // Where its Latin letter first appears.
    const i = label.indexOf(g.latin);
    // Not in this label.
    if (i < 0) continue;
    // The label with that one letter replaced.
    return { fake: label.slice(0, i) + g.ch + label.slice(i + 1), glyph: g, pos: i + 1 };
  }
  // No letter can be faked with these.
  return null;
}

/**
 * A code-point note for a stand-in.
 *
 * @param g the stand-in
 * @returns the note
 */
function note(g: Glyph): CodePointNote {
  // Character, U+XXXX, name, script.
  return { ch: g.ch, cp: codePoint(g.ch), name: g.name, script: g.script };
}

/**
 * Upper-case the first letter.
 *
 * @param s a word
 * @returns the word with a capital
 */
function capital(s: string): string {
  // First letter up.
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Build the whole pool of cards. Pure and fixed: the same pool every time.
 *
 * @returns every card
 */
function buildPool(): Card[] {
  // The cards.
  const out: Card[] = [];
  // Add one card, filling in what every card shares.
  const add = (c: Omit<Card, "points" | "context"> & { points?: CodePointNote[]; context?: Bi | null }) => {
    // Defaults for the optional parts.
    out.push({ points: [], context: null, ...c });
  };
  // Each brand in turn, with its index for variety.
  BRANDS.forEach((b, i) => {
    // The values every template can use.
    const base = { real: b.domain, brand: b.name.en };
    // The Portuguese templates name the brand by its Portuguese name.
    const both = (key: keyof typeof T, args: Record<string, string>): Bi => {
      // English with the English name, Portuguese with the Portuguese one.
      const en = fill(T[key].en, { ...base, ...args });
      // The Portuguese.
      const pt = fill(T[key].pt, { ...base, ...args, brand: b.name.pt, script: args.scriptPt ?? args.script ?? "" });
      // Both.
      return { en, pt };
    };
    // A context line, chosen by a counter so each brand's two lines alternate.
    let ctxTurn = 0;
    // The next context line.
    const ctx = (): Bi => b.contexts[ctxTurn++ % 2];
    // An attacker domain, varied by brand and use.
    const atk = (k: number) => ATTACKER_DOMAINS[(i + k) % ATTACKER_DOMAINS.length];
    // An id for a card.
    const id = (tell: Tell, n: number) => `${tell}:${b.id}:${n}`;
    // The ferry has its own small set; the others share the generators.
    if (b.id === "ferry") {
      // The real name's A-label.
      const alabel = hostToAscii(b.sld);
      // Its Unicode form.
      const ulabel = b.sld;
      // Legit: the Unicode name, as a browser shows a single-script Latin name.
      add({ id: id("legit-plain", 1), kind: "url", text: `https://${b.domain}${b.paths[0]}`, brand: b.id, verdict: "legit", tell: "legit-plain", context: ctx(), explain: both("plain", { hostpart: b.domain }) });
      // Legit: the same name as an A-label.
      add({ id: id("legit-idn", 1), kind: "url", text: `https://${alabel}.example${b.paths[1]}`, brand: b.id, verdict: "legit", tell: "legit-idn", context: ctx(), explain: both("idn", { alabel, ulabel }), points: [note(FERRY_O)], ulabel, alabel });
      // Legit: a subdomain.
      add({ id: id("legit-subdomain", 1), kind: "url", text: `https://${b.subs[0]}.${b.domain}/`, brand: b.id, verdict: "legit", tell: "legit-subdomain", context: ctx(), explain: both("realSub", { sub: b.subs[0] }) });
      // Legit: a matching sender.
      add({ id: id("legit-sender", 1), kind: "email", display: b.name.en, text: `${b.senders[0]}@${b.domain}`, brand: b.id, verdict: "legit", tell: "legit-sender", context: ctx(), explain: both("sender", { addr: `${b.senders[0]}@${b.domain}` }) });
      // Phish: the umlaut dropped.
      add({ id: id("typosquat", 1), kind: "url", text: `https://fjordlin.example${b.paths[1]}`, brand: b.id, verdict: "phish", tell: "typosquat", context: ctx(), explain: both("dropped", { host: "fjordlin.example", plain: "U+006F", accented: codePoint(FERRY_O.ch), alabel: `${alabel}.example` }), points: [note(FERRY_O)] });
      // Phish: the plain spelling plus a word.
      add({ id: id("combosquat", 1), kind: "url", text: "https://fjordlin-tickets.example/", brand: b.id, verdict: "phish", tell: "combosquat", context: ctx(), explain: both("combo", { reg: "fjordlin-tickets.example" }) });
      // Phish: the real name on the left of someone else's domain.
      add({ id: id("brand-subdomain", 1), kind: "url", text: `https://${b.domain}.${atk(3)}/booking`, brand: b.id, verdict: "phish", tell: "brand-subdomain", context: ctx(), explain: both("subdomain", { reg: registrable(atk(3)) }) });
      // Done with the ferry.
      return;
    }
    // ---- Phish: homoglyphs (Greek and Cyrillic in a URL, an accented letter in a sender's address) ----
    // Greek.
    const gr = swapGlyph(b.sld, GREEK);
    // Cyrillic.
    const cy = swapGlyph(b.sld, CYRILLIC);
    // Accented.
    const ac = swapGlyph(b.sld, ACCENTED);
    // The Greek card.
    if (gr) {
      // The faked host.
      const host = `${gr.fake}.example`;
      // The card.
      add({ id: id("homoglyph", 1), kind: "url", text: `https://${host}${b.paths[0]}`, brand: b.id, verdict: "phish", tell: "homoglyph", context: ctx(), explain: both("mixed", { host, pos: String(gr.pos), glyph: gr.glyph.ch, cp: codePoint(gr.glyph.ch), cpname: gr.glyph.name, script: SCRIPT_NAMES[gr.glyph.script].en, scriptPt: SCRIPT_NAMES[gr.glyph.script].pt, latin: gr.glyph.latin, alabel: hostToAscii(host) }), points: [note(gr.glyph)], ulabel: gr.fake });
    }
    // The Cyrillic card.
    if (cy) {
      // The faked host, on a sign-in subdomain.
      const host = `${b.subs[0]}.${cy.fake}.example`;
      // The card.
      add({ id: id("homoglyph", 2), kind: "url", text: `https://${host}/`, brand: b.id, verdict: "phish", tell: "homoglyph", context: ctx(), explain: both("mixed", { host, pos: String(cy.pos), glyph: cy.glyph.ch, cp: codePoint(cy.glyph.ch), cpname: cy.glyph.name, script: SCRIPT_NAMES[cy.glyph.script].en, scriptPt: SCRIPT_NAMES[cy.glyph.script].pt, latin: cy.glyph.latin, alabel: hostToAscii(host) }), points: [note(cy.glyph)], ulabel: cy.fake });
    }
    // The accented sender.
    if (ac) {
      // The faked domain.
      const host = `${ac.fake}.example`;
      // The address.
      const addr = `${b.senders[0]}@${host}`;
      // The card.
      add({ id: id("homoglyph", 3), kind: "email", display: b.name.en, text: addr, brand: b.id, verdict: "phish", tell: "homoglyph", context: ctx(), explain: both("accent", { host, pos: String(ac.pos), glyph: ac.glyph.ch, cp: codePoint(ac.glyph.ch), cpname: ac.glyph.name, latin: ac.glyph.latin, alabel: hostToAscii(host) }), points: [note(ac.glyph)], ulabel: ac.fake });
    }
    // ---- Phish: punycode of the Cyrillic lookalike ----
    if (cy) {
      // The A-label.
      const alabel = hostToAscii(cy.fake);
      // The card.
      add({ id: id("punycode", 1), kind: "url", text: `https://${alabel}.example${b.paths[1]}`, brand: b.id, verdict: "phish", tell: "punycode", context: ctx(), explain: both("punycode", { alabel, ulabel: cy.fake, pos: String(cy.pos), glyph: cy.glyph.ch, cp: codePoint(cy.glyph.ch), cpname: cy.glyph.name }), points: [note(cy.glyph)], ulabel: cy.fake, alabel });
    }
    // ---- Phish: the brand on the left of someone else's domain, twice ----
    // The whole real domain as labels.
    add({ id: id("brand-subdomain", 1), kind: "url", text: `https://${b.domain}.${atk(0)}/login`, brand: b.id, verdict: "phish", tell: "brand-subdomain", context: ctx(), explain: both("subdomain", { reg: registrable(atk(0)) }) });
    // A real-looking subdomain plus the brand.
    add({ id: id("brand-subdomain", 2), kind: "url", text: `https://${b.subs[0]}.${b.sld}.${atk(4)}/`, brand: b.id, verdict: "phish", tell: "brand-subdomain", context: ctx(), explain: both("subdomain", { reg: registrable(atk(4)) }) });
    // ---- Phish: another top-level domain ----
    // The TLD for this brand.
    const tld = OTHER_TLDS[i % OTHER_TLDS.length];
    // The host.
    const tldHost = `${b.sld}.${tld}`;
    // The card.
    add({ id: id("lookalike-tld", 1), kind: "url", text: `https://${tldHost}${b.paths[0]}`, brand: b.id, verdict: "phish", tell: "lookalike-tld", context: ctx(), explain: both("tld", { host: tldHost, tld }) });
    // ---- Phish: userinfo, before an address and before a name ----
    // The documentation address.
    const ip = `203.0.113.${17 + 7 * i}`;
    // The brand's domain as userinfo, then an IP.
    add({ id: id("userinfo", 1), kind: "url", text: `https://${b.domain}@${ip}/login`, brand: b.id, verdict: "phish", tell: "userinfo", context: ctx(), explain: both("userinfo", { hostpart: ip }) });
    // A subdomain, a colon and a word as userinfo, then an attacker's name.
    add({ id: id("userinfo", 2), kind: "url", text: `https://${b.subs[0]}.${b.domain}:verify@${atk(1)}/session`, brand: b.id, verdict: "phish", tell: "userinfo", context: ctx(), explain: both("userinfo", { hostpart: atk(1) }) });
    // ---- Phish: a bare IP address ----
    // Another documentation address.
    const ip2 = `198.51.100.${23 + 9 * i}`;
    // The card (plain http, as these usually are).
    add({ id: id("ip-host", 1), kind: "url", text: `http://${ip2}/${b.sld}/login`, brand: b.id, verdict: "phish", tell: "ip-host", context: ctx(), explain: both("ip", { hostpart: ip2 }) });
    // ---- Phish: typosquats ----
    // Swap two different neighbouring letters near the middle.
    let p = Math.max(1, Math.floor(b.sld.length / 2) - 1);
    // Move along until the two letters differ (labels here always have some).
    while (p < b.sld.length - 2 && b.sld[p] === b.sld[p + 1]) p++;
    // The swapped label.
    const swapped = b.sld.slice(0, p) + b.sld[p + 1] + b.sld[p] + b.sld.slice(p + 2);
    // Its host.
    const swapHost = `${swapped}.example`;
    // The card.
    add({ id: id("typosquat", 1), kind: "url", text: `https://${swapHost}${b.paths[0]}`, brand: b.id, verdict: "phish", tell: "typosquat", context: ctx(), explain: both("swap", { host: swapHost, fake: b.sld[p + 1] + b.sld[p], orig: b.sld[p] + b.sld[p + 1] }) });
    // Double the last letter but one.
    const dq = b.sld.length - 2;
    // The doubled label.
    const doubled = b.sld.slice(0, dq + 1) + b.sld[dq] + b.sld.slice(dq + 1);
    // Its host.
    const dblHost = `${doubled}.example`;
    // A sender at it.
    add({ id: id("typosquat", 2), kind: "email", display: b.name.en, text: `${b.senders[0]}@${dblHost}`, brand: b.id, verdict: "phish", tell: "typosquat", context: ctx(), explain: both("double", { host: dblHost, letter: b.sld[dq] }) });
    // Drop the second letter.
    const missing = b.sld[0] + b.sld.slice(2);
    // Its host.
    const missHost = `${b.subs[1]}.${missing}.example`;
    // The card.
    add({ id: id("typosquat", 3), kind: "url", text: `https://${missHost}/`, brand: b.id, verdict: "phish", tell: "typosquat", context: ctx(), explain: both("missing", { host: missHost, letter: b.sld[1] }) });
    // ---- Phish: ASCII lookalikes (rn for m, else 1 for l) ----
    if (b.sld.includes("m")) {
      // rn for the first m.
      const fake = b.sld.replace("m", "rn");
      // Its host.
      const host = `${fake}.example`;
      // The card.
      add({ id: id("ascii-lookalike", 1), kind: "url", text: `https://${host}${b.paths[1]}`, brand: b.id, verdict: "phish", tell: "ascii-lookalike", context: ctx(), explain: both("rn", { host }) });
    } else if (b.sld.includes("l")) {
      // 1 for the last l.
      const at = b.sld.lastIndexOf("l");
      // The faked label.
      const fake = b.sld.slice(0, at) + "1" + b.sld.slice(at + 1);
      // Its host.
      const host = `${fake}.example`;
      // The card.
      add({ id: id("ascii-lookalike", 1), kind: "url", text: `https://${host}${b.paths[1]}`, brand: b.id, verdict: "phish", tell: "ascii-lookalike", context: ctx(), explain: both("one", { host }) });
    }
    // ---- Phish: display names ----
    // The brand's name over a free-mail address.
    const free = FREEMAIL[i % FREEMAIL.length];
    // The address.
    const freeAddr = `${b.sld}.${b.senders[0]}@${free}`;
    // The card.
    add({ id: id("display-name", 1), kind: "email", display: b.name.en, text: freeAddr, brand: b.id, verdict: "phish", tell: "display-name", context: ctx(), explain: both("display", { display: b.name.en, addr: freeAddr, reg: registrable(free) }) });
    // An address as the display name, over an attacker's address.
    const fakeShown = `${b.senders[1]}@${b.domain}`;
    // The real address behind it.
    const behind = `notice${40 + i}@${atk(2)}`;
    // The card.
    add({ id: id("display-name", 2), kind: "email", display: fakeShown, text: behind, brand: b.id, verdict: "phish", tell: "display-name", context: ctx(), explain: both("displayAddr", { display: fakeShown, addr: behind, reg: registrable(atk(2)) }) });
    // ---- Phish: a shortener ----
    // The shortener for this brand.
    const sh = SHORTENERS[i % SHORTENERS.length];
    // A code that looks like one.
    const code = ["x7Kq2", "Qv7pL", "aB3x9", "Rt5Wm", "k2Ze8", "Hp4Ns", "uY6cD"][i % 7];
    // The card.
    add({ id: id("shortener", 1), kind: "url", text: `https://${sh}/${code}`, brand: b.id, verdict: "phish", tell: "shortener", context: ctx(), explain: both("shortener", { host: sh }) });
    // ---- Phish: https on a stranger's domain ----
    // The host.
    const httpsHost = `secure-${b.sld}.example`;
    // The card, with the padlock as its context.
    add({ id: id("https-padlock", 1), kind: "url", text: `https://${httpsHost}/verify`, brand: b.id, verdict: "phish", tell: "https-padlock", context: { en: "The page shows a padlock and https.", pt: "A página mostra o cadeado e https." }, explain: both("https", { host: httpsHost, reg: registrable(httpsHost) }) });
    // ---- Phish: the brand plus a word, as a URL and as a sender ----
    // The word for the URL.
    const w1 = BOLT_ON[i % BOLT_ON.length];
    // The host.
    const comboHost = `${b.sld}-${w1}.example`;
    // The URL card.
    add({ id: id("combosquat", 1), kind: "url", text: `https://${comboHost}/`, brand: b.id, verdict: "phish", tell: "combosquat", context: ctx(), explain: both("combo", { reg: comboHost }) });
    // The word for the sender.
    const w2 = BOLT_ON[(i + 3) % BOLT_ON.length];
    // The sender's domain.
    const comboMail = `${b.sld}${w2}.example`;
    // The sender card.
    add({ id: id("combosquat", 2), kind: "email", display: `${b.name.en} ${capital(w2)}`, text: `${b.senders[1]}@${comboMail}`, brand: b.id, verdict: "phish", tell: "combosquat", context: ctx(), explain: both("combo", { reg: comboMail }) });
    // ---- Phish: the brand as a folder ----
    // The hosting service.
    const hosting = HOSTING[i % HOSTING.length];
    // The card.
    add({ id: id("brand-in-path", 1), kind: "url", text: `https://${hosting}/${b.domain}/login.html`, brand: b.id, verdict: "phish", tell: "brand-in-path", context: ctx(), explain: both("path", { hostpart: hosting }) });
    // ---- Legit: the real domain, twice ----
    // Each path.
    b.paths.forEach((path, k) => {
      // The card.
      add({ id: id("legit-plain", k + 1), kind: "url", text: `https://${b.domain}${path}`, brand: b.id, verdict: "legit", tell: "legit-plain", context: ctx(), explain: both("plain", { hostpart: b.domain }) });
    });
    // ---- Legit: real subdomains, twice ----
    b.subs.forEach((sub, k) => {
      // The card (the second one with a path).
      add({ id: id("legit-subdomain", k + 1), kind: "url", text: `https://${sub}.${b.domain}${k === 1 ? b.paths[1] : "/"}`, brand: b.id, verdict: "legit", tell: "legit-subdomain", context: ctx(), explain: both("realSub", { sub }) });
    });
    // ---- Legit: tracking parameters, twice ----
    // A newsletter link.
    const trackA = `https://${b.domain}${b.paths[1]}?utm_source=newsletter&utm_medium=email&utm_campaign=nov26`;
    // Its card.
    add({ id: id("legit-tracking", 1), kind: "url", text: trackA, brand: b.id, verdict: "legit", tell: "legit-tracking", context: ctx(), explain: both("tracking", { hostpart: b.domain }) });
    // An app link with a click id.
    const trackB = `https://www.${b.domain}/?ref=app&cid=${(90210 + i * 1111).toString(36)}&lang=en`;
    // Its card.
    add({ id: id("legit-tracking", 2), kind: "url", text: trackB, brand: b.id, verdict: "legit", tell: "legit-tracking", context: ctx(), explain: both("tracking", { hostpart: `www.${b.domain}` }) });
    // ---- Legit: matching senders, twice ----
    // At the domain.
    const s1 = `${b.senders[0]}@${b.domain}`;
    // Its card.
    add({ id: id("legit-sender", 1), kind: "email", display: b.name.en, text: s1, brand: b.id, verdict: "legit", tell: "legit-sender", context: ctx(), explain: both("sender", { addr: s1 }) });
    // At a notify subdomain.
    const s2 = `${b.senders[1]}@notify.${b.domain}`;
    // Its card.
    add({ id: id("legit-sender", 2), kind: "email", display: b.name.en, text: s2, brand: b.id, verdict: "legit", tell: "legit-sender", context: ctx(), explain: both("sender", { addr: s2 }) });
    // ---- Legit: capitals ----
    // The host with a capital.
    const capsHost = `${capital(b.sld)}.example`;
    // Its card.
    add({ id: id("legit-case", 1), kind: "url", text: `https://${capsHost}${b.paths[0]}`, brand: b.id, verdict: "legit", tell: "legit-case", context: ctx(), explain: both("caps", { hostpart: capsHost }) });
    // ---- Legit: long ----
    // A sign-in callback.
    const longHost = `${b.subs[0]}.${b.domain}`;
    // Its card.
    add({ id: id("legit-long", 1), kind: "url", text: `https://${longHost}/oauth/callback?state=k7Jq2xVb9mR4&code=4f9a1c7e0d&next=%2Fsettings%2Fsecurity`, brand: b.id, verdict: "legit", tell: "legit-long", context: ctx(), explain: both("long", { hostpart: longHost }) });
    // ---- Legit: the default port written out ----
    add({ id: id("legit-port", 1), kind: "url", text: `https://${b.domain}:443${b.paths[0]}`, brand: b.id, verdict: "legit", tell: "legit-port", context: ctx(), explain: both("port", {}) });
  });
  // The pool.
  return out;
}

/** The pool, built once on first use. */
let POOL: Card[] | null = null;

/**
 * Every card in the game.
 *
 * @returns the pool (the same array every call)
 */
export function pool(): Card[] {
  // Built on first use.
  if (!POOL) POOL = buildPool();
  // The pool.
  return POOL;
}

/**
 * A card by its id.
 *
 * @param id the card's id
 * @returns the card, or undefined
 */
export function cardById(id: string): Card | undefined {
  // A linear search over a few hundred cards is instant.
  return pool().find((c) => c.id === id);
}

/** A brand by id. */
export function brandById(id: string): Brand {
  // Every card names a brand that exists; the first is a safe fallback.
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}

/**
 * Draw a round: n phish and size - n legit cards, one tell each as far as the tells go round, shuffled.
 *
 * @param rng the round's generator
 * @param size how many cards
 * @returns the cards, in play order
 */
export function drawRound(rng: Rng, size: number): Card[] {
  // How many phish.
  const nPhish = rng.range(MIN_SIDE, Math.min(MAX_SIDE, size - MIN_SIDE));
  // The rest are legit.
  const nLegit = size - nPhish;
  // The cards chosen so far, by id.
  const chosen = new Set<string>();
  // Brands used so far, to spread them.
  const brandUse = new Map<string, number>();
  // Pick n cards from a list of tells, cycling through them in a shuffled order.
  const pickSide = (tells: readonly Tell[], n: number): Card[] => {
    // The tells in a random order.
    const order = rng.shuffle(tells);
    // The picks.
    const picks: Card[] = [];
    // One per tell, wrapping round when n is larger; bounded by n.
    for (let k = 0; k < n; k++) {
      // The tell for this pick.
      const tell = order[k % order.length];
      // Its unused cards, preferring brands seen least.
      const ofTell = pool().filter((c) => c.tell === tell && !chosen.has(c.id));
      // A tell with no card left (the genuine A-label has one) gives way to any unused card on the same side.
      const options = ofTell.length ? ofTell : pool().filter((c) => tells.includes(c.tell) && !chosen.has(c.id));
      // The least-used brand count among them.
      const least = Math.min(...options.map((c) => brandUse.get(c.brand) ?? 0));
      // Those cards.
      const fair = options.filter((c) => (brandUse.get(c.brand) ?? 0) === least);
      // One of them.
      const card = rng.pick(fair);
      // Taken.
      chosen.add(card.id);
      // Its brand counted.
      brandUse.set(card.brand, (brandUse.get(card.brand) ?? 0) + 1);
      // Kept.
      picks.push(card);
    }
    // The side's cards.
    return picks;
  };
  // Both sides, then mixed together.
  return rng.shuffle([...pickSide(PHISH_TELLS, nPhish), ...pickSide(LEGIT_TELLS, nLegit)]);
}

/**
 * The daily round of a UTC day.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns its 15 cards
 */
export function dailyRound(dayKey: string): Card[] {
  // The day's generator.
  return drawRound(dailyRng(GAME_ID, dayKey), DAILY_SIZE);
}

/**
 * One card for practice or a speed run, with a gentle lean towards the side less seen so far.
 *
 * @param rng the session's generator
 * @param recent ids of the cards shown lately, not to repeat
 * @returns a card
 */
export function nextPracticeCard(rng: Rng, recent: readonly string[]): Card {
  // Phish a little over half the time, as in the daily round.
  const verdict: Verdict = rng.chance(0.55) ? "phish" : "legit";
  // A tell on that side.
  const tell = rng.pick(verdict === "phish" ? PHISH_TELLS : LEGIT_TELLS);
  // Its cards not seen lately.
  const fresh = pool().filter((c) => c.tell === tell && !recent.includes(c.id));
  // Any card of the tell when all were seen.
  const options = fresh.length ? fresh : pool().filter((c) => c.tell === tell);
  // One of them.
  return rng.pick(options);
}

/** A seed for practice, from a number the component chooses. */
export function practiceRng(seed: number): Rng {
  // A plain seeded generator.
  return makeRng(seed);
}

/**
 * The score of a run of answers: 100 a correct answer, plus 20 for each answer of a streak after the first, up to +100.
 *
 * @param results right or wrong, in order
 * @returns correct answers, points and the longest streak
 */
export function scoreRun(results: readonly boolean[]): { correct: number; points: number; bestStreak: number } {
  // Running totals.
  let correct = 0;
  // Points.
  let points = 0;
  // The current streak.
  let streak = 0;
  // The longest.
  let bestStreak = 0;
  // Each answer.
  for (const ok of results) {
    // A wrong answer ends the streak and scores nothing.
    if (!ok) {
      // Reset.
      streak = 0;
      // Next.
      continue;
    }
    // One more right.
    correct++;
    // The streak grows.
    streak++;
    // The longest so far.
    bestStreak = Math.max(bestStreak, streak);
    // 100, plus the streak bonus.
    points += 100 + Math.min(100, 20 * (streak - 1));
  }
  // The totals.
  return { correct, points, bestStreak };
}

/**
 * The share card's emoji line: green for right, red for wrong (the cards themselves are not shown).
 *
 * @param results right or wrong, in order
 * @returns the line
 */
export function emojiLine(results: readonly boolean[]): string {
  // One square per answer.
  return results.map((ok) => (ok ? "\u{1F7E9}" : "\u{1F7E5}")).join("");
}

/**
 * The self-test: the punycode samples, every card, and 400 daily rounds.
 *
 * @returns what was checked and every problem found
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Things checked.
  let checked = 0;
  // RFC 3492's samples, both ways.
  failures.push(...punycodeSelfTest());
  // Counted.
  checked += 1;
  // The pool.
  const cards = pool();
  // At least 150 cards.
  if (cards.length < 150) failures.push(`pool has ${cards.length} cards, fewer than 150`);
  // Ids are unique.
  if (new Set(cards.map((c) => c.id)).size !== cards.length) failures.push("two cards share an id");
  // Each card.
  for (const c of cards) {
    // Counted.
    checked++;
    // Its tell is a known one.
    if (!(c.tell in TELLS)) {
      // Unknown.
      failures.push(`${c.id}: unknown tell ${c.tell}`);
      // Nothing more to check.
      continue;
    }
    // Its verdict is its tell's.
    if (TELLS[c.tell].verdict !== c.verdict) failures.push(`${c.id}: verdict does not match its tell`);
    // Both languages present, every slot filled.
    for (const lang of ["en", "pt"] as const) {
      // The text.
      const text = c.explain[lang];
      // Present and long enough to say something.
      if (!text || text.length < 40) failures.push(`${c.id}: ${lang} explanation missing or too short`);
      // No slot left unfilled.
      if (/\{[a-zA-Z]+\}/.test(text)) failures.push(`${c.id}: ${lang} explanation has an unfilled slot`);
      // No em dash (house rule for English; Portuguese uses none here either).
      if (text.includes(String.fromCharCode(0x2014))) failures.push(`${c.id}: ${lang} explanation has an em dash`);
      // The context line, when present, in both languages.
      if (c.context && !c.context[lang]) failures.push(`${c.id}: ${lang} context missing`);
    }
    // The brand exists.
    const b = BRANDS.find((x) => x.id === c.brand);
    // Unknown brand.
    if (!b) {
      // Recorded.
      failures.push(`${c.id}: unknown brand`);
      // Nothing more to check.
      continue;
    }
    // The host the card points at, and its registrable domain.
    const host = cardHost(c);
    // Its registrable domain (ASCII form, so a lookalike is its own name).
    const reg = registrable(host);
    // A legit card points into the brand's domain; a phish card (other than its display text) does not.
    const intoBrand = reg === registrable(b.domain);
    // Legit cards must point into it.
    if (c.verdict === "legit" && !intoBrand) failures.push(`${c.id}: legit card's host ${host} is outside ${b.domain}`);
    // Phish cards must not.
    if (c.verdict === "phish" && intoBrand) failures.push(`${c.id}: phish card's host ${host} is inside ${b.domain}`);
    // URL cards parse with a scheme and a host.
    if (c.kind === "url") {
      // The parts.
      const u = parseUrl(c.text);
      // http or https.
      if (u.scheme !== "https" && u.scheme !== "http") failures.push(`${c.id}: scheme ${u.scheme}`);
      // A host.
      if (!u.host) failures.push(`${c.id}: no host`);
      // Userinfo appears only on userinfo cards.
      if ((u.userinfo !== "") !== (c.tell === "userinfo")) failures.push(`${c.id}: userinfo where the tell says otherwise`);
      // A userinfo card hides the brand's domain in its userinfo.
      if (c.tell === "userinfo" && !u.userinfo.includes(b.domain)) failures.push(`${c.id}: userinfo does not carry the brand's domain`);
    } else {
      // An email card has a display name and an address with one @.
      if (!c.display || (c.text.match(/@/g) ?? []).length !== 1) failures.push(`${c.id}: malformed From line`);
    }
    // Homoglyph cards: non-ASCII code points of the claimed script, each a known stand-in, and the skeleton is the brand's name.
    if (c.tell === "homoglyph") {
      // The faked label.
      const label = c.ulabel ?? "";
      // Its non-ASCII characters.
      const odd = Array.from(label).filter((ch) => !isAscii(ch));
      // There must be some.
      if (odd.length === 0) failures.push(`${c.id}: homoglyph card is plain ASCII`);
      // The label must really be in the card.
      if (!host.split(".").includes(label)) failures.push(`${c.id}: homoglyph label not in the host`);
      // Each must be a stand-in the game knows, of the script the note claims.
      for (const ch of odd) {
        // Its entry.
        const g = GLYPHS.get(ch);
        // Unknown character.
        if (!g) {
          // Recorded.
          failures.push(`${c.id}: ${codePoint(ch)} is not in the stand-in table`);
          // Next.
          continue;
        }
        // The code point's block must match the claimed script.
        const n = ch.codePointAt(0) as number;
        // Greek and Coptic, Cyrillic, or Latin-1 Supplement and Latin Extended-A.
        const inScript = g.script === "Greek" ? n >= 0x0370 && n <= 0x03ff : g.script === "Cyrillic" ? n >= 0x0400 && n <= 0x04ff : n >= 0x00c0 && n <= 0x017f;
        // Out of its block.
        if (!inScript) failures.push(`${c.id}: ${codePoint(ch)} is not ${g.script}`);
        // The note on the card must name it.
        if (!c.points.some((p) => p.ch === ch && p.script === g.script)) failures.push(`${c.id}: code point note missing for ${codePoint(ch)}`);
      }
      // Mapping each stand-in back to its Latin letter gives the brand's real label.
      const skeleton = Array.from(label).map((ch) => GLYPHS.get(ch)?.latin ?? ch).join("");
      // Must be the brand's.
      if (skeleton !== b.sld) failures.push(`${c.id}: skeleton ${skeleton} is not ${b.sld}`);
    }
    // Punycode cards (and the genuine A-label): the A-label decodes to the claimed Unicode label.
    if (c.tell === "punycode" || c.tell === "legit-idn") {
      // The label shown.
      const alabel = c.alabel ?? "";
      // It must start with the ACE prefix.
      if (!alabel.startsWith(ACE_PREFIX)) failures.push(`${c.id}: A-label without xn--`);
      // A throw is a failure.
      try {
        // Decoded.
        const u = punyDecode(alabel.slice(ACE_PREFIX.length));
        // Must be the claimed label.
        if (u !== c.ulabel) failures.push(`${c.id}: ${alabel} decodes to ${u}, not ${c.ulabel}`);
        // The whole host decodes the same way.
        if (!hostToUnicode(host).split(".").includes(c.ulabel ?? "")) failures.push(`${c.id}: host does not decode to the label`);
        // A phish A-label is a lookalike; a legit one is the brand's own name.
        if (c.tell === "punycode" && u === b.sld) failures.push(`${c.id}: punycode decodes to the real name`);
        // The genuine one is the real name.
        if (c.tell === "legit-idn" && u !== b.sld) failures.push(`${c.id}: genuine A-label is not the real name`);
      } catch (err) {
        // Malformed.
        failures.push(`${c.id}: ${alabel} does not decode: ${(err as Error).message}`);
      }
    }
  }
  // 400 daily rounds from launch: balanced, mixed, deterministic.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays("2026-11-03", d);
    // Drawn twice.
    const a = dailyRound(day);
    // Again.
    const b = dailyRound(day);
    // Counted.
    checked++;
    // The same both times.
    if (a.map((c) => c.id).join() !== b.map((c) => c.id).join()) failures.push(`${day}: round is not deterministic`);
    // 15 cards.
    if (a.length !== DAILY_SIZE) failures.push(`${day}: ${a.length} cards`);
    // No card twice.
    if (new Set(a.map((c) => c.id)).size !== a.length) failures.push(`${day}: a card appears twice`);
    // The phish count.
    const nPhish = a.filter((c) => c.verdict === "phish").length;
    // Within 6 to 9, so legit is too.
    if (nPhish < MIN_SIDE || nPhish > MAX_SIDE) failures.push(`${day}: ${nPhish} phish cards`);
    // A mix of tells: at least one per card on each side up to the number of tells there are.
    const tells = new Set(a.map((c) => c.tell)).size;
    // Ten or more different tells in fifteen cards.
    if (tells < 10) failures.push(`${day}: only ${tells} different tells`);
  }
  // The report.
  return { checked, failures };
}
