"use client";

// ============================================================================
// UI for the SPBM multicast B-MAC tool. One input pair for building an address
// and one for taking one apart, because those are two different jobs a reader
// arrives with - and the workings are shown either way, since the point is
// that the address is DERIVED rather than assigned.
// House CSS classes only (verified); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildMulticastMac,
  decodeMulticastMac,
  type SpbmMulticastResult,
} from "@/lib/tools/extreme-spbm-multicast-mac";

/** Golden-vector-faithful sample: the VOSS user guide's own worked example. */
const EXAMPLE_NICKNAME = "0.00.10";
const EXAMPLE_ISID = "100";
const EXAMPLE_MAC = "03:00:41:00:04:4d";

export default function ExtremeSpbmMulticastMacTool() {
  const t = useTranslations("tools.extreme-spbm-multicast-mac");
  const [nickname, setNickname] = useState("");
  const [isid, setIsid] = useState("");
  const [mac, setMac] = useState("");
  const [result, setResult] = useState<SpbmMulticastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Build an address from a nickname and a service id. */
  function forward(n: string, i: string) {
    if (!n.trim() || !i.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(buildMulticastMac(n, i));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Take an address from the FIB apart. */
  function reverse(m: string) {
    if (!m.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(decodeMulticastMac(m));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <div className="ztc-result">
        <h2 className="ztc-section-title">{t("buildHeading")}</h2>
        <label className="cidr-label" htmlFor="spbm-nick">
          {t("nicknameLabel")}
        </label>
        <input
          id="spbm-nick"
          className="cidr-input mono"
          spellCheck={false}
          value={nickname}
          placeholder="0.00.10"
          onChange={(e) => {
            setNickname(e.target.value);
            setMac("");
            forward(e.target.value, isid);
          }}
        />
        <label className="cidr-label" htmlFor="spbm-isid">
          {t("isidLabel")}
        </label>
        <input
          id="spbm-isid"
          className="cidr-input mono"
          spellCheck={false}
          value={isid}
          placeholder="100"
          onChange={(e) => {
            setIsid(e.target.value);
            setMac("");
            forward(nickname, e.target.value);
          }}
        />
      </div>

      <div className="ztc-result">
        <h2 className="ztc-section-title">{t("decodeHeading")}</h2>
        <label className="cidr-label" htmlFor="spbm-mac">
          {t("macLabel")}
        </label>
        <input
          id="spbm-mac"
          className="cidr-input mono"
          spellCheck={false}
          value={mac}
          placeholder="03:00:41:00:04:4d"
          onChange={(e) => {
            setMac(e.target.value);
            setNickname("");
            setIsid("");
            reverse(e.target.value);
          }}
        />
        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNickname(EXAMPLE_NICKNAME);
              setIsid(EXAMPLE_ISID);
              setMac("");
              forward(EXAMPLE_NICKNAME, EXAMPLE_ISID);
            }}
          >
            {t("exampleBuild")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMac(EXAMPLE_MAC);
              setNickname("");
              setIsid("");
              reverse(EXAMPLE_MAC);
            }}
          >
            {t("exampleDecode")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNickname("");
              setIsid("");
              setMac("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
        <p className="cidr-privacy">{t("privacy")}</p>
      </div>

      {error && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorHeadline")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">
              {result.direction === "forward" ? t("resultBuild") : t("resultDecode")}
            </h2>
            <p className="tmsh-object-head mono">{result.mac}</p>
            <p className="cidr-privacy">
              {t("summary", { nickname: result.nickname.text, isid: result.isid })}
            </p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("workingsHeading")}</h2>
            <ul className="lbm-facts">
              <li className="ztc-notes mono">
                {result.workings.prefixHex} | {result.workings.nicknameHex} &rarr;{" "}
                {result.workings.firstThreeBytes}
              </li>
              <li className="ztc-notes mono">
                {result.workings.isidHex} &rarr; {result.workings.lastThreeBytes}
              </li>
            </ul>
          </div>

          {result.notes.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("notesHeading")}</h2>
              <ul className="lbm-facts">
                {result.notes.map((n, i) => (
                  <li key={i} className="ztc-notes">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
