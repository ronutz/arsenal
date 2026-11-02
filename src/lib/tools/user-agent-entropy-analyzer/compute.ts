// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/user-agent-entropy-analyzer/compute.ts
// ----------------------------------------------------------------------------
// Decode a User-Agent STRING the user pastes, break out the identifying tokens
// it exposes, and explain the passive-fingerprinting surface it presents. It
// also notes the Client Hints migration - why modern browsers freeze the UA and
// move detail to Sec-CH-UA headers a site must request.
//
// DECODE/EXPLAIN ONLY. The input is a string the user already holds; nothing is
// read from the visitor's own browser and nothing is sent. The "entropy" figure
// is an illustrative, documented estimate of distinguishing bits per component,
// not a live measurement of any population.
// ============================================================================

// PAGE LANGUAGE (02/11/2026): component labels and notes, the words the
// analysis writes as values ("Unknown", "10 or 11", the device class, "(none)"),
// the two notes and the input errors are EngineTexts (../engine-text.ts): a
// stable id, the English as before. analyzeUaLocalisable() returns them for the
// page (pack keys tools.user-agent-entropy-analyzer.engine.<id>); analyzeUa()
// returns plainText() of the same reading, so the API and the golden vectors are
// unchanged. Browser, OS and engine names read from the string stay plain text.
import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export class UaInputError extends Error {}

/**
 * A UaInputError whose message is the sentence's English, carrying the sentence.
 * @param m the sentence
 * @returns the error to throw
 */
function inputError(m: EngineText): UaInputError {
  return withEngineText(new UaInputError(m.text), m); // the class the component tests for, with its sentence
} // inputError

/** A detection result word ("Unknown", "10 or 11", a device class) as a sentence, or a name read from the string as it is. */
function word(v: string): EngineText | string {
  if (v === "Unknown") return say("value.unknown", "Unknown"); // nothing recognised
  if (v === "10 or 11") return say("value.win10or11", "10 or 11"); // Windows NT 10.0
  if (["desktop", "phone", "tablet", "unknown"].includes(v)) return say(`device.${v}`, v); // a device class
  return v; // a name or version read from the string
} // word

/** One identifying component. S: string (analyzeUa) or EngineText (the page's reading). */
export interface UaComponent<S = string> {
  label: S; // the component's name
  value: S | string; // what the string says (a word the engine writes is S)
  /** Illustrative distinguishing bits this component tends to contribute. */
  bitsApprox: number;
  note: S; // what it reveals
}

/** The analysis. S as above. */
export interface UaAnalysis<S = string> {
  raw: string;
  browser: S | string; // the browser's name, or "Unknown" (S)
  browserVersion: string;
  engine: S | string; // the engine's name, or "Unknown" (S)
  os: S | string; // the OS family, or "Unknown" (S)
  osVersion: S | string; // the version read, or "10 or 11" (S)
  deviceHint: S | string; // the device class (S)
  isReducedUA: boolean;     // the frozen / reduced form modern Chrome/Safari send
  components: UaComponent<S>[]; // the components
  totalBitsApprox: number;
  clientHintsNote: S; // the Client Hints note
  freezeNote: S; // the frozen-UA note
}

interface Rule { re: RegExp; name: string; ver?: number }

// Engine detection (order matters: Edge/Chrome share tokens).
const ENGINES: Rule[] = [
  { re: /Gecko\/\d+ Firefox\/([\d.]+)/, name: "Gecko (Firefox)" },
  { re: /AppleWebKit\/([\d.]+).*Version\/[\d.]+.*Safari/, name: "WebKit (Safari)" },
  { re: /Chrome\/[\d.]+.*Safari/, name: "Blink (Chromium)" },
  { re: /AppleWebKit\/([\d.]+)/, name: "WebKit" },
];

