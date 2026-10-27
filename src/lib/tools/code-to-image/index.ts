// ============================================================================
// src/lib/tools/code-to-image/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for code to image: paste code,
// configuration or terminal output, choose a language, a palette, a size and a
// frame, and get the picture as SVG (text kept as real, selectable text) and
// as PNG at 1x and 2x (drawn on a canvas in the page from the same layout),
// with alt text ready to paste beside it. Before any image is made, a secrets
// check looks for private keys, Authorization headers, AWS access key IDs,
// JWTs, passwords in URLs, FortiOS ENC values, tmsh and Cisco password and
// passphrase attributes, and secret-looking assignments, and masks each one it
// finds unless the reader unticks it. It says what it looks for and never
// claims to find everything.
//
// Built for engineers and instructors who put CLI output, configuration and
// scripts on slides, in tickets and in documents. Every source below was
// downloaded with curl on 2026-10-27 (generic User-Agent, no-cache headers, a
// cache-busting query) and answered HTTP 200 unless its scope says otherwise;
// the files and the status log are in the build's work folder.
// ============================================================================

import { renderCode, run, type CodeImageOptions, type CodeImageResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, TOKENIZE_VECTORS, SVG_VECTORS, SECRET_VECTORS, LIMIT_VECTORS, NORMALISE_VECTORS, NOTE_VECTORS, HIGHLIGHT_VECTORS, CONTRAST_VECTORS, SHARE_VECTORS } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component.
export { renderCode, run, normalise, parseLineSpec, findingKey, DEFAULT_OPTIONS, MASK, MAX_CHARS, MAX_LINES, MAX_COLUMNS, MAX_TITLE, MAX_HIGHLIGHT_SPEC, LANGUAGE_NAMES_EN } from "./compute"; // values
export type { CodeImageOptions, CodeImageResult, CodeImageErrorCode, CodeImageNote, HighlightProblem } from "./compute"; // types
export { LANGUAGES } from "./languages"; // the language list
export type { LanguageId, TokenKind } from "./languages"; // types
export { PALETTES, FONT_SIZES, PADDINGS, TAB_WIDTHS, FONT_STACK, contrastReport } from "./render"; // the picture's choices
export type { Layout, PaletteId, ContrastRow } from "./render"; // types
export type { SecretFinding, SecretRule } from "./secrets"; // the secrets check's shapes
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, EXAMPLE_FORTIOS, EXAMPLE_OPTIONS, TOKENIZE_VECTORS, SVG_VECTORS, SECRET_VECTORS, LIMIT_VECTORS, NORMALISE_VECTORS, NOTE_VECTORS, HIGHLIGHT_VECTORS, CONTRAST_VECTORS, verifyVectors } from "./golden-vectors"; // vectors and their runner

/** A source: what it is, where, when it was read, and what this tool takes from it. */
interface Src { id: string; label: string; type: string; url: string; access_date: string; scope: string; status: string }
/** Build a source read on 2026-10-27 (every source of this tool was read that day). */
const s = (id: string, label: string, type: string, url: string, scope: string): Src => ({ id, label, type, url, access_date: "2026-10-27", scope, status: "active" }); // one source

