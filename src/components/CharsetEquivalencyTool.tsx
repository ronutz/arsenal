"use client";

// ============================================================================
// src/components/CharsetEquivalencyTool.tsx
// ----------------------------------------------------------------------------
// THE CHARSET CONVERTER AND MOJIBAKE REPAIR (page UI). Three modes:
//
//   Text to bytes   the bytes of a text in one of fourteen charsets, in six
//                   notations, character by character, with what happens to
//                   characters the charset cannot hold; the same text in every
//                   charset; and how those bytes read back in every charset
//                   (the mojibake each wrong guess produces).
//   Bytes to text   bytes typed as hex, pasted from hexdump -C, xxd or od, or
//                   written as escapes, %XX or Base64, decoded with every
//                   ill-formed sequence replaced and explained, a byte order
//                   mark honoured, a guess at the charset, and the same bytes
//                   read in every charset.
//   Fix mojibake    garbled text traced back to the bytes and charset it came
//                   from, with the steps and how strong the evidence is.
//
// Facts come from src/lib/tools/charset-equivalency; this component lays them
// out and words them through the i18n messages.
// ============================================================================

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CHARSETS, FACTS, BYTE_STYLES, MAX_ROWS, encodeText, decodeBytes, readEverywhere, writeEverywhere, parseBytes, formatBytes, repairText, hasUtf8Pairs, type CharsetId, type CharsetInput, type ByteFormat, type ByteStyle, type Unencodable, type DecodeError } from "@/lib/tools/charset-equivalency/compute";
import { TclPresets, TclSeg } from "@/components/TclTeachParts";
import { usePrefill } from "@/lib/use-prefill";

