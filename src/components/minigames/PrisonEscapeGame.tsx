import React, { useState, useEffect } from 'react';
import {
  playClickSound,
  playFailSound,
  playSirenSound,
  playSuccessSound,
  playCashSound,
} from '../../utils/audio';
import { Character } from '../../types/bitlife';
import { isGodModeUnlocked } from '../../utils/godModeAuth';

interface PrisonEscapeGameProps {
  onSuccess: () => void;
  onFailure: (extraYears: number) => void;
  onClose: () => void;
  character?: Character;
  onUpdateCharacter?: (updater: (prev: Character) => Character) => void;
}

interface Position {
  x: number;
  y: number;
}

interface HistoryStep {
  player: Position;
  guard: Position;
  guardDistracted?: boolean;
}

interface PrisonLayout {
  id: string;
  name: string;
  badge: string;
  gridSize: number;
  playerStart: Position;
  guardStart: Position;
  exit: Position;
  walls: Position[];
  description: string;
}

const PRISON_LAYOUTS: PrisonLayout[] = [
  {
    id: 'min-sec',
    name: 'County Jail (Minimum Security)',
    badge: 'Easy (5x5)',
    gridSize: 5,
    playerStart: { x: 0, y: 4 },
    guardStart: { x: 4, y: 4 },
    exit: { x: 4, y: 0 },
    walls: [
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    description: 'A low-security exercise yard with a concrete divider wall. Lure the guard into the barrier!',
  },
  {
    id: 'med-sec',
    name: 'State Penitentiary (Medium Security)',
    badge: 'Standard (6x6)',
    gridSize: 6,
    playerStart: { x: 0, y: 5 },
    guardStart: { x: 5, y: 5 },
    exit: { x: 5, y: 0 },
    walls: [
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    description: 'Heavy metal corridors. Bait the guard into the center wall so he gets stuck moving sideways!',
  },
  {
    id: 'max-sec',
    name: 'Alcatraz Cellblock (Maximum Security)',
    badge: 'Tactical (6x6)',
    gridSize: 6,
    playerStart: { x: 0, y: 5 },
    guardStart: { x: 3, y: 3 },
    exit: { x: 0, y: 0 },
    walls: [
      { x: 1, y: 5 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    description: 'Tight security corridors. Slip straight up the perimeter while the guard is cordoned off!',
  },
];

type EscapeTab = 'MAZE' | 'TUNNEL' | 'BRIBE' | 'RIOT';

export const PrisonEscapeGame: React.FC<PrisonEscapeGameProps> = ({
  onSuccess,
  onFailure,
  onClose,
  character,
  onUpdateCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<EscapeTab>('MAZE');
  const [layoutIndex, setLayoutIndex] = useState(0);

  const activeLayout = PRISON_LAYOUTS[layoutIndex];
  const { gridSize, exit, walls } = activeLayout;

  const [player, setPlayer] = useState<Position>(activeLayout.playerStart);
  const [guard, setGuard] = useState<Position>(activeLayout.guardStart);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [status, setStatus] = useState<'PLAYING' | 'ESCAPED' | 'BUSTED'>('PLAYING');
  const [message, setMessage] = useState(
    'Outsmart the guard! The guard moves 2 steps towards you for each step you take, but gets stuck against walls!'
  );
  const [showHint, setShowHint] = useState(false);
  const [hintDirection, setHintDirection] = useState<string | null>(null);

  // Switch layout & reset
  const handleSelectLayout = (idx: number) => {
    playClickSound();
    setLayoutIndex(idx);
    const selected = PRISON_LAYOUTS[idx];
    setPlayer(selected.playerStart);
    setGuard(selected.guardStart);
    setHistory([]);
    setStatus('PLAYING');
    setShowHint(false);
    setHintDirection(null);
    setMessage(`Switched to ${selected.name}. Trapping the guard behind walls is the key to freedom!`);
  };

  const isWall = (x: number, y: number) => {
    return walls.some((w) => w.x === x && w.y === y);
  };

  /**
   * Classic BitLife Guard Movement:
   * Guard moves 2 steps towards the player per turn.
   * Guard strictly prioritizes horizontal movement (dx) first.
   * If blocked by a wall or boundary, tries vertical movement (dy).
   * If still blocked, guard stays in place (gets stuck!).
   */
  const moveGuardOneStep = (currentGuard: Position, targetPlayer: Position): Position => {
    const dx = targetPlayer.x - currentGuard.x;
    const dy = targetPlayer.y - currentGuard.y;

    // 1. Try horizontal
    if (dx !== 0) {
      const stepX = currentGuard.x + (dx > 0 ? 1 : -1);
      if (!isWall(stepX, currentGuard.y) && stepX >= 0 && stepX < gridSize) {
        return { x: stepX, y: currentGuard.y };
      }
    }

    // 2. Try vertical if horizontal blocked
    if (dy !== 0) {
      const stepY = currentGuard.y + (dy > 0 ? 1 : -1);
      if (!isWall(currentGuard.x, stepY) && stepY >= 0 && stepY < gridSize) {
        return { x: currentGuard.x, y: stepY };
      }
    }

    // Stuck!
    return currentGuard;
  };

  /**
   * Breadth-First-Search solver to compute the exact winning next move from current state
   */
  const solveNextMove = (
    startPlayer: Position,
    startGuard: Position
  ): { move: string; dx: number; dy: number } | null => {
    const moves = [
      { dx: 0, dy: -1, move: 'Up ⬆️' },
      { dx: 1, dy: 0, move: 'Right ➡️' },
      { dx: 0, dy: 1, move: 'Down ⬇️' },
      { dx: -1, dy: 0, move: 'Left ⬅️' },
    ];

    const queue: Array<{ p: Position; g: Position; firstMove: { move: string; dx: number; dy: number } }> = [];
    const visited = new Set<string>();

    for (const m of moves) {
      const nx = startPlayer.x + m.dx;
      const ny = startPlayer.y + m.dy;
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize || isWall(nx, ny)) continue;
      const np = { x: nx, y: ny };
      if (np.x === exit.x && np.y === exit.y) {
        return m;
      }
      let ng = moveGuardOneStep(startGuard, np);
      if (ng.x === np.x && ng.y === np.y) continue;
      ng = moveGuardOneStep(ng, np);
      if (ng.x === np.x && ng.y === np.y) continue;

      queue.push({ p: np, g: ng, firstMove: m });
      visited.add(`${np.x},${np.y},${ng.x},${ng.y}`);
    }

    while (queue.length > 0) {
      const item = queue.shift()!;
      for (const m of moves) {
        const nx = item.p.x + m.dx;
        const ny = item.p.y + m.dy;
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize || isWall(nx, ny)) continue;
        const np = { x: nx, y: ny };
        if (np.x === exit.x && np.y === exit.y) {
          return item.firstMove;
        }
        let ng = moveGuardOneStep(item.g, np);
        if (ng.x === np.x && ng.y === np.y) continue;
        ng = moveGuardOneStep(ng, np);
        if (ng.x === np.x && ng.y === np.y) continue;

        const key = `${np.x},${np.y},${ng.x},${ng.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ p: np, g: ng, firstMove: item.firstMove });
        }
      }
    }

    return null;
  };

  // Calculate hint whenever player moves or hint is toggled
  useEffect(() => {
    if (status === 'PLAYING') {
      const next = solveNextMove(player, guard);
      if (next) {
        setHintDirection(next.move);
      } else {
        setHintDirection('Careful! Guard has boxed this route. Tap "Undo Move" to step back!');
      }
    }
  }, [player, guard, status, layoutIndex]);

  const movePlayer = (dx: number, dy: number) => {
    if (status !== 'PLAYING') return;
    playClickSound();

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize || isWall(nx, ny)) {
      return; // Wall or border
    }

    // Save previous state to history for Undo functionality!
    setHistory((prev) => [...prev, { player, guard }]);

    const newPlayerPos = { x: nx, y: ny };

    // Check if reached exit
    if (newPlayerPos.x === exit.x && newPlayerPos.y === exit.y) {
      setPlayer(newPlayerPos);
      setStatus('ESCAPED');
      setMessage('🎉 YOU ESCAPED! You slipped through the perimeter fence and disappeared into the night!');
      playSuccessSound();
      return;
    }

    // Guard step 1
    let nextGuard = moveGuardOneStep(guard, newPlayerPos);
    if (nextGuard.x === newPlayerPos.x && nextGuard.y === newPlayerPos.y) {
      setPlayer(newPlayerPos);
      setGuard(nextGuard);
      setStatus('BUSTED');
      setMessage('🚨 Caught! The guard tackled you! Use "Undo Move" to take back your step, or face the judge.');
      playSirenSound();
      playFailSound();
      return;
    }

    // Guard step 2
    nextGuard = moveGuardOneStep(nextGuard, newPlayerPos);
    if (nextGuard.x === newPlayerPos.x && nextGuard.y === newPlayerPos.y) {
      setPlayer(newPlayerPos);
      setGuard(nextGuard);
      setStatus('BUSTED');
      setMessage('🚨 Caught! The guard cornered you! Use "Undo Move" to take back your step, or face the judge.');
      playSirenSound();
      playFailSound();
      return;
    }

    setPlayer(newPlayerPos);
    setGuard(nextGuard);
  };

  // Undo move
  const handleUndo = () => {
    if (history.length === 0) return;
    playClickSound();
    const last = history[history.length - 1];
    setPlayer(last.player);
    setGuard(last.guard);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setStatus('PLAYING');
    setMessage('Stepped backwards! Guard position rewound.');
  };

  // Reset current layout
  const handleReset = () => {
    playClickSound();
    setPlayer(activeLayout.playerStart);
    setGuard(activeLayout.guardStart);
    setHistory([]);
    setStatus('PLAYING');
    setMessage('Puzzle reset to start. Remember: the guard gets trapped behind horizontal walls!');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'MAZE') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        movePlayer(1, 0);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, guard, status, activeTab]);

  // Alternative escape: Tunnel Digging
  const [tunnelProgress, setTunnelProgress] = useState(0);
  const [tunnelTool, setTunnelTool] = useState<'SPOON' | 'SHANK' | 'PICKAXE'>('SPOON');
  const [tunnelLog, setTunnelLog] = useState<string[]>(['You pulled back the poster covering your cell tunnel.']);

  const handleDigStep = (method: 'CAREFUL' | 'RUSH') => {
    playClickSound();
    const speed = method === 'RUSH' ? 35 : 20;
    const collapseChance = method === 'RUSH' ? 0.25 : 0.05;

    if (Math.random() < collapseChance) {
      playSirenSound();
      playFailSound();
      setTunnelLog((prev) => [...prev, '🚨 A cave-in alerted the night patrol guards! You got caught!']);
      setStatus('BUSTED');
      return;
    }

    const newProg = Math.min(100, tunnelProgress + speed);
    setTunnelProgress(newProg);
    playSuccessSound();

    if (newProg >= 100) {
      setTunnelLog((prev) => [...prev, '🎉 BREAKTHROUGH! You crawled out into the forest beyond the searchlights!']);
      setStatus('ESCAPED');
    } else {
      setTunnelLog((prev) => [
        ...prev,
        `Dug ${speed}% through the foundation! Tunnel is ${newProg}% complete.`,
      ]);
    }
  };

  // Alternative escape: Bribe Guard
  const handleBribe = (amount: number) => {
    playClickSound();
    if (character && character.money < amount) {
      setMessage(`You do not have $${amount.toLocaleString()} in your inmate account!`);
      playFailSound();
      return;
    }

    if (onUpdateCharacter) {
      onUpdateCharacter((prev) => ({
        ...prev,
        money: Math.max(0, prev.money - amount),
      }));
    }
    playCashSound();
    playSuccessSound();
    setStatus('ESCAPED');
    setMessage(`The crooked guard pocketed $${amount.toLocaleString()} and unlocked the laundry gate for you!`);
  };

  // God Mode release
  const hasGodMode = isGodModeUnlocked();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-red-500/50 shadow-2xl shadow-red-950/60 p-5 text-white flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-red-400 uppercase tracking-wide">
                  Prison Breakout Operation
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                  100% Solvable
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Outsmart the guards, tunnel through bedrock, or bribe your way out!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="shrink-0 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-3">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('MAZE');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MAZE'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏃‍♂️ Yard Maze
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('TUNNEL');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TUNNEL'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🕳️ Secret Tunnel
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('BRIBE');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BRIBE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💰 Guard Bribe
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: YARD MAZE PUZZLE */}
        {/* ============================================================== */}
        {activeTab === 'MAZE' && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center">
            {/* Facility Layout Selector */}
            <div className="w-full flex items-center justify-between gap-1 mb-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 pl-1">
                Facility Level:
              </span>
              <div className="flex items-center gap-1">
                {PRISON_LAYOUTS.map((lay, idx) => (
                  <button
                    key={lay.id}
                    onClick={() => handleSelectLayout(idx)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      layoutIndex === idx
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lay.badge}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction banner & Hint */}
            <div className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-3 text-center">
              <p className="text-xs text-slate-300 leading-snug">{message}</p>
              {showHint && hintDirection && (
                <div className="mt-2 p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold animate-in fade-in flex items-center justify-center gap-2">
                  <span>💡 Optimal Move:</span>
                  <span className="font-mono bg-cyan-900 px-2 py-0.5 rounded text-white">
                    {hintDirection}
                  </span>
                </div>
              )}
            </div>

            {/* Maze Grid */}
            <div
              className="inline-grid gap-1.5 p-3 rounded-2xl bg-slate-950 border-2 border-red-950 shadow-inner mb-3 transition-all"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                const isP = player.x === x && player.y === y;
                const isG = guard.x === x && guard.y === y;
                const isE = exit.x === x && exit.y === y;
                const isW = isWall(x, y);

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold transition-all duration-150 select-none ${
                      isW
                        ? 'bg-slate-700 border-2 border-slate-600 shadow-md ring-1 ring-slate-800 pattern-diagonal'
                        : isE
                        ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 shadow-inner animate-pulse'
                        : isP
                        ? 'bg-amber-500 border-2 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400'
                        : isG
                        ? 'bg-red-600 border-2 border-red-300 text-white shadow-lg shadow-red-600/40 ring-2 ring-red-500'
                        : 'bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850'
                    }`}
                  >
                    {isP ? (
                      <span className="text-xl">🏃</span>
                    ) : isG ? (
                      <span className="text-xl">👮‍♂️</span>
                    ) : isE ? (
                      <span className="text-xl">🚪</span>
                    ) : isW ? (
                      <span className="text-xs text-slate-400">🧱</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* D-Pad Controls */}
            {status === 'PLAYING' && (
              <div className="w-full flex flex-col items-center gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => movePlayer(0, -1)}
                  className="w-14 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-black text-sm flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                >
                  ▲
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => movePlayer(-1, 0)}
                    className="w-14 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-black text-sm flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(0, 1)}
                    className="w-14 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-black text-sm flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(1, 0)}
                    className="w-14 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-black text-sm flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

            {/* Utility Toolbar: Undo, Reset, Hint */}
            <div className="w-full flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0 || status === 'ESCAPED'}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                title="Undo last step"
              >
                <span>↩️</span>
                <span>Undo Step ({history.length})</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                title="Restart puzzle"
              >
                <span>🔄</span>
                <span>Reset Map</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowHint((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 ${
                  showHint
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50'
                }`}
                title="Show solver blueprint hint"
              >
                <span>💡</span>
                <span>{showHint ? 'Hide Hint' : 'Show Blueprint Hint'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SECRET TUNNEL DIG */}
        {/* ============================================================== */}
        {activeTab === 'TUNNEL' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40">
              <span className="text-4xl block mb-2">⛏️</span>
              <h4 className="text-sm font-bold text-amber-300">
                Escape Tunnel Under Cell 402
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Chip away at the prison foundation after lights-out. Careful digging avoids tunnel collapses!
              </p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>Excavation Progress</span>
                  <span className="font-mono text-amber-400">{tunnelProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${tunnelProgress}%` }}
                  />
                </div>
              </div>

              {/* Dig buttons */}
              {status === 'PLAYING' && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDigStep('CAREFUL')}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-md active:scale-95"
                  >
                    🥄 Careful Dig (+20%, 5% collapse risk)
                  </button>
                  <button
                    onClick={() => handleDigStep('RUSH')}
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md active:scale-95"
                  >
                    ⚡ Fast Pickaxe (+35%, 25% collapse risk)
                  </button>
                </div>
              )}
            </div>

            {/* Log */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs text-slate-300 space-y-1 max-h-32 overflow-y-auto">
              {tunnelLog.map((log, i) => (
                <div key={i}>• {log}</div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: BRIBE GUARD */}
        {/* ============================================================== */}
        {activeTab === 'BRIBE' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-4xl block mb-2">💵</span>
              <h4 className="text-sm font-bold text-emerald-300">
                Corrupt Officer Negotiations
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Officer Jenkins is willing to leave the perimeter maintenance gate open for the right price.
              </p>
              <div className="mt-2 text-xs font-mono text-emerald-400">
                Your Inmate Account: {character ? `${character.currencySymbol}${character.money.toLocaleString()}` : '$0'}
              </div>

              {status === 'PLAYING' && (
                <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto">
                  <button
                    onClick={() => handleBribe(10000)}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md active:scale-95 flex items-center justify-between px-4"
                  >
                    <span>Slip $10,000 Cash</span>
                    <span>🚪 Gate Release</span>
                  </button>
                  <button
                    onClick={() => handleBribe(25000)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 flex items-center justify-between px-4"
                  >
                    <span>Slip $25,000 Cash</span>
                    <span>🚗 Guard Car Waiting</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* God Mode Instant Release shortcut */}
        {hasGodMode && status === 'PLAYING' && (
          <div className="shrink-0 mt-2 p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <span>🗝️</span>
              <span className="font-bold">God Mode Overwrite:</span>
              <span className="text-slate-400">Pardon & Break Free</span>
            </div>
            <button
              onClick={() => {
                playSuccessSound();
                setStatus('ESCAPED');
                setMessage('⚡ God Mode override activated! Cell doors unlocked.');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] shadow-sm"
            >
              Instant Release
            </button>
          </div>
        )}

        {/* Outcome Footer */}
        {status === 'ESCAPED' && (
          <div className="shrink-0 mt-3 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-center animate-in fade-in">
            <h4 className="text-sm font-black text-emerald-300">
              FREEDOM ACHIEVED! 🗽
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              You escaped prison! You are now living as a fugitive on the run.
            </p>
            <button
              onClick={() => {
                playClickSound();
                onSuccess();
              }}
              className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30"
            >
              Claim Freedom 🏃💨
            </button>
          </div>
        )}

        {status === 'BUSTED' && (
          <div className="shrink-0 mt-3 p-3 rounded-2xl bg-red-950/90 border border-red-500 text-center animate-in fade-in">
            <h4 className="text-sm font-black text-red-300">
              BUSTED BY PRISON GUARDS! 🚨
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              You were caught during the attempt. You can retry with "Undo Step", or face +3 extra years.
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleUndo}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ↩️ Undo Last Step
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  onFailure(3);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30"
              >
                Accept Sentence (+3 Yrs)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
