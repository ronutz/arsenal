// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/compute.ts
// ----------------------------------------------------------------------------
// The tcpdump command and filter explainer: paste a tcpdump command line or a
// bare capture filter, and get every option explained, then the filter parsed
// into a tree with every primitive in plain words, its implicit defaults made
// explicit, the precedence decisions shown, byte-offset tests decoded, the
// encapsulation offset shifts flagged, and every error placed at its position.
//
// Pure and deterministic: text in, explanation out. Nothing is executed,
// resolved, captured or fetched (zero egress, D-49). The parts:
//   * options.ts   shell words and tcpdump's options (tcpdump(1), tcpdump.c);
//   * lexer.ts     the filter's tokens (libpcap scanner.l);
//   * parser.ts    the filter's syntax tree (libpcap grammar.y.in);
//   * semantics.ts meanings, defaults, inheritance, refusals (pcap-filter(7),
//                  gencode.c, optimize.c);
//   * texts.ts     shared wording in English and Brazilian Portuguese.
//
// The basis is the releases tcpdump.org offers, read 2026-10-27: tcpdump
// 4.99.7 (stable, 21 September 2026), libpcap 1.10.7 (stable, 5 September
// 2026) and libpcap 1.11.0 (testing, 13 September 2026), each from its own
// man pages and its own tagged source. tcpdump.org publishes no support or
// end-of-life dates; its security page says the project aims to release at
// least once a year. Where the releases differ, the explanation says which
// does what; the development versions (tcpdump 5.0.0-PRE-GIT, libpcap
// 1.11.1-PRE-GIT) are mentioned only where they differ again.
// ============================================================================

import { tokenize, MAX_FILTER_LENGTH, KEYWORDS, type Token } from "./lexer"; // the scanner
import { parseTokens } from "./parser"; // the parser
import { analyse, type XNode, type XArith } from "./semantics"; // the meanings, and the node types the -O pass walks
import { shellLex, explainCommand, isProgram, type CommandExplanation, type ShellWord } from "./options"; // the command line
import { bi, note, SRC, type Bi, type Note } from "./texts"; // wording

export type { XNode, XArith } from "./semantics"; // explained nodes
export type { CommandExplanation, OptionUse } from "./options"; // explained command
export type { Bi, Note } from "./texts"; // wording types

/** The versions the explanations follow (tcpdump.org's release labels, read 2026-10-27). */
export const PAGE_VERSIONS = Object.freeze({
  tcpdump: "4.99.7", // the stable tcpdump release (2026-09-21): the options follow it
  libpcapStable: "1.10.7", // the stable libpcap release (2026-09-05)
  libpcapTesting: "1.11.0", // the testing libpcap release (2026-09-13): the filter language follows both
  tcpdumpDev: "5.0.0-PRE-GIT", // the development tcpdump, cited only where it differs
  libpcapDev: "1.11.1-PRE-GIT", // the development libpcap, cited only where it differs
  readOn: "2026-10-27", // when the pages and the source were read
});

/** The longest input accepted (characters). */
export const MAX_INPUT = MAX_FILTER_LENGTH; // 4096

/** A refusal of the whole input (empty, or too long). */
export class TcpdumpExplainerError extends Error {
  /**
   * @param code "empty" or "tooLong"
   * @param message the English message
   */
  constructor(public readonly code: "empty" | "tooLong", message: string) { super(message); this.name = "TcpdumpExplainerError"; } // typed
}

/** Where and why a filter was rejected before it could be analysed. */
export interface FilterError {
  /** A lexical code (badChar, nonOctal, overflow, badMac, badIpv6), "syntax" or "tooDeep". */
  code: string;
  /** Offset of the offending text in the expression. */
  start: number;
  /** Offset just past it. */
  end: number;
  /** The text found there ("" at the end of the expression). */
  found: string;
  /** What the grammar would have accepted there (codes). */
  expected: string[];
  /** The message in English. */
  en: string;
  /** The message in Portuguese. */
  pt: string;
  /** Likely causes, when one is recognisable. */
  hints: Note[];
}

