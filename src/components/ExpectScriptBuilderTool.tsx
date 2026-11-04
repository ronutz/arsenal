"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/ExpectScriptBuilderTool.tsx
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT BUILDER (page UI, 2026-10-27, the Expect suite).
//
// A form (how to connect, how to log in, the device, the commands, timing and
// output) feeds the pure engine in src/lib/tools/expect-script-builder, and
// the page shows what it returns: the errors, field by field, when the input
// cannot be built; otherwise the script with Copy and Download, the notes the
// reader should know, what the script needs at run time, its exit statuses,
// each part of the script explained in the reader's language, the device
// profile it came from, and the verdict of the Expect script explainer, run
// on the script right here (the builder's promise: no error, no warning).
//
// D-83: the Example button loads the first golden vector's input verbatim;
// Clear empties the fields a reader fills in. Nothing leaves the browser.
//
// Share results (2026-11-01): a button under the script builds a link that
// carries the form (every choice, and each text field the form shows), never
// the script, with a caution line, after the shared secrets check (src/lib/
// tools/expect-script-builder/share.ts). An arriving link (useShareArrival)
// sets the form as the reader would, the fields it does not carry at their
// defaults, and the page builds the script.
//
// No keyboard needed (03/11/2026): the ssh port and the two timeouts have up
// and down arrows (StepperField), whole numbers inside the engine's ranges
// (1 to 65535; 1 to LIMITS.maxTimeout seconds). Their labels now
// stand beside the fields (htmlFor) rather than around them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { build, defaultPaging, DEFAULT_INPUT, EXAMPLE, PROFILE_CHOICES, LIMITS, type BuilderInput, type BuilderError, type BuilderNote } from "@/lib/tools/expect-script-builder";
import { run as explain } from "@/lib/tools/expect-script-explainer";
import { getDeviceProfile } from "@/content/expect/device-profiles";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first finding and how many more places, for the popover
import { BUILDER_ARRIVAL_BASE, BUILDER_SHARE, checkBuilderText, encodeBuilderShare } from "@/lib/tools/expect-script-builder/share"; // this tool's share spec: the form
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for the port and the timeouts (03/11/2026)

/** The form state the page starts with: the defaults with the Example laid over them. */
const START: BuilderInput = { ...DEFAULT_INPUT, ...EXAMPLE };

/** What Clear leaves: the defaults with the reader's own fields emptied. */
const CLEARED: BuilderInput = { ...DEFAULT_INPUT, host: "", user: "", program: "", keyFile: "", commands: "" };

/** The authentication methods each transport allows, in the order the select lists them. */
const AUTH_BY_TRANSPORT: Record<BuilderInput["transport"], BuilderInput["auth"][]> = {
  ssh: ["key", "env", "ask"], // a key, or a password
  telnet: ["env", "ask"], // a password only
  program: ["none", "env", "ask"], // a program may ask for nothing
};

/** A copy button that says so for a moment after copying. */
function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  // Whether the copy just happened.
  const [ok, setOk] = useState(false);
  // The button.
  return (
    <button
      type="button"
      className="curl-copy"
      onClick={() => {
        // The clipboard may be unavailable (an insecure context); then nothing happens.
        try {
          // Copy.
          void navigator.clipboard.writeText(text);
          // Say so.
          setOk(true);
          // For a moment.
          setTimeout(() => setOk(false), 1200);
        } catch {
          // Clipboard unavailable: no-op.
        }
      }}
    >
      {ok ? done : label}
    </button>
  );
}

