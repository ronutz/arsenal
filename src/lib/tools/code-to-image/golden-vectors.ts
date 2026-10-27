// ============================================================================
// src/lib/tools/code-to-image/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for the code-to-image tool.
//
//   - TOKENIZE_VECTORS: for each language, an input and the exact colouring,
//     written as markup ("[kind:text]" around every coloured run, plain text
//     as it is). Each expected markup was read against the rules quoted in
//     languages.ts before it was frozen.
//   - SVG_VECTORS: three inputs and their SVG documents, byte for byte (the
//     Example among them), with their alt text. Every SVG is also checked for
//     well-formedness with the site's own XML engine, and every <text> element
//     for one x position per character.
//   - SECRET_VECTORS: every rule of the secrets check, positive and negative,
//     with the rule, line, column, label and the exact characters masked. Each
//     positive is also rendered: masked, the secret is in neither the SVG nor
//     the alt text; unmasked, it is in the SVG.
//   - LIMIT_VECTORS, NORMALISE_VECTORS, NOTE_VECTORS and HIGHLIGHT_VECTORS:
//     the refusals at and past every limit, the normalisation of the text,
//     the notes, and the line list parser.
//   - SHARE_VECTORS (2026-10-27): what a "Share results" link carries, byte
//     for byte: the normalised text with every masked finding replaced by the
//     picture's eight bullets, an unticked finding kept and listed; and the
//     receiving page draws the same characters on every line.
//   - CONTRAST_VECTORS: every contrast ratio of both palettes, rounded down to
//     two decimals, against its WCAG 2.2 threshold; the luminance is also
//     compared with the site's colour contrast tool's implementation.
// The examples use documentation values only: RFC 5737 addresses, the tokens
// and credentials RFC 6749, 6750, 7519 and 7617 print, AWS's documented
// example keys, and values written for these vectors ending in "demo" or
// spelling "for-demo-only-not-a-real-key".
// ============================================================================

import { renderCode, normalise, parseLineSpec, findingKey, shareableCode, MAX_CHARS, MAX_LINES, MAX_COLUMNS, MAX_TITLE, MAX_HIGHLIGHT_SPEC, type CodeImageOptions, type CodeImageErrorCode, type CodeImageNote, type HighlightProblem } from "./compute"; // the engine
import { paintKinds, KIND_NAMES, type LanguageId } from "./languages"; // the highlighters
import { type SecretRule } from "./secrets"; // the rule names
import { contrastReport, relativeLuminance, PALETTES, xmlEscape, type PaletteId } from "./render"; // the palettes
import { luminance as contrastToolLuminance } from "../color-contrast-format/compute"; // the colour contrast tool's WCAG luminance, for a cross-check
import { formatXml } from "../xml-formatter/compute"; // the XML formatter's well-formedness check
import { EXAMPLE_FORTIOS, EXAMPLE_OPTIONS } from "./example"; // the Example (D-83), in its own module so the page can import it without the vectors; pinned below by svg-example

/** The Example and the options its button sets, re-exported by the conventional names. */
export { EXAMPLE_FORTIOS, EXAMPLE_OPTIONS }; // re-exported

/** The set id: changes whenever any vector changes (scripts/check-api-sync.mjs reads it if the tool is ever exposed). */
export const GOLDEN_VECTOR_SET_ID = "code-to-image-golden-2026-10-27b"; // "b": the share vectors added later the same day

/** Join lines with line feeds. */
const L = (...lines: string[]): string => lines.join("\n"); // no final line feed

/**
 * Write a text with its painted kinds as markup: "[kind:text]" around each coloured run, plain runs as they are.
 * @param text the text
 * @param kinds one kind per code unit
 * @returns the markup
 */
export function markup(text: string, kinds: Uint8Array): string {
  let out = "", cur = -1, buf = ""; // the result, the current kind, the current run
  for (let i = 0; i < text.length; i++) { // every code unit
    if (kinds[i] !== cur) { if (buf) out += cur === 0 ? buf : `[${KIND_NAMES[cur]}:${buf}]`; buf = ""; cur = kinds[i]; } // a new run
    buf += text[i]; // extend the run
  } // for
  if (buf) out += cur === 0 ? buf : `[${KIND_NAMES[cur]}:${buf}]`; // the last run
  return out; // the markup
} // markup


/** A tokenizer vector: an input in one language and its exact colouring. */
export interface TokenizeVector { id: string; language: LanguageId; input: string; markup: string; note: string }

