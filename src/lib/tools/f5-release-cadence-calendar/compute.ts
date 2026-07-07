// ============================================================================
// src/lib/tools/f5-release-cadence-calendar/compute.ts
// ----------------------------------------------------------------------------
// F5 RELEASE CADENCE CALENDAR.
//
// On 2026-07-06 F5 announced (blog "A faster release cadence," Kunal Anand, CPO)
// a move from a QUARTERLY to a MONTHLY security release cadence:
//
//   * Monthly HARDENED SOFTWARE RELEASES ship on the THIRD WEDNESDAY of every
//     month, starting 2026-07-15.
//   * Monthly SECURITY NOTIFICATIONS are published one month after each hardened
//     release; the first lands 2026-08-19 and covers the 2026-07-15 release.
//   * Out-of-band SECURITY ALERTS and ENGINEERING HOTFIXES continue as needed.
//
// F5's two concrete anchors align exactly to third Wednesdays: 2026-07-15 (3rd
// Wed of July) and 2026-08-19 (3rd Wed of August). So the whole cadence collapses
// to a single rule: on every third Wednesday, that month's hardened release ships
// AND the previous month's security notification is published. This tool computes
// those dates so an admin can plan patch/maintenance windows.
//
// F5 explicitly retains flexibility to adjust the timing, content, or approach of
// a notification where law, contract, coordinated disclosure, government
// coordination, active exploitation, materiality, embargo, or customer protection
// requires it. These are therefore the SCHEDULED dates, not guarantees.
//
// Pure local date arithmetic. No network, no secrets.
// ============================================================================

// First monthly hardened release (before this date the program did not exist;
// F5 was on a quarterly cadence).
const PROGRAM_START = "2026-07-15";
// First monthly security notification (covers the PROGRAM_START release).
const FIRST_NOTIFICATION = "2026-08-19";

export interface CadenceInput {
  /** Reference date, ISO "YYYY-MM-DD". The client passes the real "today". */
  from?: string;
  /** How many upcoming cadence dates (third Wednesdays) to list. 1..24. */
  months?: number;
}

export interface CadenceCycle {
  /** The third Wednesday: a single day on which both events below land. */
  date: string;
  /** The hardened software release that ships on this date (always present). */
  hardenedRelease: string;
  /** The security notification published on this date, or null before the first
   *  one (2026-08-19) exists. */
  notificationPublished: string | null;
  /** Which prior hardened release that notification covers, or null. */
  notificationCovers: string | null;
}

export interface CadenceResult {
  referenceDate: string;
  programStart: string;
  firstNotification: string;
  cycles: CadenceCycle[];
  /** The next hardened release on or after the reference date. */
  nextHardenedRelease: string;
  /** The next security notification on or after the reference date. */
  nextSecurityNotification: string;
}

/** The third Wednesday of a given year/month as an ISO date. Uses UTC so the
 *  weekday never slips across timezones. */
function thirdWednesday(year: number, month1: number): string {
  const dow = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay(); // 0=Sun..6=Sat
  const offsetToWed = (3 - dow + 7) % 7; // Wednesday = 3
  const day = 1 + offsetToWed + 14; // first Wednesday + two weeks
  return `${year.toString().padStart(4, "0")}-${month1.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

/** Advance a (year, month1) pair by one month. */
function nextMonth(year: number, month1: number): [number, number] {
  return month1 === 12 ? [year + 1, 1] : [year, month1 + 1];
}

/** Normalize/validate an ISO date; fall back to PROGRAM_START on garbage. */
function normDate(s: string | undefined): string {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return PROGRAM_START;
}

export function run(input: CadenceInput): CadenceResult {
  const reference = normDate(input?.from);
  const count = Math.max(1, Math.min(24, Math.trunc(input?.months ?? 6)));

  // The listing begins at the later of (the reference month's third Wednesday if
  // still upcoming) and the program start. We walk months from the reference and
  // keep third Wednesdays that are >= max(reference, PROGRAM_START).
  const floor = reference < PROGRAM_START ? PROGRAM_START : reference;

  // Start walking from the reference month.
  let [y, m] = [parseInt(reference.slice(0, 4), 10), parseInt(reference.slice(5, 7), 10)];

  const cycles: CadenceCycle[] = [];
  // Guard the loop; 24 results across at most ~30 month-steps.
  let steps = 0;
  while (cycles.length < count && steps < 60) {
    steps++;
    const tw = thirdWednesday(y, m);
    if (tw >= floor) {
      // The notification published on this date covers the PREVIOUS month's
      // release, and only exists from FIRST_NOTIFICATION onward.
      const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1];
      const prevRelease = thirdWednesday(py, pm);
      const hasNotification = tw >= FIRST_NOTIFICATION;
      cycles.push({
        date: tw,
        hardenedRelease: tw,
        notificationPublished: hasNotification ? tw : null,
        notificationCovers: hasNotification ? prevRelease : null,
      });
    }
    [y, m] = nextMonth(y, m);
  }

  const nextHardenedRelease = cycles.length > 0 ? cycles[0].hardenedRelease : PROGRAM_START;
  const firstWithNotif = cycles.find((c) => c.notificationPublished !== null);
  const nextSecurityNotification = firstWithNotif
    ? (firstWithNotif.notificationPublished as string)
    : FIRST_NOTIFICATION;

  return {
    referenceDate: reference,
    programStart: PROGRAM_START,
    firstNotification: FIRST_NOTIFICATION,
    cycles,
    nextHardenedRelease,
    nextSecurityNotification,
  };
}
