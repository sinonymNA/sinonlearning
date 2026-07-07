"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { X } from "lucide-react";
import { KORA_NODES, KORA_EDGES, type KoraNode, type KoraEdge, type KoraNodeKind } from "./koraGraphData";

interface SimNode extends SimulationNodeDatum, KoraNode {}
interface SimLink extends SimulationLinkDatum<SimNode> {
  grounding: string;
}

const WIDTH = 760;
const HEIGHT = 500;

const RADIUS: Record<KoraNodeKind, number> = { core: 32, principle: 20, capability: 15 };

const COLOR: Record<KoraNodeKind, { fill: string; stroke: string }> = {
  core: { fill: "rgba(167, 139, 250, 0.28)", stroke: "rgb(167 139 250)" },
  principle: { fill: "rgba(94, 234, 212, 0.2)", stroke: "rgb(94 234 212)" },
  capability: { fill: "rgba(253, 164, 175, 0.18)", stroke: "rgb(253 164 175)" },
};

const KIND_LABEL: Record<KoraNodeKind, string> = {
  core: "Core",
  principle: "Principle",
  capability: "Capability",
};

// Physics computes x/y into React state each tick; rendering is plain
// React-controlled SVG (no d3-selection/d3-drag DOM mutation, which would
// fight React's own reconciliation of these same elements).
export default function KoraNetworkGraph() {
  const [nodes, setNodes] = useState<SimNode[]>(() => KORA_NODES.map((n) => ({ ...n })));
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingId = useRef<string | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    const simNodes: SimNode[] = KORA_NODES.map((n) => ({ ...n }));
    const simLinks: SimLink[] = KORA_EDGES.map((e) => ({ source: e.source, target: e.target, grounding: e.grounding }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force("charge", forceManyBody().strength(-320))
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => {
            const s = l.source as SimNode;
            const t = l.target as SimNode;
            return s.kind === "core" || t.kind === "core" ? 130 : 92;
          })
          .strength(0.5)
      )
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide<SimNode>().radius((d) => RADIUS[d.kind] + 14));

    simRef.current = sim;

    if (reduceMotion) {
      sim.stop();
      for (let i = 0; i < 300; i++) sim.tick();
      setNodes(simNodes.map((n) => ({ ...n })));
    } else {
      sim.on("tick", () => setNodes(simNodes.map((n) => ({ ...n }))));
    }

    return () => {
      sim.stop();
    };
  }, [reduceMotion]);

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  function toSvgPoint(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function syncFromSim() {
    const sim = simRef.current;
    if (sim) setNodes(sim.nodes().map((n) => ({ ...n })));
  }

  function beginDrag(id: string) {
    return (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();
      const sim = simRef.current;
      if (!sim) return;
      const node = sim.nodes().find((n) => n.id === id);
      if (!node) return;
      draggingId.current = id;
      const pt = toSvgPoint(e);
      node.fx = pt.x;
      node.fy = pt.y;
      if (!reduceMotion) sim.alphaTarget(0.3).restart();
      else syncFromSim();
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function onDragMove(e: React.PointerEvent<SVGGElement>) {
    const id = draggingId.current;
    const sim = simRef.current;
    if (!id || !sim) return;
    const node = sim.nodes().find((n) => n.id === id);
    if (!node) return;
    const pt = toSvgPoint(e);
    node.fx = pt.x;
    node.fy = pt.y;
    if (reduceMotion) syncFromSim();
  }

  function endDrag() {
    const id = draggingId.current;
    const sim = simRef.current;
    if (id && sim) {
      const node = sim.nodes().find((n) => n.id === id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      if (!reduceMotion) sim.alphaTarget(0);
      else syncFromSim();
    }
    draggingId.current = null;
  }

  const activeId = hoveredId ?? selectedId;
  const selectedNode = selectedId ? nodesById.get(selectedId) : null;
  const selectedEdges: (KoraEdge & { otherLabel: string; otherKind: KoraNodeKind })[] = selectedId
    ? KORA_EDGES.filter((e) => e.source === selectedId || e.target === selectedId).map((e) => {
        const otherId = e.source === selectedId ? e.target : e.source;
        const other = nodesById.get(otherId);
        return { ...e, otherLabel: other?.label ?? otherId, otherKind: other?.kind ?? "principle" };
      })
    : [];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900 p-4 shadow-[0_30px_60px_-25px_rgba(13,27,46,0.4)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        {(["core", "principle", "capability"] as KoraNodeKind[]).map((kind) => (
          <span key={kind} className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/50">
            <span
              className="h-2.5 w-2.5 rounded-full border"
              style={{ backgroundColor: COLOR[kind].fill, borderColor: COLOR[kind].stroke }}
            />
            {KIND_LABEL[kind]}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-white/35">Hover to trace connections · click a node for details</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full select-none touch-none"
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClick={() => setSelectedId(null)}
      >
        {KORA_EDGES.map((e, i) => {
          const s = nodesById.get(e.source);
          const t = nodesById.get(e.target);
          if (!s || !t || s.x == null || t.x == null) return null;
          const connected = activeId ? e.source === activeId || e.target === activeId : false;
          const dimmed = activeId ? !connected : false;
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={connected ? "rgb(253 224 71)" : "rgb(255 255 255)"}
              strokeWidth={connected ? 2 : 1}
              strokeOpacity={dimmed ? 0.06 : connected ? 0.8 : 0.18}
              style={{ transition: "stroke-opacity 0.25s, stroke 0.25s" }}
            />
          );
        })}

        {nodes.map((n) => {
          if (n.x == null || n.y == null) return null;
          const r = RADIUS[n.kind];
          const isActive = activeId === n.id;
          const isConnected = activeId
            ? KORA_EDGES.some((e) => (e.source === activeId && e.target === n.id) || (e.target === activeId && e.source === n.id))
            : false;
          const dimmed = activeId ? !isActive && !isConnected : false;
          const color = COLOR[n.kind];
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onPointerDown={beginDrag(n.id)}
              onPointerEnter={() => setHoveredId(n.id)}
              onPointerOut={() => setHoveredId((h) => (h === n.id ? null : h))}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId((cur) => (cur === n.id ? null : n.id));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId((cur) => (cur === n.id ? null : n.id));
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={n.label}
              className="cursor-pointer"
              style={{ opacity: dimmed ? 0.3 : 1, transition: "opacity 0.25s" }}
            >
              <circle
                r={r}
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth={isActive || selectedId === n.id ? 2.5 : 1.5}
              />
              <text
                y={r + 14}
                textAnchor="middle"
                className="pointer-events-none fill-white/75 text-[10px] font-medium"
                style={{ paintOrder: "stroke", stroke: "rgba(15,23,42,0.85)", strokeWidth: 3 }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedNode && (
        <div className="absolute top-4 right-4 z-20 w-72 max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1929]/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start justify-between border-b border-white/8 p-4 pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{KIND_LABEL[selectedNode.kind]}</p>
              <h3 className="mt-0.5 text-base font-bold leading-tight text-white">{selectedNode.label}</h3>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="ml-2 mt-0.5 shrink-0 text-white/40 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            {selectedEdges.length === 0 && <p className="text-xs text-white/40">No grounded connections.</p>}
            {selectedEdges.map((e, i) => (
              <div key={i} className="border-b border-white/8 pb-3 last:border-0 last:pb-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLOR[e.otherKind].stroke }}>
                  {e.otherLabel}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{e.grounding}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
