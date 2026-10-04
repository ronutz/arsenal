"use client";

// ============================================================================
// src/components/ChmodPermissionCalculatorTool.tsx
// ----------------------------------------------------------------------------
// THE CHMOD PERMISSION CALCULATOR (page UI). Type a mode any way you know it,
// octal (4755), an ls string (-rwsr-xr-x) or chmod clauses on a base
// (g+s,o-rwx), say whether it is a file or a directory, and read it back every
// other way: the four octal digits, the ls string, a grid of the twelve bits
// you can click to flip, the plain reading per class, what the special bits
// mean here, the flags worth a second look, the chmod commands that reach the
// mode, the umask that would create it, and, for symbolic input, a trace of
// each clause.
//
// All answers come from src/lib/tools/chmod-permission-calculator; this
// component lays them out and words them. Clicking a bit in the grid rewrites
// the input as the resulting four-digit octal mode, so the trace of a symbolic
// expression is replaced by the mode it reached; that is the honest thing to
// show once the user has edited the bits by hand.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type ChmodResult, type Kind, type Who } from "@/lib/tools/chmod-permission-calculator";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "symbolic-setgid-dir";

/** The three classes, in display order. */
const WHO: Who[] = ["owner", "group", "other"];

/** The three permission bits, in display order. */
const PERMS = ["read", "write", "execute"] as const;
// The letter each bit shows in the grid when it is on: the ls letters r, w and x
// (not the first letter of the English word, which would print "e" for execute).
const LS_LETTER: Record<(typeof PERMS)[number], string> = { read: "r", write: "w", execute: "x" };

/** Bit values per class and permission (owner read = 0o400 ... other execute = 0o1). */
const BIT: Record<Who, Record<(typeof PERMS)[number], number>> = {
  owner: { read: 0o400, write: 0o200, execute: 0o100 },
  group: { read: 0o040, write: 0o020, execute: 0o010 },
  other: { read: 0o004, write: 0o002, execute: 0o001 },
};

/** The special bits. */
const SPECIAL: Record<"setuid" | "setgid" | "sticky", number> = { setuid: 0o4000, setgid: 0o2000, sticky: 0o1000 };

