"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  Check,
  Lock,
  Hammer,
  HelpCircle,
  History,
  Pause,
  Play,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Trophy,
  User,
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
const DEFAULT_PROFILE = "Guest";
const DICE_PROFILE_KEY = "sinon-dice-merge-profile";
const DICE_SAVE_KEY = "sinon-dice-merge-save-v2";
const THEME_PACKS = [
  { id: "classic", name: "Classic", price: 0, className: "themeClassic" },
  { id: "candy", name: "Candy Pop", price: 120, className: "themeCandy" },
  { id: "nebula", name: "Nebula", price: 260, className: "themeNebula" },
] as const;
const DOTS: Record<Tier, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [],
};
type ThemeId = (typeof THEME_PACKS)[number]["id"];
interface DiceSave {
  profile: string;
  best: number;
  coins: number;
  theme: ThemeId;
  unlocked: ThemeId[];
}

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
  const current: Piece = { id: "opening-current", dice: [1, 2], orientation: "right" };
  const next: Piece = { id: "opening-next", dice: [2, 2], orientation: "right" };
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

function createDefaultSave(profile = DEFAULT_PROFILE): DiceSave {
  return { profile, best: 0, coins: 0, theme: "classic", unlocked: ["classic"] };
}

function normalizeSave(value: Partial<DiceSave> | null, profile = DEFAULT_PROFILE): DiceSave {
  const unlocked = value?.unlocked?.filter((theme): theme is ThemeId => THEME_PACKS.some((pack) => pack.id === theme)) ?? ["classic"];
  const theme = value?.theme && unlocked.includes(value.theme) ? value.theme : "classic";
  return {
    profile: value?.profile?.trim() || profile,
    best: Number(value?.best ?? 0),
    coins: Number(value?.coins ?? 0),
    theme,
    unlocked: unlocked.includes("classic") ? unlocked : ["classic", ...unlocked],
  };
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
  const [showStore, setShowStore] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [profileInput, setProfileInput] = useState("");
  const [save, setSave] = useState<DiceSave>(() => createDefaultSave());
  const [levelToast, setLevelToast] = useState<number | null>(null);
  const previousLevel = useRef(1);
  const dragState = useRef({ pressed: false, moved: false, startX: 0, startY: 0, pointerType: "mouse" });
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0, pointerType: "mouse" });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const profile = window.localStorage.getItem(DICE_PROFILE_KEY) || DEFAULT_PROFILE;
      const stored = window.localStorage.getItem(`${DICE_SAVE_KEY}:${profile}`);
      const parsed = stored ? JSON.parse(stored) as Partial<DiceSave> : null;
      const nextSave = normalizeSave(parsed, profile);
      setSave(nextSave);
      setBest(nextSave.best);
      setProfileInput(nextSave.profile === DEFAULT_PROFILE ? "" : nextSave.profile);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DICE_PROFILE_KEY, save.profile);
    window.localStorage.setItem(`${DICE_SAVE_KEY}:${save.profile}`, JSON.stringify(save));
  }, [save]);

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
    if (points > 0) {
      setSave((value) => ({ ...value, coins: value.coins + Math.max(1, Math.floor(points / 10)) }));
    }
    if (newScore > best) {
      setBest(newScore);
      setSave((value) => ({ ...value, best: newScore }));
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
      setCurrent({ ...hold, orientation: "right" });
      setHold({ ...current, orientation: "right" });
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

  const handleLogin = () => {
    const profile = profileInput.trim() || DEFAULT_PROFILE;
    const stored = window.localStorage.getItem(`${DICE_SAVE_KEY}:${profile}`);
    const nextSave = normalizeSave(stored ? JSON.parse(stored) as Partial<DiceSave> : null, profile);
    setSave(nextSave);
    setBest(nextSave.best);
    setProfileInput(profile === DEFAULT_PROFILE ? "" : profile);
    setShowLogin(false);
    setFeedback(`Playing as ${nextSave.profile}.`);
  };

  const handleTheme = (theme: ThemeId) => {
    const pack = THEME_PACKS.find((item) => item.id === theme)!;
    if (save.unlocked.includes(theme)) {
      setSave((value) => ({ ...value, theme }));
      return;
    }
    if (save.coins < pack.price) {
      setFeedback(`${pack.name} needs ${pack.price} coins.`);
      return;
    }
    setSave((value) => ({
      ...value,
      coins: value.coins - pack.price,
      theme,
      unlocked: [...value.unlocked, theme],
    }));
  };

  const targetAtPoint = (x: number, y: number, pointerType: string): CellPosition | null => {
    const visibilityOffset = pointerType === "touch" ? -72 : 0;
    const element = document.elementFromPoint(x, y + visibilityOffset)?.closest<HTMLElement>("[data-board-cell]");
    if (!element) return null;
    return { row: Number(element.dataset.row), col: Number(element.dataset.col) };
  };

  const handlePiecePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (status !== "playing" || mode !== "place") return;
    dragState.current = {
      pressed: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      pointerType: event.pointerType,
    };
    setDragPosition({ x: event.clientX, y: event.clientY, pointerType: event.pointerType });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePiecePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.pressed) return;
    const distance = Math.hypot(event.clientX - dragState.current.startX, event.clientY - dragState.current.startY);
    if (distance > 6) {
      dragState.current.moved = true;
      setDragging(true);
      setDragPosition({ x: event.clientX, y: event.clientY, pointerType: event.pointerType });
      setHovered(targetAtPoint(event.clientX, event.clientY, event.pointerType));
    }
  };

  const handlePiecePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.pressed) return;
    const wasDragging = dragState.current.moved;
    dragState.current.pressed = false;
    dragState.current.moved = false;
    setDragging(false);
    if (wasDragging) {
      const target = targetAtPoint(event.clientX, event.clientY, event.pointerType);
      if (target && canPlace(board, current, target)) handleCell(target.row, target.col);
      else setFeedback("Drop the piece on open board cells.");
      setHovered(null);
    } else {
      setCurrent((piece) => rotatePiece(piece));
      playTone(310);
    }
  };

  const handlePiecePointerCancel = () => {
    dragState.current.pressed = false;
    dragState.current.moved = false;
    setDragging(false);
    setHovered(null);
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
  const activeTheme = THEME_PACKS.find((theme) => theme.id === save.theme) ?? THEME_PACKS[0];

  return (
    <main className={`${styles.shell} ${styles[activeTheme.className]}`}>
      <div className={styles.ambient} />
      <div className={styles.app}>
        <header className={styles.header}>
          <Link href="/simulations" className={styles.backLink}><ArrowLeft size={16} /> Games</Link>
          <div>
            <h1>DICE <span>MERGE</span></h1>
            <p>BEST: <strong>{best.toLocaleString()}</strong>{combo > 1 && <b>STREAK x{combo}</b>}</p>
          </div>
          <div className={styles.score}><span>Score</span><strong>{score.toLocaleString()}</strong></div>
          <div className={styles.headerButtons}>
            <button onClick={() => setShowLogin(true)} aria-label="Dice Merge profile"><User /></button>
            <button onClick={() => setShowStore(true)} aria-label="Open theme store"><ShoppingBag /></button>
            <button onClick={() => setSound((value) => !value)} aria-label={sound ? "Mute sound" : "Turn on sound"}>{sound ? <Volume2 /> : <VolumeX />}</button>
            <button onClick={() => setShowHelp(true)} aria-label="How to play"><HelpCircle /></button>
            <button onClick={() => setStatus("paused")} aria-label="Pause game"><Pause /></button>
          </div>
        </header>

        <div className={styles.profileLine}>
          <button onClick={() => setShowLogin(true)}><User size={12} /> {save.profile}</button>
          <button onClick={() => setShowStore(true)}><ShoppingBag size={12} /> {save.coins.toLocaleString()} coins</button>
          <span>{activeTheme.name}</span>
        </div>

        <div className={styles.levelLine}>
          <span>LEVEL {goal.level}</span>
          <div><i style={{ width: `${goal.progress * 100}%` }} /></div>
          <span>{goal.target.toLocaleString()}</span>
        </div>

        <section className={styles.boardWrap}>
          <div className={styles.board} role="grid" aria-label="Dice Merge board" onPointerLeave={() => !dragging && setHovered(null)}>
            {board.map((row, rowIndex) => row.map((tier, colIndex) => {
              const key = `${rowIndex}:${colIndex}`;
              return (
                <button
                  key={key}
                  data-board-cell
                  data-row={rowIndex}
                  data-col={colIndex}
                  className={`${styles.cell} ${preview.has(key) ? styles.preview : ""} ${burstCells.has(key) ? styles.burst : ""} ${mode === "hammer" && tier ? styles.breakable : ""}`}
                  onPointerEnter={() => !dragging && setHovered({ row: rowIndex, col: colIndex })}
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
        </section>

        <p className={styles.instruction}>{mode === "hammer" ? "Tap one die to smash it" : dragging ? "Drop on highlighted cells" : "Tap to rotate - drag to place"}</p>

        <section className={styles.controls}>
          <button className={`${styles.sideSlot} ${!holdUsed ? styles.slotReady : ""}`} onClick={handleHold} disabled={holdUsed}>
            <span>Hold</span>
            <div>{hold ? <PieceView piece={hold} compact /> : <small>FREE</small>}</div>
          </button>
          <button
            className={`${styles.spawner} ${dragging ? styles.spawnerDragging : ""}`}
            onPointerDown={handlePiecePointerDown}
            onPointerMove={handlePiecePointerMove}
            onPointerUp={handlePiecePointerUp}
            onPointerCancel={handlePiecePointerCancel}
            aria-label="Current piece. Tap to rotate or drag to place."
          >
            <PieceView piece={current} />
          </button>
          <div className={styles.sideSlot}>
            <span>Next</span>
            <div><PieceView piece={next} compact /></div>
          </div>
        </section>

        <div className={styles.utilityRow}>
          <button onClick={handleUndo} disabled={!snapshot}><History /> Undo</button>
          <span>{feedback}</span>
          <button onClick={handleReroll} disabled={rerolls <= 0}><Shuffle /> Reroll {rerolls}</button>
        </div>
      </div>

      <button
        className={`${styles.hammerButton} ${hammerCharge >= 100 ? styles.hammerReady : ""} ${mode === "hammer" ? styles.hammerActive : ""}`}
        disabled={hammerCharge < 100}
        onClick={() => setMode((value) => value === "hammer" ? "place" : "hammer")}
        aria-label={`Breaker tool ${hammerCharge}% charged`}
      >
        <span style={{ height: `${hammerCharge}%` }} />
        <Hammer />
      </button>

      {dragging && (
        <div
          className={styles.dragGhost}
          style={{ left: dragPosition.x, top: dragPosition.y + (dragPosition.pointerType === "touch" ? -72 : 0) }}
        >
          <PieceView piece={current} />
        </div>
      )}

      {levelToast && <div className={styles.levelToast}><Sparkles /> Level {levelToast}<small>+1 reroll earned</small></div>}

      {(status === "paused" || status === "over" || showHelp || showLogin || showStore) && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            {showLogin ? (
              <>
                <span className={styles.modalIcon}><User /></span>
                <p className={styles.modalKicker}>Dice ID</p>
                <h2>Save your run.</h2>
                <input
                  className={styles.nameInput}
                  value={profileInput}
                  onChange={(event) => setProfileInput(event.target.value)}
                  placeholder="Player name"
                  maxLength={18}
                />
                <button className={styles.primaryButton} onClick={handleLogin}><Check size={18} /> Continue</button>
                <button className={styles.secondaryButton} onClick={() => setShowLogin(false)}>Close</button>
              </>
            ) : showStore ? (
              <>
                <span className={styles.modalIcon}><ShoppingBag /></span>
                <p className={styles.modalKicker}>{save.coins.toLocaleString()} coins</p>
                <h2>Theme packs</h2>
                <div className={styles.themeGrid}>
                  {THEME_PACKS.map((pack) => {
                    const unlocked = save.unlocked.includes(pack.id);
                    const active = save.theme === pack.id;
                    return (
                      <button key={pack.id} className={`${styles.themeCard} ${styles[pack.className]} ${active ? styles.themeActive : ""}`} onClick={() => handleTheme(pack.id)}>
                        <span>{active ? <Check /> : unlocked ? <Sparkles /> : <Lock />}</span>
                        <strong>{pack.name}</strong>
                        <small>{unlocked ? "Equip" : `${pack.price} coins`}</small>
                      </button>
                    );
                  })}
                </div>
                <button className={styles.secondaryButton} onClick={() => setShowStore(false)}>Close</button>
              </>
            ) : showHelp ? (
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