/** The filter, explained. */
export interface FilterExplanation {
  /** The expression text (for a command, the expression words joined with spaces, as tcpdump joins them). */
  text: string;
  /** True for an empty expression (every packet). */
  empty: boolean;
  /** True when no lexical, syntax or semantic error was found. */
  ok: boolean;
  /** The rejection that stopped analysis, or null. */
  error: FilterError | null;
  /** The explained tree, or null. */
  tree: XNode | null;
  /** The filter with every grouping and inherited qualifier written out (valid syntax), or null. */
  canonical: string | null;
  /** Remarks about the whole filter. */
  notes: Note[];
  /** Errors libpcap would raise when compiling, with their spans. */
  semanticErrors: { start: number; end: number; code: string; en: string; pt: string; source: string }[];
  /** The tokens, for highlighting. */
  tokens: { t: string; text: string; start: number; end: number }[];
}

/** The whole explanation. */
export interface TcpdumpExplanation {
  /** "command" for a tcpdump command line, "filter" for a bare expression. */
  mode: "command" | "filter";
  /** The input as given (trimmed). */
  input: string;
  /** The versions the explanation follows. */
  versions: typeof PAGE_VERSIONS;
  /** The command, explained (command mode only). */
  command: CommandExplanation | null;
  /** Shell-level remarks (command mode only). */
  shellNotes: Note[];
  /** The filter, explained, or null (no expression, or -F). */
  filter: FilterExplanation | null;
}

/** What each expected-token code means, in words. */
const EXPECTED: Readonly<Record<string, Bi>> = Object.freeze({
  primitive: bi("a primitive (a qualifier such as host, net or port, a protocol keyword, not, a parenthesis, or an arithmetic relation)", "um primitivo (um qualificador como host, net ou port, uma palavra de protocolo, not, um parêntese ou uma relação aritmética)"),
  value: bi("a value (a name, an address or a number)", "um valor (um nome, um endereço ou um número)"),
  number: bi("a number", "um número"),
  name: bi("a name", "um nome"),
  rparen: bi('a closing ")"', 'um ")" de fechamento'),
  rparenArith: bi('a closing ")"', 'um ")" de fechamento'),
  relop: bi("a comparison operator (>, <, >=, <=, =, == or !=)", "um operador de comparação (>, <, >=, <=, =, == ou !=)"),
  arith: bi("an arithmetic operand (a number, len, a packet field such as ip[0], or a parenthesis)", "um operando aritmético (um número, len, um campo do pacote como ip[0], ou um parêntese)"),
  rbracket: bi('a closing "]"', 'um "]" de fechamento'),
  size: bi("a size (1, 2 or 4)", "um tamanho (1, 2 ou 4)"),
  byteOp: bi("one of & | < > =", "um de & | < > ="),
  andOr: bi("and, or, or the end of the expression", "and, or, ou o fim da expressão"),
  end: bi("the end of the expression", "o fim da expressão"),
  dstWord: bi('"dst" (only "src or dst" and "src and dst" are valid)', '"dst" (só "src or dst" e "src and dst" são válidos)'),
  srcWord: bi('"src" (only "dst or src" and "dst and src" are valid)', '"src" (só "dst or src" e "dst and src" são válidos)'),
  qualifier: bi("a direction or type qualifier", "um qualificador de direção ou de tipo"),
  prefixLen: bi("a prefix length after /", "um tamanho de prefixo depois da /"),
  dottedMask: bi("a dotted mask after mask", "uma máscara pontuada depois de mask"),
});

/** Keywords that are also protocol names usable after proto (the ID/tqual column of pcap-filter(7)). */
const PROTO_KEYWORDS = new Set(["aarp", "ah", "arp", "atalk", "carp", "clnp", "decnet", "esis", "esp", "icmp", "igmp", "igrp", "ip", "ip6", "ipx", "isis", "iso", "lat", "mopdl", "moprc", "netbeui", "pim", "rarp", "sca", "sctp", "stp", "tcp", "udp", "vrrp"]); // need a backslash after proto

