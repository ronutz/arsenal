"use client";

// ============================================================================
// src/components/ExosConfigExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE EXTREMEXOS (EXOS / Switch Engine) CONFIG EXPLAINER.
//
// Paste an EXOS configuration and it reads it back, all offline:
//   - findings / observations first (line and VLAN counts, routing warnings);
//   - an aggregated VLAN summary (tag, tagged/untagged ports, IP addresses);
//   - every command explained in plain English, grouped by category (VLANs,
//     ports, Layer 3, link aggregation, spanning tree, accounts, management,
//     security).
// Empty input renders the EXOS verb reference.
//
// The engine throws on oversized input (the worker-compatible contract), so the
// run is wrapped and errors render in the shared error box. Chrome strings come
// from tools.exos-config-explainer. PAGE LANGUAGE (02/11/2026): the summaries,
// notes, reference lines and errors arrive as EngineTexts from runLocalisable(),
// and the group labels and VLAN card labels are looked up by key, all shown
// through engineTexts(t) and t(), so the pt-BR page reads in Portuguese.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  type ExosResult,
  type ExosVlan,
  type ExosNote,
} from "@/lib/tools/exos-config-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { EXOS_SHARE, encodeExosRevealed, encodeExosShare, exosShareCopy } from "@/lib/tools/exos-config-explainer/share"; // this tool's share spec: a copy with every secret value replaced, and the reveal switch

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: ExosResult<EngineText> } | { ok: false; error: unknown }; // the error kept, so it can be translated

// The one-click example (D-83): a representative EXOS config drawn from the
// golden vectors, using command shapes from the ExtremeXOS Command Reference.
const EXAMPLE = `# core switch
create vlan engineering tag 100
configure vlan engineering add ports 1:1, 1:2, 1:3 tagged
configure vlan engineering ipaddress 10.1.1.1/24
create vlan voice tag 200
configure vlan voice add ports 2:1 untagged
enable ipforwarding
configure iproute add default 10.1.1.254
enable sharing 1:1 grouping 1:1, 1:2 algorithm address-based lacp
create account admin netops
configure ports 1:10 display-string uplink
disable ports 1:24`;

/** Map a note kind to the shared panel styling. */
function notePanelClass(kind: ExosNote["kind"]): string {
  if (kind === "warn") return "jwt-panel dig-warnings";
  return "jwt-panel";
}

/** One aggregated VLAN card. */
function VlanCard({ v, t }: { v: ExosVlan; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object exos-vlan">
      <header className="tmsh-object-head">
        <span className="tmsh-object-name mono">{v.name}</span>
        {v.tag && <span className="tmsh-type-badge mono">{t("vlanCard.tag", { tag: v.tag })}</span>}
      </header>
      <ul className="exos-vlan-facts">
        {v.taggedPorts.length > 0 && (
          <li><span className="exos-fact-k">{t("vlanCard.tagged")}</span> <span className="mono">{v.taggedPorts.join(", ")}</span></li>
        )}
        {v.untaggedPorts.length > 0 && (
          <li><span className="exos-fact-k">{t("vlanCard.untagged")}</span> <span className="mono">{v.untaggedPorts.join(", ")}</span></li>
        )}
        {v.ipAddresses.length > 0 && (
          <li><span className="exos-fact-k">{t("vlanCard.ip")}</span> <span className="mono">{v.ipAddresses.join(", ")}</span></li>
        )}
      </ul>
    </article>
  );
}

export default function ExosConfigExplainerTool() {
  const t = useTranslations("tools.exos-config-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const live: LiveResult = useMemo(() => {
    try {
      return { ok: true, value: runLocalisable(input).result }; // the reading, sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [input]);

  // Share results (2026-11-01): a copy with every password, community, shared secret and key replaced by [redacted]
  // (Extreme's command reference names them; the reading never depends on their values), made once per change for the
  // button, its carries line (with the count) and the reveal switch. The verb reference (an empty box) has nothing to share.
  const copy = useMemo(() => (live.ok && live.value.mode === "parse" ? exosShareCopy(input) : null), [live, input]); // the copy, or why there is none
  const share = useMemo<ShareEncoding>(() => (copy ? encodeExosShare(input, copy) : NOTHING), [copy, input]); // the button's encoding
  const revealed = useMemo<ShareEncoding>(() => (copy ? encodeExosRevealed(input, copy) : NOTHING), [copy, input]); // the configuration as pasted, for the switch
  // The reveal switch (ANVIL 01/11/2026): only beside a copy that replaced something, never instead of a blocked link,
  // never when a private key was replaced; off whenever the popover opens.
  const shareReveal = share.ok && revealed.ok && copy && copy.ok
    ? { encoding: revealed, label: t("share.revealLabel", { n: copy.replaced }), carries: t("share.carriesRevealed"), details: [t("share.revealedCaution")] }
    : undefined; // or no switch
  // A shared link fills the box as a paste would; the page reads it.
  useShareArrival(EXOS_SHARE, (s) => setInput(s.input));

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool exos-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="exos-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="exos-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="exos-privacy"
        />
        <p id="exos-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {!live.ok && (
        <p className="cidr-error" role="alert">{tx.error(live.error)}</p>
      )}

      {live.ok && (
        <div className="jwt-results exos-results">
          {/* Findings / notes. */}
          {live.value.notes.length > 0 && (
            <div className={notePanelClass(live.value.notes.some((n) => n.kind === "warn") ? "warn" : live.value.notes[0].kind)}>
              <div className="jwt-panel-title">{t("findingsTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i} className={`exos-note exos-note-${n.kind}`}>{tx.say(n.text)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Share results: under the findings (the first answer: lines and VLANs read, routing warnings), before the VLAN
              summary and the commands, at the start of its own row. */}
          {copy && (
            <div className="rdap-ask-row">
              <ShareResultsButton
                encoding={share}
                carries={t("share.carries", { mark: "[redacted]", n: copy.ok ? copy.replaced : 0, state: copy.ok ? "copy" : "blocked" })}
                details={copy.ok ? [t("share.caution")] : []}
                blockedMessage={!copy.ok ? t("share.blockedSecret", { line: copy.line, label: copy.label }) : ""}
                title={t("name")}
                reveal={shareReveal}
              />
            </div>
          )}

          {/* Reference (empty input): verb glossary. */}
          {live.value.mode === "reference" && live.value.reference && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("verbsTitle")}</div>
              <p className="gdf-step-behavior exos-ref-note">{tx.say(live.value.reference.note)}</p>
              <ul className="exos-vlan-facts">
                {live.value.reference.verbs.map((v) => (
                  <li key={v.verb}>
                    <span className="mono exos-fact-k">{v.verb}</span> <span className="gdf-step-behavior">{tx.say(v.explain)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Aggregated VLAN summary. */}
          {live.value.vlans.length > 0 && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("vlansTitle")}</div>
              </div>
              {live.value.vlans.map((v, i) => (
                <VlanCard v={v} t={t} key={i} />
              ))}
            </>
          )}

          {/* Per-command explanations, grouped by category. */}
          {live.value.mode === "parse" && live.value.groups.map((g) => (
            <div className="jwt-panel exos-group" key={g.category}>
              <div className="jwt-panel-title">{tx.key(`cat.${g.category}`, g.label)}</div>
              <ul className="exos-cmd-list">
                {live.value.lines
                  .filter((l) => l.category === g.category)
                  .map((l, i) => (
                    <li key={i} className="exos-cmd">
                      <code className="exos-cmd-raw mono">{l.raw}</code>
                      <span className="gdf-step-behavior exos-cmd-explain">{tx.say(l.summary)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
