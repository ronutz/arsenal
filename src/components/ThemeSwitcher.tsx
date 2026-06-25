"use client";

// ============================================================================
// src/components/ThemeSwitcher.tsx
// ----------------------------------------------------------------------------
// THEME SWITCHER — a header control to pick the site theme. Setting a theme adds
// `data-theme="<id>"` to <html> (Obsidian, the default, removes it), which flips
// the CSS token blocks in globals.css and re-skins everything. The choice is
// remembered in localStorage; an inline script in the layout applies the saved
// theme before first paint so there is no flash.
//
// The eight themes: Obsidian (default) plus seven that nod to the FortiGate GUI
// themes (Dark Matter, Onyx, Eclipse, Jade, Graphite, Neutrino, Security Fabric).
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ronutz-theme";

type Theme = { id: string; name: string; swatch: string; dark: boolean };

// Swatch = each theme's primary accent, for the preview dot.
const THEMES: Theme[] = [
  { id: "obsidian", name: "Obsidian", swatch: "#22d3ee", dark: true },
  // --- FortiGate-inspired set (ids unchanged so saved themes/CSS keep working). ---
  { id: "dark-energy", name: "FGT · Dark Energy", swatch: "#818cf8", dark: true },
  { id: "olivine", name: "FGT · Olivine", swatch: "#34d399", dark: true },
  { id: "penumbra", name: "FGT · Penumbra", swatch: "#fb923c", dark: true },
  { id: "emerald", name: "FGT · Emerald", swatch: "#059669", dark: false },
  { id: "slate", name: "FGT · Slate", swatch: "#2563eb", dark: false },
  { id: "photon", name: "FGT · Photon", swatch: "#3730a3", dark: false },
  { id: "kevlar", name: "FGT · Kevlar", swatch: "#dc2626", dark: false },
  // --- Retro set: homages to vintage machines and terminals, grouped here. ---
  { id: "retro-amber", name: "Retro · Amber", swatch: "#ffb000", dark: true },
  { id: "retro-green", name: "Retro · Green", swatch: "#33ff66", dark: true },
  { id: "retro-c64", name: "Retro · C64", swatch: "#9d8fe8", dark: true },
  { id: "retro-spectrum", name: "Retro · Spectrum", swatch: "#ff2bd6", dark: true },
  { id: "retro-coco", name: "Retro · CoCo", swatch: "#c84b1e", dark: false },
  { id: "retro-apple2", name: "Retro · Apple II", swatch: "#c95fff", dark: true },
  { id: "retro-msx", name: "Retro · MSX", swatch: "#65dbef", dark: true },
  { id: "retro-amiga", name: "Retro · Amiga", swatch: "#ff8800", dark: true },
  { id: "retro-mac", name: "Retro · Mac", swatch: "#2222cc", dark: false },
  // --- Matrix set: digital-rain, pure black with a strong glow, three colors. ---
  { id: "matrix-green", name: "Matrix · Green", swatch: "#00ff41", dark: true },
  { id: "matrix-blue", name: "Matrix · Blue", swatch: "#19c3ff", dark: true },
  { id: "matrix-red", name: "Matrix · Red", swatch: "#ff3030", dark: true },
  // --- Text-art set: colorless ASCII, vivid DOS-palette ANSI, both monospace. ---
  { id: "ascii", name: "Art · ASCII", swatch: "#e6e6e6", dark: true },
  { id: "ansi", name: "Art · ANSI", swatch: "#54fefe", dark: true },
  // --- Web set: homages to classic community sites. ---
  { id: "web-slashdot", name: "Web · Slashdot", swatch: "#00692e", dark: false },
  { id: "web-reddit", name: "Web · Reddit", swatch: "#ff4500", dark: false },
  // --- Developer-tool looks: the Swagger UI doc theme and the VS Code editor. ---
  { id: "swagger", name: "Dev · Swagger", swatch: "#4a9c2d", dark: false },
  { id: "vscode", name: "Dev · VS Code", swatch: "#007acc", dark: true },
];

// Themes grouped for the picker: the part before " · " is the group label, the
// part after is the chip label. Themes with no " · " fall under "Default".
type ThemeGroup = {
  group: string;
  items: { id: string; label: string; swatch: string }[];
};
const GROUPS: ThemeGroup[] = (() => {
  const order: string[] = [];
  const map: Record<string, { id: string; label: string; swatch: string }[]> = {};
  for (const th of THEMES) {
    const idx = th.name.indexOf(" · ");
    const group = idx === -1 ? "Default" : th.name.slice(0, idx);
    const label = idx === -1 ? th.name : th.name.slice(idx + 3);
    if (!map[group]) {
      map[group] = [];
      order.push(group);
    }
    map[group].push({ id: th.id, label, swatch: th.swatch });
  }
  return order.map((g) => ({ group: g, items: map[g] }));
})();

function applyTheme(id: string) {
  const root = document.documentElement;
  if (id === "obsidian") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage may be unavailable (private mode); theme still applies for the session.
  }
}

export default function ThemeSwitcher() {
  const t = useTranslations("theme");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("obsidian");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync state to whatever the pre-paint script already applied.
  useEffect(() => {
    let saved = "obsidian";
    try {
      saved = localStorage.getItem(STORAGE_KEY) || "obsidian";
    } catch {
      // ignore
    }
    if (!THEMES.some((th) => th.id === saved)) saved = "obsidian";
    setCurrent(saved);
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    applyTheme(id);
    setCurrent(id);
    setOpen(false);
  }

  const active = THEMES.find((th) => th.id === current) ?? THEMES[0];

  return (
    <div className="theme-switcher" ref={wrapRef}>
      <button
        type="button"
        className="theme-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        title={t("label")}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Palette icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M12 2a10 10 0 1 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.4-4.5-8-10-8z" />
        </svg>
        <span className="theme-trigger-swatch" style={{ background: active.swatch }} aria-hidden="true" />
      </button>

      {open && (
        <div className="theme-menu" role="listbox" aria-label={t("label")}>
          {GROUPS.map(({ group, items }) => (
            <div className="theme-group" key={group}>
              <p className="theme-group-label">{group}</p>
              <div className="theme-grid">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    role="option"
                    aria-selected={it.id === current}
                    aria-label={`${group} ${it.label}`}
                    title={`${group} · ${it.label}`}
                    className={`theme-chip${it.id === current ? " theme-chip--active" : ""}`}
                    onClick={() => choose(it.id)}
                  >
                    <span
                      className="theme-chip-swatch"
                      style={{ background: it.swatch }}
                      aria-hidden="true"
                    />
                    <span className="theme-chip-name">{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
