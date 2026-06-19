"use client";

import { useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { applyAllocationAndAdvance, applyEventChoice, freshState, pickRandomEvent, purchaseProperty } from "@/lib/stackedEngine";
import type { Allocation, PropertyType, Personality, StackedState } from "@/lib/stackedTypes";
import StackedPersonalitySelect from "./StackedPersonalitySelect";
import StackedLifeUpdate from "./StackedLifeUpdate";
import StackedEventCard from "./StackedEventCard";
import StackedAllocationPanel from "./StackedAllocationPanel";
import StackedPropertyModal from "./StackedPropertyModal";
import StackedEndgameReport from "./StackedEndgameReport";

export default function StackedSim() {
  const [state, setState] = useLocalStorageState<StackedState>("sim:stacked", freshState("balanced"));
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const startGame = (personality: Personality) => {
    const fresh = freshState(personality);
    const playing: StackedState = { ...fresh, phase: "playing" };
    setState({ ...playing, pendingEvent: pickRandomEvent(playing) });
  };

  const handleChoose = (choiceId: string) => {
    setState(applyEventChoice(state, choiceId));
  };

  const handleContinueAfterEvent = () => {
    setState({ ...state, pendingNarrative: null });
  };

  const handleAllocationChange = (allocation: Allocation) => {
    setState({ ...state, allocation });
  };

  const handleAdvance = () => {
    let next = applyAllocationAndAdvance(state, state.allocation);
    if (next.phase === "playing") {
      next = { ...next, pendingEvent: pickRandomEvent(next) };
    }
    setState(next);
  };

  const handleBuyProperty = (type: PropertyType) => {
    setState(purchaseProperty(state, type));
    setPropertyModalOpen(false);
  };

  const handlePlayAgain = () => {
    setState(freshState("balanced"));
  };

  if (state.phase === "intro") {
    return <StackedPersonalitySelect onSelect={startGame} />;
  }

  if (state.phase === "finished") {
    return <StackedEndgameReport state={state} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <div className="space-y-6">
      <StackedLifeUpdate state={state} />

      {state.pendingEvent || state.pendingNarrative ? (
        <StackedEventCard
          event={state.pendingEvent}
          narrative={state.pendingNarrative}
          onChoose={handleChoose}
          onContinue={handleContinueAfterEvent}
        />
      ) : (
        <StackedAllocationPanel
          state={state}
          onAllocationChange={handleAllocationChange}
          onAdvance={handleAdvance}
          onOpenPropertyModal={() => setPropertyModalOpen(true)}
        />
      )}

      {propertyModalOpen && (
        <StackedPropertyModal
          state={state}
          onBuy={handleBuyProperty}
          onClose={() => setPropertyModalOpen(false)}
        />
      )}
    </div>
  );
}
