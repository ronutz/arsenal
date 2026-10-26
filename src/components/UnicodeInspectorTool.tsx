"use client";

// ============================================================================
// src/components/UnicodeInspectorTool.tsx
// ----------------------------------------------------------------------------
// THE UNICODE INSPECTOR (page UI). Four modes:
//
//   Inspect a text   counts, a verdict, what was found (by kind), the
//                    bidirectional controls left open at the end of a line
//                    (Trojan Source), words that mix scripts, the text drawn
//                    in the order it is stored with every hidden character as
//                    a tag, every code point in a table, a cleaned copy and
//                    the text written as escapes in eight languages.
//   One code point   name and aliases, properties, encodings, escapes and
//                    what to know about it.
//   Find by name     code points whose name or alias has words starting with
//                    the words typed.
//   Normalise        (2026-10-26) the text in NFC, NFD, NFKC and NFKD with the
//                    code points and UTF-8 bytes of each, and, with a second
//                    text, whether the two are equal as typed and under each
//                    form. The browser's own String.prototype.normalize does
//                    the work; the page says so.
//
// The Unicode name table (about a megabyte) is loaded with a dynamic import
// only when a mode needs it. Facts come from src/lib/tools/unicode-inspector;
// this component lays them out and words them through the i18n messages.
// ============================================================================

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { info, inspectText, readCodePoint, normaliseText, ESCAPE_STYLES, FINDING_FLAGS, DEFAULT_CLEAN, type CleanOptions, type CodePointInfo, type EscapeStyle, type Flag, type TextRow, type UnicodeData } from "@/lib/tools/unicode-inspector/compute";
import { hiddenName } from "@/lib/unicode/hidden";
import { TclPresets, TclSeg, glyph } from "@/components/TclTeachParts";
import { usePrefill } from "@/lib/use-prefill";
// The link to the ASCII table hands the code over in the fragment (RT01, 2026-10-20).
import { handoffHref } from "@/lib/handoff";

// D-83: presets and the Example buttons load golden-vector inputs verbatim
// (src/lib/tools/unicode-inspector/golden-vectors.ts; the page does not import
// that file, because it pulls in the full name table).
const TEXT_PRESETS: { id: string; text: string; options?: Partial<CleanOptions> }[] = [
  // inspect-trojan-source (the Example in this mode).
  { id: "inspect-trojan-source", text: 'if access_level != "user‮ ⁦// Check if admin⁩ ⁦" {' },
  // inspect-mixed-script.
  { id: "inspect-mixed-script", text: "pay to pаypal" },
  // inspect-invisible.
  { id: "inspect-invisible", text: "Hi there​!" },
  // inspect-smart-punctuation.
  { id: "inspect-smart-punctuation", text: "“smart” – quotes" },
  // inspect-fullwidth-folded (with folding on).
  { id: "inspect-fullwidth-folded", text: "ｆｕｌｌｗｉｄｔｈ", options: { foldLookalikes: true } },
  // inspect-line-separator.
  { id: "inspect-line-separator", text: "if (x) return;" },
  // inspect-escapes.
  { id: "inspect-escapes", text: "café ☕ \u{1F600}" },
  // inspect-japanese.
  { id: "inspect-japanese", text: "日本語のテキスト" },
  // inspect-combining.
  { id: "inspect-combining", text: "café" },
];
// The code point presets.
const CP_PRESETS: { id: string; value: string }[] = [
  // codepoint-rlo (the Example in this mode).
  { id: "codepoint-rlo", value: "U+202E" },
  // codepoint-e-acute.
  { id: "codepoint-e-acute", value: "U+00E9" },
  // codepoint-emoji.
  { id: "codepoint-emoji", value: "\u{1F600}" },
  // codepoint-bom-by-alias.
  { id: "codepoint-bom-by-alias", value: "BOM" },
  // codepoint-cyrillic-a.
  { id: "codepoint-cyrillic-a", value: "U+0430" },
  // codepoint-surrogate.
  { id: "codepoint-surrogate", value: "U+D800" },
  // codepoint-small-seal.
  { id: "codepoint-small-seal", value: "U+3D000" },
  // codepoint-noncharacter.
  { id: "codepoint-noncharacter", value: "U+FFFE" },
  // codepoint-reserved.
  { id: "codepoint-reserved", value: "U+0378" },
  // codepoint-nel.
  { id: "codepoint-nel", value: "U+0085" },
];
// The search preset.
const SEARCH_PRESETS: { id: string; query: string }[] = [
  // search-zero-width (the Example in this mode).
  { id: "search-zero-width", query: "zero width" },
];
// The normalisation presets (2026-10-26), each a golden vector's input verbatim.
const NORM_PRESETS: { id: string; text: string; compare?: string }[] = [
  // normalise-e-decomposed (the Example in this mode): e and a combining acute accent.
  { id: "normalise-e-decomposed", text: "e\u0301" },
  // normalise-angstrom: U+212B, a singleton.
  { id: "normalise-angstrom", text: "\u212B" },
  // normalise-fi-ligature: U+FB01, split only by the K forms.
  { id: "normalise-fi-ligature", text: "\uFB01" },
  // normalise-canonical-order: two combining marks put in canonical order.
  { id: "normalise-canonical-order", text: "A\u030A\u0323" },
  // normalise-ohm: U+2126, the singleton exclusion.
  { id: "normalise-ohm", text: "\u2126" },
  // normalise-compare-canonical: precomposed against decomposed.
  { id: "normalise-compare-canonical", text: "caf\u00E9", compare: "cafe\u0301" },
  // normalise-compare-compatibility: a ligature against plain letters.
  { id: "normalise-compare-compatibility", text: "\uFB01le", compare: "file" },
  // normalise-ascii: nothing to change.
  { id: "normalise-ascii", text: "plain text" },
];

