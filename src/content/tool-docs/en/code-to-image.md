## What it does

Paste code, configuration or terminal output and get a picture of it for a slide, a ticket or a document: an SVG that keeps the code as real, selectable text, and a PNG at 1x or 2x, with alt text ready to paste beside it. You choose the language for highlighting, a dark or a light palette, the font size, the tab stops, line numbers, a window-style frame with an optional title, the padding, and the lines to highlight.

Before any picture is made, a secrets check looks for values you may not mean to publish, such as private keys, Authorization headers, AWS access key IDs, JWTs, passwords in URLs, FortiOS `ENC` values and password or secret attributes. Every finding is listed and masked in the picture unless you untick it. Everything runs in your browser.

Where the place you are writing in can show text, prefer text. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Success Criterion 1.4.5, Images of Text, asks for text rather than images of text whenever the technology can present it; a fenced code block in a wiki, a knowledge base or a ticket system that renders one is text, and the reader can copy it. This tool is for the places that cannot show it, and the alt text it writes is the code itself. [Code on slides and in tickets](/learn/code-on-slides-and-in-tickets) goes through that choice, the alt text, the contrast and the secrets a screenshot keeps.

## Languages

Highlighting only: nothing is parsed, validated or run, and code that is not valid in the chosen language is still drawn, coloured as far as the rules below reach. Each language's rules come from its own reference, read on 2026-10-27.

| Language | What is coloured | Reference |
|---|---|---|
| Plain text | Nothing | |
| Shell (POSIX sh) | `#` comments only where a word could start (so `a#b` is not one); single, double and dollar-single quotes; `$name`, `${...}`, `$1`, `$@` and the other special parameters, live inside double quotes; the reserved words `if then else elif fi do done case esac while until for in` where they are reserved; the name of an assignment such as `LOG=...`; whole-number words | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), sections 2.2 to 2.6 |
| Python | `#` comments; strings with every prefix (`b`, `r`, `u`, `f`, `t` and the `r` combinations, any case), triple-quoted strings across lines; the 35 keywords; the soft keywords `match`, `case`, `type` and `lazy` when they open a statement; integer, float and imaginary literals with underscores and `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), the current bugfix release (end of life 2031-10, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | member names (a string followed by `:`) as keys; strings; numbers; `true`, `false`, `null`. JSON has no comments, so `//` is not coloured | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | `#` comments after white space; `%` directives; `---` and `...`; mapping keys; double- and single-quoted scalars, also across lines; anchors, aliases and tags; the core schema's null, booleans, integers and floats; the content of `\|` and `>` block scalars | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), sections 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 and 10.3.2 |
| Tcl, iRules, Expect | `#` comments only where a command starts (so `;#` after a command is one); double-quoted words with live `$` and `[...]`; `$name`, `${name}`, `$name(index)`; the first word of a command when it is a Tcl built-in, `when` or an Expect command; `then`, `elseif`, `else`; numbers as `expr` reads them; the event name after `when`. Braced words are coloured as scripts, because the bodies of `proc`, `if`, `when` and `expect` are scripts | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html); iRules are [based on Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) and begin with [`when`](https://clouddocs.f5.com/api/irules/when.html); Expect's commands from [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | prompts; `#` comments at the start of a word; quoted strings; the commands and the root modules (`auth cli gtm ltm net sys wom`) outside braces; attribute names at the start of a line inside an object; addresses and numbers | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) and its [commands](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| FortiOS CLI | prompts; a line that starts with `#` and is not a prompt (such as a backup's first line); single- and double-quoted strings with `\'`, `\"` and `\\`; `config`, `edit`, `set`, `unset`, `next`, `end` and the other commands; the field name after `set`; `ENC`; `$USERFROM`, `$USERNAME`, `$SerialNum`; addresses and numbers | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| Cisco-style CLI | prompts (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, with or without a space after them); `!` comments; `no` and `default` and a few documented commands at the start of a line; addresses, masks and numbers. Cisco's CLI has no general quoting rule, so nothing is coloured as a string | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) ("Precede a comment with an exclamation point"), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

What the highlighters do not do: shell here-documents, nested command substitutions inside double quotes, Python f-string replacement fields (the whole f-string is coloured as a string), YAML flow scalars across lines, and anything that needs a parser rather than a scanner.

### Terminal sessions

For the shell, Python and Tcl, a text in which any line starts with that language's prompt is read as a session. The prompts are `$ ` (the default of POSIX `PS1`) and the BIG-IP bash prompt `[root@bigip-1:Active:Standalone] config # ` for the shell, `>>> ` and `... ` (Python's `sys.ps1` and `sys.ps2`) for Python, and `% ` (tclsh) for Tcl. Lines with a prompt are highlighted as commands, joined to the next prompt line so a string can continue, and the lines without a prompt are command output, left uncoloured, so an apostrophe in the output opens no string. The page says when it read the text this way.

