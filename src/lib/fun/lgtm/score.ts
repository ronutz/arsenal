// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/lgtm/score.ts
// ----------------------------------------------------------------------------
// THE LGTM TUNE, THE SCORE (PRIME 15/11/2026 05:14 and 05:34). An original
// chiptune for the LGTM page, NOT a cover: the song's melody belongs to its
// creator, so the theme is carried by our own music instead. The hook is
// "LGTM" in Morse code (ITU-R M.1677-1: L .-.. G --. T - M --), a dot one
// sixteenth note and a dash three, with the standard gaps between signals
// and letters; the arc follows the video's story in our own words: a Friday
// opening, review loops that speed up as approvals pile on (a green-check
// chime each), a bridge whose second pass plays every note twice (the
// customers charged twice), and an ending left on a chord that never comes
// home.
//
// Four eras, the same notes: 8-bit, 16-bit, 32-bit and 64-bit (PRIME 05:34).
// Only the drum pattern and the pads depend on the era here; the instruments
// themselves are drawn by the player (src/components/dev/fun/LgtmTune.tsx).
//
// Pure and deterministic: no DOM, no clock, no Math.random. Every event has a
// time in seconds from the start, so the player schedules it ahead of the
// audio clock and the readout shows it when the clock gets there.
// ============================================================================

/** The four eras of game sound the tune is played in. */
export type Era = 8 | 16 | 32 | 64;

/** Every era, in the order of the switch. */
export const ERAS: readonly Era[] = [8, 16, 32, 64];

/** The voices: lead, harmony (arpeggios and echo), bass, pads (32 and 64 only) and the drums. */
export type Voice = "lead" | "harm" | "pad" | "bass" | "kick" | "snare" | "hat" | "ohat" | "crash";

/** One note or drum hit. */
export interface NoteEvent {
  /** Always "note". */
  kind: "note";
  /** Seconds from the start of the tune. */
  t: number;
  /** Which voice plays it. */
  voice: Voice;
  /** How long it lasts, in seconds. */
  dur: number;
  /** Its frequency in hertz (0 for a drum). */
  f: number;
  /** Which Morse signal it plays (0 to 9: L has four, G three, T one, M two), for the readout. */
  morse?: number;
  /** The approvals this green-check chime adds, for the readout. */
  chime?: number;
  /** The bridge's flat duplicate note: the second charge. */
  glitch?: boolean;
  /** A note held to the end with a natural fade. */
  hold?: boolean;
  /** The note on which the LGTM stamp lands. */
  stamp?: boolean;
  /** The echo of the lead, three sixteenths behind it. */
  echo?: boolean;
  /** An alternate step of an arpeggio (panned to the other side in the eras with stereo). */
  alt?: boolean;
  /** A ghost drum hit, softer. */
  soft?: boolean;
  /** An accented hi-hat. */
  acc?: boolean;
}

/** A change in the readout at the start of a section. */
export interface CueEvent {
  /** Always "cue". */
  kind: "cue";
  /** Seconds from the start of the tune. */
  t: number;
  /** The section's tempo, in beats per minute. */
  bpm: number;
  /** The key of the status line under devFun.toys-lgtm.status (see the page's messages). */
  say: string;
  /** Invoices per order from here on, when it changes. */
  inv?: number;
}

/** Either kind of event. */
export type ScoreEvent = NoteEvent | CueEvent;

/** The tune for one era. */
export interface Score {
  /** The era it was built for. */
  era: Era;
  /** The notes, in time order (what the player schedules). */
  notes: NoteEvent[];
  /** Every event, notes and cues, in time order (what the readout follows). */
  all: ScoreEvent[];
  /** The length in seconds, with room for the last fade or reverb tail. */
  total: number;
}

// ---- Pitches -----------------------------------------------------------------

/** Semitones from A within one octave, for each letter. */
const OFF: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/**
 * A note name ("C4", "G#5") or a frequency, as hertz in equal temperament with A4 at 440 Hz.
 *
 * @param n the name, or a number already in hertz
 * @returns the frequency
 */
export function hz(n: string | number): number {
  // A number is already a frequency.
  if (typeof n === "number") return n;
  // Letter, optional sharp or flat, octave digit.
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  // A malformed name is an authoring error.
  if (!m) throw new Error(`hz: "${n}" is not a note name`);
  // The distance from A4 in semitones.
  const s = OFF[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) - 4) * 12;
  // Twelve semitones to the octave.
  return 440 * Math.pow(2, s / 12);
}

