// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/lgtmAudio.ts
// ----------------------------------------------------------------------------
// THE LGTM TOYS' AUDIO, SHARED: starting sound from a tap in a way an iPhone
// in silent mode still plays, like other media (PRIME 15/11/2026 05:24 and
// 05:27: "it needs to play also when the phone in silent mode, just like all
// other media does").
//
// iOS mutes sound made with the Web Audio API when the ringer switch is on,
// and lets <audio> elements play; WebKit's own bug tracker calls the split
// intended (bug 262781). Two measures, both started inside the tap:
//   1. navigator.audioSession.type = "playback" where the browser has it
//      (iOS 17 and later, WebKit bug 237322); set back to "auto" on stop;
//   2. a silent, looping MP3 played by an <audio> element (half a second of
//      silence, public/audio/silence.mp3), which moves the page into media
//      playback; the technique of the unmute-ios-audio library. On 15/11/2026
//      the first measure alone did not unmute the sketch on PRIME's iPhone and
//      the second did, so both stay.
// Nothing is fetched beyond the site's own half second of silence.
// ============================================================================

/** The site's own half second of silence (MP3: iOS plays compressed audio in silent mode). */
const SILENT_SRC = "/audio/silence.mp3";

/** The silent element, made once and kept. */
let silent: HTMLAudioElement | null = null;

/** The browser's audio session, where it has one (Safari 17 and later). */
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/**
 * Put the page into media playback before sound starts. Call it inside the tap that starts the sound.
 */
export function enterMediaPlayback(): void {
  // Where the audio session exists, ask for playback (the setting is ignored elsewhere).
  try {
    // The navigator, with the optional audio session.
    const nav = navigator as AudioSessionNavigator;
    // Playback: not muted by the ringer switch.
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    // Not supported: nothing to set.
  }
  // The silent element, made on first use.
  if (!silent) {
    // An audio element nobody sees.
    silent = document.createElement("audio");
    // Kept out of AirPlay.
    silent.setAttribute("x-webkit-airplay", "deny");
    // Never fullscreen.
    silent.setAttribute("playsinline", "");
    // Loaded at once.
    silent.preload = "auto";
    // Looping for as long as the sound plays.
    silent.loop = true;
    // The half second of silence.
    silent.src = SILENT_SRC;
  }
  // Started inside the tap; a refusal leaves Web Audio playing wherever it is allowed.
  const p = silent.play();
  // Promise-returning browsers report a refusal this way.
  if (p && typeof p.catch === "function") p.catch(() => undefined);
}

/**
 * Leave media playback when the sound stops: the silent element paused and the session handed back.
 */
export function leaveMediaPlayback(): void {
  // The silent element stops.
  if (silent) silent.pause();
  // The session goes back to the browser's own choice.
  try {
    // The navigator, with the optional audio session.
    const nav = navigator as AudioSessionNavigator;
    // Automatic again.
    if (nav.audioSession) nav.audioSession.type = "auto";
  } catch {
    // Not supported: nothing to reset.
  }
}

/**
 * A new audio context, in browsers that have one under either name.
 *
 * @returns the context, or null where Web Audio is missing
 */
export function newAudioContext(): AudioContext | null {
  // The standard name, or WebKit's older one.
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  // A context, or nothing.
  return AC ? new AC() : null;
}

/** Which chime: the green check after an LGTM, or the falling one after "Changes requested". */
export type ChimeKind = "lgtm" | "changes";

/** One note of a chime: its pitch in hertz, its start and length in steps, and a slow bend down at the end. */
interface ChimeNote {
  /** Hertz. */
  f: number;
  /** Start, in steps from the first note. */
  at: number;
  /** Length, in steps. */
  len: number;
  /** A held, wobbling fall at the end (the last note of the "changes" chime). */
  sag?: boolean;
}

/** The chimes. LGTM: the green-check arpeggio G5, B5, D6, G6, rising in sixteenths. Changes requested (PRIME
 *  15/11/2026 21:08): four falling semitones, D5, C#5, C5, B4, in eighths, the last one held and sagging, the old
 *  "not this time" figure, in the same square-wave voice. */