/** The tokenizer vectors, at least one per language. */
export const TOKENIZE_VECTORS: readonly TokenizeVector[] = Object.freeze([
  { // plain text is never coloured
    id: "plain-nothing", language: "plain", // the vector
    input: "# not a comment in plain text\necho \"$HOME\" 42", // the text
    markup: L(
      "# not a comment in plain text", // line 1
      "echo \"$HOME\" 42", // line 2
    ), // the expected colouring
    note: "plain text is never coloured", // what it pins
  },
  { // comments only at a word start (2.3); for/in/do/done (2.4); $f, ${...}, $@ (2.5.2, 2.6.2); an assignment name; $'...' (2.2.4)
    id: "shell-script", language: "shell", // the vector
    input: "#!/bin/sh\n# back up every .conf\nfor f in *.conf; do\n  cp \"$f\" \"${f%.conf}.bak\" # keep a copy\ndone\nLOG=/tmp/x.log ./run --level=2 \"$@\" 2>&1\necho a#b $'tab\\there' 'it''s'", // the text
    markup: L(
      "[comment:#!/bin/sh]", // line 1
      "[comment:# back up every .conf]", // line 2
      "[keyword:for] f [keyword:in] *.conf; [keyword:do]", // line 3
      "  cp [string:\"][variable:$f][string:\"] [string:\"][variable:${f%.conf}][string:.bak\"] [comment:# keep a copy]", // line 4
      "[keyword:done]", // line 5
      "[variable:LOG]=/tmp/x.log ./run --level=2 [string:\"][variable:$@][string:\"] [number:2]>&[number:1]", // line 6
      "echo a#b [string:$'tab\\there'] [string:'it''s']", // line 7
    ), // the expected colouring
    note: "comments only at a word start (2.3); for/in/do/done (2.4); $f, ${...}, $@ (2.5.2, 2.6.2); an assignment name; $'...' (2.2.4)", // what it pins
  },
  { // PS1 "$ " and the BIG-IP bash prompt; output lines stay plain, so the apostrophe in the output opens nothing
    id: "shell-transcript", language: "shell", // the vector
    input: "$ grep -c error /var/log/app.log\n3\n$ echo \"it's $USER\"\nit's rod\n[root@bigip-1:Active:Standalone] config # tmsh show sys version", // the text
    markup: L(
      "[prompt:$ ]grep -c error /var/log/app.log", // line 1
      "3", // line 2
      "[prompt:$ ]echo [string:\"it's ][variable:$USER][string:\"]", // line 3
      "it's rod", // line 4
      "[prompt:[root@bigip-1:Active:Standalone] config # ]tmsh show sys version", // line 5
    ), // the expected colouring
    note: "PS1 \"$ \" and the BIG-IP bash prompt; output lines stay plain, so the apostrophe in the output opens nothing", // what it pins
  },
  { // keywords, soft keywords at a statement start only, prefixes, triple quotes, radix and underscore literals, imaginary
    id: "python-script", language: "python", // the vector
    input: "import os\n\ndef area(r: float = 0x_1F) -> float:\n    \"\"\"Area of a circle.\n    Multi-line.\"\"\"\n    match r:\n        case 0: return 0.0  # nothing\n    return 3.141_59 * r ** 2 + 1e-3j\n\ntype = rb'\\x00' + f\"{r!r}\"", // the text
    markup: L(
      "[keyword:import] os", // line 1
      "", // line 2
      "[keyword:def] area(r: float = [number:0x_1F]) -> float:", // line 3
      "    [string:\"\"\"Area of a circle.", // line 4
      "    Multi-line.\"\"\"]", // line 5
      "    [keyword:match] r:", // line 6
      "        [keyword:case] [number:0]: [keyword:return] [number:0.0]  [comment:# nothing]", // line 7
      "    [keyword:return] [number:3.141_59] * r ** [number:2] + [number:1e-3j]", // line 8
      "", // line 9
      "type = [string:rb'\\x00'] + [string:f\"{r!r}\"]", // line 10
    ), // the expected colouring
    note: "keywords, soft keywords at a statement start only, prefixes, triple quotes, radix and underscore literals, imaginary", // what it pins
  },
  { // sys.ps1 and sys.ps2; the triple-quoted string continues across the "... " line; output stays plain
    id: "python-session", language: "python", // the vector
    input: ">>> s = \"\"\"one\n... two\"\"\"\n>>> print(s)\none\ntwo\n>>>", // the text
    markup: L(
      "[prompt:>>> ]s = [string:\"\"\"one]", // line 1
      "[prompt:... ][string:two\"\"\"]", // line 2
      "[prompt:>>> ]print(s)", // line 3
      "one", // line 4
      "two", // line 5
      "[prompt:>>>]", // line 6
    ), // the expected colouring
    note: "sys.ps1 and sys.ps2; the triple-quoted string continues across the \"... \" line; output stays plain", // what it pins
  },
  { // member names as keys (followed by ":"), strings, numbers, literal names
    id: "json-object", language: "json", // the vector
    input: "{\n  \"name\": \"web-01\",\n  \"port\": 8443,\n  \"weight\": -1.5e2,\n  \"tls\": true,\n  \"backup\": null,\n  \"tags\": [\"a\", \"b\\\"c\"]\n}", // the text
    markup: L(
      "{", // line 1
      "  [key:\"name\"]: [string:\"web-01\"],", // line 2
      "  [key:\"port\"]: [number:8443],", // line 3
      "  [key:\"weight\"]: [number:-1.5e2],", // line 4
      "  [key:\"tls\"]: [keyword:true],", // line 5
      "  [key:\"backup\"]: [keyword:null],", // line 6
      "  [key:\"tags\"]: [[string:\"a\"], [string:\"b\\\"c\"]]", // line 7
      "}", // line 8
    ), // the expected colouring
    note: "member names as keys (followed by \":\"), strings, numbers, literal names", // what it pins
  },
  { // directive, markers, comment after white space, anchor, alias, tag, core-schema values, block scalar content
    id: "yaml-document", language: "yaml", // the vector
    input: "%YAML 1.2\n---\n# service\nweb: &base\n  host: \"a.example\"   # quoted\n  port: 0x1F\n  debug: False\n  ratio: .5\n  list: [one, 'it''s', {k: v}]\n  script: |\n    echo $X # not a comment\n    exit 0\n  other: *base\n  tagged: !!str 123\n...", // the text
    markup: L(
      "[keyword:%YAML 1.2]", // line 1
      "[keyword:---]", // line 2
      "[comment:# service]", // line 3
      "[key:web]: [variable:&base]", // line 4
      "  [key:host]: [string:\"a.example\"]   [comment:# quoted]", // line 5
      "  [key:port]: [number:0x1F]", // line 6
      "  [key:debug]: [keyword:False]", // line 7
      "  [key:ratio]: [number:.5]", // line 8
      "  [key:list]: [one, [string:'it''s'], {[key:k]: v}]", // line 9
      "  [key:script]: [keyword:|]", // line 10
      "    [string:echo $X # not a comment]", // line 11
      "    [string:exit 0]", // line 12
      "  [key:other]: [variable:*base]", // line 13
      "  [key:tagged]: [variable:!!str] [number:123]", // line 14
      "[keyword:...]", // line 15
    ), // the expected colouring
    note: "directive, markers, comment after white space, anchor, alias, tag, core-schema values, block scalar content", // what it pins
  },
  { // when and its event name, if/elseif/else, quoted words with live $ and [ ], ;# comment
    id: "tcl-irule", language: "tcl", // the vector
    input: "# redirect old paths\nwhen HTTP_REQUEST priority 100 {\n  if { [HTTP::uri] starts_with \"/old/$v\" } {\n    HTTP::redirect \"https://[HTTP::host]/new\" ;# moved\n  } elseif { $n > 0x1F } { log local0. \"n=${n}\" } else { pool p_api }\n}", // the text
    markup: L(
      "[comment:# redirect old paths]", // line 1
      "[keyword:when] [key:HTTP_REQUEST] priority [number:100] {", // line 2
      "  [keyword:if] { [HTTP::uri] starts_with [string:\"/old/][variable:$v][string:\"] } {", // line 3
      "    HTTP::redirect [string:\"https://][HTTP::host][string:/new\"] ;[comment:# moved]", // line 4
      "  } [keyword:elseif] { [variable:$n] > [number:0x1F] } { log local0. [string:\"n=][variable:${n}][string:\"] } [keyword:else] { pool p_api }", // line 5
      "}", // line 6
    ), // the expected colouring
    note: "when and its event name, if/elseif/else, quoted words with live $ and [ ], ;# comment", // what it pins
  },
  { // Expect commands as first words; braces read as a script
    id: "tcl-expect", language: "tcl", // the vector
    input: "#!/usr/bin/expect -f\nset timeout 20\nspawn ssh admin@192.0.2.10\nexpect {\n  \"assword:\" { send \"$pw\\r\"; exp_continue }\n  timeout { exit 1 }\n}\ninteract", // the text
    markup: L(
      "[comment:#!/usr/bin/expect -f]", // line 1
      "[keyword:set] timeout [number:20]", // line 2
      "[keyword:spawn] ssh admin@192.0.2.10", // line 3
      "[keyword:expect] {", // line 4
      "  [string:\"assword:\"] { [keyword:send] [string:\"][variable:$pw][string:\\r\"]; [keyword:exp_continue] }", // line 5
      "  timeout { [keyword:exit] [number:1] }", // line 6
      "}", // line 7
      "[keyword:interact]", // line 8
    ), // the expected colouring
    note: "Expect commands as first words; braces read as a script", // what it pins
  },
  { // the tclsh prompt; output plain
    id: "tcl-tclsh", language: "tcl", // the vector
    input: "% set x {a b c}\na b c\n% llength $x\n3", // the text
    markup: L(
      "[prompt:% ][keyword:set] x {a b c}", // line 1
      "a b c", // line 2
      "[prompt:% ][keyword:llength] [variable:$x]", // line 3
      "3", // line 4
    ), // the expected colouring
    note: "the tclsh prompt; output plain", // what it pins
  },
  { // tmsh prompt, commands and modules at the top level, attribute names inside braces, quoted string with #, comment, address with port, bash prompt
    id: "tmsh-config", language: "tmsh", // the vector
    input: "(tmos)# list ltm virtual vs_https\nltm virtual /Common/vs_https {\n    description \"Main site # not a comment\"\n    destination /Common/198.51.100.20:443\n    pool /Common/web_pool # the pool\n}\n[root@bigip-1:Active:Standalone] config # tmsh show sys version", // the text
    markup: L(
      "[prompt:(tmos)# ][keyword:list] [keyword:ltm] virtual vs_https", // line 1
      "[keyword:ltm] virtual /Common/vs_https {", // line 2
      "    [key:description] [string:\"Main site # not a comment\"]", // line 3
      "    [key:destination] /Common/198.51.100.20:443", // line 4
      "    [key:pool] /Common/web_pool [comment:# the pool]", // line 5
      "}", // line 6
      "[prompt:[root@bigip-1:Active:Standalone] config # ]tmsh [keyword:show] [keyword:sys] version", // line 7
    ), // the expected colouring
    note: "tmsh prompt, commands and modules at the top level, attribute names inside braces, quoted string with #, comment, address with port, bash prompt", // what it pins
  },
  { // a # line that is not a prompt, prompts, commands, field names after set, both quote styles with \', a documented $ variable, addresses
    id: "fortios-config", language: "fortios", // the vector
    input: "#config-version=FGVM64-7.06-FW\nFGT # config system admin\nFGT (admin) # edit \"ops\"\n    set accprofile \"super_admin\"\n    set trusthost1 10.0.0.0 255.0.0.0\n    set comments 'it\\'s me'\n    set description $SerialNum\n    next\nend", // the text
    markup: L(
      "[comment:#config-version=FGVM64-7.06-FW]", // line 1
      "[prompt:FGT # ][keyword:config] system admin", // line 2
      "[prompt:FGT (admin) # ][keyword:edit] [string:\"ops\"]", // line 3
      "    [keyword:set] [key:accprofile] [string:\"super_admin\"]", // line 4
      "    [keyword:set] [key:trusthost1] [number:10.0.0.0] [number:255.0.0.0]", // line 5
      "    [keyword:set] [key:comments] [string:'it\\'s me']", // line 6
      "    [keyword:set] [key:description] [variable:$SerialNum]", // line 7
      "    [keyword:next]", // line 8
      "[keyword:end]", // line 9
    ), // the expected colouring
    note: "a # line that is not a prompt, prompts, commands, field names after set, both quote styles with \\', a documented $ variable, addresses", // what it pins
  },
  { // ! comment, the four documented prompts (also without a space), commands, the no form, addresses
    id: "cisco-session", language: "cisco", // the vector
    input: "! WAN edge\nRouter> enable\nRouter#configure terminal\nRouter(config)# interface GigabitEthernet0/0/0\nRouter(config-if)# ip address 192.0.2.1 255.255.255.0\nRouter(config-if)# no shutdown", // the text
    markup: L(
      "[comment:! WAN edge]", // line 1
      "[prompt:Router> ][keyword:enable]", // line 2
      "[prompt:Router#][keyword:configure] terminal", // line 3
      "[prompt:Router(config)# ][keyword:interface] GigabitEthernet0/0/0", // line 4
      "[prompt:Router(config-if)# ][keyword:ip] address [number:192.0.2.1] [number:255.255.255.0]", // line 5
      "[prompt:Router(config-if)# ][keyword:no] shutdown", // line 6
    ), // the expected colouring
    note: "! comment, the four documented prompts (also without a space), commands, the no form, addresses", // what it pins
  },
]); // TOKENIZE_VECTORS

