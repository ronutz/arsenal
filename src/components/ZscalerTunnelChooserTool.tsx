"use client";

// ============================================================================
// src/components/ZscalerTunnelChooserTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE ZSCALER TUNNEL CHOOSER.
//
// A pure chooser panel: one bandwidth field plus five yes/no constraints,
// feeding the exported choose() engine directly in the browser on every
// change. The result renders the recommendation card (type, per-tunnel
// figure with its documented basis, primary/backup counts), the reasoning
// steps in order, then prerequisites and operational notes.
//
// D-83: the Example button loads the documentation's own 2 Gbps GRE
// scale-out case (golden vector "gre-2gbps-doc-example"); Clear resets to
// the empty state. The engine throws helpful errors on bad bandwidth
// (worker-compatible contract), rendered in the shared error box. Chrome
// strings come from the tools.zscaler-tunnel-chooser namespace; the
// engine's explanatory text is English by design, like its explainer
// siblings.
//
// Share results (2026-11-01): a button under the recommendation card builds a
// link that carries every field of the form; an arriving link replaces the
// whole form, and the page chooses again.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { chooseLocalisable, type ChooserInput, type ChooserResult } from "@/lib/tools/zscaler-tunnel-chooser/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the steps, basis, prerequisites, notes and errors arrive as EngineTexts from
// chooseLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { ZSCALER_TUNNEL_CHOOSER_SHARE, encodeTunnel } from "@/lib/tools/zscaler-tunnel-chooser/share"; // this tool's share spec

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: ChooserResult<EngineText> } | { ok: false; error: unknown }; // the error kept, so it can be translated

/** D-83 example: the docs' 2 Gbps GRE case - 2 primaries + 2 backups. */
const EXAMPLE: FormState = {
  mbps: "2000",
  ha: "yes",
  staticIp: "yes",
  encryption: "no",
  greSupport: "yes",
  nated: "no",
};

/** Empty state: nothing chosen yet, nothing computed. */
const EMPTY: FormState = { mbps: "", ha: "yes", staticIp: "yes", encryption: "no", greSupport: "yes", nated: "no" };

interface FormState {
  mbps: string;
  ha: "yes" | "no";
  staticIp: "yes" | "no";
  encryption: "yes" | "no";
  greSupport: "yes" | "no";
  nated: "yes" | "no";
}

/** One labeled yes/no select, wired to the shared form state. */
function YesNo({
  id,
  label,
  value,
  onChange,
  t,
}: {
  id: string;
  label: string;
  value: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <label className="lbm-chooser-label" htmlFor={id}>
      <span>{label}</span>
      <select id={id} className="lbm-select" value={value} onChange={(e) => onChange(e.target.value as "yes" | "no")}>
        <option value="yes">{t("yes")}</option>
        <option value="no">{t("no")}</option>
      </select>
    </label>
  );
}

export default function ZscalerTunnelChooserTool() {
  const t = useTranslations("tools.zscaler-tunnel-chooser");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [form, setForm] = useState<FormState>(EMPTY);

  // Live computation: only once a bandwidth figure is present; the engine's
  // helpful errors surface in the shared error box instead of throwing up.
  const result: LiveResult | null = useMemo(() => {
    if (form.mbps.trim() === "") return null;
    const input: ChooserInput = {
      requiredMbps: Number(form.mbps),
      haRequired: form.ha === "yes",
      staticPublicIp: form.staticIp === "yes",
      encryptionRequired: form.encryption === "yes",
      deviceSupportsGre: form.greSupport === "yes",
      internalEndpointsNated: form.nated === "yes",
    };
    try {
      return { ok: true, value: chooseLocalisable(input) }; // the reading, sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [form]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // An arriving share link (2026-11-01): the whole form is replaced by the link's values; the page chooses as on typing.
  useShareArrival(ZSCALER_TUNNEL_CHOOSER_SHARE, (s) => setForm({ ...s })); // the link's form
  // What Share results may carry: every field, beside a recommendation (memoised).
  const share = useMemo(() => encodeTunnel(form, result && result.ok ? plainText(result.value) : null), [form, result]); // the encoding (the share spec reads the API's shape)

  return (
    <div>
      {/* D-83 Example/Clear row - the dig-input-head pattern. */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="ztc-mbps-input">{t("panelHeading")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setForm(EXAMPLE)}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => setForm(EMPTY)}>
            {t("clear")}
          </button>
        </div>
      </div>

      <section className="lbm-chooser">
      <div className="lbm-chooser-row">
        <label className="lbm-chooser-label" htmlFor="ztc-mbps-input">
          <span>{t("mbpsLabel")}</span>
          <input
            id="ztc-mbps-input"
            className="cidr-input mono"
            inputMode="numeric"
            placeholder={t("mbpsPlaceholder")}
            value={form.mbps}
            onChange={(e) => set({ mbps: e.target.value })}
          />
        </label>
        <YesNo id="ztc-ha" label={t("haLabel")} value={form.ha} onChange={(v) => set({ ha: v })} t={t} />
        <YesNo id="ztc-static" label={t("staticIpLabel")} value={form.staticIp} onChange={(v) => set({ staticIp: v })} t={t} />
        <YesNo id="ztc-enc" label={t("encryptionLabel")} value={form.encryption} onChange={(v) => set({ encryption: v })} t={t} />
        <YesNo id="ztc-gre" label={t("greSupportLabel")} value={form.greSupport} onChange={(v) => set({ greSupport: v })} t={t} />
        <YesNo id="ztc-nat" label={t("natedLabel")} value={form.nated} onChange={(v) => set({ nated: v })} t={t} />
      </div>
      </section>

      {result === null && <p className="ztc-empty">{t("emptyState")}</p>}

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{tx.error(result.error)}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="ztc-result">
          {/* The recommendation card. */}
          <article className="tmsh-object">
            <header className="tmsh-object-head">
              <span className="tmsh-type-badge mono">{result.value.choice.toUpperCase()}</span>
              <span className="tmsh-object-name">
                {result.value.primaries} {t("primariesLabel")} + {result.value.backups} {t("backupsLabel")}
              </span>
            </header>
            <dl className="lbm-facts">
              <dt>{t("perTunnelLabel")}</dt>
              <dd>
                {result.value.perTunnelMbps} Mbps - {tx.say(result.value.perTunnelBasis)}
              </dd>
            </dl>
          </article>

          {/* Share results (2026-11-01): under the recommendation card, before the reasoning, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          {/* The reasoning, one step at a time. */}
          <h3 className="ztc-section-title">{t("stepsTitle")}</h3>
          <ol className="ztc-steps">
            {result.value.steps.map((s, i) => (
              <li key={i}>
                <strong>{tx.say(s.label)}.</strong> {tx.say(s.text)}
              </li>
            ))}
          </ol>

          {/* Preconditions, then operational notes. */}
          {result.value.prereqs.length > 0 && (
            <>
              <h3 className="ztc-section-title">{t("prereqsTitle")}</h3>
              <ul className="ztc-notes">
                {result.value.prereqs.map((p, i) => (
                  <li key={i}>{tx.say(p)}</li>
                ))}
              </ul>
            </>
          )}
          <h3 className="ztc-section-title">{t("notesTitle")}</h3>
          <ul className="ztc-notes">
            {result.value.notes.map((n, i) => (
              <li key={i}>{tx.say(n)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
