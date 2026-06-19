"use client";

import { useState } from "react";
import { RotateCcw, Zap, Siren } from "lucide-react";
import {
  ALARM_DATASET,
  INITIAL_NETWORK,
  accuracy,
  forward,
  trainEpoch,
  type MiniNetwork,
} from "@/lib/miniNeuralNet";

const INPUT_POS: [number, number][] = [
  [50, 60],
  [50, 200],
];
const HIDDEN_POS: [number, number][] = [
  [220, 30],
  [220, 130],
  [220, 230],
];
const OUTPUT_POS: [number, number] = [390, 130];

function weightColor(weight: number) {
  return weight >= 0 ? "rgb(94 234 212)" : "rgb(253 164 175)";
}
function weightWidth(weight: number) {
  return Math.min(6, Math.max(1, Math.abs(weight) * 3.5));
}

export default function NeuralNetworkPlayground() {
  const [net, setNet] = useState<MiniNetwork>(INITIAL_NETWORK);
  const [epoch, setEpoch] = useState(0);
  const [sensorA, setSensorA] = useState(0.5);
  const [sensorB, setSensorB] = useState(0.5);

  const { hidden, output } = forward(net, [sensorA, sensorB]);
  const acc = accuracy(net, ALARM_DATASET);

  const train = (rounds: number) => {
    let current = net;
    for (let i = 0; i < rounds; i++) current = trainEpoch(current, ALARM_DATASET);
    setNet(current);
    setEpoch((e) => e + rounds);
  };

  const reset = () => {
    setNet(INITIAL_NETWORK);
    setEpoch(0);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-navy-900/60 p-4 sm:p-6">
        <svg viewBox="0 0 440 260" className="h-auto w-full">
          {HIDDEN_POS.map((hPos, hi) =>
            INPUT_POS.map((iPos, ii) => {
              const w = net.w1[hi][ii];
              return (
                <line
                  key={`i${ii}-h${hi}`}
                  x1={iPos[0]}
                  y1={iPos[1]}
                  x2={hPos[0]}
                  y2={hPos[1]}
                  stroke={weightColor(w)}
                  strokeWidth={weightWidth(w)}
                  strokeOpacity={0.55}
                  style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                />
              );
            })
          )}
          {HIDDEN_POS.map((hPos, hi) => {
            const w = net.w2[hi];
            return (
              <line
                key={`h${hi}-o`}
                x1={hPos[0]}
                y1={hPos[1]}
                x2={OUTPUT_POS[0]}
                y2={OUTPUT_POS[1]}
                stroke={weightColor(w)}
                strokeWidth={weightWidth(w)}
                strokeOpacity={0.55}
                style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
              />
            );
          })}

          {INPUT_POS.map((pos, i) => (
            <g key={`input-${i}`}>
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={22}
                fill={`rgba(192, 132, 252, ${0.15 + [sensorA, sensorB][i] * 0.65})`}
                stroke="rgb(192 132 252)"
                strokeWidth={1.5}
                style={{ transition: "fill 0.2s" }}
              />
              <text x={pos[0]} y={pos[1] + 38} textAnchor="middle" className="fill-white/55 text-[10px] uppercase tracking-wide">
                Sensor {i === 0 ? "A" : "B"}
              </text>
            </g>
          ))}

          {HIDDEN_POS.map((pos, i) => (
            <circle
              key={`hidden-${i}`}
              cx={pos[0]}
              cy={pos[1]}
              r={20}
              fill={`rgba(94, 234, 212, ${0.12 + hidden[i] * 0.65})`}
              stroke="rgb(94 234 212)"
              strokeWidth={1.5}
              style={{ transition: "fill 0.25s" }}
            />
          ))}

          <circle
            cx={OUTPUT_POS[0]}
            cy={OUTPUT_POS[1]}
            r={26}
            fill={`rgba(251, 113, 133, ${0.15 + output * 0.7})`}
            stroke="rgb(251 113 133)"
            strokeWidth={1.5}
            style={{ transition: "fill 0.25s" }}
          />
          <text x={OUTPUT_POS[0]} y={OUTPUT_POS[1] + 46} textAnchor="middle" className="fill-white/55 text-[10px] uppercase tracking-wide">
            Alert?
          </text>
        </svg>

        <div className="mt-2 flex items-center justify-center gap-2 text-center">
          <Siren size={16} className={output >= 0.5 ? "text-rose-300" : "text-white/30"} />
          <p className="font-display text-2xl font-medium text-white">{Math.round(output * 100)}%</p>
          <span className="text-sm text-white/50">alert probability</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">Sensor A: {sensorA.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sensorA}
            onChange={(e) => setSensorA(Number(e.target.value))}
            className="mt-2 w-full accent-purple-300"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">Sensor B: {sensorB.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sensorB}
            onChange={(e) => setSensorB(Number(e.target.value))}
            className="mt-2 w-full accent-purple-300"
          />
        </label>
      </div>

      <p className="text-sm leading-relaxed text-white/60">
        The rule this network is learning: sound the alert when <em>exactly one</em> sensor is triggered — not
        neither, not both. Try setting both sliders to 0, then both to 1, then one of each. A single neuron
        can never learn this pattern no matter how its weights are tuned; that&rsquo;s the entire reason this
        network needs a hidden layer.
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        <button
          onClick={() => train(1)}
          className="flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          <Zap size={14} />
          Train 1 round
        </button>
        <button
          onClick={() => train(20)}
          className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <Zap size={14} />
          Train 20 rounds
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <span className="ml-auto text-sm text-white/50">
          Epoch {epoch} &middot; {Math.round(acc * 4)}/4 training examples correct
        </span>
      </div>
    </div>
  );
}