/** An SVG vector: an input, options, and the exact document and alt text. */
export interface SvgVector { id: string; input: string; options: Partial<CodeImageOptions>; svg: string; alt: string; findings: number; note: string }

/** The SVG vectors. */
export const SVG_VECTORS: readonly SvgVector[] = Object.freeze([
  { // the Example: FortiOS, dark palette, frame with a title, line 7 highlighted, the ENC value masked
    id: "svg-example", // the vector
    input: EXAMPLE_FORTIOS, options: EXAMPLE_OPTIONS, // the Example with the options its button sets
    svg: L(
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"451.2\" height=\"348\" viewBox=\"0 0 451.2 348\" role=\"img\" aria-labelledby=\"code-title\" xml:space=\"preserve\">", // the root, with its size and accessible role
      "<title id=\"code-title\">Code image: 9 lines of FortiOS CLI, 1 value masked</title>", // the accessible name
      "<rect width=\"451.2\" height=\"348\" fill=\"#3a4352\"/>", // a background or a highlight band
      "<rect x=\"32\" y=\"32\" width=\"387.2\" height=\"284\" rx=\"8\" fill=\"#11151c\"/>", // the window body
      "<path d=\"M32 68V40A8 8 0 0 1 40 32H411.2A8 8 0 0 1 419.2 40V68Z\" fill=\"#1d232c\"/>", // the title bar
      "<circle cx=\"54\" cy=\"50\" r=\"6\" fill=\"#e0665c\"/>", // a window dot
      "<circle cx=\"74\" cy=\"50\" r=\"6\" fill=\"#e2b340\"/>", // a window dot
      "<circle cx=\"94\" cy=\"50\" r=\"6\" fill=\"#58b368\"/>", // a window dot
      "<rect x=\"32\" y=\"228\" width=\"387.2\" height=\"24\" fill=\"#26303d\"/>", // a background or a highlight band
      "<rect x=\"32\" y=\"228\" width=\"3\" height=\"24\" fill=\"#e3b341\"/>", // a highlight marker
      "<g font-family=\"'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace\" font-size=\"16\" style=\"white-space:pre;font-variant-ligatures:none;font-feature-settings:'calt' 0\">", // the text group: font stack, size, white space kept, no ligatures
      "<text x=\"148.8 158.4 168 177.6 187.2 196.8 206.4 216 225.6 235.2 244.8 254.4 264 273.6 283.2 292.8\" y=\"55.76\" fill=\"#c3cbd4\">VPN to branch 01</text>", // a line of text, one x per character
      "<text x=\"48\" y=\"101.76\" fill=\"#97a1ad\" aria-hidden=\"true\">1</text>", // a line number
      "<text x=\"48\" y=\"125.76\" fill=\"#97a1ad\" aria-hidden=\"true\">2</text>", // a line number
      "<text x=\"48\" y=\"149.76\" fill=\"#97a1ad\" aria-hidden=\"true\">3</text>", // a line number
      "<text x=\"48\" y=\"173.76\" fill=\"#97a1ad\" aria-hidden=\"true\">4</text>", // a line number
      "<text x=\"48\" y=\"197.76\" fill=\"#97a1ad\" aria-hidden=\"true\">5</text>", // a line number
      "<text x=\"48\" y=\"221.76\" fill=\"#97a1ad\" aria-hidden=\"true\">6</text>", // a line number
      "<text x=\"48\" y=\"245.76\" fill=\"#97a1ad\" aria-hidden=\"true\">7</text>", // a line number
      "<text x=\"48\" y=\"269.76\" fill=\"#97a1ad\" aria-hidden=\"true\">8</text>", // a line number
      "<text x=\"48\" y=\"293.76\" fill=\"#97a1ad\" aria-hidden=\"true\">9</text>", // a line number
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6 307.2 316.8 326.4 336 345.6 355.2 364.8 374.4 384\" y=\"101.76\" fill=\"#e6e9ef\"><tspan fill=\"#ff9c94\">config</tspan> vpn ipsec phase1-interface</text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288\" y=\"125.76\" fill=\"#e6e9ef\">    <tspan fill=\"#ff9c94\">edit</tspan> <tspan fill=\"#9ddba0\">&quot;to-branch-01&quot;</tspan></text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6 307.2 316.8 326.4 336 345.6\" y=\"149.76\" fill=\"#e6e9ef\">        <tspan fill=\"#ff9c94\">set</tspan> <tspan fill=\"#c9b0ff\">interface</tspan> <tspan fill=\"#9ddba0\">&quot;port1&quot;</tspan></text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6\" y=\"173.76\" fill=\"#e6e9ef\">        <tspan fill=\"#ff9c94\">set</tspan> <tspan fill=\"#c9b0ff\">peertype</tspan> any</text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6 307.2 316.8 326.4 336 345.6 355.2 364.8 374.4 384 393.6\" y=\"197.76\" fill=\"#e6e9ef\">        <tspan fill=\"#ff9c94\">set</tspan> <tspan fill=\"#c9b0ff\">proposal</tspan> aes256-sha256</text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6 307.2 316.8 326.4 336 345.6 355.2 364.8 374.4 384 393.6\" y=\"221.76\" fill=\"#e6e9ef\">        <tspan fill=\"#ff9c94\">set</tspan> <tspan fill=\"#c9b0ff\">remote-gw</tspan> <tspan fill=\"#8fc6ff\">203.0.113.10</tspan></text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144 153.6 163.2 172.8 182.4 192 201.6 211.2 220.8 230.4 240 249.6 259.2 268.8 278.4 288 297.6 307.2 316.8 326.4 336 345.6 355.2 364.8 374.4 384 393.6\" y=\"245.76\" fill=\"#e6e9ef\">        <tspan fill=\"#ff9c94\">set</tspan> <tspan fill=\"#c9b0ff\">psksecret</tspan> <tspan fill=\"#ff9c94\">ENC</tspan> <tspan fill=\"#ff8fd0\">••••••••</tspan></text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96 105.6 115.2 124.8 134.4 144\" y=\"269.76\" fill=\"#e6e9ef\">    <tspan fill=\"#ff9c94\">next</tspan></text>", // a line of text, one x per character
      "<text x=\"76.8 86.4 96\" y=\"293.76\" fill=\"#e6e9ef\"><tspan fill=\"#ff9c94\">end</tspan></text>", // a line of text, one x per character
      "</g>", // the end of the text group
      "</svg>", // the end of the document
    ) + "\n", // the document, ending with a line feed
    alt: L(
      "Code image: 9 lines of FortiOS CLI, 1 value masked", // the description
      "", // a blank line
      "config vpn ipsec phase1-interface", // the code
      "    edit \"to-branch-01\"", // the code
      "        set interface \"port1\"", // the code
      "        set peertype any", // the code
      "        set proposal aes256-sha256", // the code
      "        set remote-gw 203.0.113.10", // the code
      "        set psksecret ENC [masked]", // the code
      "    next", // the code
      "end", // the code
    ), // the alt text
    findings: 1, // secrets found
    note: "the Example: FortiOS, dark palette, frame with a title, line 7 highlighted, the ENC value masked", // what it pins
  },
  { // light palette, no frame, no numbers, the four XML escapes
    id: "svg-plain-light-bare", // the vector
    input: "hello <world> & \"you\"", // the text
    options: {"palette": "light", "frame": false, "lineNumbers": false, "padding": 16}, // the reader's choices
    svg: L(
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"233.6\" height=\"56\" viewBox=\"0 0 233.6 56\" role=\"img\" aria-labelledby=\"code-title\" xml:space=\"preserve\">", // the root, with its size and accessible role
      "<title id=\"code-title\">Code image: 1 line of plain text</title>", // the accessible name
      "<rect width=\"233.6\" height=\"56\" fill=\"#ffffff\"/>", // a background or a highlight band
      "<g font-family=\"'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace\" font-size=\"16\" style=\"white-space:pre;font-variant-ligatures:none;font-feature-settings:'calt' 0\">", // the text group: font stack, size, white space kept, no ligatures
      "<text x=\"16 25.6 35.2 44.8 54.4 64 73.6 83.2 92.8 102.4 112 121.6 131.2 140.8 150.4 160 169.6 179.2 188.8 198.4 208\" y=\"33.76\" fill=\"#1f2328\">hello &lt;world&gt; &amp; &quot;you&quot;</text>", // a line of text, one x per character
      "</g>", // the end of the text group
      "</svg>", // the end of the document
    ) + "\n", // the document, ending with a line feed
    alt: L(
      "Code image: 1 line of plain text", // the description
      "", // a blank line
      "hello <world> & \"you\"", // the code
    ), // the alt text
    findings: 0, // secrets found
    note: "light palette, no frame, no numbers, the four XML escapes", // what it pins
  },
  { // tabs to 8, light, frame without a title, a masked assignment, a highlighted range
    id: "svg-python-tabs", // the vector
    input: "def f(x):\n\treturn x  # c\nAPI_KEY = \"abc123\"", // the text
    options: {"language": "python", "palette": "light", "fontSize": 14, "padding": 48, "highlight": "2-3", "tabWidth": 8}, // the reader's choices
    svg: L(
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"325.6\" height=\"219\" viewBox=\"0 0 325.6 219\" role=\"img\" aria-labelledby=\"code-title\" xml:space=\"preserve\">", // the root, with its size and accessible role
      "<title id=\"code-title\">Code image: 3 lines of Python, 1 value masked</title>", // the accessible name
      "<rect width=\"325.6\" height=\"219\" fill=\"#d5dbe3\"/>", // a background or a highlight band
      "<rect x=\"48\" y=\"48\" width=\"229.6\" height=\"123\" rx=\"8\" fill=\"#ffffff\"/>", // the window body
      "<path d=\"M48 80V56A8 8 0 0 1 56 48H269.6A8 8 0 0 1 277.6 56V80Z\" fill=\"#eceff3\"/>", // the title bar
      "<circle cx=\"67.25\" cy=\"64\" r=\"5.25\" fill=\"#d4574e\"/>", // a window dot
      "<circle cx=\"84.75\" cy=\"64\" r=\"5.25\" fill=\"#d6a127\"/>", // a window dot
      "<circle cx=\"102.25\" cy=\"64\" r=\"5.25\" fill=\"#3f9d4b\"/>", // a window dot
      "<rect x=\"48\" y=\"115\" width=\"229.6\" height=\"21\" fill=\"#fff3c4\"/>", // a background or a highlight band
      "<rect x=\"48\" y=\"115\" width=\"3\" height=\"21\" fill=\"#9a6700\"/>", // a highlight marker
      "<rect x=\"48\" y=\"136\" width=\"229.6\" height=\"21\" fill=\"#fff3c4\"/>", // a background or a highlight band
      "<rect x=\"48\" y=\"136\" width=\"3\" height=\"21\" fill=\"#9a6700\"/>", // a highlight marker
      "<g font-family=\"'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace\" font-size=\"14\" style=\"white-space:pre;font-variant-ligatures:none;font-feature-settings:'calt' 0\">", // the text group: font stack, size, white space kept, no ligatures
      "<text x=\"62\" y=\"109.54\" fill=\"#5f6872\" aria-hidden=\"true\">1</text>", // a line number
      "<text x=\"62\" y=\"130.54\" fill=\"#5f6872\" aria-hidden=\"true\">2</text>", // a line number
      "<text x=\"62\" y=\"151.54\" fill=\"#5f6872\" aria-hidden=\"true\">3</text>", // a line number
      "<text x=\"87.2 95.6 104 112.4 120.8 129.2 137.6 146 154.4\" y=\"109.54\" fill=\"#1f2328\"><tspan fill=\"#a40e26\">def</tspan> f(x):</text>", // a line of text, one x per character
      "<text x=\"87.2 95.6 104 112.4 120.8 129.2 137.6 146 154.4 162.8 171.2 179.6 188 196.4 204.8 213.2 221.6 230 238.4 246.8 255.2\" y=\"130.54\" fill=\"#1f2328\">        <tspan fill=\"#a40e26\">return</tspan> x  <tspan fill=\"#57606a\"># c</tspan></text>", // a line of text, one x per character
      "<text x=\"87.2 95.6 104 112.4 120.8 129.2 137.6 146 154.4 162.8 171.2 179.6 188 196.4 204.8 213.2 221.6 230 238.4 246.8\" y=\"151.54\" fill=\"#1f2328\">API_KEY = <tspan fill=\"#0a6629\">&quot;</tspan><tspan fill=\"#9c1c6f\">••••••••</tspan><tspan fill=\"#0a6629\">&quot;</tspan></text>", // a line of text, one x per character
      "</g>", // the end of the text group
      "</svg>", // the end of the document
    ) + "\n", // the document, ending with a line feed
    alt: L(
      "Code image: 3 lines of Python, 1 value masked", // the description
      "", // a blank line
      "def f(x):", // the code
      "        return x  # c", // the code
      "API_KEY = \"[masked]\"", // the code
    ), // the alt text
    findings: 1, // secrets found
    note: "tabs to 8, light, frame without a title, a masked assignment, a highlighted range", // what it pins
  },
]); // SVG_VECTORS