/** Explain one filter expression. */
export function explainFilter(expr: string): FilterExplanation {
  const base: FilterExplanation = { text: expr, empty: false, ok: false, error: null, tree: null, canonical: null, notes: [], semanticErrors: [], tokens: [] }; // the result
  if (expr.length > MAX_INPUT) { base.error = { code: "tooLong", start: 0, end: expr.length, found: "", expected: [], en: `The expression is longer than ${MAX_INPUT} characters.`, pt: `A expressão passa de ${MAX_INPUT} caracteres.`, hints: [] }; return base; } // bounded
  const lx = tokenize(expr); // tokens
  base.tokens = lx.tokens.map((t) => ({ t: t.t, text: t.text, start: t.start, end: t.end })); // for highlighting
  if (lx.error) { base.error = lexError(lx.error); return base; } // the scanner stopped
  if (lx.tokens.length === 0) { // empty: every packet
    base.empty = true; // empty
    base.ok = true; // valid
    base.notes.push(note("emptyFilter", bi("No expression: tcpdump processes every packet.", "Sem expressão: o tcpdump processa todos os pacotes."), SRC.tcpdump)); // tcpdump(1)
    return base; // done
  }
  const p = parseTokens(lx.tokens, expr.length); // the tree
  if (p.error) { base.error = syntaxError(p.error, lx.tokens); return base; } // the grammar stopped
  const a = analyse(p.tree!, expr); // meanings
  base.tree = a.root; // the tree
  base.canonical = a.canonical; // the rewrite
  base.notes = a.notes; // remarks
  base.semanticErrors = a.errors.map((e) => ({ start: e.start, end: e.end, code: e.note.code, en: e.note.en, pt: e.note.pt, source: e.note.source })); // errors with spans
  base.ok = base.semanticErrors.length === 0; // valid when no node error
  base.notes.push(note("checkWithD", bi("To see exactly what your libpcap compiles, run tcpdump -d with the same filter: it prints the compiled code and captures nothing.", "Para ver exatamente o que a sua libpcap compila, rode tcpdump -d com o mesmo filtro: ele imprime o código compilado e não captura nada."), SRC.tcpdump)); // tcpdump(1), -d
  return base; // done
}

/** The record of a scanner error. */
function lexError(e: { code: string; start: number; end: number; text: string }): FilterError {
  const msg: Record<string, Bi> = {
    badChar: bi(`"${e.text}" at position ${e.start + 1} is not part of the filter language.`, `"${e.text}" na posição ${e.start + 1} não faz parte da linguagem de filtros.`),
    nonOctal: bi(`${e.text} starts with 0, so it is read as octal, and it contains an 8 or a 9 ("number contains non-octal digit").`, `${e.text} começa com 0, então é lido como octal, e tem um 8 ou um 9 ("number contains non-octal digit").`),
    overflow: bi(`${e.text} does not fit in 32 bits; every number in a filter is a 32-bit unsigned value.`, `${e.text} não cabe em 32 bits; todo número num filtro é um valor de 32 bits sem sinal.`),
    badMac: bi(`"${e.text}" looks like a MAC address but is not one: a MAC-48 address has six groups (aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff or aabbccddeeff).`, `"${e.text}" parece um endereço MAC mas não é: um endereço MAC-48 tem seis grupos (aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff ou aabbccddeeff).`),
    badIpv6: bi(`"${e.text}" is not a valid IPv6 address (its IPv4 part must be four decimal octets of at most 255).`, `"${e.text}" não é um endereço IPv6 válido (a parte IPv4 precisa ter quatro octetos decimais de no máximo 255).`),
  }; // libpcap scanner.l
  const hints: Note[] = []; // likely causes
  if (e.code === "nonOctal") hints.push(note("leadingZero", bi(`Drop the leading 0: ${e.text.replace(/^0+(?=.)/, "")}.`, `Tire o 0 da frente: ${e.text.replace(/^0+(?=.)/, "")}.`), SRC.scanner)); // the fix
  if (e.code === "badChar" && (e.text === "'" || e.text === '"')) hints.push(note("quotesInFilter", bi("Quotes belong to the shell, not to the filter: paste the expression without them, or paste the whole tcpdump command.", "As aspas são do shell, não do filtro: cole a expressão sem elas, ou cole o comando tcpdump inteiro."), SRC.tcpdump)); // a pasted quote
  if (e.code === "badChar" && e.text === ",") hints.push(note("commaList", bi('Values are joined with "or", not commas: host a or b.', 'Valores se juntam com "or", não com vírgula: host a or b.'), SRC.filter)); // a list
  return { code: e.code, start: e.start, end: e.end, found: e.text, expected: [], en: msg[e.code].en, pt: msg[e.code].pt, hints }; // the record
}

