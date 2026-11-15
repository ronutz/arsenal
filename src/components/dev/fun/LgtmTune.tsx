// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/LgtmTune.tsx
// ----------------------------------------------------------------------------
// THE LGTM TUNE, THE PLAYER (PRIME 15/11/2026 05:14, 05:16, 05:34). An
// original chiptune (src/lib/fun/lgtm/score.ts) synthesized live with the Web
// Audio API in four eras of game sound, chosen with a switch on top: 8-bit
// (pulse waves, a triangle bass, noise drums), 16-bit (two-operator frequency
// modulation with a dark echo), 32-bit (detuned sawtooths, filtered pads, a
// breakbeat, reverb) and 64-bit (stacked sawtooths, a four-on-the-floor kick
// that makes the pads pump, a stereo delay, a long reverb). The stage's look
// changes with the era (fun-lgtm.css, data-era on the stage).
//
// It plays only when pressed, never by itself; a switch of era mid-tune
// restarts it in the new era; the era is remembered in this browser
// (localStorage key ronutz:fun:lgtm-era, registered in the desk registry as
// never synced). An iPhone in silent mode plays it like other media
// (lgtmAudio.ts). The readout follows the music: the status line, the Morse
// signals of the hook, the approvals, the tempo, invoices per order, and the
// LGTM stamp on the last chord.
// ============================================================================

"use client";

// React's state, refs, effects and memos.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// The strings.
import { useTranslations } from "next-intl";
// The score: the eras and the tune for each.
import { ERAS, buildScore, type Era, type NoteEvent, type Score } from "@/lib/fun/lgtm/score";
// Media playback for an iPhone in silent mode, and the audio context.
import { enterMediaPlayback, leaveMediaPlayback, newAudioContext } from "./lgtmAudio";

/** Where this browser remembers the era (registered in src/lib/desk/registry.ts as local only). */
export const ERA_KEY = "ronutz:fun:lgtm-era";

/** The master level per era, so the busier eras do not play louder. */
const TRIM: Record<Era, number> = { 8: 0.9, 16: 0.85, 32: 0.8, 64: 0.75 };

/** The Morse signals of the hook, as drawn: L, G, T, M, each a list of dot (false) or dash (true). */
const MORSE_DRAWN: readonly { letter: string; dashes: readonly boolean[] }[] = [
  { letter: "L", dashes: [false, true, false, false] },
  { letter: "G", dashes: [true, true, false] },
  { letter: "T", dashes: [true] },
  { letter: "M", dashes: [true, true] },
];

/** The audio graph of one playthrough: the context, the master gain and the era's effect inputs. */
interface Engine {
  /** The audio context. */
  ctx: AudioContext;
  /** The master gain (the volume slider). */
  out: GainNode;
  /** The 8-bit pulse waves (25% and 12.5% duty). */
  p25: PeriodicWave;
  /** The thinner pulse. */
  p12: PeriodicWave;
  /** One second of fixed-seed noise for the drums. */
  noise: AudioBuffer;
  /** The 16-bit echo's input. */
  echo?: AudioNode;
  /** The 32 and 64-bit reverb's input. */
  rev?: AudioNode;
  /** The 64-bit ping-pong delay's input. */
  pp?: AudioNode;
  /** The 64-bit sidechain bus (pads and bass). */
  duck?: GainNode;
  /** The audio clock's time at which the tune starts. */
  t0: number;
}

/**
 * A fixed-seed xorshift generator, so the noise and the reverb are the same on every play.
 *
 * @param seed the seed
 * @returns a function returning numbers in [0, 1)
 */
function rand(seed: number): () => number {
  // The state.
  let x = seed | 0;
  // Each call.
  return () => {
    // Xorshift 32.
    x ^= x << 13;
    // Second shift.
    x ^= x >>> 17;
    // Third shift.
    x ^= x << 5;
    // As a fraction.
    return (x >>> 0) / 4294967296;
  };
}

/**
 * A pulse wave of a given duty cycle, as a Fourier series.
 *
 * @param ctx the audio context
 * @param duty the fraction of the cycle that is high
 * @returns the wave
 */
function pulse(ctx: AudioContext, duty: number): PeriodicWave {
  // Forty harmonics.
  const n = 40;
  // Cosine terms.
  const re = new Float32Array(n);
  // No sine terms.
  const im = new Float32Array(n);
  // Each harmonic's amplitude for a pulse centred on zero.
  for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  // The wave.
  return ctx.createPeriodicWave(re, im);
}

/**
 * Decaying stereo noise: a generated reverb tail.
 *
 * @param ctx the audio context
 * @param sec its length in seconds
 * @param pow how fast it decays
 * @returns the impulse response
 */
