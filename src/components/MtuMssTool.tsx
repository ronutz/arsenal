// ============================================================================
// src/components/MtuMssTool.tsx
// ----------------------------------------------------------------------------
// UI for the MTU / MSS calculator. One input line: a link MTU plus optional
// stack tokens ("1500 vxlan vlan", "1500 gre v6", "1500 +57"). The engine in
// src/lib/tools/mtu-mss does all arithmetic; this component only renders.
//
// The layout teaches the tool's core lesson visually: encapsulations appear
// in the breakdown as "inside the MTU" (they shrink the inner MTU/MSS), MPLS
// labels as "inside the frame payload" (RFC 3032 section 3.1: they shrink the
// IP packet unless the link MTU is raised; corrected 2026-10-19), while
// 802.1Q / QinQ shims appear as "on the frame" (they grow the frame, MTU
// untouched).
// Styling reuses the established tool vocabulary (cidr-* input stack,
// jwt-results panels, cipher-note) - no new CSS classes (D-19 / CSS rule), but
// for the touch-size modifier of the button rows added on 03/11/2026 below.
//
// SHARE RESULTS (2026-10-27): a button at the end of the headline panel builds,
// only when pressed, a link carrying the input line as typed (spec:
// src/lib/tools/mtu-mss/share.ts). An arriving link (useShareArrival) fills the
// box as a paste would and the page computes; the address loses the value at
// once.
//
// WITHOUT A KEYBOARD (03/11/2026): the line is still typed, and three controls
// write it for a mouse or a finger. A down and an up arrow beside the field
// (src/components/NumberStepper.tsx, and Arrow Up and Down) step the leading
// MTU, 68 to 65535 as the engine reads it, keeping the tokens after it; two
// buttons set the MTU to the engine's own reference points, 1500 and 9000; and
// a row of pressed-or-not buttons adds or removes each stack token the grammar
// accepts (an alias typed by hand, such as wg or dot1q, shows its button
// pressed). Counted tokens (mpls2 to mpls8, +N) stay typed. The chips reuse the
// site's preset-chip vocabulary (tcl-presets-row, tcl-chip), 44 px tall on a touch screen
// (tcl-presets-row--tap).
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, MtuCalcError, type MtuCalcResult } from "@/lib/tools/mtu-mss";
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { MTU_MSS_SHARE } from "@/lib/tools/mtu-mss/share"; // this tool's share spec: the input line

/** Nothing to share (the button is disabled). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // a constant, so the button sees no change

// D-83 Example sample - verbatim from this tool's golden vectors
// (vxlan-1500): the canonical overlay question, 1450 inner / 1550 underlay.
const EXAMPLE = "1500 vxlan";

/** The MTU range the engine reads (RFC 791's 68 to the 16-bit maximum). */
const MTU_BOUNDS = { min: 68, max: 65535, step: 1, integer: true } as const; // compute.ts MTU_MIN and MTU_MAX, whole bytes

/** The reference MTUs the engine itself measures every line against (its efficiency rows). */
const MTU_PRESETS = [1500, 9000] as const; // ref1500 and ref9000

/** Each stack token the grammar accepts as a plain word, with the aliases it also reads (lower case). */
const STACK_TOKENS: readonly { token: string; aliases: RegExp }[] = [
  { token: "v6", aliases: /^(v6|ipv6)$/ }, // the outer header is IPv6
  { token: "pppoe", aliases: /^pppoe$/ }, // PPPoE
  { token: "gre", aliases: /^gre$/ }, // GRE
  { token: "ipip", aliases: /^ipip$/ }, // IP in IP
  { token: "6in4", aliases: /^(6in4|sit)$/ }, // 6in4 (sit)
  { token: "vxlan", aliases: /^vxlan$/ }, // VXLAN
  { token: "geneve", aliases: /^geneve$/ }, // GENEVE
  { token: "wireguard", aliases: /^(wireguard|wg)$/ }, // WireGuard (wg)
  { token: "vlan", aliases: /^(vlan|dot1q)$/ }, // 802.1Q (dot1q)
  { token: "qinq", aliases: /^qinq$/ }, // QinQ
  { token: "mpls", aliases: /^mpls\d?$/ }, // one MPLS label (mpls2 to mpls8 count more, and are typed)
]; // the order of the grammar in compute.ts