/** A download button that saves the script as a file, made in the browser. */
function DownloadButton({ text, label, name }: { text: string; label: string; name: string }) {
  // The button.
  return (
    <button
      type="button"
      className="curl-copy"
      onClick={() => {
        // A Blob of the script, as plain text.
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        // A temporary link that names the file.
        const a = document.createElement("a");
        // Where it points.
        a.href = url;
        // The file name.
        a.download = name;
        // Save.
        a.click();
        // Release the Blob.
        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </button>
  );
}

/** The page component. */
export default function ExpectScriptBuilderTool() {
  // This tool's words.
  const t = useTranslations("tools.expect-script-builder");
  // The form.
  const [s, setS] = useState<BuilderInput>(START);
  // The profile chosen, or undefined for the generic one.
  const profile = s.profile === "generic" ? undefined : getDeviceProfile(s.profile);
  // Which enable choices the profile allows.
  const enableChoices: BuilderInput["enable"][] = profile && profile.privilege.model === "enable" ? (profile.privilege.passwordPromptRegex ? ["no", "plain", "env", "ask"] : ["no", "plain"]) : ["no"];
  // Which paging choices it allows (its default first, so FortiOS lists "answer" before "off").
  const pagingChoices: BuilderInput["paging"][] = profile ? (profile.paging.morePrompt ? (defaultPaging(profile.id) === "answer" ? ["answer", "off"] : ["off", "answer"]) : ["off"]) : ["off", "none"];
  // Whether turning paging off on this profile changes the device's global configuration.
  const pagingGlobal = !!profile && profile.paging.off.some((c) => c.scope === "global-configuration");
  // Whether the paging setting outlives the session and the profile documents how to put it back.
  const restorable = !!profile && s.paging === "off" && profile.paging.off[profile.paging.off.length - 1].scope !== "session" && profile.paging.off.some((c) => c.restore !== null);

  /** Merge a change into the form, keeping the dependent choices valid. */
  const up = (patch: Partial<BuilderInput>) =>
    setS((cur) => {
      // The new state.
      const n = { ...cur, ...patch };
      // The transport decides which logins make sense.
      if (!AUTH_BY_TRANSPORT[n.transport].includes(n.auth)) n.auth = AUTH_BY_TRANSPORT[n.transport][0];
      // A port is ssh's only.
      if (n.transport !== "ssh") n.port = "";
      // A program has no host.
      if (n.transport === "program") n.hostFromArgv = false;
      // The profile decides enable and paging.
      const p = n.profile === "generic" ? undefined : getDeviceProfile(n.profile);
      // Enable only where the profile has it (and a password only where its question is documented).
      const en: BuilderInput["enable"][] = p && p.privilege.model === "enable" ? (p.privilege.passwordPromptRegex ? ["no", "plain", "env", "ask"] : ["no", "plain"]) : ["no"];
      // Fall back to no enable.
      if (!en.includes(n.enable)) n.enable = "no";
      // A new profile, with no paging choice in the same change: the profile's default (which leaves the configuration alone).
      if (patch.profile !== undefined && patch.profile !== cur.profile && patch.paging === undefined) n.paging = defaultPaging(n.profile, n.genericPagingCommand);
      // Paging choices for the profile.
      const pg: BuilderInput["paging"][] = p ? (p.paging.morePrompt ? ["off", "answer"] : ["off"]) : ["off", "none"];
      // Fall back to the profile's default when the choice is not available.
      if (!pg.includes(n.paging)) n.paging = defaultPaging(n.profile, n.genericPagingCommand);
      // The state.
      return n;
    });

  // The result, recomputed as the form changes.
  const r = useMemo(() => build(s), [s]);
  // The explainer's reading of the script (the builder's promise, shown).
  const verdict = useMemo(() => (r.ok ? explain({ script: r.script }) : null), [r]);

  // An arriving share link: the form is set as the reader would set it, the fields the link does not carry at their defaults.
  useShareArrival(BUILDER_SHARE, (fields) => setS({ ...BUILDER_ARRIVAL_BASE, ...fields })); // then the page builds
  // The secrets check over the text fields a link would carry, once per change.
  const secrets = useMemo(() => checkBuilderText(s), [s]); // field by field
  // What Share results carries: the form, nothing while it has errors, or blocked by a credential (memoised).
  const share = useMemo(() => encodeBuilderShare(s, r.ok, secrets), [s, r, secrets]); // the encoding
  // The caution line: the first secret-looking value with its field, or the general caution.
  const maybe = firstSharePlace(secrets.maybe); // the first maybe-secret
  // One line.
  const shareCaution = maybe ? t("share.maybeSecret", { field: maybe.field, line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution");
  // The blocked line, naming the field.
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { field: String(share.values?.field ?? ""), line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // only when blocked

  /** An error's sentence. */
  const errorText = (e: BuilderError) => t(`error.${e.field}.${e.code}`, { ...(e.params ?? {}) });
  /** A note's sentence. */
  const noteText = (n: BuilderNote) => t(`note.${n.code}`, { ...(n.params ?? {}) });
  /** The errors of one field, for aria-invalid. */
  const bad = (field: BuilderError["field"]) => r.errors.some((e) => e.field === field);

  // Draw.
  return (
    <div className="cidr-tool">
      {/* The Example / Clear row (D-83). */}
      <div className="curl-actions">
        <button type="button" className="cidr-example-btn" onClick={() => setS(START)}>{t("example")}</button>
        <button type="button" className="cidr-example-btn" onClick={() => setS(CLEARED)}>{t("clear")}</button>
      </div>

      <div className="curlb-form">
        {/* 1. How to connect. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.connect")}</div>
          <div className="curlb-chips" role="radiogroup" aria-label={t("field.transport")}>
            {(["ssh", "telnet", "program"] as const).map((x) => (
              <button key={x} type="button" role="radio" aria-checked={s.transport === x} className={"curlb-chip" + (s.transport === x ? " curlb-chip--on" : "")} onClick={() => up({ transport: x })}>
                {t(`transport.${x}`)}
              </button>
            ))}
          </div>
          <div className="curlb-grid">
            {/* ssh and telnet: the host, fixed or from the command line. */}
            {s.transport !== "program" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.host")}</span>
                <input className="curlb-input" value={s.host} disabled={s.hostFromArgv} aria-invalid={bad("host")} onChange={(e) => up({ host: e.target.value })} placeholder="sw1.example.net" spellCheck={false} autoComplete="off" />
              </label>
            )}
            {/* ssh: the port. */}
            {s.transport === "ssh" && (
              <div className="curlb-field curlb-field--narrow">
                {/* The label beside the field, tied by id. */}
                <label className="curlb-field-label" htmlFor="esb-port">{t("field.port")}</label>
                {/* Up and down arrows: whole numbers, 1 to 65535, as the engine checks a port. */}
                <StepperField value={s.port} onValue={(v) => up({ port: v })} min={1} max={65535} integer start={22} label={t("field.port")} inputId="esb-port">
                  <input id="esb-port" className="curlb-input" value={s.port} aria-invalid={bad("port")} onChange={(e) => up({ port: e.target.value })} onKeyDown={stepperKeyDown({ value: s.port, onValue: (v) => up({ port: v }), min: 1, max: 65535, integer: true, start: 22 })} placeholder="22" inputMode="numeric" spellCheck={false} autoComplete="off" />
                </StepperField>
              </div>
            )}
            {/* Another program: its command line. */}
            {s.transport === "program" && (
              <label className="curlb-field curlb-field--wide">
                <span className="curlb-field-label">{t("field.program")}</span>
                <input className="curlb-input curlb-data" value={s.program} aria-invalid={bad("program")} onChange={(e) => up({ program: e.target.value })} placeholder="cu -l /dev/ttyUSB0 -s 9600" spellCheck={false} autoComplete="off" />
              </label>
            )}
            {/* The user. */}
            <label className="curlb-field">
              <span className="curlb-field-label">{t(s.transport === "program" ? "field.userOptional" : "field.user")}</span>
              <input className="curlb-input" value={s.user} aria-invalid={bad("user")} onChange={(e) => up({ user: e.target.value })} placeholder="netops" spellCheck={false} autoComplete="off" />
            </label>
          </div>
          {s.transport !== "program" && (
            <label className="curlb-check">
              <input type="checkbox" checked={s.hostFromArgv} onChange={(e) => up({ hostFromArgv: e.target.checked })} />
              <span>{t("field.hostFromArgv")}</span>
            </label>
          )}
        </div>

        {/* 2. How to log in. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.login")}</div>
          <div className="curlb-grid">
            <label className="curlb-field">
              <span className="curlb-field-label">{t("field.auth")}</span>
              <select className="curlb-select" value={s.auth} onChange={(e) => up({ auth: e.target.value as BuilderInput["auth"] })}>
                {AUTH_BY_TRANSPORT[s.transport].map((a) => <option key={a} value={a}>{t(`auth.${a}`)}</option>)}
              </select>
            </label>
            {/* A key file. */}
            {s.auth === "key" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.keyFile")}</span>
                <input className="curlb-input" value={s.keyFile} aria-invalid={bad("keyFile")} onChange={(e) => up({ keyFile: e.target.value })} placeholder="keys/netops_ed25519" spellCheck={false} autoComplete="off" />
              </label>
            )}
            {/* The password's variable. */}
            {s.auth === "env" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.passwordVar")}</span>
                <input className="curlb-input" value={s.passwordVar} aria-invalid={bad("passwordVar")} onChange={(e) => up({ passwordVar: e.target.value })} spellCheck={false} autoComplete="off" />
              </label>
            )}
          </div>
          <p className="curl-muted">{t(`authHelp.${s.auth}`)}</p>
        </div>

        {/* 3. The device. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.device")}</div>
          <div className="curlb-grid">
            <label className="curlb-field">
              <span className="curlb-field-label">{t("field.profile")}</span>
              <select className="curlb-select" value={s.profile} onChange={(e) => up({ profile: e.target.value as BuilderInput["profile"] })}>
                {PROFILE_CHOICES.map((p) => <option key={p} value={p}>{t(`profile.${p}`)}</option>)}
              </select>
            </label>
            {/* The generic profile's prompt and paging command. */}
            {s.profile === "generic" && (
              <>
                <label className="curlb-field">
                  <span className="curlb-field-label">{t("field.genericPrompt")}</span>
                  <input className="curlb-input curlb-data" value={s.genericPrompt} aria-invalid={bad("genericPrompt")} onChange={(e) => up({ genericPrompt: e.target.value })} spellCheck={false} autoComplete="off" />
                </label>
                <label className="curlb-field">
                  <span className="curlb-field-label">{t("field.genericPagingCommand")}</span>
                  <input className="curlb-input" value={s.genericPagingCommand} aria-invalid={bad("genericPagingCommand")} onChange={(e) => up({ genericPagingCommand: e.target.value, paging: e.target.value ? "off" : "none" })} placeholder="terminal length 0" spellCheck={false} autoComplete="off" />
                </label>
              </>
            )}
            {/* enable, where the profile has it. */}
            {enableChoices.length > 1 && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.enable")}</span>
                <select className="curlb-select" value={s.enable} onChange={(e) => up({ enable: e.target.value as BuilderInput["enable"] })}>
                  {enableChoices.map((x) => <option key={x} value={x}>{t(`enable.${x}`)}</option>)}
                </select>
              </label>
            )}
            {/* The enable password's variable. */}
            {s.enable === "env" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.enableVar")}</span>
                <input className="curlb-input" value={s.enableVar} aria-invalid={bad("enableVar")} onChange={(e) => up({ enableVar: e.target.value })} spellCheck={false} autoComplete="off" />
              </label>
            )}
            {/* Paging, where there is a choice. */}
            {pagingChoices.length > 1 && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.paging")}</span>
                <select className="curlb-select" value={s.paging} onChange={(e) => up({ paging: e.target.value as BuilderInput["paging"] })}>
                  {pagingChoices.map((x) => <option key={x} value={x}>{t(`paging.${x}`)}</option>)}
                </select>
              </label>
            )}
          </div>
          {/* What turning paging off would change, where it is a global configuration change. */}
          {pagingGlobal && <p className="curl-muted">{t(s.paging === "off" ? "pagingGlobalOff" : "pagingGlobalAnswer")}</p>}
          {/* Put a lasting paging setting back. */}
          {restorable && (
            <label className="curlb-check">
              <input type="checkbox" checked={s.restorePaging} onChange={(e) => up({ restorePaging: e.target.checked })} />
              <span>{t("field.restorePaging")}</span>
            </label>
          )}
          {/* The profile, in brief, with where its facts come from. */}
          {profile && (
            <p className="curl-muted">
              {t("profileFacts", { documented: profile.release.documented, readOn: r.profile?.readOn ?? "2026-10-27" })}{" "}
              <Link href="/learn/expect-against-network-devices">{t("profileArticle")}</Link>
            </p>
          )}
        </div>

        {/* 4. The commands. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.commands")}</div>
          <label className="curlb-field curlb-field--wide">
            <span className="curlb-field-label">{t("field.commands", { max: LIMITS.maxCommands })}</span>
            <textarea className="curlb-input curlb-data" rows={5} value={s.commands} aria-invalid={bad("commands")} onChange={(e) => up({ commands: e.target.value })} spellCheck={false} autoComplete="off" />
          </label>
        </div>

        {/* 5. Timing, output and the end of the session. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.run")}</div>
          <div className="curlb-grid">
            <div className="curlb-field curlb-field--narrow">
              {/* The label beside the field, tied by id. */}
              <label className="curlb-field-label" htmlFor="esb-loginTimeout">{t("field.loginTimeout")}</label>
              {/* Up and down arrows: whole seconds, 1 to LIMITS.maxTimeout, as the field's own min and max. */}
              <StepperField value={Number.isFinite(s.loginTimeout) ? s.loginTimeout : ""} onValue={(v) => up({ loginTimeout: v === "" ? NaN : Number(v) })} min={1} max={LIMITS.maxTimeout} integer label={t("field.loginTimeout")} inputId="esb-loginTimeout">
                <input id="esb-loginTimeout" className="curlb-input" type="number" min={1} max={LIMITS.maxTimeout} value={Number.isFinite(s.loginTimeout) ? s.loginTimeout : ""} aria-invalid={bad("loginTimeout")} onChange={(e) => up({ loginTimeout: e.target.value === "" ? NaN : Number(e.target.value) })} />
              </StepperField>
            </div>
            <div className="curlb-field curlb-field--narrow">
              {/* The label beside the field, tied by id. */}
              <label className="curlb-field-label" htmlFor="esb-commandTimeout">{t("field.commandTimeout")}</label>
              {/* Up and down arrows: whole seconds, 1 to LIMITS.maxTimeout, as the field's own min and max. */}
              <StepperField value={Number.isFinite(s.commandTimeout) ? s.commandTimeout : ""} onValue={(v) => up({ commandTimeout: v === "" ? NaN : Number(v) })} min={1} max={LIMITS.maxTimeout} integer label={t("field.commandTimeout")} inputId="esb-commandTimeout">
                <input id="esb-commandTimeout" className="curlb-input" type="number" min={1} max={LIMITS.maxTimeout} value={Number.isFinite(s.commandTimeout) ? s.commandTimeout : ""} aria-invalid={bad("commandTimeout")} onChange={(e) => up({ commandTimeout: e.target.value === "" ? NaN : Number(e.target.value) })} />
              </StepperField>
            </div>
            <label className="curlb-field">
              <span className="curlb-field-label">{t("field.output")}</span>
              <select className="curlb-select" value={s.output} onChange={(e) => up({ output: e.target.value as BuilderInput["output"] })}>
                {(["screen", "file", "both"] as const).map((x) => <option key={x} value={x}>{t(`output.${x}`)}</option>)}
              </select>
            </label>
            {s.output !== "screen" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("field.logFile")}</span>
                <input className="curlb-input" value={s.logFile} aria-invalid={bad("logFile")} onChange={(e) => up({ logFile: e.target.value })} spellCheck={false} autoComplete="off" />
              </label>
            )}
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("field.logout")}</span>
              <input className="curlb-input" value={s.logout} aria-invalid={bad("logout")} onChange={(e) => up({ logout: e.target.value })} placeholder="exit" spellCheck={false} autoComplete="off" />
            </label>
          </div>
        </div>
      </div>

      {/* The errors, when nothing can be built. */}
      {!r.ok && (
        <div className="curl-error" role="alert">
          <p>{t("errorsTitle")}</p>
          <ul className="dig-warning-list">{r.errors.map((e, i) => <li key={i}>{errorText(e)}</li>)}</ul>
        </div>
      )}

      {r.ok && (
        <>
          {/* The script, with Copy and Download. */}
          <div className="curlb-preview">
            <div className="curlb-preview-head">
              <span className="curl-code-lang">{t("scriptTitle", { lines: r.script.split("\n").length - 1 })}</span>
              <span className="curlb-preview-actions">
                <CopyButton text={r.script} label={t("copy")} done={t("copied")} />
                <DownloadButton text={r.script} label={t("download")} name="login-and-run.exp" />
              </span>
            </div>
            <pre className="curl-code-body dig-mono curlb-cmd">{r.script}</pre>
          </div>

          {/* Share results: under the script, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[shareCaution]} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {/* The explainer's reading of it. */}
          {verdict && (
            <p className="curl-muted">
              {t("verdict", { error: verdict.counts.error, warning: verdict.counts.warning, info: verdict.counts.info })}{" "}
              <Link href="/tools/expect-script-explainer">{t("verdictLink")}</Link>
            </p>
          )}

          {/* The notes: warnings first, as the engine orders them by kind. */}
          {r.notes.length > 0 && (
            <ul className="curl-warnings">
              {r.notes.map((n, i) => <li key={i} className={n.severity === "warning" ? "curl-warn" : "curl-muted"}>{noteText(n)}</li>)}
            </ul>
          )}

          {/* How to run it. */}
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("runTitle")}</div>
            <p className="curl-muted">
              <code>{`expect login-and-run.exp${r.needs.argv.length ? " " + r.needs.argv.join(" ") : ""}`}</code>{" "}
              {r.needs.env.length > 0 && t("runEnv", { vars: r.needs.env.join(", ") })}{" "}
              {r.needs.terminal && t("runTerminal")}
            </p>
            <ul className="dig-warning-list">
              {r.exitCodes.map((x) => <li key={x.code}><code>{x.code}</code> {t(`exit.${x.meaning}`)}</li>)}
            </ul>
          </div>

          {/* The script, part by part. */}
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("partsTitle")}</div>
            <ol className="curlb-parts">
              {r.sections.map((sec, i) => (
                <li key={i} className="curlb-part">
                  <span className="curlb-meta-chip">{t("lines", { from: sec.from, to: sec.to })}</span>{" "}
                  <span className="curl-opt-desc">{t(`section.${sec.id}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {/* What the builder does not do. */}
      <p className="curl-muted">{t("limits")}</p>
    </div>
  );
}