// D-83: presets and the Example buttons load golden-vector inputs verbatim
// (src/lib/tools/charset-equivalency/golden-vectors.ts).
// The encode presets (the first is the Example in this mode).
const ENCODE_PRESETS: { id: string; input: Extract<CharsetInput, { mode: "encode" }> }[] = [
  // encode-portuguese-utf8.
  { id: "encode-portuguese-utf8", input: {"mode":"encode","text":"Requisi\u00E7\u00E3o bloqueada \u2013 caf\u00E9","charset":"utf-8"} },
  // encode-euro-everywhere.
  { id: "encode-euro-everywhere", input: {"mode":"encode","text":"\u20AC","charset":"utf-8"} },
  // encode-emoji-utf16-bom.
  { id: "encode-emoji-utf16-bom", input: {"mode":"encode","text":"\uD83D\uDE00","charset":"utf-16le","bom":true} },
  // encode-utf32be.
  { id: "encode-utf32be", input: {"mode":"encode","text":"A\uD83D\uDE00","charset":"utf-32be"} },
  // encode-ebcdic.
  { id: "encode-ebcdic", input: {"mode":"encode","text":"HELLO, World","charset":"ibm037"} },
  // encode-html-mode.
  { id: "encode-html-mode", input: {"mode":"encode","text":"caf\u00E9 \u20AC","charset":"iso-8859-1","unencodable":"html"} },
  // encode-strict-fails.
  { id: "encode-strict-fails", input: {"mode":"encode","text":"na\u00EFve \u00BD \uD83D\uDE00","charset":"ibm437","unencodable":"strict"} },
  // encode-cp850-portuguese.
  { id: "encode-cp850-portuguese", input: {"mode":"encode","text":"A\u00C7\u00C3O","charset":"ibm850"} },
  // encode-mac-roman.
  { id: "encode-mac-roman", input: {"mode":"encode","text":"\u03A9 \u2264 \u221E","charset":"macintosh"} },
];
// The decode presets (the first is the Example in this mode).
const DECODE_PRESETS: { id: string; input: Extract<CharsetInput, { mode: "decode" }> }[] = [
  // decode-hexdump-auto.
  { id: "decode-hexdump-auto", input: {"mode":"decode","bytes":"00000000  52 65 71 75 69 73 69 c3  a7 c3 a3 6f 20 62 6c 6f  |Requisi....o blo|\n00000010  71 75 65 61 64 61 20 e2  80 93 20 63 61 66 c3 a9  |queada ... caf..|\n00000020  0a                                                |.|\n00000021\n","charset":"auto"} },
  // decode-unicode-table-3-8.
  { id: "decode-unicode-table-3-8", input: {"mode":"decode","bytes":"C0 AF E0 80 BF F0 81 82 41","charset":"utf-8"} },
  // decode-unicode-table-3-9.
  { id: "decode-unicode-table-3-9", input: {"mode":"decode","bytes":"ED A0 80 ED BF BF ED AF 41","charset":"utf-8"} },
  // decode-unicode-table-3-10.
  { id: "decode-unicode-table-3-10", input: {"mode":"decode","bytes":"F4 91 92 93 FF 41 80 BF 42","charset":"utf-8"} },
  // decode-unicode-table-3-11.
  { id: "decode-unicode-table-3-11", input: {"mode":"decode","bytes":"E1 80 E2 F0 91 92 F1 BF 41","charset":"utf-8"} },
  // decode-bom-overrides.
  { id: "decode-bom-overrides", input: {"mode":"decode","bytes":"FF FE 63 00 61 00 66 00 E9 00","charset":"utf-8"} },
  // decode-utf16-unpaired.
  { id: "decode-utf16-unpaired", input: {"mode":"decode","bytes":"3D D8 41 00","charset":"utf-16le"} },
  // decode-xxd.
  { id: "decode-xxd", input: {"mode":"decode","bytes":"00000000: 6361 66c3 a920 e282 ac0a                 caf.. ....\n","charset":"utf-8"} },
  // decode-git-octal.
  { id: "decode-git-octal", input: {"mode":"decode","bytes":"caf\\303\\251.txt","charset":"auto"} },
  // decode-percent.
  { id: "decode-percent", input: {"mode":"decode","bytes":"caf%C3%A9%20%E2%82%AC","charset":"auto"} },
  // decode-base64.
  { id: "decode-base64", input: {"mode":"decode","bytes":"Y2Fmw6kg4oKs","charset":"auto"} },
  // decode-windows-1252.
  { id: "decode-windows-1252", input: {"mode":"decode","bytes":"80 81 9D 93 48 69 94","charset":"windows-1252"} },
  // decode-latin1.
  { id: "decode-latin1", input: {"mode":"decode","bytes":"80 81 9D 93 48 69 94","charset":"iso-8859-1"} },
  // decode-ebcdic-auto.
  { id: "decode-ebcdic-auto", input: {"mode":"decode","bytes":"C8 C5 D3 D3 D6 6B 40 E6 96 99 93 84","charset":"auto"} },
  // decode-utf16-auto.
  { id: "decode-utf16-auto", input: {"mode":"decode","bytes":"48 00 69 00 21 00","charset":"auto"} },
  // decode-odd-hex.
  { id: "decode-odd-hex", input: {"mode":"decode","bytes":"C3 A","charset":"utf-8"} },
];
// The repair presets (the first is the Example in this mode).
const REPAIR_PRESETS: { id: string; input: Extract<CharsetInput, { mode: "repair" }> }[] = [
  // repair-utf8-as-1252.
  { id: "repair-utf8-as-1252", input: {"mode":"repair","text":"Requisi\u00C3\u00A7\u00C3\u00A3o bloqueada \u00E2\u20AC\u201C caf\u00C3\u00A9"} },
  // repair-twice.
  { id: "repair-twice", input: {"mode":"repair","text":"\u00C3\u00A2\u00E2\u201A\u00AC\u00E2\u201E\u00A2"} },
  // repair-three-times.
  { id: "repair-three-times", input: {"mode":"repair","text":"\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00A9"} },
  // repair-utf8-as-cp437.
  { id: "repair-utf8-as-cp437", input: {"mode":"repair","text":"caf\u251C\u2310"} },
  // repair-cp850-as-1252.
  { id: "repair-cp850-as-1252", input: {"mode":"repair","text":"a\u2021\u00C6o"} },
  // repair-1252-as-cp850.
  { id: "repair-1252-as-cp850", input: {"mode":"repair","text":"S\u00D2o Paulo"} },
  // repair-ebcdic-as-latin1.
  { id: "repair-ebcdic-as-latin1", input: {"mode":"repair","text":"\u00C8\u00C5\u00D3\u00D3\u00D6k@\u00E6\u0096\u0099\u0093\u0084"} },
  // repair-lossy.
  { id: "repair-lossy", input: {"mode":"repair","text":"\u00E2\u20AC\u0153quoted\u00E2\u20AC"} },
  // repair-correct-text.
  { id: "repair-correct-text", input: {"mode":"repair","text":"a\u00E7\u00E3o"} },
  // repair-mixed-left-alone.
  { id: "repair-mixed-left-alone", input: {"mode":"repair","text":"caf\u00C3\u00A9 and caf\u00E9"} },
];