function detectBrowser(ua: string): { name: string; ver: string } {
  // Ordered so wrappers (Edg, OPR, Brave-as-Chrome) resolve before base Chrome.
  const m: [RegExp, string][] = [
    [/Edg(?:iOS|A)?\/([\d.]+)/, "Microsoft Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  for (const [re, name] of m) {
    const hit = ua.match(re);
    if (hit) return { name, ver: hit[1] ?? "" };
  }
  return { name: "Unknown", ver: "" };
}

function detectOs(ua: string): { os: string; ver: string; device: string } {
  if (/Windows NT 10\.0/.test(ua)) return { os: "Windows", ver: "10 or 11", device: "desktop" };
  if (/Windows NT ([\d.]+)/.test(ua)) return { os: "Windows", ver: RegExp.$1, device: "desktop" };
  if (/iPhone/.test(ua)) return { os: "iOS", ver: (ua.match(/OS ([\d_]+)/)?.[1] ?? "").replace(/_/g, "."), device: "phone" };
  if (/iPad/.test(ua)) return { os: "iPadOS", ver: (ua.match(/OS ([\d_]+)/)?.[1] ?? "").replace(/_/g, "."), device: "tablet" };
  if (/Android ([\d.]+)/.test(ua)) return { os: "Android", ver: RegExp.$1, device: /Mobile/.test(ua) ? "phone" : "tablet" };
  if (/Mac OS X ([\d_]+)/.test(ua)) return { os: "macOS", ver: RegExp.$1.replace(/_/g, "."), device: "desktop" };
  if (/Linux/.test(ua)) return { os: "Linux", ver: "", device: "desktop" };
  if (/CrOS/.test(ua)) return { os: "ChromeOS", ver: "", device: "desktop" };
  return { os: "Unknown", ver: "", device: "unknown" };
}

function detectEngine(ua: string): string {
  for (const e of ENGINES) if (e.re.test(ua)) return e.name;
  return "Unknown";
}

// The reduced/frozen UA forms: Chrome froze minor version to 0.0.0 and caps the
// OS/platform detail; Safari long ago fixed much of its string.
function isReduced(ua: string): boolean {
  if (/Chrome\/\d+\.0\.0\.0/.test(ua)) return true;                 // Chrome reduced UA
  if (/iPhone OS 1[0-9]_0 like Mac OS X/.test(ua)) return true;     // frozen iOS shape
  return false;
}

export function analyzeUa(raw: string): UaAnalysis {
  return plainText(analyzeUaLocalisable(raw)); // the page's reading with every sentence as its English
}

/**
 * The same analysis with every sentence as an EngineText, for the page (02/11/2026).
 * @param raw the User-Agent as pasted
 * @returns the analysis, sentences with ids
 */
export function analyzeUaLocalisable(raw: string): UaAnalysis<EngineText> {
  const ua = raw.trim();
  if (!ua) throw inputError(say("err.empty", "Paste a User-Agent string, e.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")); // nothing pasted
  if (!/Mozilla\/|Opera\/|[A-Za-z]+\/[\d.]/.test(ua)) throw inputError(say("err.notUa", "That does not look like a User-Agent string. A UA usually starts with \"Mozilla/5.0\" and carries product/version tokens.")); // not a UA

  const b = detectBrowser(ua);
  const o = detectOs(ua);
  const engine = detectEngine(ua);
  const reduced = isReduced(ua);

  const components: UaComponent<EngineText>[] = []; // labels and notes with ids
  components.push({ label: say("label.browser", "Browser"), value: b.ver ? `${b.name} ${b.ver}` : word(b.name), bitsApprox: 2, note: say("note.browser", "the product family; a handful of browsers dominate, so this alone is low-entropy") }); // the browser (a name with a version stays as read)
  components.push({ label: say("label.browserVersion", "Browser version"), value: b.ver || say("value.none", "(none)"), bitsApprox: reduced ? 1 : 4, note: reduced ? say("note.versionReduced", "reduced to a frozen value, so it carries little entropy by design") : say("note.versionFull", "the full version can be distinguishing, especially just after a release") }); // the version
  components.push({ label: say("label.engine", "Engine"), value: word(engine), bitsApprox: 1, note: say("note.engine", "the rendering engine is largely implied by the browser") }); // the engine
  const osValue: EngineText | string = !o.ver ? word(o.os) : o.ver === "10 or 11" ? say("value.osWin10or11", `${o.os} ${o.ver}`, { os: o.os }) : `${o.os} ${o.ver}`; // the OS with its version (Windows' "10 or 11" is the engine's words)
  components.push({ label: say("label.os", "Operating system"), value: osValue, bitsApprox: 2, note: say("note.os", "OS family plus version narrows the field") }); // the OS
  components.push({ label: say("label.device", "Device class"), value: word(o.device), bitsApprox: 1, note: say("note.device", "desktop vs phone vs tablet, inferred from tokens") }); // the device class
  if (/Win64|x64|x86_64|arm64|aarch64/i.test(ua)) {
    const arch = ua.match(/Win64|x64|x86_64|arm64|aarch64/i)?.[0] ?? "";
    components.push({ label: say("label.arch", "CPU architecture"), value: arch, bitsApprox: 1, note: say("note.arch", "coarse architecture hint; being folded into Client Hints") }); // the architecture
  }

  const total = components.reduce((s, c) => s + c.bitsApprox, 0);

  return {
    raw: ua,
    browser: word(b.name), // the name, or "Unknown" with its id
    browserVersion: b.ver,
    engine: word(engine), // the engine, or "Unknown" with its id
    os: word(o.os), // the OS family, or "Unknown" with its id
    osVersion: word(o.ver), // the version, or "10 or 11" with its id
    deviceHint: word(o.device), // the device class with its id
    isReducedUA: reduced,
    components,
    totalBitsApprox: total,
    clientHintsNote: say("note.clientHints", // the Client Hints migration
      "Modern browsers are moving identifying detail out of the User-Agent and into User-Agent Client Hints: Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Mobile and friends. A site must actively request the high-entropy hints (full version, model, platform version) via Accept-CH, which makes the collection visible in headers instead of implicit in one string."),
    freezeNote: reduced // frozen or full, one id each
      ? say("note.frozen", "This string is in the reduced/frozen form: the minor version reads 0.0.0 and platform detail is capped, so the UA itself leaks less. The detail did not vanish - it moved to Client Hints a site has to ask for.")
      : say("note.full", "This string carries full version and platform detail. On the current web that detail is increasingly available only through the reduced UA plus Client Hints; a fully detailed classic UA is itself a mild signal."),
  };
}

export function run(input: string): UaAnalysis {
  return analyzeUa(input);
}
