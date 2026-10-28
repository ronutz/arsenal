// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/options.ts
// ----------------------------------------------------------------------------
// The command-line half of the explainer: a small POSIX-style shell tokenizer
// (quotes, backslashes, operators, redirections), then tcpdump's option
// parsing as getopt_long does it, then every option explained.
//
// Sources, read 2026-10-27. The basis is tcpdump 4.99.7, the stable release
// on tcpdump.org (21 September 2026); the development version is cited only
// for what exists there alone:
//   * tcpdump(1) for tcpdump 4.99.7: every option and its meaning, the
//     EXAMPLES and the advice on quoting the expression;
//   * tcpdump.c at tag tcpdump-4.99.7: the short option string, the long
//     option table, the argument parsing (atoi() for -c, -B, -G and -W, so
//     only the leading digits count; strtol() with base 0 for -s, so 0x and a
//     leading 0 mean hex and octal; -C with an optional k/m/g suffix), the
//     accepted -Q values, the options that exist only in some builds (-B and
//     -I need pcap_create(), -D pcap_findalldevs(), -Q pcap_setdirection(),
//     -U pcap_dump_flush(), -E and -M cryptography, -z fork, -j and -J time
//     stamp type support; -m is ignored with a warning without libsmi), and
//     that each -n is counted;
//   * tcpdump(1) and tcpdump.c of the development version (5.0.0-PRE-GIT,
//     master): --lengths, --print-sampling, --skip, the -T types geneve and
//     quic, the stricter argument parsing, and the advice to put -- before a
//     quoted expression.
//
// The explanations are our own words; the man page text is not reproduced.
// Nothing here runs a command or touches the network.
// ============================================================================

import { bi, note, SRC, type Bi, type Note } from "./texts"; // wording

/** A shell word after quote removal. */
export interface ShellWord {
  /** The word's text, as the program would receive it. */
  text: string;
  /** Start offset in the input. */
  start: number;
  /** End offset. */
  end: number;
  /** True if any part was quoted. */
  quoted: boolean;
  /** True if an unquoted backslash was removed from it. */
  backslash: boolean;
  /** Unquoted characters the shell treats specially that stayed in the word ($, *). */
  special: string[];
}

/** A shell token: a word, or an operator. */
type ShellTok = { kind: "word"; w: ShellWord } | { kind: "op"; op: string; start: number; end: number };

/** Shell tokenizer failures. */
export type ShellError = "unclosedSingle" | "unclosedDouble";

/** Tokenize a shell command line (POSIX-style: quotes, backslash, operators, # comments). Bounded, no regex. */
export function shellLex(s: string): { toks: ShellTok[]; error: ShellError | null; joinedLines: boolean } {
  const toks: ShellTok[] = []; // output
  let i = 0; // cursor
  let joinedLines = false; // a bare newline was read as a space
  let cur: ShellWord | null = null; // the word being built
  const flush = () => { if (cur) { toks.push({ kind: "word", w: cur }); cur = null; } }; // end the current word
  const word = (at: number): ShellWord => { if (!cur) cur = { text: "", start: at, end: at, quoted: false, backslash: false, special: [] }; return cur; }; // the current word
  while (i < s.length) { // until the end
    const c = s[i]; // current character
    if (c === " " || c === "\t") { flush(); i++; continue; } // a separator
    if (c === "\n" || c === "\r") { if (cur || toks.length) joinedLines = true; flush(); i++; continue; } // newlines read as spaces (a wrapped paste)
    if (c === "#" && !cur) { while (i < s.length && s[i] !== "\n") i++; continue; } // a comment
    if (c === "'") { // single quotes: literal
      const w = word(i); // the word
      const close = s.indexOf("'", i + 1); // the closing quote
      if (close < 0) return { toks, error: "unclosedSingle", joinedLines }; // unterminated
      w.text += s.slice(i + 1, close); // literal text
      w.quoted = true; // quoted
      i = close + 1; // past it
      w.end = i; // extend
      continue; // next
    }
    if (c === '"') { // double quotes: backslash escapes $ ` " \ and newline
      const w = word(i); // the word
      let j = i + 1; // inside
      let closed = false; // found the end
      while (j < s.length) { // scan
        const d = s[j]; // character
        if (d === '"') { closed = true; j++; break; } // the end
        if (d === "\\" && j + 1 < s.length && "$`\"\\\n".includes(s[j + 1])) { if (s[j + 1] !== "\n") w.text += s[j + 1]; j += 2; continue; } // an escape
        w.text += d; // literal
        j++; // next
      }
      if (!closed) return { toks, error: "unclosedDouble", joinedLines }; // unterminated
      w.quoted = true; // quoted
      i = j; // past it
      w.end = i; // extend
      continue; // next
    }
    if (c === "\\") { // backslash outside quotes
      if (s[i + 1] === "\n") { i += 2; continue; } // a line continuation
      const w = word(i); // the word
      if (i + 1 < s.length) { w.text += s[i + 1]; w.backslash = true; } // the escaped character, backslash removed
      i += 2; // past both
      w.end = Math.min(i, s.length); // extend
      continue; // next
    }
    const two = s.slice(i, i + 2); // two characters
    if (["&&", "||", ">>", "<<", ">&", "<&"].includes(two)) { // two-character operators
      if (cur && /^[0-9]+$/.test((cur as ShellWord).text) && !(cur as ShellWord).quoted && (two[0] === ">" || two[0] === "<")) { const ioN = cur as ShellWord; cur = null; toks.push({ kind: "op", op: ioN.text + two, start: ioN.start, end: i + 2 }); i += 2; continue; } // 2>> etc.
      flush(); toks.push({ kind: "op", op: two, start: i, end: i + 2 }); i += 2; continue; // the operator
    }
    if ("&|;<>()".includes(c)) { // one-character operators
      if (cur && /^[0-9]+$/.test((cur as ShellWord).text) && !(cur as ShellWord).quoted && (c === ">" || c === "<")) { const ioN = cur as ShellWord; cur = null; toks.push({ kind: "op", op: ioN.text + c, start: ioN.start, end: i + 1 }); i++; continue; } // 2> etc.
      flush(); toks.push({ kind: "op", op: c, start: i, end: i + 1 }); i++; continue; // the operator
    }
    const w = word(i); // an ordinary character
    if ((c === "$" || c === "*") && !w.special.includes(c)) w.special.push(c); // characters the shell would interpret
    w.text += c; // append
    i++; // next
    w.end = i; // extend
  }
  flush(); // the last word
  return { toks, error: null, joinedLines }; // done
}

/** One option as used on the command line. */
export interface OptionUse {
  /** The option's key in the table ("n", "count", "tsprec", ...), or "?" when unknown. */
  key: string;
  /** How it was written (for example "-nn", "-i eth0", "--snapshot-length=96"). */
  raw: string;
  /** The canonical spelling: "-n", "--count", ... */
  flag: string;
  /** Its argument, or null. */
  arg: string | null;
  /** How many times it was given (for -v, -t, -n, -x, -X, -d). */
  count: number;
  /** True when the option is on the current tcpdump(1) page. */
  known: boolean;
  /** What it does. */
  meaning: Bi;
  /** Remarks. */
  notes: Note[];
  /** Problems tcpdump would report. */
  errors: Note[];
}

/** The command line, explained. */
export interface CommandExplanation {
  /** Words before tcpdump (sudo, doas), each explained. */
  prefix: { word: string; meaning: Bi }[];
  /** The program word ("tcpdump", "/usr/sbin/tcpdump"), or null when only arguments were pasted. */
  program: string | null;
  /** The options, in order of first use. */
  options: OptionUse[];
  /** The words that form the filter expression. */
  expressionWords: string[];
  /** Where the expression comes from. */
  expressionFrom: "none" | "words" | "afterDoubleDash" | "file";
  /** Remarks on the whole command. */
  notes: Note[];
  /** Problems with the whole command. */
  errors: Note[];
}

