// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

"use client";

// ============================================================================
// src/components/dev/fun/VideoFacade.tsx
// ----------------------------------------------------------------------------
// A YOUTUBE VIDEO BEHIND A CLICK (queue 5d, PRIME 12/11/2026 21:24 and
// 14/11/2026 18:19). Until the reader presses play, the page shows a picture
// drawn here, in SVG, and asks YouTube for nothing: no player, no thumbnail,
// no script. The press swaps the picture for YouTube's player, loaded from
// youtube-nocookie.com, the domain of YouTube's privacy-enhanced mode (YouTube
// Help, "Turn on privacy-enhanced mode", answer 171780, read 15/11/2026: views
// of a video embedded that way do not personalize the viewer's YouTube
// browsing or the ads YouTube shows).
//
// The player starts at once because the reader has just asked for it
// (autoplay=1 in the address), never on load. The page's Content-Security-
// Policy admits that one frame host on this page alone (public/_headers, held
// by scripts/check-headers-csp.mjs), and the Privacy page says all of this.
// ============================================================================

import { useState } from "react";

/** What the facade needs from its page. */
export interface VideoFacadeProps {
  /** YouTube's eleven-character video ID. */
  videoId: string;
  /** The frame's accessible title, in the page's language. */
  title: string;
  /** The play button's label, in the page's language. */
  playLabel: string;
  /** The line under the picture that says what pressing play loads. */
  note: string;
}

/** The privacy-enhanced embed host (YouTube Help 171780). */
const EMBED_HOST = "https://www.youtube-nocookie.com";

/**
 * The video, as a drawn picture with a play button, then YouTube's player once pressed.
 *
 * @param props the video ID and the words
 * @returns the facade or the player
 */
export default function VideoFacade({ videoId, title, playLabel, note }: VideoFacadeProps) {
  // Whether the reader has pressed play.
  const [on, setOn] = useState(false);
  // Only a well-formed ID reaches the address (the eleven characters YouTube uses).
  const safeId = /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : "";
  // The player's address: privacy-enhanced host, started because the reader asked (autoplay=1), and the related videos
  // at the end kept to the same channel (rel=0; since September 2018 it can no longer turn them off; YouTube IFrame
  // Player API, "Player parameters", read 15/11/2026).
  const src = `${EMBED_HOST}/embed/${safeId}?autoplay=1&rel=0`;
  // The frame and the facade share one box, so nothing moves when the player arrives.
  return (
    <figure className="lgtm-video">
      <div className="lgtm-video-box">
        {on && safeId ? (
          // YouTube's player, from the privacy-enhanced host only.
          <iframe
            className="lgtm-video-frame"
            src={src}
            title={title}
            // What the player may use: the list YouTube's own embed code asks for.
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            // The site's origin only, never the full page address.
            referrerPolicy="strict-origin-when-cross-origin"
            // Fullscreen on request.
            allowFullScreen
          />
        ) : (
          // The facade: a button that is the picture.
          <button type="button" className="lgtm-video-poster" onClick={() => setOn(true)} aria-label={`${playLabel}: ${title}`}>
            {/* A code review screen drawn here: a diff, green checks down the side, and a stamp. Decorative. */}
            <svg className="lgtm-video-art" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
              {/* The screen. */}
              <rect x="0" y="0" width="640" height="360" className="lgtm-art-bg" />
              {/* Six diff lines, added (green) and removed (red), of varied lengths. */}
              <rect x="64" y="70" width="300" height="14" rx="3" className="lgtm-art-add" />
              <rect x="64" y="100" width="240" height="14" rx="3" className="lgtm-art-del" />
              <rect x="64" y="130" width="360" height="14" rx="3" className="lgtm-art-add" />
              <rect x="64" y="160" width="200" height="14" rx="3" className="lgtm-art-add" />
              <rect x="64" y="190" width="330" height="14" rx="3" className="lgtm-art-del" />
              <rect x="64" y="220" width="280" height="14" rx="3" className="lgtm-art-add" />
              {/* A column of green checks, one per line, approved without reading. */}
              {[77, 107, 137, 167, 197, 227].map((y) => (
                <path key={y} d={`M30 ${y} l6 6 l12 -12`} className="lgtm-art-check" />
              ))}
              {/* The stamp, tilted, across the diff. */}
              <g transform="rotate(-12 470 170)">
                <rect x="380" y="128" width="180" height="84" rx="10" className="lgtm-art-stamp" />
                <text x="470" y="188" textAnchor="middle" className="lgtm-art-stamp-text">
                  LGTM
                </text>
              </g>
              {/* The play button, in the middle. */}
              <circle cx="320" cy="290" r="34" className="lgtm-art-play-ring" />
              <path d="M310 272 L340 290 L310 308 Z" className="lgtm-art-play" />
            </svg>
            <span className="lgtm-video-label">{playLabel}</span>
          </button>
        )}
      </div>
      {/* What pressing play loads, said before it happens. */}
      <figcaption className="lgtm-video-note">{note}</figcaption>
    </figure>
  );
}
