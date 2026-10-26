"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/Ipv6HostConfigurationSourcesLab.tsx
// ----------------------------------------------------------------------------
// THE IPv6 HOST CONFIGURATION LAB (2026-10-26), embedded in "How IPv6 hosts get
// addresses: SLAAC and DHCPv6" as <Lab id="ipv6-host-configuration-sources" />. Six selects
// (Router Advertisements or none, Router Lifetime, prefix length, A flag,
// RDNSS, what DHCPv6 offers); the result lists where each piece of the host's
// configuration came from (addresses, default route, DNS servers), with notes
// on what was ignored, and a verdict on what the host can reach. The model is
// src/lib/labs/ipv6-host-configuration-sources/compute.ts; its checked cases
// are the golden vectors beside it.
// Words: "learnLabs.ipv6-host-configuration-sources".
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, type Dhcpv6, type Ipv6HostInput, type PrefixLength } from "@/lib/labs/ipv6-host-configuration-sources/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "ipv6-host-configuration-sources";

/** The yes/no selects, by input field. */
type Toggle = "ra" | "defaultRouter" | "aFlag" | "rdnss";

export default function Ipv6HostConfigurationSourcesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.ipv6-host-configuration-sources");
  // The reader's settings, opening on SLAAC with RDNSS.
  const [input, setInput] = useState<Ipv6HostInput>(DEFAULT_INPUT);
  // The model's answer (every control is a select, so the input is always valid).
  const r = compute(input);

  /** A two-way select's options. */
  const twoWay = (yes: string, no: string) =>
    [
      ["yes", yes],
      ["no", no],
    ] as const;
  /** Set one yes/no field from a select. */
  const setToggle = (key: Toggle) => (v: string) => setInput({ ...input, [key]: v === "yes" });
  // The prefix options.
  const prefixOptions = [
    ["64", t("prefix64")],
    ["60", t("prefix60")],
  ] as const;
  // The DHCPv6 options.
  const dhcpOptions = [
    ["none", t("dhcpNone")],
    ["stateless", t("dhcpStateless")],
    ["stateful", t("dhcpStateful")],
  ] as const;

  // Why SLAAC did or did not run.
  const slaacNote = r.slaacBlocked === "no-ra" ? t("slaacNoRa") : r.slaacBlocked === "a-flag" ? t("slaacAFlag") : r.slaacBlocked === "prefix-length" ? t("slaacPrefix") : t("slaacRan");
  // Where the default route came from.
  const routeText = r.defaultRoute ? t("routeYes") : input.ra ? t("routeLifetimeZero") : t("routeNoRa");
  // Where the DNS servers came from.
  const dnsText = r.dns === "dhcpv6" ? (input.dhcpv6 === "stateless" ? t("dnsStateless") : t("dnsStateful")) : r.dns === "rdnss" ? t("dnsRdnss") : t("dnsNone");
  // What the host can reach, worded.
  const verdict = r.reach === "link-only" ? t("reachLinkOnly") : r.reach === "on-link" ? t("reachOnLink") : r.reach === "by-address" ? t("reachByAddress") : t("reachByName");
  // Ready by name is good news; partial configurations are warnings; link-local only is a stop.
  const tone = r.reach === "by-name" ? "ok" : r.reach === "link-only" ? "stop" : "warn";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-ra`} label={t("ra")}>
            <LabSelect id={`${ID}-ra`} value={input.ra ? "yes" : "no"} options={twoWay(t("raYes"), t("raNo"))} onChange={setToggle("ra")} />
          </LabField>
          <LabField id={`${ID}-lifetime`} label={t("lifetime")}>
            <LabSelect id={`${ID}-lifetime`} value={input.defaultRouter ? "yes" : "no"} options={twoWay(t("lifetime1800"), t("lifetime0"))} onChange={setToggle("defaultRouter")} />
          </LabField>
          <LabField id={`${ID}-prefix`} label={t("prefix")}>
            <LabSelect id={`${ID}-prefix`} value={input.prefixLength} options={prefixOptions} onChange={(v) => setInput({ ...input, prefixLength: v as PrefixLength })} />
          </LabField>
          <LabField id={`${ID}-aflag`} label={t("aFlag")}>
            <LabSelect id={`${ID}-aflag`} value={input.aFlag ? "yes" : "no"} options={twoWay(t("flagSet"), t("flagClear"))} onChange={setToggle("aFlag")} />
          </LabField>
          <LabField id={`${ID}-rdnss`} label={t("rdnss")}>
            <LabSelect id={`${ID}-rdnss`} value={input.rdnss ? "yes" : "no"} options={twoWay(t("rdnssYes"), t("rdnssNo"))} onChange={setToggle("rdnss")} />
          </LabField>
          <LabField id={`${ID}-dhcpv6`} label={t("dhcpv6")}>
            <LabSelect id={`${ID}-dhcpv6`} value={input.dhcpv6} options={dhcpOptions} onChange={(v) => setInput({ ...input, dhcpv6: v as Dhcpv6 })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* Each piece of the configuration and where it came from. */}
          <dl className="lab-kv">
            <dt>{t("kvAddresses")}</dt>
            <dd className="mono">
              {r.addresses.map((a) => (
                <span key={a}>
                  {a}
                  <br />
                </span>
              ))}
            </dd>
            <dt>{t("kvRoute")}</dt>
            <dd>{routeText}</dd>
            <dt>{t("kvDns")}</dt>
            <dd>{dnsText}</dd>
          </dl>
          {/* Why the global addresses are what they are. */}
          <p className="lab-note">{slaacNote}</p>
          {/* A DHCPv6 address carries no prefix length of its own. */}
          {r.dhcpv6Address && <p className="lab-note">{t("noteSlash128")}</p>}
          {/* DHCPv6 wins over RDNSS. */}
          {r.rdnssOverridden && <p className="lab-note">{t("noteRdnssOverridden")}</p>}
          {/* What the host can reach. */}
          <p>
            <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
