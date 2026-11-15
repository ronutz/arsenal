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

/**
 * The green-check chime alone (G, B, D, G, rising): the stamp toy plays it on an LGTM.
 */
export function playChime(): void {
  // Media playback first, inside the tap.
  enterMediaPlayback();
  // A context for the four notes.
  const ctx = newAudioContext();
  // No Web Audio: no chime.
  if (!ctx) return;
  // The four notes in hertz: G5, B5, D6, G6.
  const notes = [783.99, 987.77, 1174.66, 1567.98];
  // A sixteenth at 132 beats a minute.
  const st = 60 / 132 / 4;
  // Just ahead of the clock.
  const t0 = ctx.currentTime + 0.05;
  // Each note.
  notes.forEach((f, i) => {
    // A square-wave oscillator.
    const o = ctx.createOscillator();
    // Its volume envelope.
    const g = ctx.createGain();
    // The 8-bit sound.
    o.type = "square";
    // Its pitch.
    o.frequency.value = f;
    // When it starts.
    const t = t0 + i * st;
    // The last note rings longer.
    const d = i === notes.length - 1 ? st * 3 : st * 0.9;
    // Silent at first.
    g.gain.setValueAtTime(0.0001, t);
    // A quick attack.
    g.gain.linearRampToValueAtTime(0.08, t + 0.004);
    // A fade to silence.
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    // Wired.
    o.connect(g).connect(ctx.destination);
    // Played.
    o.start(t);
    // Stopped.
    o.stop(t + d + 0.02);
  });
  // The context closes after the last note, and the session is handed back.
  window.setTimeout(() => {
    // Closed.
    void ctx.close();
    // Handed back.
    leaveMediaPlayback();
  }, Math.ceil((0.05 + st * 6 + 0.2) * 1000));
}