// Categories whose characters are drawn as their label, not as themselves.
const NOT_DRAWN = new Set(["Cc", "Cf", "Cs", "Co", "Cn", "Zl", "Zp"]);

/** What to draw for one code point: the character, a dotted circle before a combining mark, or nothing. */
function drawable(cp: number, gc: string): string | null {
  // Controls, format, surrogates, private use, unassigned and separators are not drawn.
  if (NOT_DRAWN.has(gc)) return null;
  // A combining mark sits on a dotted circle, as in the Unicode code charts.
  if (gc[0] === "M") return "◌" + String.fromCodePoint(cp);
  // Spaces are drawn as an open box.
  if (gc === "Zs") return "␣";
  // Everything else is itself.
  return String.fromCodePoint(cp);
}

/** The page component. */
export default function UnicodeInspectorTool() {
  // This tool's words.
  const t = useTranslations("tools.unicode-inspector");
  // The locale, for the link to the ASCII table.
  const locale = useLocale();
  // Code inside a sentence.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // The mode.
  const [mode, setMode] = useState<"inspect" | "codepoint" | "search" | "normalise">("inspect");
  // The text, starting from the Example.
  const [text, setText] = useState(TEXT_PRESETS[0].text);
  // The cleaning options.
  const [opts, setOpts] = useState<CleanOptions>(DEFAULT_CLEAN);
  // The escape language.
  const [style, setStyle] = useState<EscapeStyle>("json");
  // The code point box.
  const [cpValue, setCpValue] = useState(CP_PRESETS[0].value);
  // The search box.
  const [query, setQuery] = useState(SEARCH_PRESETS[0].query);
  // The text to normalise, starting from this mode's Example.
  const [normText, setNormText] = useState(NORM_PRESETS[0].text);
  // The optional text to compare it with.
  const [normCompare, setNormCompare] = useState("");
  // The preset loaded, if any.
  const [active, setActive] = useState<string | undefined>(TEXT_PRESETS[0].id);
  // The full name data, once loaded.
  const [data, setData] = useState<UnicodeData | undefined>(undefined);
  // Loading it.
  const [loading, setLoading] = useState(false);
  // Which copy button just copied.
  const [copied, setCopied] = useState<string | undefined>(undefined);
  // The copy timer.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A link such as /en/tools/unicode-inspector/#input=U%2B202E opens the code point (a legacy ?input= link still
  // does, and is rewritten to the fragment; RT01, 2026-10-20). cpValue lets a Clear or an edit drop it from the address.
  // The field's value goes to usePrefill too, so a Clear, an Example or an edit drops the handed-over value from the
  // address (#input=), and a share or reload no longer carries it (RT01, 2026-10-20).
  usePrefill((v) => { setMode("codepoint"); setCpValue(v); setActive(undefined); }, cpValue);

  // Whether the name table is needed: the code point and search modes, or a text with
  // characters outside ASCII that the small hidden-character table does not name (the normalisation mode never needs it).
  const needNames = !data && (mode === "codepoint" || mode === "search" || (mode === "inspect" && Array.from(text).some((ch) => { const cp = ch.codePointAt(0)!; return cp > 0x7f && !hiddenName(cp); })));
  // Load it once, when needed.
  useEffect(() => {
    // Not needed, or already on its way.
    if (!needNames || loading) return;
    // Start.
    setLoading(true);
    // The dynamic import keeps the megabyte out of the page bundle.
    import("@/lib/unicode/names").then((m) => {
      // The five functions the engine takes.
      setData({ nameOf: m.unicodeName, aliasOf: (cp: number) => m.aliasesOf(cp)[0]?.alias, cpOf: m.codePointOfName, aliases: m.aliasesOf, search: m.searchNames });
    }).finally(() => setLoading(false));
  }, [needNames, loading]);

  // The text report.
  const report = useMemo(() => (mode === "inspect" && text ? inspectText(text, opts, data) : undefined), [mode, text, opts, data]);
  // The normalisation report (the comparison only when a second text was typed).
  const norm = useMemo(() => (mode === "normalise" && normText ? normaliseText(normText, normCompare === "" ? undefined : normCompare) : undefined), [mode, normText, normCompare]);
  // The code point read from the box.
  const read = useMemo(() => (mode === "codepoint" ? readCodePoint(cpValue, data) : undefined), [mode, cpValue, data]);
  // Its record.
  const cpInfo: CodePointInfo | undefined = useMemo(() => (read?.cp !== undefined ? info(read.cp, data) : undefined), [read, data]);
  // The search hits.
  const hits = useMemo(() => {
    // Only in search mode, with the names loaded.
    if (mode !== "search" || !data) return undefined;
    // The words.
    const words = query.slice(0, 120).split(/\s+/).filter(Boolean);
    // Nothing typed.
    if (!words.length) return [];
    // One past the limit, to know whether there are more.
    return data.search(words, 51);
  }, [mode, query, data]);

  // Copy a text and mark the button for a moment.
  const copy = (key: string, value: string) => {
    // The clipboard.
    navigator.clipboard?.writeText(value).then(() => {
      // Mark it.
      setCopied(key);
      // Clear the mark later.
      if (timer.current) clearTimeout(timer.current);
      // After a second and a half.
      timer.current = setTimeout(() => setCopied(undefined), 1500);
    }).catch(() => undefined);
  };

  // Load a preset in its mode.
  const pick = (id: string) => {
    // A text preset.
    const tp = TEXT_PRESETS.find((p) => p.id === id);
    // Set the text and its options.
    if (tp) { setMode("inspect"); setText(tp.text); setOpts({ ...DEFAULT_CLEAN, ...(tp.options ?? {}) }); }
    // A code point preset.
    const cp = CP_PRESETS.find((p) => p.id === id);
    // Set the box.
    if (cp) { setMode("codepoint"); setCpValue(cp.value); }
    // A search preset.
    const sp = SEARCH_PRESETS.find((p) => p.id === id);
    // Set the query.
    if (sp) { setMode("search"); setQuery(sp.query); }
    // A normalisation preset.
    const np = NORM_PRESETS.find((p) => p.id === id);
    // Set both texts (an empty comparison when the preset has none).
    if (np) { setMode("normalise"); setNormText(np.text); setNormCompare(np.compare ?? ""); }
    // Mark it.
    setActive(id);
  };
  // The Example of the current mode.
  const example = () => pick(mode === "inspect" ? TEXT_PRESETS[0].id : mode === "codepoint" ? CP_PRESETS[0].id : mode === "search" ? SEARCH_PRESETS[0].id : NORM_PRESETS[0].id);
  // Clear the current mode.
  const clear = () => { if (mode === "inspect") setText(""); else if (mode === "codepoint") setCpValue(""); else if (mode === "search") setQuery(""); else { setNormText(""); setNormCompare(""); } setActive(undefined); };

  // A row's main finding (the first finding flag), for the tag colour.
  const mainFlag = (r: { flags: Flag[] }) => r.flags.find((f) => FINDING_FLAGS.includes(f));
  // A label for a code point that is not drawn: its first alias abbreviation when known, else U+XXXX.
  const shortLabel = (r: TextRow) => r.label;
  // The flag labels of a row.
  const flagLabels = (flags: Flag[]) => flags.filter((f) => f !== "ascii").map((f) => t(`flag.${f}.label`)).join(", ");

  // The escape language picker and output.
  const escapes = () => {
    // The escaped text.
    const out = report?.escaped[style];
    // Draw.
    return (
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("escapeTitle")}</h4>
        <p className="tcl-muted tcl-small">{t("escapeHelp")}</p>
        <div className="tcl-fields">
          <label className="tcl-inline-field uni-style-field">
            <span className="cidr-label">{t("styleLabel")}</span>
            <select id="uni-style" className="cidr-input tcl-select" value={style} onChange={(e) => setStyle(e.target.value as EscapeStyle)}>
              {ESCAPE_STYLES.map((s) => <option key={s} value={s}>{t(`style.${s}`)}</option>)}
            </select>
          </label>
          {out !== undefined && <button type="button" className="b64-copy" onClick={() => copy("escape", out)}>{copied === "escape" ? t("copied") : t("copy")}</button>}
        </div>
        {out !== undefined ? <pre className="uni-out"><code>{out}</code></pre> : <p className="tcl-verdict tcl-verdict-warn">{t(`escUnavailable.${style}`)}</p>}
      </section>
    );
  };

  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool chr-tool uni-tool">
      {/* Mode, Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <TclSeg label={t("modeLabel")} value={mode} onChange={(m) => { setMode(m); setActive(undefined); }} options={[{ value: "inspect", label: t("modeInspect") }, { value: "codepoint", label: t("modeCodepoint") }, { value: "search", label: t("modeSearch") }, { value: "normalise", label: t("modeNormalise") }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={example}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
        </div>
      </div>

      {mode === "inspect" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("textLabel")}</span>
            <textarea id="uni-text" className="cidr-input mono tcl-short" rows={4} maxLength={60000} value={text} placeholder={t("textPlaceholder")} onChange={(e) => { setText(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <TclPresets items={TEXT_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          {report && (
            <div className="uni-report" aria-live="polite">
              {/* Counts and the verdict. */}
              <p className="tcl-outcome">{t("summary", { cps: report.codePoints, units: report.utf16Units, bytes: report.utf8Bytes, lines: report.lines, outside: report.codePoints - report.ascii })}</p>
              {report.truncated && <p className="tcl-muted tcl-small">{t("truncated")}</p>}
              {(() => {
                // Code points with at least one finding.
                const n = new Set(Object.values(report.findings).flat()).size;
                // Clean or not.
                return n === 0 && report.mixed.length === 0 ? <p className="tcl-verdict tcl-verdict-ok">{t("verdictClean")}</p> : <p className="tcl-verdict tcl-verdict-warn"><span className="tcl-verdict-label">{t("verdictFound", { n })}</span></p>;
              })()}

              {/* Bidirectional controls left open: the Trojan Source pattern. */}
              {report.openBidi.length > 0 && (
                <div className="tcl-verdict tcl-verdict-bad" role="status">
                  <p className="chr-verdict-title">{t("openBidiTitle")}</p>
                  {report.openBidi.map((o) => <p key={o.line}>{t.rich("openBidiLine", { ...rich, line: o.line, controls: o.open.join(" ") })}</p>)}
                </div>
              )}

              {/* Words that mix scripts. */}
              {report.mixed.length > 0 && (
                <div className="tcl-verdict tcl-verdict-warn">
                  <p className="chr-verdict-title">{t("mixedTitle")}</p>
                  {report.mixed.map((m, i) => <p key={i}>{t.rich("mixedWord", { ...rich, word: m.word, line: m.line, col: m.col, scripts: m.scripts.join(" + ") })}</p>)}
                </div>
              )}

              {/* Findings by kind. */}
              {Object.keys(report.findings).length > 0 && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
                  <ul className="tcl-notes">
                    {FINDING_FLAGS.filter((f) => report.findings[f]?.length).map((f) => (
                      <li key={f} className={`tcl-note uni-finding uni-tag-${f}`}>
                        <span className="tcl-verdict-label">{t("findingCount", { label: t(`flag.${f}.label`), count: report.findings[f]!.length })}</span>
                        {t(`flag.${f}.help`)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* The text in stored order, every hidden character a tag. */}
              <section className="jwt-panel">
                <h4 className="jwt-panel-title">{t("revealTitle")}</h4>
                <p className="tcl-muted tcl-small">{t("revealHelp")}</p>
                <div className="uni-reveal" dir="ltr">
                  {report.rows.map((r) => {
                    // A line feed ends the line.
                    if (r.cp === 10) return <span key={r.at}><span className="uni-eol" aria-hidden="true">↵</span><br /></span>;
                    // The main finding, if any.
                    const f = mainFlag(r);
                    // Plain characters are themselves.
                    if (!f) return <span key={r.at}>{r.cp === 13 ? "␍" : r.cp === 9 ? "⇥" : String.fromCodePoint(r.cp)}</span>;
                    // What can be drawn of it.
                    const d = drawable(r.cp, r.gc);
                    // A tag.
                    return (
                      <mark key={r.at} className={`uni-tag uni-tag-${f}`} title={`${r.label} ${r.name ?? ""} (${t(`flag.${f}.label`)})`} tabIndex={0}>
                        {d && <span className="uni-tag-ch">{d}</span>}
                        <span className="uni-tag-cp">{shortLabel(r)}</span>
                      </mark>
                    );
                  })}
                </div>
              </section>

              {/* Every code point. */}
              <section className="jwt-panel">
                <h4 className="jwt-panel-title">{t("rowsTitle")}</h4>
                {report.codePoints > report.rows.length && <p className="tcl-muted tcl-small">{t("rowsCapped")}</p>}
                <div className="tcl-table-wrap uni-rows-wrap">
                  <table className="tcl-table uni-rows">
                    <thead><tr><th scope="col">{t("colAt")}</th><th scope="col">{t("colLine")}:{t("colCol")}</th><th scope="col">{t("colChar")}</th><th scope="col">{t("colCp")}</th><th scope="col">{t("colName")}</th><th scope="col">{t("colGc")}</th><th scope="col">{t("colScript")}</th><th scope="col">{t("colFlags")}</th></tr></thead>
                    <tbody>
                      {report.rows.map((r) => {
                        // What can be drawn.
                        const d = drawable(r.cp, r.gc);
                        // The main finding.
                        const f = mainFlag(r);
                        // One row.
                        return (
                          <tr key={r.at} className={f ? `uni-row-${f}` : undefined}>
                            <td>{r.at}</td>
                            <td>{r.line}:{r.col}</td>
                            <td className="uni-char">{d ? <span dir="ltr">{d}</span> : <span className="tcl-muted">{r.cp < 0x80 ? glyph(String.fromCodePoint(r.cp)) : "-"}</span>}</td>
                            <td><button type="button" className="chr-row-btn" onClick={() => { setMode("codepoint"); setCpValue(r.label); setActive(undefined); }}>{r.label}</button></td>
                            <td>{r.name ?? (loading ? t("namesLoading") : "")}</td>
                            <td><code>{r.gc}</code></td>
                            <td><code>{r.script}</code></td>
                            <td className="tcl-small">{flagLabels(r.flags)}{r.prototype !== undefined && <> <code>{r.prototype === " " ? "SP" : r.prototype}</code></>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* The cleaned copy. */}
              <section className="jwt-panel">
                <h4 className="jwt-panel-title">{t("cleanTitle")}</h4>
                <p className="tcl-muted tcl-small">{t("cleanHelp")}</p>
                <div className="uni-opts" role="group" aria-label={t("cleanTitle")}>
                  {(["removeInvisible", "asciiSpaces", "asciiPunctuation", "foldLookalikes"] as const).map((k) => (
                    <label key={k} className="tcl-check"><input id={`uni-opt-${k}`} type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />{t(`cleanOpt.${k}`)}</label>
                  ))}
                </div>
                <p className="tcl-muted tcl-small">{t("cleanChanges", report.changes)}</p>
                <div className="tcl-fields">
                  <button type="button" className="b64-copy" onClick={() => copy("clean", report.cleaned)}>{copied === "clean" ? t("copied") : t("copy")}</button>
                </div>
                <pre className="uni-out"><code>{report.cleaned}</code></pre>
              </section>

              {/* Escapes. */}
              {escapes()}
            </div>
          )}
        </>
      )}

      {mode === "codepoint" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("cpLabel")}</span>
            <input id="uni-cp" className="cidr-input mono" value={cpValue} maxLength={200} placeholder={t("cpPlaceholder")} onChange={(e) => { setCpValue(e.target.value); setActive(undefined); }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
          </label>
          <p className="hmac-build-note">{t("cpHelp")}</p>
          <TclPresets items={CP_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          <div aria-live="polite">
            {!cpInfo && cpValue.trim() !== "" && <p className="tcl-verdict tcl-verdict-bad">{loading ? t("namesLoading") : t("cpUnknown")}</p>}
            {cpInfo && (
              <section className="chr-detail">
                {/* The headline. */}
                <div className="chr-hero">
                  <span className="chr-hero-glyph uni-hero-glyph" aria-hidden="true">{drawable(cpInfo.cp, cpInfo.gc) ?? cpInfo.label.slice(2)}</span>
                  <div className="chr-hero-text">
                    <p className="chr-hero-title">{cpInfo.label} <span className="tcl-muted">{cpInfo.utf32 && `· ${cpInfo.cp}`}</span></p>
                    <p className="chr-hero-name"><span className="tcl-muted tcl-small">{t(`nameKind.${cpInfo.nameKind ?? "label"}`)}: </span><code>{cpInfo.name}</code></p>
                    {read?.readAs && <p className="tcl-muted tcl-small">{t("readAs", { how: t(`readAsHow.${read.readAs}`) })}</p>}
                  </div>
                </div>

                {/* What to know: the verdict comes first. */}
                {cpInfo.flags.some((f) => f !== "ascii") && (
                  <section className="tcl-card">
                    <h4 className="tcl-card-title">{t("flagsTitle")}</h4>
                    <ul className="tcl-notes">
                      {cpInfo.flags.filter((f) => f !== "ascii").map((f) => <li key={f} className={`tcl-note uni-finding uni-tag-${f}`}><span className="tcl-verdict-label">{t(`flag.${f}.label`)}</span>{t(`flag.${f}.help`)}</li>)}
                    </ul>
                    {cpInfo.prototype !== undefined && <p className="chr-prose">{t.rich("prototypeHelp", { ...rich, proto: cpInfo.prototype === " " ? "SP" : cpInfo.prototype, sharing: cpInfo.sharing?.length ? cpInfo.sharing.join("  ") : "-" })}</p>}
                    {cpInfo.compat && <p className="chr-prose">{t("compatLabel")}: <code>{cpInfo.compat}</code></p>}
                  </section>
                )}

                <div className="tcl-two chr-cards">
                  {/* Properties. */}
                  <section className="tcl-card">
                    <h4 className="tcl-card-title">{t("propsTitle")}</h4>
                    <dl className="tcl-pairs">
                      <dt className="tcl-pairs-name">{t("propGc")}</dt><dd className="tcl-pairs-value"><code>{cpInfo.gc}</code> {t(`gc.${cpInfo.gc}`)}</dd>
                      <dt className="tcl-pairs-name">{t("propBlock")}</dt><dd className="tcl-pairs-value">{cpInfo.block}</dd>
                      <dt className="tcl-pairs-name">{t("propScript")}</dt><dd className="tcl-pairs-value">{cpInfo.script} <code>{cpInfo.scriptCode}</code></dd>
                      <dt className="tcl-pairs-name">{t("propScx")}</dt><dd className="tcl-pairs-value"><code>{cpInfo.scx.join(" ")}</code></dd>
                      <dt className="tcl-pairs-name">{t("propAge")}</dt><dd className="tcl-pairs-value">{cpInfo.age === "Unassigned" ? t("ageUnassigned") : cpInfo.age}</dd>
                    </dl>
                    {cpInfo.aliases.length > 0 && (
                      <>
                        <h5 className="chr-sub">{t("aliasesTitle")}</h5>
                        <ul className="chr-ws-list">{cpInfo.aliases.map((a) => <li key={a.alias}><code>{a.alias}</code> <span className="tcl-muted tcl-small">{t(`aliasType.${a.type}`)}</span></li>)}</ul>
                      </>
                    )}
                  </section>

                  {/* Encodings. */}
                  <section className="tcl-card">
                    <h4 className="tcl-card-title">{t("encTitle")}</h4>
                    <dl className="tcl-pairs">
                      <dt className="tcl-pairs-name">{t("encUtf8")}</dt><dd className="tcl-pairs-value">{cpInfo.utf8 ? <code>{cpInfo.utf8}</code> : <span className="tcl-muted">{t("encNoUtf8")}</span>}</dd>
                      <dt className="tcl-pairs-name">{t("encUtf16")}</dt><dd className="tcl-pairs-value"><code>{cpInfo.utf16}</code></dd>
                      <dt className="tcl-pairs-name">{t("encUtf32")}</dt><dd className="tcl-pairs-value"><code>{cpInfo.utf32}</code></dd>
                    </dl>
                  </section>
                </div>

                {/* Escapes. */}
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("escTitle")}</h4>
                  <div className="tcl-table-wrap">
                    <table className="tcl-table chr-write">
                      <tbody>
                        {ESCAPE_STYLES.filter((s) => s !== "html").map((s) => (
                          <tr key={s}><th scope="row">{t(`style.${s}`)}</th><td>{cpInfo.escapes[s] ? <code>{cpInfo.escapes[s]}</code> : <span className="tcl-muted">{t("unavailable")}</span>}</td></tr>
                        ))}
                        <tr><th scope="row">{t("htmlHex")}</th><td><code>{cpInfo.html.hex}</code></td></tr>
                        <tr><th scope="row">{t("htmlDec")}</th><td><code>{cpInfo.html.dec}</code></td></tr>
                        <tr><th scope="row">{t("htmlNamed")}</th><td>{cpInfo.html.named.length ? cpInfo.html.named.map((n) => <code key={n} className="chr-gap">{n}</code>) : <span className="tcl-muted">{t("noNamed")}</span>}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <ul className="tcl-notes chr-notes">
                    {cpInfo.html.note && <li className="tcl-note">{t(`htmlNote.${cpInfo.html.note}`)}</li>}
                    {!cpInfo.escapes.c && <li className="tcl-note">{t("cNote")}</li>}
                    {!cpInfo.escapes.tcl && <li className="tcl-note">{t("tclNote")}</li>}
                    {cpInfo.escapes.css && <li className="tcl-note">{t("cssNote")}</li>}
                  </ul>
                  {cpInfo.cp < 0x80 && <p><a className="chr-link" href={handoffHref(`/${locale}/tools/ascii-table/`, String(cpInfo.cp))}>{t("openAscii")}</a></p>}
                </section>
              </section>
            )}
          </div>
        </>
      )}

      {mode === "search" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("searchLabel")}</span>
            <input id="uni-search" className="cidr-input" type="search" value={query} maxLength={120} placeholder={t("searchPlaceholder")} onChange={(e) => { setQuery(e.target.value); setActive(undefined); }} autoComplete="off" spellCheck={false} />
          </label>
          <p className="hmac-build-note">{t("searchHelp")}</p>
          <TclPresets items={SEARCH_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <div aria-live="polite">
            {!data && <p className="tcl-muted">{t("namesLoading")}</p>}
            {hits && hits.length === 0 && query.trim() !== "" && <p className="tcl-note">{t("searchNone")}</p>}
            {hits && hits.length > 0 && (
              <>
                {hits.length > 50 && <p className="tcl-muted tcl-small">{t("searchMore", { n: 50 })}</p>}
                <ul className="uni-hits">
                  {hits.slice(0, 50).map((cp) => {
                    // Its category, for drawing.
                    const rec = info(cp, data);
                    // One hit.
                    return (
                      <li key={cp} className="uni-hit">
                        <span className="uni-hit-glyph" aria-hidden="true">{drawable(cp, rec.gc) ?? "-"}</span>
                        <code className="uni-hit-cp">{rec.label}</code>
                        <span className="uni-hit-name">{rec.name}</span>
                        <button type="button" className="b64-copy" onClick={() => { setMode("codepoint"); setCpValue(rec.label); setActive(undefined); }}>{t("searchPick")}</button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {mode === "normalise" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("normTextLabel")}</span>
            <textarea id="uni-norm-text" className="cidr-input mono tcl-short" rows={2} maxLength={20000} value={normText} placeholder={t("normTextPlaceholder")} onChange={(e) => { setNormText(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("normCompareLabel")}</span>
            <textarea id="uni-norm-compare" className="cidr-input mono tcl-short" rows={2} maxLength={20000} value={normCompare} placeholder={t("normComparePlaceholder")} onChange={(e) => { setNormCompare(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <p className="hmac-build-note">{t("normHelp")}</p>
          <TclPresets items={NORM_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          {norm && (
            <div className="uni-report" aria-live="polite">
              {norm.truncated && <p className="tcl-muted tcl-small">{t("normTruncated")}</p>}
              {/* The comparison first, when there is one: its verdict is the answer the reader came for. */}
              {norm.compare && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("normCompareTitle")}</h4>
                  {(() => {
                    // The comparison.
                    const c = norm.compare!;
                    // Identical, canonically equivalent, equal only under the K forms, or different everywhere.
                    return c.raw
                      ? <p className="tcl-verdict tcl-verdict-ok">{t("normVerdictIdentical")}</p>
                      : c.forms.NFC
                        ? <p className="tcl-verdict tcl-verdict-ok">{t("normVerdictCanonical")}</p>
                        : c.forms.NFKC
                          ? <p className="tcl-verdict tcl-verdict-warn">{t("normVerdictCompat")}</p>
                          : <p className="tcl-verdict tcl-verdict-warn">{t("normVerdictDifferent")}</p>;
                  })()}
                  <ul className="tcl-notes">
                    <li className="tcl-note"><span className="tcl-verdict-label">{t("normInput")}</span> {norm.compare.raw ? t("normEqual") : t("normDifferent")}</li>
                    {(["NFC", "NFD", "NFKC", "NFKD"] as const).map((f) => (
                      <li key={f} className="tcl-note"><span className="tcl-verdict-label">{f}</span> {norm.compare!.forms[f] ? t("normEqual") : t("normDifferent")}</li>
                    ))}
                  </ul>
                </section>
              )}
              {/* The input and its four forms. */}
              <section className="jwt-panel">
                <h4 className="jwt-panel-title">{t("normTitle")}</h4>
                <div className="tcl-table-wrap">
                  <table className="tcl-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("normColForm")}</th>
                        <th scope="col">{t("normColCps")}</th>
                        <th scope="col">{t("normColBytes")}</th>
                        <th scope="col">{t("normColChanged")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[{ key: "input", label: t("normInput"), view: norm.input, changed: undefined as boolean | undefined }, ...norm.forms.map((f) => ({ key: f.form, label: f.form, view: f, changed: f.changed as boolean | undefined }))].map((row) => (
                        <tr key={row.key}>
                          <th scope="row">{row.label}</th>
                          <td><code>{row.view.codePoints.join(" ")}</code></td>
                          <td>{row.view.utf8 === null ? t("normNoUtf8") : <><code>{row.view.utf8}</code> {t("normByteCount", { n: row.view.utf8Length ?? 0 })}</>}</td>
                          <td>{row.changed === undefined ? "" : row.changed ? t("normChanged") : t("normUnchanged")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="tcl-muted tcl-small">{t("normEngine")}</p>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
