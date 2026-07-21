"use client";

// ============================================================================
// src/components/ToolDocGlossaryHints.tsx
// ----------------------------------------------------------------------------
// Client hydrator for glossary hints inside TOOL DOCS.
//
// Tool docs are server-rendered HTML injected via dangerouslySetInnerHTML (see
// toolDocs.ts + the docs page), so the hint markers arrive as plain anchors:
//   <a class="gloss-hint-static" href="/<locale>/glossary/<slug>"
//      data-gloss-head data-gloss-def data-gloss-context data-gloss-expand>...
// emitted by rehypeGlossaryHintsStatic. This island runs once on the docs page,
// finds those anchors, and upgrades each into the SAME hover/tap/focus popover
// the Learn hints use — reusing the shared .gloss-hint* CSS so the two surfaces
// are visually identical.
//
// PROGRESSIVE + RESPECTFUL OF THE TRI-STATE (first | all | off):
//   - With JS off, or before this runs, each marker is simply a working link to
//     the glossary entry — never a dead affordance.
//   - The mode lives on <html> as data-glossary-hints (absent = first, "all",
//     "off"). Anchors carry data-gloss-occ ("first" | "rest"). A popover only
//     opens for ACTIVE marks: mode not "off" and (first occurrence, or mode
//     "all"). The shared CSS strips the underline from inactive marks, and this
//     island keeps inactive rest-anchors out of the tab order. We watch the
//     attribute, so changing the setting live retunes everything, no reload.
//
// One popover is open at a time. It is appended next to the trigger, positioned
// by CSS (same rules as GlossaryHint's panel). Escape and outside-pointer close.
// ============================================================================

import { useEffect } from "react";

export default function ToolDocGlossaryHints() {
  useEffect(() => {
    const root = document.documentElement;

    // Currently-open popover teardown, so only one shows at a time.
    let closeOpen: (() => void) | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    // Build (once) the popover element for a trigger, returning show/hide.
    function wire(anchor: HTMLAnchorElement) {
      if (anchor.dataset.glossWired === "1") return;
      anchor.dataset.glossWired = "1";

      const occ = anchor.getAttribute("data-gloss-occ") ?? "first";
      const head = anchor.getAttribute("data-gloss-head") ?? "";
      const def = anchor.getAttribute("data-gloss-def") ?? "";
      const context = anchor.getAttribute("data-gloss-context") ?? "";
      const expand = anchor.getAttribute("data-gloss-expand") ?? "";
      const href = anchor.getAttribute("href") ?? "#";

      // Wrap the anchor so the absolutely-positioned panel anchors to it, the
      // same containment the Learn markup gives via <span class="gloss-hint">.
      const wrap = document.createElement("span");
      wrap.className = "gloss-hint";
      anchor.replaceWith(wrap);
      wrap.appendChild(anchor);
      // Present the anchor as the trigger (styling shared with the Learn trigger
      // via .gloss-hint-static; it stays a real link for no-JS/off).
      anchor.classList.add("gloss-hint-trigger-static");

      let panel: HTMLSpanElement | null = null;

      const hide = () => {
        clearTimer();
        if (panel) {
          panel.remove();
          panel = null;
        }
        anchor.setAttribute("aria-expanded", "false");
        if (closeOpen === hide) closeOpen = null;
      };

      const show = () => {
        clearTimer();
        if (!activeFor(occ)) return; // inactive in the current mode: stay prose
        if (panel) return;
        // Close any other open popover first.
        if (closeOpen && closeOpen !== hide) closeOpen();
        closeOpen = hide;

        panel = document.createElement("span");
        panel.className = "gloss-hint-panel";
        panel.setAttribute("role", "tooltip");

        const h = document.createElement("span");
        h.className = "gloss-hint-head";
        h.textContent = head;
        const d = document.createElement("span");
        d.className = "gloss-hint-def";
        d.textContent = def;
        const c = document.createElement("span");
        c.className = "gloss-hint-context";
        c.textContent = context;
        const a = document.createElement("a");
        a.className = "gloss-hint-expand";
        a.href = href;
        a.textContent = expand;
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = " \u2192";
        a.appendChild(arrow);

        panel.append(h, d, c, a);
        panel.addEventListener("mouseenter", show);
        panel.addEventListener("mouseleave", scheduleHide);
        wrap.appendChild(panel);
        anchor.setAttribute("aria-expanded", "true");
      };

      const scheduleHide = () => {
        clearTimer();
        closeTimer = setTimeout(hide, 120);
      };

      anchor.setAttribute("aria-expanded", "false");
      anchor.addEventListener("mouseenter", show);
      anchor.addEventListener("mouseleave", scheduleHide);
      anchor.addEventListener("focus", show);
      anchor.addEventListener("blur", scheduleHide);
      // Tap / click opens the popover instead of navigating; the Expand link
      // inside the panel is the way to the full page.
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        if (panel) hide();
        else show();
      });
    }

    function wireAll() {
      const anchors = root.querySelectorAll<HTMLAnchorElement>(
        ".tooldoc-body a.gloss-hint-static",
      );
      anchors.forEach(wire);
    }

    // Current mode from the <html> attribute: absent = "first" (the default).
    const mode = (): "first" | "all" | "off" => {
      const v = root.getAttribute("data-glossary-hints");
      return v === "off" ? "off" : v === "all" ? "all" : "first";
    };
    // Is a mark with this occurrence active under the current mode?
    const activeFor = (occ: string) =>
      mode() !== "off" && (occ !== "rest" || mode() === "all");

    // Keep inactive marks out of the tab order (they read as plain prose), and
    // active ones reachable. Runs at wire time and on every mode change.
    function syncFocusability() {
      root
        .querySelectorAll<HTMLAnchorElement>(".tooldoc-body a.gloss-hint-static")
        .forEach((a) => {
          const occ = a.getAttribute("data-gloss-occ") ?? "first";
          a.tabIndex = activeFor(occ) ? 0 : -1;
        });
    }

    if (mode() !== "off") wireAll();
    syncFocusability();

    // React to mode changes live.
    const attrObserver = new MutationObserver(() => {
      if (mode() !== "off") wireAll();
      else if (closeOpen) closeOpen();
      if (mode() !== "all" && closeOpen) closeOpen();
      syncFocusability();
    });
    attrObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-glossary-hints"],
    });

    // Global dismissers.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOpen) closeOpen();
    };
    const onDocPointer = (e: PointerEvent) => {
      if (!closeOpen) return;
      const t = e.target as Node;
      const openWrap = document.querySelector(".gloss-hint:has(.gloss-hint-panel)");
      if (openWrap && !openWrap.contains(t)) closeOpen();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDocPointer);

    return () => {
      attrObserver.disconnect();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDocPointer);
      clearTimer();
      if (closeOpen) closeOpen();
    };
  }, []);

  return null;
}
