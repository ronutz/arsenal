"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/VlsmAllocationOrderLab.tsx
// ----------------------------------------------------------------------------
// THE VLSM ALLOCATION-ORDER LAB (2026-10-26), embedded in "A VLSM allocation,
// worked end to end" as <Lab id="vlsm-allocation-order" />. Three host counts, the
// links as /30 or /31, and the placement order; the result is the plan as a
// table (block, usable range, addresses skipped before it), the account of
// the parent (used, free, utilisation, the free space as aligned blocks) and
// a verdict on whether every request fitted. The model is
// src/lib/labs/vlsm-allocation-order/compute.ts; its cases, the article's own
// tables, are the golden vectors beside it.
// Words: "learnLabs.vlsm-allocation-order".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_HOSTS,
  PARENT,
  PARENT_SIZE,
  VlsmError,
  type LinkPrefix,
  type Order,
  type Placement,
  type SegmentId,
  type VlsmErrorCode,
  type VlsmInput,
  type VlsmResult,
} from "@/lib/labs/vlsm-allocation-order/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "vlsm-allocation-order";

/** The form as typed: host counts stay text so the reader can edit freely. */
interface Form {
  /** Office hosts, as typed. */
  office: string;
  /** Guest Wi-Fi hosts, as typed. */
  guest: string;
  /** Management hosts, as typed. */
  management: string;
  /** /30 or /31 links. */
  links: LinkPrefix;
  /** Placement order. */
  order: Order;
}

/** A model input as the form shows it. */
function toForm(i: VlsmInput): Form {
  // Numbers become text.
  return { office: String(i.office), guest: String(i.guest), management: String(i.management), links: i.links, order: i.order };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function VlsmAllocationOrderLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.vlsm-allocation-order");
  // The page's language, for numbers and lists.
  const locale = useLocale();
  // The reader's settings, opening on the article's plan.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers.
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // One decimal, for the utilisation.
  const nf1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });

  // The model's answer, or the code it refused the input with.
  let r: VlsmResult | null = null;
  // The refusal code, when there is one.
  let err: VlsmErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ office: readNumber(form.office), guest: readNumber(form.guest), management: readNumber(form.management), links: form.links, order: form.order });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof VlsmError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-hosts" ? t("errorHosts", { max: nf0.format(MAX_HOSTS) }) : err ? t("errorChoice") : null;
  /** True when this host field holds an invalid count (all three are checked together). */
  const badField = (s: string): boolean => err === "bad-hosts" && !(Number.isInteger(readNumber(s)) && readNumber(s) >= 1 && readNumber(s) <= MAX_HOSTS);

  // The link options.
  const linkOptions = [
    ["30", t("links30")],
    ["31", t("links31")],
  ] as const;
  // The order options.
  const orderOptions = [
    ["largest", t("orderLargest")],
    ["arrival", t("orderArrival")],
    ["smallest", t("orderSmallest")],
  ] as const;
  /** A segment's name, worded. */
  const segName = (id: SegmentId): string =>
    id === "link-a" ? t("segLinkA") : id === "link-b" ? t("segLinkB") : id === "management" ? t("segManagement") : id === "office" ? t("segOffice") : t("segGuest");
  /** The skipped addresses before a block, worded. */
  const skippedText = (p: Placement): string => (p.block === null ? t("didNotFit") : p.skipped ? t("skipped", { from: p.skipped.from, to: p.skipped.to, n: nf0.format(p.skipped.count) }) : t("nothing"));

  /** The result block for a valid input. */
  const resultBlock = (res: VlsmResult) => {
    // Every request fitted, or some did not.
    const verdict = res.notFitted.length === 0 ? t("verdictFits") : t("verdictMissing", { list: lf.format(res.notFitted.map(segName)) });
    // Fitting is good news; a stranded request is a stop.
    const tone = res.notFitted.length === 0 ? "ok" : "stop";
    // The largest free block, in addresses (its prefix length read back from the CIDR text).
    const largestFree = Math.max(0, ...res.freeBlocks.map((b) => 2 ** (32 - Number(b.split("/")[1]))));
    // The stranded segments a gap could still hold, by going back for it.
    const gapCould = res.placements.filter((p) => p.block === null && p.size <= largestFree).map((p) => segName(p.id));
    return (
      <>
        {/* The plan, in placement order. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colSegment")}</th>
                <th scope="col">{t("colHosts")}</th>
                <th scope="col">{t("colBlock")}</th>
                <th scope="col">{t("colUsable")}</th>
                <th scope="col">{t("colSkipped")}</th>
              </tr>
            </thead>
            <tbody>
              {res.placements.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{segName(p.id)}</th>
                  <td>{nf0.format(p.hosts)}</td>
                  <td className="mono">{p.block ?? t("none")}</td>
                  <td className="mono">{p.firstHost && p.lastHost ? t("range", { first: p.firstHost, last: p.lastHost }) : t("none")}</td>
                  <td>{skippedText(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The account of the parent. */}
        <dl className="lab-kv">
          <dt>{t("kvParent")}</dt>
          <dd className="mono">{PARENT}</dd>
          <dt>{t("kvUsed")}</dt>
          <dd>{t("ofTotal", { n: nf0.format(res.used), total: nf0.format(PARENT_SIZE), pct: nf1.format(res.utilisation) })}</dd>
          <dt>{t("kvFree")}</dt>
          <dd>{res.freeBlocks.length ? t("freeList", { n: nf0.format(res.free), list: lf.format(res.freeBlocks) }) : t("none")}</dd>
        </dl>
        {/* Did everything fit? */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
        {/* Room in a gap is not room in the plan. */}
        {gapCould.length > 0 && <p className="lab-note">{t("noteGap", { list: lf.format(gapCould) })}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-office`} label={t("office")}>
            <input id={`${ID}-office`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_HOSTS} step={1} value={form.office} aria-invalid={badField(form.office) ? "true" : undefined} onChange={(e) => setForm({ ...form, office: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-guest`} label={t("guest")}>
            <input id={`${ID}-guest`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_HOSTS} step={1} value={form.guest} aria-invalid={badField(form.guest) ? "true" : undefined} onChange={(e) => setForm({ ...form, guest: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-management`} label={t("management")}>
            <input id={`${ID}-management`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_HOSTS} step={1} value={form.management} aria-invalid={badField(form.management) ? "true" : undefined} onChange={(e) => setForm({ ...form, management: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-links`} label={t("links")}>
            <LabSelect id={`${ID}-links`} value={form.links} options={linkOptions} onChange={(v) => setForm({ ...form, links: v as LinkPrefix })} />
          </LabField>
          <LabField id={`${ID}-order`} label={t("order")}>
            <LabSelect id={`${ID}-order`} value={form.order} options={orderOptions} onChange={(v) => setForm({ ...form, order: v as Order })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