const CHIMES: Record<ChimeKind, { step: number; wave: OscillatorType; level: number; notes: readonly ChimeNote[] }> = {
  lgtm: {
    step: 60 / 132 / 4, // a sixteenth at 132 beats a minute
    wave: "square", // the 8-bit sound
    level: 0.08, // the peak
    notes: [
      { f: 783.99, at: 0, len: 0.9 }, // G5
      { f: 987.77, at: 1, len: 0.9 }, // B5
      { f: 1174.66, at: 2, len: 0.9 }, // D6
      { f: 1567.98, at: 3, len: 3 }, // G6, ringing longer
    ],
  },
  changes: {
    step: 60 / 132 / 2, // an eighth at 132 beats a minute
    wave: "square", // the same 8-bit voice
    level: 0.07, // a touch softer than the good news
    notes: [
      { f: 587.33, at: 0, len: 0.85 }, // D5
      { f: 554.37, at: 1, len: 0.85 }, // C#5
      { f: 523.25, at: 2, len: 0.85 }, // C5
      { f: 493.88, at: 3, len: 4, sag: true }, // B4, held, wobbling and sagging
    ],
  },
};

/**
 * Schedule a chime on a context (a live one for the button, an offline one for a review recording).
 *
 * @param ctx the context
 * @param kind which chime
 * @param t0 when it starts, on the context's clock
 * @returns how long it lasts, in seconds from t0
 */
export function scheduleChime(ctx: BaseAudioContext, kind: ChimeKind, t0: number): number {
  // The chime asked for.
  const c = CHIMES[kind];
  // Where the last note ends, in seconds from t0.
  let end = 0;
  // Each note.
  c.notes.forEach((n) => {
    // A square-wave oscillator.
    const o = ctx.createOscillator();
    // Its volume envelope.
    const g = ctx.createGain();
    // The chime's wave.
    o.type = c.wave;
    // When it starts.
    const t = t0 + n.at * c.step;
    // Its pitch, set as the published LGTM chime sets it (a value, not an automation event), so that chime stays the
    // same sound sample for sample (PRIME 15/11/2026 21:15: "the one currently published is great").
    o.frequency.value = n.f;
    // How long it lasts.
    const d = n.len * c.step;
    // The sag: a wobble (a slow vibrato) and a fall of about a semitone over the held note.
    if (n.sag) {
      // The vibrato's oscillator.
      const lfo = ctx.createOscillator();
      // Its depth, in hertz.
      const depth = ctx.createGain();
      // Five wobbles a second.
      lfo.frequency.value = 5;
      // A third of a semitone either way.
      depth.gain.value = n.f * 0.02;
      // Into the pitch.
      lfo.connect(depth).connect(o.frequency);
      // Running for the note.
      lfo.start(t);
      // And stopped with it.
      lfo.stop(t + d + 0.02);
      // The fall, starting after the first quarter of the note.
      o.frequency.setValueAtTime(n.f, t + d * 0.25);
      // Down about a semitone by the end.
      o.frequency.exponentialRampToValueAtTime(n.f * 0.94, t + d);
    }
    // Silent at first.
    g.gain.setValueAtTime(0.0001, t);
    // A quick attack.
    g.gain.linearRampToValueAtTime(c.level, t + 0.004);
    // A fade to silence.
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    // Wired.
    o.connect(g).connect(ctx.destination);
    // Played.
    o.start(t);
    // Stopped.
    o.stop(t + d + 0.02);
    // The latest end so far.
    end = Math.max(end, n.at * c.step + d);
  });
  // Its length.
  return end;
}

/**
 * A chime alone: the green check after an LGTM, or the falling figure after "Changes requested". The stamp toy plays
 * it by itself when the stamp comes down (PRIME 16/11/2026 02:58: "sound the LGTM chimes automatically, and leave the
 * buttons so the user can replay them at will"), and again whenever its button is pressed. Both calls come from a
 * tap (Stamp, or the button), which is what lets browsers, and an iPhone in silent mode, play it; the page never
 * sounds it on load.
 *
 * @param kind which chime
 * @param after seconds to wait before the first note (the stamp's fall, so the chime lands with it); 0 by default
 */
export function playChime(kind: ChimeKind = "lgtm", after = 0): void {
  // Media playback first, inside the tap.
  enterMediaPlayback();
  // A context for the notes, made inside the tap so the browser lets it sound.
  const ctx = newAudioContext();
  // No Web Audio: no chime.
  if (!ctx) return;
  // When the first note starts: just ahead of the clock, after any wait (scheduled on the audio clock, not a timer,
  // so the tap's permission still covers it).
  const lead = 0.05 + Math.max(0, after);
  // Scheduled.
  const end = scheduleChime(ctx, kind, ctx.currentTime + lead);
  // The context closes after the last note, and the session is handed back.
  window.setTimeout(() => {
    // Closed.
    void ctx.close();
    // Handed back.
    leaveMediaPlayback();
  }, Math.ceil((lead + end + 0.2) * 1000));
}