/** A perfect fifth up, as a frequency ratio. */
const FIFTH = Math.pow(2, 7 / 12);

// ---- The parts ---------------------------------------------------------------

/** The hook: L G T M in Morse; [sixteenth step, length in sixteenths, note, Morse signal]. */
const MORSE: readonly (readonly [number, number, string, number])[] = [
  [0, 1, "E5", 0], [2, 3, "G5", 1], [6, 1, "E5", 2], [8, 1, "C5", 3], // L: dot dash dot dot
  [12, 3, "D5", 4], [16, 3, "E5", 5], [20, 1, "C5", 6], // G: dash dash dot
  [24, 3, "A4", 7], // T: dash
  [30, 3, "C5", 8], [34, 3, "A4", 9], // M: dash dash
];

/** The answer phrase after the hook; [step, length, note]. */
const ANSWER: readonly (readonly [number, number, string])[] = [
  [40, 1, "C5"], [41, 1, "F5"], [42, 2, "A5"], [44, 1, "G5"], [45, 1, "F5"], [46, 2, "E5"], [48, 2, "D5"], [50, 2, "B4"], [52, 2, "G4"],
];

/** The green-check chime, a G major arpeggio; [step, length, note]. */
const CHIME: readonly (readonly [number, number, string])[] = [[56, 1, "G5"], [57, 1, "B5"], [58, 1, "D6"], [59, 3, "G6"]];

/** The hook's chords, one a bar: C, A minor, F, G. */
const A_CHORDS: readonly (readonly string[])[] = [["C4", "E4", "G4", "C5"], ["A3", "C4", "E4", "A4"], ["F3", "A3", "C4", "F4"], ["G3", "B3", "D4", "G4"]];

/** The hook's bass roots. */
const A_ROOTS: readonly string[] = ["C3", "A2", "F2", "G2"];

/** The bridge melody in A minor, eight eighth notes a bar. */
const B_MEL: readonly (readonly string[])[] = [
  ["A4", "C5", "E5", "A5", "G5", "E5", "C5", "E5"],
  ["F4", "A4", "C5", "F5", "E5", "C5", "A4", "C5"],
  ["D5", "F5", "A5", "F5", "D5", "A4", "F4", "A4"],
  ["E5", "G#5", "B5", "G#5", "E5", "B4", "G#4", "B4"],
];

/** The bridge's chords: A minor, F, D minor, E. */
const B_CHORDS: readonly (readonly string[])[] = [["A3", "C4", "E4", "A4"], ["F3", "A3", "C4", "F4"], ["D4", "F4", "A4", "D5"], ["E3", "G#3", "B3", "E4"]];

/** The approvals each review loop's chime adds: 1, 4, 16, 64, then 256 in the final loop (341 in all). */
export const APPROVALS: readonly number[] = [1, 4, 16, 64, 256];

/** A function that adds a note at a sixteenth step of the current section. */
type Add = (voice: Voice, step: number, len: number, note: string | number | null, o?: Partial<NoteEvent>) => void;

/**
 * Build the whole tune for one era.
 *
 * @param era the era
 * @returns the score
 */