/** One option of the table. */
interface OptDef {
  /** Unique key. */
  key: string;
  /** The short letter, if any. */
  short?: string;
  /** Long names, if any. */
  long?: string[];
  /** The argument's name, when the option takes one. */
  arg?: string;
  /** Meaning for each repeat count (index = count - 1); the last one serves beyond. */
  levels?: Bi[];
  /** Meaning (count 1). */
  meaning: Bi;
  /** True when only the development page documents it. */
  devOnly?: boolean;
  /** Present only in some builds (tcpdump.c). */
  build?: Bi;
  /** Check and describe the argument; returns an error (Bi) or notes. */
  argCheck?: (a: string) => { error?: Bi; notes?: Note[] };
}

/** Digits grouped by thousands with a separator (deterministic; no locale data needed). */
function group(n: bigint, sep: string): string {
  const digits = n.toString(); // plain digits
  let out = ""; // the result
  for (let i = 0; i < digits.length; i++) { // left to right
    if (i > 0 && (digits.length - i) % 3 === 0) out += sep; // a separator every three from the right
    out += digits[i]; // the digit
  }
  return out; // grouped
}

/**
 * What C's strtol() makes of a whole string, or null when it would not consume all of it (tcpdump uses it with base
 * 10, and with base 0 for -s, where 0x starts hex and a leading 0 octal). Anchored patterns with disjoint
 * alternatives, so no two quantifiers compete for the same text (ReDoS-safe).
 */
function strtolFull(a: string, base: 0 | 10): number | null {
  const m = base === 10 ? /^[ \t\n\v\f\r]*([+-]?)([0-9]+)$/.exec(a) : /^[ \t\n\v\f\r]*([+-]?)(0[xX][0-9a-fA-F]+|0[0-7]*|[1-9][0-9]*)$/.exec(a); // sign and digits
  if (!m) return null; // not all of it is a number
  const d = m[2]; // the digits, with any prefix
  const v = base === 0 && /^0[xX]/.test(d) ? parseInt(d.slice(2), 16) : base === 0 && d.length > 1 && d[0] === "0" ? parseInt(d, 8) : Number(d); // hex, octal or decimal
  return m[1] === "-" ? -v : v; // signed
}

/** What C's atoi() makes of a string, as tcpdump 4.99.7 reads -c, -B, -G and -W: blanks, a sign, the leading digits (0 without any); null when too long to say (overflow is undefined behaviour in C). */
function atoiLike(a: string): number | null {
  const m = /^[ \t\n\v\f\r]*([+-]?)([0-9]*)/.exec(a); // the prefix atoi() reads (anchored; each part has its own characters)
  if (!m || m[2].length > 9) return m ? null : 0; // too many digits to say; the pattern itself always matches
  const v = m[2] === "" ? 0 : Number(m[2]); // the digits
  return m[1] === "-" ? -v : v; // signed
}

/**
 * A whole-number argument. tcpdump 4.99.7 reads -c, -B, -G and -W with atoi(), which keeps only the leading digits,
 * and refuses the result only when it is below its minimum; the development code (strtol() over the whole word, then
 * the range) refuses anything that is not a whole number in range. Both readings are reported.
 * @param a the argument as written
 * @param min the smallest value accepted
 * @param max the largest value accepted (the development code's bound; 2147483647 is INT_MAX)
 * @param what the argument's name, in both languages
 * @param stableMin the smallest value 4.99.7 accepts after atoi(), or null for an option 4.99.7 does not have
 */
function intArg(a: string, min: number, max: number, what: Bi, stableMin: number | null = min): { error?: Bi } {
  const v = strtolFull(a, 10); // the development code's reading
  if (v !== null && v >= min && v <= max) return {}; // fine in both versions
  const rule = bi(`${what.en} must be a whole number from ${min} to ${max}; "${a}" is not.`, `${what.pt} tem que ser um número inteiro de ${min} a ${max}; "${a}" não é.`); // the rule (tcpdump.c)
  if (v !== null || stableMin === null) return { error: rule }; // a number out of range, or an option 4.99.7 does not have
  const s = atoiLike(a); // what 4.99.7 reads
  if (s === null) return { error: rule }; // nothing reliable to add
  return { error: bi(`${rule.en} tcpdump 4.99.7 reads it with atoi(), which keeps only the leading digits, so it ${s >= stableMin ? `would quietly take it as ${s}` : `would read ${s} and refuse it`}; the development version refuses it as written.`, `${rule.pt} O tcpdump 4.99.7 lê com atoi(), que só aproveita os dígitos do começo, então ${s >= stableMin ? `aceitaria sem aviso, como ${s}` : `leria ${s} e recusaria`}; a versão de desenvolvimento recusa como está escrito.`) }; // both readings
}