/** The D-49 declarative manifest for code to image. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities", // the catalogue family (D-73)
  toolSlug: "code-to-image", // the route segment
  canonicalAliases: [
    "code to image", // the plain name
    "code screenshot", // what people search for
    "code snippet image", // another name
    "cli output to image", // the site's own use
    "syntax highlight image", // what it does
    "code to svg", // the vector output
    "code to png", // the raster output
  ],

  // OMNIBOX EXEMPTION (D-86 section 3.3, deliberate): any text is valid input to this tool, so nothing in a paste
  // identifies it; claiming pastes here would steal them from the tools that explain what was pasted.
  inputDetectors: [] as const,

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // character loops over the pasted text; no network, no clock, no randomness
  apiCapabilityClass: "browser-only", // in API_EXCLUDED: the PNG needs the reader's canvas, and the input is the kind of text that holds secrets

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: TOKENIZE_VECTORS.length + SVG_VECTORS.length + SECRET_VECTORS.length + LIMIT_VECTORS.length + NORMALISE_VECTORS.length + NOTE_VECTORS.length + HIGHLIGHT_VECTORS.length + CONTRAST_VECTORS.length + SHARE_VECTORS.length, // every vector (the share vectors since 2026-10-27)
  dangerousInputHandling: [
    "secret-redaction", // the secrets check masks each finding in the SVG text, the PNG and the alt text, by default
    "never-fetches", // nothing is loaded or sent; the PNG is drawn and copied in the page
    "length-bound", // at most 50,000 characters, 400 lines, 400 columns
    "redos-guard", // sticky and global expressions over non-overlapping classes, bounded quantifiers
    "xml-safe-output", // characters XML 1.0 does not allow are replaced before the SVG is written; text is escaped
    "share-derived-only", // Share results (2026-10-27) builds a link only when pressed, carrying the text with every masked finding still masked (an unticked one is named first), the language and the palette
  ],
  // The paste as typed never goes into a link: the page's own Share button carries no data, and the explicit Share
  // results button (charter section 6.4, D-27 c: "with data" is an explicit choice) carries the derived form above.
  shareSafetyDefault: "never", // pasted configuration often holds secrets

  // -- Teaching & provenance --
  // The new article teaches images of text, alt text, contrast and the secrets screenshots leak; the others are where
  // the tool helps (secrets in captures and configuration).
  learnLinks: ["learn/code-on-slides-and-in-tickets"],
  sources: [
    // Languages.
    s("posix-2024-shell", "The Open Group Base Specifications Issue 8 (IEEE Std 1003.1-2024): Shell Command Language, sections 2.2 to 2.6 and 2.10", "standard", "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html", "quoting including dollar-single-quotes (2.2.1 to 2.2.4); \"#\" starts a comment only where a word could start (2.3); reserved words and where they are recognised (2.4); special parameters (2.5.2); PS1 defaults to \"$ \" and PS2 to \"> \" (2.5.3); parameter expansion (2.6.2); assignment words (2.10.2)"),
    s("python-315-lexical", "Python 3.15 documentation: The Python Language Reference, 2. Lexical analysis", "reference", "https://docs.python.org/3/reference/lexical_analysis.html", "comments (2.1.3); the 35 keywords (2.3.1); soft keywords match, case, _, type and lazy (2.3.2); string prefixes b, r, u, f, t and the r combinations, triple quotes, escapes (2.5); integer, float and imaginary literals with underscores (2.6)"),
    s("python-315-sys", "Python 3.15 documentation: sys, sys.ps1 and sys.ps2", "reference", "https://docs.python.org/3/library/sys.html", "the interactive prompts' initial values \">>> \" and \"... \""),
    s("python-315-assignment", "Python 3.15 documentation: The Python Language Reference, 7.2 Assignment statements", "reference", "https://docs.python.org/3/reference/simple_stmts.html", "assignment and annotated assignment statements, the shape of the assignment rule of the secrets check"),
    s("python-versions", "Python Developer's Guide: Status of Python versions", "reference", "https://devguide.python.org/versions/", "3.15 is a bugfix release, first released 2026-10-09, end of life 2031-10; docs.python.org/3 served 3.15.2 on the day"),
    s("rfc8259", "RFC 8259, The JavaScript Object Notation (JSON) Data Interchange Format, December 2017", "standard", "https://www.rfc-editor.org/rfc/rfc8259.txt", "structural characters and literal names (2, 3), member names (4), numbers (6), strings without raw line breaks (7); JSON has no comments"),
    s("yaml-122", "YAML Ain't Markup Language version 1.2.2, revision of 2021-10-01", "standard", "https://yaml.org/spec/1.2.2/", "indicators (5.3); comments must be separated from other tokens by white space (6.6); directives (6.8); tags and anchors (6.9); quoted and plain scalars (7.3); block scalars (8.1); document markers (9.1.2); the core schema's null, boolean, integer and float forms (10.3.2)"),
    s("tcl90-tcl", "Tcl 9.0.4 manual: Tcl(n), the twelve rules of the language", "reference", "https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html", "commands and separators [1], words [3], double quotes [4], argument expansion [5], braces [6], command substitution [7], variable substitution $name, $name(index), ${name} [8], backslashes [9], \"#\" comments only where a command starts [10]; the 8.6 page states the same comment rule and 9.1's page is the same text"),
    s("tcl90-expr", "Tcl 9.0.4 manual: expr(n), operands", "reference", "https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html", "numeric operands: 0d, 0b, 0o, 0x prefixes, floats, underscores between digits"),
    s("tcl90-if", "Tcl 9.0.4 manual: if(n)", "reference", "https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html", "the words then, elseif and else"),
    s("tcl90-set", "Tcl 9.0.4 manual: set(n)", "reference", "https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html", "set varName ?value?, the shape of the set-secret rule"),
    s("tcl90-tclsh", "Tcl 9.0.4 manual: tclsh(1), PROMPTS", "reference", "https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html", "the interactive prompt \"% \""),
    s("tcl90-commands", "Tcl 9.0.4 manual: Tcl Commands index", "reference", "https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html", "the built-in command names coloured as keywords when they open a command"),
    s("tcl-releases", "Tcl Developer Xchange: Tcl/Tk Software and Tcl/Tk 9.1 pages", "reference", "https://www.tcl-lang.org/software/tcltk/", "latest releases 9.1.0, 9.0.4 and 8.6.18; 9.1 is described as \"the current development work\", so the stable 9.0 pages are the basis"),
    s("f5-irules-whatis", "F5 clouddocs, iRules: What Is An iRule", "vendor-docs", "https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html", "iRule syntax \"is based on the Tool Command Language (Tcl)\", so the Tcl highlighter covers iRules"),
    s("f5-irules-when", "F5 clouddocs, iRules: when", "vendor-docs", "https://clouddocs.f5.com/api/irules/when.html", "every iRule begins with when <event_name>; the event name is coloured as a key"),
    s("expect-1", "expect(1), the Expect manual page, at tcl-lang.org", "reference", "https://www.tcl-lang.org/man/expect5.31/expect.1.html", "Expect scripts are Tcl; spawn, expect, send, interact, exp_continue, expect_after, expect_before, log_user and the other commands coloured as keywords"),
    s("f5-tmsh-tmsh", "F5 TMSH Reference v17: tmsh(1)", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html", "root modules auth, cli, gtm, ltm, net, sys, wom; the (tmos)# and (tmos.ltm)# prompts; quoting with quotation marks, apostrophes or a backslash; commands separated by semicolons; tmsh scripts are Tcl. \"latest\" serves the v17 reference, the newest F5 publishes"),
    s("f5-tmsh-commands", "F5 TMSH Reference v17: Commands index", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html", "the command names coloured as keywords"),
    s("f5-tmsh-pdf", "F5 TMSH Reference 17.0.0 (the full PDF linked from the reference's index)", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/_downloads/dff789d01119c67e4c9d00d212399967/tmsh_17.0.0.pdf", "\"#\" comments in the reference's own tmsh syntax examples (ltm policy); the BIG-IP bash prompt [root@bigip-1:Active:Standalone] config #"),
    s("f5-tmsh-auth-user", "F5 TMSH Reference v17: auth user", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html", "the password and encrypted-password attributes"),
    s("f5-tmsh-ssl-key", "F5 TMSH Reference v17: sys file ssl-key", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html", "the passphrase attribute; source-path ftp://username:password@server/... (a password in a URL)"),
    s("f5-tmsh-client-ssl", "F5 TMSH Reference v17: ltm profile client-ssl", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html", "the passphrase and proxy-ca-passphrase attributes"),
    s("f5-tmsh-monitor-http", "F5 TMSH Reference v17: ltm monitor http", "vendor-docs", "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html", "the password attribute"),
    s("fortios-768-cli-basics", "Fortinet FortiOS 7.6.8 Administration Guide: CLI basics", "vendor-docs", "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics", "special characters: < > ( ) # ' and \" cannot be used in most commands; single or double quotes and the escapes \\' \\\" \\\\ and backslash-space; the $USERFROM, $USERNAME and $SerialNum variables; the first line of a configuration file"),
    s("fortios-768-command-syntax", "Fortinet FortiOS 7.6.8 Administration Guide: Command syntax", "vendor-docs", "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax", "commands, next and end"),
    s("fortios-768-subcommands", "Fortinet FortiOS 7.6.8 Administration Guide: Subcommands", "vendor-docs", "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands", "config, edit, delete, purge, move, clone, rename, get, show, end, set <field> <value>, unset, select, unselect, append; the (admin)# and (27) # prompts"),
    s("fortios-768-system-admin", "Fortinet FortiOS 7.6.8 CLI Reference: config system admin", "vendor-docs", "https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin", "the password field"),
    s("fortios-768-tpm", "Fortinet FortiOS 7.6.8 Administration Guide: Trusted platform module support", "vendor-docs", "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/893277", "private data encryption: the passwords and keys a configuration holds encrypted (IPsec pre-shared keys, local certificates' private keys, user passwords, SNMP ...); \"# \" as the prompt in its examples"),
    s("fortinet-tt-psk-enc", "Fortinet Community, Technical Tip: Command fail while copying the preshare key from another configuration", "vendor-kb", "https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348", "set psksecret ENC <value>: the encrypted form in a configuration file"),
    s("fortinet-tt-eos", "Fortinet Community, Technical Tip: FortiOS end of support change for FortiOS v7.4 and v7.6", "vendor-kb", "https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876", "FortiOS 7.6: End of Engineering Support 25 Jul 2028, End of Support 25 Jan 2030 (CSB-260330-1); the Life Cycle page itself needs a login and was not read"),
    s("cisco-iosxe17-config-files", "Cisco IOS XE 17.x System Management Configuration Guide: Managing Configuration Files", "vendor-docs", "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html", "\"Precede a comment with an exclamation point (!)\"; comments are not stored in NVRAM"),
    s("cisco-iosxe17-cli", "Cisco IOS XE 17.x System Management Configuration Guide: Using the Cisco IOS Command-Line Interface", "vendor-docs", "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html", "command modes and prompts, configure terminal, the no and default forms"),
    s("cisco-c8400-cli", "Cisco Catalyst 8400 Series Software Configuration Guide: Using Cisco IOS XE Software", "vendor-docs", "https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html", "the table of modes with their prompts Router>, Router#, Router(config)#, Router(config-if)#; enable, interface, ip address, copy, show"),
    s("cisco-c9300-1718-passwords", "Cisco Security Configuration Guide, IOS XE 17.18.x (Catalyst 9300): Controlling Switch Access with Passwords and Privilege Levels", "vendor-docs", "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html", "enable secret, enable password, username ... secret 5 / secret 9 with the type digit; the guide's own type 5 example; type 0, 6, 7, 8 and 9 passwords"),
    s("cisco-iosxe-lifecycle", "Cisco: Software Lifecycle Support Statement, IOS XE", "vendor-docs", "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html", "from 26.1.1 every IOS XE release is an Extended Support release with 48 months from GA; no 26.x edition of the two System Management chapters was found at the 17.x paths (HTTP 404), so the 17.x guides are cited, and the 17.18 guide for passwords"),
    // Secrets.
    s("rfc7468", "RFC 7468, Textual Encodings of PKIX, PKCS, and CMS Structures, April 2015", "standard", "https://www.rfc-editor.org/rfc/rfc7468.txt", "encapsulation boundaries -----BEGIN label----- and -----END label----- and the label grammar (2, 3); PRIVATE KEY (10) and ENCRYPTED PRIVATE KEY (11)"),
    s("openssl35-pem", "OpenSSL 3.5 manual: PEM_read_bio_PrivateKey(3)", "reference", "https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/", "the traditional private key format and its PEM ENCRYPTION FORMAT: -----BEGIN RSA PRIVATE KEY----- with Proc-Type: 4,ENCRYPTED and DEK-Info headers (OpenSSL 3.5 is the long-term-support release: \"Version 3.5 will be supported until 2030-04-08 (LTS)\", openssl-library.org/policies/releasestrat/, read the same day)"),
    s("openssh-sshkey", "OpenSSH portable source: sshkey.c", "implementation", "https://raw.githubusercontent.com/openssh/openssh-portable/master/sshkey.c", "MARK_BEGIN -----BEGIN OPENSSH PRIVATE KEY----- and MARK_END"),
    s("rfc9110", "RFC 9110, HTTP Semantics, June 2022", "standard", "https://www.rfc-editor.org/rfc/rfc9110.txt", "field names are case-insensitive (5.1); the auth-scheme is a case-insensitive token (11.1); credentials and token68 (11.2, 11.4); Authorization and Proxy-Authorization (11.6.2, 11.7.2)"),
    s("rfc6750", "RFC 6750, OAuth 2.0 Bearer Token Usage, October 2012", "standard", "https://www.rfc-editor.org/rfc/rfc6750.txt", "Authorization: Bearer <b64token> and its example token (2.1)"),
    s("rfc7617", "RFC 7617, The 'Basic' HTTP Authentication Scheme, September 2015", "standard", "https://www.rfc-editor.org/rfc/rfc7617.txt", "Authorization: Basic <base64 of user-pass> and its examples (2)"),
    s("rfc6749", "RFC 6749, The OAuth 2.0 Authorization Framework, October 2012", "standard", "https://www.rfc-editor.org/rfc/rfc6749.txt", "the access_token and refresh_token members of a token response and its example (5.1)"),
    s("aws-iam-identifiers", "AWS Identity and Access Management User Guide: IAM identifiers, Understanding unique ID prefixes", "vendor-docs", "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html", "AKIA: access key; ASIA: temporary (AWS STS) access key"),
    s("aws-iam-access-keys", "AWS Identity and Access Management User Guide: Manage access keys for IAM users", "vendor-docs", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html", "an access key is an access key ID (AKIAIOSFODNN7EXAMPLE) and a secret access key"),
    s("aws-cli-config-files", "AWS Command Line Interface User Guide: Configuration and credential file settings", "vendor-docs", "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html", "aws_access_key_id, aws_secret_access_key and aws_session_token as name=value lines, with the documented example values"),
    s("rfc7519", "RFC 7519, JSON Web Token (JWT), May 2015", "standard", "https://www.rfc-editor.org/rfc/rfc7519.txt", "JWTs are JWS or JWE compact serialisations (1); the example JWT (3.1), the unsecured JWT (6.1), the encrypted JWT (A.1)"),
    s("rfc7515", "RFC 7515, JSON Web Signature (JWS), May 2015", "standard", "https://www.rfc-editor.org/rfc/rfc7515.txt", "base64url without padding (2); alg is required (4.1.1); compact serialisation, three parts (7.1)"),
    s("rfc7516", "RFC 7516, JSON Web Encryption (JWE), May 2015", "standard", "https://www.rfc-editor.org/rfc/rfc7516.txt", "alg is required (4.1.1); compact serialisation, five parts (7.1)"),
    s("rfc3986", "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005", "standard", "https://www.rfc-editor.org/rfc/rfc3986.txt", "scheme (3.1); userinfo, and \"Use of the format user:password in the userinfo field is deprecated\" (3.2.1)"),
    s("rfc5737", "RFC 5737, IPv4 Address Blocks Reserved for Documentation, January 2010", "standard", "https://www.rfc-editor.org/rfc/rfc5737.txt", "192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24, used in the Example and the vectors"),
    // Accessibility, SVG, the page.
    s("wcag22", "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation 12 December 2024", "standard", "https://www.w3.org/TR/WCAG22/", "1.1.1 Non-text Content (a text alternative); 1.4.3 Contrast (Minimum), 4.5:1 for text and images of text; 1.4.5 Images of Text; 1.4.11 Non-text Contrast, 3:1; the definitions of relative luminance (threshold 0.04045) and contrast ratio"),
    s("wcag22-understanding-145", "W3C WAI, Understanding Success Criterion 1.4.5: Images of Text", "reference", "https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html", "the intent: use text rather than images of text where the technology can present it"),
    s("wcag22-understanding-143", "W3C WAI, Understanding Success Criterion 1.4.3: Contrast (Minimum)", "reference", "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html", "why 4.5:1, and that images of text are held to it"),
    s("svg2-text", "Scalable Vector Graphics (SVG) 2, chapter 11: Text", "standard", "https://www.w3.org/TR/SVG2/text.html", "addressable characters for positioning are Unicode code points, and x lists one position per character; textLength calibrates and is not applied with forced line breaks; white-space, and xml:space kept for compatibility"),
    s("w3c-xml10", "Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008", "standard", "https://www.w3.org/TR/xml/", "production [2] Char: the characters an XML document (an SVG) may hold"),
    s("clipboard-apis", "Clipboard API and events, W3C Working Draft", "standard", "https://www.w3.org/TR/clipboard-apis/", "image/png is a mandatory data type for reading and writing (6.4); the PNG is copied with ClipboardItem where the browser offers it"),
    s("csp3", "Content Security Policy Level 3, W3C Working Draft 16 September 2026", "standard", "https://www.w3.org/TR/CSP3/", "img-src governs requests whose destination is image (6.1.6); the navigation directives are form-action and frame-ancestors, so a download link is not an image load"),
    s("ofl-11", "SIL Open Font License 1.1, official text", "licence", "https://openfontlicense.org/open-font-license-official-text/", "JetBrains Mono (copyright 2020 The JetBrains Mono Project Authors, as the LICENSE file of the installed @fontsource/jetbrains-mono 5.2.8 says) is under the OFL 1.1; the font is named in the SVG, not embedded"),
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
}); // manifest

/**
 * runTool: the registry-shaped entry point with the default options (the tool is not exposed over the API).
 * @param input the code
 * @returns the result
 */
export function runTool(input: string): CodeImageResult {
  return run(input); // the same engine
} // runTool

/**
 * render: the page's entry point, with the reader's options.
 * @param input the code
 * @param options the choices
 * @returns the result
 */
export function render(input: string, options: Partial<CodeImageOptions>): CodeImageResult {
  return renderCode(input, options); // the same engine
} // render
