// ============================================================================
// src/components/DevOtherFingerprintTool.tsx
// ----------------------------------------------------------------------------
// SELF-FINGERPRINT INSPECTOR — a green-room resident. What THIS page could
// compute about you, shown only to you, computed only in your browser.
//
// WHY GREEN: the input is the ENVIRONMENT (your browser + device), so the
// output legitimately differs for every visitor — there is no "correct"
// output for golden vectors to assert. That is the opposite of a catalogue
// tool (fixed input -> fixed output). This is the privacy thesis made
// visceral: it shows the surface a tracker would read, and nothing is sent.
//
// Everything runs client-side; there is deliberately no fetch here. The
// individual signal computations are small and self-contained.
// ============================================================================
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

interface Signal {
  key: string;
  value: string;
}

// A tiny FNV-1a hash for turning canvas/webgl blobs into a short stable id
// (display only — never sent anywhere).
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function canvasHash(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 220;
    c.height = 40;
    const ctx = c.getContext("2d");
    if (!ctx) return "unavailable";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 100, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("ronutz.com \u{1F512} 0123", 2, 2);
    ctx.strokeStyle = "rgba(0,120,200,0.5)";
    ctx.beginPath();
    ctx.arc(50, 20, 15, 0, Math.PI * 2);
    ctx.stroke();
    return fnv1a(c.toDataURL());
  } catch {
    return "blocked";
  }
}

function webglInfo(): { hash: string; vendor: string; renderer: string } {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { hash: "unavailable", vendor: "-", renderer: "-" };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : "hidden";
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "hidden";
    const parts = [
      gl.getParameter(gl.VERSION),
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getSupportedExtensions()?.join(","),
    ].join("|");
    return { hash: fnv1a(parts), vendor, renderer };
  } catch {
    return { hash: "blocked", vendor: "-", renderer: "-" };
  }
}

function fontCensus(): number {
  // Count how many of a probe list render at a distinguishable width — a
  // rough font-fingerprint dimension, kept deliberately coarse.
  const probes = [
    "Arial", "Courier New", "Georgia", "Times New Roman", "Verdana", "Comic Sans MS",
    "Impact", "Tahoma", "Trebuchet MS", "Helvetica Neue", "Menlo", "Consolas",
    "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "DejaVu Sans", "Liberation Sans",
  ];
  const baseline = "monospace";
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.fontSize = "72px";
  span.textContent = "mmmmmmmmmmlli";
  document.body.appendChild(span);
  span.style.fontFamily = baseline;
  const baseW = span.offsetWidth;
  let detected = 0;
  for (const f of probes) {
    span.style.fontFamily = `'${f}',${baseline}`;
    if (span.offsetWidth !== baseW) detected++;
  }
  document.body.removeChild(span);
  return detected;
}

export default function DevOtherFingerprintTool() {
  const t = useTranslations("devOther.fingerprint");
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [entropy, setEntropy] = useState(0);

  const run = useCallback(() => {
    const nav = navigator;
    const scr = window.screen;
    const gl = webglInfo();
    const out: Signal[] = [];

    out.push({ key: "userAgent", value: nav.userAgent });
    out.push({ key: "platform", value: (nav as Navigator & { platform?: string }).platform ?? "-" });
    out.push({ key: "languages", value: (nav.languages ?? [nav.language]).join(", ") });
    out.push({ key: "timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "-" });
    out.push({ key: "screen", value: `${scr.width}\u00d7${scr.height} @${window.devicePixelRatio}x, ${scr.colorDepth}-bit` });
    out.push({ key: "cores", value: String(nav.hardwareConcurrency ?? "-") });
    out.push({ key: "memory", value: (nav as Navigator & { deviceMemory?: number }).deviceMemory ? `~${(nav as Navigator & { deviceMemory?: number }).deviceMemory} GB` : "hidden" });
    out.push({ key: "touch", value: String(nav.maxTouchPoints ?? 0) });
    out.push({ key: "canvas", value: canvasHash() });
    out.push({ key: "webglHash", value: gl.hash });
    out.push({ key: "gpu", value: gl.renderer !== "-" ? `${gl.vendor} / ${gl.renderer}` : "hidden" });
    out.push({ key: "fonts", value: t("fontsValue", { n: fontCensus() }) });
    out.push({ key: "dnt", value: nav.doNotTrack === "1" ? t("on") : t("off") });
    out.push({ key: "cookies", value: nav.cookieEnabled ? t("on") : t("off") });

    // A crude distinctiveness score: how many signals are individually
    // high-entropy (hashes, GPU string, UA). Not a real bits-of-entropy figure;
    // labelled as a rough indicator in the copy.
    const highEntropy = out.filter((s) =>
      ["canvas", "webglHash", "gpu", "userAgent", "fonts", "screen"].includes(s.key) &&
      !["hidden", "blocked", "unavailable"].includes(s.value),
    ).length;
    setEntropy(highEntropy);
    setSignals(out);
  }, [t]);

  return (
    <div className="cidr-tool jwt-tool">
      {!signals && (
        <div className="drill-config">
          <p className="devfun-intro" style={{ margin: 0 }}>{t("intro")}</p>
          <button type="button" className="b64-copy drill-start" onClick={run}>
            {t("run")}
          </button>
          <p className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">🔒</span> {t("runsLocally")}
          </p>
        </div>
      )}

      {signals && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("resultTitle")}</h4>
            <p className="cipher-note">{t("entropyNote", { n: entropy })}</p>
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
              {signals.map((s) => (
                <div className="jwt-claim-row" key={s.key}>
                  <dt className="jwt-claim-label">{t(`sig.${s.key}`)}</dt>
                  <dd className="jwt-claim-value mono" style={{ wordBreak: "break-all" }}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="cipher-note">{t("footer")}</p>
        </div>
      )}
    </div>
  );
}