/** The tcpdump(1) option table (tcpdump 4.99.7, plus the options only the development version has, marked devOnly), in our words. */
const OPTS: readonly OptDef[] = [
  { key: "A", short: "A", meaning: bi("Prints each packet in ASCII, without its link-level header; handy for reading web pages. It has no effect when -x, -xx, -X or -XX is also given.", "Imprime cada pacote em ASCII, sem o header de enlace; útil para ler páginas web. Não tem efeito se -x, -xx, -X ou -XX também estiver presente.") },
  { key: "b", short: "b", meaning: bi('Prints BGP AS numbers in "asdot" rather than "asplain" representation (RFC 5396).', 'Imprime os números de AS do BGP na representação "asdot" em vez de "asplain" (RFC 5396).') },
  { key: "B", short: "B", long: ["buffer-size"], arg: "buffer_size", meaning: bi("Sets the operating system's capture buffer size, in KiB (units of 1024 bytes).", "Define o tamanho do buffer de captura do sistema operacional, em KiB (unidades de 1024 bytes)."), build: bi("In tcpdump 4.99.7, present only when tcpdump was built against a libpcap that has pcap_create(), or on Windows (tcpdump.c); the development version always has it.", "No tcpdump 4.99.7, só existe quando o tcpdump foi compilado com uma libpcap que tenha pcap_create(), ou no Windows (tcpdump.c); a versão de desenvolvimento sempre tem."), argCheck: (a) => { const r = intArg(a, 1, 2147483647, bi("The buffer size", "O tamanho do buffer")); return r.error ? r : { notes: [note("bufferBytes", bi(`${a} KiB is ${group(BigInt(a) * 1024n, ",")} bytes.`, `${a} KiB são ${group(BigInt(a) * 1024n, ".")} bytes.`), SRC.tcpdump)] }; } },
  { key: "c", short: "c", arg: "count", meaning: bi("Exits after receiving count packets. Without -c, tcpdump runs until it gets SIGINT (usually Ctrl-C) or SIGTERM. The development version's page adds that the count applies to packets read from a file too, and starts after any packets --skip skips.", "Sai depois de receber count pacotes. Sem -c, o tcpdump roda até receber SIGINT (em geral Ctrl-C) ou SIGTERM. A página da versão de desenvolvimento acrescenta que a contagem vale também para pacotes lidos de arquivo e começa depois dos pacotes que o --skip pular."), argCheck: (a) => intArg(a, 1, 2147483647, bi("The packet count", "A contagem de pacotes")) },
  { key: "count", long: ["count"], meaning: bi("When reading capture files, prints only the number of packets (only those the filter accepts, when there is a filter) instead of decoding them.", "Ao ler arquivos de captura, imprime só o número de pacotes (só os que o filtro aceita, quando há filtro) em vez de decodificá-los.") },
  { key: "C", short: "C", arg: "file_size", meaning: bi("While writing with -w, starts a new file whenever the current one is larger than file_size. The unit is millions of bytes (1,000,000) unless a k/K, m/M or g/G suffix makes it 1,024, 1,048,576 or 1,073,741,824 bytes. Later files take the -w name followed by a number starting at 1.", "Ao gravar com -w, abre um arquivo novo sempre que o atual passa de file_size. A unidade é milhões de bytes (1.000.000), a não ser que um sufixo k/K, m/M ou g/G a torne 1.024, 1.048.576 ou 1.073.741.824 bytes. Os arquivos seguintes levam o nome do -w seguido de um número a partir de 1."), argCheck: (a) => {
    const m = /^([0-9]+)([kKmMgG]?)$/.exec(a); // number and optional unit
    if (!m || Number(m[1]) < 1) return { error: bi(`-C takes a positive number with an optional k, m or g suffix; "${a}" is not one.`, `-C recebe um número positivo com sufixo opcional k, m ou g; "${a}" não é.`) }; // tcpdump.c
    const unit = { "": 1000000, k: 1024, m: 1048576, g: 1073741824 }[m[2].toLowerCase() as "" | "k" | "m" | "g"]; // the multiplier
    return { notes: [note("fileSizeBytes", bi(`${a} means ${group(BigInt(m[1]) * BigInt(unit), ",")} bytes per file.`, `${a} significa ${group(BigInt(m[1]) * BigInt(unit), ".")} bytes por arquivo.`), SRC.tcpdump)] }; // the size
  } },
  { key: "d", short: "d", meaning: bi("Prints the compiled packet-matching (BPF) code in readable form and stops without capturing.", "Imprime o código de filtragem (BPF) compilado, em forma legível, e para sem capturar."), levels: [
    bi("Prints the compiled packet-matching (BPF) code in readable form and stops without capturing. The code is compiled for the link type of the -r file or the -i interface (or the -y type); with neither -r nor -i it is compiled for Ethernet (EN10MB) unless -y says otherwise. This is the authoritative check of what libpcap makes of a filter.", "Imprime o código de filtragem (BPF) compilado, em forma legível, e para sem capturar. O código é compilado para o link type do arquivo do -r ou da interface do -i (ou o tipo do -y); sem -r nem -i, é compilado para Ethernet (EN10MB), a não ser que -y diga outra coisa. É a verificação definitiva do que a libpcap faz de um filtro."),
    bi("-dd: prints the compiled code as a C array of struct bpf_insn structures, and stops.", "-dd: imprime o código compilado como um array C de struct bpf_insn, e para."),
    bi("-ddd: prints the compiled code as decimal numbers, preceded by a count, and stops.", "-ddd: imprime o código compilado como números decimais, precedidos da contagem, e para."),
  ] },
  { key: "D", short: "D", long: ["list-interfaces"], meaning: bi("Lists the interfaces tcpdump can capture on, each with a number, a name and a description when there is one, and exits; the development version also prints flags, and no number for a device that cannot capture. The name or the number can be given to -i.", "Lista as interfaces em que o tcpdump pode capturar, cada uma com número, nome e descrição quando houver, e sai; a versão de desenvolvimento também imprime flags, e nenhum número para um dispositivo que não captura. O nome ou o número pode ir no -i."), build: bi("In tcpdump 4.99.7, present only when tcpdump was built against a libpcap that has pcap_findalldevs() (tcpdump(1), tcpdump.c); the development version always has it.", "No tcpdump 4.99.7, só existe quando o tcpdump foi compilado com uma libpcap que tenha pcap_findalldevs() (tcpdump(1), tcpdump.c); a versão de desenvolvimento sempre tem.") },
  { key: "e", short: "e", meaning: bi("Prints the link-level header on each line, for example the MAC addresses on Ethernet and 802.11.", "Imprime o header de enlace em cada linha, por exemplo os endereços MAC em Ethernet e 802.11.") },
  { key: "E", short: "E", arg: "spi@ipaddr algo:secret,...", meaning: bi("Decrypts IPsec ESP packets for the given SPI and destination address with the given algorithm (des-cbc by default; also 3des-cbc, blowfish-cbc, rc3-cbc, cast128-cbc or none) and secret (ASCII, or hex after 0x); a file name may be given instead. The page notes it is supported for IPv4 ESP and is meant only for debugging.", "Decifra pacotes IPsec ESP do SPI e do endereço de destino dados, com o algoritmo (des-cbc por padrão; também 3des-cbc, blowfish-cbc, rc3-cbc, cast128-cbc ou none) e o segredo (ASCII, ou hexa depois de 0x); pode-se passar um nome de arquivo no lugar. A página diz que vale para ESP de IPv4 e que é só para depuração."), build: bi("Present only when tcpdump was built with cryptography (tcpdump.c).", "Só existe quando o tcpdump foi compilado com criptografia (tcpdump.c)."), argCheck: (a) => ({ notes: a.includes(":") ? [note("secretOnCommandLine", bi("The page warns that a secret on the command line is visible to other users, for example through ps(1); prefer the file form for anything real.", "A página avisa que um segredo na linha de comando fica visível para outros usuários, por exemplo pelo ps(1); para algo real, prefira a forma com arquivo."), SRC.tcpdump)] : [] }) },
  { key: "f", short: "f", meaning: bi('Prints "foreign" IPv4 addresses numerically rather than by name, using the capture interface\'s IPv4 address and netmask to decide what is foreign. It also makes "ip broadcast" in the filter use that netmask instead of matching only 0.0.0.0 and 255.255.255.255.', 'Imprime endereços IPv4 "estrangeiros" em forma numérica, não pelo nome, usando o endereço e a máscara IPv4 da interface de captura para decidir o que é estrangeiro. Também faz o "ip broadcast" do filtro usar essa máscara em vez de pegar só 0.0.0.0 e 255.255.255.255.') },
  { key: "F", short: "F", arg: "file", meaning: bi("Reads the filter expression from file; an expression also given on the command line is ignored.", "Lê a expressão de filtro do arquivo; uma expressão também passada na linha de comando é ignorada.") },
  { key: "g", short: "g", long: ["ip-oneline"], meaning: bi("In verbose mode, does not break the line after the IP header.", "No modo verboso, não quebra a linha depois do header IP.") },
  { key: "G", short: "G", arg: "rotate_seconds", meaning: bi("With -w, rotates the output file every rotate_seconds seconds. The -w name should contain a strftime(3) time format; without one each new file overwrites the previous one, and a time format coarser than the rotation period overwrites data too. With -C as well, names take the form file<count>.", "Com -w, troca o arquivo de saída a cada rotate_seconds segundos. O nome do -w deve ter um formato de tempo do strftime(3); sem ele, cada arquivo novo sobrescreve o anterior, e um formato mais grosso que o período de rotação também sobrescreve dados. Com -C junto, os nomes ficam no formato arquivo<contagem>."), argCheck: (a) => intArg(a, 0, 2147483647, bi("The rotation period", "O período de rotação")) },
  { key: "h", short: "h", long: ["help"], meaning: bi("Prints the tcpdump and libpcap versions and a usage message, and exits.", "Imprime as versões do tcpdump e da libpcap e uma mensagem de uso, e sai.") },
  { key: "version", long: ["version"], meaning: bi("Prints the tcpdump and libpcap versions and exits.", "Imprime as versões do tcpdump e da libpcap e sai.") },
  { key: "H", short: "H", meaning: bi("Tries to detect 802.11s draft mesh headers.", "Tenta detectar headers de mesh do rascunho 802.11s.") },
  { key: "i", short: "i", long: ["interface"], arg: "interface", meaning: bi("Captures on interface (or reports its link types, time stamp types or a compiled filter). Without -i and without -d, tcpdump picks the lowest-numbered interface that is up, excluding loopback. A number printed by -D can stand for the name.", "Captura na interface (ou informa os link types, os tipos de timestamp ou um filtro compilado dela). Sem -i e sem -d, o tcpdump escolhe a interface ativa de menor número, fora o loopback. Um número mostrado pelo -D pode substituir o nome."), argCheck: (a) => ({ notes: a === "any" ? [note("anyInterface", bi('"any" is a pseudo-interface that captures on all regular interfaces, on all supported Linux systems and on recent macOS and Solaris. Captures on it are never promiscuous, and what counts as a regular interface depends on the OS (on Linux it includes SocketCAN devices).', '"any" é uma pseudo-interface que captura em todas as interfaces comuns, em todos os Linux suportados e em macOS e Solaris recentes. A captura nela nunca é promíscua, e o que conta como interface comum depende do sistema (no Linux inclui dispositivos SocketCAN).'), SRC.tcpdump)] : /^[0-9]+$/.test(a) ? [note("interfaceNumber", bi(`${a} is read as the interface number that -D prints, unless an interface is actually named "${a}".`, `${a} é lido como o número de interface que o -D mostra, a não ser que exista uma interface chamada "${a}".`), SRC.tcpdump)] : [] }) },
  { key: "I", short: "I", long: ["monitor-mode"], meaning: bi("Puts the interface in monitor mode; only on IEEE 802.11 Wi-Fi interfaces and only on some operating systems. The adapter may disassociate from its network. It also changes what -L lists.", "Põe a interface em monitor mode; só em interfaces Wi-Fi IEEE 802.11 e só em alguns sistemas operacionais. O adaptador pode se desassociar da rede. Também muda o que o -L lista."), build: bi("In tcpdump 4.99.7, present only when tcpdump was built against a libpcap that has pcap_create() (tcpdump.c); the development version always has it.", "No tcpdump 4.99.7, só existe quando o tcpdump foi compilado com uma libpcap que tenha pcap_create() (tcpdump.c); a versão de desenvolvimento sempre tem.") },
  { key: "immediate", long: ["immediate-mode"], meaning: bi("Delivers each packet to tcpdump as soon as it arrives instead of buffering it. This is already the default when printing packets to a terminal.", "Entrega cada pacote ao tcpdump assim que ele chega, sem buffer. Isso já é o padrão quando os pacotes são impressos num terminal.") },
  { key: "j", short: "j", long: ["time-stamp-type"], arg: "tstamp_type", meaning: bi("Sets the time stamp type for the capture (the names are in pcap-tstamp(7)); not every type is valid on every interface.", "Define o tipo de timestamp da captura (os nomes estão no pcap-tstamp(7)); nem todo tipo vale em toda interface."), build: bi("Present only when libpcap supports setting the time stamp type (tcpdump.c).", "Só existe quando a libpcap permite definir o tipo de timestamp (tcpdump.c).") },
  { key: "J", short: "J", long: ["list-time-stamp-types"], meaning: bi("Lists the time stamp types the interface supports and exits.", "Lista os tipos de timestamp que a interface suporta e sai."), build: bi("Present only when libpcap supports setting the time stamp type (tcpdump.c).", "Só existe quando a libpcap permite definir o tipo de timestamp (tcpdump.c).") },
  { key: "tsprec", long: ["time-stamp-precision"], arg: "tstamp_precision", meaning: bi("Sets the time stamp precision: micro (the default) or nano. Nanosecond availability and accuracy depend on the platform and the hardware, and a file written at nanosecond precision uses a different magic number that not every program reads. When reading a file, converts its time stamps to this precision.", "Define a precisão do timestamp: micro (o padrão) ou nano. A disponibilidade e a exatidão de nanossegundos dependem da plataforma e do hardware, e um arquivo gravado em nanossegundos usa outro magic number, que nem todo programa lê. Ao ler um arquivo, converte os timestamps para essa precisão."), argCheck: (a) => (a === "micro" || a === "nano" ? {} : { error: bi(`The precision is micro or nano, not "${a}".`, `A precisão é micro ou nano, não "${a}".`) }) },
  { key: "micro", long: ["micro"], meaning: bi("Shorthand for --time-stamp-precision=micro; when reading a nanosecond file it truncates the time stamps.", "Atalho para --time-stamp-precision=micro; ao ler um arquivo em nanossegundos, trunca os timestamps.") },
  { key: "nano", long: ["nano"], meaning: bi("Shorthand for --time-stamp-precision=nano; when reading a microsecond file it adds trailing zeros.", "Atalho para --time-stamp-precision=nano; ao ler um arquivo em microssegundos, completa com zeros.") },
  { key: "K", short: "K", long: ["dont-verify-checksums"], meaning: bi("Does not verify IP, TCP or UDP checksums; useful when the interface computes them in hardware, where otherwise every outgoing TCP checksum would be reported as bad.", "Não verifica checksums IP, TCP ou UDP; útil quando a interface os calcula em hardware, caso em que todo checksum TCP de saída apareceria como errado.") },
  { key: "l", short: "l", meaning: bi("Makes standard output line-buffered, so you can watch the output while saving it (tcpdump -l | tee dat). On Windows line-buffered means unbuffered.", "Deixa a saída padrão com buffer por linha, para acompanhar a saída enquanto ela é gravada (tcpdump -l | tee dat). No Windows, buffer por linha significa sem buffer.") },
  { key: "L", short: "L", long: ["list-data-link-types"], meaning: bi("Lists the data link types the interface supports in the given mode (see -I) and exits.", "Lista os data link types que a interface suporta no modo dado (veja -I) e sai.") },
  { key: "lengths", long: ["lengths"], devOnly: true, meaning: bi("Prints each packet's captured length (caplen, see -s) and original on-the-wire length (len) at the start of the line.", "Imprime no começo da linha o tamanho capturado (caplen, veja -s) e o tamanho original no cabo (len) de cada pacote.") },
  { key: "m", short: "m", arg: "module", meaning: bi("Loads SMI MIB module definitions from module; may be given several times.", "Carrega definições de módulos MIB SMI do arquivo module; pode aparecer várias vezes."), build: bi("Needs libsmi. tcpdump 4.99.7 accepts -m in every build and, without libsmi, ignores it with a warning (tcpdump.c); in the development version -m exists only in builds with libsmi, so elsewhere it is an unknown option.", "Precisa da libsmi. O tcpdump 4.99.7 aceita -m em qualquer build e, sem libsmi, ignora com um aviso (tcpdump.c); na versão de desenvolvimento o -m só existe em builds com libsmi, então nos outros é opção desconhecida.") },
  { key: "M", short: "M", arg: "secret", meaning: bi("Uses secret as the shared secret to validate the digests of the TCP-MD5 option (RFC 2385).", "Usa secret como segredo compartilhado para validar os digests da opção TCP-MD5 (RFC 2385)."), build: bi("Present only when tcpdump was built with cryptography (tcpdump.c).", "Só existe quando o tcpdump foi compilado com criptografia (tcpdump.c).") },
  { key: "n", short: "n", meaning: bi("Does not convert addresses (host addresses, port numbers, etc.) to names.", "Não converte endereços (endereços de host, números de porta etc.) em nomes."), levels: [
    bi("Does not convert addresses (host addresses, port numbers, etc.) to names.", "Não converte endereços (endereços de host, números de porta etc.) em nomes."),
    bi("-nn: tcpdump(1) for 4.99.7 and the development page (5.0.0-PRE-GIT) document only -n, which already covers host addresses and port numbers; neither gives a second -n a meaning of its own. tcpdump counts each -n (tcpdump.c), so -nn is accepted and does what -n does as far as the pages say. If an older or vendor build documents a difference, its own page is the authority.", "-nn: o tcpdump(1) do 4.99.7 e a página de desenvolvimento (5.0.0-PRE-GIT) documentam só o -n, que já cobre endereços de host e números de porta; nenhuma das duas dá um significado próprio a um segundo -n. O tcpdump conta cada -n (tcpdump.c), então -nn é aceito e faz o que o -n faz, até onde as páginas dizem. Se um build mais antigo ou de fabricante documentar diferença, a página dele é que vale."),
  ] },
  { key: "N", short: "N", meaning: bi('Does not print the domain part of host names ("nic" instead of "nic.ddn.mil").', 'Não imprime a parte de domínio dos nomes de host ("nic" em vez de "nic.ddn.mil").') },
  { key: "#", short: "#", long: ["number"], meaning: bi("Prints a packet number at the start of each line.", "Imprime um número de pacote no começo de cada linha.") },
  { key: "O", short: "O", long: ["no-optimize"], meaning: bi("Does not run the packet-matching code optimiser; useful only if you suspect a bug in it.", "Não roda o otimizador do código de filtragem; só serve se você suspeitar de um bug nele.") },
  { key: "p", short: "p", long: ["no-promiscuous-mode"], meaning: bi('Does not put the interface into promiscuous mode. The interface may still be promiscuous for another reason, so -p is not a shorthand for "ether host {local-hw-addr} or ether broadcast".', 'Não põe a interface em modo promíscuo. A interface pode continuar promíscua por outro motivo, então -p não é atalho para "ether host {local-hw-addr} or ether broadcast".') },
  { key: "print", long: ["print"], meaning: bi("Prints the decoded packets even while -w is saving the raw packets.", "Imprime os pacotes decodificados mesmo enquanto o -w grava os pacotes crus.") },
  { key: "printsampling", long: ["print-sampling"], arg: "nth", devOnly: true, meaning: bi("Prints only every nth packet, counting from 1 (with 100: the 100th, 200th, ...); unprinted packets are not decoded. It turns on --print and -S (relative sequence numbers cannot be tracked across unprinted packets).", "Imprime só um a cada nth pacotes, contando a partir de 1 (com 100: o 100º, o 200º, ...); os pacotes não impressos não são decodificados. Liga o --print e o -S (números de sequência relativos não podem ser acompanhados por pacotes não impressos)."), argCheck: (a) => intArg(a, 1, 2147483647, bi("The sampling interval", "O intervalo de amostragem")) },
  { key: "Q", short: "Q", long: ["direction"], arg: "direction", meaning: bi("Captures only packets in the given direction: in (received), out (sent) or inout (both). Not available on all platforms.", "Captura só pacotes na direção dada: in (recebidos), out (enviados) ou inout (os dois). Não existe em todas as plataformas."), build: bi("In tcpdump 4.99.7, present only when tcpdump was built against a libpcap that has pcap_setdirection() (tcpdump.c); the development version always accepts it, and the platform still decides whether it works.", "No tcpdump 4.99.7, só existe quando o tcpdump foi compilado com uma libpcap que tenha pcap_setdirection() (tcpdump.c); a versão de desenvolvimento sempre aceita, e a plataforma continua decidindo se funciona."), argCheck: (a) => (["in", "out", "inout"].includes(a.toLowerCase()) ? {} : { error: bi(`-Q takes in, out or inout, not "${a}".`, `-Q aceita in, out ou inout, não "${a}".`) }) },
  { key: "q", short: "q", meaning: bi("Quick output: prints less protocol information, so lines are shorter.", "Saída rápida: imprime menos informação de protocolo, com linhas mais curtas.") },
  { key: "r", short: "r", arg: "file", meaning: bi("Reads packets from file (pcap or pcapng, written by -w or another tool) instead of capturing; reading a file needs no special privileges.", "Lê pacotes do arquivo (pcap ou pcapng, gravado pelo -w ou outra ferramenta) em vez de capturar; ler arquivo não exige privilégios especiais."), argCheck: (a) => ({ notes: a === "-" ? [note("stdin", bi('"-" means standard input.', '"-" significa a entrada padrão.'), SRC.tcpdump)] : [] }) },
  { key: "S", short: "S", long: ["absolute-tcp-sequence-numbers"], meaning: bi("Prints absolute TCP sequence numbers instead of numbers relative to the start of each conversation.", "Imprime números de sequência TCP absolutos em vez de relativos ao início de cada conversa.") },
  { key: "s", short: "s", long: ["snapshot-length"], arg: "snaplen", meaning: bi("Captures at most snaplen bytes of each packet instead of the default 262144; truncated packets show [|proto]. Larger snapshots cost processing time and buffer space and may lose packets; smaller ones discard data above the transport layer.", "Captura no máximo snaplen bytes de cada pacote em vez do padrão de 262144; pacotes truncados aparecem com [|proto]. Snapshots maiores custam processamento e espaço de buffer e podem perder pacotes; menores descartam dados acima da camada de transporte."), argCheck: (a) => {
    const v = strtolFull(a, 0); // both versions read -s with strtol() in base 0: 0x is hex, a leading 0 octal (tcpdump.c)
    if (v === null || v < 0 || v > 262144) return { error: bi(`snaplen must be a number from 0 to 262144 (decimal, hex after 0x, or octal after a leading 0); "${a}" is not.`, `O snaplen tem que ser um número de 0 a 262144 (decimal, hexa depois de 0x, ou octal depois de um 0 na frente); "${a}" não é.`) }; // out of range or not a number
    const notes: Note[] = []; // remarks
    if (v === 0) notes.push(note("snaplenZero", bi("0 sets the default of 262144 bytes (kept for compatibility with older versions).", "0 define o padrão de 262144 bytes (mantido por compatibilidade com versões antigas)."), SRC.tcpdump)); // tcpdump(1)
    if (/^[ \t\n\v\f\r]*[+-]?0[0-7xX]/.test(a)) notes.push(note("snaplenRadix", bi(`${a} is read as ${v}: tcpdump takes 0x as hex and a leading 0 as octal here.`, `${a} é lido como ${v}: aqui o tcpdump entende 0x como hexa e um 0 na frente como octal.`), SRC.tcpdumpC)); // strtol(..., 0)
    return { notes }; // fine
  } },
  { key: "skip", long: ["skip"], arg: "count", devOnly: true, meaning: bi("Skips count packets before writing or printing (0 is allowed); -c then counts from after them.", "Pula count pacotes antes de gravar ou imprimir (0 é permitido); o -c passa a contar depois deles."), argCheck: (a) => intArg(a, 0, 2147483647, bi("The skip count", "A quantidade a pular")) },
  { key: "T", short: "T", arg: "type", meaning: bi("Forces the packets the expression selects to be decoded as type, whatever their ports say.", "Força os pacotes selecionados pela expressão a serem decodificados como type, digam as portas o que disserem."), argCheck: (a) => {
    const ty = a.toLowerCase(); // tcpdump compares without case
    if (T_TYPES.has(ty)) return {}; // in both versions
    if (T_TYPES_DEV.has(ty)) return { notes: [note("devOnlyType", bi(`${ty} is a -T type only in the development version (its page and tcpdump.c); tcpdump 4.99.7 stops with "unknown packet type".`, `${ty} só é tipo de -T na versão de desenvolvimento (página e tcpdump.c dela); o tcpdump 4.99.7 para com "unknown packet type".`), SRC.tcpdumpCDev)] }; // development only
    return { error: bi(`"${a}" is not a -T type. tcpdump 4.99.7 knows aodv, carp, cnfp, domain, lmp, pgm, pgm_zmtp1, ptp, radius, resp, rpc, rtcp, rtp, snmp, someip, tftp, vat, vxlan, wb and zmtp1; the development version adds geneve and quic.`, `"${a}" não é tipo de -T. O tcpdump 4.99.7 conhece aodv, carp, cnfp, domain, lmp, pgm, pgm_zmtp1, ptp, radius, resp, rpc, rtcp, rtp, snmp, someip, tftp, vat, vxlan, wb e zmtp1; a versão de desenvolvimento acrescenta geneve e quic.`) }; // unknown
  } },
  { key: "t", short: "t", meaning: bi("Does not print a timestamp on each line.", "Não imprime timestamp em cada linha."), levels: [
    bi("-t: does not print a timestamp on each line.", "-t: não imprime timestamp em cada linha."),
    bi("-tt: prints the timestamp as seconds (and fractions) since 1 January 1970, 00:00:00 UTC.", "-tt: imprime o timestamp como segundos (e frações) desde 1º de janeiro de 1970, 00:00:00 UTC."),
    bi("-ttt: prints the time since the previous line (micro- or nanosecond resolution, per --time-stamp-precision; microseconds by default).", "-ttt: imprime o tempo desde a linha anterior (resolução de micro ou nanossegundos, conforme o --time-stamp-precision; microssegundos por padrão)."),
    bi("-tttt: prints the date before the usual hours:minutes:seconds.fraction timestamp.", "-tttt: imprime a data antes do timestamp habitual horas:minutos:segundos.fração."),
    bi("-ttttt: prints the time since the first line (micro- or nanosecond resolution, per --time-stamp-precision; microseconds by default).", "-ttttt: imprime o tempo desde a primeira linha (resolução de micro ou nanossegundos, conforme o --time-stamp-precision; microssegundos por padrão)."),
  ] },
  { key: "u", short: "u", meaning: bi("Prints undecoded NFS handles.", "Imprime os handles NFS sem decodificar.") },
  { key: "U", short: "U", long: ["packet-buffered"], meaning: bi("Writes output packet by packet: each decoded packet as soon as it is printed, or, with -w, each raw packet as soon as it is saved, instead of when the buffer fills.", "Grava a saída pacote a pacote: cada pacote decodificado assim que é impresso, ou, com -w, cada pacote cru assim que é gravado, em vez de quando o buffer enche."), build: bi("In tcpdump 4.99.7, present only when tcpdump was built against a libpcap that has pcap_dump_flush() (tcpdump(1), tcpdump.c); the development version always has it.", "No tcpdump 4.99.7, só existe quando o tcpdump foi compilado com uma libpcap que tenha pcap_dump_flush() (tcpdump(1), tcpdump.c); a versão de desenvolvimento sempre tem.") },
  { key: "v", short: "v", meaning: bi("More verbose output.", "Saída mais detalhada."), levels: [
    bi("-v: slightly more verbose, for example the IP TTL, identification, total length and options, plus IP and ICMP header checksum checks. With -w (and no -r) it also reports the number of packets captured to stderr once a second; the page warns this can lose packets on Solaris, FreeBSD and possibly other systems.", "-v: um pouco mais detalhado, por exemplo TTL, identificação, tamanho total e opções do IP, além da verificação de checksum dos headers IP e ICMP. Com -w (e sem -r), também informa no stderr, uma vez por segundo, quantos pacotes foram capturados; a página avisa que isso pode perder pacotes no Solaris, no FreeBSD e possivelmente em outros sistemas."),
    bi("-vv: even more verbose, for example additional fields of NFS replies and fully decoded SMB packets.", "-vv: ainda mais detalhado, por exemplo campos extras das respostas NFS e pacotes SMB totalmente decodificados."),
    bi("-vvv: even more verbose, for example telnet SB...SE options in full (also in hex with -X).", "-vvv: ainda mais detalhado, por exemplo as opções telnet SB...SE completas (também em hexa com -X)."),
  ] },
  { key: "V", short: "V", arg: "file", meaning: bi('Reads a list of capture file names from file ("-" means standard input).', 'Lê uma lista de nomes de arquivos de captura do arquivo ("-" significa a entrada padrão).') },
  { key: "w", short: "w", arg: "file", meaning: bi('Writes the raw packets to file instead of decoding and printing them ("-" means standard output); read them back with -r. Output to a file or pipe is buffered, so a reader may not see packets for a while unless -U is given.', 'Grava os pacotes crus no arquivo em vez de decodificar e imprimir ("-" significa a saída padrão); leia de volta com -r. A saída para arquivo ou pipe tem buffer, então quem lê pode demorar a ver os pacotes, a não ser com -U.'), argCheck: (a) => ({ notes: a === "-" ? [note("stdout", bi('"-" means standard output.', '"-" significa a saída padrão.'), SRC.tcpdump)] : !a.includes(".") ? [note("pcapExtension", bi("tcpdump identifies the format by the file's magic number, not its name, but the page recommends an extension such as .pcap for other programs.", "O tcpdump identifica o formato pelo magic number do arquivo, não pelo nome, mas a página recomenda uma extensão como .pcap por causa de outros programas."), SRC.tcpdump)] : [] }) },
  { key: "W", short: "W", arg: "filecount", meaning: bi("With -C, keeps at most filecount files and then overwrites from the first (a rotating buffer), naming them with enough leading zeros to sort. With -G, stops (exit status 0) after filecount rotated files.", "Com -C, mantém no máximo filecount arquivos e então sobrescreve a partir do primeiro (um buffer circular), numerando com zeros à esquerda suficientes para ordenar. Com -G, para (status de saída 0) depois de filecount arquivos rotacionados."), argCheck: (a) => intArg(a, 1, 2147483647, bi("The file count", "A quantidade de arquivos")) },
  { key: "x", short: "x", meaning: bi("Prints each packet's data in hex.", "Imprime os dados de cada pacote em hexa."), levels: [
    bi("-x: prints each packet's data in hex too, without its link-level header: the whole packet or snaplen bytes, whichever is smaller (link-layer padding included). No effect when -X or -XX is given.", "-x: imprime também os dados de cada pacote em hexa, sem o header de enlace: o pacote inteiro ou snaplen bytes, o que for menor (inclusive o padding do enlace). Sem efeito com -X ou -XX."),
    bi("-xx: prints each packet's data in hex too, including its link-level header. No effect when -X or -XX is given.", "-xx: imprime também os dados de cada pacote em hexa, incluindo o header de enlace. Sem efeito com -X ou -XX."),
  ] },
  { key: "X", short: "X", meaning: bi("Prints each packet's data in hex and ASCII.", "Imprime os dados de cada pacote em hexa e ASCII."), levels: [
    bi("-X: prints each packet's data in hex and ASCII too, without its link-level header; handy for analysing new protocols.", "-X: imprime também os dados de cada pacote em hexa e ASCII, sem o header de enlace; útil para analisar protocolos novos."),
    bi("-XX: prints each packet's data in hex and ASCII too, including its link-level header.", "-XX: imprime também os dados de cada pacote em hexa e ASCII, incluindo o header de enlace."),
  ] },
  { key: "y", short: "y", long: ["linktype"], arg: "datalinktype", meaning: bi("Sets the data link type to capture with (see -L), or to compile the filter for with -d.", "Define o data link type da captura (veja -L), ou aquele para o qual o filtro é compilado com -d.") },
  { key: "z", short: "z", arg: "postrotate-command", meaning: bi('With -C or -G, runs "postrotate-command file" on each file closed by a rotation (for example -z gzip), at the lowest priority, in parallel with the capture.', 'Com -C ou -G, roda "postrotate-command arquivo" em cada arquivo fechado por uma rotação (por exemplo -z gzip), com a menor prioridade, em paralelo com a captura.'), build: bi("Needs fork, so it is not available on Windows (tcpdump(1), tcpdump.c).", "Precisa de fork, então não existe no Windows (tcpdump(1), tcpdump.c).") },
  { key: "Z", short: "Z", long: ["relinquish-privileges"], arg: "user", meaning: bi("If tcpdump runs as root, switches to user (and that user's primary group) after opening the capture device or input file and before opening any output file. A build may make this the default.", "Se o tcpdump roda como root, passa para user (e o grupo primário dele) depois de abrir o dispositivo de captura ou o arquivo de entrada e antes de abrir qualquer arquivo de saída. Um build pode tornar isso o padrão.") },
];

