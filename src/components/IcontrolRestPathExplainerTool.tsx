"use client";

// ============================================================================
// src/components/IcontrolRestPathExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste an iControl REST URL, get it decoded: module, collection, the
// tilde-encoded object path with its tmsh equivalent, sub-collections and query
// options. The parse is pure and local; this component only renders it.
//
// Same D-83 Example/Clear affordance and the same classes as the other
// explainers, so a reader who has used one already knows this one.
//
// SHARE RESULTS (2026-10-27): a button under the overview builds, only when
// pressed, a link carrying the path with an auth token masked and a password
// or a header's credentials replaced by [redacted] (spec:
// src/lib/tools/icontrol-rest-path-explainer/share.ts); the popover says how
// many were. An arriving link (useShareArrival) fills the box as a paste
// would; the address loses the value at once.
//
// PAGE LANGUAGE (2026-11-02, batch H7): the query options' explanations, the
// notes, the warnings and the error arrive as EngineTexts from
// decodeIControlPathLocalisable(), and each module's description (in the
// result and in the reference panel) is looked up by module name
// (engine.module.<module>), all through engineTexts(t), else the engine's
// English. Paths, module and option names are the API's own and stay as typed.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  decodeIControlPathLocalisable,
  knownModules,
  type IControlDecode,
} from "@/lib/tools/icontrol-rest-path-explainer/compute"; // the reading with sentence ids (2026-11-02); the engine, not the index, so the vectors stay out of the page
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences and catalogue texts in the page's language (2026-11-02)
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { ICONTROL_PATH_SHARE } from "@/lib/tools/icontrol-rest-path-explainer/share"; // this tool's share spec: the path, credentials replaced
import { shareablePath } from "@/lib/tools/icontrol-rest-path-explainer/compute"; // the count the popover gives

const EXAMPLE = "/mgmt/tm/ltm/pool/~Common~apps~web_pool/members?expandSubcollections=true";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

export default function IcontrolRestPathExplainerTool() {
  const t = useTranslations("tools.icontrol-rest-path-explainer");
  const tx = engineTexts(t); // the engine's sentences and the module descriptions in the page's language (2026-11-02)
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: IControlDecode<EngineText> } | { ok: false; error: unknown } | null>(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, data: decodeIControlPathLocalisable(input) }; // sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // kept whole: an IControlPathError carries its sentence; anything else shows its message
    }
  }, [input]);

  const modules = knownModules();
  // An arriving share link: the copy fills the box as a paste would.
  useShareArrival(ICONTROL_PATH_SHARE, (state) => setInput(state.input)); // the copy
  // What Share results may carry: the copy with every credential replaced, while the path decodes.
  const share = useMemo<ShareEncoding>(() => (result?.ok ? ICONTROL_PATH_SHARE.encode({ input }) : NOTHING), [result, input]); // memoised
  // How many values the copy replaces, for the popover (a cheap linear pass).
  const redacted = useMemo(() => (result?.ok ? shareablePath(input).redacted : 0), [result, input]); // the count

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="icr-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="icr-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        rows={3}
      />

      {result && !result.ok && <p className="cidr-error">{tx.error(result.error)}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("overview.title")}</h3>
            <dl className="dig-kv">
              <dt>{t("overview.path")}</dt>
              <dd className="mono">{result.data.normalisedPath}</dd>
              {result.data.host && (<><dt>{t("overview.host")}</dt><dd className="mono">{result.data.host}</dd></>)}
              {result.data.root && (<><dt>{t("overview.root")}</dt><dd className="mono">/mgmt/{result.data.root}</dd></>)}
              {result.data.module && (<><dt>{t("overview.module")}</dt><dd className="mono">{result.data.module.module}</dd></>)}
              {result.data.unknownModule && (
                <><dt>{t("overview.module")}</dt><dd className="mono">{result.data.unknownModule}: {t("overview.moduleUnknown")}</dd></>
              )}
              {result.data.collection.length > 0 && (
                <><dt>{t("overview.collection")}</dt><dd className="mono">{result.data.collection.join(" / ")}</dd></>
              )}
            </dl>
            {result.data.module && <p className="dig-record-explain">{tx.key(`module.${result.data.module.module}`, result.data.module.governs)}</p>}
            {/* Share results: under the overview (the first answer), at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries", { mark: "[redacted]" })} details={[t("share.redacted", { n: redacted })]} title={t("name")} />
            </div>
          </section>

          {/* THE OBJECT PATH. The tmsh equivalent is the point of the tool for
              most readers: it is the form they already know. */}
          {result.data.object && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("object.title")}</h3>
              <dl className="dig-kv">
                {result.data.object.partition && (<><dt>{t("object.partition")}</dt><dd className="mono">{result.data.object.partition}</dd></>)}
                {result.data.object.folders.length > 0 && (<><dt>{t("object.folders")}</dt><dd className="mono">{result.data.object.folders.join(" / ")}</dd></>)}
                <dt>{t("object.name")}</dt>
                <dd className="mono">{result.data.object.name}</dd>
                <dt>{t("object.tmsh")}</dt>
                <dd className="mono">{result.data.object.tmsh}</dd>
              </dl>
            </section>
          )}

          {result.data.subCollection && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("sub.title")}</h3>
              <dl className="dig-kv">
                <dt>{t("sub.name")}</dt>
                <dd className="mono">{result.data.subCollection}</dd>
                {result.data.subObject && (<><dt>{t("sub.member")}</dt><dd className="mono">{result.data.subObject.tmsh}</dd></>)}
              </dl>
            </section>
          )}

          {result.data.options.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("options.title")}</h3>
              <ol className="dig-records">
                {result.data.options.map((o, i) => (
                  <li key={`${o.key}-${i}`} className="dig-record">
                    <code className="mono">{o.key}{o.value ? `=${o.value}` : ""}</code>
                    <p className="dig-record-explain">{tx.say(o.explain)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
            </section>
          )}

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
            </section>
          )}
        </div>
      )}

      <section className="dig-section">
        <h3 className="dig-section-title">{t("reference.title")}</h3>
        <p className="dig-record-explain">{t("reference.intro")}</p>
        <dl className="dig-kv">
          {modules.map((m) => (
            <div key={m.module}>
              <dt className="mono">{m.module}</dt>
              <dd>{tx.key(`module.${m.module}`, m.governs)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
