"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, DoorOpen, Flame, Gem, Heart, RotateCcw, Shield, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VAULT_ARTIFACTS, VAULT_CUSTOM_SET_KEY, VAULT_QUESTIONS, type VaultArtifact, type VaultCustomSet } from "@/lib/vaultGame";

type Phase = "home" | "question" | "glitch" | "choice" | "reward" | "shrine" | "lost" | "extracted";
type RunModifier = "echo" | "fortune" | "lantern" | null;
type Save = { shards: number; bestDepth: number; artifacts: string[]; mastered: string[]; conceptWins?: Record<string, number> };

const EMPTY_SAVE: Save = { shards: 0, bestDepth: 0, artifacts: [], mastered: [] };
const depths = Array.from({ length: 8 }, (_, i) => i + 1);

function rarityColor(rarity: VaultArtifact["rarity"]) {
  if (rarity === "Mythic") return "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-300/10";
  if (rarity === "Rare") return "text-cyan-200 border-cyan-300/40 bg-cyan-300/10";
  return "text-amber-100 border-amber-200/30 bg-amber-200/10";
}

export default function VaultGame() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("home");
  const [save, setSave] = useState<Save>(EMPTY_SAVE);
  const [loaded, setLoaded] = useState(false);
  const [deck, setDeck] = useState("Mixed Descent");
  const [customSet, setCustomSet] = useState<VaultCustomSet | null>(null);
  const [depth, setDepth] = useState(1);
  const [torch, setTorch] = useState(3);
  const [shards, setShards] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tempArtifacts, setTempArtifacts] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [repairSelected, setRepairSelected] = useState<number | null>(null);
  const [reward, setReward] = useState<VaultArtifact | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [modifier, setModifier] = useState<RunModifier>(null);
  const [visitedShrines, setVisitedShrines] = useState<number[]>([]);
  const [eliminated, setEliminated] = useState<number | null>(null);
  const [runWins, setRunWins] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sinon-vault-save-v1");
      // Hydrate browser-only progress after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSave(JSON.parse(raw) as Save);
      const customRaw = localStorage.getItem(VAULT_CUSTOM_SET_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw) as VaultCustomSet;
        if (parsed.questions?.length >= 3) {
          setCustomSet(parsed);
          if (new URLSearchParams(window.location.search).get("set") === "custom") setDeck(parsed.title);
        }
      }
    } catch { /* local-only progress is optional */ }
    setLoaded(true);
  }, []);

  const pool = useMemo(() => {
    if (customSet && deck === customSet.title) return customSet.questions;
    if (deck === "Mixed Descent") return VAULT_QUESTIONS;
    return VAULT_QUESTIONS.filter((q) => q.subject === deck);
  }, [customSet, deck]);
  const question = pool[(depth - 1) % pool.length];
  const order = useMemo(() => {
    const shift = (depth * 3 + question.id.length) % 4;
    return [0, 1, 2, 3].map((_, index) => (index + shift) % 4);
  }, [depth, question.id]);

  function persist(next: Save) {
    setSave(next);
    try { localStorage.setItem("sinon-vault-save-v1", JSON.stringify(next)); } catch { /* best effort */ }
  }

  function startRun() {
    setDepth(1); setTorch(3); setShards(0); setStreak(0); setTempArtifacts([]);
    setSelected(null); setRepairSelected(null); setReward(null); setModifier(null); setVisitedShrines([]); setEliminated(null); setRunWins({}); setPhase("question");
  }

  function answer(choiceIndex: number) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    const correct = choiceIndex === question.answer;
    setLastCorrect(correct);
    if (correct) {
      setStreak((s) => s + 1);
      const baseReward = 18 + depth * 4 + streak * 2;
      setShards((s) => s + Math.round(baseReward * (modifier === "fortune" ? 1.5 : 1)));
      setRunWins((current) => ({ ...current, [question.concept]: (current[question.concept] ?? 0) + 1 }));
      window.setTimeout(() => {
        if (depth % 2 === 0) {
          const available = VAULT_ARTIFACTS.filter((a) => !tempArtifacts.includes(a.id));
          const found = available[(depth + streak) % available.length] ?? VAULT_ARTIFACTS[depth % VAULT_ARTIFACTS.length];
          setReward(found); setTempArtifacts((old) => [...old, found.id]); setPhase("reward");
        } else setPhase("choice");
      }, 850);
    } else {
      setStreak(0);
      setTorch((t) => Math.max(0, t - (modifier === "fortune" ? 2 : 1)));
      window.setTimeout(() => setPhase("glitch"), 850);
    }
  }

  function repair(choiceIndex: number) {
    if (repairSelected !== null) return;
    setRepairSelected(choiceIndex);
    const repaired = choiceIndex === question.repairAnswer;
    if (repaired) setShards((s) => s + 8);
    window.setTimeout(() => {
      setRepairSelected(null);
      if (torch <= 0) setPhase("lost"); else setPhase("choice");
    }, 900);
  }

  function descend() {
    if (depth >= 8) { extract(); return; }
    const leavingDepth = depth;
    setDepth((d) => d + 1); setSelected(null); setEliminated(null); setLastCorrect(false);
    if ((leavingDepth === 3 || leavingDepth === 6) && !visitedShrines.includes(leavingDepth)) {
      setVisitedShrines((old) => [...old, leavingDepth]);
      setPhase("shrine");
    } else setPhase("question");
  }

  function chooseBlessing(next: Exclude<RunModifier, null>) {
    setModifier(next);
    if (next === "lantern") setTorch((value) => Math.min(4, value + 1));
    setPhase("question");
  }

  function useEchoLens() {
    if (modifier !== "echo" || eliminated !== null || selected !== null) return;
    const wrong = order.find((index) => index !== question.answer);
    if (wrong !== undefined) setEliminated(wrong);
  }

  function extract() {
    const next = {
      shards: save.shards + shards,
      bestDepth: Math.max(save.bestDepth, depth),
      artifacts: Array.from(new Set([...save.artifacts, ...tempArtifacts])),
      mastered: Array.from(new Set([...save.mastered, ...(lastCorrect ? [question.concept] : [])])),
      conceptWins: Object.entries(runWins).reduce((all, [concept, wins]) => ({ ...all, [concept]: (all[concept] ?? 0) + wins }), { ...(save.conceptWins ?? {}) }),
    };
    persist(next); setPhase("extracted");
  }

  if (!loaded) return <main className="min-h-screen bg-[#07100f]" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07100f] text-[#f4eedc] selection:bg-cyan-300 selection:text-[#07100f]">
      <CaveBackdrop depth={phase === "home" ? 0 : depth} />
      <header className="relative z-30 flex h-16 items-center justify-between border-b border-[#ddc98b]/10 bg-[#07100f]/75 px-4 backdrop-blur-xl md:px-8">
        <Link href="/game-shows" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#c8b98d] hover:text-white"><ArrowLeft size={14}/> Games</Link>
        <div className="text-center"><p className="font-display text-xl font-black tracking-[.08em] text-[#f2e5bc]">THE VAULT</p><p className="text-[8px] uppercase tracking-[.32em] text-cyan-200/55">First Descent</p></div>
        <div className="flex items-center gap-3 text-xs text-[#dccd9f]"><span className="flex items-center gap-1"><Gem size={13} className="text-cyan-300"/>{save.shards}</span><span className="hidden sm:inline">Best: {save.bestDepth || "—"}</span></div>
      </header>

      <AnimatePresence mode="wait">
        {phase === "home" ? (
          <motion.section key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.15fr_.85fr] lg:px-10">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[.28em] text-cyan-300">The gates have opened</p>
              <h1 className="max-w-3xl font-display text-6xl font-black leading-[.88] tracking-[-.05em] text-[#f4ead0] sm:text-7xl lg:text-8xl">Nobody has reached the bottom.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#b9b09b]">Answer what you know. Repair what you don’t. Take the treasure and leave—or risk everything to see what waits below.</p>
              <div className="mt-8 flex flex-wrap items-end gap-3">
                <label className="text-[10px] font-bold uppercase tracking-[.18em] text-[#938b78]">Question set<select value={deck} onChange={(e)=>setDeck(e.target.value)} className="mt-2 block min-w-52 rounded-xl border border-[#ddc98b]/20 bg-[#0d1d1b] px-4 py-3 text-sm normal-case tracking-normal text-[#f4eedc] outline-none focus:border-cyan-300"><option>Mixed Descent</option><option>World History</option><option>Biology</option><option>Algebra</option>{customSet&&<option>{customSet.title}</option>}</select></label>
                <button onClick={startRun} className="group flex items-center gap-3 rounded-xl bg-[#e6d398] px-6 py-3 text-sm font-black uppercase tracking-[.14em] text-[#10211f] shadow-[0_0_40px_rgba(230,211,152,.12)] transition hover:bg-white">Begin descent <ChevronDown size={17} className="transition group-hover:translate-y-1"/></button>
                <Link href="/vault/build" className="flex items-center gap-2 px-2 py-3 text-xs font-bold text-cyan-200/65 hover:text-cyan-100">Forge a question set <ArrowRight size={13}/></Link>
              </div>
            </div>
            <VaultShelf save={save}/>
          </motion.section>
        ) : (
          <motion.section key={phase} initial={{opacity:0,y:reduceMotion?0:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduceMotion?0:-10}} className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[170px_minmax(0,1fr)_210px] lg:px-8">
            <RunMap depth={depth}/>
            <div className="flex min-h-[620px] items-center justify-center">
              {phase === "question" && (
                <QuestionChamber question={question} order={order} selected={selected} eliminated={eliminated} memory={(save.conceptWins?.[question.concept] ?? 0) > 0} boss={depth===8} canEcho={modifier==="echo"&&eliminated===null} onEcho={useEchoLens} onAnswer={answer}/>
              )}
              {phase === "glitch" && <GlitchChamber question={question} selected={repairSelected} onRepair={repair}/>} 
              {phase === "choice" && <ChoiceChamber depth={depth} torch={torch} shards={shards} onDescend={descend} onExtract={extract}/>} 
              {phase === "reward" && reward && <RewardChamber artifact={reward} onContinue={()=>setPhase("choice")}/>} 
              {phase === "shrine" && (
                <ShrineChamber active={modifier} onChoose={chooseBlessing}/>
              )}
              {phase === "lost" && <EndChamber lost shards={Math.floor(shards/2)} onHome={()=>setPhase("home")} onAgain={startRun}/>} 
              {phase === "extracted" && <EndChamber shards={shards} artifacts={tempArtifacts.length} onHome={()=>setPhase("home")} onAgain={startRun}/>} 
            </div>
            <RunStats torch={torch} shards={shards} streak={streak} artifacts={tempArtifacts} modifier={modifier}/>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function CaveBackdrop({depth}:{depth:number}) {
  return <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(39,123,117,.17),transparent_38%),radial-gradient(circle_at_10%_70%,rgba(119,80,35,.12),transparent_35%),linear-gradient(#091412,#050908)]"/><div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent"/><div className="absolute -left-24 top-1/4 h-[520px] w-72 rounded-[50%] border-r border-[#d8c078]/10 bg-[#0b1715] blur-sm"/><div className="absolute -right-24 bottom-0 h-[620px] w-80 rounded-[50%] border-l border-cyan-200/10 bg-[#081513] blur-sm"/><div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[.4em] text-white/[.06]">Depth {depth.toString().padStart(2,"0")} · The Vault rearranges itself</div></div>;
}

function VaultShelf({save}:{save:Save}) {
  const owned=VAULT_ARTIFACTS.filter(a=>save.artifacts.includes(a.id));
  const memories=Object.keys(save.conceptWins??{}).length;
  return <div className="relative rounded-[2rem] border border-[#ddc98b]/15 bg-[#091512]/80 p-6 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d1bd80]">Your collection</p><p className="mt-1 text-sm text-[#817b6d]">Recovered from earlier descents</p></div><span className="text-2xl font-black text-[#efe1b7]">{owned.length}<small className="text-sm text-[#615d53]">/{VAULT_ARTIFACTS.length}</small></span></div><div className="grid grid-cols-3 gap-3">{VAULT_ARTIFACTS.map(a=><div key={a.id} className={`aspect-square rounded-2xl border text-center ${save.artifacts.includes(a.id)?rarityColor(a.rarity):"border-white/5 bg-black/20 text-white/10"}`}><div className="flex h-full flex-col items-center justify-center"><span className="font-display text-4xl">{save.artifacts.includes(a.id)?a.glyph:"?"}</span>{save.artifacts.includes(a.id)&&<span className="mt-2 px-1 text-[8px] uppercase tracking-wider">{a.name}</span>}</div></div>)}</div><div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] px-4 py-3 text-xs leading-5 text-[#9caa9e]"><span>{memories ? `${memories} idea${memories===1?"":"s"} remembered across descents` : "Return with an idea intact to awaken a Memory Chamber."}</span>{memories>0&&<span className="ml-3 shrink-0 font-black text-cyan-200">{memories} ✦</span>}</div></div>;
}

function RunMap({depth}:{depth:number}) { return <aside className="hidden lg:block"><p className="mb-5 text-[9px] font-bold uppercase tracking-[.22em] text-[#777264]">The descent</p><div className="relative pl-5"><div className="absolute bottom-5 left-[29px] top-5 w-px bg-[#ddc98b]/10"/>{depths.map(d=><div key={d} className="relative mb-5 flex items-center gap-3"><span className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold ${d===depth?"scale-125 border-cyan-200 bg-cyan-200 text-[#09201d] shadow-[0_0_20px_rgba(165,243,252,.5)]":d<depth?"border-[#d9c78f] bg-[#d9c78f] text-[#1b211d]":"border-white/10 bg-[#091412] text-white/20"}`}>{d<depth?<Check size={10}/>:d}</span><span className={`text-[9px] uppercase tracking-wider ${d===depth?"text-cyan-100":"text-white/20"}`}>{d===8?"The sealed gate":d===depth?"Current chamber":`Depth ${d}`}</span></div>)}</div></aside>; }

function RunStats({torch,shards,streak,artifacts,modifier}:{torch:number;shards:number;streak:number;artifacts:string[];modifier:RunModifier}) { return <aside className="hidden lg:block"><p className="mb-5 text-[9px] font-bold uppercase tracking-[.22em] text-[#777264]">Expedition pack</p><div className="space-y-3 rounded-2xl border border-white/[.07] bg-black/20 p-4"><Stat icon={<Heart size={14}/>} label="Lantern" value={`${torch}/${modifier==="lantern"?4:3}`} danger={torch===1}/><Stat icon={<Gem size={14}/>} label="Unbanked shards" value={String(shards)}/><Stat icon={<Flame size={14}/>} label="Knowledge streak" value={String(streak)}/>{modifier&&<div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[.06] px-2.5 py-2 text-[10px] text-cyan-100">{modifier==="echo"?"Echo Lens · reveal a false path":modifier==="fortune"?"Fortune Oath · +50% shards, double danger":"Deep Lantern · four light"}</div>}<div className="border-t border-white/[.07] pt-3"><p className="text-[9px] uppercase tracking-wider text-white/30">Carried relics</p><div className="mt-2 flex flex-wrap gap-1.5">{artifacts.length?artifacts.map(id=><span key={id} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8c78e]/20 bg-[#d8c78e]/10 font-display text-lg text-[#e7d9aa]">{VAULT_ARTIFACTS.find(a=>a.id===id)?.glyph}</span>):<span className="text-xs italic text-white/20">The pack is empty.</span>}</div></div></div></aside>; }
function Stat({icon,label,value,danger}:{icon:React.ReactNode;label:string;value:string;danger?:boolean}) { return <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] text-white/40">{icon}{label}</span><strong className={danger?"text-red-300":"text-[#e5d8ae]"}>{value}</strong></div>; }

function QuestionChamber({question,order,selected,eliminated,memory,boss,canEcho,onEcho,onAnswer}:{question:(typeof VAULT_QUESTIONS)[number];order:number[];selected:number|null;eliminated:number|null;memory:boolean;boss:boolean;canEcho:boolean;onEcho:()=>void;onAnswer:(i:number)=>void}) { return <div className="w-full max-w-3xl"><div className="mb-4 flex items-center justify-between"><span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] ${boss?"border-amber-300/30 bg-amber-300/10 text-amber-200":memory?"border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200":"border-cyan-300/20 bg-cyan-300/[.06] text-cyan-200"}`}>{boss?"The sealed gate":memory?"Memory chamber":"Knowledge chamber"}</span><span className="text-[10px] text-white/30">{question.subject} · {question.concept}</span></div><div className={`rounded-[2rem] border bg-[#0a1715]/95 p-5 shadow-[0_35px_100px_rgba(0,0,0,.65)] sm:p-8 ${boss?"border-amber-300/30":memory?"border-fuchsia-300/25":"border-[#dfcb8d]/20"}`}><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#dfcb8d]/30 bg-[radial-gradient(circle,#ddcc91_0%,#826f3d_35%,#1a2620_70%)] shadow-[0_0_50px_rgba(224,204,145,.2)]"><DoorOpen size={25} className="text-[#fff1c2]"/></div>{memory&&<p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[.18em] text-fuchsia-200/70">The Vault remembers that you knew this once.</p>}<h2 className="text-center font-display text-2xl font-bold leading-tight text-[#f3ead3] sm:text-3xl">{question.prompt}</h2>{canEcho&&<div className="mt-4 text-center"><button onClick={onEcho} className="rounded-full border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Use Echo Lens · reveal a false path</button></div>}<div className="mt-7 grid gap-3 sm:grid-cols-2">{order.map((choiceIndex,index)=>{const isPicked=selected===choiceIndex;const correct=choiceIndex===question.answer;const revealed=selected!==null;const erased=eliminated===choiceIndex;return <button key={choiceIndex} onClick={()=>onAnswer(choiceIndex)} disabled={revealed||erased} className={`group flex min-h-20 items-start gap-3 rounded-2xl border p-4 text-left transition ${erased?"border-white/5 bg-black/20 opacity-15 line-through":revealed&&correct?"border-emerald-300 bg-emerald-300/15":isPicked&&!correct?"border-red-300 bg-red-300/10":revealed?"border-white/5 bg-white/[.02] opacity-35":"border-white/10 bg-white/[.04] hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-200/[.07]"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[.07] text-xs font-black text-[#d9cda9]">{String.fromCharCode(65+index)}</span><span className="pt-1 text-sm leading-5 text-[#e7e0cd]">{erased?"The echo rejects this path":question.choices[choiceIndex]}</span>{revealed&&correct&&<Check size={16} className="ml-auto shrink-0 text-emerald-300"/>}{isPicked&&!correct&&<X size={16} className="ml-auto shrink-0 text-red-300"/>}</button>})}</div>{selected!==null&&<p className={`mt-5 text-center text-sm ${selected===question.answer?"text-emerald-200":"text-red-200"}`}>{selected===question.answer?boss?"The final seal begins to turn.":memory?"The memory holds. Something in your collection awakens.":"The lock yields. The path is open.":"The chamber fractures. A Glitch has escaped."}</p>}</div></div>; }

function GlitchChamber({question,selected,onRepair}:{question:(typeof VAULT_QUESTIONS)[number];selected:number|null;onRepair:(i:number)=>void}) { return <div className="w-full max-w-2xl"><div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-300/30 bg-[#160d1a]/95 p-6 shadow-[0_0_80px_rgba(217,70,239,.13)] sm:p-9"><div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(232,121,249,.18)_7px)]"/><div className="relative"><div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200"><Shield size={19}/></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-fuchsia-300">Glitch detected</p><h2 className="font-display text-2xl font-bold">Repair the misunderstanding</h2></div></div><p className="rounded-xl border border-fuchsia-200/10 bg-black/20 p-4 text-sm leading-6 text-[#d4c5d6]">{question.misconception}</p><p className="mt-6 text-lg font-semibold text-white">{question.repairPrompt}</p><div className="mt-4 grid grid-cols-2 gap-3">{question.repairChoices.map((choice,i)=>{const resolved=selected!==null;const correct=i===question.repairAnswer;return <button key={choice} disabled={resolved} onClick={()=>onRepair(i)} className={`rounded-xl border px-4 py-4 text-sm font-bold transition ${resolved&&correct?"border-emerald-300 bg-emerald-300/15 text-emerald-100":selected===i?"border-red-300 bg-red-300/10 text-red-100":"border-fuchsia-200/20 bg-fuchsia-200/[.05] text-fuchsia-50 hover:bg-fuchsia-200/10"}`}>{choice}</button>})}</div><p className="mt-5 text-xs leading-5 text-fuchsia-100/55">Repairing a Glitch teaches the Vault what you meant. You can still save the expedition.</p></div></div></div>; }

function ShrineChamber({active,onChoose}:{active:RunModifier;onChoose:(value:Exclude<RunModifier,null>)=>void}) {
  const blessings = [
    { id:"echo" as const, glyph:"◉", name:"Echo Lens", text:"Once each chamber, reveal one false path." },
    { id:"fortune" as const, glyph:"✦", name:"Oath of Fortune", text:"Earn 50% more shards. A mistake costs two light." },
    { id:"lantern" as const, glyph:"♢", name:"Deep Lantern", text:"Add a fourth lantern light for this expedition." },
  ];
  return <div className="w-full max-w-3xl text-center"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-violet-300">A shrine between depths</p><h2 className="mt-3 font-display text-4xl font-black">Choose one blessing.</h2><p className="mx-auto mt-3 max-w-lg text-sm text-white/45">The previous blessing will be surrendered. Every power changes how the next chambers play.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{blessings.map(blessing=><button key={blessing.id} onClick={()=>onChoose(blessing.id)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:border-violet-200/50 ${active===blessing.id?"border-violet-300 bg-violet-300/15":"border-white/10 bg-white/[.04]"}`}><span className="font-display text-4xl text-violet-200">{blessing.glyph}</span><strong className="mt-5 block text-base text-white">{blessing.name}</strong><span className="mt-2 block text-xs leading-5 text-white/45">{blessing.text}</span></button>)}</div></div>;
}

function ChoiceChamber({depth,torch,shards,onDescend,onExtract}:{depth:number;torch:number;shards:number;onDescend:()=>void;onExtract:()=>void}) { return <div className="w-full max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">The chamber falls silent</p><h2 className="mt-4 font-display text-5xl font-black tracking-tight">How deep will you go?</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#aaa391]">You are carrying <strong className="text-[#efe0ad]">{shards} shards</strong> with <strong className={torch===1?"text-red-300":"text-[#efe0ad]"}>{torch} lantern light</strong> remaining. Extract now and everything is safe. Descend and the rewards grow stranger.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><button onClick={onExtract} className="rounded-2xl border border-[#e4d5a4]/30 bg-[#e4d5a4]/10 p-5 text-left transition hover:bg-[#e4d5a4]/15"><DoorOpen className="mb-4 text-[#e4d5a4]"/><strong className="block text-lg text-[#f2e7c6]">Return to the Vault</strong><span className="mt-1 block text-xs text-[#99917e]">Bank all treasure and artifacts.</span></button><button onClick={onDescend} className="group rounded-2xl border border-cyan-300/30 bg-cyan-300/[.08] p-5 text-left transition hover:bg-cyan-300/[.14]"><ChevronDown className="mb-4 text-cyan-300 transition group-hover:translate-y-1"/><strong className="block text-lg text-cyan-100">{depth>=8?"Open the sealed gate":"Descend to depth "+(depth+1)}</strong><span className="mt-1 block text-xs text-cyan-100/50">Better treasure. Greater risk.</span></button></div></div>; }

function RewardChamber({artifact,onContinue}:{artifact:VaultArtifact;onContinue:()=>void}) { return <div className="w-full max-w-xl text-center"><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d9c784]">The reliquary opens</p><motion.div initial={{scale:.7,rotate:-8}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:140,damping:12}} className={`mx-auto mt-8 flex h-48 w-48 items-center justify-center rounded-[2.5rem] border ${rarityColor(artifact.rarity)} shadow-[0_0_100px_rgba(165,243,252,.15)]`}><span className="font-display text-8xl">{artifact.glyph}</span></motion.div><span className={`mt-6 inline-block rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[.2em] ${rarityColor(artifact.rarity)}`}>{artifact.rarity} artifact</span><h2 className="mt-3 font-display text-4xl font-black">{artifact.name}</h2><p className="mx-auto mt-3 max-w-md text-sm italic leading-6 text-[#aaa18c]">“{artifact.lore}”</p><button onClick={onContinue} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e5d398] px-6 py-3 text-xs font-black uppercase tracking-[.16em] text-[#11201d]">Place in pack <ArrowRight size={15}/></button></div>; }

function EndChamber({lost,shards,artifacts=0,onHome,onAgain}:{lost?:boolean;shards:number;artifacts?:number;onHome:()=>void;onAgain:()=>void}) { return <div className="w-full max-w-xl text-center"><div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${lost?"border-red-300/30 bg-red-300/10 text-red-200":"border-cyan-300/30 bg-cyan-300/10 text-cyan-200"}`}>{lost?<Flame size={30}/>:<Sparkles size={30}/>}</div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.25em] text-[#9d937b]">{lost?"The lantern went dark":"Expedition complete"}</p><h2 className="mt-3 font-display text-5xl font-black">{lost?"The Vault keeps half.":"Treasure secured."}</h2><p className="mt-4 text-sm text-[#aaa18f]">{lost?`${shards} shards were recovered by the Curator.`:`${shards} shards and ${artifacts} artifact${artifacts===1?"":"s"} returned safely.`}</p><div className="mt-8 flex justify-center gap-3"><button onClick={onHome} className="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white/65">The Vault</button><button onClick={onAgain} className="flex items-center gap-2 rounded-xl bg-[#e5d398] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#10201d]"><RotateCcw size={14}/> Descend again</button></div></div>; }
