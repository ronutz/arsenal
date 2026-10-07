"use client";

// ============================================================================
// src/components/HomeQuickCidr.tsx
// ----------------------------------------------------------------------------
// TRY SOMETHING NOW (2026-10-05, home page review items 5, 6 and 21, PRIME's
// decision). The front door's first promise is a tool that runs on the
// reader's machine, so the second screen is one: a single CIDR field that
// answers the four questions a subnet raises (network, broadcast, usable
// range, hosts) as the reader types, with the privacy sentence beside the
// result rather than in a section of its own three screens away. The full
// calculator (subnets, VLSM, overlaps, the Learn panel, the sources) lives at
// /tools/cidr; this is the smallest honest piece of it, computed by the same
// pure engine (src/lib/tools/cidr/compute.ts), so the two cannot disagree.
// Nothing is sent anywhere; there is nothing to send it to.
//
// CLEAR (PRIME 2026-10-06 16:35: "place a CLEAR button next to the user-input
// field so the field's value is quickly cleared"): beside the field, in the same
// group so it stays beside it at phone width; one click empties the field and
// puts the caret back in it, ready for the reader's own block; dimmed, never
// hidden, while the field is already empty. The example stays in the
// placeholder, so an emptied field still shows what to type.
//
// LIVE AT EVERY KEYSTROKE (PRIME 2026-10-06 17:46: "the text 'Type a block and
// read the answer as you type' is incorrect, as nothing changes as one types -
// only after hitting ENTER"). Tested on production that minute: the answer did
// follow the typing, but only from the keystroke that completed the block, so
// for a dozen keystrokes nothing visibly reacted, the answer landed exactly when
// the reader reached for Enter, and a one-digit prefix on its way to two digits
// flashed a block nobody meant (/2 on the way to /24). Three changes make the
// promise true:
//   - a hint under the field that answers EVERY keystroke: what to type next,
//     or why the text cannot become a block (an octet over 255, a prefix over
//     32, a stray character), until the block is whole and the answers replace
//     it;
//   - a short settle (SETTLE_MS) before showing a block whose prefix is a single
//     1, 2 or 3, the only prefixes that can still grow into another valid one;
//     every other complete block answers at once;
//   - Enter means something: on a bare address it adds /32 (that single host),
//     and on a settling block it answers at once.
// The answers for a whole block are DERIVED in the same render as the keystroke
// (found in the Portuguese check of 2026-10-06: computed one effect later, the
// box showed "Reading the prefix…" for a frame after /24, and the block before
// an edit for a frame after it); only the settle keeps state, and a settled
// answer counts only while the text is still the one it was computed for.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cidrAnalyze, type SubnetAnalysis } from "@/lib/tools/cidr/compute";

/** The opening example: a /24 everyone has seen. */
const EXAMPLE = "192.168.1.0/24";

/** How long a block whose one-digit prefix could still grow waits before it answers. */
const SETTLE_MS = 450;

/** What the hint line says about the text so far; null once the text is a whole block. */
type Hint =
  | { key: "quickHintEmpty" | "quickHintAddress" | "quickHintPrefix" | "quickHintPrefixLength" | "quickHintShape" }
  | { key: "quickHintOctet"; octet: string }
  | { key: "quickHintPrefixRange"; prefix: string };

/** Read the text as far as it goes, the way a person reads a half-typed block: what is still missing, or what is wrong. */
function hintFor(raw: string): Hint | null {
  const s = raw.trim();
  // Nothing typed yet.
  if (s === "") return { key: "quickHintEmpty" };
  // At most one slash, and only digits and dots before it.
  const pieces = s.split("/");
  if (pieces.length > 2) return { key: "quickHintShape" };
  const [addr, prefix] = pieces;
  const octets = addr.split(".");
  if (octets.length > 4 || octets.some((o) => o !== "" && !/^\d{1,3}$/.test(o))) return { key: "quickHintShape" };
  // An octet already over 255 cannot be rescued by typing more.
  const big = octets.find((o) => o !== "" && Number(o) > 255);
  if (big !== undefined) return { key: "quickHintOctet", octet: big };
  // The four octets, all present.
  const addressWhole = octets.length === 4 && octets.every((o) => o !== "");
  if (prefix === undefined) return addressWhole ? { key: "quickHintPrefix" } : { key: "quickHintAddress" };
  // A slash before the address is whole is out of order.
  if (!addressWhole) return { key: "quickHintShape" };
  if (prefix === "") return { key: "quickHintPrefixLength" };
  if (!/^\d{1,2}$/.test(prefix)) return /^\d+$/.test(prefix) ? { key: "quickHintPrefixRange", prefix } : { key: "quickHintShape" };
  if (Number(prefix) > 32) return { key: "quickHintPrefixRange", prefix };
  // A whole block.
  return null;
}

/** The analysis of a whole block, or null (the hint has already said why). */
function analyse(text: string): SubnetAnalysis | null {
  try {
    return cidrAnalyze(text.trim());
  } catch {
    return null;
  }
}