/** The record of a grammar rejection, with hints. */
function syntaxError(e: { code: string; tokenIndex: number; start: number; end: number; found: string; expected: string[] }, toks: Token[]): FilterError {
  if (e.code === "tooDeep") return { code: "tooDeep", start: e.start, end: e.end, found: e.found, expected: [], en: "The expression nests deeper than this tool reads (100 levels).", pt: "A expressão aninha mais fundo do que esta ferramenta lê (100 níveis).", hints: [] }; // the cap
  const exp = e.expected.filter((c) => EXPECTED[c]); // known expectations
  const at = e.found === "" ? bi("at the end of the expression", "no fim da expressão") : bi(`at "${e.found}" (position ${e.start + 1})`, `em "${e.found}" (posição ${e.start + 1})`); // where
  const wantEn = exp.map((c) => EXPECTED[c].en); // in English
  const wantPt = exp.map((c) => EXPECTED[c].pt); // in Portuguese
  const en = `libpcap's grammar cannot continue ${at.en}${wantEn.length ? `; it expected ${[...new Set(wantEn)].join(", or ")}` : ""}.`; // message
  const pt = `A gramática da libpcap não consegue continuar ${at.pt}${wantPt.length ? `; esperava ${[...new Set(wantPt)].join(", ou ")}` : ""}.`; // mensagem
  const hints: Note[] = []; // likely causes
  const tk = toks[e.tokenIndex]; // the token found
  const prev = toks[e.tokenIndex - 1]; // the one before
  if (tk && prev && (prev.t === "PROTO" || prev.t === "PROTOCHAIN") && PROTO_KEYWORDS.has(tk.text)) hints.push(note("escapeKeyword", bi(`"${tk.text}" is a keyword, so after ${prev.text} it must be escaped with a backslash: ${prev.text} \\${tk.text} (inside single quotes in the shell).`, `"${tk.text}" é palavra-chave, então depois de ${prev.text} precisa de barra invertida: ${prev.text} \\${tk.text} (entre aspas simples no shell).`), SRC.filter)); // pcap-filter(7)
  if (tk && tk.t === "ID") {
    const dash = tk.text.indexOf("-"); // a hyphen inside a name
    if (dash > 0 && (KEYWORDS[tk.text.slice(0, dash)] !== undefined || /^[0-9]+$/.test(tk.text.slice(dash + 1)))) hints.push(note("dashInName", bi(`"${tk.text}" is read as one name, because names may contain hyphens. For arithmetic, put spaces around the minus: ${tk.text.slice(0, dash)} - ${tk.text.slice(dash + 1)}.`, `"${tk.text}" é lido como um nome só, porque nomes podem ter hífen. Para aritmética, ponha espaços em volta do menos: ${tk.text.slice(0, dash)} - ${tk.text.slice(dash + 1)}.`), SRC.scanner)); // scanner.l
    if (KEYWORDS[tk.text.toLowerCase()] !== undefined && tk.text !== tk.text.toLowerCase()) hints.push(note("upperKeyword", bi(`Keywords are lowercase: "${tk.text}" is read as a name; write ${tk.text.toLowerCase()}.`, `As palavras-chave são minúsculas: "${tk.text}" é lido como nome; escreva ${tk.text.toLowerCase()}.`), SRC.scanner)); // case-sensitive
    if (!prev || prev.t === "AND" || prev.t === "OR" || prev.t === "(" || prev.t === "!") { if (tk.text.length && /^[a-z]/i.test(tk.text)) hints.push(note("bareNameFirst", bi(`A bare name cannot start a term: write host ${tk.text} (or net, port...).`, `Um nome solto não pode começar um termo: escreva host ${tk.text} (ou net, port...).`), SRC.filter)); } // a name with no qualifier
  }
  if (tk && (tk.t === "&" || tk.t === "|") && e.expected.includes("andOr")) hints.push(note("singleAmp", bi(`A single ${tk.text} is arithmetic (bitwise ${tk.t === "&" ? "AND" : "OR"}); between primitives write ${tk.t === "&" ? "and (or &&)" : "or (or ||)"}.`, `Um ${tk.text} sozinho é aritmético (${tk.t === "&" ? "AND" : "OR"} bit a bit); entre primitivos escreva ${tk.t === "&" ? "and (ou &&)" : "or (ou ||)"}.`), SRC.filter)); // the operator
  if (tk && tk.t === "%" && prev && prev.t === "HID6") hints.push(note("percentScope", bi("A scoped IPv6 address (fe80::1%eth0) is not accepted: the filter language has no zone index; drop the %eth0.", "Um endereço IPv6 com escopo (fe80::1%eth0) não é aceito: a linguagem de filtros não tem índice de zona; tire o %eth0."), SRC.scanner)); // scanner.l
  if (!tk && prev && (prev.t === "AND" || prev.t === "OR" || prev.t === "!")) hints.push(note("danglingOperator", bi(`The expression ends with "${prev.text}", which needs something after it.`, `A expressão termina com "${prev.text}", que precisa de algo depois.`), SRC.filter)); // trailing operator
  const opens = toks.filter((t) => t.t === "(").length; // parentheses
  const closes = toks.filter((t) => t.t === ")").length; // closing ones
  if (opens !== closes) hints.push(note("unbalanced", bi(`The parentheses do not balance: ${opens} opening and ${closes} closing.`, `Os parênteses não fecham: ${opens} abrindo e ${closes} fechando.`), SRC.filter)); // balance
  const prev2 = toks[e.tokenIndex - 2]; // two before
  if (tk && ["ID", "HID", "HID6", "EID", "AID"].includes(tk.t) && prev && prev.t === "(" && prev2 && prev2.t === "(") hints.push(note("doubleParenValue", bi("In a list of values, the first value cannot be wrapped in a second pair of parentheses: ((b)) is refused where (b) is fine.", "Numa lista de valores, o primeiro valor não pode vir dentro de um segundo par de parênteses: ((b)) é recusado onde (b) funciona."), SRC.grammar)); // grammar.y.in pid
  if (tk && tk.t === "EID" && (!prev || prev.t === "AND" || prev.t === "OR")) hints.push(note("macNeedsEther", bi(`A MAC address needs a qualifier: ether host ${tk.text}.`, `Um endereço MAC precisa de qualificador: ether host ${tk.text}.`), SRC.filter)); // a bare MAC
  return { code: "syntax", start: e.start, end: e.end, found: e.found, expected: e.expected, en, pt, hints }; // the record
}

