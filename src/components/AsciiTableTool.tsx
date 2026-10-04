"use client";

// ============================================================================
// src/components/AsciiTableTool.tsx
// ----------------------------------------------------------------------------
// THE ASCII TABLE EXPLORER (page UI). Four parts:
//
//   Look up    one box that reads a code in any notation (65, 0x41, 4/11,
//              &#65;, %41, \x41, ^A, LF, a name, the character itself) and
//              shows everything about it: numbers and bits (each bit a button
//              that flips it), names from RFC 20 to Unicode 18.0.0, what RFC
//              20 defined a control for and what Linux does with it today,
//              how to write it in seven places, which languages count it as
//              white space. A value outside ASCII is named and explained.
//   Table      the 128 codes laid out as RFC 20 draws them (8 columns by 16
//              rows), or as a list, filtered by kind.
//   Text       paste text and see every character's code; anything outside
//              ASCII is listed with its name and why it may be a problem.
//   Compare    the ten white-space codes against seven definitions.
//
// The Unicode name table (src/lib/unicode/names.ts, about a megabyte) is
// loaded with a dynamic import only when a value or a text needs a name
// outside ASCII. Facts come from src/lib/tools/ascii-table; this component
// lays them out and words them through the i18n messages.
// ============================================================================

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ASCII, type AsciiCode } from "@/lib/tools/ascii-table/data";
import { analyzeText, detail, kindOf, lookup, WHITESPACE, WHITESPACE_SETS, type AsciiKind, type NameData, type LookupResult } from "@/lib/tools/ascii-table/compute";
import { TclPresets, TclSeg, glyph } from "@/components/TclTeachParts";
import { usePrefill } from "@/lib/use-prefill";

// D-83: the presets and the Example button load golden-vector inputs verbatim
// (src/lib/tools/ascii-table/golden-vectors.ts; the page does not import that
// file, because it pulls in the full name table).
const PRESETS: { id: string; value: string }[] = [
  // lookup-character.
  { id: "lookup-character", value: "A" },
  // lookup-column-row.
  { id: "lookup-column-row", value: "4/11" },
  // lookup-tilde (also the Example).
  { id: "lookup-tilde", value: "&tilde;" },
  // lookup-minus.
  { id: "lookup-minus", value: "&minus;" },
  // lookup-caret.
  { id: "lookup-caret", value: "^[" },
  // lookup-control-name.
  { id: "lookup-control-name", value: "line feed" },
  // lookup-bits.
  { id: "lookup-bits", value: "00100101" },
  // lookup-rfc20-name.
  { id: "lookup-rfc20-name", value: "Reverse Slant" },
  // lookup-delete.
  { id: "lookup-delete", value: "DEL" },
  // lookup-en-dash.
  { id: "lookup-en-dash", value: "–" },
  // lookup-c1-control.
  { id: "lookup-c1-control", value: "U+0085" },
];

// The Example button's vector.
const EXAMPLE_ID = "lookup-tilde";
// The text vector (text-smart-quotes), loaded with the Example.
const EXAMPLE_TEXT = "Hi “x”\n";

// The white-space codes compared in the last section.
const WS_CODES = [9, 10, 11, 12, 13, 28, 29, 30, 31, 32];

// The bits, high to low, as RFC 20 numbers them (b7 is worth 64).
const BITS = [6, 5, 4, 3, 2, 1, 0];

// The table filters (UI groups over the engine's kinds).
type Filter = "all" | "control" | "digit" | "upper" | "lower" | "punct" | "agree";

// Codes outside printable ASCII are drawn by their abbreviation.
function shortOf(row: AsciiCode): string {
  // Printable characters are themselves; controls, SP and DEL use RFC 20's table abbreviation.
  return row.glyph ?? row.rfc20?.abbr ?? row.abbr ?? "";
}

