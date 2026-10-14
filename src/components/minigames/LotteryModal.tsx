import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  playCashSound,
  playClickSound,
  playFailSound,
  playSuccessSound,
  playBallDrawSound,
  playJackpotFanfare,
} from '../../utils/audio';

interface LotteryModalProps {
  playerCash: number;
  currencySymbol: string;
  onCashChange: (delta: number) => void;
  onClose: () => void;
}

const TOTAL_DIGITS = 9;
const MAX_BALL_NUMBER = 50;

// Prize ladder according to user specification (match 3,4,5,6,7,8,9 digits or win it all)
const PRIZE_TIERS: { [key: number]: { amount: number; label: string; badge: string; color: string } } = {
  3: { amount: 100, label: 'Match 3 Digits', badge: '🥉 Bronze Tier', color: 'text-amber-400' },
  4: { amount: 1000, label: 'Match 4 Digits', badge: '🥈 Silver Tier', color: 'text-slate-300' },
  5: { amount: 10000, label: 'Match 5 Digits', badge: '🥇 Gold Tier', color: 'text-yellow-400' },
  6: { amount: 75000, label: 'Match 6 Digits', badge: '💎 Platinum Tier', color: 'text-cyan-300' },
  7: { amount: 500000, label: 'Match 7 Digits', badge: '👑 Diamond Tier', color: 'text-purple-300' },
  8: { amount: 2500000, label: 'Match 8 Digits', badge: '🌟 High Roller Prize', color: 'text-pink-400' },
  9: { amount: 25000000, label: 'Match 9 Digits - WIN IT ALL!', badge: '🏆 GRAND POWERBALL JACKPOT!', color: 'text-red-400' },
};