/** True when the text tokenizes and parses as a filter expression (syntax only). */
function parsesAsFilter(text: string): boolean {
  const lx = tokenize(text); // tokens
  if (lx.error || lx.tokens.length === 0) return false; // not a filter
  return parseTokens(lx.tokens, text.length).error === null; // the grammar accepts it
}

/** Options of sudo that take an argument (so the word after them is not the program). */
const SUDO_ARG_OPTS = new Set(["-u", "-g", "-U", "-C", "-h", "-p", "-r", "-t", "-D", "-R", "-T"]); // sudo(8)

/**
 * Explain a tcpdump command line or a bare filter expression.
 * @param input what the reader pasted
 */
export function explain(input: string): TcpdumpExplanation {
  const trimmed = input.trim(); // surrounding whitespace is noise
  if (trimmed === "") throw new TcpdumpExplainerError("empty", "Paste a tcpdump command or a filter expression."); // nothing to do
  if (trimmed.length > MAX_INPUT) throw new TcpdumpExplainerError("tooLong", `The input is longer than ${MAX_INPUT} characters.`); // bounded
  const out: TcpdumpExplanation = { mode: "filter", input: trimmed, versions: PAGE_VERSIONS, command: null, shellNotes: [], filter: null }; // the result
  const sh = shellLex(trimmed); // shell words
  // Collect the words of the first command, dropping redirections and stopping at a control operator.
  const words: ShellWord[] = []; // the command's words
  const shellNotes: Note[] = []; // shell remarks
  let stoppedAt: string | null = null; // the control operator that ended the command
  for (let k = 0; k < sh.toks.length; k++) { // each token
    const t = sh.toks[k]; // the token
    if (t.kind === "word") { words.push(t.w); continue; } // a word
    if (["&&", "||", ";", "&", "|"].includes(t.op)) { stoppedAt = t.op; break; } // the end of the command
    if (t.op === "(" || t.op === ")") { words.push({ text: t.op, start: t.start, end: t.end, quoted: false, backslash: false, special: [] }); shellNotes.push(note("shellParen", bi("An unquoted parenthesis is shell syntax: a POSIX shell would refuse the line or run a subshell. Quote the filter.", "Um parêntese fora de aspas é sintaxe do shell: um shell POSIX recusaria a linha ou abriria um subshell. Ponha o filtro entre aspas."), SRC.tcpdump)); continue; } // kept for the filter, flagged
    const target = sh.toks[k + 1]; // a redirection's target
    shellNotes.push(note("redirect", bi(`"${t.op}${target && target.kind === "word" ? " " + target.w.text : ""}" is a shell redirection: the shell takes it, tcpdump never sees it.`, `"${t.op}${target && target.kind === "word" ? " " + target.w.text : ""}" é um redirecionamento do shell: o shell o consome, o tcpdump nunca o vê.`), SRC.tcpdump)); // a redirection
    if (target && target.kind === "word") k++; // skip its target
  }
  // Is this a command line?
  let idx = 0; // first word after the prefix
  const prefix: string[] = []; // sudo, doas
  while (idx < words.length && (words[idx].text === "sudo" || words[idx].text === "doas")) { // privilege prefix
    prefix.push(words[idx].text); idx++; // the prefix word
    while (idx < words.length && words[idx].text.startsWith("-") && !isProgram(words[idx].text)) { if (SUDO_ARG_OPTS.has(words[idx].text)) idx++; idx++; } // its own options
  }
  const hasProgram = idx < words.length && isProgram(words[idx].text); // tcpdump named
  // Only arguments pasted ("-nn -i eth0 icmp")? A leading "-" can also start a filter ("-ip[0] = 1", unary minus):
  // when the whole input parses as a filter, it is read as one.
  const dashFirst = !hasProgram && prefix.length === 0 && words.length > 0 && words[0].text.startsWith("-") && words[0].text !== "-"; // looks like options
  const argsOnly = dashFirst && !parsesAsFilter(trimmed); // options unless it is a valid filter
  if (sh.error && !hasProgram && !argsOnly) { // not a command: a filter with a stray quote
    out.filter = explainFilter(trimmed); // as typed
    return out; // done
  }
  if (!hasProgram && !argsOnly) { // a bare filter
    const single = sh.toks.length === 1 && sh.toks[0].kind === "word" && sh.toks[0].w.quoted && !sh.error; // one quoted word
    out.filter = explainFilter(single ? (sh.toks[0] as { kind: "word"; w: ShellWord }).w.text : trimmed); // the expression
    if (single) out.shellNotes.push(note("unquoted", bi("The surrounding quotes were removed, as the shell would remove them.", "As aspas de fora foram removidas, como o shell removeria."), SRC.tcpdump)); // stated
    return out; // done
  }
  out.mode = "command"; // a command line
  if (sh.error) shellNotes.push(note("unclosedQuote", bi(`The ${sh.error === "unclosedSingle" ? "single" : "double"} quote is never closed; a shell would wait for more input. The words up to it are explained.`, `As aspas ${sh.error === "unclosedSingle" ? "simples" : "duplas"} nunca fecham; um shell esperaria mais entrada. As palavras até ali foram explicadas.`), SRC.tcpdump)); // unterminated
  if (stoppedAt) shellNotes.push(note("controlOperator", bi(`The shell ends the tcpdump command at "${stoppedAt}"; what follows is ${stoppedAt === "|" ? "another command that reads tcpdump's output" : "another command"}. If "${stoppedAt}" was meant for the filter, put the filter in single quotes.`, `O shell termina o comando tcpdump em "${stoppedAt}"; o que vem depois é ${stoppedAt === "|" ? "outro comando, que lê a saída do tcpdump" : "outro comando"}. Se o "${stoppedAt}" era do filtro, ponha o filtro entre aspas simples.`), SRC.tcpdump)); // tcpdump(1) quoting advice
  if (sh.joinedLines) shellNotes.push(note("joinedLines", bi("Line breaks were read as spaces; in a shell an unescaped line break ends the command.", "As quebras de linha foram lidas como espaços; num shell, uma quebra de linha sem escape termina o comando."), SRC.tcpdump)); // a wrapped paste
  const cmdWords = words.slice(idx); // program and arguments
  if (cmdWords.some((w) => w.backslash)) shellNotes.push(note("backslashRemoved", bi("An unquoted backslash was removed by the shell before tcpdump saw the word (so \\tcp arrives as tcp). Keep the filter in single quotes.", "Uma barra invertida fora de aspas foi removida pelo shell antes de o tcpdump ver a palavra (então \\tcp chega como tcp). Mantenha o filtro entre aspas simples."), SRC.tcpdump)); // tcpdump(1)
  const specials = [...new Set(cmdWords.flatMap((w) => w.special))]; // $ and *
  if (specials.length) shellNotes.push(note("shellSpecial", bi(`Unquoted ${specials.join(" and ")} may be expanded by the shell (parameter expansion, file name globbing) before tcpdump sees it. Quote the filter.`, `${specials.join(" e ")} fora de aspas pode ser expandido pelo shell (expansão de parâmetro, glob de nomes de arquivo) antes de o tcpdump ver. Ponha o filtro entre aspas.`), SRC.tcpdump)); // tcpdump(1)
  out.shellNotes = shellNotes; // recorded
  out.command = explainCommand(cmdWords, prefix, hasProgram); // the options
  if (out.command.expressionFrom === "file") return out; // -F: no command-line filter
  if (out.command.expressionWords.length === 0) { // no expression
    out.command.notes.push(note("noExpression", bi("No filter expression: every packet is processed.", "Sem expressão de filtro: todos os pacotes são processados."), SRC.tcpdump)); // tcpdump(1)
    return out; // done
  }
  out.filter = explainFilter(out.command.expressionWords.join(" ")); // the expression, joined as tcpdump joins it
  if (out.command.options.some((o) => o.key === "O")) optimizerOff(out.filter); // -O: libpcap no longer refuses a never-matching filter
  return out; // done
}

