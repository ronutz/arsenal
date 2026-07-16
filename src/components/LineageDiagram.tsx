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
const EDGE_LINE_H = 13; // line height for wrapped edge labels (11px mono)
const EDGE_WRAP_CHARS = 26; // wrap edge labels so adjacent stages' labels never collide
const LABEL_WRAP_CHARS = 16; // wrap node labels to stay inside the box (13px font)
const NOTE_WRAP_CHARS = 21; // wrap node notes to stay inside the box width (11px mono)
const NOTE_LINE_H = 13; // line height for wrapped note lines
const NOTE_CLEAR = 10; // clearance between a note block and the next stacked node

// Greedy word-wrap for edge labels. Long era labels (the Ping/ForgeRock page's
// "2010: Oracle absorbs Sun; five engineers fork the stack") used to render as
// one line and overlap the neighboring stage's label; wrapped tspans keep each
// label inside its own column (fix 2026-07-16, PRIME report).
function wrapLabel(text: string, max = EDGE_WRAP_CHARS): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && line.length + 1 + w.length > max) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function LineageDiagram({ title, desc, stages }: LineageDiagramProps) {
  // Compute the x position of each stage.
  const stageX: number[] = [];
  let x = 10;
  for (let i = 0; i < stages.length; i++) {
    stageX.push(x);
    x += NODE_W + STAGE_GAP_X;
  }
  const totalWidth = x - STAGE_GAP_X + 10;

  // Compute each stage's vertical layout. Each node occupies a SLOT of
  // NODE_H plus, when it carries a note, NOTE_SPACE beneath - so a note under
  // a stacked node can never run into the next node's box (fix 2026-07-16:
  // on the Ping/ForgeRock page the "Denver, 2002" note used to land inside
  // the Sun Microsystems rectangle). Stacks are centered on a common axis.
  // A slot is the node box plus the FULL height of its wrapped note block.
  // Fix 2026-07-16 v2, PRIME report: single-line notes wider than the box
  // used to bleed sideways across neighboring columns and node borders.
  // Notes now wrap to the box width and the slot grows with the line count.
  function noteLines(node: LineageNode): string[] {
    return node.note ? wrapLabel(node.note, NOTE_WRAP_CHARS) : [];
  }
  function slotH(node: LineageNode): number {
    const nl = noteLines(node).length;
    return NODE_H + (nl ? nl * NOTE_LINE_H + NOTE_CLEAR : 0);
  }
  function stackH(stage: LineageStage): number {
    const slots = stage.nodes.reduce((acc, n) => acc + slotH(n), 0);
    return slots + (stage.nodes.length - 1) * NODE_GAP_Y;
  }
  const blockH = Math.max(...stages.map(stackH));

  // Top padding reserves room for the tallest wrapped edge label.
  const maxEdgeLines = Math.max(
    1,
    ...stages.map((st) => (st.edgeLabel ? wrapLabel(st.edgeLabel).length : 0)),
  );
  const padTop = 12 + maxEdgeLines * EDGE_LINE_H;
  const centerY = padTop + blockH / 2;

  // Height: padding + tallest block (which already includes note slots) + foot.
  const totalHeight = padTop + blockH + 16;

  // For each stage, the y of each node (its stack centered on centerY).
  function nodeY(stage: LineageStage, idx: number): number {
    const top = centerY - stackH(stage) / 2;
    let y = top;
    for (let i = 0; i < idx; i++) y += slotH(stage.nodes[i]) + NODE_GAP_Y;
    return y;
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
            {/* Wrapped label: last line sits just above the block; earlier
                lines stack upward into the reserved top padding. */}
            <text
              className="lineage-edge-label"
              x={midX}
              y={centerY - blockH / 2 - 6 - (wrapLabel(stage.edgeLabel).length - 1) * EDGE_LINE_H}
              textAnchor="middle"
            >
              {wrapLabel(stage.edgeLabel).map((ln, li) => (
                <tspan key={li} x={midX} dy={li === 0 ? 0 : EDGE_LINE_H}>
                  {ln}
                </tspan>
              ))}
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
              {(() => {
                const lab = wrapLabel(node.label, LABEL_WRAP_CHARS).slice(0, 2);
                const startDy = lab.length === 2 ? -7 : 0;
                return (
                  <text
                    className="lineage-node-label"
                    x={nx + NODE_W / 2}
                    y={ny + NODE_H / 2 + startDy}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {lab.map((ln, li) => (
                      <tspan key={li} x={nx + NODE_W / 2} dy={li === 0 ? 0 : 14}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                );
              })()}
              {node.note && (
                <text
                  className="lineage-node-note"
                  x={nx + NODE_W / 2}
                  y={ny + NODE_H + 14}
                  textAnchor="middle"
                >
                  {noteLines(node).map((ln, li) => (
                    <tspan key={li} x={nx + NODE_W / 2} dy={li === 0 ? 0 : NOTE_LINE_H}>
                      {ln}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