// The charsets in their groups, for the select boxes.
const GROUPS: { id: "unicode" | "latin" | "dos" | "ebcdic"; charsets: CharsetId[] }[] = [
  // The five Unicode schemes.
  { id: "unicode", charsets: ["utf-8", "utf-16le", "utf-16be", "utf-32le", "utf-32be"] },
  // ASCII and the Latin code pages a browser knows.
  { id: "latin", charsets: ["us-ascii", "iso-8859-1", "windows-1252", "iso-8859-15", "macintosh"] },
  // DOS.
  { id: "dos", charsets: ["ibm437", "ibm850"] },
  // EBCDIC.
  { id: "ebcdic", charsets: ["ibm037", "ibm500"] },
];
// The input formats.
const FORMATS: ByteFormat[] = ["auto", "hex", "escaped", "percent", "base64"];
// The policies for characters a charset cannot hold.
const POLICIES: Unencodable[] = ["replace", "html", "strict"];
// The most bytes shown in a cell of the comparison tables.
const CELL_BYTES = 24;

/** Bytes as upper-case hex pairs, shortened to a number of bytes with an ellipsis. */
function hexCell(bytes: readonly number[], max = CELL_BYTES): string {
  // The shown part.
  const shown = bytes.slice(0, max).map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  // With an ellipsis when cut.
  return bytes.length > max ? `${shown} …` : shown;
}

/** U+XXXX. */
const label = (cp: number) => "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

/** The kind of tag a code point is drawn as, or null when it is drawn as itself. */
function tagKind(cp: number): "control" | "replacement" | "invisible" | null {
  // C0 controls (line feed is handled by the caller), DEL and C1 controls.
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f)) return "control";
  // The replacement character.
  if (cp === 0xfffd) return "replacement";
  // Soft hyphen, zero-width and bidirectional format characters, separators, the BOM.
  if (cp === 0xad || (cp >= 0x200b && cp <= 0x200f) || (cp >= 0x2028 && cp <= 0x202e) || (cp >= 0x2060 && cp <= 0x2069) || cp === 0xfeff) return "invisible";
  // Everything else is itself.
  return null;
}

/** A text drawn so that controls, replacement characters and invisible characters show as tags. */
function Shown({ text, inline = false }: { text: string; inline?: boolean }) {
  // The pieces: runs of plain text, and tags.
  const parts: ReactNode[] = [];
  // The plain run being collected.
  let run = "";
  // A key for each element.
  let k = 0;
  // Close the current plain run (one text node per run, not per character).
  const flush = () => { if (run) { parts.push(<span key={k++}>{run}</span>); run = ""; } };
  // Walk.
  for (const ch of text) {
    // The code point.
    const cp = ch.codePointAt(0)!;
    // A line feed: a mark, and a break unless inline.
    if (cp === 10) { flush(); parts.push(<span key={k++} className="uni-eol" aria-hidden="true">↵</span>); if (!inline) parts.push(<br key={k++} />); continue; }
    // A tab.
    if (cp === 9) { flush(); parts.push(<span key={k++} className="uni-eol">⇥</span>); continue; }
    // A tag, or the character.
    const kind = tagKind(cp);
    // Drawn as itself: add it to the run.
    if (!kind) { run += ch; continue; }
    // A tag with the code point.
    flush();
    // The tag.
    parts.push(<mark key={k++} className={`uni-tag uni-tag-${kind}`} title={label(cp)}>{cp === 0xfffd && <span className="uni-tag-ch">{ch}</span>}<span className="uni-tag-cp">{label(cp)}</span></mark>);
  }
  // The last run.
  flush();
  // Draw.
  return <>{parts}</>;
}

