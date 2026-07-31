// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/dev/fun/importance-meter/compute.ts
// ----------------------------------------------------------------------------
// THE IMPORTANCE METER.
//
// A joke, built honestly. The site's thesis is "tools that compute, never
// guess", and this one does compute: every input is weighted, the weights are
// real, the subtotal moves when you change things, and the workings are shown.
//
// The subtotal is called APPARENT URGENCY, and it can get very large. Mark it
// urgent, copy forty people, escalate to the board, put the deadline an hour
// away, and the number climbs impressively.
//
// Then it is multiplied by ONE coefficient - the bearing the matter actually
// has on the work you are accountable for - and that coefficient is zero.
//
// So the result is always Z3R0, and the tool never lies to get there. It shows
// the subtotal, shows the coefficient, and shows the multiplication. The joke
// is not that the maths is rigged; the joke is that the maths is correct.
//
// UNLISTED, at PRIME's instruction: nothing links to it. It builds, it appears
// in the sitemap and llms.txt (also his call), and it is reachable only by
// someone who already knows the address.
//
// Like its neighbours in /dev/fun this sits OUTSIDE the /tools framework: no
// catalogue entry, no registry row, no golden vectors, no Example/Clear row.
// D-83 does not apply to a toy whose output is a constant.
// ============================================================================

export interface ImportanceInput {
  /** What the thing is. Free text; does not affect the result. Nothing does. */
  subject: string;
  /** Was URGENT in the subject line, in capitals. */
  markedUrgent: boolean;
  /** How many people were copied who did not need to be. */
  ccCount: number;
  /** How far up it has been escalated. 0 = nobody, 4 = the board. */
  escalation: number;
  /** Hours until the stated deadline. Smaller feels larger. */
  hoursToDeadline: number;
  /** Raised in a meeting you were not invited to. */
  raisedElsewhere: boolean;
  /** A second deadline has already replaced the first one. */
  deadlineMoved: boolean;
}

export interface ImportanceWorking {
  label: string;
  detail: string;
  value: number;
}

export interface ImportanceResult {
  /** Every contribution, in the order it is applied. */
  workings: ImportanceWorking[];
  /** The sum of the contributions. This one is real and can be large. */
  apparentUrgency: number;
  /** The coefficient. Always zero. */
  coefficient: number;
  /** apparentUrgency x coefficient. Always zero. */
  total: number;
  /** Rendered result. Always the same. */
  display: string;
  /** An observation about the subtotal, because it deserves acknowledging. */
  remark:
    | "trivial"
    | "ordinary"
    | "elevated"
    | "considerable"
    | "spectacular";
}

/** The one coefficient. It is not a variable. */
export const COEFFICIENT = 0;

/** Clamp helper, because the inputs are user-controlled and the maths is real. */
const clamp = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;

/**
 * Compute apparent urgency, then apply the coefficient.
 *
 * The weights below are arbitrary but consistent: the same input always gives
 * the same subtotal, which is the only property that matters here.
 */
