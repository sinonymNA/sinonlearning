"use client";

import { useState } from "react";
import { RotateCcw, Zap, Check, X } from "lucide-react";
import {
  SPAM_DATASET,
  INITIAL_MODEL,
  classify,
  modelAccuracy,
  perceptronStep,
  boundaryEndpoints,
  type LinearModel,
} from "@/lib/decisionBoundary";

const SIZE = 320;
const SCALE = SIZE / 10;
const toPx = (value: number) => value * SCALE;
const toPy = (value: number) => SIZE - value * SCALE;

function modelFromEndpoints(leftY: number, rightY: number): LinearModel {
  const slope = (rightY - leftY) / 10;
  return { w0: slope, w1: -1, b: leftY };
}

export default function DecisionBoundarySandbox() {
  const [model, setModel] = useState<LinearModel>(INITIAL_MODEL);
  const [epoch, setEpoch] = useState(0);

  const { leftY, rightY } = boundaryEndpoints(model);
  const acc = modelAccuracy(model, SPAM_DATASET);
  const clampedLeft = Math.max(-5, Math.min(20, leftY));
  const clampedRight = Math.max(-5, Math.min(20, rightY));

  const updateEndpoints = (newLeftY: number, newRightY: number) => {
    setModel(modelFromEndpoints(newLeftY, newRightY));
  };

  const train = (rounds: number) => {
    let current = model;
    for (let i = 0; i < rounds; i++) current = perceptronStep(current, SPAM_DATASET);
    setModel(current);
    setEpoch((e) => e + rounds);
  };

  const reset = () => {
    setModel(INITIAL_MODEL);
    setEpoch(0);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-navy-900/60 p-4 sm:p-6">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-md mx-auto">
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="rgba(255,255,255,0.02)" />
          {[2, 4, 6, 8].map((g) => (
            <g key={g}>
              <line x1={toPx(g)} y1={0} x2={toPx(g)} y2={SIZE} stroke="rgba(255,255,255,0.05)" />
              <line x1={0} y1={toPy(g)} x2={SIZE} y2={toPy(g)} stroke="rgba(255,255,255,0.05)" />
            </g>
          ))}

          <line
            x1={0}
            y1={toPy(clampedLeft)}
            x2={SIZE}
            y2={toPy(clampedRight)}
            stroke="rgb(253 224 71)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            style={{ transition: "y1 0.3s, y2 0.3s" }}
          />

          {SPAM_DATASET.map((point, i) => {
            const predicted = classify(model, point);
            const correct = predicted === point.label;
            return (
              <g key={i} style={{ transition: "opacity 0.2s" }}>
                <circle
                  cx={toPx(point.x)}
                  cy={toPy(point.y)}
                  r={9}
                  fill={point.label === 1 ? "rgba(251,113,133,0.8)" : "rgba(94,234,212,0.8)"}
                  stroke={correct ? "transparent" : "rgb(253 224 71)"}
                  strokeWidth={2}
                />
                {!correct && (
                  <text x={toPx(point.x)} y={toPy(point.y) + 4} textAnchor="middle" className="fill-navy-950 text-[10px] font-bold">
                    !
                  </text>
                )}
              </g>
            );
          })}

          <text x={8} y={16} className="fill-white/40 text-[10px]">more exclamation marks &uarr;</text>
          <text x={SIZE - 110} y={SIZE - 8} className="fill-white/40 text-[10px]">more links &rarr;</text>
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 text-sm">
        <span className="flex items-center gap-1.5 text-teal-200">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300" /> Not spam
        </span>
        <span className="flex items-center gap-1.5 text-rose-200">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" /> Spam
        </span>
        <span className="flex items-center gap-1.5 text-white/50">
          <span className="h-2.5 w-2.5 rounded-full border border-amber-300" /> Misclassified
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">
            Boundary — left edge height: {clampedLeft.toFixed(1)}
          </span>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={clampedLeft}
            onChange={(e) => updateEndpoints(Number(e.target.value), clampedRight)}
            className="mt-2 w-full accent-amber-300"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">
            Boundary — right edge height: {clampedRight.toFixed(1)}
          </span>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={clampedRight}
            onChange={(e) => updateEndpoints(clampedLeft, Number(e.target.value))}
            className="mt-2 w-full accent-amber-300"
          />
        </label>
      </div>

      <p className="text-sm leading-relaxed text-white/60">
        Drag the boundary yourself and try to separate the two colors perfectly — that&rsquo;s you doing
        what a model&rsquo;s training loop does automatically. Then hit &ldquo;Auto-train&rdquo; and watch the
        perceptron learning rule nudge the line, one pass over the data at a time, toward the same answer.
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        <button
          onClick={() => train(1)}
          className="flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          <Zap size={14} />
          Auto-train 1 pass
        </button>
        <button
          onClick={() => train(10)}
          className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <Zap size={14} />
          Auto-train 10 passes
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-white/80">
          {acc === 1 ? <Check size={14} className="text-teal-300" /> : <X size={14} className="text-amber-300" />}
          {Math.round(acc * 100)}% correct &middot; pass {epoch}
        </span>
      </div>
    </div>
  );
}
