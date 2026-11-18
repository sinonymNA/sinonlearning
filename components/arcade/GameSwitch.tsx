"use client";

 

import HotPotato, { PotatoGroup } from "./games/HotPotato";
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
    <div className="grid gap-4">
      {g.group && <div className="ar-panel"><PotatoGroup grp={g.group} big /></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {g.groups.map((x: any) => (
          <div key={x.id} className="ar-panel text-center" style={{ borderColor: x.status === "live" && x.heat >= 2 ? "var(--coral)" : undefined }}>
            <div className="font-bold">Group {x.id + 1}</div><div className="text-4xl">{x.status === "done" ? "🏆" : x.status === "boom" ? "💥" : "🥔"}</div>
            <div className="text-sm">{x.status === "done" ? x.winner ?? "finished" : x.holder ?? "…"}</div><div className="ar-muted text-xs">{x.alive}/{x.size} alive · round {x.round}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