/** The page component. */
export default function CharsetEquivalencyTool() {
  // This tool's words.
  const t = useTranslations("tools.charset-equivalency");
  // Code inside a sentence.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // The mode.
  const [mode, setMode] = useState<"encode" | "decode" | "repair">("encode");
  // Encode mode: the text, charset, BOM and policy, starting from the Example.
  const [text, setText] = useState(ENCODE_PRESETS[0].input.text);
  // The charset to encode with.
  const [encCs, setEncCs] = useState<CharsetId>(ENCODE_PRESETS[0].input.charset);
  // Whether to write a byte order mark.
  const [bom, setBom] = useState(false);
  // What to do with characters the charset cannot hold.
  const [policy, setPolicy] = useState<Unencodable>("replace");
  // How to write the bytes.
  const [style, setStyle] = useState<ByteStyle>("hex");
  // Decode mode: the bytes, their format, the charset and BOM handling.
  const [bytesIn, setBytesIn] = useState(DECODE_PRESETS[0].input.bytes);
  // The input format.
  const [format, setFormat] = useState<ByteFormat>("auto");
  // The charset to decode with.
  const [decCs, setDecCs] = useState<CharsetId | "auto">(DECODE_PRESETS[0].input.charset);
  // Whether a byte order mark decides.
  const [sniff, setSniff] = useState(true);
  // Repair mode: the garbled text.
  const [garbled, setGarbled] = useState(REPAIR_PRESETS[0].input.text);
  // The charset row to highlight in the read-back table (after "see how it gets garbled").
  const [highlight, setHighlight] = useState<CharsetId | undefined>(undefined);
  // The preset loaded, if any.
  const [active, setActive] = useState<string | undefined>(ENCODE_PRESETS[0].id);
  // Which copy button just copied.
  const [copied, setCopied] = useState<string | undefined>(undefined);
  // The copy timer.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A link with ?input= opens the mode the value looks like: mojibake, bytes, or text.
  usePrefill((v) => {
    // Mojibake pairs: repair.
    if (hasUtf8Pairs(v)) { setMode("repair"); setGarbled(v); }
    // Readable as bytes: decode.
    else if (!parseBytes(v).error) { setMode("decode"); setBytesIn(v); setDecCs("auto"); }
    // Anything else: encode.
    else { setMode("encode"); setText(v); }
    // No preset.
    setActive(undefined);
  });

  // A charset's name.
  const csName = (cs: CharsetId) => t(`charset.${cs}`);

  // Encode: the result, every charset, the read-back.
  const enc = useMemo(() => (mode === "encode" ? encodeText(text, encCs, { bom: bom && FACTS[encCs].kind === "utf", unencodable: policy }) : undefined), [mode, text, encCs, bom, policy]);
  // The same text in every charset.
  const everywhere = useMemo(() => (mode === "encode" ? writeEverywhere(text) : undefined), [mode, text]);
  // The bytes read back in every charset.
  const readBack = useMemo(() => (enc ? readEverywhere(enc.bytes) : undefined), [enc]);
  // Decode: what was read, the decoding, every charset.
  const parsed = useMemo(() => (mode === "decode" ? parseBytes(bytesIn, format) : undefined), [mode, bytesIn, format]);
  // The decoding.
  const dec = useMemo(() => (parsed && !parsed.error ? decodeBytes(parsed.bytes, decCs, { sniffBom: sniff }) : undefined), [parsed, decCs, sniff]);
  // The same bytes in every charset.
  const readings = useMemo(() => (parsed && !parsed.error ? readEverywhere(parsed.bytes) : undefined), [parsed]);
  // Repair.
  const rep = useMemo(() => (mode === "repair" && garbled ? repairText(garbled) : undefined), [mode, garbled]);

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
    // An encode preset.
    const e = ENCODE_PRESETS.find((p) => p.id === id);
    // Set its fields.
    if (e) { setMode("encode"); setText(e.input.text); setEncCs(e.input.charset); setBom(!!e.input.bom); setPolicy(e.input.unencodable ?? "replace"); setHighlight(undefined); }
    // A decode preset.
    const d = DECODE_PRESETS.find((p) => p.id === id);
    // Set its fields.
    if (d) { setMode("decode"); setBytesIn(d.input.bytes); setFormat(d.input.format ?? "auto"); setDecCs(d.input.charset); setSniff(d.input.sniffBom !== false); }
    // A repair preset.
    const r = REPAIR_PRESETS.find((p) => p.id === id);
    // Set the text.
    if (r) { setMode("repair"); setGarbled(r.input.text); }
    // Mark it.
    setActive(id);
  };
  // The Example of the current mode.
  const example = () => pick(mode === "encode" ? ENCODE_PRESETS[0].id : mode === "decode" ? DECODE_PRESETS[0].id : REPAIR_PRESETS[0].id);
  // Clear the current mode.
  const clear = () => { if (mode === "encode") setText(""); else if (mode === "decode") setBytesIn(""); else setGarbled(""); setActive(undefined); };

  // A select box of charsets, grouped, with an optional "detect" first.
  const charsetSelect = (id: string, value: CharsetId | "auto", onChange: (v: CharsetId | "auto") => void, withAuto: boolean) => (
    <select id={id} className="cidr-input tcl-select" value={value} onChange={(e) => onChange(e.target.value as CharsetId | "auto")}>
      {withAuto && <option value="auto">{t("charsetAuto")}</option>}
      {GROUPS.map((g) => <optgroup key={g.id} label={t(`group.${g.id}`)}>{g.charsets.map((cs) => <option key={cs} value={cs}>{csName(cs)}</option>)}</optgroup>)}
    </select>
  );

  // The note on what a browser does with a charset, when it is not simply "decodes".
  const browserNote = (cs: CharsetId) => (FACTS[cs].browser === "decodes" ? null : <p className="tcl-muted tcl-small">{t(`browser.${FACTS[cs].browser}`, { charset: csName(cs) })}</p>);

  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool chr-tool uni-tool cs-tool">
      {/* Mode, Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <TclSeg label={t("modeLabel")} value={mode} onChange={(m) => { setMode(m); setActive(undefined); }} options={[{ value: "encode", label: t("modeEncode") }, { value: "decode", label: t("modeDecode") }, { value: "repair", label: t("modeRepair") }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={example}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
        </div>
      </div>

      {mode === "encode" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("textLabel")}</span>
            <textarea id="cs-text" className="cidr-input mono tcl-short" rows={3} maxLength={80000} value={text} placeholder={t("textPlaceholder")} onChange={(e) => { setText(e.target.value); setActive(undefined); setHighlight(undefined); }} spellCheck={false} />
          </label>
          <div className="tcl-fields">
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("charsetLabel")}</span>
              {charsetSelect("cs-enc-charset", encCs, (v) => { setEncCs(v as CharsetId); setActive(undefined); }, false)}
            </label>
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("policyLabel")}</span>
              <select id="cs-policy" className="cidr-input tcl-select" value={policy} onChange={(e) => { setPolicy(e.target.value as Unencodable); setActive(undefined); }}>
                {POLICIES.map((p) => <option key={p} value={p}>{t(`policy.${p}`)}</option>)}
              </select>
            </label>
            <label className="tcl-check"><input id="cs-bom" type="checkbox" checked={bom} disabled={FACTS[encCs].kind !== "utf"} onChange={(e) => { setBom(e.target.checked); setActive(undefined); }} />{t("bomLabel")}</label>
          </div>
          <TclPresets items={ENCODE_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          {enc && (
            <div className="cs-report" aria-live="polite">
              {/* Counts. */}
              <p className="tcl-outcome">{t("encSummary", { cps: enc.codePoints, bytes: enc.bytes.length, charset: csName(encCs) })}</p>
              {browserNote(encCs)}
              {enc.truncated && <p className="tcl-muted tcl-small">{t("truncatedText")}</p>}
              {enc.bom && <p className="tcl-muted tcl-small">{t("encBom", { n: enc.bom.length, bytes: hexCell(enc.bom) })}</p>}
              {enc.loneSurrogates > 0 && <p className="tcl-verdict tcl-verdict-warn">{t("encLone", { n: enc.loneSurrogates })}</p>}
              {enc.unencodable > 0 && (
                <div className={`tcl-verdict ${enc.failed ? "tcl-verdict-bad" : "tcl-verdict-warn"}`}>
                  <p className="chr-verdict-title">{t("encUnencodable", { n: enc.unencodable, charset: csName(encCs) })}</p>
                  <p>{t(`encPolicy.${policy}`)}</p>
                </div>
              )}

              {/* The bytes, in a chosen notation. */}
              {!enc.failed && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("bytesTitle")}</h4>
                  <div className="tcl-fields">
                    <label className="tcl-inline-field uni-style-field">
                      <span className="cidr-label">{t("styleLabel")}</span>
                      <select id="cs-style" className="cidr-input tcl-select" value={style} onChange={(e) => setStyle(e.target.value as ByteStyle)}>
                        {BYTE_STYLES.map((s) => <option key={s} value={s}>{t(`style.${s}`)}</option>)}
                      </select>
                    </label>
                    <button type="button" className="b64-copy" onClick={() => copy("bytes", formatBytes(enc.bytes, style))}>{copied === "bytes" ? t("copied") : t("copy")}</button>
                  </div>
                  <pre className="uni-out"><code>{formatBytes(enc.bytes, style)}</code></pre>
                </section>
              )}

              {/* Character by character. */}
              <section className="jwt-panel">
                <h4 className="jwt-panel-title">{t("charsTitle")}</h4>
                {enc.codePoints > enc.chars.length && <p className="tcl-muted tcl-small">{t("rowsCapped", { n: MAX_ROWS })}</p>}
                <div className="tcl-table-wrap">
                  <table className="tcl-table cs-table">
                    <thead><tr><th scope="col">{t("colChar")}</th><th scope="col">{t("colCp")}</th><th scope="col">{t("colBytes", { charset: csName(encCs) })}</th></tr></thead>
                    <tbody>
                      {enc.chars.map((c) => (
                        <tr key={c.at} className={c.bytes ? undefined : "cs-row-missing"}>
                          <td className="cs-char"><Shown text={String.fromCodePoint(c.cp)} inline /></td>
                          <td><code>{label(c.cp)}</code></td>
                          <td>{c.bytes ? <code>{hexCell(c.bytes)}</code> : <span>{t("cannotHold", { charset: csName(encCs) })}{c.instead && c.instead.length > 0 && <> {t.rich("writtenInstead", { ...rich, bytes: hexCell(c.instead) })}</>}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* The same text in every charset. */}
              {everywhere && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("everywhereTitle")}</h4>
                  <p className="tcl-muted tcl-small">{t("everywhereHelp")}</p>
                  <div className="tcl-table-wrap">
                    <table className="tcl-table cs-table">
                      <thead><tr><th scope="col">{t("colCharset")}</th><th scope="col">{t("colByteCount")}</th><th scope="col">{t("colHex")}</th><th scope="col">{t("colMissing")}</th></tr></thead>
                      <tbody>
                        {everywhere.map((w) => (
                          <tr key={w.charset} className={w.charset === encCs ? "cs-row-current" : w.unencodable ? "cs-row-missing" : undefined}>
                            <th scope="row">{csName(w.charset)}</th>
                            <td className="cs-num">{w.bytes.length}</td>
                            <td><code>{hexCell(w.bytes)}</code></td>
                            <td className="cs-num">{w.unencodable || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* The bytes read back in every charset: the mojibake each wrong guess makes. */}
              {readBack && !enc.failed && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("readBackTitle", { charset: csName(encCs) })}</h4>
                  <p className="tcl-muted tcl-small">{t("readBackHelp")}</p>
                  <div className="tcl-table-wrap">
                    <table className="tcl-table cs-table">
                      <thead><tr><th scope="col">{t("colCharset")}</th><th scope="col">{t("colReading")}</th><th scope="col">{t("colReplaced")}</th></tr></thead>
                      <tbody>
                        {readBack.map((r) => (
                          <tr key={r.charset} className={r.charset === encCs ? "cs-row-current" : r.charset === highlight ? "cs-row-highlight" : undefined}>
                            <th scope="row">{csName(r.charset)}</th>
                            <td className="cs-reading"><Shown text={r.text} inline />{r.codePoints > r.text.length && " …"}</td>
                            <td className="cs-num">{r.errors || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {mode === "decode" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("bytesLabel")}</span>
            <textarea id="cs-bytes" className="cidr-input mono tcl-short" rows={4} maxLength={262144} value={bytesIn} placeholder={t("bytesPlaceholder")} onChange={(e) => { setBytesIn(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <div className="tcl-fields">
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("formatLabel")}</span>
              <select id="cs-format" className="cidr-input tcl-select" value={format} onChange={(e) => { setFormat(e.target.value as ByteFormat); setActive(undefined); }}>
                {FORMATS.map((f) => <option key={f} value={f}>{t(`format.${f}`)}</option>)}
              </select>
            </label>
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("charsetLabel")}</span>
              {charsetSelect("cs-dec-charset", decCs, (v) => { setDecCs(v); setActive(undefined); }, true)}
            </label>
            <label className="tcl-check"><input id="cs-sniff" type="checkbox" checked={sniff} onChange={(e) => { setSniff(e.target.checked); setActive(undefined); }} />{t("sniffLabel")}</label>
          </div>
          <TclPresets items={DECODE_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          {parsed && bytesIn.trim() !== "" && (
            <div className="cs-report" aria-live="polite">
              {/* What was read from the box. */}
              {parsed.error
                ? <p className="tcl-verdict tcl-verdict-bad">{t(`parseError.${parsed.error.kind}`, { at: parsed.error.at + 1 })}</p>
                : <p className="tcl-outcome">{t("readAs", { n: parsed.bytes.length, format: t(`readFormat.${parsed.dump ?? parsed.format}`) })}</p>}
              {parsed.utf8Literals && <p className="tcl-muted tcl-small">{t("utf8Literals")}</p>}
              {parsed.urlSafe && <p className="tcl-muted tcl-small">{t("urlSafe")}</p>}

              {dec && (
                <>
                  {/* The guess, the byte order mark, the counts. */}
                  {dec.guess && <p className={`tcl-verdict ${dec.guess.charset ? "tcl-verdict-ok" : "tcl-verdict-warn"}`}>{t(`guess.${dec.guess.reason}`, { charset: dec.guess.charset ? csName(dec.guess.charset) : "" })}</p>}
                  {dec.bom && <p className={dec.bomOverride ? "tcl-verdict tcl-verdict-warn" : "tcl-muted tcl-small"}>{t(dec.bomOverride ? "bomOverride" : "bomFound", { charset: csName(dec.bom.charset), n: dec.bom.length })}</p>}
                  {dec.charset && (
                    <>
                      <p className="tcl-outcome">{t("decSummary", { cps: dec.codePoints, bytes: dec.byteCount, charset: csName(dec.charset) })}</p>
                      {browserNote(dec.charset)}
                      {dec.truncated && <p className="tcl-muted tcl-small">{t("truncatedBytes")}</p>}
                      <p className={`tcl-verdict ${dec.errors ? "tcl-verdict-warn" : "tcl-verdict-ok"}`}>{dec.errors ? t("decErrors", { n: dec.errors }) : t("decClean")}</p>

                      {/* The text. */}
                      <section className="jwt-panel">
                        <h4 className="jwt-panel-title">{t("textTitle")}</h4>
                        <div className="tcl-fields"><button type="button" className="b64-copy" onClick={() => copy("text", dec.text)}>{copied === "text" ? t("copied") : t("copy")}</button></div>
                        <div className="uni-reveal cs-text" dir="ltr"><Shown text={dec.text} /></div>
                      </section>

                      {/* What was replaced, by reason. */}
                      {dec.errors > 0 && (
                        <section className="jwt-panel">
                          <h4 className="jwt-panel-title">{t("errorsTitle")}</h4>
                          <ul className="tcl-notes">
                            {[...new Set(dec.units.filter((u) => u.error).map((u) => u.error as DecodeError))].map((kind) => {
                              // The sequences of this kind.
                              const list = dec.units.filter((u) => u.error === kind);
                              // One note per kind, with up to eight places.
                              return <li key={kind} className="tcl-note uni-finding uni-tag-replacement"><span className="tcl-verdict-label">{t("errorCount", { n: list.length })}</span>{t(`error.${kind}`)} <span className="tcl-muted tcl-small">{t("errorAt", { places: list.slice(0, 8).map((u) => `${u.at} (${hexCell(Array.from(parsed.bytes.slice(u.at, u.at + u.len)))})`).join(", ") + (list.length > 8 ? ", …" : "") })}</span></li>;
                            })}
                          </ul>
                        </section>
                      )}

                      {/* Byte by byte. */}
                      <section className="jwt-panel">
                        <h4 className="jwt-panel-title">{t("unitsTitle")}</h4>
                        {dec.codePoints > dec.units.length && <p className="tcl-muted tcl-small">{t("rowsCapped", { n: MAX_ROWS })}</p>}
                        <div className="tcl-table-wrap">
                          <table className="tcl-table cs-table">
                            <thead><tr><th scope="col">{t("colOffset")}</th><th scope="col">{t("colBytesPlain")}</th><th scope="col">{t("colChar")}</th><th scope="col">{t("colCp")}</th></tr></thead>
                            <tbody>
                              {dec.units.map((u) => (
                                <tr key={u.at} className={u.error ? "cs-row-missing" : undefined}>
                                  <td className="cs-num">{u.at}</td>
                                  <td><code>{hexCell(Array.from(parsed.bytes.slice(u.at, u.at + u.len)))}</code></td>
                                  <td className="cs-char"><Shown text={String.fromCodePoint(u.cp)} inline /></td>
                                  <td><code>{label(u.cp)}</code>{u.error && <span className="tcl-muted tcl-small"> {t(`errorShort.${u.error}`)}</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </>
                  )}
                </>
              )}

              {/* The same bytes in every charset. */}
              {readings && readings.length > 0 && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("readingsTitle")}</h4>
                  <p className="tcl-muted tcl-small">{t("readingsHelp")}</p>
                  <div className="tcl-table-wrap">
                    <table className="tcl-table cs-table">
                      <thead><tr><th scope="col">{t("colCharset")}</th><th scope="col">{t("colReading")}</th><th scope="col">{t("colReplaced")}</th></tr></thead>
                      <tbody>
                        {readings.map((r) => (
                          <tr key={r.charset} className={r.charset === dec?.charset ? "cs-row-current" : undefined}>
                            <th scope="row">{csName(r.charset)}</th>
                            <td className="cs-reading"><Shown text={r.text} inline />{r.codePoints > r.text.length && " …"}</td>
                            <td className="cs-num">{r.errors || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {mode === "repair" && (
        <>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("garbledLabel")}</span>
            <textarea id="cs-garbled" className="cidr-input mono tcl-short" rows={3} maxLength={20000} value={garbled} placeholder={t("garbledPlaceholder")} onChange={(e) => { setGarbled(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <TclPresets items={REPAIR_PRESETS.map((p) => ({ id: p.id, label: t(`preset.${p.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />
          <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>

          {rep && (
            <div className="cs-report" aria-live="polite">
              {rep.truncated && <p className="tcl-muted tcl-small">{t("truncatedRepair")}</p>}
              {rep.candidates.length === 0 ? (
                <div className="tcl-verdict tcl-verdict-warn">
                  <p className="chr-verdict-title">{t("repairNone")}</p>
                  <p>{t(rep.inputScore === 0 ? "repairNoneClean" : "repairNoneHelp")}</p>
                </div>
              ) : rep.candidates.map((c, i) => (
                <section key={c.text} className={`jwt-panel ${i === 0 ? "cs-best" : ""}`}>
                  <h4 className="jwt-panel-title">{i === 0 ? t("repairBest") : t("repairOther", { n: i + 1 })}</h4>
                  <div className="uni-reveal cs-text" dir="ltr"><Shown text={c.text} /></div>
                  <ol className="cs-steps">
                    {[...c.steps].reverse().map((s, k) => <li key={k}>{t("stepLine", { original: csName(s.original), misread: csName(s.misread) })}</li>)}
                  </ol>
                  <p className={`tcl-verdict ${c.evidence === "utf8" && !c.lossy ? "tcl-verdict-ok" : "tcl-verdict-warn"}`}>{t(`evidence.${c.evidence}`)}{c.lossy && <> {t("lossy", { n: c.lost })}</>}</p>
                  <div className="tcl-fields">
                    <button type="button" className="b64-copy" onClick={() => copy(`rep-${i}`, c.text)}>{copied === `rep-${i}` ? t("copied") : t("copy")}</button>
                    {!c.lossy && <button type="button" className="b64-copy" onClick={() => { setMode("encode"); setText(c.text); setEncCs(c.steps[c.steps.length - 1].original); setBom(false); setPolicy("replace"); setHighlight(c.steps[c.steps.length - 1].misread); setActive(undefined); }}>{t("showGarbling")}</button>}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