/** The page component. */
export default function ChmodPermissionCalculatorTool() {
  // This tool's words.
  const t = useTranslations("tools.chmod-permission-calculator");
  // The example vector.
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;
  // The mode as typed.
  const [mode, setMode] = useState(example.input.mode);
  // File or directory.
  const [kind, setKind] = useState<Kind>(example.input.kind ?? "file");
  // The base for symbolic clauses (blank means the kind's default).
  const [base, setBase] = useState(example.input.base ?? "");
  // The umask for clauses with no class (blank means 022).
  const [umask, setUmask] = useState(example.input.umask ?? "");
  // Which answer was copied last, for the button label.
  const [copied, setCopied] = useState<string | null>(null);
  // The answer, recomputed as anything changes.
  const r: ChmodResult = useMemo(() => run({ mode, kind, base: base || undefined, umask: umask || undefined }), [mode, kind, base, umask]);
  // Copy a command.
  const copy = async (key: string, text: string) => {
    // Clipboard may be unavailable (insecure context); the button then does nothing visible.
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch { /* no clipboard */ }
  };
  // Flip one bit: rewrite the input as the resulting four-digit octal mode.
  const flip = (bit: number) => {
    // Only when the current input reads; otherwise there is nothing to flip.
    if (!r.ok) return;
    // The new value.
    const v = (r.value ^ bit) & 0o7777;
    // Four digits whenever a special bit is set, three otherwise, as chmod would take it.
    setMode(v & 0o7000 ? v.toString(8).padStart(4, "0") : v.toString(8).padStart(3, "0"));
    // A flipped bit describes a mode, not a clause: the base no longer applies.
    setBase("");
  };
  // Load the example.
  const loadExample = () => { setMode(example.input.mode); setKind(example.input.kind ?? "file"); setBase(example.input.base ?? ""); setUmask(example.input.umask ?? ""); };
  // Clear everything.
  const clear = () => { setMode(""); setBase(""); setUmask(""); };
  // The plain reading of one class: the list of what it may do, or "nothing".
  const reading = (who: Who): string => {
    // The bits of this class.
    const c = r.classes[who];
    // The verbs that apply, in order.
    const verbs = PERMS.filter((p) => c[p]).map((p) => t(`verb.${kind}.${p}`));
    // Composed in the page's language.
    if (verbs.length === 0) return t("readingNone", { who: t(`who.${who}`) });
    if (verbs.length === 1) return t("readingOne", { who: t(`who.${who}`), a: verbs[0] });
    if (verbs.length === 2) return t("readingTwo", { who: t(`who.${who}`), a: verbs[0], b: verbs[1] });
    return t("readingThree", { who: t(`who.${who}`), a: verbs[0], b: verbs[1], c: verbs[2] });
  };
  // Draw.
  return (
    <div className="cidr-tool jwt-tool chmod-tool">
      {/* The mode, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="chmod-mode">{t("modeLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
          </div>
        </div>
        <input id="chmod-mode" className="cidr-input mono" value={mode} onChange={(e) => setMode(e.target.value)} placeholder={t("modePlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" maxLength={64} />
        <p className="hmac-build-note">{t("modeHint")}</p>
      </div>

      {/* File or directory: it changes what the bits mean and what X does. */}
      <div className="seg-group" role="group" aria-label={t("kindLabel")}>
        <div className="seg">
          {(["file", "directory"] as Kind[]).map((k) => (
            <button key={k} type="button" className={`seg-btn${kind === k ? " seg-btn--active" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{t(`kind.${k}`)}</button>
          ))}
        </div>
      </div>

      {/* The base and umask for symbolic clauses. */}
      <div className="chmod-fields">
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="chmod-base">{t("baseLabel")}</label>
          <input id="chmod-base" className="cidr-input mono" value={base} onChange={(e) => setBase(e.target.value)} placeholder={kind === "directory" ? "755" : "644"} spellCheck={false} autoComplete="off" maxLength={64} />
          <p className="hmac-build-note">{t("baseHint")}</p>
        </div>
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="chmod-umask">{t("umaskLabel")}</label>
          <input id="chmod-umask" className="cidr-input mono" value={umask} onChange={(e) => setUmask(e.target.value)} placeholder="022" spellCheck={false} autoComplete="off" maxLength={64} />
          <p className="hmac-build-note">{t("umaskHint")}</p>
        </div>
      </div>

      {/* An input that could not be read. */}
      {!r.ok && r.error && r.error !== "empty" && (
        <p className="tcl-verdict tcl-verdict-bad" role="status">{t(`error.${r.error}`, { at: r.errorAt ?? "" })}</p>
      )}

      {/* The reading. */}
      {r.ok && (
        <div className="jwt-results" aria-live="polite">
          {/* The two headline spellings. */}
          <section className="jwt-panel chmod-headline">
            <div className="chmod-big">
              <span className="chmod-big-octal mono">{r.octal4}</span>
              <span className="chmod-big-ls mono">{r.ls}</span>
            </div>
            <p className="hmac-build-note">{t("form." + (r.form ?? "octal"))} · {t("binaryLabel")} <span className="mono">{r.binary}</span> · {t("decimalLabel")} <span className="mono">{r.value}</span></p>
          </section>

          {/* The bit grid: click a cell to flip it. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("gridTitle")}</h4>
            <div className="cidr-table-wrap">
              <table className="cidr-table chmod-grid">
                <thead>
                  <tr>
                    <th scope="col">{t("gridClass")}</th>
                    {PERMS.map((p) => <th scope="col" key={p}>{t(`perm.${p}`)}</th>)}
                    <th scope="col">{t("gridOctal")}</th>
                    <th scope="col">{t("gridReading")}</th>
                  </tr>
                </thead>
                <tbody>
                  {WHO.map((who) => (
                    <tr key={who}>
                      <th scope="row">{t(`who.${who}`)}</th>
                      {PERMS.map((p) => (
                        <td key={p}>
                          <button type="button" className={`chmod-bit${r.classes[who][p] ? " chmod-bit--on" : ""}`} aria-pressed={r.classes[who][p]} onClick={() => flip(BIT[who][p])} title={t("flipTitle")}>
                            {r.classes[who][p] ? LS_LETTER[p] : "-"}
                          </button>
                        </td>
                      ))}
                      <td className="mono">{((r.value >> (who === "owner" ? 6 : who === "group" ? 3 : 0)) & 7).toString()}</td>
                      <td className="chmod-reading">{reading(who)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* The special bits, with what each means for this kind. */}
            <div className="chmod-specials">
              {(["setuid", "setgid", "sticky"] as const).map((sName) => (
                <button key={sName} type="button" className={`chmod-special${r.special[sName] ? " chmod-special--on" : ""}`} aria-pressed={r.special[sName]} onClick={() => flip(SPECIAL[sName])}>
                  <span className="chmod-special-name mono">{t(`special.${sName}.name`)}</span>
                  <span className="chmod-special-value mono">{SPECIAL[sName].toString(8)}</span>
                  <span className="chmod-special-meaning">{t(`special.${sName}.${kind}`)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Flags worth a second look. */}
          {r.flags.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("flagsTitle")}</h4>
              <ul className="tcl-findings chmod-flags">
                {r.flags.map((f) => (
                  <li key={f} className={`tcl-finding tcl-finding-${/world-writable|setid-world|without-read/.test(f) ? "warning" : "info"}`}>
                    <span className={`irl-sev irl-sev-${/world-writable-file|setid-world/.test(f) ? "high" : /world-writable|without|less-than/.test(f) ? "warning" : "info"}`}>{t(/world-writable-file|setid-world/.test(f) ? "sev.high" : /world-writable|without|less-than/.test(f) ? "sev.warning" : "sev.info")}</span>
                    <span className="tcl-finding-msg">{t(`flag.${f}`)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The commands. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("commandsTitle")}</h4>
            <ul className="chmod-commands">
              {([["octal", r.commands.octal], ["symbolicAbsolute", r.commands.symbolicAbsolute], ["fromBase", r.commands.fromBase ?? ""]] as [string, string][]).filter(([, c]) => c).map(([k, c]) => (
                <li key={k} className="chmod-command">
                  <span className="chmod-command-label">{t(`command.${k}`)}</span>
                  <code className="chmod-command-code">{c}</code>
                  <button type="button" className="b64-copy" onClick={() => copy(k, c)}>{copied === k ? t("copied") : t("copy")}</button>
                </li>
              ))}
            </ul>
            <p className="hmac-build-note">
              {r.umaskEquivalent.umask
                ? t("umaskYes", { umask: r.umaskEquivalent.umask, def: kind === "directory" ? "777" : "666" })
                : t(`umaskNo.${r.umaskEquivalent.reason ?? "special-bits"}`)}
            </p>
          </section>

          {/* The clause trace, for symbolic input. */}
          {r.steps && r.steps.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("traceTitle", { base: r.base ?? "", umask: r.umaskUsed ?? "022" })}</h4>
              <div className="cidr-table-wrap">
                <table className="cidr-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("traceClause")}</th>
                      <th scope="col">{t("traceWho")}</th>
                      <th scope="col">{t("traceOp")}</th>
                      <th scope="col">{t("tracePerm")}</th>
                      <th scope="col">{t("traceAfter")}</th>
                      <th scope="col">{t("traceNotes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.steps.map((s, i) => (
                      <tr key={i}>
                        <td className="mono">{s.clause}</td>
                        <td className="mono">{s.whoOmitted ? t("traceWhoOmitted", { who: s.who }) : s.who}</td>
                        <td className="mono">{s.op}</td>
                        <td className="mono">{s.perm || t("traceEmptyPerm")}</td>
                        <td className="mono">{s.after}</td>
                        <td>{s.notes.map((n) => t(`note.${n}`)).join(" ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* What the calculator does not know. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