export function buildScore(era: Era): Score {
  // Every event, in authoring order.
  const ev: ScoreEvent[] = [];
  // The start of the next section, in seconds.
  let T = 0;

  /**
   * One section at one tempo.
   *
   * @param bpm its tempo
   * @param bars its length in bars of four beats
   * @param say the status line's key
   * @param fill writes its notes
   * @param inv invoices per order from here on, when it changes
   */
  const section = (bpm: number, bars: number, say: string, fill: (add: Add) => void, inv?: number) => {
    // A sixteenth note, in seconds.
    const st = 60 / bpm / 4;
    // The section's start.
    const t0 = T;
    // The readout's cue.
    ev.push(inv === undefined ? { kind: "cue", t: t0, bpm, say } : { kind: "cue", t: t0, bpm, say, inv });
    // The note writer for this section.
    const add: Add = (voice, step, len, note, o = {}) =>
      ev.push({ kind: "note", t: t0 + step * st, voice, dur: len * st, f: note === null ? 0 : hz(note), ...o });
    // Its notes.
    fill(add);
    // The next section starts after it.
    T = t0 + bars * 16 * st;
  };

  /**
   * The drums of a few bars, in the era's groove.
   *
   * @param add the note writer
   * @param bars how many bars
   * @param sixteen hi-hats on every sixteenth (8 and 16-bit eras)
   * @param fill a snare roll in the last bar
   */
  const drums = (add: Add, bars: number, sixteen = false, fill = false) => {
    // Bar by bar.
    for (let b = 0; b < bars; b++) {
      // The bar's first step.
      const o = b * 16;
      // 64-bit: four on the floor, a clap on two and four, open hats on the off-beats.
      if (era === 64) {
        // The kick on every beat.
        for (const s of [0, 4, 8, 12]) add("kick", o + s, 2, null);
        // The clap.
        for (const s of [4, 12]) add("snare", o + s, 2, null);
        // The open hats.
        for (const s of [2, 6, 10, 14]) add("ohat", o + s, 2, null);
        // Closed hats on every sixteenth once the tune is busy.
        if (sixteen) for (let s = 0; s < 16; s++) add("hat", o + s, 1, null);
      } else if (era === 32) {
        // 32-bit: a breakbeat, kicks on one and the "and" of three, an extra kick in odd bars.
        for (const s of [0, 10]) add("kick", o + s, 2, null);
        // The extra kick.
        if (b % 2) add("kick", o + 7, 1, null);
        // The snare on two and four.
        for (const s of [4, 12]) add("snare", o + s, 2, null);
        // Ghost snares.
        for (const s of [7, 15]) add("snare", o + s, 1, null, { soft: true });
        // Hats on every sixteenth, accented on the eighths.
        for (let s = 0; s < 16; s++) add("hat", o + s, 1, null, { acc: s % 2 === 0 });
      } else {
        // 8 and 16-bit: a rock beat; the 16-bit groove adds a syncopated kick in odd bars.
        add("kick", o, 2, null);
        // The second kick.
        add("kick", o + 8, 2, null);
        // The syncopation.
        if (era === 16 && b % 2) add("kick", o + 11, 1, null);
        // The snare on two and four.
        add("snare", o + 4, 2, null);
        // And four.
        add("snare", o + 12, 2, null);
        // Hats on the eighths, or the sixteenths when the tune is busy.
        for (let s = 0; s < 16; s += sixteen ? 1 : 2) add("hat", o + s, 1, null, { acc: s % 4 === 2 });
      }
    }
    // A snare roll into the next section.
    if (fill) for (let s = 9; s < 16; s++) add("snare", (bars - 1) * 16 + s, 1, null, { soft: true });
  };

  /**
   * The bass: root, octave, fifth, octave, in eighths.
   *
   * @param add the note writer
   * @param roots one root a bar
   */
  const bass = (add: Add, roots: readonly string[]) => {
    // Bar by bar.
    roots.forEach((r, b) => {
      // The root.
      const f = hz(r);
      // Eight eighth notes.
      [f, f * 2, f * FIFTH, f * 2, f, f * 2, f * FIFTH, f * 2].forEach((x, i) => add("bass", b * 16 + i * 2, 2, x));
    });
  };

  /**
   * Sustained pads under the chords, in the 32 and 64-bit eras only.
   *
   * @param add the note writer
   * @param chords one chord a bar
   */
  const pads = (add: Add, chords: readonly (readonly string[])[]) => {
    // The older eras have no pads.
    if (era < 32) return;
    // Three notes of each chord, held for the bar.
    chords.forEach((c, b) => c.slice(0, 3).forEach((n) => add("pad", b * 16, 16, n)));
  };

  /**
   * The chip trick: a chord played as a fast arpeggio, one note a sixteenth; pads join it in the later eras.
   *
   * @param add the note writer
   * @param chords one chord a bar
   */
  const arps = (add: Add, chords: readonly (readonly string[])[]) => {
    // Bar by bar, sixteenth by sixteenth.
    chords.forEach((c, b) => {
      // The chord's notes in turn.
      for (let s = 0; s < 16; s++) add("harm", b * 16 + s, 1, c[s % c.length], { alt: s % 2 === 1 });
    });
    // The pads underneath.
    pads(add, chords);
  };

  /**
   * Four bars of the hook: the Morse motif, the answer, then the chime.
   *
   * @param add the note writer
   * @param chime the approvals the chime adds
   * @param echo the harmony voice repeats the lead three sixteenths later
   */
  const phrase = (add: Add, chime: number, echo = false) => {
    // The lead, with its echo when asked.
    const lead = (s: number, l: number, n: string, o: Partial<NoteEvent> = {}) => {
      // The note.
      add("lead", s, l, n, o);
      // The echo.
      if (echo) add("harm", s + 3, l, n, { echo: true });
    };
    // The Morse hook.
    for (const [s, l, n, i] of MORSE) lead(s, l, n, { morse: i });
    // The answer.
    for (const [s, l, n] of ANSWER) lead(s, l, n);
    // The chime; its last note carries the approvals.
    CHIME.forEach(([s, l, n], k) => add("lead", s, l, n, k === CHIME.length - 1 ? { chime } : {}));
  };

  /**
   * Four bars of the bridge in A minor; the second pass plays every note twice, the copy slightly flat.
   *
   * @param add the note writer
   * @param twice the double-charge pass
   */
  const bridge = (add: Add, twice: boolean) => {
    // Bar by bar, eighth by eighth.
    B_MEL.forEach((bar, b) =>
      bar.forEach((n, i) => {
        // The eighth's first step.
        const s = b * 16 + i * 2;
        // Twice: two sixteenths, the second the flat copy.
        if (twice) {
          // The first charge.
          add("lead", s, 1, n);
          // The second charge.
          add("lead", s + 1, 1, n, { glitch: true });
        } else {
          // Once, politely.
          add("lead", s, 2, n);
        }
      }),
    );
    // The chords.
    arps(add, B_CHORDS);
    // The bass.
    bass(add, ["A2", "F2", "D3", "E3"]);
  };

  // The intro: Friday, late afternoon.
  section(132, 2, "friday", (add) => {
    // A bass and the drums only.
    bass(add, ["C3", "G2"]);
    // The drums.
    drums(add, 2);
  });
  // Loop 1: the request.
  section(132, 4, "opened", (add) => {
    // The hook alone.
    phrase(add, APPROVALS[0]);
    // The bass.
    bass(add, A_ROOTS);
    // The drums.
    drums(add, 4);
  });
  // Loop 2: more approvals, the arpeggios arrive.
  section(142, 4, "approvals", (add) => {
    // The hook.
    phrase(add, APPROVALS[1]);
    // The arpeggios.
    arps(add, A_CHORDS);
    // The bass.
    bass(add, A_ROOTS);
    // The drums.
    drums(add, 4);
  });
  // Loop 3: green everywhere, the hats double.
  section(154, 4, "green", (add) => {
    // The hook.
    phrase(add, APPROVALS[2]);
    // The arpeggios.
    arps(add, A_CHORDS);
    // The bass.
    bass(add, A_ROOTS);
    // Busier drums.
    drums(add, 4, true);
  });
  // Loop 4: next year's roadmap by Friday, the echo replaces the arpeggios.
  section(166, 4, "roadmap", (add) => {
    // The hook with its echo.
    phrase(add, APPROVALS[3], true);
    // Pads in the later eras.
    pads(add, A_CHORDS);
    // The bass.
    bass(add, A_ROOTS);
    // Busy drums with a roll.
    drums(add, 4, true, true);
  });
  // The bridge, first pass: the warning.
  section(172, 4, "billing", (add) => {
    // Played once.
    bridge(add, false);
    // The drums.
    drums(add, 4);
  });
  // The bridge, second pass: everything charged twice.
  section(172, 4, "twice", (add) => {
    // Played twice.
    bridge(add, true);
    // The drums with a roll.
    drums(add, 4, false, true);
  }, 2);
  // The final loop: all checks passed.
  section(180, 4, "passed", (add) => {
    // The hook.
    phrase(add, APPROVALS[4]);
    // The arpeggios.
    arps(add, A_CHORDS);
    // The bass.
    bass(add, A_ROOTS);
    // Busy drums.
    drums(add, 4, true);
  });
  // The ending: merged, and it never resolves to C.
  section(180, 2, "merged", (add) => {
    // An F major seventh, arpeggiated.
    arps(add, [["F3", "A3", "C4", "E4"]]);
    // Its bass.
    bass(add, ["F2"]);
    // One bar of drums.
    drums(add, 1);
    // A falling line into the last chord.
    for (const [s, l, n] of [[0, 2, "A5"], [2, 2, "G5"], [4, 2, "F5"], [6, 2, "E5"], [8, 4, "C5"], [12, 4, "D5"]] as const) add("lead", s, l, n);
    // G7sus4 (G, C, D, F), left hanging: the stamp lands on it.
    add("lead", 16, 14, "C5", { hold: true, stamp: true });
    // Its upper notes.
    add("harm", 16, 14, "F4", { hold: true });
    // And the D.
    add("harm", 16, 14, "D4", { hold: true });
    // The pads hold it too in the later eras.
    if (era >= 32) for (const n of ["G3", "C4", "D4", "F4"]) add("pad", 16, 14, n, { hold: true });
    // The bass's G.
    add("bass", 16, 14, "G2", { hold: true });
    // One crash.
    add("crash", 16, 1, null);
  });

  // Time order (a stable sort keeps the authoring order of simultaneous events).
  const all = ev.slice().sort((a, b) => a.t - b.t);
  // The notes alone.
  const notes = all.filter((e): e is NoteEvent => e.kind === "note");
  // The length, with room for the reverb tail of the later eras.
  return { era, notes, all, total: T + (era >= 32 ? 2.2 : 0.8) };
}

