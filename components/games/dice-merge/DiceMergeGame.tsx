"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Hammer,
  HelpCircle,
  History,
  Pause,
  Play,
  RotateCw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  type Board,
  type CellPosition,
  type Piece,
  type Tier,
  canFitAnywhere,
  canPlace,
  cloneBoard,
  createEmptyBoard,
  generatePiece,
  pieceCells,
  placePiece,
  resolveMerges,
  rotatePiece,
} from "./engine";
import styles from "./DiceMergeGame.module.css";

const LEVEL_TARGETS = [900, 2200, 4200, 7000, 10500, 15000];
const TIER_NAMES = ["Spark", "Tide", "Grove", "Sun", "Nova", "Rift", "Prism"];
const DOTS: Record<Tier, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [],
};

interface Snapshot {
  board: Board;
  score: number;
  current: Piece;
  next: Piece;
  hold: Piece | null;
  holdUsed: boolean;
  hammerCharge: number;
}

function initialPieces(board: Board) {
  const current = generatePiece(board);
  return { current, next: generatePiece(board) };
}

function openingSession() {
  const board = createEmptyBoard();
  const current: Piece = { id: "opening-current", dice: [1, 2], orientation: "horizontal" };
  const next: Piece = { id: "opening-next", dice: [2, 2], orientation: "horizontal" };
  return { board, current, next };
}

