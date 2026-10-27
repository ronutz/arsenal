"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/DnssecChainLab.tsx
// ----------------------------------------------------------------------------
// THE DNSSEC CHAIN LAB (2026-10-26), embedded in "DNSSEC end to end: from the
// root's key to a validated answer" as <Lab id="dnssec-chain" />. Two selects:
// what breaks, and where (the second appears only for a fault that has a place,
// and offers only the places that fault can have). The result is a short
// summary (the state, what the client receives, where it was decided) and an
// ordered account of the four links, from the trust anchor to the answer, each
// naming the RFC section that decided it. The model is
// src/lib/labs/dnssec-chain/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.dnssec-chain".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  PLACES_FOR,
  QNAME,
  UNSUPPORTED_ALG,
  zoneLabels,
  type DnssecInput,
  type Fault,
  type KeyLabel,
  type LinkResult,
  type LinkStatus,
  type Place,
} from "@/lib/labs/dnssec-chain/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "dnssec-chain";

/** The faults whose place is a delegation (the place select words them as delegations). */
const DELEGATION_FAULTS: readonly Fault[] = ["ds-mismatch", "no-ds", "unsupported-alg"];

export default function DnssecChainLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.dnssec-chain");
  // The page's language, for numbers.
  const locale = useLocale();
  // Key tags and algorithm numbers, without grouping (a key tag is an identifier, not a quantity).
  const nf = new Intl.NumberFormat(locale, { useGrouping: false });
  // The reader's settings, opening on an unbroken chain.
  const [input, setInput] = useState<DnssecInput>(DEFAULT_INPUT);
  // The model's answer (pure: computed on every render; the selects only send combinations the model accepts).
  const r = compute(input);
  // The zones as labelled for these settings.
  const z = zoneLabels(input);

  // The fault choices.
  const faultOptions = [
    ["none", t("faultNone")],
    ["rrsig-expired", t("faultRrsigExpired")],
    ["rrsig-missing", t("faultRrsigMissing")],
    ["ds-mismatch", t("faultDsMismatch")],
    ["no-ds", t("faultNoDs")],
    ["unsupported-alg", t("faultUnsupportedAlg", { alg: nf.format(UNSUPPORTED_ALG) })],
    ["no-anchor", t("faultNoAnchor")],
  ] as const;
  // The places this fault can have, worded as RRsets or as delegations.
  const places = PLACES_FOR[input.fault];
  // Delegations or RRsets.
  const asDelegation = DELEGATION_FAULTS.includes(input.fault);
  // The place choices.
  const placeOptions = places.map(
    (p) =>
      [
        p,
        asDelegation
          ? p === "tld"
            ? t("placeTldDelegation")
            : t("placeZoneDelegation")
          : p === "root"
            ? t("placeRootKeys")
            : p === "tld"
              ? t("placeTldKeys")
              : p === "zone"
                ? t("placeZoneKeys")
                : t("placeAnswer", { qname: QNAME }),
      ] as const,
  );
  /** Change the fault; keep the place when the new fault allows it, else take its first place. */
  const setFault = (f: Fault) => {
    // The new fault's places.
    const allowed = PLACES_FOR[f];
    // Root stands in for "no place".
    setInput({ fault: f, place: allowed.length === 0 ? "root" : allowed.includes(input.place) ? input.place : allowed[0] });
  };

  /** One key, worded: "38696 (KSK, algorithm 8)". */
  const keyText = (k: KeyLabel): string => (k.role === "ksk" ? t("keyKsk", { tag: nf.format(k.tag), alg: nf.format(k.alg) }) : t("keyZsk", { tag: nf.format(k.tag), alg: nf.format(k.alg) }));
  /** A zone's two keys, worded and joined: "38696 (KSK, algorithm 8) and 21831 (ZSK, algorithm 8)". */
  const keysText = (keys: KeyLabel[]): string =>
    // The model always lists a KSK and a ZSK; anything else is joined plainly.
    keys.length === 2 ? t("keysJoin", { first: keyText(keys[0]), second: keyText(keys[1]) }) : keys.map(keyText).join(", ");
  /** A link's label: which two ends it joins. */
  const linkLabel = (p: Place): string => (p === "root" ? t("linkRoot") : p === "tld" ? t("linkTld") : p === "zone" ? t("linkZone") : t("linkAnswer", { qname: QNAME }));
  /** A status, worded. */
  const statusText = (s: LinkStatus): string =>
    // One word per status.
    s === "holds" ? t("statusHolds") : s === "bogus" ? t("statusBogus") : s === "insecure" ? t("statusInsecure") : s === "indeterminate" ? t("statusIndeterminate") : t("statusNotChecked");
  /** A status's tone (colour only adds; the word carries the meaning). */
  const statusTone = (s: LinkStatus): string => (s === "holds" ? "ok" : s === "bogus" ? "stop" : s === "not-checked" ? "" : "warn");

  /** The sentence for one link. */
  const linkSentence = (l: LinkResult): string => {
    // The child zone this link reaches, and its parent.
    const child = l.link === "tld" ? z.tld : z.zone;
    // Its parent.
    const parent = l.link === "tld" ? z.root : z.tld;
    // Shared parameters.
    const p = {
      zone: child.name,
      parent: parent.name,
      keys: keysText(l.keys),
      tag: nf.format(l.ds?.tag ?? l.signer),
      alg: nf.format(l.ds?.alg ?? 0),
      digestOf: nf.format(l.ds?.digestOf ?? 0),
      by: nf.format(l.dsSigner ?? 0),
      signer: nf.format(l.signer),
    };
    // One sentence per rule.
    switch (l.rule) {
      case "anchor-none":
        return t("anchorNone");
      case "anchor-ok":
        return `${t("anchorMatch", p)} ${t("rrsigValid", p)}`;
      case "dnskey-rrsig-expired":
        return `${l.link === "root" ? t("anchorMatch", p) : t("dsMatch", p)} ${t("rrsigExpired", p)}`;
      case "dnskey-rrsig-missing":
        return `${l.link === "root" ? t("anchorMatch", p) : t("dsMatch", p)} ${l.link === "root" ? t("rrsigMissingRoot") : t("rrsigMissing", p)}`;
      case "ds-ok":
        return `${t("dsMatch", p)} ${t("rrsigValid", p)}`;
      case "ds-mismatch":
        return t("dsMismatch", p);
      case "no-ds":
        return t("noDs", p);
      case "unsupported-alg":
        return t("unsupportedAlg", p);
      case "answer-ok":
        return t("answerOk", { signer: p.signer });
      case "answer-rrsig-expired":
        return t("answerExpired", { signer: p.signer });
      case "answer-rrsig-missing":
        return t("answerMissing");
      case "below-insecure":
        return t("belowInsecure");
      case "below-indeterminate":
        return t("belowIndeterminate");
      default:
        return t("aboveFailed");
    }
  };

  // The zone named in an Insecure verdict: the one whose delegation decided it.
  const insecureZone = r.decidedAt === "tld" ? z.tld.name : z.zone.name;
  // The verdict sentence.
  const verdict =
    r.verdict === "secure"
      ? t("verdictSecure")
      : r.verdict === "insecure"
        ? t("verdictInsecure", { zone: insecureZone })
        : r.verdict === "bogus"
          ? t("verdictBogus")
          : t("verdictIndeterminate");
  // Secure is good news, Bogus a stop, Insecure and Indeterminate a caution.
  const tone = r.verdict === "secure" ? "ok" : r.verdict === "bogus" ? "stop" : "warn";
  // The state, worded.
  const stateText = r.verdict === "secure" ? t("stateSecure") : r.verdict === "insecure" ? t("stateInsecure") : r.verdict === "bogus" ? t("stateBogus") : t("stateIndeterminate");
  // What the client receives, worded.
  const clientText = r.client === "answer-ad" ? t("clientAd") : r.client === "answer-no-ad" ? t("clientNoAd") : t("clientServfail");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-fault`} label={t("fault")}>
            <LabSelect id={`${ID}-fault`} value={input.fault} options={faultOptions} onChange={(v) => setFault(v as Fault)} />
          </LabField>
          {/* Where: only for a fault that has a place, and only its own places. */}
          {places.length > 0 && (
            <LabField id={`${ID}-place`} label={t("place")}>
              <LabSelect id={`${ID}-place`} value={input.place} options={placeOptions} onChange={(v) => setInput({ ...input, place: v as Place })} />
            </LabField>
          )}
        </>
      }
      result={
        <>
          {/* The summary. */}
          <dl className="lab-kv">
            <dt>{t("kvState")}</dt>
            <dd>{stateText}</dd>
            <dt>{t("kvClient")}</dt>
            <dd>{clientText}</dd>
            <dt>{t("kvDecided")}</dt>
            <dd>{linkLabel(r.decidedAt)}</dd>
          </dl>
          {/* The four links, top down, then the verdict. */}
          <ol className="lab-steps">
            {r.links.map((l) => (
              <li className="lab-step" key={l.link}>
                <span className="lab-step-where">{linkLabel(l.link)}</span>{" "}
                <span className={statusTone(l.status) ? `lab-verdict lab-verdict--${statusTone(l.status)}` : "lab-verdict"}>{statusText(l.status)}</span> {linkSentence(l)}
              </li>
            ))}
            <li className="lab-step">
              <span className="lab-step-where">{t("stepVerdict")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* What is real and what is a label. */}
          <p className="lab-note">{t("noteLabels")}</p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