/** One expected finding: the rule, where it starts, its label and the exact characters masked (one string per line). */
export interface ExpectedFinding { rule: SecretRule; line: number; column: number; label: string; masked: string[] }
/** A secrets vector: an input, its language, and every finding (none for a negative vector). */
export interface SecretVector { id: string; language: LanguageId; input: string; findings: ExpectedFinding[]; note: string }

/** A share vector: an input, its options, and exactly what a link carries (null: nothing to share). */
export interface ShareVector { id: string; input: string; options: Partial<CodeImageOptions>; text: string | null; masked: number; unmasked: string[]; samePicture: boolean }

/** The OpenSSL traditional PEM block of SECRET_VECTORS, and the Authorization lines (both written for those vectors). */
const SHARE_PEM = "tls:\n  key: |\n    -----BEGIN RSA PRIVATE KEY-----\n    Proc-Type: 4,ENCRYPTED\n    DEK-Info: DES-EDE3-CBC,3F17F5316E2BAC89\n\n    TUlJRm93SUJBQUtDQVFFQWZha2VLZXk=\n    ZmFrZQ==\n    -----END RSA PRIVATE KEY-----\n  cert: x"; // as pem-traditional

/** What Share results carries (2026-10-27). */
export const SHARE_VECTORS: readonly ShareVector[] = Object.freeze([
  { // the Example: the ENC value becomes the eight bullets; the receiving page finds the bullets again and draws the identical SVG
    id: "share-example", input: EXAMPLE_FORTIOS, options: { ...EXAMPLE_OPTIONS }, // the Example and its options
    text: "config vpn ipsec phase1-interface\n    edit \"to-branch-01\"\n        set interface \"port1\"\n        set peertype any\n        set proposal aes256-sha256\n        set remote-gw 203.0.113.10\n        set psksecret ENC ••••••••\n    next\nend", // masked
    masked: 1, unmasked: [], samePicture: true, // and the same SVG on arrival
  },
  { // the Example with its one finding unticked: the value is in the link, and listed for the popover
    id: "share-example-unmasked", input: EXAMPLE_FORTIOS, options: { ...EXAMPLE_OPTIONS, unmask: ["fortios-enc@7:27"] }, // unticked
    text: EXAMPLE_FORTIOS, masked: 0, unmasked: ["fortios-enc@7:27"], samePicture: false, // as pasted (the receiving page masks it by default)
  },
  { // a PEM block: every body line, the Proc-Type and DEK-Info headers included, becomes the bullets; the boundaries stay
    id: "share-pem-body", input: SHARE_PEM, options: { language: "yaml" }, // YAML
    text: "tls:\n  key: |\n    -----BEGIN RSA PRIVATE KEY-----\n    ••••••••\n    ••••••••\n\n    ••••••••\n    ••••••••\n    -----END RSA PRIVATE KEY-----\n  cert: x", // masked line by line
    masked: 1, unmasked: [], samePicture: false, // the same characters; the bullets are not a secret to the receiving check
  },
  { // Bearer and Basic credentials (RFC 6750 and RFC 7617 examples) on two curl lines
    id: "share-authorization", input: "curl -H \"Authorization: Bearer mF_9.B5f-4.1JqM\" https://api.example.com/\ncurl -H 'proxy-authorization: basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' http://x/", options: { language: "shell" }, // shell
    text: "curl -H \"Authorization: Bearer ••••••••\" https://api.example.com/\ncurl -H 'proxy-authorization: basic ••••••••' http://x/", // both masked
    masked: 2, unmasked: [], samePicture: false, // the same characters
  },
  { // normalisation first: the byte order mark goes, CR LF becomes LF, the final line feed goes; a tab stays a tab
    id: "share-normalised", input: "\ufeffuser: alice\r\npassword: hunter2-demo\r\n\tindented: yes\r\n", options: { language: "yaml" }, // YAML
    text: "user: alice\npassword: ••••••••\n\tindented: yes", masked: 1, unmasked: [], samePicture: false, // as the picture reads it
  },
  { // no picture, nothing to share
    id: "share-empty", input: "  \n ", options: {}, text: null, masked: 0, unmasked: [], samePicture: false, // white space only
  },
  { // refused by a limit (a title over 80 code points): nothing to share either
    id: "share-refused", input: "x", options: { title: "t".repeat(81) }, text: null, masked: 0, unmasked: [], samePicture: false, // title-too-long
  },
]);