For tmsh, FortiOS and Cisco-style CLI the prompts are coloured and every line is highlighted, because their output is usually configuration.

## The secrets check

It runs on the text whatever language you chose, before anything is drawn. Each rule is taken from the documentation of the format it looks for:

| Rule | What it looks for | What is masked | Source |
|---|---|---|---|
| PEM private key | a `-----BEGIN ... PRIVATE KEY-----` block: `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, OpenSSL's traditional `RSA PRIVATE KEY` (with `Proc-Type` and `DEK-Info` headers) and `OPENSSH PRIVATE KEY`; also a block written on one line with `\n` escapes | every line between the boundaries (the boundary lines stay); without an END line, the lines that look like base64 | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468) sections 2, 3, 10, 11; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/); [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| Authorization header | `Authorization:` or `Proxy-Authorization:` with `Bearer` or `Basic`, in any case | the credentials | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| AWS access key ID | `AKIA` (access key) or `ASIA` (temporary STS key) and 16 upper-case letters or digits, not inside a longer word | the ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html); [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | three (JWS) or five (JWE) base64url segments joined by dots whose first segment decodes to a JSON object with `alg` | the token | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Password in a URL | `scheme://user:password@` | the password | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| FortiOS encrypted value | `set <field> ENC <value>` | the value | [Fortinet technical tip](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| set command | `set <name> <value>` with a secret-looking name: FortiOS fields and Tcl variables (Expect scripts, iRules) | the value, inside its quotes or braces | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands); [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| password, passphrase or secret attribute | tmsh `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase`; Cisco `password` and `secret` with an optional type digit | the value | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html); [Cisco IOS XE 17.18 passwords](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| JSON member | `"name": "value"` with a secret-looking name | the value | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| YAML key | `name: value`, block or flow, with a secret-looking name | the value | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Shell assignment | `NAME=value` with a secret-looking name, also in a URL's query string | the value | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2; the [AWS CLI credentials file](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) uses the same shape |
| Assignment | `name = "string"` (Python, and TOML- or INI-style files) with a secret-looking name | the string's content | [Python 3.15 assignment statements](https://docs.python.org/3/reference/simple_stmts.html) |

**A secret-looking name** is this tool's own rule, not a standard: the last word of the name (split at underscores, hyphens, dots and camelCase) is password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential or credentials, or the name ends in key after api, access, private, secret, signing, client, auth, encryption, master or session. So `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` and `aws_secret_access_key` are secret-looking, and `password_file`, `token_type`, `sort_key` and `PWD` (the shell's working directory) are not.

