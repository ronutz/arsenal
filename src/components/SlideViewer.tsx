"use client";

// ============================================================================
// src/components/SlideViewer.tsx
// ----------------------------------------------------------------------------
// THE SLIDE VIEWER (PRIME 2026-10-07 05:09: "is it possible that the
// screenshots of slides open on top of the page (instead of in another page)
// so that the user can click anywhere to close the image, instead of having to
// select 'back' to go back to the previous page?").
//
// A material's "A look inside" gallery is server-rendered as plain links, each
// thumbnail linking to its full-size slide image. This component enhances
// those links in place: a plain click opens the slide in a native modal
// <dialog> over the page instead of navigating to the image. Closing it is a
// click anywhere, Escape, or the close button; the left and right arrow keys
// (and two buttons) step through the gallery. The page underneath never moves,
// so there is nothing to go "back" from.
//
// PROGRESSIVE ENHANCEMENT, ON PURPOSE. The links are untouched markup: without
// JavaScript, or with a modifier key held (Ctrl/Cmd/Shift/Alt, a middle click),
// a slide still opens on its own exactly as before, in the same tab or a new
// one, because the listener only takes over an unmodified primary click.
//
// WHY A NATIVE <dialog>. showModal() makes the rest of the page inert, keeps
// keyboard focus inside the viewer and answers Escape by itself; the viewer
// returns focus to the thumbnail that opened it when it closes. The slides are
// read from the gallery's own markup (href, alt, caption), so the page states
// each slide once and this component adds no second copy of the content.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

/** One slide the viewer can show, read from the gallery's markup. */
interface Shot {
  /** The full-size image, the thumbnail link's own target. */
  src: string;
  /** The image's alternative text, the thumbnail's own. */
  alt: string;
  /** The slide's title, from the thumbnail's caption. */
  title: string;
  /** The slide number and part line, from the thumbnail's caption. */
  meta: string;
  /** The thumbnail link, so focus can return to it when the viewer closes. */
  link: HTMLAnchorElement;
}

/** The viewer's words, in the page's language. */
export interface SlideViewerLabels {
  /** The close button's accessible name. */
  close: string;
  /** The previous-slide button's accessible name. */
  previous: string;
  /** The next-slide button's accessible name. */
  next: string;
}

/** Enhances the gallery inside the element with id `containerId`; renders the viewer itself, closed until a click. */
export default function SlideViewer({ containerId, labels }: { containerId: string; labels: SlideViewerLabels }) {
  // The native dialog element the viewer lives in.
  const dialog = useRef<HTMLDialogElement>(null);
  // The gallery's slides, in page order, read once after mount.
  const [shots, setShots] = useState<Shot[]>([]);
  // The slide on show, or -1 while the viewer is closed.
  const [at, setAt] = useState(-1);
  // The slide that was on show when the viewer last closed, so focus can go back to its thumbnail.
  const opener = useRef<HTMLAnchorElement | null>(null);

  // Read the gallery and take over plain clicks on its thumbnails.
  useEffect(() => {
    // The section that holds the gallery; without it there is nothing to enhance.
    const box = document.getElementById(containerId);
    if (!box) return;
    // Every thumbnail link, in the order the page shows them.
    const links = Array.from(box.querySelectorAll<HTMLAnchorElement>("a.materials-shot-link"));
    // Each slide as the page states it: the link's target, the image's alt text, the caption's two lines.
    setShots(
      links.map((a) => {
        // The figure the link sits in carries the caption.
        const fig = a.closest("figure");
        return {
          src: a.getAttribute("href") ?? "",
          alt: a.querySelector("img")?.getAttribute("alt") ?? "",
          title: fig?.querySelector(".materials-shot-title")?.textContent ?? "",
          meta: fig?.querySelector(".materials-shot-meta")?.textContent ?? "",
          link: a,
        };
      }),
    );
    // One listener for the whole gallery: an unmodified primary click opens the viewer, anything else is left to the
    // browser (a new tab, a new window, a download).
    const onClick = (e: MouseEvent) => {
      // Ignore clicks that ask the browser for something of its own.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // The thumbnail link the click landed in, if any.
      const a = (e.target as Element | null)?.closest?.("a.materials-shot-link");
      const i = a ? links.indexOf(a as HTMLAnchorElement) : -1;
      if (i < 0) return;
      // Stay on the page and show the slide over it.
      e.preventDefault();
      setAt(i);
    };
    box.addEventListener("click", onClick);
    // Remove the listener if the page tears the component down.
    return () => box.removeEventListener("click", onClick);
  }, [containerId]);

  // Open the modal when a slide is chosen; remember its thumbnail for the return of focus.
  useEffect(() => {
    const d = dialog.current;
    if (!d || at < 0) return;
    opener.current = shots[at]?.link ?? null;
    if (!d.open) d.showModal();
  }, [at, shots]);

  // When the dialog closes, by any route (a click, Escape, the button), forget the slide and give focus back.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setAt(-1);
      opener.current?.focus();
    };
    d.addEventListener("close", onClose);
    // Remove the listener if the component goes away.
    return () => d.removeEventListener("close", onClose);
  }, []);

  // Step through the gallery, wrapping at either end.
  const step = useCallback(
    (by: number) => setAt((i) => (shots.length ? (i + by + shots.length) % shots.length : i)),
    [shots.length],
  );

  // Close the viewer; the dialog's close event does the rest.
  const close = () => dialog.current?.close();

  // The slide on show, if any.
  const s = at >= 0 ? shots[at] : null;

  return (
    <dialog
      ref={dialog}
      className="slide-viewer"
      aria-label={s?.title || labels.close}
      // A click anywhere closes, as PRIME asked; the arrow buttons stop their own clicks from reaching here.
      onClick={close}
      // The arrow keys step through the slides; Escape is the dialog's own.
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      }}
    >
      {/* The close button comes first, so it takes the focus when the viewer opens. */}
      <button type="button" className="slide-viewer-close" aria-label={labels.close} onClick={close}>
        <span aria-hidden="true">&times;</span>
      </button>
      {s && (
        <figure className="slide-viewer-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="slide-viewer-img" src={s.src} alt={s.alt} decoding="async" />
          <figcaption className="slide-viewer-caption">
            <span className="slide-viewer-title">{s.title}</span>
            <span className="slide-viewer-meta mono">{s.meta}</span>
          </figcaption>
        </figure>
      )}
      {/* Previous and next, only when there is more than one slide; their clicks stay inside the viewer. */}
      {shots.length > 1 && (
        <>
          <button
            type="button"
            className="slide-viewer-nav slide-viewer-prev"
            aria-label={labels.previous}
            onClick={(e) => { e.stopPropagation(); step(-1); }}
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>
          <button
            type="button"
            className="slide-viewer-nav slide-viewer-next"
            aria-label={labels.next}
            onClick={(e) => { e.stopPropagation(); step(1); }}
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </>
      )}
    </dialog>
  );
}