/** The secrets vectors, every rule positive and negative. */
export const SECRET_VECTORS: readonly SecretVector[] = Object.freeze([
  { // OpenSSL's traditional form with Proc-Type and DEK-Info headers (PEM_read_bio_PrivateKey(3)), indented in a YAML block scalar; every body line is masked, the boundaries are kept
    id: "pem-traditional", language: "yaml", // the vector
    input: "tls:\n  key: |\n    -----BEGIN RSA PRIVATE KEY-----\n    Proc-Type: 4,ENCRYPTED\n    DEK-Info: DES-EDE3-CBC,3F17F5316E2BAC89\n\n    TUlJRm93SUJBQUtDQVFFQWZha2VLZXk=\n    ZmFrZQ==\n    -----END RSA PRIVATE KEY-----\n  cert: x", // the text
    findings: [
      { rule: "pem-private-key", line: 4, column: 5, label: "RSA PRIVATE KEY", masked: ["Proc-Type: 4,ENCRYPTED", "DEK-Info: DES-EDE3-CBC,3F17F5316E2BAC89", "TUlJRm93SUJBQUtDQVFFQWZha2VLZXk=", "ZmFrZQ=="] }, // a finding
    ], // the findings, in reading order
    note: "OpenSSL's traditional form with Proc-Type and DEK-Info headers (PEM_read_bio_PrivateKey(3)), indented in a YAML block scalar; every body line is masked, the boundaries are kept", // what it pins
  },
  { // RFC 7468 section 10 label, written on one line with \n escapes as JSON credentials files do
    id: "pem-pkcs8-one-line", language: "json", // the vector
    input: "{\"private_key\": \"-----BEGIN PRIVATE KEY-----\\nTUlJRXZRSUJBREFOZmFrZQ==\\n-----END PRIVATE KEY-----\\n\"}", // the text
    findings: [
      { rule: "pem-private-key", line: 1, column: 45, label: "PRIVATE KEY", masked: ["\\nTUlJRXZRSUJBREFOZmFrZQ==\\n"] }, // a finding
    ], // the findings, in reading order
    note: "RFC 7468 section 10 label, written on one line with \\n escapes as JSON credentials files do", // what it pins
  },
  { // OpenSSH's armour (sshkey.c MARK_BEGIN); no END line, so the body runs to the first line that is not base64
    id: "pem-openssh-cut", language: "plain", // the vector
    input: "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAAZmFrZQ==\nAAAA\n(cut here)", // the text
    findings: [
      { rule: "pem-private-key", line: 2, column: 1, label: "OPENSSH PRIVATE KEY", masked: ["b3BlbnNzaC1rZXktdjEAAAAAZmFrZQ==", "AAAA"] }, // a finding
    ], // the findings, in reading order
    note: "OpenSSH's armour (sshkey.c MARK_BEGIN); no END line, so the body runs to the first line that is not base64", // what it pins
  },
  { // certificates and public keys are not secrets
    id: "pem-certificate-not", language: "plain", // the vector
    input: "-----BEGIN CERTIFICATE-----\nTUlJQmZha2U=\n-----END CERTIFICATE-----\n-----BEGIN PUBLIC KEY-----\nTUlJQmZha2U=\n-----END PUBLIC KEY-----", // the text
    findings: [], // nothing reported
    note: "certificates and public keys are not secrets", // what it pins
  },
  { // RFC 6750 section 2.1's example token; RFC 7617's example credentials; field name and scheme in any case (RFC 9110 5.1, 11.1)
    id: "authz-bearer-basic", language: "shell", // the vector
    input: "curl -H \"Authorization: Bearer mF_9.B5f-4.1JqM\" https://api.example.com/\ncurl -H 'proxy-authorization: basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' http://x/", // the text
    findings: [
      { rule: "http-authorization", line: 1, column: 32, label: "Authorization: Bearer", masked: ["mF_9.B5f-4.1JqM"] }, // a finding
      { rule: "http-authorization", line: 2, column: 37, label: "proxy-authorization: basic", masked: ["QWxhZGRpbjpvcGVuIHNlc2FtZQ=="] }, // a finding
    ], // the findings, in reading order
    note: "RFC 6750 section 2.1's example token; RFC 7617's example credentials; field name and scheme in any case (RFC 9110 5.1, 11.1)", // what it pins
  },
  { // other schemes, no credentials, and a different header name are not reported
    id: "authz-not", language: "plain", // the vector
    input: "Authorization: Digest username=\"x\"\nAuthorization: Bearer\nX-Authorization: Bearer abc", // the text
    findings: [], // nothing reported
    note: "other schemes, no credentials, and a different header name are not reported", // what it pins
  },
  { // the AKIA and ASIA examples from AWS's IAM and CLI documentation (the shell-assignment rule does not also report the ID, because the name is not secret-looking)
    id: "aws-key-ids", language: "plain", // the vector
    input: "aws_access_key_id=AKIAIOSFODNN7EXAMPLE\nsession ASIAI44QH8DHBEXAMPLE;", // the text
    findings: [
      { rule: "aws-access-key-id", line: 1, column: 19, label: "AKIA", masked: ["AKIAIOSFODNN7EXAMPLE"] }, // a finding
      { rule: "aws-access-key-id", line: 2, column: 9, label: "ASIA", masked: ["ASIAI44QH8DHBEXAMPLE"] }, // a finding
    ], // the findings, in reading order
    note: "the AKIA and ASIA examples from AWS's IAM and CLI documentation (the shell-assignment rule does not also report the ID, because the name is not secret-looking)", // what it pins
  },
  { // inside a longer word, lower case, or too short
    id: "aws-not", language: "plain", // the vector
    input: "XAKIAIOSFODNN7EXAMPLE AKIAIOSFODNN7EXAMPLEX akiaiosfodnn7example AKIA1234", // the text
    findings: [], // nothing reported
    note: "inside a longer word, lower case, or too short", // what it pins
  },
  { // RFC 7519 section 3.1's JWT and section 6.1's unsecured JWT (empty signature); the JWS rule wins over the shell assignment
    id: "jwt-rfc7519", language: "plain", // the vector
    input: "token=eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nunsecured eyJhbGciOiJub25lIn0.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.", // the text
    findings: [
      { rule: "jwt", line: 1, column: 7, label: "JWS", masked: ["eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"] }, // a finding
      { rule: "jwt", line: 2, column: 11, label: "JWS", masked: ["eyJhbGciOiJub25lIn0.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ."] }, // a finding
    ], // the findings, in reading order
    note: "RFC 7519 section 3.1's JWT and section 6.1's unsecured JWT (empty signature); the JWS rule wins over the shell assignment", // what it pins
  },
  { // a five-part JWE (RFC 7519 appendix A.1's header and the first part of each later segment)
    id: "jwt-jwe", language: "plain", // the vector
    input: "eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0.QR1Owv2ug2WyPBnbQrRARTeEk9kDO2w8qDcjiHnSJflSdv1iNqhWXaKH4MqAkQtM.AxY8DCtDaGlsbGljb3RoZQ.MKOle7UQrG6nSxTLX6Mqwt0orbHvAKeWnDYvpIAeZ72deHxz3roJDXQyhxx0wKaM.fiK51VwhsxJ-siBMR-YFiA", // the text
    findings: [
      { rule: "jwt", line: 1, column: 1, label: "JWE", masked: ["eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0.QR1Owv2ug2WyPBnbQrRARTeEk9kDO2w8qDcjiHnSJflSdv1iNqhWXaKH4MqAkQtM.AxY8DCtDaGlsbGljb3RoZQ.MKOle7UQrG6nSxTLX6Mqwt0orbHvAKeWnDYvpIAeZ72deHxz3roJDXQyhxx0wKaM.fiK51VwhsxJ-siBMR-YFiA"] }, // a finding
    ], // the findings, in reading order
    note: "a five-part JWE (RFC 7519 appendix A.1's header and the first part of each later segment)", // what it pins
  },
  { // dotted names, versions, a header without alg, four parts
    id: "jwt-not", language: "plain", // the vector
    input: "www.example.com 1.2.3 eyJub3QiOiJqd3QifQ.eyJ4IjoxfQ.c2ln a.b.c.d", // the text
    findings: [], // nothing reported
    note: "dotted names, versions, a header without alg, four parts", // what it pins
  },
  { // the example of tmsh's sys file ssl-key page; a reference and a user name alone are not reported
    id: "url-password", language: "tmsh", // the vector
    input: "source-path ftp://username:password@server/cert_store/certs/vs_132.key\nhttps://ops:${PASS}@h.example/ https://ops@h.example/", // the text
    findings: [
      { rule: "url-password", line: 1, column: 28, label: "ftp://username:", masked: ["password"] }, // a finding
    ], // the findings, in reading order
    note: "the example of tmsh's sys file ssl-key page; a reference and a user name alone are not reported", // what it pins
  },
  { // the encrypted form a backup holds (Fortinet Technical Tip: set psksecret ENC ...)
    id: "fortios-enc", language: "fortios", // the vector
    input: "config vpn ipsec phase1-interface\n    edit \"test_vpn\"\n        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==\n    next\nend", // the text
    findings: [
      { rule: "fortios-enc", line: 3, column: 27, label: "set psksecret ENC", masked: ["Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ=="] }, // a finding
    ], // the findings, in reading order
    note: "the encrypted form a backup holds (Fortinet Technical Tip: set psksecret ENC ...)", // what it pins
  },
  { // Tcl set with a quoted and a braced value; a plain name, a reference and a command substitution are not reported
    id: "set-secret", language: "tcl", // the vector
    input: "set password \"s3cr3t\"\nset user admin\nset api_key {abc def}\nset pw $env(PW)\nset password [gets stdin]", // the text
    findings: [
      { rule: "set-secret", line: 1, column: 15, label: "set password", masked: ["s3cr3t"] }, // a finding
      { rule: "set-secret", line: 3, column: 14, label: "set api_key", masked: ["abc def"] }, // a finding
    ], // the findings, in reading order
    note: "Tcl set with a quoted and a braced value; a plain name, a reference and a command substitution are not reported", // what it pins
  },
  { // FortiOS set password with a clear value (set-secret) and with ENC (fortios-enc)
    id: "set-secret-fortios", language: "fortios", // the vector
    input: "config system admin\n    edit \"ops\"\n        set password \"changeme-now\"\n        set password ENC SH2demo\n    next\nend", // the text
    findings: [
      { rule: "set-secret", line: 3, column: 23, label: "set password", masked: ["changeme-now"] }, // a finding
      { rule: "fortios-enc", line: 4, column: 26, label: "set password ENC", masked: ["SH2demo"] }, // a finding
    ], // the findings, in reading order
    note: "FortiOS set password with a clear value (set-secret) and with ENC (fortios-enc)", // what it pins
  },
  { // tmsh attributes (auth user, ltm monitor http, sys file ssl-key); none, a comment's prose and prompt-for-password are not reported
    id: "keyword-tmsh", language: "tmsh", // the vector
    input: "auth user ops {\n    encrypted-password $6$demo$notarealhash\n    password none\n}\nltm monitor http m_web { password Secr3t-demo }\nsys file ssl-key k.key { passphrase \"$M$demo\" }\n# the password is weak\nprompt-for-password", // the text
    findings: [
      { rule: "keyword-value", line: 2, column: 24, label: "encrypted-password", masked: ["$6$demo$notarealhash"] }, // a finding
      { rule: "keyword-value", line: 5, column: 35, label: "password", masked: ["Secr3t-demo"] }, // a finding
      { rule: "keyword-value", line: 6, column: 38, label: "passphrase", masked: ["$M$demo"] }, // a finding
    ], // the findings, in reading order
    note: "tmsh attributes (auth user, ltm monitor http, sys file ssl-key); none, a comment's prose and prompt-for-password are not reported", // what it pins
  },
  { // IOS XE's username secret and enable secret with their type digit (the type 5 value is the guide's own example), a type 7 line password; service password-encryption is not a value
    id: "keyword-cisco", language: "cisco", // the vector
    input: "username ops secret 9 $9$demoSALTdemo$demoHASHdemo\nenable secret 5 $1$dNmW$7jWhqdtZ2qBVz2R4CSZZC0\nline vty 0 4\n password 7 0822455D0A16\nservice password-encryption", // the text
    findings: [
      { rule: "keyword-value", line: 1, column: 23, label: "secret 9", masked: ["$9$demoSALTdemo$demoHASHdemo"] }, // a finding
      { rule: "keyword-value", line: 2, column: 17, label: "secret 5", masked: ["$1$dNmW$7jWhqdtZ2qBVz2R4CSZZC0"] }, // a finding
      { rule: "keyword-value", line: 4, column: 13, label: "password 7", masked: ["0822455D0A16"] }, // a finding
    ], // the findings, in reading order
    note: "IOS XE's username secret and enable secret with their type digit (the type 5 value is the guide's own example), a type 7 line password; service password-encryption is not a value", // what it pins
  },
  { // RFC 6749 section 5.1's token response: access_token and refresh_token; token_type, a number and an empty value are not reported
    id: "json-oauth", language: "json", // the vector
    input: "{\n  \"access_token\":\"2YotnFZFEjr1zCsicMWpAA\",\n  \"token_type\":\"example\",\n  \"expires_in\":3600,\n  \"refresh_token\":\"tGzv3JOkF0XG5Qx2TlKWIA\",\n  \"password\":\"\"\n}", // the text
    findings: [
      { rule: "json-member", line: 2, column: 19, label: "\"access_token\"", masked: ["2YotnFZFEjr1zCsicMWpAA"] }, // a finding
      { rule: "json-member", line: 5, column: 20, label: "\"refresh_token\"", masked: ["tGzv3JOkF0XG5Qx2TlKWIA"] }, // a finding
    ], // the findings, in reading order
    note: "RFC 6749 section 5.1's token response: access_token and refresh_token; token_type, a number and an empty value are not reported", // what it pins
  },
  { // block and flow entries; a file path name, a reference and a block scalar header are not reported
    id: "yaml-mapping", language: "yaml", // the vector
    input: "db:\n  password: hunter2-demo # rotate\n  password_file: /run/secrets/db\n  apiKey: \"k-demo\"\n  secret: ${SECRET}\n  token: |\n  creds: {user: a, password: b-demo}", // the text
    findings: [
      { rule: "yaml-mapping", line: 2, column: 13, label: "password:", masked: ["hunter2-demo"] }, // a finding
      { rule: "yaml-mapping", line: 4, column: 12, label: "apiKey:", masked: ["k-demo"] }, // a finding
      { rule: "yaml-mapping", line: 7, column: 30, label: "password:", masked: ["b-demo"] }, // a finding
    ], // the findings, in reading order
    note: "block and flow entries; a file path name, a reference and a block scalar header are not reported", // what it pins
  },
  { // export NAME=value, the AWS CLI credentials example, a query string; PWD (the shell's working directory) and a reference are not reported
    id: "shell-assignments", language: "shell", // the vector
    input: "export DB_PASSWORD='s3cr3t-demo'\naws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nPWD=/home/ops\nGITHUB_TOKEN=$TOKEN\ncurl \"https://h.example/?user=a&password=b-demo\"", // the text
    findings: [
      { rule: "shell-assignment", line: 1, column: 21, label: "DB_PASSWORD=", masked: ["s3cr3t-demo"] }, // a finding
      { rule: "shell-assignment", line: 2, column: 23, label: "aws_secret_access_key=", masked: ["wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"] }, // a finding
      { rule: "shell-assignment", line: 5, column: 42, label: "password=", masked: ["b-demo"] }, // a finding
    ], // the findings, in reading order
    note: "export NAME=value, the AWS CLI credentials example, a query string; PWD (the shell's working directory) and a reference are not reported", // what it pins
  },
  { // an assignment and an annotated assignment of string literals; a comparison and None are not reported
    id: "python-assignments", language: "python", // the vector
    input: "API_KEY = \"abc123-demo\"\nsecret_key: str = r\"xyz-demo\"\nif password == \"x\": pass\nauth_token = None", // the text
    findings: [
      { rule: "assignment", line: 1, column: 12, label: "API_KEY =", masked: ["abc123-demo"] }, // a finding
      { rule: "assignment", line: 2, column: 21, label: "secret_key =", masked: ["xyz-demo"] }, // a finding
    ], // the findings, in reading order
    note: "an assignment and an annotated assignment of string literals; a comparison and None are not reported", // what it pins
  },
]); // SECRET_VECTORS