/** The refusals only the optimizer makes: they disappear with -O. */
const OPTIMIZER_ONLY = new Set(["rejectsAllPackets", "divByZeroFolded", "modByZeroFolded", "shiftTooBigFolded"]); // codes

/** Drop the given codes from a node and its descendants (the tree and the relation sides). */
function dropCodes(n: XNode, codes: Set<string>): void {
  n.errors = n.errors.filter((e) => !codes.has(e.code)); // this node
  const arith = (a: XArith | undefined): void => { if (!a) return; a.errors = a.errors.filter((e) => !codes.has(e.code)); a.children.forEach(arith); }; // arithmetic sides
  arith(n.left); // left side of a relation
  arith(n.right); // right side
  n.children.forEach((c) => dropCodes(c, codes)); // the rest of the tree
}

/**
 * With -O the optimizer does not run. pcap_compile's "expression rejects all packets" check runs only after the
 * optimizer (libpcap gencode.c), and constant folding is the optimizer's (optimize.c), so a filter no packet can
 * match, or one whose constant right-hand side folds to a division by zero or an oversized shift, compiles.
 * @param f the filter explanation, changed in place
 */
function optimizerOff(f: FilterExplanation): void {
  const hits = new Set(f.semanticErrors.filter((e) => OPTIMIZER_ONLY.has(e.code)).map((e) => e.code)); // refused for those reasons?
  if (hits.size === 0) return; // nothing to change
  f.semanticErrors = f.semanticErrors.filter((e) => !OPTIMIZER_ONLY.has(e.code)); // no longer errors
  if (f.tree) dropCodes(f.tree, OPTIMIZER_ONLY); // nor on the nodes
  f.ok = f.semanticErrors.length === 0; // valid if nothing else is wrong
  if ([...hits].some((c) => c !== "rejectsAllPackets")) f.notes.unshift(note("foldedUnchecked", bi("Because -O turns the optimiser off, libpcap does not fold the constant that makes a division, a modulus or a shift invalid here, and compiles the filter.", "Como -O desliga o otimizador, a libpcap não reduz a constante que torna inválida aqui uma divisão, um módulo ou um deslocamento, e compila o filtro."), SRC.optimize)); // optimize.c
  if (hits.has("rejectsAllPackets")) f.notes.unshift(note("matchesNothing", bi("No packet can match this filter. Because -O turns the optimiser off, libpcap does not notice and compiles it: a capture with this filter receives no packets.", "Nenhum pacote pode bater com este filtro. Como -O desliga o otimizador, a libpcap não percebe e compila o filtro: uma captura com ele não recebe nenhum pacote."), SRC.gencode)); // gencode.c, pcap_compile
}

/**
 * The API entry point: the same explanation as the page.
 * @param input a tcpdump command line or a filter expression
 */
export function run(input: string): TcpdumpExplanation {
  return explain(input); // throws TcpdumpExplainerError on empty or too long input
}