function generateRandomTicket(): number[] {
  const nums = new Set<number>();
  while (nums.size < TOTAL_DIGITS) {
    nums.add(Math.floor(Math.random() * MAX_BALL_NUMBER) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

export const LotteryModal: React.FC<LotteryModalProps> = ({
  playerCash,
  currencySymbol,
  onCashChange,
  onClose,
}) => {
  const jackpot = 25000000;

  // Selected player ticket (9 unique numbers from 1 to 50)
  const [playerTicket, setPlayerTicket] = useState<number[]>(() => generateRandomTicket());
  const [customizing, setCustomizing] = useState(false);

  // Broadcast TV & Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnBalls, setDrawnBalls] = useState<number[]>([]);
  const [currentMatchCount, setCurrentMatchCount] = useState(0);
  const [drawFinished, setDrawFinished] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);
  const [lastWinTier, setLastWinTier] = useState<string | null>(null);
  const [tvChannel, setTvChannel] = useState(7);
  const [tvScanlines, setTvScanlines] = useState(true);

  // Background animated tumbler balls
  const [tumblerBalls] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      num: Math.floor(Math.random() * MAX_BALL_NUMBER) + 1,
      color: ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#ec4899'][i % 6],
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
      dur: 1.5 + Math.random() * 1.5,
    }))
  );

  const drawTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) clearInterval(drawTimerRef.current);
    };
  }, []);

  const handleQuickPick = () => {
    playClickSound();
    setPlayerTicket(generateRandomTicket());
  };

  const toggleNumberSelection = (num: number) => {
    playClickSound();
    if (playerTicket.includes(num)) {
      setPlayerTicket(playerTicket.filter((n) => n !== num));
    } else {
      if (playerTicket.length < TOTAL_DIGITS) {
        setPlayerTicket([...playerTicket, num].sort((a, b) => a - b));
      }
    }
  };

  /**
   * Generates target draw numbers with probability curve
   * allowing realistic excitement for 3,4,5,6,7,8,9 matches.
   */
  const generateDrawnSequence = (ticket: number[]): number[] => {
    const roll = Math.random();
    let targetMatches = 0;

    // Weighted match simulation for thrilling TV broadcasts:
    // 0.1% chance: 9 digits (Win it all!)
    // 0.3% chance: 8 digits
    // 0.8% chance: 7 digits
    // 2.0% chance: 6 digits
    // 5.0% chance: 5 digits
    // 12.0% chance: 4 digits
    // 25.0% chance: 3 digits
    // Rest: 0-2 matches
    if (roll < 0.001) {
      targetMatches = 9; // JACKPOT WIN IT ALL!
    } else if (roll < 0.004) {
      targetMatches = 8;
    } else if (roll < 0.012) {
      targetMatches = 7;
    } else if (roll < 0.032) {
      targetMatches = 6;
    } else if (roll < 0.082) {
      targetMatches = 5;
    } else if (roll < 0.202) {
      targetMatches = 4;
    } else if (roll < 0.452) {
      targetMatches = 3;
    } else {
      targetMatches = Math.floor(Math.random() * 3); // 0, 1, or 2
    }

    // Pick 'targetMatches' numbers from the player ticket
    const shuffledTicket = [...ticket].sort(() => Math.random() - 0.5);
    const guaranteed = shuffledTicket.slice(0, targetMatches);

    // Pick remaining from numbers NOT on player ticket
    const pool = Array.from({ length: MAX_BALL_NUMBER }, (_, i) => i + 1).filter(
      (n) => !ticket.includes(n)
    );
    const shuffledPool = pool.sort(() => Math.random() - 0.5);
    const nonMatches = shuffledPool.slice(0, TOTAL_DIGITS - targetMatches);

    // Combine and shuffle the 9 drawn balls so they arrive in random suspenseful order
    return [...guaranteed, ...nonMatches].sort(() => Math.random() - 0.5);
  };

  const startDraw = (cost = 10) => {
    if (playerCash < cost || isDrawing) return;
    if (playerTicket.length !== TOTAL_DIGITS) {
      playFailSound();
      return;
    }

    playClickSound();
    onCashChange(-cost);

    setIsDrawing(true);
    setDrawFinished(false);
    setDrawnBalls([]);
    setCurrentMatchCount(0);
    setLastWinAmount(null);
    setLastWinTier(null);

    const sequence = generateDrawnSequence(playerTicket);
    let ballIdx = 0;
    let matchesSoFar = 0;

    drawTimerRef.current = setInterval(() => {
      if (ballIdx < sequence.length) {
        const nextBall = sequence[ballIdx];
        const isMatch = playerTicket.includes(nextBall);
        if (isMatch) {
          matchesSoFar++;
          setCurrentMatchCount(matchesSoFar);
        }

        setDrawnBalls((prev) => [...prev, nextBall]);
        playBallDrawSound(isMatch);
        ballIdx++;
      } else {
        // Drawing complete!
        if (drawTimerRef.current) clearInterval(drawTimerRef.current);
        finishDraw(matchesSoFar);
      }
    }, 700);
  };

  const finishDraw = (totalMatches: number) => {
    setIsDrawing(false);
    setDrawFinished(true);

    if (totalMatches >= 3) {
      const tier = PRIZE_TIERS[totalMatches];
      const win = tier.amount;
      setLastWinAmount(win);
      setLastWinTier(tier.badge);
      onCashChange(win);

      if (totalMatches === 9) {
        // WIN IT ALL GRAND JACKPOT!
        playJackpotFanfare();
        try {
          confetti({
            particleCount: 300,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#ffd700', '#ff0055', '#00e5ff', '#ffffff'],
          });
        } catch {}
      } else if (totalMatches >= 6) {
        playJackpotFanfare();
        try {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } catch {}
      } else {
        playCashSound();
        try {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        } catch {}
      }
    } else {
      setLastWinAmount(0);
      setLastWinTier(null);
      playFailSound();
    }
  };

  const handleInstantReveal = () => {
    if (!isDrawing) return;
    if (drawTimerRef.current) clearInterval(drawTimerRef.current);

    // Compute remaining from sequence
    const remainingCount = TOTAL_DIGITS - drawnBalls.length;
    if (remainingCount <= 0) return;

    const remainingSequence = generateDrawnSequence(playerTicket).slice(drawnBalls.length);
    const finalBalls = [...drawnBalls, ...remainingSequence];
    setDrawnBalls(finalBalls);

    const matches = finalBalls.filter((b) => playerTicket.includes(b)).length;
    setCurrentMatchCount(matches);
    finishDraw(matches);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top TV Cabinet Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-red-950/80 border-b border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">📺</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                POWERBALL TV
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold animate-pulse">
                  ● LIVE
                </span>
              </h2>
              <p className="text-[10px] text-amber-300/80">
                Channel {tvChannel} • Match 3 to 9 Digits or WIN IT ALL!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTvScanlines(!tvScanlines)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700 cursor-pointer"
              title="Toggle Retro CRT Scanlines"
            >
              CRT: {tvScanlines ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= VINTAGE TELEVISION CHASSIS ================= */}
        <div className="p-4 bg-gradient-to-b from-stone-900 via-zinc-950 to-stone-950 border-b border-stone-800">
          <div className="relative rounded-2xl bg-black border-4 border-stone-700 shadow-2xl overflow-hidden p-3.5">
            
            {/* Retro Scanlines Overlay */}
            {tvScanlines && (
              <div
                className="absolute inset-0 pointer-events-none z-20 opacity-15"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
                }}
              />
            )}

            {/* TV Screen Top Info Bar */}
            <div className="relative z-10 flex items-center justify-between pb-2 border-b border-amber-500/30 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>POWERBALL BROADCAST</span>
              </div>
              <div className="text-yellow-300 font-extrabold tracking-wider">
                JACKPOT: {currencySymbol}{jackpot.toLocaleString()}
              </div>
            </div>

            {/* TV Broadcast Center: The Ball Tumbler Machine */}
            <div className="relative my-3 h-36 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              
              {/* Acrylic Globe Container with Bouncing Balls */}
              <div className="relative w-32 h-32 rounded-full border-2 border-cyan-400/50 bg-cyan-950/20 shadow-inner flex items-center justify-center overflow-hidden">
                {/* Air blower glow effect */}
                <div className="absolute inset-0 bg-radial from-cyan-400/10 via-transparent to-transparent pointer-events-none" />

                {/* Animated Bouncing Tumbler Balls */}
                {tumblerBalls.map((b) => (
                  <div
                    key={b.id}
                    className={`absolute w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-md transition-all ${
                      isDrawing ? 'animate-bounce' : ''
                    }`}
                    style={{
                      backgroundColor: b.color,
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      animationDuration: isDrawing ? `${b.dur * 0.4}s` : `${b.dur}s`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {b.num}
                  </div>
                ))}

                {/* Tube Chute at Top of Globe */}
                <div className="absolute top-0 w-8 h-4 bg-slate-800 border-x border-cyan-300/40 rounded-b-md" />
              </div>

              {/* Live Match Counter Indicator */}
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/50 text-right">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Matches</div>
                <div className="text-base font-black text-amber-400 font-mono">
                  {currentMatchCount} / {TOTAL_DIGITS}
                </div>
              </div>

              {/* Status Announcement Banner */}
              <div className="absolute bottom-2 left-2 right-2 text-center">
                {isDrawing ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse shadow">
                    🎲 DRAWING BALL {drawnBalls.length + 1} OF {TOTAL_DIGITS}...
                  </span>
                ) : drawFinished ? (
                  lastWinAmount && lastWinAmount > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow animate-bounce">
                      🎉 {lastWinTier}! WON {currencySymbol}{lastWinAmount.toLocaleString()}!
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                      Matched {currentMatchCount} digits (Need 3+ to win). Better luck next time!
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-amber-300/90 font-mono font-semibold">
                    Press DRAW to watch tonight's live Powerball broadcast
                  </span>
                )}
              </div>
            </div>

            {/* Drawn Balls Display Tray (1 to 9 Digits) */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>Drawn Balls:</span>
                <span className="text-amber-400 font-mono">
                  {drawnBalls.length === 9 ? 'Complete Drawing' : `${drawnBalls.length} of 9 Drawn`}
                </span>
              </div>

              <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
                {Array.from({ length: TOTAL_DIGITS }).map((_, idx) => {
                  const ballNum = drawnBalls[idx];
                  const hasBall = ballNum !== undefined;
                  const isMatch = hasBall && playerTicket.includes(ballNum);
                  const isPowerball = idx === 8;

                  return (
                    <div
                      key={idx}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center font-black transition-all ${
                        hasBall
                          ? isMatch
                            ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-lg scale-105'
                            : isPowerball
                            ? 'bg-gradient-to-b from-red-600 to-rose-700 text-white'
                            : 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-600'
                      }`}
                    >
                      <span className="text-xs font-mono">{hasBall ? ballNum : '?'}</span>
                      {hasBall && isMatch && (
                        <span className="text-[8px] font-sans -mt-0.5">⭐</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Live TV News Ticker */}
            <div className="mt-2.5 px-2 py-1 rounded bg-slate-950/90 border border-slate-850 text-[10px] text-amber-300/70 font-mono truncate">
              📺 LOTTO TICKER: Match 3 digits pays $100 • 4 digits: $1,000 • 5 digits: $10,000 • 9 digits: WIN IT ALL $25,000,000!
            </div>
          </div>

          {/* TV Cabinet Buttons & Controls */}
          <div className="flex items-center justify-between mt-2.5 px-2 text-stone-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span className="font-mono text-[10px]">POWERBALL BROADCAST STATION</span>
            </div>

            <div className="flex items-center gap-2">
              {isDrawing && (
                <button
                  onClick={handleInstantReveal}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shadow cursor-pointer transition-transform active:scale-95"
                >
                  ⏩ Fast Reveal
                </button>
              )}
              <button
                onClick={() => {
                  playClickSound();
                  setTvChannel((c) => (c === 7 ? 11 : c === 11 ? 4 : 7));
                }}
                className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold border border-stone-700 cursor-pointer"
              >
                CH {tvChannel} 🔄
              </button>
            </div>
          </div>
        </div>

        {/* ================= PLAYER'S TICKET SECTION ================= */}
        <div className="p-4 space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-600/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎟️</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Your 9-Digit Powerball Ticket
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickPick}
                  disabled={isDrawing}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-[11px] font-black shadow cursor-pointer transition-transform active:scale-95"
                >
                  🎲 Quick Pick
                </button>
                <button
                  onClick={() => setCustomizing(!customizing)}
                  disabled={isDrawing}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-[11px] font-bold border border-slate-700 cursor-pointer"
                >
                  {customizing ? 'Done' : '✏️ Pick Numbers'}
                </button>
              </div>
            </div>

            {/* The 9 Numbers on Ticket */}
            <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
              {playerTicket.map((num, idx) => {
                const isMatched = drawnBalls.includes(num);
                return (
                  <div
                    key={idx}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center font-black transition-all ${
                      isMatched
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md font-mono'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 font-mono'
                    }`}
                  >
                    <span className="text-xs">{num}</span>
                    {isMatched && <span className="text-[8px] font-sans -mt-0.5">MATCH</span>}
                  </div>
                );
              })}
            </div>

            {/* Custom Picker Grid Modal / Accordion */}
            {customizing && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-40 overflow-y-auto">
                <div className="text-[11px] text-slate-300 font-bold mb-2 flex justify-between">
                  <span>Pick {TOTAL_DIGITS} lucky numbers:</span>
                  <span className="text-amber-400 font-mono">
                    {playerTicket.length} / {TOTAL_DIGITS} Selected
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1 text-center">
                  {Array.from({ length: MAX_BALL_NUMBER }).map((_, i) => {
                    const val = i + 1;
                    const isSelected = playerTicket.includes(val);
                    return (
                      <button
                        key={val}
                        onClick={() => toggleNumberSelection(val)}
                        className={`p-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================= PRIZE LADDER SUMMARY ================= */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Powerball Payout Ladder</span>
              <span className="text-amber-300 font-bold">Jackpot: $25,000,000</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 3 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 3</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}100</div>
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 4 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 4</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}1,000</div>
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 5 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 5</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}10,000</div>
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 6 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 6</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}75,000</div>
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 7 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 7</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}500,000</div>
              </div>
              <div className={`p-1.5 rounded-lg bg-slate-950 border ${currentMatchCount === 8 ? 'border-amber-400 bg-amber-950/40 font-bold' : 'border-slate-800'}`}>
                <div className="text-slate-400 text-[10px]">Match 8</div>
                <div className="text-amber-300 font-mono font-bold">{currencySymbol}2,500,000</div>
              </div>
              <div className={`col-span-2 p-1.5 rounded-lg bg-red-950/40 border ${currentMatchCount === 9 ? 'border-red-400 ring-2 ring-red-400 font-bold' : 'border-red-800/60'}`}>
                <div className="text-red-300 text-[10px] font-black">Match 9 - WIN IT ALL!</div>
                <div className="text-yellow-300 font-mono font-extrabold">{currencySymbol}25,000,000</div>
              </div>
            </div>
          </div>

          {/* ================= ACTION BUTTONS ================= */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => startDraw(10)}
              disabled={playerCash < 10 || isDrawing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <span className="text-base">📺</span>
              <span>{isDrawing ? 'Broadcasting Live...' : `Play Powerball (${currencySymbol}10)`}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => startDraw(50)}
                disabled={playerCash < 50 || isDrawing}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Buy 5 Tickets ({currencySymbol}50)
              </button>

              <button
                onClick={() => startDraw(100)}
                disabled={playerCash < 100 || isDrawing}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Buy 10 Tickets ({currencySymbol}100)
              </button>
            </div>
          </div>

          {/* Bank balance footer */}
          <div className="text-center text-[11px] text-slate-400 font-mono">
            Bank Balance: {currencySymbol}{playerCash.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