export default function HomeQuickCidr() {
  const t = useTranslations("home.front");
  // The page's locale, so the host count is grouped the way the reader's language groups digits (65,534 / 65.534).
  const locale = useLocale();
  // The field, as typed.
  const [value, setValue] = useState(EXAMPLE);
  // The field itself, so Clear can return the focus to it.
  const inputRef = useRef<HTMLInputElement>(null);
  // The hint for the text as typed: it changes on every keystroke.
  const hint = useMemo(() => hintFor(value), [value]);
  // A whole block whose one-digit prefix (1, 2 or 3) may still be the start of 10 to 32.
  const settling = hint === null && /\/[1-3]$/.test(value.trim());
  // Every other whole block answers in the same render as the keystroke that completed it.
  const immediate = useMemo(() => (hint === null && !settling ? analyse(value) : null), [value, hint, settling]);
  // A settling block's answers, once SETTLE_MS passes without another keystroke (or at Enter), tagged with the text
  // they belong to, so they never outlive it.
  const [settled, setSettled] = useState<{ text: string; analysis: SubnetAnalysis | null } | null>(null);
  useEffect(() => {
    // Only a settling block waits; anything else is already answered (or explained by the hint).
    if (!settling) return;
    // The next keystroke cancels this wait and starts its own.
    const id = window.setTimeout(() => setSettled({ text: value, analysis: analyse(value) }), SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [value, settling]);
  // What the answers show: the immediate block, or the settled one while the text is still the one it was read from.
  const shown = immediate ?? (settling && settled?.text === value ? settled.analysis : null);

  /** Enter: complete a bare address as its single host, or answer a settling block now. */
  const onEnter = () => {
    if (hint?.key === "quickHintPrefix") {
      setValue(`${value.trim()}/32`);
      return;
    }
    if (settling) setSettled({ text: value, analysis: analyse(value) });
  };

  /** The hint's words, with the offending piece where there is one. */
  const hintText = (h: Hint) =>
    h.key === "quickHintOctet" ? t(h.key, { octet: h.octet }) : h.key === "quickHintPrefixRange" ? t(h.key, { prefix: h.prefix }) : t(h.key);

  return (
    <div className="quick-cidr">
      <div className="quick-cidr-row">
        <label className="quick-cidr-label" htmlFor="home-cidr">{t("quickLabel")}</label>
        <span className="quick-cidr-field">
          <input
            ref={inputRef}
            id="home-cidr"
            className="cidr-input mono quick-cidr-input"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter has a job of its own (see onEnter); nothing else is intercepted.
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
            spellCheck={false}
            autoComplete="off"
            placeholder={EXAMPLE}
            aria-describedby="home-cidr-hint home-cidr-privacy"
          />
          {/* The visible word starts the accessible name (WCAG 2.5.3, label in name). */}
          <button
            type="button"
            className="quick-cidr-clear"
            onClick={() => {
              // Empty the field, then hand it back to the reader.
              setValue("");
              inputRef.current?.focus();
            }}
            disabled={value === ""}
            aria-label={t("quickClearLabel")}
            title={t("quickClearLabel")}
          >
            <span aria-hidden="true">×</span>
            {/* The word gives way to the cross alone on a narrow phone, where the field needs the room to show a
                whole block (seen at 320 px on 2026-10-06); the accessible name above does not change. */}
            <span className="quick-cidr-clear-word">{t("quickClear")}</span>
          </button>
        </span>
      </div>
      {/* The hint while the text is not yet a block, the four answers once it is; one live region for both, so a
          screen reader hears the progress without being interrupted on every keystroke. */}
      <div id="home-cidr-hint" className="quick-cidr-out" aria-live="polite">
        {hint !== null ? (
          <p className={`quick-cidr-waiting${hint.key === "quickHintOctet" || hint.key === "quickHintPrefixRange" || hint.key === "quickHintShape" ? " quick-cidr-waiting--wrong" : ""}`}>{hintText(hint)}</p>
        ) : shown ? (
          <dl className="quick-cidr-facts">
            <div className="quick-cidr-fact"><dt>{t("quickNetwork")}</dt><dd className="mono">{shown.network}</dd></div>
            <div className="quick-cidr-fact"><dt>{t("quickBroadcast")}</dt><dd className="mono">{shown.broadcast}</dd></div>
            <div className="quick-cidr-fact"><dt>{t("quickRange")}</dt><dd className="mono">{shown.firstHost} – {shown.lastHost}</dd></div>
            <div className="quick-cidr-fact"><dt>{t("quickHosts")}</dt><dd className="mono">{new Intl.NumberFormat(locale).format(shown.usableHosts)}</dd></div>
          </dl>
        ) : settling && settled?.text !== value ? (
          // The settle: the block is whole but its one-digit prefix may still grow.
          <p className="quick-cidr-waiting">{t("quickHintSettling")}</p>
        ) : (
          // A whole block the engine still refuses, settled or not (none known on 2026-10-06; leading zeros are read
          // as decimal): say what a block looks like rather than wait for nothing.
          <p className="quick-cidr-waiting quick-cidr-waiting--wrong">{t("quickHintShape")}</p>
        )}
      </div>
      {/* The privacy sentence, where the data is. */}
      <p id="home-cidr-privacy" className="quick-cidr-privacy">
        <span className="quick-cidr-dot" aria-hidden="true" />
        {/* One flex item for the sentence and its link, so a narrow screen wraps them as prose rather than as two columns. */}
        <span className="quick-cidr-privacy-text">{t("quickPrivacy")} <Link href="/privacy">{t("quickPrivacyLink")}</Link></span>
      </p>
      <p className="quick-cidr-more">
        <Link href="/tools/cidr" className="page-jump-link">{t("quickFull")} <span aria-hidden="true">&#8594;</span></Link>
        <Link href="/tools" className="quick-cidr-toolbox">{t("quickToolbox")} <span aria-hidden="true">&#8594;</span></Link>
      </p>
    </div>
  );
}