// Whether a code passes a filter.
function inFilter(code: number, f: Filter): boolean {
  // The engine's kind.
  const k: AsciiKind = kindOf(code);
  // Each group.
  switch (f) {
    // Everything.
    case "all": return true;
    // Controls and DEL together.
    case "control": return k === "control" || k === "delete";
    // RFC 20 note 3.
    case "agree": return !!ASCII[code].rfc20?.agree;
    // Space with the punctuation and symbols.
    case "punct": return k === "punct" || k === "space";
    // Digits and letters.
    default: return k === f;
  }
}

// UTF-8 length of a code point (undefined for surrogates, which UTF-8 cannot encode).
function utf8Length(cp: number): number | undefined {
  // Surrogates.
  if (cp >= 0xd800 && cp <= 0xdfff) return undefined;
  // One to four bytes by range (RFC 3629).
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

/** The page component. */
export default function AsciiTableTool() {
  // This tool's words.
  const t = useTranslations("tools.ascii-table");
  // The locale, for links to the Unicode inspector.
  const locale = useLocale();
  // Code inside a sentence.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // The look-up box.
  const [value, setValue] = useState("A");
  // The preset loaded, if any.
  const [active, setActive] = useState<string | undefined>("lookup-character");
  // The text box.
  const [text, setText] = useState("");
  // Grid or list.
  const [view, setView] = useState<"grid" | "list">("grid");
  // The table filter.
  const [filter, setFilter] = useState<Filter>("all");
  // The full name table, once loaded.
  const [names, setNames] = useState<NameData | undefined>(undefined);
  // Loading it.
  const [loading, setLoading] = useState(false);

  // A link such as /en/tools/ascii-table/?input=0x41 pre-fills the box.
  usePrefill((v) => { setValue(v); setActive(undefined); });

  // Read the box (with the full names once they are loaded).
  const result: LookupResult = useMemo(() => lookup(value, names), [value, names]);
  // The detail of an ASCII code.
  const d = useMemo(() => (result.kind === "ascii" ? detail(result.code) : undefined), [result]);
  // The text, character by character.
  const txt = useMemo(() => (text ? analyzeText(text, names) : undefined), [text, names]);

  // Whether the name table is needed: a value outside ASCII, an unread value, or non-ASCII text.
  const needNames = !names && ((result.kind !== "ascii" && value.trim() !== "") || (!!txt && txt.outside > 0));
  // Load it once, when needed.
  useEffect(() => {
    // Not needed, or already on its way.
    if (!needNames || loading) return;
    // Start.
    setLoading(true);
    // The dynamic import keeps the megabyte out of the page bundle.
    import("@/lib/unicode/names").then((m) => {
      // Keep the three functions the engine takes.
      setNames({ nameOf: m.unicodeName, aliasOf: (cp: number) => m.aliasesOf(cp)[0]?.alias, cpOf: m.codePointOfName });
    }).finally(() => setLoading(false));
  }, [needNames, loading]);

  // Select a code (from the table, a bit button or a hint).
  const select = (code: number) => { setValue(String(code)); setActive(undefined); };
  // Load a preset.
  const pick = (id: string) => { const p = PRESETS.find((x) => x.id === id); if (p) { setValue(p.value); setActive(id); } };
  // The Example: the &tilde; look-up and the smart-quotes text.
  const example = () => { pick(EXAMPLE_ID); setText(EXAMPLE_TEXT); };
  // Clear both boxes.
  const clear = () => { setValue(""); setText(""); setActive(undefined); };

  // The codes the table shows.
  const shown = ASCII.filter((r) => inFilter(r.code, filter));
  // The selected code, if any.
  const sel = result.kind === "ascii" ? result.code : undefined;

  // The verdict for a value outside ASCII.
  const outside = (r: Extract<LookupResult, { kind: "outside" }>) => {
    // UTF-8 length.
    const n = utf8Length(r.cp);
    // The ASCII character it imitates, when there is exactly one.
    const meant = r.prototype && r.prototype.length === 1 ? r.prototype : r.lookalike && r.lookalike.length === 1 ? r.lookalike : undefined;
    // Draw.
    return (
      <div className="tcl-verdict tcl-verdict-warn chr-verdict" role="status">
        <p className="chr-verdict-title">{t.rich("outsideTitle", { ...rich, label: r.label })}</p>
        {r.name ? <p><span className="tcl-verdict-label">{t(r.nameKind === "alias" ? "outsideAlias" : "outsideName")}</span><code>{r.name}</code></p> : <p>{loading ? t("namesLoading") : t("outsideNoName")}</p>}
        {n !== undefined && <p>{t("outsideBytes", { n })}</p>}
        {r.hidden && <p>{t(`outsideHidden.${r.hidden}`)}</p>}
        {r.lookalike && <p>{t.rich("outsideCompat", { ...rich, text: r.lookalike })}</p>}
        {r.prototype && <p>{t.rich("outsidePrototype", { ...rich, text: r.prototype === " " ? "SP" : r.prototype })}</p>}
        {meant && meant.charCodeAt(0) > 32 && meant.charCodeAt(0) < 127 && (
          <p>
            {t.rich("outsideAsciiMeant", { ...rich, ch: meant, code: meant.charCodeAt(0), ref: `&#${meant.charCodeAt(0)};` })}{" "}
            <button type="button" className="b64-copy chr-inline-btn" onClick={() => select(meant.charCodeAt(0))}>{meant.charCodeAt(0)}</button>
          </p>
        )}
        <p><a className="chr-link" href={`/${locale}/tools/unicode-inspector/?input=${encodeURIComponent(r.label)}`}>{t("outsideInspect")}</a></p>
      </div>
    );
  };

  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool chr-tool">
      {/* The look-up box with Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <label className="tcl-inline-field">
          <span className="cidr-label">{t("lookupLabel")}</span>
          <input id="ascii-lookup" className="cidr-input mono" value={value} maxLength={200} placeholder={t("lookupPlaceholder")} onChange={(e) => { setValue(e.target.value); setActive(undefined); }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        </label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={example}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
        </div>
      </div>
      <p className="hmac-build-note">{t("lookupHelp")}</p>
      <TclPresets items={PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

      {/* The verdict. */}
      <div aria-live="polite">
        {result.kind === "unknown" && value.trim() !== "" && (
          <div className="tcl-verdict tcl-verdict-bad" role="status">
            <p className="chr-verdict-title">{t("unknownTitle")}</p>
            <p>{loading ? t("namesLoading") : t("unknownBody")}</p>
          </div>
        )}
        {result.kind === "outside" && outside(result)}
      </div>

      {/* Everything about one ASCII code. */}
      {d && (
        <section className="chr-detail" aria-label={t("detailTitle", { code: d.dec })}>
          {/* The headline: the character, its number and how the box read it. */}
          <div className="chr-hero">
            <span className={`chr-hero-glyph chr-k-${d.kind}`} aria-hidden="true">{shortOf(d.row)}</span>
            <div className="chr-hero-text">
              <p className="chr-hero-title">{t("detailTitle", { code: d.dec })} <span className="tcl-muted">{d.hex} · {d.unicode}</span></p>
              <p className="chr-hero-name"><code>{d.row.name}</code></p>
              {result.kind === "ascii" && <p className="tcl-muted tcl-small">{t("readAsLabel")}: {t(`readAs.${result.readAs}`)}</p>}
            </div>
          </div>

          <div className="tcl-two chr-cards chr-flow">
            {/* Numbers and bits. */}
            <section className="tcl-card">
              <h4 className="tcl-card-title">{t("numbersTitle")}</h4>
              <dl className="tcl-pairs">
                <dt className="tcl-pairs-name">{t("numDec")}</dt><dd className="tcl-pairs-value"><code>{d.dec}</code></dd>
                <dt className="tcl-pairs-name">{t("numHex")}</dt><dd className="tcl-pairs-value"><code>{d.hex}</code></dd>
                <dt className="tcl-pairs-name">{t("numOct")}</dt><dd className="tcl-pairs-value"><code>{d.oct}</code></dd>
                <dt className="tcl-pairs-name">{t("numBin")}</dt><dd className="tcl-pairs-value"><code>{d.bin7}</code></dd>
                <dt className="tcl-pairs-name">{t("numBin8")}</dt><dd className="tcl-pairs-value"><code>{d.bin8}</code></dd>
                <dt className="tcl-pairs-name">{t("columnRow")}</dt><dd className="tcl-pairs-value"><code>{d.columnRow}</code><span className="tcl-muted tcl-small chr-help-line">{t("columnRowHelp")}</span></dd>
              </dl>
              <h5 className="chr-sub">{t("bitsTitle")}</h5>
              <div className="chr-bits" role="group" aria-label={t("bitsTitle")}>
                {BITS.map((b) => {
                  // The bit's value in this code.
                  const on = (d.row.code >> b) & 1;
                  // Draw one button: the bit name, its value, and where flipping it lands.
                  return (
                    <button key={b} type="button" className={`chr-bit${on ? " chr-bit-on" : ""}${b >= 4 ? " chr-bit-col" : ""}`} aria-label={`${t("bitLabel", { n: b + 1, value: 1 << b })}: ${on}`} title={`${t("bitLabel", { n: b + 1, value: 1 << b })} → ${d.flips[b]}`} onClick={() => select(d.flips[b])}>
                      <span className="chr-bit-name">b{b + 1}</span>
                      <span className="chr-bit-val">{on}</span>
                      <span className="chr-bit-to">{shortOf(ASCII[d.flips[b]])}</span>
                    </button>
                  );
                })}
              </div>
              <p className="tcl-muted tcl-small">{t("bitsHelp")}</p>
            </section>

            {/* Names, category and class. */}
            <section className="tcl-card">
              <h4 className="tcl-card-title">{t("namesTitle")}</h4>
              <dl className="tcl-pairs">
                <dt className="tcl-pairs-name">{t(d.row.category === "Cc" ? "nameUnicodeAlias" : "nameUnicode")}</dt><dd className="tcl-pairs-value"><code>{d.row.name}</code></dd>
                {d.row.aliases && <><dt className="tcl-pairs-name">{t("nameAliases")}</dt><dd className="tcl-pairs-value">{d.row.aliases.map((a) => <code key={a} className="chr-gap">{a}</code>)}</dd></>}
                {d.row.abbr && <><dt className="tcl-pairs-name">{t("nameAbbr")}</dt><dd className="tcl-pairs-value">{[d.row.abbr, ...(d.row.abbrAliases ?? [])].map((a) => <code key={a} className="chr-gap">{a}</code>)}</dd></>}
                {d.row.unicode1 && <><dt className="tcl-pairs-name">{t("nameUnicode1")}</dt><dd className="tcl-pairs-value"><code>{d.row.unicode1}</code></dd></>}
                {d.row.rfc20 && <><dt className="tcl-pairs-name">{t("nameRfc20")}</dt><dd className="tcl-pairs-value">{d.row.rfc20.abbr && <code className="chr-gap">{d.row.rfc20.abbr}</code>}{d.row.rfc20.name}</dd></>}
                {d.row.rfc20?.alt && <><dt className="tcl-pairs-name">{t("nameRfc20Alt")}</dt><dd className="tcl-pairs-value">{d.row.rfc20.alt}</dd></>}
                <dt className="tcl-pairs-name">{t("nameCategory")}</dt><dd className="tcl-pairs-value"><code>{d.row.category}</code> {t(`gc.${d.row.category}`)}</dd>
                <dt className="tcl-pairs-name">{t("classLabel")}</dt><dd className="tcl-pairs-value">{t(`class.${d.row.rfc20?.cls ?? (d.kind === "control" ? "none" : "graphic")}`)}</dd>
              </dl>
              <ul className="tcl-notes chr-notes">
                {d.row.rfc20?.agree && <li className="tcl-note">{t("noteAgree")}</li>}
                {d.row.rfc20?.pound && <li className="tcl-note">{t("notePound")}</li>}
                {d.kind === "delete" && <li className="tcl-note">{t("noteDelStrict")}</li>}
                {[35, 37, 38, 64].includes(d.row.code) && <li className="tcl-note">{t("noteGcPo")}</li>}
              </ul>
            </section>

            {/* What RFC 20 defined it for, and what it does today. */}
            {t.has(`ctl.c${d.row.code}.rfc`) && (
              <section className="tcl-card">
                <h4 className="tcl-card-title">{t("rfcTitle")}</h4>
                <p className="chr-prose">{t(`ctl.c${d.row.code}.rfc`)}</p>
                {t.has(`ctl.c${d.row.code}.today`) && (
                  <>
                    <h5 className="chr-sub">{t("todayTitle")}</h5>
                    <p className="chr-prose">{t(`ctl.c${d.row.code}.today`)}</p>
                  </>
                )}
              </section>
            )}

            {/* Relations: caret notation, the other case, a digit's value, UTS #39 confusables. */}
            {(d.caret || d.otherCase || d.digitValue !== undefined || d.confusable) && (
              <section className="tcl-card">
                <h4 className="tcl-card-title">{t("relationsTitle")}</h4>
                <dl className="tcl-pairs">
                  {d.caret && <><dt className="tcl-pairs-name">{t("caretLabel")}</dt><dd className="tcl-pairs-value">{d.row.code === 127 ? t.rich("caretDelHelp", rich) : t.rich("caretHelp", { ...rich, caret: d.caret, pair: d.caretOf ?? "" })}</dd></>}
                  {d.otherCase && <><dt className="tcl-pairs-name">{t("otherCaseLabel")}</dt><dd className="tcl-pairs-value">{t.rich("otherCaseHelp", { ...rich, other: d.otherCase })} <button type="button" className="b64-copy chr-inline-btn" onClick={() => select(d.otherCase!.charCodeAt(0))}>{d.otherCase.charCodeAt(0)}</button></dd></>}
                  {d.digitValue !== undefined && <><dt className="tcl-pairs-name">{t("digitLabel")}</dt><dd className="tcl-pairs-value">{t("digitHelp", { value: d.digitValue })}</dd></>}
                  {d.confusable && <><dt className="tcl-pairs-name">{t("confusableLabel")}</dt><dd className="tcl-pairs-value">{t.rich("confusableHelp", { ...rich, prototype: d.confusable.prototype, others: d.confusable.with.join("  ") })}</dd></>}
                </dl>
              </section>
            )}

            {/* White space, by definition. */}
            <section className="tcl-card">
              <h4 className="tcl-card-title">{t("wsTitle")}</h4>
              <ul className="chr-ws-list">
                {WHITESPACE_SETS.map((s) => {
                  // Counted by this definition?
                  const yes = d.whitespace.includes(s);
                  // One line.
                  return <li key={s} className={yes ? "chr-yes" : "chr-no"}><span className="chr-mark" aria-hidden="true">{yes ? "✓" : "·"}</span>{t(`wsSet.${s}`)} <span className="sr-only">{yes ? t("wsYes") : t("wsNo")}</span></li>;
                })}
              </ul>
              <p className="tcl-muted tcl-small">{t("wsHelp")}</p>
            </section>
          </div>

          {/* How to write it, everywhere. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("writeTitle")}</h4>
            <p className="tcl-muted tcl-small">{t("writeHelp")}</p>
            <div className="tcl-table-wrap">
              <table className="tcl-table chr-write">
                <tbody>
                  {(["c", "json", "javascript", "python", "tcl"] as const).map((lang) => {
                    // The form for this language.
                    const f = d.escapes[lang];
                    // A plain control or DEL is invisible, so it is named instead.
                    const invisible = f.how === "plain" && (d.row.code < 33 || d.row.code === 127);
                    // One row.
                    return (
                      <tr key={lang}>
                        <th scope="row">{t(`lang.${lang}`)}</th>
                        <td>{invisible ? <em>{shortOf(d.row)}</em> : <code>{f.text}</code>}</td>
                        <td className="tcl-muted">{t(`how.${f.how}`)}</td>
                      </tr>
                    );
                  })}
                  <tr><th scope="row">{t("lang.htmlDec")}</th><td><code>{d.html.dec}</code></td><td /></tr>
                  <tr><th scope="row">{t("lang.htmlHex")}</th><td><code>{d.html.hex}</code></td><td /></tr>
                  <tr><th scope="row">{t("lang.htmlNamed")}</th><td>{d.html.named.length ? d.html.named.map((n) => <code key={n} className="chr-gap">{n}</code>) : <span className="tcl-muted">{t("noNamed")}</span>}</td><td /></tr>
                  <tr><th scope="row">{t("lang.url")}</th><td><code>{d.url.encoded}</code></td><td className="tcl-muted">{t(`urlClass.${d.url.cls}`)}</td></tr>
                </tbody>
              </table>
            </div>
            {/* The remarks that apply to this code. */}
            <ul className="tcl-notes chr-notes">
              {Array.from(new Set(Object.values(d.escapes).map((f) => f.note).filter((n): n is string => !!n))).map((n) => <li key={n} className="tcl-note">{t(`escNote.${n}`)}</li>)}
              {d.html.note && <li className="tcl-note">{t(`htmlNote.${d.html.note}`)}</li>}
            </ul>
          </section>
        </section>
      )}

      {/* The table. */}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("tableTitle")}</h4>
        <p className="tcl-muted tcl-small">{t("tableHelp")}</p>
        <div className="tcl-toolbar">
          <TclSeg label={t("viewLabel")} value={view} onChange={setView} options={[{ value: "grid", label: t("viewGrid") }, { value: "list", label: t("viewList") }]} />
          <span className="tcl-muted tcl-small">{t("showing", { n: shown.length })}</span>
        </div>
        <div className="tcl-presets">
          <span className="tcl-presets-label">{t("filterLabel")}</span>
          <div className="tcl-presets-row" role="group" aria-label={t("filterLabel")}>
            {(["all", "control", "digit", "upper", "lower", "punct", "agree"] as const).map((f) => (
              <button key={f} type="button" className="tcl-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{t(`filter.${f}`)}</button>
            ))}
          </div>
        </div>
        {view === "grid" ? (
          <div className="chr-grid-wrap">
            <table className="chr-grid">
              <thead>
                <tr>
                  <th scope="col" className="chr-grid-corner"><span>{t("gridBitsColumn")}</span><span>{t("gridBitsRow")}</span></th>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => <th key={col} scope="col"><span className="chr-grid-num">{col}</span><span className="chr-grid-bits">{col.toString(2).padStart(3, "0")}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }, (_, row) => (
                  <tr key={row}>
                    <th scope="row"><span className="chr-grid-num">{row}</span><span className="chr-grid-bits">{row.toString(2).padStart(4, "0")}</span></th>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
                      // The code at this position.
                      const code = col * 16 + row;
                      // Its row.
                      const r = ASCII[code];
                      // Shown by the filter.
                      const on = inFilter(code, filter);
                      // One cell.
                      return (
                        <td key={col}>
                          <button type="button" className={`chr-cell chr-k-${kindOf(code)}${on ? "" : " chr-cell-dim"}`} aria-pressed={sel === code} aria-label={t("cellLabel", { dec: code, name: r.name })} onClick={() => select(code)}>
                            <span className="chr-cell-glyph">{shortOf(r)}</span>
                            <span className="chr-cell-dec">{code}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tcl-table-wrap">
            <table className="tcl-table chr-list">
              <thead>
                <tr><th scope="col">{t("colDec")}</th><th scope="col">{t("colHex")}</th><th scope="col">{t("colOct")}</th><th scope="col">{t("colBin")}</th><th scope="col">{t("colChar")}</th><th scope="col">{t("colName")}</th><th scope="col">{t("colHtml")}</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.code} className={sel === r.code ? "chr-row-sel" : undefined}>
                    <td><button type="button" className="chr-row-btn" onClick={() => select(r.code)}>{r.code}</button></td>
                    <td><code>{r.code.toString(16).toUpperCase().padStart(2, "0")}</code></td>
                    <td><code>{r.code.toString(8).padStart(3, "0")}</code></td>
                    <td><code>{r.code.toString(2).padStart(7, "0")}</code></td>
                    <td><code className={`chr-k-${kindOf(r.code)}`}>{shortOf(r)}</code></td>
                    <td>{r.name}</td>
                    <td>{(r.html ?? []).slice(0, 2).map((n) => <code key={n} className="chr-gap">{n}</code>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Text to codes. */}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("textTitle")}</h4>
        <label className="tcl-inline-field">
          <span className="cidr-label">{t("textLabel")}</span>
          <textarea id="ascii-text" className="cidr-input mono tcl-short" value={text} maxLength={20000} rows={3} placeholder={t("textPlaceholder")} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </label>
        {txt && (
          <div className="chr-text" aria-live="polite">
            <p className="tcl-outcome">{t("textSummary", { total: txt.chars.length, ascii: txt.ascii, outside: txt.outside })} {txt.outside === 0 && t("textAllAscii")}</p>
            {txt.truncated && <p className="tcl-muted tcl-small">{t("textTruncated")}</p>}
            <div className="chr-strip-wrap">
              <ol className="chr-strip">
                {txt.chars.slice(0, 400).map((c, i) => (
                  <li key={i} className={`chr-sc${c.ascii ? "" : " chr-sc-out"}`} title={c.label}>
                    <span className="chr-sc-ch">{glyph(c.char)}</span>
                    <span className="chr-sc-code">{c.ascii ? c.bytes : c.label.slice(2)}</span>
                  </li>
                ))}
              </ol>
            </div>
            {txt.outside > 0 && (
              <>
                <h5 className="chr-sub">{t("textOutsideTitle")}</h5>
                <div className="tcl-table-wrap">
                  <table className="tcl-table">
                    <thead><tr><th scope="col">{t("textColPos")}</th><th scope="col">{t("textColChar")}</th><th scope="col">{t("textColCode")}</th><th scope="col">{t("textColBytes")}</th><th scope="col">{t("textColName")}</th><th scope="col">{t("textColNote")}</th></tr></thead>
                    <tbody>
                      {txt.chars.map((c, i) => (c.ascii ? null : (
                        <tr key={i}>
                          <td>{i}</td>
                          <td><code>{glyph(c.char)}</code></td>
                          <td><a className="chr-link" href={`/${locale}/tools/unicode-inspector/?input=${encodeURIComponent(c.label)}`}><code>{c.label}</code></a></td>
                          <td><code>{c.bytes}</code></td>
                          <td>{c.name ?? (loading ? t("namesLoading") : "")}</td>
                          <td>{[c.hidden && t(`outsideHidden.${c.hidden}`), c.prototype && t.rich("outsidePrototype", { ...rich, text: c.prototype === " " ? "SP" : c.prototype })].filter(Boolean).map((x, k) => <span key={k} className="chr-note-line">{x}</span>)}</td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* White space, compared. */}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("compareTitle")}</h4>
        <p className="tcl-muted tcl-small">{t("compareHelp")}</p>
        <div className="tcl-table-wrap">
          <table className="tcl-table chr-compare">
            <thead>
              <tr><th scope="col" />{WS_CODES.map((c) => <th key={c} scope="col"><button type="button" className="chr-row-btn" onClick={() => select(c)}>{shortOf(ASCII[c])}</button><span className="chr-grid-bits">{c}</span></th>)}</tr>
            </thead>
            <tbody>
              {WHITESPACE_SETS.map((s) => (
                <tr key={s}>
                  <th scope="row">{t(`wsSet.${s}`)}</th>
                  {WS_CODES.map((c) => {
                    // Counted?
                    const yes = WHITESPACE[s].includes(c);
                    // One cell.
                    return <td key={c} className={yes ? "chr-yes" : "chr-no"}><span aria-hidden="true">{yes ? "✓" : "·"}</span><span className="sr-only">{yes ? t("wsYes") : t("wsNo")}</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
