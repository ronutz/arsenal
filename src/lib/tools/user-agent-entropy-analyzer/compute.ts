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

export class UaInputError extends Error {}

export interface UaComponent {
  label: string;
  value: string;
  /** Illustrative distinguishing bits this component tends to contribute. */
  bitsApprox: number;
  note: string;
}

export interface UaAnalysis {
  raw: string;
  browser: string;
  browserVersion: string;
  engine: string;
  os: string;
  osVersion: string;
  deviceHint: string;
  isReducedUA: boolean;     // the frozen / reduced form modern Chrome/Safari send
  components: UaComponent[];
  totalBitsApprox: number;
  clientHintsNote: string;
  freezeNote: string;
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
  const ua = raw.trim();
  if (!ua) throw new UaInputError("Paste a User-Agent string, e.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  if (!/Mozilla\/|Opera\/|[A-Za-z]+\/[\d.]/.test(ua)) throw new UaInputError("That does not look like a User-Agent string. A UA usually starts with \"Mozilla/5.0\" and carries product/version tokens.");

  const b = detectBrowser(ua);
  const o = detectOs(ua);
  const engine = detectEngine(ua);
  const reduced = isReduced(ua);

  const components: UaComponent[] = [];
  components.push({ label: "Browser", value: b.name + (b.ver ? ` ${b.ver}` : ""), bitsApprox: 2, note: "the product family; a handful of browsers dominate, so this alone is low-entropy" });
  components.push({ label: "Browser version", value: b.ver || "(none)", bitsApprox: reduced ? 1 : 4, note: reduced ? "reduced to a frozen value, so it carries little entropy by design" : "the full version can be distinguishing, especially just after a release" });
  components.push({ label: "Engine", value: engine, bitsApprox: 1, note: "the rendering engine is largely implied by the browser" });
  components.push({ label: "Operating system", value: o.os + (o.ver ? ` ${o.ver}` : ""), bitsApprox: 2, note: "OS family plus version narrows the field" });
  components.push({ label: "Device class", value: o.device, bitsApprox: 1, note: "desktop vs phone vs tablet, inferred from tokens" });
  if (/Win64|x64|x86_64|arm64|aarch64/i.test(ua)) {
    const arch = ua.match(/Win64|x64|x86_64|arm64|aarch64/i)?.[0] ?? "";
    components.push({ label: "CPU architecture", value: arch, bitsApprox: 1, note: "coarse architecture hint; being folded into Client Hints" });
  }

  const total = components.reduce((s, c) => s + c.bitsApprox, 0);

  return {
    raw: ua,
    browser: b.name,
    browserVersion: b.ver,
    engine,
    os: o.os,
    osVersion: o.ver,
    deviceHint: o.device,
    isReducedUA: reduced,
    components,
    totalBitsApprox: total,
    clientHintsNote:
      "Modern browsers are moving identifying detail out of the User-Agent and into User-Agent Client Hints: Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Mobile and friends. A site must actively request the high-entropy hints (full version, model, platform version) via Accept-CH, which makes the collection visible in headers instead of implicit in one string.",
    freezeNote: reduced
      ? "This string is in the reduced/frozen form: the minor version reads 0.0.0 and platform detail is capped, so the UA itself leaks less. The detail did not vanish - it moved to Client Hints a site has to ask for."
      : "This string carries full version and platform detail. On the current web that detail is increasingly available only through the reduced UA plus Client Hints; a fully detailed classic UA is itself a mild signal.",
  };
}

export function run(input: string): UaAnalysis {
  return analyzeUa(input);
}
