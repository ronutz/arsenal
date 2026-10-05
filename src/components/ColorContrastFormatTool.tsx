"use client";

// ============================================================================
// src/components/ColorContrastFormatTool.tsx
// ----------------------------------------------------------------------------
// COLOR CONTRAST & FORMAT (page UI). Two colours in any CSS Color Level 4
// notation; out come the WCAG contrast ratio with pass or fail against every
// level, a live preview of the pair, each colour in every notation with its
// luminance and names, the foreground that would pass each failing level, and
// the formula with the numbers filled in.
//
// All answers come from src/lib/tools/color-contrast-format (pure arithmetic);
// this component only lays them out and words them. The colours are shown
// through inline styles because they are the reader's own values.
// ============================================================================

import { Fragment, useMemo, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, ColorParseError, type ColorContrastResult, type ParsedColor } from "@/lib/tools/color-contrast-format";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "gray-on-white";

// The vectors offered as presets (the refusal vector stays a vector only).
const PRESET_IDS = ["gray-on-white", "light-gray-fails", "translucent-black", "oklch-on-dark", "named-pair", "hsl-legacy", "p3-out-of-gamut", "lab-example", "hex-short", "hwb-pair", "black-on-white"];

/** The page component. */
export default function ColorContrastFormatTool() {
  // This tool's words.
  const t = useTranslations("tools.color-contrast-format");
  // The example pair.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The foreground.
  const [fg, setFg] = useState(ex.foreground);
  // The background.
  const [bg, setBg] = useState(ex.background);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading, recomputed as the colours change.
  const out = useMemo((): { r?: ColorContrastResult; error?: { which: string; code: string; message: string } } => {
    // Nothing to read.
    if (fg.trim() === "" && bg.trim() === "") return {};
    // The engine refuses what it cannot read, saying which side.
    try { return { r: run({ foreground: fg, background: bg }) }; } catch (e) {
      // A parse refusal.
      if (e instanceof ColorParseError) return { error: { which: e.which, code: e.code, message: e.message } };
      // Anything else.
      return { error: { which: "foreground", code: "unrecognised", message: (e as Error).message } };
    }
  }, [fg, bg]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its pair.
    setFg(v.input.foreground);
    // Background.
    setBg(v.input.background);
    // Mark it.
    setActive(id);
  };
  // Swap the two colours.
  const swap = () => { setFg(bg); setBg(fg); setActive(undefined); };
  // The result.
  const r = out.r;
  // A level pill.
  const pill = (ok: boolean, label: string) => <span className={`tcl-pill ${ok ? "tcl-pill-true" : "tcl-pill-bad"}`}>{label}: {ok ? t("pass") : t("fail")}</span>;
  // One colour's card.
  const card = (c: ParsedColor, title: string) => (
    <div className="tcl-card">
      <h5 className="tcl-card-title">{title}</h5>
      <div className="tcl-step-head">
        <span className="ccf-swatch" style={{ "--ccf-color": c.formats.hex } as CSSProperties} aria-hidden="true" />
        <code>{c.formats.hex}</code>
        <span className="tcl-muted tcl-small">{t(`syntax.${c.syntax}`)}{c.space ? ` (${c.space})` : ""}</span>
        {c.names.length > 0 && <span className="tcl-pill tcl-pill-value">{c.names.join(", ")}</span>}
        {!c.inGamut && <span className="tcl-pill tcl-pill-warn">{t("outOfGamut")}</span>}
      </div>
      <dl className="tcl-pairs">
        {(["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "srgbLinear", "xyzD65"] as const).map((k) => (
          <Fragment key={k}>
            <dt className="tcl-pairs-name">{t(`format.${k}`)}</dt>
            <dd className="tcl-pairs-value"><code>{c.formats[k]}</code></dd>
          </Fragment>
        ))}
        <dt className="tcl-pairs-name">{t("luminance")}</dt>
        <dd className="tcl-pairs-value"><code>{c.luminance.toFixed(4)}</code></dd>
        {c.alpha < 1 && (
          <>
            <dt className="tcl-pairs-name">{t("alpha")}</dt>
            <dd className="tcl-pairs-value"><code>{c.alpha}</code></dd>
          </>
        )}
      </dl>
      {c.notes.length > 0 && (
        <ul className="tcl-changes">
          {c.notes.map((n, i) => <li key={i}>{t(`note.${n.id}`, Object.fromEntries(Object.entries(n.params ?? {}).map(([k, v]) => [k, String(v)])))}</li>)}
        </ul>
      )}
    </div>
  );
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The two colours, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{t("pairLabel")}</span>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={swap}>{t("swap")}</button>
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setFg(""); setBg(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <div className="tcl-two">
          <div className="tcl-inline-field">
            <label className="cidr-label" htmlFor="ccf-fg">{t("foreground")}</label>
            <input id="ccf-fg" className="cidr-input mono" value={fg} onChange={(e) => { setFg(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" />
          </div>
          <div className="tcl-inline-field">
            <label className="cidr-label" htmlFor="ccf-bg">{t("background")}</label>
            <input id="ccf-bg" className="cidr-input mono" value={bg} onChange={(e) => { setBg(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" />
          </div>
        </div>
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* A refusal. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{t(`error.${out.error.code}`, { which: out.error.which })}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The ratio and the levels. */}
          <div className={r.levels.aaaNormal ? "tcl-verdict tcl-verdict-ok" : r.levels.aaNormal ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-bad"}>
            <p><span className="tcl-verdict-label tcl-big">{r.ratioText}</span> {t("ratioSentence", { lighter: r.luminances.lighter.toFixed(4), darker: r.luminances.darker.toFixed(4) })}</p>
            <p className="tcl-step-out">
              {pill(r.levels.aaNormal, t("level.aaNormal"))}{" "}
              {pill(r.levels.aaLarge, t("level.aaLarge"))}{" "}
              {pill(r.levels.aaaNormal, t("level.aaaNormal"))}{" "}
              {pill(r.levels.aaaLarge, t("level.aaaLarge"))}{" "}
              {pill(r.levels.nonText, t("level.nonText"))}
            </p>
            {r.composited && <p className="hmac-build-note">{t("compositedNote", { hex: r.composited.hex, alpha: r.foreground.alpha })}</p>}
          </div>

          {/* The preview. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("previewTitle")}</h4>
            <div className="ccf-preview" style={{ "--ccf-fg": r.foreground.formats.hex, "--ccf-bg": r.background.formats.hex } as CSSProperties}>
              <p className="ccf-preview-normal">{t("previewNormal")}</p>
              <p className="ccf-preview-large">{t("previewLarge")}</p>
              <p className="ccf-preview-ui"><span className="ccf-preview-box" aria-hidden="true" /> {t("previewUi")}</p>
            </div>
          </section>

          {/* The two colours, every notation. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("formatsTitle")}</h4>
            <div className="tcl-two">
              {card(r.foreground, t("foreground"))}
              {card(r.background, t("background"))}
            </div>
          </section>

          {/* Fixes. */}
          {r.fixes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("fixesTitle")}</h4>
              <p className="tcl-finding-msg">{t("fixesIntro")}</p>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("colTarget")}</th><th scope="col">{t("colDirection")}</th><th scope="col">{t("colColor")}</th><th scope="col">{t("colRatio")}</th></tr></thead>
                  <tbody>
                    {r.fixes.map((f, i) => (
                      <tr key={i}>
                        <th scope="row">{f.target}:1</th>
                        <td>{t(`direction.${f.direction}`)}</td>
                        <td><span className="ccf-swatch" style={{ "--ccf-color": f.hex } as CSSProperties} aria-hidden="true" /> <code>{f.hex}</code> <span className="tcl-muted tcl-small"><code>{f.oklch}</code></span></td>
                        <td>{f.ratio.toFixed(2)}:1</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* The formula with the numbers. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("formulaTitle")}</h4>
            <p className="tcl-finding-msg">{t("formulaLuminance")}</p>
            <p className="tcl-finding-msg">{t("formulaRatio", { lighter: r.luminances.lighter.toFixed(4), darker: r.luminances.darker.toFixed(4), ratio: r.ratioText })}</p>
            <p className="tcl-finding-msg">{t("thresholds")}</p>
          </section>

          {/* What the tool cannot judge. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