/** A pinned contrast ratio: palette, pair, ratio rounded down to two decimals, and the WCAG 2.2 threshold it must meet. */
export interface ContrastVector { palette: PaletteId; what: string; ratio: number; required: number }

/** Every contrast ratio of both palettes (SC 1.4.3 for text: 4.5; SC 1.4.11 for the marker: 3). */
export const CONTRAST_VECTORS: readonly ContrastVector[] = Object.freeze([
  { palette: "light", what: "plain on background", ratio: 15.79, required: 4.5 }, // #1f2328 on #ffffff
  { palette: "light", what: "plain on highlight", ratio: 14.19, required: 4.5 }, // #1f2328 on #fff3c4
  { palette: "light", what: "comment on background", ratio: 6.38, required: 4.5 }, // #57606a on #ffffff
  { palette: "light", what: "comment on highlight", ratio: 5.74, required: 4.5 }, // #57606a on #fff3c4
  { palette: "light", what: "string on background", ratio: 7.12, required: 4.5 }, // #0a6629 on #ffffff
  { palette: "light", what: "string on highlight", ratio: 6.4, required: 4.5 }, // #0a6629 on #fff3c4
  { palette: "light", what: "number on background", ratio: 7.59, required: 4.5 }, // #0550ae on #ffffff
  { palette: "light", what: "number on highlight", ratio: 6.82, required: 4.5 }, // #0550ae on #fff3c4
  { palette: "light", what: "keyword on background", ratio: 7.86, required: 4.5 }, // #a40e26 on #ffffff
  { palette: "light", what: "keyword on highlight", ratio: 7.06, required: 4.5 }, // #a40e26 on #fff3c4
  { palette: "light", what: "variable on background", ratio: 7.1, required: 4.5 }, // #8a4600 on #ffffff
  { palette: "light", what: "variable on highlight", ratio: 6.38, required: 4.5 }, // #8a4600 on #fff3c4
  { palette: "light", what: "prompt on background", ratio: 6.46, required: 4.5 }, // #0b6874 on #ffffff
  { palette: "light", what: "prompt on highlight", ratio: 5.81, required: 4.5 }, // #0b6874 on #fff3c4
  { palette: "light", what: "key on background", ratio: 7.34, required: 4.5 }, // #6639ba on #ffffff
  { palette: "light", what: "key on highlight", ratio: 6.59, required: 4.5 }, // #6639ba on #fff3c4
  { palette: "light", what: "masked on background", ratio: 7.47, required: 4.5 }, // #9c1c6f on #ffffff
  { palette: "light", what: "masked on highlight", ratio: 6.71, required: 4.5 }, // #9c1c6f on #fff3c4
  { palette: "light", what: "lineNumber on background", ratio: 5.66, required: 4.5 }, // #5f6872 on #ffffff
  { palette: "light", what: "lineNumber on highlight", ratio: 5.08, required: 4.5 }, // #5f6872 on #fff3c4
  { palette: "light", what: "title on bar", ratio: 8.84, required: 4.5 }, // #3a424a on #eceff3
  { palette: "light", what: "marker on background", ratio: 4.86, required: 3 }, // #9a6700 on #ffffff
  { palette: "light", what: "marker on highlight", ratio: 4.37, required: 3 }, // #9a6700 on #fff3c4
  { palette: "dark", what: "plain on background", ratio: 15.04, required: 4.5 }, // #e6e9ef on #11151c
  { palette: "dark", what: "plain on highlight", ratio: 10.97, required: 4.5 }, // #e6e9ef on #26303d
  { palette: "dark", what: "comment on background", ratio: 7.39, required: 4.5 }, // #9ba6b2 on #11151c
  { palette: "dark", what: "comment on highlight", ratio: 5.39, required: 4.5 }, // #9ba6b2 on #26303d
  { palette: "dark", what: "string on background", ratio: 11.38, required: 4.5 }, // #9ddba0 on #11151c
  { palette: "dark", what: "string on highlight", ratio: 8.31, required: 4.5 }, // #9ddba0 on #26303d
  { palette: "dark", what: "number on background", ratio: 10.18, required: 4.5 }, // #8fc6ff on #11151c
  { palette: "dark", what: "number on highlight", ratio: 7.43, required: 4.5 }, // #8fc6ff on #26303d
  { palette: "dark", what: "keyword on background", ratio: 9.09, required: 4.5 }, // #ff9c94 on #11151c
  { palette: "dark", what: "keyword on highlight", ratio: 6.63, required: 4.5 }, // #ff9c94 on #26303d
  { palette: "dark", what: "variable on background", ratio: 10.91, required: 4.5 }, // #f6bd84 on #11151c
  { palette: "dark", what: "variable on highlight", ratio: 7.96, required: 4.5 }, // #f6bd84 on #26303d
  { palette: "dark", what: "prompt on background", ratio: 11, required: 4.5 }, // #7fd8d0 on #11151c
  { palette: "dark", what: "prompt on highlight", ratio: 8.03, required: 4.5 }, // #7fd8d0 on #26303d
  { palette: "dark", what: "key on background", ratio: 9.7, required: 4.5 }, // #c9b0ff on #11151c
  { palette: "dark", what: "key on highlight", ratio: 7.08, required: 4.5 }, // #c9b0ff on #26303d
  { palette: "dark", what: "masked on background", ratio: 8.79, required: 4.5 }, // #ff8fd0 on #11151c
  { palette: "dark", what: "masked on highlight", ratio: 6.41, required: 4.5 }, // #ff8fd0 on #26303d
  { palette: "dark", what: "lineNumber on background", ratio: 6.98, required: 4.5 }, // #97a1ad on #11151c
  { palette: "dark", what: "lineNumber on highlight", ratio: 5.09, required: 4.5 }, // #97a1ad on #26303d
  { palette: "dark", what: "title on bar", ratio: 9.64, required: 4.5 }, // #c3cbd4 on #1d232c
  { palette: "dark", what: "marker on background", ratio: 9.4, required: 3 }, // #e3b341 on #11151c
  { palette: "dark", what: "marker on highlight", ratio: 6.86, required: 3 }, // #e3b341 on #26303d
]); // CONTRAST_VECTORS