function impulse(ctx: AudioContext, sec: number, pow: number): AudioBuffer {
  // Fixed seed.
  const r = rand(0x9e3779b9);
  // Its length in samples.
  const len = Math.floor(ctx.sampleRate * sec);
  // Two channels.
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  // Each channel.
  for (let ch = 0; ch < 2; ch++) {
    // Its samples.
    const d = b.getChannelData(ch);
    // Noise, fading to zero.
    for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, pow);
  }
  // The tail.
  return b;
}

/** How a sound is sent into the mix. */
interface Send {
  /** Stereo position, -1 to 1. */
  pan?: number;
  /** Reverb send level. */
  rev?: number;
  /** Echo send level. */
  echo?: number;
  /** Ping-pong delay send level. */
  pp?: number;
  /** Through the sidechain bus. */
  duck?: boolean;
}

/** An envelope's shape. */
interface Env {
  /** Attack time in seconds. */
  a?: number;
  /** Release time in seconds. */
  r?: number;
  /** Sustain level as a fraction of the peak. */
  s?: number;
  /** A natural (exponential) fade over the whole note instead. */
  exp?: boolean;
}

/**
 * Send a sound into the mix and the era's effects.
 *
 * @param e the engine
 * @param node the sound's last node
 * @param o where it goes
 */
function route(e: Engine, node: AudioNode, o: Send): void {
  // The node actually connected (after an optional panner).
  let n: AudioNode = node;
  // Panned where asked and where the browser can.
  if (o.pan && e.ctx.createStereoPanner) {
    // The panner.
    const p = e.ctx.createStereoPanner();
    // Its position.
    p.pan.value = o.pan;
    // Wired.
    n.connect(p);
    // Onwards from the panner.
    n = p;
  }
  // Into the sidechain bus or the master.
  n.connect(o.duck && e.duck ? e.duck : e.out);
  // The sends that exist in this era.
  for (const [lvl, dest] of [[o.rev, e.rev], [o.echo, e.echo], [o.pp, e.pp]] as const) {
    // Only where asked and where the effect exists.
    if (!lvl || !dest) continue;
    // A send level.
    const g = e.ctx.createGain();
    // Its value.
    g.gain.value = lvl;
    // Wired.
    n.connect(g);
    // Into the effect.
    g.connect(dest);
  }
}

/**
 * A volume envelope: a quick attack, then a chip-style fall to a sustain and a release, or a natural fade.
 *
 * @param g the gain to shape
 * @param t when the note starts
 * @param dur how long it lasts
 * @param vol its peak
 * @param o the shape
 */
function env(g: GainNode, t: number, dur: number, vol: number, o: Env): void {
  // Attack.
  const a = o.a ?? 0.004;
  // Release.
  const r = o.r ?? Math.min(0.05, dur * 0.3);
  // Silent at first.
  g.gain.setValueAtTime(0.0001, t);
  // Up to the peak.
  g.gain.linearRampToValueAtTime(vol, t + a);
  // A natural fade over the whole note.
  if (o.exp) {
    // To silence at the end.
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
    // Done.
    return;
  }
  // Down to the sustain.
  g.gain.linearRampToValueAtTime(vol * (o.s ?? 0.6), Math.max(t + a + 0.001, t + dur - r));
  // Released.
  g.gain.linearRampToValueAtTime(0, t + dur);
}

/**
 * One oscillator note.
 *
 * @param e the engine
 * @param wave a built-in wave name or a periodic wave
 * @param f frequency
 * @param t start
 * @param dur length
 * @param vol peak level
 * @param o envelope, sends, a detune in cents, a pitch drop target
 */
function osc(e: Engine, wave: OscillatorType | PeriodicWave, f: number, t: number, dur: number, vol: number, o: Env & Send & { detune?: number; drop?: number } = {}): void {
  // The oscillator.
  const s = e.ctx.createOscillator();
  // Its envelope.
  const g = e.ctx.createGain();
  // A built-in wave or a custom one.
  if (!(wave instanceof PeriodicWave)) s.type = wave;
  // The custom pulse.
  else s.setPeriodicWave(wave);
  // Its pitch.
  s.frequency.setValueAtTime(f, t);
  // The flat duplicate of the bridge.
  if (o.detune) s.detune.setValueAtTime(o.detune, t);
  // A kick's falling pitch.
  if (o.drop) s.frequency.exponentialRampToValueAtTime(o.drop, t + dur);
  // Shaped.
  env(g, t, dur, vol, o);
  // Wired.
  s.connect(g);
  // Into the mix.
  route(e, g, o);
  // Played.
  s.start(t);
  // Stopped.
  s.stop(t + dur + 0.05);
}

/**
 * Detuned oscillators through a moving low-pass filter (the 32 and 64-bit sounds).
 *
 * @param e the engine
 * @param f frequency
 * @param t start
 * @param dur length
 * @param vol peak level
 * @param o how many oscillators, their spread in cents, the filter's start, end and resonance, envelope and sends
 */