/** The -T types tcpdump 4.99.7 knows (its page and tcpdump.c agree). */
const T_TYPES = new Set(["aodv", "carp", "cnfp", "domain", "lmp", "pgm", "pgm_zmtp1", "ptp", "radius", "resp", "rpc", "rtcp", "rtp", "snmp", "someip", "tftp", "vat", "vxlan", "wb", "zmtp1"]); // tcpdump(1), -T
/** The -T types only the development version knows. */
const T_TYPES_DEV = new Set(["geneve", "quic"]); // development tcpdump(1) and tcpdump.c

/** Short letters to definitions. */
const BY_SHORT = new Map(OPTS.filter((o) => o.short).map((o) => [o.short!, o])); // -x
/** Long names to definitions. */
const BY_LONG = new Map(OPTS.flatMap((o) => (o.long ?? []).map((l) => [l, o] as [string, OptDef]))); // --name
/** Option letters tcpdump.c accepts but the page does not document. */
const UNDOCUMENTED_SHORT = new Set(["a", "Y"]); // tcpdump.c SHORTOPTS
/** Long options tcpdump.c defines but the page does not document. */
const UNDOCUMENTED_LONG = new Set(["list-remote-interfaces", "debug-filter-parser", "fp-type", "time-t-size"]); // tcpdump.c longopts