/** A limit vector: an input (built when run, so the file stays small), options, and the refusal expected (null: accepted). */
export interface LimitVector { id: string; input: () => string; options?: Partial<CodeImageOptions>; code: CodeImageErrorCode | null; params?: Record<string, string | number>; lineCount?: number }

/** The limits: at each one (accepted) and one past it (refused), and the other refusals. */
export const LIMIT_VECTORS: readonly LimitVector[] = Object.freeze<LimitVector[]>([
  { id: "empty", input: () => "   \n\t\n", code: "empty", params: {} }, // only white space
  { id: "chars-at-limit", input: () => ("a".repeat(399) + "\n").repeat(125), code: null, lineCount: 125 }, // exactly 50,000 characters (the final line feed makes no line)
  { id: "chars-past-limit", input: () => "a".repeat(MAX_CHARS + 1), code: "too-many-chars", params: { max: MAX_CHARS, length: MAX_CHARS + 1 } }, // refused before any work
  { id: "lines-at-limit", input: () => "x\n".repeat(MAX_LINES), code: null, lineCount: MAX_LINES }, // 400 lines
  { id: "lines-past-limit", input: () => "x\n".repeat(MAX_LINES + 1), code: "too-many-lines", params: { max: MAX_LINES, lines: MAX_LINES + 1 } }, // 401 lines
  { id: "columns-at-limit", input: () => "a".repeat(MAX_COLUMNS), code: null, lineCount: 1 }, // 400 columns
  { id: "columns-past-limit", input: () => "ok\n" + "a".repeat(MAX_COLUMNS + 1), code: "line-too-long", params: { max: MAX_COLUMNS, line: 2, columns: MAX_COLUMNS + 1 } }, // 401 columns on line 2
  { id: "tabs-past-limit", input: () => "x" + "\t".repeat(51), options: { tabWidth: 8 }, code: "line-too-long", params: { max: MAX_COLUMNS, line: 1, columns: 408 } }, // "x" then 51 tabs: 8 + 50 x 8 columns
  { id: "title-at-limit", input: () => "x", options: { title: "t".repeat(MAX_TITLE) }, code: null, lineCount: 1 }, // 80 characters
  { id: "title-past-limit", input: () => "x", options: { title: "t".repeat(MAX_TITLE + 1) }, code: "title-too-long", params: { max: MAX_TITLE } }, // 81 characters
  { id: "highlight-past-limit", input: () => "x", options: { highlight: "1,".repeat(101) }, code: "highlight-too-long", params: { max: MAX_HIGHLIGHT_SPEC } }, // 202 characters
  { id: "bad-font-size", input: () => "x", options: { fontSize: 13 }, code: "bad-option", params: {} }, // not an offered size
  { id: "bad-language", input: () => "x", options: { language: "cobol" as LanguageId }, code: "bad-option", params: {} }, // not an offered language
]); // LIMIT_VECTORS

/** A normalisation vector. */
export interface NormaliseVector { id: string; input: string; text: string; notes: CodeImageNote[]; replaced: number }

/** The normalisation of the text before anything else. */
export const NORMALISE_VECTORS: readonly NormaliseVector[] = Object.freeze<NormaliseVector[]>([
  { id: "bom-and-line-ends", input: "﻿a\r\nb\rc\n", text: "a\nb\nc", notes: ["bom-removed", "line-endings"], replaced: 0 }, // BOM removed, CR LF and CR to LF, one final LF dropped
  { id: "xml-illegal", input: "a\u0001b\u001b[31mc\ud800d￾", text: "a�b�[31mc�d�", notes: ["controls-replaced"], replaced: 4 }, // C0 controls, a lone surrogate and U+FFFE are not XML characters
  { id: "astral-kept", input: "😀 ok\u007f", text: "😀 ok\u007f", notes: [], replaced: 0 }, // a surrogate pair and U+007F are XML characters
  { id: "one-final-lf", input: "x\n\n", text: "x\n", notes: [], replaced: 0 }, // only one final line feed is dropped
]); // NORMALISE_VECTORS

/** A notes vector: the notes renderCode reports. */
export interface NoteVector { id: string; input: string; options: Partial<CodeImageOptions>; notes: CodeImageNote[] }

/** The notes. */
export const NOTE_VECTORS: readonly NoteVector[] = Object.freeze<NoteVector[]>([
  { id: "tabs-and-trailing", input: "a\t \nb  ", options: {}, notes: ["tabs-expanded", "trailing-blanks"] }, // a tab, blanks at line ends
  { id: "shell-transcript", input: "$ ls\nfile", options: { language: "shell" }, notes: ["transcript"] }, // a session
  { id: "python-script", input: "x = 1", options: { language: "python" }, notes: [] }, // nothing changed
]); // NOTE_VECTORS

/** A highlight vector. */
export interface HighlightVector { id: string; spec: string; lineCount: number; lines: number[]; problems: HighlightProblem[] }