export function measure(
  input: ImportanceInput,
  /** When present, the coefficient becomes real and the subtotal finally counts. */
  override?: { factor: number },
): ImportanceResult {
  const workings: ImportanceWorking[] = [];

  if (input.markedUrgent) {
    workings.push({
      label: "URGENT in the subject line",
      detail: "In capitals, which doubles it.",
      value: 250,
    });
  }

  const cc = clamp(Math.floor(input.ccCount), 0, 500);
  if (cc > 0) {
    // Superlinear: each additional recipient adds more than the last, because
    // that is how it feels.
    const v = Math.round(cc * 12 + cc * cc * 0.4);
    workings.push({
      label: `${cc} people copied`,
      detail: "Weighted superlinearly. Visibility compounds.",
      value: v,
    });
  }

  const esc = clamp(Math.floor(input.escalation), 0, 4);
  if (esc > 0) {
    const v = [0, 120, 400, 1200, 3600][esc];
    workings.push({
      label: `Escalated ${esc} level${esc === 1 ? "" : "s"}`,
      detail: "Each level triples. This is generous.",
      value: v,
    });
  }

  const hrs = clamp(input.hoursToDeadline, 0, 8760);
  if (hrs <= 72) {
    // Inverse: the closer the deadline, the louder it gets.
    const v = Math.round(2000 / (hrs + 0.5));
    // The detail quotes the time actually remaining rather than describing how
    // the number feels. Sub-hour deadlines are given in minutes, because "0.5
    // hours remaining" is not how anyone says it.
    const remaining =
      hrs < 1
        ? `${Math.max(1, Math.round(hrs * 60))} minutes`
        : `${hrs === Math.round(hrs) ? hrs : hrs.toFixed(1)} hour${hrs === 1 ? "" : "s"}`;
    workings.push({
      label: hrs <= 1 ? "Deadline within the hour" : `${hrs} hours to the deadline`,
      detail: `Inverse to time remaining, you have ${remaining} remaining.`,
      value: v,
    });
  }

  if (input.raisedElsewhere) {
    workings.push({
      label: "Raised in a meeting you were not invited to",
      detail: "Adds weight it did not earn.",
      value: 500,
    });
  }

  if (input.deadlineMoved) {
    workings.push({
      label: "The deadline has already moved once",
      detail: "Subtracts, honestly. A deadline that moved will move again.",
      value: -300,
    });
  }

  const apparentUrgency = workings.reduce((sum, w) => sum + w.value, 0);
  // The ONLY difference between the two modes. Same sum, same multiplication.
  const coefficient = override ? override.factor : COEFFICIENT;
  const total = apparentUrgency * coefficient;

  const remark: ImportanceResult["remark"] =
    apparentUrgency >= 8000
      ? "spectacular"
      : apparentUrgency >= 3000
        ? "considerable"
        : apparentUrgency >= 800
          ? "elevated"
          : apparentUrgency > 0
            ? "ordinary"
            : "trivial";

  return {
    workings,
    apparentUrgency,
    coefficient,
    total,
    display: override ? total.toLocaleString("en-US") : "Z3R0",
    remark,
  };
}


// ===========================================================================
// THE OVERRIDE
// ---------------------------------------------------------------------------
// Unlocked by a key sequence. PRIME's brief was "opposing energy": there WILL
// be fucks given, with everything that entails.
//
// The tool stays honest in this mode. The coefficient stops being zero and
// becomes a genuine multiplier, so the same arithmetic runs and the subtotal
// finally matters - the number that was being annihilated all along is now
// doing the work. Nothing is special-cased and nothing is faked; one constant
// changes value.
//
// Each override carries its own consequence, because "there will be fucks
// given" is only funny if the bill arrives with it.
// ===========================================================================

export interface Override {
  /** Shown as the coefficient's name. */
  label: string;
  /** The multiplier. Deliberately not 1 - restraint is not the point here. */
  factor: number;
  /** What this entails. The bill. */
  consequence: string;
}

export const OVERRIDES: Override[] = [
  {
    label: "SUPREME OVERRIDE: ALL FUCKS UNLOCKED",
    factor: 1,
    consequence:
      "You will read the whole thread. Including the forwarded part. Including the attachment that is a screenshot of an email.",
  },
  {
    label: "SUPREME OVERRIDE: MAXIMUM ENGAGEMENT",
    factor: 3,
    consequence:
      "You have opinions now, and you will be sharing them on a call that could have been an email about a document that could have been a sentence.",
  },
  {
    label: "SUPREME OVERRIDE: PERSONAL STAKE ACQUIRED",
    factor: 7,
    consequence:
      "This is your problem now. It was not your problem. You volunteered, out loud, in front of witnesses, and somebody wrote it down.",
  },
  {
    label: "SUPREME OVERRIDE: TOTAL COMMITMENT",
    factor: 12,
    consequence:
      "You will build the dashboard. Nobody asked for the dashboard. The dashboard will outlive the initiative and be inherited by someone who does not know what it measures.",
  },
  {
    label: "SUPREME OVERRIDE: LOAD-BEARING CONCERN",
    factor: 25,
    consequence:
      "You are now the person people ask about this. Forever. You will be asked about it at a company you have not joined yet.",
  },
  {
    label: "SUPREME OVERRIDE: EVANGELISM MODE",
    factor: 40,
    consequence:
      "You will make slides. The slides will have a maturity model on them. You will present the maturity model to people who were happy before.",
  },
  {
    label: "SUPREME OVERRIDE: FULL CUSTODY",
    factor: 99,
    consequence:
      "You will write the runbook, the postmortem template and the onboarding guide, and then you will be the escalation path for all three at 03:00 on a public holiday.",
  },
];

/** Pick an override deterministically from the subtotal, so results reproduce. */
export function overrideFor(apparentUrgency: number): Override {
  const i = Math.abs(Math.round(apparentUrgency)) % OVERRIDES.length;
  return OVERRIDES[i];
}