/**
 * The line's leading MTU and the tokens after it ("1500 vxlan vlan" gives "1500" and ["vxlan", "vlan"]).
 *
 * @param line the line as typed
 * @returns the MTU's text ("" when the line does not start with a number) and the other tokens, as typed
 */
function splitLine(line: string): { mtu: string; tokens: string[] } {
  // Every whitespace-separated token, as the engine splits them.
  const all = line.trim().split(/\s+/).filter((x) => x !== "");
  // The first one is the MTU when it is digits.
  return all.length > 0 && /^\d+$/.test(all[0]) ? { mtu: all[0], tokens: all.slice(1) } : { mtu: "", tokens: all };
}

/**
 * A line written back from its parts.
 *
 * @param mtu the MTU's text ("" for none)
 * @param tokens the tokens after it
 * @returns "1500 vxlan", or just the tokens when there is no MTU
 */
function joinLine(mtu: string, tokens: string[]): string {
  // The non-empty parts, one space apart.
  return [mtu, ...tokens].filter((x) => x !== "").join(" ");
}

export default function MtuMssTool() {
  const t = useTranslations("tools.mtu-mss");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<MtuCalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof MtuCalcError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (raw: string) => {
      setValue(raw);
      compute(raw);
    },
    [compute],
  );

  // An arriving share link: the line fills the box as a paste would, and the page computes.
  useShareArrival(MTU_MSS_SHARE, (state) => onChange(state.input)); // the line
  // What Share results may carry: the line, only while there is a result.
  const share = useMemo<ShareEncoding>(() => (result ? MTU_MSS_SHARE.encode({ input: value }) : NOTHING), [result, value]); // memoised

  // ---- Without a keyboard (03/11/2026): the line's parts, and setters that write it as typing would. ----
  /** The leading MTU and the tokens after it. */
  const parts = splitLine(value); // as typed
  /** Set the MTU, keeping the tokens (from the arrows, or a reference button). */
  const setMtu = (mtu: string) => onChange(joinLine(mtu, parts.tokens)); // "1501 vxlan"
  /**
   * Add a stack token, or remove it (with any alias of it) when the line has it.
   *
   * @param entry the token and its aliases
   */
  const toggleToken = (entry: (typeof STACK_TOKENS)[number]) => {
    // Whether the line already has it, under any of its spellings.
    const has = parts.tokens.some((x) => entry.aliases.test(x.toLowerCase()));
    // Removed (every spelling), or added at the end.
    onChange(joinLine(parts.mtu, has ? parts.tokens.filter((x) => !entry.aliases.test(x.toLowerCase())) : [...parts.tokens, entry.token]));
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="mtu-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        {/* Up and down arrows: the leading MTU, one byte a press, 68 to 65535; the tokens after it stay. */}
        <StepperField value={parts.mtu} onValue={setMtu} {...MTU_BOUNDS} label={t("inputLabel")} inputId="mtu-input">
          <input
            id="mtu-input"
            className="cidr-input mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the MTU from the keyboard.
            onKeyDown={stepperKeyDown({ value: parts.mtu, onValue: setMtu, ...MTU_BOUNDS })}
            placeholder={t("inputPlaceholder")}
            aria-describedby="mtu-privacy"
            autoComplete="off"
            spellCheck={false}
          />
        </StepperField>
        {/* The engine's two reference MTUs, set in one press (the tokens stay). */}
        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("mtuPresetsLabel")}>
          {MTU_PRESETS.map((m) => (
            <button key={m} type="button" className="tcl-chip mono" aria-pressed={parts.mtu === String(m)} onClick={() => setMtu(String(m))}>
              {m}
            </button>
          ))}
        </div>
        {/* Each stack token the grammar accepts: pressed when the line has it; a press adds or removes it. */}
        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("tokensLabel")}>
          {STACK_TOKENS.map((entry) => (
            <button key={entry.token} type="button" className="tcl-chip mono" aria-pressed={parts.tokens.some((x) => entry.aliases.test(x.toLowerCase()))} onClick={() => toggleToken(entry)}>
              {entry.token}
            </button>
          ))}
        </div>
        <p id="mtu-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="jwt-results">
          {/* Inner MTU + MSS: the headline numbers. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("inner.heading")}</h4>
            <p>
              {t("inner.mtu")} <span className="mono">{result.innerMtu}</span>
              {" · "}
              {t("inner.mssV4")} <span className="mono">{result.mssV4}</span>
              {" · "}
              {t("inner.mssV6")} <span className="mono">{result.mssV6}</span>
            </p>
            {result.encapTotal > 0 && (
              <p className="cipher-note">
                {t("inner.encapNote", { total: result.encapTotal, outer: result.outer })}
              </p>
            )}
            {/* MPLS labels spend frame payload (RFC 3032 s3.1): say so, with the byte count. */}
            {result.labelTotal > 0 && (
              <p className="cipher-note">{t("inner.labelNote", { labels: result.labelTotal })}</p> // added 2026-10-19
            )}
            {result.innerIsV6Only && <p className="cipher-note">{t("inner.sixInFourNote")}</p>}
            {result.hasVariableLayer && <p className="cipher-note">{t("inner.variableNote")}</p>}
            {/* Share results: under the headline numbers it shares, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
          </section>

          {/* The stack breakdown, split by which side of the MTU each layer is on. */}
          {result.layers.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("stack.heading")}</h4>
              <ul>
                {result.layers.map((l, i) => (
                  <li key={`${l.id}-${i}`}>
                    <span className="mono">{t(`stack.labels.${l.id}`)}</span>{" "}
                    <span className="mono">+{l.bytes} B</span>{" "}
                    {/* Three sides of the MTU line: encap and label spend MTU, shim grows the frame. */}
                    {l.kind === "encap"
                      ? t("stack.insideMtu") // tunnel / session header inside the link MTU
                      : l.kind === "label"
                        ? t("stack.inPayload") // MPLS label stack inside the frame payload (RFC 3032 s3.1)
                        : t("stack.onFrame") /* 802.1Q / QinQ tag in the frame header */}
                  </li>
                ))}
              </ul>
              <p className="cipher-note">{t("stack.lesson")}</p>
            </section>
          )}

          {/* Frame arithmetic at the link. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("frame.heading")}</h4>
            <p>
              {t("frame.maxFrame")} <span className="mono">{result.frame.maxFrame}</span>
              {" · "}
              {t("frame.onWire")} <span className="mono">{result.frame.onWire}</span>
            </p>
            {result.shimTotal > 0 && (
              <p className="cipher-note">{t("frame.shimNote", { shims: result.shimTotal })}</p>
            )}
          </section>

          {/* The overlay design answer: required underlay for a full 1500 inner. */}
          {result.underlay && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("underlay.heading")}</h4>
              <p>
                {t("underlay.requiredMtu")}{" "}
                <span className="mono">{result.underlay.requiredMtu}</span>
                {" · "}
                {t("underlay.requiredFrame")}{" "}
                <span className="mono">{result.underlay.requiredFrame}</span>
              </p>
              <p className="cipher-note">{t("underlay.note")}</p>
            </section>
          )}

          {/* Wire efficiency: this MTU against the two canonical references. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("efficiency.heading")}</h4>
            <p>
              <span className="mono">{result.efficiency.atMtu.mtu}</span>{" "}
              {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.atMtu.percent}%</span>
              {" · "}
              <span className="mono">1500</span> {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.ref1500.percent}%</span>
              {" · "}
              <span className="mono">9000</span> {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.ref9000.percent}%</span>
            </p>
            <p className="cipher-note">{t("efficiency.note")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
