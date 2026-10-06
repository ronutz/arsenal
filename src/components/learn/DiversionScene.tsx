// ============================================================================
// src/components/learn/DiversionScene.tsx
// ----------------------------------------------------------------------------
// THE SHARED PRINCIPLE OF TRAFFIC DIVERSION, as one inline SVG: the "before"
// (two parties talking directly) and the "after" (a third party sitting in the
// path, reading, altering or dropping what passes). It is the one picture every
// member of the traffic-diversion series is a variation of, so the series
// opener carries it. Purely conceptual and defensive: it shows WHY diversion
// matters (the middle position), not how any particular attack is performed.
//
// Presentational and server-safe: no state, no effects, no client APIs. Colour
// comes from the site's semantic tokens so it tracks every theme, and the figure
// scales to its container with a viewBox. Labels are bilingual via `lang`, the
// same prop shape the other Learn diagram components use.
// ============================================================================

/** The two locales authored natively on this site; others fall back to English. */
type Lang = "en" | "pt-BR";

/** The strings the figure draws, per locale. Kept tiny and declarative. */
const COPY: Record<Lang, {
  title: string;
  before: string;
  after: string;
  you: string;
  peer: string;
  mitm: string;
  directPath: string;
  divertedPath: string;
  reads: string;
}> = {
  en: {
    title: "The one move every method shares",
    before: "Before",
    after: "After diversion",
    you: "You",
    peer: "The service",
    mitm: "In the middle",
    directPath: "Traffic goes straight to the service",
    divertedPath: "Traffic is steered through a third party first",
    reads: "which can read, alter, or drop it",
  },
  "pt-BR": {
    title: "O movimento que todos os métodos têm em comum",
    before: "Antes",
    after: "Depois do desvio",
    you: "Você",
    peer: "O serviço",
    mitm: "No meio",
    directPath: "O tráfego vai direto ao serviço",
    divertedPath: "O tráfego é desviado por um terceiro primeiro",
    reads: "que pode lê-lo, alterá-lo ou descartá-lo",
  },
};

/** One labelled node box; `tone` selects the semantic colour. */
function Node({
  x,
  y,
  w,
  label,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  tone: "neutral" | "danger";
}) {
  // The attacker node is drawn in the danger colour; the honest parties neutral.
  const stroke = tone === "danger" ? "var(--color-danger)" : "var(--border-strong)";
  const text = tone === "danger" ? "var(--color-danger)" : "var(--text-primary)";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={38}
        rx={7}
        fill="var(--surface-elevated)"
        stroke={stroke}
        strokeWidth={tone === "danger" ? 2 : 1.25}
      />
      <text
        x={x + w / 2}
        y={y + 24}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill={text}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * The before/after figure. Two stacked rows share one viewBox so they align and
 * scale together; on a narrow screen the SVG simply shrinks, keeping its ratio.
 */
export default function DiversionScene({ lang = "en" }: { lang?: Lang }) {
  // Fall back to English for any locale not authored here.
  const t = COPY[lang] ?? COPY.en;
  return (
    <figure className="diversion-scene" role="group" aria-label={t.title}>
      <svg
        viewBox="0 0 640 300"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: "640px", display: "block", margin: "0 auto" }}
      >
        {/* The arrowhead marker, in the muted body-text colour. */}
        <defs>
          <marker
            id="ds-arrow"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={7}
            markerHeight={7}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
          </marker>
          <marker
            id="ds-arrow-danger"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={7}
            markerHeight={7}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-danger)" />
          </marker>
        </defs>

        {/* ---- Row 1: BEFORE. You talk straight to the service. ---- */}
        <text x={20} y={26} fontSize={12} fontWeight={700} fill="var(--text-tertiary)" letterSpacing="0.06em">
          {t.before.toUpperCase()}
        </text>
        <Node x={20} y={44} w={150} label={t.you} tone="neutral" />
        <Node x={470} y={44} w={150} label={t.peer} tone="neutral" />
        {/* The direct link. */}
        <line
          x1={172}
          y1={63}
          x2={468}
          y2={63}
          stroke="var(--text-secondary)"
          strokeWidth={2}
          markerEnd="url(#ds-arrow)"
          markerStart="url(#ds-arrow)"
        />
        <text x={320} y={100} textAnchor="middle" fontSize={12.5} fill="var(--text-secondary)">
          {t.directPath}
        </text>

        {/* A thin divider between the two rows. */}
        <line x1={20} y1={138} x2={620} y2={138} stroke="var(--border-subtle)" strokeWidth={1} />

        {/* ---- Row 2: AFTER. The same conversation, steered through a third party. ---- */}
        <text x={20} y={170} fontSize={12} fontWeight={700} fill="var(--text-tertiary)" letterSpacing="0.06em">
          {t.after.toUpperCase()}
        </text>
        <Node x={20} y={188} w={132} label={t.you} tone="neutral" />
        <Node x={254} y={188} w={132} label={t.mitm} tone="danger" />
        <Node x={488} y={188} w={132} label={t.peer} tone="neutral" />
        {/* You -> middle, and middle -> service: the diverted path. */}
        <line
          x1={154}
          y1={207}
          x2={252}
          y2={207}
          stroke="var(--color-danger)"
          strokeWidth={2}
          markerEnd="url(#ds-arrow-danger)"
          markerStart="url(#ds-arrow-danger)"
        />
        <line
          x1={388}
          y1={207}
          x2={486}
          y2={207}
          stroke="var(--color-danger)"
          strokeWidth={2}
          markerEnd="url(#ds-arrow-danger)"
          markerStart="url(#ds-arrow-danger)"
        />
        <text x={320} y={252} textAnchor="middle" fontSize={12.5} fill="var(--text-primary)">
          {t.divertedPath}
        </text>
        <text x={320} y={272} textAnchor="middle" fontSize={12.5} fill="var(--color-danger)">
          {t.reads}
        </text>
      </svg>
    </figure>
  );
}
