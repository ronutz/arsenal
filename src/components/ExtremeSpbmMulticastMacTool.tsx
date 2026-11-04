"use client";

// ============================================================================
// UI for the SPBM multicast B-MAC tool. One input pair for building an address
// and one for taking one apart, because those are two different jobs a reader
// arrives with - and the workings are shown either way, since the point is
// that the address is DERIVED rather than assigned.
// House CSS classes only (verified); D-83 Example/Clear.
// No keyboard needed (03/11/2026): the I-SID has up and down arrows, 0 to
// 16,777,215 (24 bits), in the base it was typed in (0x64 up is 0x65); the
// nickname and the MAC address stay typed (identifiers, not quantities).
// ============================================================================

import { useMemo, useState } from "react"; // state, and the share encoding memoised
import { useTranslations } from "next-intl";
import {
  buildMulticastMac,
  decodeMulticastMac,
  type SpbmMulticastResult,
} from "@/lib/tools/extreme-spbm-multicast-mac";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { SPBM_MAC_SHARE } from "@/lib/tools/extreme-spbm-multicast-mac/share"; // this tool's share spec: the job's fields as typed
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for the I-SID (03/11/2026)

/** The largest I-SID, 24 bits (ISID_MAX in compute.ts). */
const ISID_MAX = 0xffffff; // 16,777,215

/** Golden-vector-faithful sample: the VOSS user guide's own worked example. */
const EXAMPLE_NICKNAME = "0.00.10";
const EXAMPLE_ISID = "100";
const EXAMPLE_MAC = "03:00:41:00:04:4d";

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

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

  // Share results (2026-11-01): the fields of the job the answer came from (the address, or the nickname and I-SID).
  /** Set the I-SID's text, clear the decode field and build again (typing and the arrows alike). */
  function setIsidText(v: string) {
    // The field's text.
    setIsid(v);
    // The other job's field empties, as typing here always did.
    setMac("");
    // The address for it.
    forward(nickname, v);
  }
  // The I-SID as typed in hexadecimal ("0x64"), which the arrows step as a number and write back in the same base.
  const isidHex = /^0x[0-9a-f]{1,6}$/i.test(isid.trim()); // the parser's hex form
  // The number the arrows step: the hex value in decimal, or the text itself.
  const isidStep = isidHex ? String(parseInt(isid.trim().slice(2), 16)) : isid; // "100"
  // A stepped I-SID, in the base it was typed in.
  const setIsidStepped = (v: string) => setIsidText(isidHex ? "0x" + Number(v).toString(16) : v); // "0x65" or "101"

  const share = useMemo<ShareEncoding>(() => {
    if (!result) return NOTHING; // no answer yet
    return result.direction === "reverse" ? SPBM_MAC_SHARE.encode({ mode: "decode", mac }) : SPBM_MAC_SHARE.encode({ mode: "build", nickname, isid }); // the job's fields
  }, [result, mac, nickname, isid]); // memoised
  // A shared link fills the job's fields and computes, as typing them does.
  useShareArrival(SPBM_MAC_SHARE, (s) => {
    if (s.mode === "decode") { setMac(s.mac); setNickname(""); setIsid(""); reverse(s.mac); } // take the address apart
    else { setNickname(s.nickname); setIsid(s.isid); setMac(""); forward(s.nickname, s.isid); } // build it
  });

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
        {/* Up and down arrows: 0 to 16,777,215, one a press, written back in the base typed. */}
        <StepperField value={isidStep} onValue={setIsidStepped} min={0} max={ISID_MAX} integer label={t("isidLabel")} inputId="spbm-isid">
          <input
            id="spbm-isid"
            className="cidr-input mono"
            spellCheck={false}
            value={isid}
            placeholder="100"
            onChange={(e) => {
              // The typed text, set and built as the arrows do.
              setIsidText(e.target.value);
            }}
            // Arrow Up and Down step the I-SID from the keyboard.
            onKeyDown={stepperKeyDown({ value: isidStep, onValue: setIsidStepped, min: 0, max: ISID_MAX, integer: true })}
          />
        </StepperField>
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
            {/* Share results: under the address and its summary (the answer), at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries", { job: result.direction === "reverse" ? "decode" : "build" })} title={t("name")} />
            </div>
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