function Die({ tier, compact = false }: { tier: Tier; compact?: boolean }) {
  return (
    <span
      className={`${styles.die} ${styles[`tier${tier}`]} ${compact ? styles.compactDie : ""}`}
      aria-label={`${TIER_NAMES[tier - 1]} die, tier ${tier}`}
    >
      {tier === 7 ? (
        <span className={styles.prism} aria-hidden="true" />
      ) : (
        <span className={styles.face} aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} className={styles.dotSlot}>
              {DOTS[tier].includes(index) && <span className={styles.dot} />}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function PieceView({ piece, compact = false }: { piece: Piece; compact?: boolean }) {
  return (
    <span className={`${styles.piece} ${styles[piece.orientation]}`}>
      {piece.dice.map((tier, index) => <Die key={`${piece.id}-${index}`} tier={tier} compact={compact} />)}
    </span>
  );
}

function getLevel(score: number) {
  const index = LEVEL_TARGETS.findIndex((target) => score < target);
  return index === -1 ? LEVEL_TARGETS.length + 1 : index + 1;
}

function getGoal(score: number) {
  const level = getLevel(score);
  const start = level <= 1 ? 0 : LEVEL_TARGETS[level - 2] ?? LEVEL_TARGETS.at(-1)!;
  const target = LEVEL_TARGETS[level - 1] ?? start + 6000;
  return { level, start, target, progress: Math.min(1, (score - start) / (target - start)) };
}

export default function DiceMergeGame() {
  const [initial] = useState(openingSession);
  const [board, setBoard] = useState<Board>(initial.board);
  const [current, setCurrent] = useState(initial.current);
  const [next, setNext] = useState(initial.next);
  const [hold, setHold] = useState<Piece | null>(null);
  const [holdUsed, setHoldUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [hammerCharge, setHammerCharge] = useState(0);
  const [rerolls, setRerolls] = useState(2);
  const [hovered, setHovered] = useState<CellPosition | null>(null);
  const [mode, setMode] = useState<"place" | "hammer">("place");
  const [status, setStatus] = useState<"playing" | "paused" | "over">("playing");
  const [feedback, setFeedback] = useState("Build groups of three matching dice.");
  const [combo, setCombo] = useState(0);
  const [burstCells, setBurstCells] = useState<Set<string>>(new Set());
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sound, setSound] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [levelToast, setLevelToast] = useState<number | null>(null);
  const previousLevel = useRef(1);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setBest(Number(window.localStorage.getItem("sinon-dice-merge-best") ?? 0));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const playTone = (frequency: number, duration = 0.08) => {
    if (!sound) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener("ended", () => context.close());
    } catch {
      // Audio is optional and may be blocked until the browser receives a gesture.
    }
  };

  const updateScore = (points: number) => {
    const newScore = score + points;
    setScore(newScore);
    if (newScore > best) {
      setBest(newScore);
      window.localStorage.setItem("sinon-dice-merge-best", String(newScore));
    }
    const newLevel = getLevel(newScore);
    if (newLevel > previousLevel.current) {
      previousLevel.current = newLevel;
      setRerolls((value) => value + 1);
      setLevelToast(newLevel);
      window.setTimeout(() => setLevelToast(null), 1700);
    }
  };

  const finishTurn = (nextBoard: Board, placedAt: CellPosition) => {
    const result = resolveMerges(nextBoard, placedAt);
    setBoard(result.board);
    setCombo(result.waves);
    setBurstCells(new Set([...result.cleared, ...result.created].map(({ row, col }) => `${row}:${col}`)));
    window.setTimeout(() => setBurstCells(new Set()), 520);

    const earnedCharge = result.score > 0 ? 18 + result.waves * 12 : 0;
    const projectedCharge = Math.min(100, hammerCharge + earnedCharge);
    if (result.score > 0) {
      updateScore(result.score);
      setHammerCharge(projectedCharge);
      setFeedback(result.waves > 1 ? `${result.waves}x cascade! The board is opening up.` : "Merge complete. Keep the chain alive!");
      playTone(480 + result.waves * 90, 0.12);
    } else {
      setCombo(0);
      setFeedback("Piece placed. Look for the next connection.");
      playTone(260);
    }

    const newCurrent = next;
    const newNext = generatePiece(result.board);
    setCurrent(newCurrent);
    setNext(newNext);
    setHoldUsed(false);
    setHovered(null);
    const holdCanRescue = hold ? canFitAnywhere(result.board, hold) : canFitAnywhere(result.board, newNext);
    if (!canFitAnywhere(result.board, newCurrent) && !holdCanRescue && projectedCharge < 100 && rerolls <= 0) {
      setStatus("over");
    }
  };

  const handleCell = (row: number, col: number) => {
    if (status !== "playing") return;
    if (mode === "hammer") {
      if (board[row][col] === null) return;
      const nextBoard = cloneBoard(board);
      nextBoard[row][col] = null;
      setBoard(nextBoard);
      setHammerCharge(0);
      setMode("place");
      setBurstCells(new Set([`${row}:${col}`]));
      window.setTimeout(() => setBurstCells(new Set()), 500);
      setFeedback("Space cleared. Make this turn count.");
      playTone(150, 0.16);
      return;
    }

    const anchor = { row, col };
    if (!canPlace(board, current, anchor)) {
      setFeedback("That piece needs a little more room.");
      playTone(120);
      return;
    }
    setSnapshot({ board: cloneBoard(board), score, current, next, hold, holdUsed, hammerCharge });
    finishTurn(placePiece(board, current, anchor), anchor);
  };

  const handleHold = () => {
    if (holdUsed || status !== "playing") return;
    if (hold === null) {
      setHold(current);
      setCurrent(next);
      setNext(generatePiece(board));
    } else {
      setCurrent({ ...hold, orientation: "horizontal" });
      setHold({ ...current, orientation: "horizontal" });
    }
    setHoldUsed(true);
    setFeedback("Piece held. You can swap again next turn.");
    playTone(340);
  };

  const handleReroll = () => {
    if (rerolls <= 0 || status !== "playing") return;
    setCurrent(generatePiece(board));
    setRerolls((value) => value - 1);
    setFeedback("Fresh piece drawn.");
    playTone(390);
  };

  const handleUndo = () => {
    if (!snapshot || status !== "playing") return;
    setBoard(snapshot.board);
    setScore(snapshot.score);
    setCurrent(snapshot.current);
    setNext(snapshot.next);
    setHold(snapshot.hold);
    setHoldUsed(snapshot.holdUsed);
    setHammerCharge(snapshot.hammerCharge);
    setSnapshot(null);
    setFeedback("Last move restored.");
  };

  const restart = () => {
    const empty = createEmptyBoard();
    const pieces = initialPieces(empty);
    setBoard(empty);
    setCurrent(pieces.current);
    setNext(pieces.next);
    setHold(null);
    setHoldUsed(false);
    setScore(0);
    setHammerCharge(0);
    setRerolls(2);
    setStatus("playing");
    setMode("place");
    setCombo(0);
    setSnapshot(null);
    setFeedback("New run. Build groups of three matching dice.");
    previousLevel.current = 1;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") setCurrent((piece) => rotatePiece(piece));
      if (event.key.toLowerCase() === "h") handleHold();
      if (event.key === "Escape") setStatus((value) => value === "paused" ? "playing" : "paused");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const preview = new Set(
    hovered && mode === "place" && canPlace(board, current, hovered)
      ? pieceCells(current, hovered).map(({ row, col }) => `${row}:${col}`)
      : [],
  );
  const goal = getGoal(score);

  return (
    <main className={styles.shell}>
      <div className={styles.auroraOne} />
      <div className={styles.auroraTwo} />
      <header className={styles.topbar}>
        <Link href="/simulations" className={styles.backLink}><ArrowLeft size={17} /> Games</Link>
        <div className={styles.brand}><span className={styles.brandDie}>6</span><span>DICE//MERGE</span></div>
        <div className={styles.headerActions}>
          <button onClick={() => setSound((value) => !value)} aria-label={sound ? "Mute sound" : "Turn on sound"}>{sound ? <Volume2 /> : <VolumeX />}</button>
          <button onClick={() => setShowHelp(true)} aria-label="How to play"><HelpCircle /></button>
          <button onClick={() => setStatus("paused")} aria-label="Pause game"><Pause /></button>
        </div>
      </header>

      <section className={styles.gameLayout}>
        <aside className={styles.leftRail}>
          <div className={styles.scoreCard}>
            <span className={styles.eyebrow}>Current run</span>
            <strong>{score.toLocaleString()}</strong>
            <div><Trophy size={14} /> Best {best.toLocaleString()}</div>
          </div>
          <div className={styles.missionCard}>
            <div className={styles.missionTitle}><span>Level {goal.level}</span><span>{goal.target.toLocaleString()}</span></div>
            <div className={styles.progressTrack}><span style={{ width: `${goal.progress * 100}%` }} /></div>
            <p>Reach the target to earn a free reroll.</p>
          </div>
          <button className={`${styles.toolCard} ${mode === "hammer" ? styles.activeTool : ""}`} disabled={hammerCharge < 100} onClick={() => setMode((value) => value === "hammer" ? "place" : "hammer")}>
            <span className={styles.toolIcon}><Hammer size={22} /></span>
            <span><strong>Breaker</strong><small>{hammerCharge >= 100 ? "Choose one die" : `${hammerCharge}% charged`}</small></span>
            <span className={styles.radialCharge} style={{ "--charge": `${hammerCharge * 3.6}deg` } as React.CSSProperties} />
          </button>
          <button className={styles.toolCard} disabled={rerolls <= 0} onClick={handleReroll}>
            <span className={styles.toolIcon}><Shuffle size={22} /></span>
            <span><strong>Reroll</strong><small>Draw a new piece</small></span>
            <b>{rerolls}</b>
          </button>
        </aside>

        <section className={styles.centerStage}>
          <div className={styles.stageHeading}>
            <span>{mode === "hammer" ? "Breaker ready: choose a filled cell" : feedback}</span>
            {combo > 1 && <b><Sparkles size={14} /> {combo}x cascade</b>}
          </div>
          <div className={styles.boardWrap}>
            <div className={styles.board} role="grid" aria-label="Dice Merge board" onPointerLeave={() => setHovered(null)}>
              {board.map((row, rowIndex) => row.map((tier, colIndex) => {
                const key = `${rowIndex}:${colIndex}`;
                const validPreview = preview.has(key);
                return (
                  <button
                    key={key}
                    className={`${styles.cell} ${validPreview ? styles.preview : ""} ${burstCells.has(key) ? styles.burst : ""} ${mode === "hammer" && tier ? styles.breakable : ""}`}
                    onPointerEnter={() => setHovered({ row: rowIndex, col: colIndex })}
                    onFocus={() => setHovered({ row: rowIndex, col: colIndex })}
                    onClick={() => handleCell(rowIndex, colIndex)}
                    aria-label={tier ? `Row ${rowIndex + 1}, column ${colIndex + 1}, ${TIER_NAMES[tier - 1]} die` : `Empty row ${rowIndex + 1}, column ${colIndex + 1}`}
                    role="gridcell"
                  >
                    {tier && <Die tier={tier} />}
                  </button>
                );
              }))}
            </div>
            <span className={styles.boardGlow} />
          </div>
          <div className={styles.mobileScore}><strong>{score.toLocaleString()}</strong><span>Best {best.toLocaleString()}</span></div>
        </section>

        <aside className={styles.pieceRail}>
          <div className={styles.queueLabel}>Now playing</div>
          <button className={styles.currentPiece} onClick={() => setCurrent((piece) => rotatePiece(piece))} aria-label="Rotate current piece">
            <PieceView piece={current} />
            <span><RotateCw size={15} /> Tap to rotate</span>
          </button>
          <div className={styles.queueRow}>
            <button className={styles.holdSlot} onClick={handleHold} disabled={holdUsed}>
              <span>Hold</span>
              {hold ? <PieceView piece={hold} compact /> : <ShieldCheck size={24} />}
              <small>{holdUsed ? "Used" : "Free swap"}</small>
            </button>
            <div className={styles.nextSlot}>
              <span>Next</span>
              <PieceView piece={next} compact />
              <small>Up next</small>
            </div>
          </div>
          <button className={styles.undoButton} disabled={!snapshot} onClick={handleUndo}><History size={16} /> Undo last move</button>
          <p className={styles.tip}>Tap an empty cell to place. Connect 3 or more matching dice. Cascades multiply your score.</p>
        </aside>
      </section>

      <footer className={styles.legend}>
        {TIER_NAMES.map((name, index) => <span key={name}><i className={styles[`legend${index + 1}`]} />{name}</span>)}
      </footer>

      {levelToast && <div className={styles.levelToast}><Sparkles /> Level {levelToast}<small>+1 reroll earned</small></div>}

      {(status === "paused" || status === "over" || showHelp) && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            {showHelp ? (
              <>
                <span className={styles.modalIcon}><HelpCircle /></span>
                <p className={styles.modalKicker}>Quick rules</p>
                <h2>Build chains. Create prisms.</h2>
                <ol>
                  <li>Place the current one- or two-die piece on empty cells.</li>
                  <li>Connect 3 matching dice to merge them into the next tier.</li>
                  <li>Chain merges for score multipliers. Three Prisms blast nearby cells.</li>
                  <li>Use Hold, Reroll, Undo, and the charged Breaker to escape tight spots.</li>
                </ol>
                <button className={styles.primaryButton} onClick={() => setShowHelp(false)}>Let&apos;s play</button>
              </>
            ) : status === "paused" ? (
              <>
                <span className={styles.modalIcon}><Pause /></span>
                <p className={styles.modalKicker}>Run paused</p>
                <h2>Your board is waiting.</h2>
                <button className={styles.primaryButton} onClick={() => setStatus("playing")}><Play size={18} /> Resume</button>
                <button className={styles.secondaryButton} onClick={restart}>Restart run</button>
              </>
            ) : (
              <>
                <span className={styles.modalIcon}><Trophy /></span>
                <p className={styles.modalKicker}>Board locked</p>
                <h2>{score.toLocaleString()} points</h2>
                <p className={styles.finalCopy}>You reached level {goal.level}. Your best is {best.toLocaleString()}.</p>
                <button className={styles.primaryButton} onClick={restart}><Play size={18} /> Play again</button>
                <Link className={styles.secondaryLink} href="/simulations">Back to games</Link>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