function stack(e: Engine, f: number, t: number, dur: number, vol: number, o: Env & Send & { n?: number; spread?: number; lp?: readonly [number, number, number]; detune?: number } = {}): void {
  // How many oscillators.
  const n = o.n ?? 1;
  // The envelope.
  const g = e.ctx.createGain();
  // The filter.
  const flt = e.ctx.createBiquadFilter();
  // Its start, end and resonance.
  const [f0, f1, q] = o.lp ?? [8000, 8000, 0.7];
  // Low-pass.
  flt.type = "lowpass";
  // Resonance.
  flt.Q.value = q;
  // Its opening.
  flt.frequency.setValueAtTime(f0, t);
  // Closing over most of the note.
  flt.frequency.exponentialRampToValueAtTime(f1, t + Math.max(0.05, dur * 0.8));
  // Each oscillator.
  for (let i = 0; i < n; i++) {
    // A sawtooth.
    const s = e.ctx.createOscillator();
    // Its place in the spread, -0.5 to 0.5.
    const k = n > 1 ? i / (n - 1) - 0.5 : 0;
    // Sawtooth by default.
    s.type = "sawtooth";
    // The pitch.
    s.frequency.setValueAtTime(f, t);
    // Spread and any flat duplicate.
    s.detune.setValueAtTime(k * (o.spread ?? 0) + (o.detune ?? 0), t);
    // Wide stacks are spread across the stereo field.
    if (n > 2 && e.ctx.createStereoPanner) {
      // A panner per oscillator.
      const p = e.ctx.createStereoPanner();
      // Its position.
      p.pan.value = k * 1.2;
      // Wired through it.
      s.connect(p).connect(flt);
    } else {
      // Straight into the filter.
      s.connect(flt);
    }
    // Played.
    s.start(t);
    // Stopped.
    s.stop(t + dur + 0.05);
  }
  // Shaped.
  env(g, t, dur, vol, o);
  // The filter into the envelope.
  flt.connect(g);
  // Into the mix.
  route(e, g, o);
}

/**
 * Two-operator frequency modulation: a modulator bends the carrier, bright at the attack and mellower after.
 *
 * @param e the engine
 * @param f frequency
 * @param t start
 * @param dur length
 * @param vol peak level
 * @param o ratio, index, resting index and its time constant, a detune, envelope and sends
 */
function fm(e: Engine, f: number, t: number, dur: number, vol: number, o: Env & Send & { ratio?: number; index?: number; rest?: number; tau?: number; detune?: number } = {}): void {
  // The carrier.
  const car = e.ctx.createOscillator();
  // The modulator.
  const mod = e.ctx.createOscillator();
  // The modulation depth.
  const mg = e.ctx.createGain();
  // The envelope.
  const g = e.ctx.createGain();
  // The carrier's pitch.
  car.frequency.setValueAtTime(f, t);
  // The modulator's, at its ratio.
  mod.frequency.setValueAtTime(f * (o.ratio ?? 1), t);
  // The flat duplicate moves both.
  if (o.detune) {
    // The carrier.
    car.detune.setValueAtTime(o.detune, t);
    // The modulator.
    mod.detune.setValueAtTime(o.detune, t);
  }
  // Bright at first.
  mg.gain.setValueAtTime((o.index ?? 2) * f, t);
  // Then settling.
  mg.gain.setTargetAtTime((o.rest ?? 0.5) * f, t, o.tau ?? 0.15);
  // The modulator into the depth.
  mod.connect(mg);
  // The depth into the carrier's frequency.
  mg.connect(car.frequency);
  // Shaped.
  env(g, t, dur, vol, o);
  // The carrier into its envelope.
  car.connect(g);
  // Into the mix.
  route(e, g, o);
  // Both played.
  car.start(t);
  // The modulator too.
  mod.start(t);
  // Both stopped.
  car.stop(t + dur + 0.05);
  // The modulator too.
  mod.stop(t + dur + 0.05);
}

/**
 * Filtered noise: snares, hats and the crash.
 *
 * @param e the engine
 * @param t start
 * @param dur length
 * @param vol level
 * @param type the filter type
 * @param freq the filter frequency
 * @param q its resonance
 * @param o sends
 */
function hiss(e: Engine, t: number, dur: number, vol: number, type: BiquadFilterType, freq: number, q = 0.7, o: Send = {}): void {
  // The noise player.
  const src = e.ctx.createBufferSource();
  // Its filter.
  const flt = e.ctx.createBiquadFilter();
  // Its envelope.
  const g = e.ctx.createGain();
  // The fixed-seed noise.
  src.buffer = e.noise;
  // Looped, for the long crash.
  src.loop = true;
  // The filter's type.
  flt.type = type;
  // Its frequency.
  flt.frequency.value = freq;
  // Its resonance.
  flt.Q.value = q;
  // Full at once.
  g.gain.setValueAtTime(vol, t);
  // Decaying.
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  // Wired.
  src.connect(flt).connect(g);
  // Into the mix.
  route(e, g, o);
  // From a fixed offset into the noise, for its length.
  src.start(t, (t * 0.37) % 0.5, dur + 0.02);
}