/** The line list parser. */
export const HIGHLIGHT_VECTORS: readonly HighlightVector[] = Object.freeze<HighlightVector[]>([
  { id: "list-and-ranges", spec: "3, 5-7 9", lineCount: 10, lines: [3, 5, 6, 7, 9], problems: [] }, // commas and blanks both separate
  { id: "problems", spec: "2-1, x, 0, 8-12", lineCount: 10, lines: [8, 9, 10], problems: [{ token: "2-1", reason: "malformed" }, { token: "x", reason: "malformed" }, { token: "0", reason: "malformed" }, { token: "8-12", reason: "out-of-range" }] }, // a backwards range, a word, zero, a range past the end (kept up to the end)
  { id: "empty", spec: "", lineCount: 3, lines: [], problems: [] }, // nothing highlighted
]); // HIGHLIGHT_VECTORS

/** Code points in a string. */
const cps = (s: string): number => Array.from(s).length; // counted once each

/** Undo the four XML escapes. */
const unescapeXml = (s: string): string => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&"); // the inverse of xmlEscape

/** Show a string on one line in a failure message. */
const show = (s: string | undefined): string => JSON.stringify(s); // escaped

/**
 * Run every vector.
 * @returns the set id, how many checks ran, how many passed, and every failure
 */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every failure, with its vector id
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, and kept when failed

  for (const v of TOKENIZE_VECTORS) { // the colouring
    const got = markup(v.input, paintKinds(v.input, v.language)); // the engine
    check(got === v.markup, `[${v.id}] markup differs:\n  got  ${show(got)}\n  want ${show(v.markup)}`); // exact
  } // tokenize

  for (const v of SVG_VECTORS) { // the documents
    const r = renderCode(v.input, v.options); // the engine
    check(r.ok, `[${v.id}] refused: ${r.error?.code}`); // accepted
    check(r.svg === v.svg, `[${v.id}] SVG differs:\n  got  ${show(r.svg)}\n  want ${show(v.svg)}`); // byte for byte
    check(r.altText === v.alt, `[${v.id}] alt text differs:\n  got  ${show(r.altText)}\n  want ${show(v.alt)}`); // exact
    check(r.findings.length === v.findings, `[${v.id}] findings: got ${r.findings.length}, want ${v.findings}`); // the secrets check ran
    check(formatXml(r.svg, { mode: "minify", indent: 2, comments: "keep" }).ok, `[${v.id}] the SVG is not well-formed XML`); // an XML document
    for (const m of r.svg.matchAll(/<text x="([^"]*)"[^>]*>(.*?)<\/text>/g)) { // every text element
      const xs = m[1].split(" ").length; // positions
      const chars = cps(unescapeXml(m[2].replace(/<[^>]+>/g, ""))); // characters
      check(xs === chars, `[${v.id}] ${xs} x positions for ${chars} characters in ${show(m[0].slice(0, 80))}`); // one each
    } // text elements
    check(renderCode(v.input, v.options).svg === r.svg, `[${v.id}] not deterministic`); // the same bytes twice
  } // svg

  for (const v of SECRET_VECTORS) { // the secrets check
    const r = renderCode(v.input, { language: v.language }); // rendered, everything masked
    const got = r.findings.map((f) => ({ rule: f.rule, line: f.line, column: f.column, label: f.label, masked: f.spans.map((s) => normalise(v.input).text.slice(s.start, s.end)) })); // what was found
    check(JSON.stringify(got) === JSON.stringify(v.findings), `[${v.id}] findings differ:\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(v.findings)}`); // exact
    if (v.findings.length === 0) continue; // a negative vector
    check(r.maskedCount === v.findings.length, `[${v.id}] masked ${r.maskedCount} of ${v.findings.length}`); // all masked by default
    for (const f of v.findings) for (const s of f.masked) { // every secret
      const bare = s.trim(); // the value
      if (bare === "") continue; // nothing to look for
      check(!r.svg.includes(xmlEscape(bare)), `[${v.id}] masked value ${show(bare)} is still in the SVG`); // not in the image's text
      check(!r.altText.includes(bare), `[${v.id}] masked value ${show(bare)} is still in the alt text`); // nor in the alt text
    } // secrets
    const open = renderCode(v.input, { language: v.language, unmask: r.findings.map(findingKey) }); // every finding unticked
    check(open.maskedCount === 0, `[${v.id}] unmask left ${open.maskedCount} masked`); // nothing masked
    for (const f of v.findings) for (const s of f.masked) { const bare = s.trim(); if (bare !== "" && !bare.includes("\t")) check(open.svg.includes(xmlEscape(bare)), `[${v.id}] unmasked value ${show(bare)} missing from the SVG`); } // shown as written
  } // secrets

  for (const v of LIMIT_VECTORS) { // the limits
    const r = renderCode(v.input(), v.options ?? {}); // the engine
    if (v.code === null) { check(r.ok && r.lineCount === v.lineCount, `[${v.id}] expected ok with ${v.lineCount} lines, got ${r.ok ? r.lineCount : r.error?.code}`); continue; } // accepted
    check(!r.ok && r.error?.code === v.code, `[${v.id}] expected ${v.code}, got ${r.ok ? "ok" : r.error?.code}`); // refused
    check(JSON.stringify(r.error?.params) === JSON.stringify(v.params), `[${v.id}] params: got ${JSON.stringify(r.error?.params)}, want ${JSON.stringify(v.params)}`); // with the numbers
  } // limits

  for (const v of NORMALISE_VECTORS) { // normalisation
    const n = normalise(v.input); // the engine
    check(n.text === v.text && JSON.stringify(n.notes) === JSON.stringify(v.notes) && n.replaced === v.replaced, `[${v.id}] got ${show(n.text)} ${JSON.stringify(n.notes)} ${n.replaced}`); // exact
  } // normalise

  for (const v of NOTE_VECTORS) { // notes
    const r = renderCode(v.input, v.options); // the engine
    check(JSON.stringify(r.notes) === JSON.stringify(v.notes), `[${v.id}] notes: got ${JSON.stringify(r.notes)}, want ${JSON.stringify(v.notes)}`); // exact
  } // notes

  for (const v of HIGHLIGHT_VECTORS) { // the line list
    const h = parseLineSpec(v.spec, v.lineCount); // the engine
    check(JSON.stringify(h) === JSON.stringify({ lines: v.lines, problems: v.problems }), `[${v.id}] got ${JSON.stringify(h)}`); // exact
  } // highlight

  const report = contrastReport(); // the palettes, measured now
  check(report.length === CONTRAST_VECTORS.length, `[contrast] ${report.length} rows, ${CONTRAST_VECTORS.length} pinned`); // the same pairs
  report.forEach((row, i) => { // every pair
    const pin = CONTRAST_VECTORS[i]; // the pinned row
    check(pin !== undefined && row.palette === pin.palette && row.what === pin.what && row.ratio === pin.ratio && row.required === pin.required, `[contrast ${row.palette} ${row.what}] got ${row.ratio}, pinned ${pin?.ratio}`); // unchanged
    check(row.ratio >= row.required, `[contrast ${row.palette} ${row.what}] ${row.ratio} is below ${row.required}`); // meets WCAG 2.2
  }); // forEach
  for (const id of ["light", "dark"] as PaletteId[]) { // cross-check the luminance with the colour contrast tool
    const p = PALETTES[id]; // the palette
    for (const hex of [p.background, p.highlight, p.bar, p.title, p.lineNumber, p.marker, ...Object.values(p.kinds)]) { // every colour
      const n = parseInt(hex.slice(1), 16); // the value
      const other = contrastToolLuminance([((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]); // the other implementation
      check(Math.abs(other - relativeLuminance(hex)) < 1e-12, `[luminance ${hex}] ${relativeLuminance(hex)} vs ${other}`); // the same number
    } // colours
  } // palettes

  for (const v of SHARE_VECTORS) { // Share results
    const s = shareableCode(v.input, v.options); // the derived form
    if (v.text === null) { check(!s.ok, `[${v.id}] expected nothing to share`); continue; } // refused or empty
    check(s.ok && s.text === v.text, `[${v.id}] text differs:\n  got  ${s.ok ? show(s.text) : "-"}\n  want ${show(v.text)}`); // byte for byte
    check(s.ok && s.masked === v.masked && JSON.stringify(s.unmasked.map((u) => u.key)) === JSON.stringify(v.unmasked), `[${v.id}] counts or unmasked keys differ`); // the popover's facts
    if (!s.ok) continue; // nothing more to compare
    const a = renderCode(v.input, v.options), b = renderCode(s.text, { ...v.options, unmask: [] }); // the sender's picture, and the receiver's
    const rows = (r: ReturnType<typeof renderCode>): string => (r.layout ? r.layout.lines.map((l) => l.runs.map((x) => x.text).join("")).join("\n") : ""); // the drawn characters
    if (v.unmasked.length === 0) check(rows(a) === rows(b), `[${v.id}] the receiving page draws other characters`); // the same text on every line
    if (v.samePicture) check(a.svg === b.svg && a.altText === b.altText, `[${v.id}] the receiving SVG differs`); // identical, when the check finds the bullets again
    for (const f of a.findings) if (!v.unmasked.includes(findingKey(f))) for (const sp of f.spans) { const secret = normalise(v.input).text.slice(sp.start, sp.end); if (secret.length >= 4) check(!s.text.includes(secret), `[${v.id}] a masked value is in the link`); } // no masked value leaks
  } // share vectors

  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
