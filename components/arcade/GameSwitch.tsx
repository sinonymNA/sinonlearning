"use client";

 

import HotPotato, { PotatoMembers, PotatoStage } from "./games/HotPotato";
import LastOne from "./games/LastOne";
import QuickDraw from "./games/QuickDraw";
import Telephone from "./games/Telephone";
import Imposter from "./games/Imposter";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function GameSwitch(props: any) {
  const kind = props.view.game?.kind;
  return <div className={`stage theme-${kind}`}><Game {...props} kind={kind} /></div>;
}

function Game(props: any) {
  const kind = props.kind;
  switch (kind) {
    case "hot_potato": return props.projector ? <HotPotatoProjector {...props} /> : <HotPotato {...props} />;
    case "last_one_standing": return <LastOne {...props} />;
    case "quick_draw": return <QuickDraw {...props} />;
    case "telephone": return <Telephone {...props} />;
    case "imposter": return <Imposter {...props} />;
    default: return <div className="ar-panel">Loading game…</div>;
  }
}

function HotPotatoProjector({ view }: any) {
  const g = view.game;
  return (
    <div className="hp-layout">
      {g.group && <div className="ar-panel"><PotatoStage grp={g.group} big /></div>}
      <div className="grid content-start gap-2">
        {g.group && <div className="ar-panel"><PotatoMembers grp={g.group} big /></div>}
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
          {g.groups.map((x: any) => (
            <div key={x.id} className="ar-panel text-center" style={{ borderColor: x.status === "live" && x.heat >= 2 ? "var(--coral)" : undefined, padding: 6 }}>
              <div className="text-sm font-bold">Group {x.id + 1} {x.status === "done" ? "🏆" : x.status === "boom" ? "💥" : "🥔"}</div>
              <div className="truncate text-xs">{x.status === "done" ? x.winner ?? "finished" : x.holder ?? "…"}</div><div className="ar-muted text-xs">{x.alive}/{x.size} alive · R{x.round}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