/**
 * The 64-bit sidechain pump: the pads and bass dip on every kick.
 *
 * @param e the engine
 * @param t the kick's time
 */
function duck(e: Engine, t: number): void {
  // Only in the era that has the bus.
  if (!e.duck) return;
  // Its gain.
  const p = e.duck.gain;
  // Full.
  p.setValueAtTime(1, t);
  // Down at the kick.
  p.linearRampToValueAtTime(0.3, t + 0.012);
  // Back up.
  p.linearRampToValueAtTime(1, t + 0.24);
}

/**
 * Play one note of the score in the era's instrument.
 *
 * @param e the engine
 * @param era the era
 * @param n the note
 */
function sound(e: Engine, era: Era, n: NoteEvent): void {
  // Its time on the audio clock.
  const t = e.t0 + n.t;
  // Held notes ring their full length; others are articulated.
  const d = n.hold ? n.dur : n.dur * 0.9;
  // The bridge's flat copy.
  const detune = n.glitch ? -38 : 0;
  // 8-bit: pulse, triangle, noise.
  if (era === 8) {
    // By voice.
    if (n.voice === "lead") osc(e, e.p25, n.f, t, d, 0.15, { detune, exp: n.hold });
    // The thinner pulse for harmony and echo.
    else if (n.voice === "harm") osc(e, e.p12, n.f, t, n.hold ? d : n.dur * 0.85, n.echo ? 0.05 : n.hold ? 0.07 : 0.055, { exp: n.hold });
    // The triangle bass.
    else if (n.voice === "bass") osc(e, "triangle", n.f, t, d, 0.3, { exp: n.hold });
    // A triangle kick with a pitch drop.
    else if (n.voice === "kick") osc(e, "triangle", 160, t, 0.09, 0.45, { drop: 42 });
    // A band of noise for the snare.
    else if (n.voice === "snare") hiss(e, t, n.soft ? 0.07 : 0.13, n.soft ? 0.12 : 0.2, "bandpass", 1900, 0.6);
    // High noise for the hat.
    else if (n.voice === "hat") hiss(e, t, 0.03, n.acc ? 0.07 : 0.045, "highpass", 7000);
    // A long high noise for the crash.
    else if (n.voice === "crash") hiss(e, t, 1.6, 0.16, "highpass", 3800);
    // Done.
    return;
  }
  // 16-bit: frequency modulation and an echo.
  if (era === 16) {
    // A brassy lead.
    if (n.voice === "lead") fm(e, n.f, t, d, 0.17, { ratio: 1, index: 2.4, rest: 0.7, tau: 0.25, detune, exp: n.hold, echo: 0.32 });
    // A bell for the arpeggios.
    else if (n.voice === "harm") fm(e, n.f, t, n.hold ? d : Math.max(n.dur, 0.14), n.echo ? 0.05 : n.hold ? 0.07 : 0.05, { ratio: 3.5, index: 3, rest: 0.2, tau: 0.08, exp: true, echo: 0.25 });
    // A slap bass.
    else if (n.voice === "bass") fm(e, n.f, t, d, 0.3, { ratio: 1, index: 3.5, rest: 0.5, tau: 0.06, exp: n.hold });
    // A sine kick.
    else if (n.voice === "kick") osc(e, "sine", 150, t, 0.16, 0.6, { drop: 45, exp: true });
    // A noise snare with a tonal body.
    else if (n.voice === "snare") {
      // The noise.
      hiss(e, t, n.soft ? 0.06 : 0.12, n.soft ? 0.1 : 0.18, "bandpass", 1500, 0.8, { echo: 0.12 });
      // The body, on full hits.
      if (!n.soft) osc(e, "triangle", 190, t, 0.08, 0.2, { drop: 140, exp: true });
    }
    // The hat.
    else if (n.voice === "hat") hiss(e, t, 0.035, n.acc ? 0.06 : 0.04, "highpass", 8000);
    // The crash, echoed.
    else if (n.voice === "crash") hiss(e, t, 2.0, 0.15, "highpass", 4200, 0.7, { echo: 0.2 });
    // Done.
    return;
  }
  // 32-bit: sawtooths, pads, a breakbeat, reverb.
  if (era === 32) {
    // Two detuned sawtooths through a resonant filter.
    if (n.voice === "lead") stack(e, n.f, t, d, 0.11, { n: 2, spread: 14, lp: [3600, 1700, 5], detune, exp: n.hold, rev: 0.2 });
    // A plucked sawtooth, left and right in turn.
    else if (n.voice === "harm") stack(e, n.f, t, n.hold ? d : n.dur * 0.8, n.hold ? 0.05 : 0.04, { lp: [2600, 500, 3], exp: true, pan: n.alt ? 0.45 : -0.45, rev: 0.15 });
    // A slow pad.
    else if (n.voice === "pad") stack(e, n.f, t, d, 0.03, { n: 2, spread: 12, lp: [1400, 1400, 1], a: 0.3, r: 0.3, rev: 0.45 });
    // A filtered sawtooth bass with a sine under it.
    else if (n.voice === "bass") {
      // The sawtooth.
      stack(e, n.f, t, d, 0.14, { lp: [700, 260, 4], exp: n.hold });
      // The sine.
      osc(e, "sine", n.f, t, d, 0.16, { exp: n.hold });
    }
    // A sine kick with a click.
    else if (n.voice === "kick") {
      // The body.
      osc(e, "sine", 125, t, 0.24, 0.75, { drop: 40, exp: true });
      // The click.
      hiss(e, t, 0.012, 0.25, "highpass", 3000);
    }
    // A snare with a tonal body, into the reverb.
    else if (n.voice === "snare") {
      // The noise.
      hiss(e, t, n.soft ? 0.07 : 0.17, n.soft ? 0.08 : 0.22, "bandpass", 2200, 0.7, { rev: 0.25 });
      // The body, on full hits.
      if (!n.soft) osc(e, "sine", 220, t, 0.07, 0.18, { drop: 160, exp: true });
    }
    // The hats, left and right.
    else if (n.voice === "hat") hiss(e, t, 0.03, n.acc ? 0.06 : 0.035, "highpass", 9000, 0.7, { pan: n.acc ? 0.3 : -0.3 });
    // The crash, into the reverb.
    else if (n.voice === "crash") hiss(e, t, 2.2, 0.14, "highpass", 4000, 0.7, { rev: 0.4 });
    // Done.
    return;
  }
  // 64-bit: stacked sawtooths, sidechain, delay, a long reverb.
  if (n.voice === "lead") {
    // Five sawtooths.
    stack(e, n.f, t, d, 0.075, { n: 5, spread: 24, lp: [6500, 3800, 1], detune, exp: n.hold, rev: 0.32, a: 0.008 });
    // A sine an octave below.
    osc(e, "sine", n.f / 2, t, d, 0.06, { exp: n.hold });
  }
  // A clean pluck into the ping-pong delay.
  else if (n.voice === "harm") osc(e, "triangle", n.f, t, n.hold ? d : Math.max(n.dur, 0.18), n.hold ? 0.06 : 0.05, { exp: true, pp: 0.4, rev: 0.2 });
  // A wide pad that pumps.
  else if (n.voice === "pad") stack(e, n.f, t, d, 0.022, { n: 4, spread: 18, lp: [2200, 2200, 1], a: 0.25, r: 0.35, rev: 0.5, duck: true });
  // A sub bass with a little sawtooth, both pumping.
  else if (n.voice === "bass") {
    // The sub.
    osc(e, "sine", n.f / 2, t, d, 0.28, { exp: n.hold, duck: true });
    // The edge.
    stack(e, n.f, t, d, 0.07, { lp: [500, 300, 2], exp: n.hold, duck: true });
  }
  // The kick, with a click, and the pump it causes.
  else if (n.voice === "kick") {
    // The body.
    osc(e, "sine", 115, t, 0.32, 0.85, { drop: 38, exp: true });
    // The click.
    hiss(e, t, 0.01, 0.2, "highpass", 2500);
    // The pump.
    duck(e, t);
  }
  // A clap: three quick bursts and a tail; ghosts are a single soft burst.
  else if (n.voice === "snare") {
    // A ghost.
    if (n.soft) hiss(e, t, 0.06, 0.1, "bandpass", 1800, 0.8, { rev: 0.2 });
    // A full clap.
    else {
      // Three bursts.
      for (const k of [0, 0.011, 0.023]) hiss(e, t + k, 0.02, 0.2, "bandpass", 1500, 0.9);
      // The tail.
      hiss(e, t + 0.03, 0.22, 0.16, "bandpass", 1500, 0.9, { rev: 0.35 });
    }
  }
  // Closed hats.
  else if (n.voice === "hat") hiss(e, t, 0.025, 0.03, "highpass", 9500, 0.7, { pan: 0.25 });
  // Open hats.
  else if (n.voice === "ohat") hiss(e, t, 0.16, 0.06, "highpass", 7500, 0.7, { pan: -0.2, rev: 0.1 });
  // The crash, into the long reverb.
  else if (n.voice === "crash") hiss(e, t, 2.8, 0.13, "highpass", 3800, 0.7, { rev: 0.5 });
}

