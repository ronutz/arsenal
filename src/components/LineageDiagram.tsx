// ============================================================================
// src/components/LineageDiagram.tsx
// ----------------------------------------------------------------------------
// ORIGINAL CORPORATE-GENEALOGY DIAGRAM — an inline SVG that tells the corporate
// lineage story of a vendor group (e.g. Cabletron splitting into four companies
// and Enterasys later folding into Extreme). Company names are rendered as plain
// text in original-designed boxes; this is a factual org-history diagram, not a
// reproduction of any vendor's logo or branding.
//
// The diagram is configured per vendor via a simple node/edge description passed
// from the page, so each of the three "lineage" vendor pages can render its own.
// Uses the site's Obsidian design tokens (semantic CSS custom properties) so it
// matches the page. Pure presentational SVG, server-safe.
//
// Layout: a horizontal flow of "stages", each stage a vertical stack of one or
// more company nodes, connected left-to-right by era-labeled arrows. A node may
// be marked `highlight` (the platform taught today) or `worked` (where Rodolfo
// was directly involved, with a period shown beneath).
// ============================================================================

export interface LineageNode {
  label: string;
  /** Optional period shown beneath, e.g. "Worked here 1996 – 2000". */
  note?: string;
  /** Visual emphasis: "accent" (taught today) or "muted" (sibling/acquirer). */
  tone?: "accent" | "muted" | "default";
}

export interface LineageStage {
  /** One or more nodes stacked vertically in this column. */
  nodes: LineageNode[];
  /** Era label on the arrow leading INTO this stage (omit for the first). */
  edgeLabel?: string;
}

export interface LineageDiagramProps {
  /** Accessible title + description for screen readers. */
  title: string;
  desc: string;
  /** The ordered stages, left to right. */
  stages: LineageStage[];
}

// Geometry constants (in SVG user units; viewBox is 680 wide to match the host).
const NODE_W = 150;
const NODE_H = 48;
const NODE_GAP_Y = 14; // vertical gap between stacked nodes
const STAGE_GAP_X = 70; // horizontal gap (room for the era arrow + label)
const PAD_TOP = 24;

export default function LineageDiagram({ title, desc, stages }: LineageDiagramProps) {
  // Compute the x position of each stage.
  const stageX: number[] = [];
  let x = 10;
  for (let i = 0; i < stages.length; i++) {
    stageX.push(x);
    x += NODE_W + STAGE_GAP_X;
  }
  const totalWidth = x - STAGE_GAP_X + 10;

  // Compute each stage's vertical layout, centering stacks around a common axis.
  const maxNodes = Math.max(...stages.map((s) => s.nodes.length));
  const blockH = maxNodes * NODE_H + (maxNodes - 1) * NODE_GAP_Y;
  const centerY = PAD_TOP + blockH / 2;

  // Height: tallest block + room for notes beneath + padding.
  const hasNotes = stages.some((s) => s.nodes.some((n) => n.note));
  const totalHeight = PAD_TOP + blockH + (hasNotes ? 40 : 0) + 20;

  // For each stage, the y of each node (stack centered on centerY).
  function nodeY(stage: LineageStage, idx: number): number {
    const n = stage.nodes.length;
    const stackH = n * NODE_H + (n - 1) * NODE_GAP_Y;
    const top = centerY - stackH / 2;
    return top + idx * (NODE_H + NODE_GAP_Y);
  }

  function toneClass(tone?: string): string {
    if (tone === "accent") return "lineage-node lineage-node--accent";
    if (tone === "muted") return "lineage-node lineage-node--muted";
    return "lineage-node";
  }

  return (
    <svg
      className="lineage-svg"
      viewBox={`0 0 ${Math.max(totalWidth, 680)} ${totalHeight}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <desc>{desc}</desc>

      <defs>
        <marker
          id="lineage-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* Edges first (so nodes draw on top) */}
      {stages.map((stage, si) => {
        if (si === 0 || !stage.edgeLabel) return null;
        const fromX = stageX[si - 1] + NODE_W;
        const toX = stageX[si];
        const midX = (fromX + toX) / 2;
        return (
          <g key={`edge-${si}`}>
            <text className="lineage-edge-label" x={midX} y={centerY - blockH / 2 - 6} textAnchor="middle">
              {stage.edgeLabel}
            </text>
            <line
              x1={fromX + 2}
              y1={centerY}
              x2={toX - 2}
              y2={centerY}
              className="lineage-edge"
              markerEnd="url(#lineage-arrow)"
            />
          </g>
        );
      })}

      {/* Nodes */}
      {stages.map((stage, si) =>
        stage.nodes.map((node, ni) => {
          const ny = nodeY(stage, ni);
          const nx = stageX[si];
          return (
            <g key={`node-${si}-${ni}`} className={toneClass(node.tone)}>
              <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8} />
              <text
                className="lineage-node-label"
                x={nx + NODE_W / 2}
                y={ny + NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {node.label}
              </text>
              {node.note && (
                <text
                  className="lineage-node-note"
                  x={nx + NODE_W / 2}
                  y={ny + NODE_H + 16}
                  textAnchor="middle"
                >
                  {node.note}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