/** True when a word names the tcpdump program. */
export function isProgram(w: string): boolean {
  return w === "tcpdump" || w.endsWith("/tcpdump"); // plain or with a path
}

/** The canonical spelling of an option. */
function flagOf(d: OptDef): string { return d.short ? `-${d.short}` : `--${d.long![0]}`; } // short form first

/**
 * Explain a command line.
 * @param words the words after any prefix (program word included when present)
 * @param prefix the words before the program (sudo, doas)
 * @param hasProgram whether words[0] is the program
 */
export function explainCommand(words: ShellWord[], prefix: string[], hasProgram: boolean): CommandExplanation {
  const out: CommandExplanation = { prefix: [], program: hasProgram ? words[0].text : null, options: [], expressionWords: [], expressionFrom: "none", notes: [], errors: [] }; // the result
  for (const p of prefix) out.prefix.push({ word: p, meaning: p === "doas" ? bi("Runs tcpdump as another user, root by default (doas).", "Roda o tcpdump como outro usuário, root por padrão (doas).") : bi("Runs tcpdump as another user, root by default (sudo).", "Roda o tcpdump como outro usuário, root por padrão (sudo).") }); // the prefix
  if (prefix.length) out.notes.push(note("privileges", bi("tcpdump(1) says capturing from a network interface may need special privileges (see pcap(3PCAP)), and reading a saved file does not. -Z drops root after the capture device is opened.", "O tcpdump(1) diz que capturar de uma interface de rede pode exigir privilégios especiais (veja pcap(3PCAP)), e ler um arquivo salvo não. O -Z abandona o root depois que o dispositivo de captura é aberto."), SRC.tcpdump)); // tcpdump(1)
  if (!hasProgram) out.notes.push(note("noProgram", bi('No "tcpdump" word was found, so the line is read as tcpdump\'s arguments.', 'Não apareceu a palavra "tcpdump", então a linha é lida como os argumentos do tcpdump.'), SRC.tcpdump)); // assumption stated
  const args = hasProgram ? words.slice(1) : words; // the arguments
  const byKey = new Map<string, OptionUse>(); // uses by key
  const wordsOf = new Map<OptionUse, Set<number>>(); // which source words each flag came from
  let wordIdx = -1; // the index of the word being read
  const use = (d: OptDef | null, raw: string, arg: string | null, unknownFlag?: string): void => { // record one occurrence
    if (!d) { // unknown
      const flag = unknownFlag!; // as written
      const und = flag.startsWith("--") ? UNDOCUMENTED_LONG.has(flag.slice(2).split("=")[0]) : UNDOCUMENTED_SHORT.has(flag.slice(1)); // in the source but not on the page
      out.options.push({ key: "?", raw, flag, arg, count: 1, known: false, meaning: und ? bi(`${flag} is accepted by tcpdump's source (4.99.7 and the development version) but not documented on its tcpdump(1) page.`, `${flag} é aceito pelo código do tcpdump (4.99.7 e versão de desenvolvimento) mas não está documentado na página tcpdump(1).`) : bi(`${flag} is not an option of tcpdump 4.99.7 or of the development version.`, `${flag} não é opção do tcpdump 4.99.7 nem da versão de desenvolvimento.`), notes: [], errors: und ? [] : [note("unknownOption", bi(`tcpdump would stop with a usage error at ${flag}.`, `O tcpdump pararia com erro de uso em ${flag}.`), SRC.tcpdumpC)] }); // recorded
      return; // done
    }
    const prev = byKey.get(d.key); // seen before?
    if (prev && !d.arg) { // a repeated flag
      prev.count++; // counted
      const seen = wordsOf.get(prev)!; // its words
      if (!seen.has(wordIdx)) { prev.raw += ` ${raw}`; seen.add(wordIdx); } // another word: show it too
      prev.meaning = levelMeaning(d, prev.count); // the meaning at this count
      return; // done
    }
    const u: OptionUse = { key: d.key, raw, flag: flagOf(d), arg, count: 1, known: true, meaning: levelMeaning(d, 1), notes: [], errors: [] }; // a new use
    if (d.devOnly) u.notes.push(note("devOnly", bi(`Only in the development version (tcpdump 5.0.0-PRE-GIT, its page and tcpdump.c). tcpdump 4.99.7, the stable release, has no ${flagOf(d)}: it stops with an unrecognised option.`, `Só existe na versão de desenvolvimento (tcpdump 5.0.0-PRE-GIT, página e tcpdump.c dela). O tcpdump 4.99.7, o release estável, não tem ${flagOf(d)}: para com opção não reconhecida.`), SRC.tcpdumpC)); // absent from the 4.99.7 option table
    if (d.build) u.notes.push(note("buildDependent", d.build, SRC.tcpdumpC)); // build dependent
    if (d.argCheck && arg !== null) { const r = d.argCheck(arg); if (r.error) u.errors.push(note("badArgument", r.error, SRC.tcpdumpC)); for (const nn of r.notes ?? []) u.notes.push(nn); } // the argument
    if (prev && d.arg) { prev.notes.push(note("repeated", bi(`${flagOf(d)} is given more than once; the last value (${arg}) is the one tcpdump keeps.`, `${flagOf(d)} aparece mais de uma vez; o último valor (${arg}) é o que o tcpdump guarda.`), SRC.tcpdumpC)); } // the later wins (getopt assigns again)
    if (!prev) { byKey.set(d.key, u); wordsOf.set(u, new Set([wordIdx])); } // remember
    out.options.push(u); // recorded
  };
  let i = 0; // cursor
  let sawWord = false; // a non-option word came before
  let optionAfterWord = false; // an option after a non-option word (GNU permutation)
  for (; i < args.length; i++) { // getopt_long, GNU style
    const a = args[i].text; // the word
    wordIdx = i; // for the raw text of clustered flags
    if (a === "--") { out.expressionWords.push(...args.slice(i + 1).map((w) => w.text)); if (i + 1 < args.length) out.expressionFrom = "afterDoubleDash"; i = args.length; break; } // end of options
    if (a.startsWith("--") && a.length > 2) { // a long option
      if (sawWord) optionAfterWord = true; // permuted
      const eq = a.indexOf("="); // name=value
      const name = eq < 0 ? a.slice(2) : a.slice(2, eq); // the name
      const d = BY_LONG.get(name) ?? null; // its definition
      if (!d) { use(null, a, eq < 0 ? null : a.slice(eq + 1), eq < 0 ? a : a.slice(0, eq)); continue; } // unknown
      if (d.arg) { // takes an argument
        if (eq >= 0) use(d, a, a.slice(eq + 1)); // --name=value
        else if (i + 1 < args.length) { use(d, `${a} ${args[i + 1].text}`, args[i + 1].text); i++; } // --name value
        else out.errors.push(note("missingArgument", bi(`${a} needs an argument (${d.arg}).`, `${a} precisa de um argumento (${d.arg}).`), SRC.tcpdump)); // missing
      } else {
        if (eq >= 0) out.errors.push(note("noArgumentAllowed", bi(`${a.slice(0, eq)} takes no argument.`, `${a.slice(0, eq)} não recebe argumento.`), SRC.tcpdumpC)); // --name=value on a flag
        use(d, a, null); // the flag
      }
      continue; // next word
    }
    if (a.startsWith("-") && a.length > 1) { // short options, possibly clustered
      if (sawWord) optionAfterWord = true; // permuted
      for (let j = 1; j < a.length; j++) { // each letter
        const c = a[j]; // the letter
        const d = BY_SHORT.get(c) ?? null; // its definition
        if (!d) { use(null, `-${c}`, null, `-${c}`); continue; } // unknown letter
        if (d.arg) { // takes an argument: the rest of the word, or the next word
          const rest = a.slice(j + 1); // attached
          if (rest !== "") use(d, `-${c}${rest}`, rest); // -s96
          else if (i + 1 < args.length) { use(d, `-${c} ${args[i + 1].text}`, args[i + 1].text); i++; } // -s 96
          else out.errors.push(note("missingArgument", bi(`-${c} needs an argument (${d.arg}).`, `-${c} precisa de um argumento (${d.arg}).`), SRC.tcpdump)); // missing
          break; // the argument ends the cluster
        }
        use(d, a.length > 2 ? a : `-${c}`, null); // a flag: shown as the word it came in ("-nn")
      }
      continue; // next word
    }
    sawWord = true; // a non-option word
    out.expressionWords.push(a); // part of the expression
  }
  if (out.expressionWords.length && out.expressionFrom === "none") out.expressionFrom = "words"; // from the words
  const has = (k: string) => byKey.has(k); // an option present?
  const cnt = (k: string) => byKey.get(k)?.count ?? 0; // its count
  // Interplay remarks, each from the page.
  if (out.expressionFrom === "words" && out.expressionWords.length > 1) out.notes.push(note("expressionWords", bi("The expression came as several words; tcpdump joins them with spaces. tcpdump(1) advises passing it as one quoted argument when it contains shell metacharacters; the development page goes further: options first, then --, then the whole expression as one quoted argument, which works with every shell and getopt.", "A expressão veio em várias palavras; o tcpdump junta todas com espaços. O tcpdump(1) aconselha passá-la como um único argumento entre aspas quando ela tem metacaracteres do shell; a página de desenvolvimento vai além: as opções primeiro, depois --, depois a expressão inteira como um único argumento entre aspas, o que funciona com qualquer shell e getopt."), SRC.tcpdumpDev)); // tcpdump(1), 4.99.7 and development
  if (optionAfterWord) out.notes.push(note("optionAfterExpression", bi("An option comes after expression words. GNU getopt_long still reads it as an option, but under POSIXLY_CORRECT (and with other getopt implementations) it would become part of the expression.", "Uma opção vem depois de palavras da expressão. O getopt_long do GNU ainda a lê como opção, mas com POSIXLY_CORRECT (e com outras implementações de getopt) ela viraria parte da expressão."), SRC.tcpdumpDev)); // the development page
  if (has("F")) { out.expressionFrom = "file"; if (out.expressionWords.length) out.notes.push(note("fIgnoresExpression", bi("-F reads the filter from a file, so the expression on the command line is ignored.", "O -F lê o filtro de um arquivo, então a expressão da linha de comando é ignorada."), SRC.tcpdump)); } // tcpdump(1)
  if (has("A") && (has("x") || has("X"))) out.notes.push(note("aIgnored", bi("-A has no effect here, because -x/-xx or -X/-XX is also given.", "O -A não tem efeito aqui, porque -x/-xx ou -X/-XX também foi dado."), SRC.tcpdump)); // tcpdump(1)
  if (has("x") && has("X")) out.notes.push(note("xIgnored", bi("-x/-xx has no effect here, because -X/-XX is also given.", "O -x/-xx não tem efeito aqui, porque -X/-XX também foi dado."), SRC.tcpdump)); // tcpdump(1)
  if (!has("w") && (has("C") || has("G") || has("W") || has("z"))) out.notes.push(note("rotationNeedsW", bi("-C, -G, -W and -z act on the files -w writes; without -w they do nothing.", "-C, -G, -W e -z agem sobre os arquivos que o -w grava; sem -w não fazem nada."), SRC.tcpdump)); // tcpdump(1)
  if (has("W") && has("C") && has("G")) out.notes.push(note("wIgnoredWithCG", bi("With both -C and -G, the page says -W is currently ignored except for the file names.", "Com -C e -G juntos, a página diz que o -W é ignorado por enquanto, valendo só para os nomes dos arquivos."), SRC.tcpdump)); // tcpdump(1)
  if (has("w") && !has("print") && !has("printsampling")) out.notes.push(note("wSilences", bi("With -w the packets are saved, not printed; add --print to see them as well.", "Com -w os pacotes são gravados, não impressos; acrescente --print para vê-los também."), SRC.tcpdump)); // tcpdump(1)
  if (has("v") && has("w") && !has("r")) out.notes.push(note("vWithW", bi("With -w and without -r, -v reports the packet count to stderr once a second.", "Com -w e sem -r, o -v informa a contagem de pacotes no stderr uma vez por segundo."), SRC.tcpdump)); // tcpdump(1)
  if (cnt("d") > 0) out.notes.push(note("dStops", bi("With -d (or -dd, -ddd) tcpdump prints the compiled filter and stops: nothing is captured.", "Com -d (ou -dd, -ddd) o tcpdump imprime o filtro compilado e para: nada é capturado."), SRC.tcpdump)); // tcpdump(1)
  if (has("D") || has("L") || has("J") || has("h") || has("version")) out.notes.push(note("listsAndExits", bi("-D, -L, -J, -h and --version print what they list and exit; nothing is captured.", "-D, -L, -J, -h e --version imprimem o que listam e saem; nada é capturado."), SRC.tcpdump)); // tcpdump(1)
  if (cnt("v") > 3) out.notes.push(note("vMax", bi(`-v is given ${cnt("v")} times; the page documents up to -vvv.`, `O -v aparece ${cnt("v")} vezes; a página documenta até -vvv.`), SRC.tcpdump)); // levels
  if (cnt("t") > 5) out.notes.push(note("tMax", bi(`-t is given ${cnt("t")} times; the page documents up to -ttttt.`, `O -t aparece ${cnt("t")} vezes; a página documenta até -ttttt.`), SRC.tcpdump)); // levels
  if (cnt("d") > 3) out.notes.push(note("dMax", bi(`-d is given ${cnt("d")} times; the page documents up to -ddd.`, `O -d aparece ${cnt("d")} vezes; a página documenta até -ddd.`), SRC.tcpdump)); // levels
  if (byKey.get("i")?.arg === "any" && has("p")) out.notes.push(note("anyNeverPromisc", bi('-p changes nothing on "any": captures there are never promiscuous.', 'O -p não muda nada na "any": capturas nela nunca são promíscuas.'), SRC.tcpdump)); // tcpdump(1)
  if (!has("i") && !has("r") && !has("V") && !has("d") && !has("D") && !has("L") && !has("J") && !has("h") && !has("version")) out.notes.push(note("defaultInterface", bi("No -i: tcpdump picks the lowest-numbered interface that is up, excluding loopback, which may not be the one you mean.", "Sem -i: o tcpdump escolhe a interface ativa de menor número, fora o loopback, que pode não ser a que você quer."), SRC.tcpdump)); // tcpdump(1)
  if (!has("c") && !has("r") && !has("V") && !has("d") && !has("D") && !has("L") && !has("J") && !has("h") && !has("version")) out.notes.push(note("runsUntilStopped", bi("No -c: the capture runs until you interrupt it (Ctrl-C).", "Sem -c: a captura roda até você interromper (Ctrl-C)."), SRC.tcpdump)); // tcpdump(1)
  return out; // the command
}

/** The meaning of an option at a repeat count. */
function levelMeaning(d: OptDef, count: number): Bi {
  if (!d.levels) return d.meaning; // a single meaning
  return d.levels[Math.min(count, d.levels.length) - 1]; // the level, or the last one
}

/** Every documented option, for the docs and the vectors. */
export const OPTION_KEYS: readonly string[] = OPTS.map((o) => o.key); // keys in table order