/**
 * Build the audio graph for one playthrough of an era.
 *
 * @param ctx the audio context
 * @param era the era
 * @param level the master level
 * @returns the engine
 */
function buildEngine(ctx: AudioContext, era: Era, level: number): Engine {
  // A compressor keeps the mix from clipping.
  const comp = ctx.createDynamicsCompressor();
  // Its threshold.
  comp.threshold.value = -14;
  // Its ratio.
  comp.ratio.value = 4;
  // The master gain.
  const out = ctx.createGain();
  // The slider's level.
  out.gain.value = level;
  // Into the speakers.
  out.connect(comp).connect(ctx.destination);
  // Fixed-seed noise, one second.
  const r = rand(0x2545f491);
  // The buffer.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  // Its samples.
  const nd = noise.getChannelData(0);
  // Filled.
  for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  // The engine so far.
  const e: Engine = { ctx, out, p25: pulse(ctx, 0.25), p12: pulse(ctx, 0.125), noise, t0: 0 };
  // 16-bit: a dark feedback echo.
  if (era === 16) {
    // The delay line.
    const d = ctx.createDelay(1);
    // Its feedback.
    const fb = ctx.createGain();
    // Its darkening filter.
    const lp = ctx.createBiquadFilter();
    // About a dotted sixteenth at these tempos.
    d.delayTime.value = 0.19;
    // A third back each time.
    fb.gain.value = 0.32;
    // Low-pass.
    lp.type = "lowpass";
    // Dark.
    lp.frequency.value = 2600;
    // Delay, filter, feedback.
    d.connect(lp);
    // Back into the delay.
    lp.connect(fb);
    // The loop.
    fb.connect(d);
    // Out to the mix.
    lp.connect(out);
    // Its input.
    e.echo = d;
  }
  // 32 and 64-bit: a generated reverb.
  if (era >= 32) {
    // The convolver.
    const c = ctx.createConvolver();
    // Its return level.
    const w = ctx.createGain();
    // A longer tail in the 64-bit era.
    c.buffer = impulse(ctx, era === 64 ? 2.8 : 1.8, era === 64 ? 3 : 2.5);
    // Its level.
    w.gain.value = era === 64 ? 0.5 : 0.4;
    // Wired.
    c.connect(w);
    // To the mix.
    w.connect(out);
    // Its input.
    e.rev = c;
  }
  // 64-bit: the sidechain bus and a ping-pong delay.
  if (era === 64) {
    // The bus the kick pumps.
    e.duck = ctx.createGain();
    // To the mix.
    e.duck.connect(out);
    // The left delay.
    const dl = ctx.createDelay(1);
    // The right delay.
    const dr = ctx.createDelay(1);
    // The feedback.
    const fb = ctx.createGain();
    // Left.
    const pl = ctx.createStereoPanner();
    // Right.
    const pr = ctx.createStereoPanner();
    // The same time both sides.
    dl.delayTime.value = 0.21;
    // Right side.
    dr.delayTime.value = 0.21;
    // Feedback level.
    fb.gain.value = 0.38;
    // Hard left.
    pl.pan.value = -0.7;
    // Hard right.
    pr.pan.value = 0.7;
    // Left out.
    dl.connect(pl);
    // To the mix.
    pl.connect(out);
    // Left into right.
    dl.connect(dr);
    // Right out.
    dr.connect(pr);
    // To the mix.
    pr.connect(out);
    // Right back into left.
    dr.connect(fb);
    // The loop.
    fb.connect(dl);
    // Its input.
    e.pp = dl;
  }
  // The engine.
  return e;
}