// ---- The self-test -----------------------------------------------------------

/**
 * The score's promises, checked for every era: the same melody everywhere, ten Morse signals in each of the five
 * hook phrases, 341 approvals in all, the stamp on the last chord, a length between 40 and 60 seconds, the voices each
 * era is allowed, and the same result twice.
 *
 * @returns what was checked and what failed
 */
export function scoreSelfTest(): { checked: number; failures: string[] } {
  // Problems found.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;
  // The lead melody of the 8-bit era, the reference.
  const ref = buildScore(8).notes.filter((n) => n.voice === "lead").map((n) => `${n.t.toFixed(4)}:${n.f.toFixed(2)}`).join(",");
  // Each era.
  for (const era of ERAS) {
    // Built twice.
    const s = buildScore(era);
    // Identical the second time.
    if (JSON.stringify(s) !== JSON.stringify(buildScore(era))) failures.push(`${era}: not deterministic`);
    // The same lead melody as the 8-bit era.
    if (s.notes.filter((n) => n.voice === "lead").map((n) => `${n.t.toFixed(4)}:${n.f.toFixed(2)}`).join(",") !== ref) failures.push(`${era}: the melody differs`);
    // Ten Morse signals in each of the five hook phrases.
    if (s.notes.filter((n) => n.morse !== undefined).length !== 50) failures.push(`${era}: Morse signals are not 50`);
    // 341 approvals.
    if (s.notes.reduce((a, n) => a + (n.chime ?? 0), 0) !== 341) failures.push(`${era}: approvals are not 341`);
    // One stamp, on a held note.
    if (s.notes.filter((n) => n.stamp && n.hold).length !== 1) failures.push(`${era}: the stamp is not on one held note`);
    // Between 40 and 60 seconds.
    if (s.total < 40 || s.total > 60) failures.push(`${era}: ${s.total.toFixed(1)} seconds`);
    // Pads only in the later eras, open hats only in the 64-bit one.
    if ((era < 32) !== !s.notes.some((n) => n.voice === "pad")) failures.push(`${era}: pads in the wrong era`);
    // The open hat belongs to the 64-bit groove.
    if ((era === 64) !== s.notes.some((n) => n.voice === "ohat")) failures.push(`${era}: open hats in the wrong era`);
    // Every frequency is a real pitch (drums carry 0).
    if (s.notes.some((n) => !(n.f === 0 || (n.f > 20 && n.f < 5000)))) failures.push(`${era}: a frequency out of range`);
    // In time order.
    if (s.all.some((e, i) => i > 0 && e.t < s.all[i - 1].t)) failures.push(`${era}: events out of order`);
    // One more era.
    checked += 1;
  }
  // A4 is 440 Hz and C4 about 261.63 Hz.
  if (Math.abs(hz("A4") - 440) > 1e-9 || Math.abs(hz("C4") - 261.6256) > 1e-3) failures.push("hz: the pitches are off");
  // Checked.
  checked += 1;
  // The report.
  return { checked, failures };
}