**Not reported:** an empty value; a placeholder or setting (`none`, `null`, `true`, `false`, `enable`, `disable` and the like); a reference that stands for the value, such as `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, a Tcl `[command]`, `{{ template }}` or `<placeholder>`; a value already masked with `*`, `x` or bullets; a value without any letter or digit. A crypt-style hash such as `$6$salt$hash` or Cisco's `$9$...` is not a reference and is reported. A password, passphrase or secret attribute inside a comment is not reported, because comments use those words in prose; every other rule also looks inside comments. When two rules find the same characters, the more specific one is kept (a JWT in a Bearer header is one finding).

**Masking.** A masked value is replaced by eight bullets, whatever its length, so the picture does not show how long it was. The characters themselves are replaced, not covered: they are in neither the SVG's text, nor the PNG, nor the alt text, where the value reads "[masked]". Untick a finding to show it as written; the choice is remembered by rule, line and column while you edit elsewhere.

**It is not a complete scanner.** It knows the formats above and nothing else, it cannot tell a real secret from an example, and a secret it does not look for stays in the picture. Read the picture before you publish it.

The session secrets in `openssl s_client` output are one example: no rule looks for them, so a TLS 1.3 `Resumption PSK:` line is drawn as printed, and a TLS 1.2 `Master-Key:` line is masked only because it has the shape of a YAML key with a secret-looking name. The [openssl s_client explainer](/tools/openssl-s-client-explainer) lists both among its findings.

## How the picture is made

The engine lays the picture out once (every rectangle, dot and run of text with its position and colour) and both files come from that layout, so they cannot disagree.

- **Font and grid.** JetBrains Mono, the site's monospace font, under the [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). Its metrics, read from the font file: 1000 units per em, every character 600 units wide, ascender 1020, descender 300. A column is 0.6 times the font size, a line is 1.5 times the font size rounded to a whole pixel, and the text sits in the middle of its line. One column per code point: tabs expand to the stops you choose, and characters that are wider in some fonts (many East Asian characters and emoji) still take one column, so they may overlap their neighbour.
- **The SVG** keeps every line as one `<text>` element of real text, coloured with `<tspan>` elements, and gives each character its own x position: [SVG 2](https://www.w3.org/TR/SVG2/text.html) applies the nth x value to the nth character, counted in code points, so the columns hold even in a fallback font. It names the font (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) and does not embed it; where JetBrains Mono is not installed, the viewer's monospace font draws the same columns. White space is kept (`xml:space="preserve"` and `white-space: pre`), programming ligatures are off, the document has a `<title>` with the description and `role="img"`, and line numbers are separate elements so a selection of the code does not pick them up. Characters an XML document cannot hold ([XML 1.0](https://www.w3.org/TR/xml/) production [2]: control characters other than tab and line feed, lone surrogates, U+FFFE and U+FFFF) are replaced with U+FFFD first.
- **The PNG** is drawn on a canvas in your browser at 1x or 2x the CSS pixels, character by character on the same grid, with the page's own copy of JetBrains Mono. Very large pictures can exceed what a browser allows a canvas to be; the page then says so and the SVG still works.
- **Copying the PNG** uses `ClipboardItem`, where the browser has it; `image/png` is one of the data types the [Clipboard API](https://www.w3.org/TR/clipboard-apis/) requires for writing.

Nothing is loaded from or sent to anywhere. The preview is inline SVG built from the layout, and the downloads are files made in the page.

## Palettes and contrast

Both palettes are measured with WCAG 2.2's own formulas (relative luminance with the 0.04045 threshold, contrast ratio (L1 + 0.05) / (L2 + 0.05)). Every text colour, the line numbers and the window title meet Success Criterion 1.4.3's 4.5:1 against every background they can sit on: the code background and the highlighted-line band (the title against the title bar). The marker at the left of a highlighted line is a graphical object and meets 1.4.11's 3:1. The three window dots are decoration. Ratios are rounded down, so a pass is never rounded up.

| Text | Light: on background `#ffffff` | Light: on highlight `#fff3c4` | Dark: on background `#11151c` | Dark: on highlight `#26303d` |
|---|---|---|---|---|
| Plain | `#1f2328` 15.79 | 14.19 | `#e6e9ef` 15.04 | 10.97 |
| Comment | `#57606a` 6.38 | 5.74 | `#9ba6b2` 7.39 | 5.39 |
| String | `#0a6629` 7.12 | 6.40 | `#9ddba0` 11.38 | 8.31 |
| Number | `#0550ae` 7.59 | 6.82 | `#8fc6ff` 10.18 | 7.43 |
| Keyword | `#a40e26` 7.86 | 7.06 | `#ff9c94` 9.09 | 6.63 |
| Variable | `#8a4600` 7.10 | 6.38 | `#f6bd84` 10.91 | 7.96 |
| Prompt | `#0b6874` 6.46 | 5.81 | `#7fd8d0` 11.00 | 8.03 |
| Key | `#6639ba` 7.34 | 6.59 | `#c9b0ff` 9.70 | 7.08 |
| Masked value | `#9c1c6f` 7.47 | 6.71 | `#ff8fd0` 8.79 | 6.41 |
| Line number | `#5f6872` 5.66 | 5.08 | `#97a1ad` 6.98 | 5.09 |

Window title on the title bar: light `#3a424a` on `#eceff3`, 8.84; dark `#c3cbd4` on `#1d232c`, 9.64. Highlight marker (3:1 required): light `#9a6700`, 4.86 on the background and 4.37 on the highlight; dark `#e3b341`, 9.40 and 6.86.

## Alt text

The alt text is a one-line description (how many lines, which language, how many values masked), a blank line, then the code as plain text with every masked value written as "[masked]". That follows Success Criterion 1.1.1, Non-text Content: the text alternative of a picture of code serves the same purpose when it is the code. Where the alt text would be long, put the code as text next to the picture (on a slide, in the speaker notes) and keep only the description as alt text.

## Options

- **Language**: the highlighter (see the table above).
- **Palette**: dark (the default) or light.
- **Font size**: 12, 14, 16 (the default), 18, 20, 24 or 28 CSS pixels.
- **Tab stops**: every 2, 4 (the default) or 8 columns.
- **Padding**: 16, 32 (the default), 48 or 64 CSS pixels around the window, or around the code without a frame.
- **Line numbers**: on by default.
- **Window frame**: on by default, with three decorative dots and an optional title of up to 80 characters.
- **Highlight lines**: numbers and ranges separated by commas or spaces, such as `3, 5-7`. A token that is not a number or a range, zero or a backwards range is ignored, and a range past the last line is kept up to the last line; the page lists what it ignored.