/**
 * Seconds as m:ss.
 *
 * @param s seconds
 * @returns the time
 */
function clock(s: number): string {
  // Minutes and two-digit seconds.
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/**
 * The player: the era switch on top, the stage with its readout, the controls.
 *
 * @returns the player
 */
export default function LgtmTune() {
  // The strings.
  const t = useTranslations("devFun.lgtm");
  // The era, 8-bit until the remembered one is read.
  const [era, setEra] = useState<Era>(8);
  // Playing or not.
  const [playing, setPlaying] = useState(false);
  // The tune has played to the end at least once since the last start.
  const [ended, setEnded] = useState(false);
  // The status line's key.
  const [status, setStatus] = useState("friday");
  // The tempo shown.
  const [bpm, setBpm] = useState(132);
  // Approvals so far.
  const [approvals, setApprovals] = useState(0);
  // Invoices per order.
  const [invoices, setInvoices] = useState(1);
  // The Morse signal lit, or -1.
  const [lit, setLit] = useState(-1);
  // The stage's border flashes on the double charge.
  const [glitch, setGlitch] = useState(false);
  // The stamp has landed.
  const [stamped, setStamped] = useState(false);
  // Progress, 0 to 1.
  const [progress, setProgress] = useState(0);
  // Seconds played.
  const [elapsed, setElapsed] = useState(0);
  // The volume, 0 to 100.
  const [volume, setVolume] = useState(55);
  // No Web Audio in this browser.
  const [noAudio, setNoAudio] = useState(false);
  // The score of the era.
  const score: Score = useMemo(() => buildScore(era), [era]);
  // The running engine, or null.
  const engine = useRef<Engine | null>(null);
  // The next note to schedule and the next event to show.
  const ptr = useRef({ note: 0, ui: 0 });
  // The scheduler's interval and the frame request.
  const timers = useRef<{ pump: number | null; raf: number | null }>({ pump: null, raf: null });
  // Light timers, so a flash ends.
  const flashes = useRef<number[]>([]);

  // The remembered era, read once after mount (storage can throw in a private window).
  useEffect(() => {
    // Read safely.
    try {
      // The stored value.
      const v = Number(window.localStorage.getItem(ERA_KEY));
      // Only a known era.
      if ((ERAS as readonly number[]).includes(v)) setEra(v as Era);
    } catch {
      // No storage: 8-bit.
    }
  }, []);

  // Everything back to the start of the story.
  const resetReadout = useCallback(() => {
    // The opening line.
    setStatus("friday");
    // The opening tempo.
    setBpm(132);
    // No approvals.
    setApprovals(0);
    // One invoice per order.
    setInvoices(1);
    // Nothing lit.
    setLit(-1);
    // No stamp.
    setStamped(false);
    // At the start.
    setProgress(0);
    // Nothing played.
    setElapsed(0);
  }, []);

  // Stop: timers cleared, the context closed, the session handed back.
  const stop = useCallback((done: boolean) => {
    // The scheduler.
    if (timers.current.pump !== null) window.clearInterval(timers.current.pump);
    // The frame loop.
    if (timers.current.raf !== null) window.cancelAnimationFrame(timers.current.raf);
    // Both gone.
    timers.current = { pump: null, raf: null };
    // The context, closed at once (silence).
    if (engine.current) void engine.current.ctx.close();
    // No engine.
    engine.current = null;
    // The iPhone's media session handed back.
    leaveMediaPlayback();
    // Not playing.
    setPlaying(false);
    // Whether it reached the end.
    setEnded(done);
  }, []);

  // Start the given era's tune from the beginning (inside the tap that asked for it).
  const start = useCallback((which: Era) => {
    // Media playback first, while the tap still counts.
    enterMediaPlayback();
    // The audio context.
    const ctx = newAudioContext();
    // No Web Audio: say so.
    if (!ctx) {
      // The message.
      setNoAudio(true);
      // Nothing else.
      return;
    }
    // The tune.
    const s = buildScore(which);
    // The graph.
    const e = buildEngine(ctx, which, (volume / 100) * TRIM[which]);
    // A little ahead of now.
    e.t0 = ctx.currentTime + 0.12;
    // Resumed, in browsers that start suspended.
    void ctx.resume();
    // Kept.
    engine.current = e;
    // From the first note and event.
    ptr.current = { note: 0, ui: 0 };
    // The readout from the start.
    resetReadout();
    // Schedules notes a little ahead of the audio clock (further when the tab is hidden and timers slow down).
    const pump = () => {
      // The engine of this playthrough.
      const en = engine.current;
      // Stopped meanwhile.
      if (!en) return;
      // How far ahead.
      const horizon = en.ctx.currentTime - en.t0 + (document.hidden ? 1.5 : 0.6);
      // Every note up to it.
      while (ptr.current.note < s.notes.length && s.notes[ptr.current.note].t < horizon) sound(en, which, s.notes[ptr.current.note++]);
    };
    // Follows the audio clock for the readout.
    const frame = () => {
      // The engine of this playthrough.
      const en = engine.current;
      // Stopped meanwhile.
      if (!en) return;
      // Seconds into the tune.
      const now = en.ctx.currentTime - en.t0;
      // Every event reached.
      while (ptr.current.ui < s.all.length && s.all[ptr.current.ui].t <= now) {
        // The event.
        const ev = s.all[ptr.current.ui++];
        // A section's cue.
        if (ev.kind === "cue") {
          // Its line.
          setStatus(ev.say);
          // Its tempo.
          setBpm(ev.bpm);
          // Invoices, when they change.
          if (ev.inv !== undefined) setInvoices(ev.inv);
          // Next event.
          continue;
        }
        // A Morse signal lights for a moment.
        if (ev.morse !== undefined) {
          // Lit.
          setLit(ev.morse);
          // And off again.
          flashes.current.push(window.setTimeout(() => setLit(-1), 150));
        }
        // A chime adds approvals.
        if (ev.chime) setApprovals((a) => a + (ev.chime ?? 0));
        // The second charge flashes the border.
        if (ev.glitch) {
          // On.
          setGlitch(true);
          // Off.
          flashes.current.push(window.setTimeout(() => setGlitch(false), 70));
        }
        // The stamp lands.
        if (ev.stamp) setStamped(true);
      }
      // The bar.
      setProgress(Math.max(0, Math.min(1, now / s.total)));
      // The time.
      setElapsed(Math.max(0, now));
      // At the end: stopped.
      if (now >= s.total) {
        // Done.
        stop(true);
        // No next frame.
        return;
      }
      // Next frame.
      timers.current.raf = window.requestAnimationFrame(frame);
    };
    // The first notes now.
    pump();
    // Then every 40 ms.
    timers.current.pump = window.setInterval(pump, 40);
    // The readout loop.
    timers.current.raf = window.requestAnimationFrame(frame);
    // Playing.
    setPlaying(true);
    // Not at the end.
    setEnded(false);
  }, [resetReadout, stop, volume]);

  // Leaving the page stops the sound and the timers.
  useEffect(() => () => {
    // Pending flashes.
    flashes.current.forEach((id) => window.clearTimeout(id));
    // The tune.
    stop(false);
  }, [stop]);

  // A new era from the switch: remembered, and the tune restarts in it when it was playing.
  const chooseEra = (next: Era) => {
    // Was it playing?
    const wasPlaying = engine.current !== null;
    // Stopped first.
    if (wasPlaying) stop(false);
    // The new era.
    setEra(next);
    // Remembered in this browser.
    try {
      // Stored.
      window.localStorage.setItem(ERA_KEY, String(next));
    } catch {
      // No storage: not remembered.
    }
    // Restarted in the new era, inside the same tap.
    if (wasPlaying) start(next);
    // Or back to the opening readout.
    else resetReadout();
  };

  // The volume follows the slider while playing.
  useEffect(() => {
    // The running engine.
    const en = engine.current;
    // Smoothly to the new level.
    if (en) en.out.gain.setTargetAtTime((volume / 100) * TRIM[era], en.ctx.currentTime, 0.02);
  }, [volume, era]);

  // The Morse signals' running number, for lighting.
  let signal = 0;
  // The player.
  return (
    <div className="lgtm-player">
      {/* The era switch, on top (PRIME 15/11/2026 05:34). */}
      <fieldset className="lgtm-eras">
        <legend className="sr-only">{t("eraLegend")}</legend>
        {ERAS.map((e) => (
          <label key={e} className={`lgtm-era${era === e ? " lgtm-era-on" : ""}`}>
            <input type="radio" name="lgtm-era" value={e} checked={era === e} onChange={() => chooseEra(e)} className="sr-only" />
            <span>{t("eraLabel", { bits: e })}</span>
          </label>
        ))}
      </fieldset>
      {/* What this era's sound is made of. */}
      <p className="lgtm-era-line">{t(`eraLine${era}`)}</p>

      {/* The stage: the era's look, the story's readout. */}
      <section className={`lgtm-stage${glitch ? " lgtm-stage-glitch" : ""}`} data-era={era} aria-label={t("stageLabel")}>
        <p className="lgtm-status" aria-live="polite">
          {t(`status.${status}`)}
        </p>
        <div className="lgtm-morse" aria-hidden="true">
          {MORSE_DRAWN.map((l) => (
            <div key={l.letter} className="lgtm-letter">
              <span className="lgtm-signals">
                {l.dashes.map((dash) => {
                  // This signal's number.
                  const k = signal++;
                  // A dot or a dash, lit when its note plays.
                  return <i key={k} className={`lgtm-sig${dash ? " lgtm-sig-dash" : ""}${lit === k ? " lgtm-sig-on" : ""}`} />;
                })}
              </span>
              <b>{l.letter}</b>
            </div>
          ))}
        </div>
        <dl className="lgtm-stats">
          <div className="lgtm-stat">
            <dt>{t("statApprovals")}</dt>
            <dd>{approvals}</dd>
          </div>
          <div className="lgtm-stat">
            <dt>{t("statTempo")}</dt>
            <dd>{bpm}</dd>
          </div>
          <div className="lgtm-stat">
            <dt>{t("statInvoices")}</dt>
            <dd className={invoices > 1 ? "lgtm-stat-hot" : undefined}>{invoices}</dd>
          </div>
          <div className="lgtm-stat">
            <dt>{t("statLines")}</dt>
            <dd>0</dd>
          </div>
        </dl>
        <div className="lgtm-bar" aria-hidden="true">
          <span style={{ width: `${(progress * 100).toFixed(1)}%` }} />
        </div>
        {stamped && <div className="lgtm-stamp">LGTM</div>}
      </section>

      {/* The controls. */}
      <div className="lgtm-controls">
        <button type="button" className="fg-button fg-button-primary" aria-pressed={playing} onClick={() => (playing ? stop(false) : start(era))}>
          {playing ? t("stop") : ended ? t("playAgain") : t("play")}
        </button>
        <label className="lgtm-volume">
          {t("volume")}
          <input type="range" min={0} max={100} value={volume} onChange={(ev) => setVolume(Number(ev.target.value))} />
        </label>
        <span className="lgtm-time fg-mono">
          {clock(elapsed)} / {clock(score.total)}
        </span>
      </div>
      {noAudio && <p className="fg-pod-error">{t("noAudio")}</p>}
    </div>
  );
}