## Limits and what changes

The tool refuses, with the reason, text longer than 50,000 characters, more than 400 lines, a line wider than 400 columns once tabs are expanded, a title longer than 80 characters and a highlight list longer than 200 characters. These keep the picture inside what a slide or a ticket can use and inside what browsers can draw.

It tells you when it has removed a byte order mark, read carriage returns as line breaks, replaced characters XML cannot hold, expanded tabs, trimmed spaces at the ends of lines (they would only widen the picture), or read the text as a terminal session. One final line break makes no extra line.

## Worked example

The Example button loads a FortiOS IPsec phase 1 whose pre-shared key is in the encrypted `ENC` form, written for this example (base64 of "for-demo-only-not-a-real-key"), with the documentation address 203.0.113.10 from [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737):

```
config vpn ipsec phase1-interface
    edit "to-branch-01"
        set interface "port1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.10
        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==
    next
end
```

The secrets check reports one finding, "FortiOS encrypted value (ENC), line 7, column 27", and the picture shows `set psksecret ENC ••••••••` on line 7, which the Example also highlights, under the title "VPN to branch 01". The SVG is 451.2 by 348 CSS pixels in the dark palette, and the alt text begins "Code image: 9 lines of FortiOS CLI, 1 value masked".

## Share results

Under the export buttons, **Share results** builds a link to this page, only when you press it, that carries three things after the `#`: the text as the picture shows it, with every value the secrets check masked replaced by the same eight bullets, the highlighting language and the palette. The window title (free text the secrets check does not read), the highlighted lines, the font size, the padding, the tab stops and the two switches are not carried. A value you unticked is in the link as you typed it, and the popover names each such value by its line and label before you copy anything; when nothing is unticked it says that every value found is masked. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and history of whoever opens it.

- **How long.** At most 16,384 characters of text, the bound the site uses for every value after the `#`; a longer text gets no link, and the popover says so.
- **Opening a link.** The text fills the box as a paste would, the language and the palette are set, and the picture is drawn; the receiving page's own other choices stay as they are. A masked value arrives as eight bullets: on some lines the secrets check finds them again and masks them again, on others it draws them as ordinary characters, so the description may count fewer masked values, but no value is there to reveal. A language or a palette the tool does not offer makes the whole link ignored. Either way the values leave the page's address at once, without a request.

## Provenance

The behaviour is pinned by the golden vector set `code-to-image-golden-2026-10-27b`: the colouring of every language (plain, shell script and session, Python script and session, JSON, YAML, an iRule, an Expect script, a tclsh session, tmsh, FortiOS, Cisco-style), three SVG documents byte for byte with their alt text (each checked as well-formed XML and for one x position per character), every secrets rule positive and negative with the exact characters masked (and checked absent from the SVG and the alt text when masked), every limit at and past its value, the normalisation, the notes, the highlight parser, and every contrast ratio above, whose luminance is also compared with the site's [colour contrast tool](/tools/color-contrast-format), and the text a Share results link carries for seven inputs, byte for byte, with the check that the receiving page draws the same characters and that no masked value is in the link.

## API

Not exposed over the API, on purpose. The PNG is drawn by the reader's browser, and the input is the kind of text that holds secrets: configuration, captures and scripts are exactly what the secrets check exists for, and the safe place to check them is the machine they are already on. Sending them to a server to be checked would defeat the check.

## Sources

All read 2026-10-27.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 and sys.ps2](https://docs.python.org/3/library/sys.html), [assignment statements](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0: Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [the command index](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [the releases](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules: What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) and [when](https://clouddocs.f5.com/api/irules/when.html); [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, the commands index, the 17.0.0 PDF, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). F5's software support policy, [K5903](https://my.f5.com/manage/s/article/K5903) (read 2026-10-27), gives the 17.x Long-Term Stability Releases Standard Support until 31 March 2027 (17.1.x) and 1 January 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference: config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), the Fortinet technical tips on [copying a pre-shared key](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) and on [the end of support of FortiOS 7.4 and 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6: end of engineering support 25 July 2028, end of support 25 January 2030)
- Cisco IOS XE 17.x System Management Configuration Guide: [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) and [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html); [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html); [IOS XE 17.18 passwords](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html); [the IOS XE software lifecycle statement](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (3.5 is OpenSSL's long-term-support release, supported until 2030-04-08 per its [release strategy](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS: [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [CLI configuration and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), and the LICENSE file of the @fontsource/jetbrains-mono 5.2.8 package (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
