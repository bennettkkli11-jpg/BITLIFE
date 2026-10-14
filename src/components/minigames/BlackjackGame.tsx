import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  playCashSound,
  playFailSound,
  playSuccessSound,
  playClickSound,
  playChipSound,
  playCardSlideSound,
  playCardFlipSound,
  playRouletteSpinSound,
  playSlotSpinSound,
  playJackpotFanfare,
} from '../../utils/audio';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  num: number;
}

interface BlackjackGameProps {
  playerCash: number;
  currencySymbol: string;
  onCashChange: (delta: number) => void;
  onClose: () => void;
}

type CasinoTab = 'BLACKJACK' | 'ROULETTE' | 'SLOTS' | 'DICE';

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: '2', num: 2 },
  { val: '3', num: 3 },
  { val: '4', num: 4 },
  { val: '5', num: 5 },
  { val: '6', num: 6 },
  { val: '7', num: 7 },
  { val: '8', num: 8 },
  { val: '9', num: 9 },
  { val: '10', num: 10 },
  { val: 'J', num: 10 },
  { val: 'Q', num: 10 },
  { val: 'K', num: 10 },
  { val: 'A', num: 11 },
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const v of VALUES) {
      deck.push({ suit, value: v.val, num: v.num });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHand(cards: Card[]): { score: number; isSoft: boolean } {
  let score = 0;
  let aces = 0;
  for (const c of cards) {
    score += c.num;
    if (c.value === 'A') aces++;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return { score, isSoft: aces > 0 };
}

// Full 37 Numbers on European Wheel
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

// Helper math for drawing full SVG circular sectors
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArcSlice(x: number, y: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(x, y, rOuter, endAngle);
  const p2 = polarToCartesian(x, y, rOuter, startAngle);
  const p3 = polarToCartesian(x, y, rInner, startAngle);
  const p4 = polarToCartesian(x, y, rInner, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', p1.x, p1.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 0, p2.x, p2.y,
    'L', p3.x, p3.y,
    'A', rInner, rInner, 0, largeArcFlag, 1, p4.x, p4.y,
    'Z'
  ].join(' ');
}

// Slot Symbols
const SLOT_SYMBOLS = [
  { icon: '7️⃣', name: 'Seven', mult: 50 },
  { icon: '💎', name: 'Diamond', mult: 25 },
  { icon: '👑', name: 'Crown', mult: 20 },
  { icon: '🔔', name: 'Bell', mult: 15 },
  { icon: '🍀', name: 'Clover', mult: 10 },
  { icon: '🍒', name: 'Cherry', mult: 5 },
  { icon: '🍋', name: 'Lemon', mult: 3 },
];

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  playerCash,
  currencySymbol,
  onCashChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CasinoTab>('BLACKJACK');

  // ===================== BLACKJACK STATE =====================
  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState<Card[]>(createDeck);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'ROUND_OVER'>('BETTING');
  const [resultMessage, setResultMessage] = useState('');
  const [isDealingAnimation, setIsDealingAnimation] = useState(false);
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // ===================== ROULETTE STATE =====================
  const [rouletteBetType, setRouletteBetType] = useState<'RED' | 'BLACK' | 'EVEN' | 'ODD' | '1-18' | '19-36' | 'STRAIGHT'>('RED');
  const [rouletteStraightNum, setRouletteStraightNum] = useState<number>(7);
  const [rouletteBetAmount, setRouletteBetAmount] = useState(50);
  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);
  const [rouletteWinningNumber, setRouletteWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballOrbitAngle, setBallOrbitAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(124);
  const [rouletteResultText, setRouletteResultText] = useState<string | null>(null);

  // ===================== SLOTS STATE =====================
  const [slotBet, setSlotBet] = useState(25);
  const [isSpinningSlots, setIsSpinningSlots] = useState(false);
  const [slotReels, setSlotReels] = useState<[string, string, string]>(['7️⃣', '💎', '7️⃣']);
  const [slotSpinning, setSlotSpinning] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [leverPulled, setLeverPulled] = useState(false);
  const [slotWinBanner, setSlotWinBanner] = useState<string | null>(null);

  // ===================== CRAPS / DICE STATE =====================
  const [diceBet, setDiceBet] = useState(50);
  const [diceType, setDiceType] = useState<'7' | 'OVER7' | 'UNDER7' | 'DOUBLES'>('OVER7');
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number]>([4, 3]);
  const [diceResultText, setDiceResultText] = useState<string | null>(null);

  const chipDenominations = [25, 50, 100, 250, 500, 1000, 5000].filter((c) => c <= Math.max(25, playerCash));

  // =========================================================================
  // BLACKJACK ACTIONS & ANIMATIONS
  // =========================================================================
  const startBlackjackRound = () => {
    if (playerCash < bet || isDealingAnimation) return;
    playChipSound();
    setIsDealingAnimation(true);
    setDealerRevealed(false);
    setResultMessage('');

    let currentDeck = [...deck];
    if (currentDeck.length < 15) {
      currentDeck = createDeck();
    }

    const p1 = currentDeck.pop()!;
    const d1 = currentDeck.pop()!;
    const p2 = currentDeck.pop()!;
    const d2 = currentDeck.pop()!;

    setPlayerHand([p1]);
    setDealerHand([]);
    playCardSlideSound();

    setTimeout(() => {
      setDealerHand([d1]);
      playCardSlideSound();
    }, 250);

    setTimeout(() => {
      setPlayerHand([p1, p2]);
      playCardSlideSound();
    }, 500);

    setTimeout(() => {
      setDealerHand([d1, d2]);
      setDeck(currentDeck);
      setIsDealingAnimation(false);
      playCardSlideSound();

      const pScore = calculateHand([p1, p2]).score;
      const dScore = calculateHand([d1, d2]).score;

      if (pScore === 21 && dScore === 21) {
        setDealerRevealed(true);
        setGameState('ROUND_OVER');
        setResultMessage('Push! Both hit Blackjack.');
      } else if (pScore === 21) {
        setDealerRevealed(true);
        setGameState('ROUND_OVER');
        const win = Math.round(bet * 1.5);
        onCashChange(win);
        playJackpotFanfare();
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        } catch {}
        setResultMessage(`BLACKJACK! You won ${currencySymbol}${win.toLocaleString()}!`);
      } else {
        setGameState('PLAYER_TURN');
      }
    }, 750);
  };

  const hit = () => {
    if (gameState !== 'PLAYER_TURN' || isDealingAnimation) return;
    playCardSlideSound();
    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(currentDeck);

    const score = calculateHand(newHand).score;
    if (score > 21) {
      setDealerRevealed(true);
      setGameState('ROUND_OVER');
      onCashChange(-bet);
      playFailSound();
      setResultMessage(`Bust with ${score}! Dealer wins ${currencySymbol}${bet.toLocaleString()}.`);
    }
  };

  const stand = () => {
    if (gameState !== 'PLAYER_TURN' || isDealingAnimation) return;
    playClickSound();
    setGameState('DEALER_TURN');
    setDealerRevealed(true);
    playCardFlipSound();
  };

  const doubleDown = () => {
    if (gameState !== 'PLAYER_TURN' || playerCash < bet * 2 || playerHand.length !== 2 || isDealingAnimation) return;
    playChipSound();
    const newBet = bet * 2;
    setBet(newBet);
    playCardSlideSound();

    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(currentDeck);

    const score = calculateHand(newHand).score;
    if (score > 21) {
      setDealerRevealed(true);
      setGameState('ROUND_OVER');
      onCashChange(-newBet);
      playFailSound();
      setResultMessage(`Bust on Double Down with ${score}! (-${currencySymbol}${newBet.toLocaleString()})`);
    } else {
      setGameState('DEALER_TURN');
      setDealerRevealed(true);
      playCardFlipSound();
    }
  };

  // Dealer turn loop with dramatic delays
  useEffect(() => {
    if (gameState !== 'DEALER_TURN') return;

    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    let dScore = calculateHand(currentDealerHand).score;

    const interval = setInterval(() => {
      if (dScore < 17) {
        const card = currentDeck.pop()!;
        currentDealerHand.push(card);
        setDealerHand([...currentDealerHand]);
        playCardSlideSound();
        dScore = calculateHand(currentDealerHand).score;
      } else {
        clearInterval(interval);
        setDeck(currentDeck);
        setGameState('ROUND_OVER');

        const pScore = calculateHand(playerHand).score;
        if (dScore > 21) {
          onCashChange(bet);
          playSuccessSound();
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setResultMessage(`Dealer busts with ${dScore}! You win ${currencySymbol}${bet.toLocaleString()}!`);
        } else if (pScore > dScore) {
          onCashChange(bet);
          playSuccessSound();
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setResultMessage(`You win ${pScore} to ${dScore}! (+${currencySymbol}${bet.toLocaleString()})`);
        } else if (pScore < dScore) {
          onCashChange(-bet);
          playFailSound();
          setResultMessage(`Dealer wins ${dScore} to ${pScore}. (-${currencySymbol}${bet.toLocaleString()})`);
        } else {
          setResultMessage(`Push! Both tied at ${pScore}.`);
        }
      }
    }, 600);

    return () => clearInterval(interval);
  }, [gameState]);

  // =========================================================================
  // FULL-WHEEL ROULETTE LOGIC & ANIMATIONS
  // =========================================================================
  const spinFullWheelRoulette = () => {
    if (isSpinningRoulette || playerCash < rouletteBetAmount) return;
    playChipSound();
    onCashChange(-rouletteBetAmount);
    setIsSpinningRoulette(true);
    setRouletteWinningNumber(null);
    setRouletteResultText(null);
    setBallRadius(118); // outer rim track

    playRouletteSpinSound();

    // Pick random winning pocket (0 to 36)
    const winningIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winNum = ROULETTE_NUMBERS[winningIdx];

    const step = 360 / 37;
    // Angle of the winning pocket in wheel coordinates (clockwise from top 12 o'clock)
    const pocketAngle = (winningIdx + 0.5) * step;

    // Calculate wheel rotation so pocketAngle stops DEAD-CENTER at the top (12 o'clock / 0 deg)
    const currentMod = ((wheelRotation % 360) + 360) % 360;
    const targetMod = (360 - (pocketAngle % 360)) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const wheelSpins = 4 + Math.floor(Math.random() * 2);
    const targetWheelAngle = wheelRotation + wheelSpins * 360 + delta;

    // Ball spins counter-clockwise around the wheel track
    const ballSpins = 5 + Math.floor(Math.random() * 2);
    const targetBallAngle = ballOrbitAngle - (ballSpins * 360);

    setWheelRotation(targetWheelAngle);
    setBallOrbitAngle(targetBallAngle);

    // Ball drops from outer rim track into the pocket track near the end of spin
    setTimeout(() => {
      setBallRadius(84); // drops inward to pocket level
    }, 2200);

    setTimeout(() => {
      setIsSpinningRoulette(false);
      setRouletteWinningNumber(winNum);

      const isRed = RED_NUMBERS.has(winNum);
      const isBlack = winNum !== 0 && !isRed;
      const isEven = winNum !== 0 && winNum % 2 === 0;
      const isOdd = winNum !== 0 && winNum % 2 !== 0;
      const isLow = winNum >= 1 && winNum <= 18;
      const isHigh = winNum >= 19 && winNum <= 36;

      let won = false;
      let payoutMult = 0;

      if (rouletteBetType === 'RED' && isRed) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === 'BLACK' && isBlack) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === 'EVEN' && isEven) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === 'ODD' && isOdd) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === '1-18' && isLow) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === '19-36' && isHigh) {
        won = true;
        payoutMult = 2;
      } else if (rouletteBetType === 'STRAIGHT' && winNum === rouletteStraightNum) {
        won = true;
        payoutMult = 36;
      }

      const colorDesc = winNum === 0 ? 'Green' : isRed ? 'Red' : 'Black';

      if (won) {
        const totalWin = rouletteBetAmount * payoutMult;
        onCashChange(totalWin);
        playSuccessSound();
        playCashSound();
        try {
          confetti({
            particleCount: payoutMult > 10 ? 150 : 70,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        setRouletteResultText(`WINNER! Landed on ${winNum} (${colorDesc})! Paid out ${currencySymbol}${totalWin.toLocaleString()}!`);
      } else {
        playFailSound();
        setRouletteResultText(`Landed on ${winNum} (${colorDesc}).`);
      }
    }, 3200);
  };

  // =========================================================================
  // SLOTS LOGIC & ANIMATIONS
  // =========================================================================
  const pullSlotLever = () => {
    if (isSpinningSlots || playerCash < slotBet) return;
    playChipSound();
    onCashChange(-slotBet);

    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);

    setIsSpinningSlots(true);
    setSlotWinBanner(null);
    setSlotSpinning([true, true, true]);
    playSlotSpinSound();

    const s1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon;
    const s2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon;
    const s3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon;

    setTimeout(() => {
      setSlotSpinning([false, true, true]);
      setSlotReels(([_, r2, r3]) => [s1, r2, r3]);
      playCardFlipSound();
    }, 700);

    setTimeout(() => {
      setSlotSpinning([false, false, true]);
      setSlotReels(([r1, _, r3]) => [r1, s2, r3]);
      playCardFlipSound();
    }, 1200);

    setTimeout(() => {
      setSlotSpinning([false, false, false]);
      setSlotReels([s1, s2, s3]);
      playCardFlipSound();
      setIsSpinningSlots(false);

      if (s1 === s2 && s2 === s3) {
        const symDef = SLOT_SYMBOLS.find((s) => s.icon === s1) || SLOT_SYMBOLS[0];
        const win = slotBet * symDef.mult;
        onCashChange(win);

        if (s1 === '7️⃣') {
          playJackpotFanfare();
          try {
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#ffd700', '#ff0055', '#00e5ff'],
            });
          } catch {}
          setSlotWinBanner(`👑 TRIPLE SEVENS JACKPOT! Paid: ${currencySymbol}${win.toLocaleString()}!`);
        } else {
          playSuccessSound();
          playCashSound();
          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch {}
          setSlotWinBanner(`✨ 3x ${symDef.name}! Won ${currencySymbol}${win.toLocaleString()}!`);
        }
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        const win = slotBet * 2;
        onCashChange(win);
        playCashSound();
        setSlotWinBanner(`Pair match! Won ${currencySymbol}${win.toLocaleString()}!`);
      } else {
        playFailSound();
        setSlotWinBanner('No match.');
      }
    }, 1700);
  };

  // =========================================================================
  // CRAPS / DICE LOGIC & ANIMATIONS
  // =========================================================================
  const rollDice = () => {
    if (isRollingDice || playerCash < diceBet) return;
    playChipSound();
    onCashChange(-diceBet);
    setIsRollingDice(true);
    setDiceResultText(null);
    playCardSlideSound();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    setTimeout(() => {
      setDiceValues([d1, d2]);
      setIsRollingDice(false);

      let won = false;
      let payout = 0;

      if (diceType === '7' && total === 7) {
        won = true;
        payout = diceBet * 5;
      } else if (diceType === 'OVER7' && total > 7) {
        won = true;
        payout = diceBet * 2;
      } else if (diceType === 'UNDER7' && total < 7) {
        won = true;
        payout = diceBet * 2;
      } else if (diceType === 'DOUBLES' && d1 === d2) {
        won = true;
        payout = diceBet * 4;
      }

      if (won) {
        onCashChange(payout);
        playSuccessSound();
        playCashSound();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
        setDiceResultText(`WIN! Rolled ${d1} + ${d2} = ${total}! Won ${currencySymbol}${payout.toLocaleString()}!`);
      } else {
        playFailSound();
        setDiceResultText(`Rolled ${d1} + ${d2} = ${total}.`);
      }
    }, 1000);
  };

  const playerScore = calculateHand(playerHand).score;
  const dealerScore =
    dealerRevealed || gameState !== 'PLAYER_TURN'
      ? calculateHand(dealerHand).score
      : dealerHand.length > 0
      ? calculateHand([dealerHand[0]]).score
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-emerald-850 shadow-2xl flex flex-col overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= RESORT CASINO HEADER ================= */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border-b border-emerald-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">🎰</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-amber-300 flex items-center gap-2">
                BELLAGIO CASINO & RESORT
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  VIP ROOM
                </span>
              </h2>
              <p className="text-[10px] text-slate-300">
                Full-Wheel Roulette · Animated Blackjack · 777 Slots · Vegas Dice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/30 font-mono">
              <span className="text-[9px] text-slate-400 uppercase block">Bankroll</span>
              <span className="text-xs font-bold text-emerald-400">
                {currencySymbol}{playerCash.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= 4-GAME CASINO NAVIGATION ================= */}
        <div className="grid grid-cols-4 bg-slate-900 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('BLACKJACK');
            }}
            className={`py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'BLACKJACK'
                ? 'bg-emerald-900/50 text-amber-300 border-b-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>♠️</span>
            <span>Blackjack</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('ROULETTE');
            }}
            className={`py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'ROULETTE'
                ? 'bg-emerald-900/50 text-amber-300 border-b-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎡</span>
            <span>Roulette</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('SLOTS');
            }}
            className={`py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'SLOTS'
                ? 'bg-emerald-900/50 text-amber-300 border-b-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎰</span>
            <span>777 Slots</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('DICE');
            }}
            className={`py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'DICE'
                ? 'bg-emerald-900/50 text-amber-300 border-b-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎲</span>
            <span>Dice</span>
          </button>
        </div>

        {/* ================= 1. ANIMATED BLACKJACK ================= */}
        {activeTab === 'BLACKJACK' && (
          <div className="p-4 bg-gradient-to-b from-emerald-950 via-emerald-900/80 to-slate-950 border-b border-emerald-800/60 flex flex-col space-y-4">
            <div className="relative rounded-2xl bg-emerald-900/60 border-4 border-amber-900/80 p-4 shadow-inner flex flex-col justify-between min-h-[290px]">
              
              <div className="flex items-center justify-between text-[10px] text-amber-300/80 font-mono tracking-wider">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  DEALER STANDS ON 17 · PAYS 3:2
                </span>
                <span className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">
                  SHOE: {deck.length} CARDS
                </span>
              </div>

              {/* DEALER HAND */}
              <div className="my-2 text-center">
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-300 mb-1 flex items-center justify-center gap-1.5">
                  <span>Dealer Hand</span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 font-mono text-amber-300">
                    {dealerHand.length > 0
                      ? dealerRevealed || gameState !== 'PLAYER_TURN'
                        ? dealerScore
                        : `${dealerScore} + ?`
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-center gap-2 min-h-[82px] items-center">
                  {dealerHand.length === 0 ? (
                    <div className="w-14 h-20 rounded-xl border border-dashed border-emerald-600/50 flex items-center justify-center text-emerald-600 text-xs">
                      Dealer
                    </div>
                  ) : (
                    dealerHand.map((c, idx) => {
                      const isHoleCard = !dealerRevealed && idx === 1 && gameState === 'PLAYER_TURN';
                      const isRed = c.suit === '♥' || c.suit === '♦';

                      return (
                        <div
                          key={idx}
                          className={`w-14 h-20 rounded-xl flex flex-col justify-between p-1.5 shadow-xl transition-all duration-300 transform ${
                            isHoleCard
                              ? 'bg-gradient-to-br from-blue-900 to-indigo-950 border-2 border-blue-500 text-blue-300'
                              : `bg-white ${isRed ? 'text-red-600' : 'text-slate-900'} border-2 border-amber-200`
                          }`}
                        >
                          {isHoleCard ? (
                            <div className="h-full flex flex-col items-center justify-center text-base font-black">
                              <span>🂠</span>
                              <span className="text-[9px] font-sans opacity-70">HOLE</span>
                            </div>
                          ) : (
                            <>
                              <div className="text-left font-black text-xs leading-none">
                                {c.value}
                                <span className="block text-[10px]">{c.suit}</span>
                              </div>
                              <div className="text-center text-lg">{c.suit}</div>
                              <div className="text-right font-black text-xs leading-none">
                                {c.value}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* BET INDICATOR */}
              <div className="my-1 flex items-center justify-center">
                <div className="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/60 shadow-lg flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 border border-white text-[9px] text-slate-950 font-black flex items-center justify-center shadow">
                    🪙
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300">
                    BET: {currencySymbol}{bet.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* PLAYER HAND */}
              <div className="my-2 text-center">
                <div className="flex justify-center gap-2 min-h-[82px] items-center">
                  {playerHand.length === 0 ? (
                    <div className="w-14 h-20 rounded-xl border border-dashed border-emerald-600/50 flex items-center justify-center text-emerald-600 text-xs">
                      Player
                    </div>
                  ) : (
                    playerHand.map((c, idx) => {
                      const isRed = c.suit === '♥' || c.suit === '♦';
                      return (
                        <div
                          key={idx}
                          className={`w-14 h-20 rounded-xl flex flex-col justify-between p-1.5 shadow-xl transition-all duration-300 transform bg-white ${
                            isRed ? 'text-red-600' : 'text-slate-900'
                          } border-2 border-amber-200`}
                        >
                          <div className="text-left font-black text-xs leading-none">
                            {c.value}
                            <span className="block text-[10px]">{c.suit}</span>
                          </div>
                          <div className="text-center text-lg">{c.suit}</div>
                          <div className="text-right font-black text-xs leading-none">
                            {c.value}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-300 mt-1 flex items-center justify-center gap-1.5">
                  <span>Your Hand</span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 font-mono text-amber-300">
                    {playerHand.length > 0 ? playerScore : '—'}
                  </span>
                </div>
              </div>

              {resultMessage && (
                <div
                  className={`p-2 rounded-xl text-center text-xs font-black shadow-lg transition-all animate-bounce ${
                    resultMessage.includes('won') || resultMessage.includes('win') || resultMessage.includes('BLACKJACK')
                      ? 'bg-emerald-500 text-slate-950 border border-white'
                      : resultMessage.includes('Bust') || resultMessage.includes('wins')
                      ? 'bg-red-600 text-white border border-red-400'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {resultMessage}
                </div>
              )}
            </div>

            {/* CONTROLS */}
            {gameState === 'BETTING' || gameState === 'ROUND_OVER' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {chipDenominations.map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        playChipSound();
                        setBet(val);
                      }}
                      className={`px-3 py-1.5 rounded-full font-mono text-xs font-black border transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-1 ${
                        bet === val
                          ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400'
                          : 'bg-emerald-950/80 text-emerald-200 border-emerald-600/60 hover:bg-emerald-900'
                      }`}
                    >
                      <span>🪙</span>
                      <span>{currencySymbol}{val}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={startBlackjackRound}
                  disabled={playerCash < bet}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>♠️</span>
                  <span>DEAL CARDS ({currencySymbol}{bet.toLocaleString()})</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={hit}
                  disabled={gameState !== 'PLAYER_TURN' || isDealingAnimation}
                  className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  HIT ➕
                </button>

                <button
                  onClick={stand}
                  disabled={gameState !== 'PLAYER_TURN' || isDealingAnimation}
                  className="py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-xs shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  STAND ✋
                </button>

                <button
                  onClick={doubleDown}
                  disabled={gameState !== 'PLAYER_TURN' || playerCash < bet * 2 || playerHand.length !== 2 || isDealingAnimation}
                  className="py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black text-xs shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  DOUBLE 2x 💰
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= 2. FULL-WHEEL ROULETTE ================= */}
        {activeTab === 'ROULETTE' && (
          <div className="p-4 bg-gradient-to-b from-stone-950 via-slate-900 to-stone-950 border-b border-stone-800 flex flex-col space-y-4">
            
            {/* THE FULL ROULETTE WHEEL (SVG 360-DEGREE FULL WHEEL) */}
            <div className="relative rounded-2xl bg-gradient-to-b from-stone-900 via-black to-stone-950 border-4 border-amber-600/80 p-3 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
              
              <div className="w-full flex items-center justify-between text-[11px] text-amber-300 font-mono mb-1">
                <span>EUROPEAN ROULETTE</span>
                <span>37 FULL POCKETS (0 - 36)</span>
              </div>

              {/* SVG Full Wheel Container */}
              <div className="relative w-64 h-64 flex items-center justify-center my-1">
                {/* Top Center Needle Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[14px] border-t-amber-400 drop-shadow-lg" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-200 -mt-1 shadow" />
                </div>

                {/* Rotating Wheel Group */}
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-full drop-shadow-2xl transition-transform"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: isSpinningRoulette ? '3.2s' : '0s',
                    transitionTimingFunction: 'cubic-bezier(0.12, 0.9, 0.22, 1)',
                  }}
                >
                  {/* Outer Brass/Wood Rim */}
                  <circle cx="150" cy="150" r="148" fill="#451a03" stroke="#d97706" strokeWidth="4" />
                  <circle cx="150" cy="150" r="140" fill="#1c1917" stroke="#78350f" strokeWidth="2" />
                  <circle cx="150" cy="150" r="128" fill="#0c0a09" />

                  {/* 37 Distinct Numbered Slices */}
                  {ROULETTE_NUMBERS.map((num, i) => {
                    const step = 360 / 37;
                    const startAngle = i * step;
                    const endAngle = (i + 1) * step;
                    const isGreen = num === 0;
                    const isRed = RED_NUMBERS.has(num);
                    const sliceColor = isGreen ? '#15803d' : isRed ? '#dc2626' : '#18181b';

                    const slicePath = describeArcSlice(150, 150, 70, 126, startAngle, endAngle);
                    const textAngle = startAngle + step / 2;
                    const textPos = polarToCartesian(150, 150, 98, textAngle);

                    const isWinner = rouletteWinningNumber === num;

                    return (
                      <g key={num}>
                        <path
                          d={slicePath}
                          fill={isWinner ? (isGreen ? '#22c55e' : isRed ? '#ef4444' : '#3f3f46') : sliceColor}
                          stroke={isWinner ? '#facc15' : '#d97706'}
                          strokeWidth={isWinner ? '3' : '0.8'}
                        />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          fill={isWinner ? '#fef08a' : '#ffffff'}
                          fontSize={isWinner ? '10.5' : '9.5'}
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle}, ${textPos.x}, ${textPos.y})`}
                        >
                          {num}
                        </text>

                        {/* Physical Ivory Ball locked inside the winning pocket upon landing */}
                        {isWinner && (
                          <g>
                            <circle
                              cx={textPos.x}
                              cy={textPos.y}
                              r="13"
                              fill="rgba(250, 204, 21, 0.4)"
                              stroke="#facc15"
                              strokeWidth="2"
                            />
                            <circle
                              cx={textPos.x}
                              cy={textPos.y}
                              r="5.5"
                              fill="#ffffff"
                              stroke="#cbd5e1"
                              strokeWidth="1.5"
                            />
                            <circle cx={textPos.x - 1.5} cy={textPos.y - 1.5} r="1.5" fill="#f8fafc" />
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Center Brass Turret & Hub */}
                  <circle cx="150" cy="150" r="68" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="150" cy="150" r="50" fill="#b45309" stroke="#fbbf24" strokeWidth="2" />
                  <circle cx="150" cy="150" r="26" fill="#f59e0b" />
                  {/* Turret prongs */}
                  <line x1="150" y1="110" x2="150" y2="190" stroke="#fef3c7" strokeWidth="3" />
                  <line x1="110" y1="150" x2="190" y2="150" stroke="#fef3c7" strokeWidth="3" />
                  <circle cx="150" cy="150" r="8" fill="#ffffff" />
                </svg>

                {/* The Animated Ivory Ball Moving in Track (During Active Spin) */}
                {isSpinningRoulette && (
                  <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center transition-transform"
                    style={{
                      transform: `rotate(${ballOrbitAngle}deg)`,
                      transitionDuration: '3.2s',
                      transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-2xl transition-all"
                      style={{
                        transform: `translateY(-${ballRadius}px)`,
                        transitionDuration: '0.6s',
                      }}
                    />
                  </div>
                )}

                {/* Landed Number Spotlight Center Badge */}
                {rouletteWinningNumber !== null && (
                  <div className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-black/90 border border-amber-400 text-center animate-in zoom-in-75">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Landed</div>
                    <div
                      className={`text-xl font-black font-mono ${
                        rouletteWinningNumber === 0
                          ? 'text-emerald-400'
                          : RED_NUMBERS.has(rouletteWinningNumber)
                          ? 'text-red-400'
                          : 'text-white'
                      }`}
                    >
                      {rouletteWinningNumber}
                    </div>
                  </div>
                )}
              </div>

              {rouletteResultText && (
                <div
                  className={`mt-2 p-2 rounded-xl text-center text-xs font-black shadow ${
                    rouletteResultText.includes('WINNER')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {rouletteResultText}
                </div>
              )}
            </div>

            {/* ROULETTE BETTING FELT */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-xs font-black">
                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('RED');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === 'RED'
                      ? 'bg-red-600 text-white ring-2 ring-amber-400 shadow-lg'
                      : 'bg-red-950/80 text-red-200 border border-red-700/60'
                  }`}
                >
                  RED
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('BLACK');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === 'BLACK'
                      ? 'bg-slate-900 text-white ring-2 ring-amber-400 shadow-lg border border-slate-700'
                      : 'bg-black/80 text-slate-300 border border-slate-800'
                  }`}
                >
                  BLACK
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('EVEN');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === 'EVEN'
                      ? 'bg-emerald-600 text-white ring-2 ring-amber-400 shadow-lg'
                      : 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60'
                  }`}
                >
                  EVEN
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('ODD');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === 'ODD'
                      ? 'bg-emerald-600 text-white ring-2 ring-amber-400 shadow-lg'
                      : 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60'
                  }`}
                >
                  ODD
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('1-18');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === '1-18'
                      ? 'bg-indigo-600 text-white ring-2 ring-amber-400 shadow-lg'
                      : 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/60'
                  }`}
                >
                  1 - 18
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('19-36');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    rouletteBetType === '19-36'
                      ? 'bg-indigo-600 text-white ring-2 ring-amber-400 shadow-lg'
                      : 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/60'
                  }`}
                >
                  19 - 36
                </button>
              </div>

              {/* Single Straight Number Option */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    playClickSound();
                    setRouletteBetType('STRAIGHT');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    rouletteBetType === 'STRAIGHT'
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Single Number
                </button>

                <select
                  value={rouletteStraightNum}
                  onChange={(e) => setRouletteStraightNum(Number(e.target.value))}
                  disabled={rouletteBetType !== 'STRAIGHT'}
                  className="p-1 rounded bg-black border border-slate-700 text-xs font-mono text-amber-300"
                >
                  {ROULETTE_NUMBERS.map((n) => (
                    <option key={n} value={n}>
                      Pocket {n} ({n === 0 ? 'Green' : RED_NUMBERS.has(n) ? 'Red' : 'Black'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chip buttons */}
              <div className="flex gap-2 justify-center pt-1">
                {[25, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      playChipSound();
                      setRouletteBetAmount(amt);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer ${
                      rouletteBetAmount === amt
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {currencySymbol}{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={spinFullWheelRoulette}
                disabled={isSpinningRoulette || playerCash < rouletteBetAmount}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-red-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                <span>🎡</span>
                <span>{isSpinningRoulette ? 'SPINNING FULL WHEEL...' : `SPIN ROULETTE (${currencySymbol}${rouletteBetAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. ANIMATED 777 SLOTS ================= */}
        {activeTab === 'SLOTS' && (
          <div className="p-4 bg-gradient-to-b from-stone-950 via-slate-900 to-stone-950 border-b border-stone-800 flex flex-col space-y-4">
            <div className="relative rounded-3xl bg-gradient-to-b from-amber-600 via-amber-950 to-stone-950 border-4 border-amber-400 p-4 shadow-2xl flex items-center justify-between">
              
              <div className="absolute top-2 left-4 right-4 flex justify-between text-xs pointer-events-none">
                <span className="animate-ping">💡</span>
                <span className="text-[10px] font-black uppercase text-amber-200 tracking-widest">
                  ★ DIAMOND 777 ★
                </span>
                <span className="animate-ping">💡</span>
              </div>

              <div className="flex-1 mt-6 mr-4 p-3 bg-black rounded-2xl border-4 border-amber-500 shadow-inner flex items-center justify-around overflow-hidden">
                {slotReels.map((symbol, idx) => (
                  <div
                    key={idx}
                    className={`w-20 h-24 rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/60 shadow-lg flex items-center justify-center text-4xl transition-all ${
                      slotSpinning[idx] ? 'blur-xs scale-95 opacity-80 animate-pulse' : 'scale-100'
                    }`}
                  >
                    <span>{symbol}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center pt-6">
                <div
                  onClick={pullSlotLever}
                  className={`w-6 h-28 bg-stone-700 rounded-full border-2 border-stone-500 flex flex-col items-center justify-start cursor-pointer transition-transform duration-200 active:scale-90 ${
                    leverPulled ? 'translate-y-8 rotate-12' : ''
                  }`}
                  title="Click to pull slot lever!"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white shadow-xl -mt-2 flex items-center justify-center text-xs font-bold text-white hover:bg-red-500 transition-colors">
                    PULL
                  </div>
                  <div className="w-2 h-16 bg-gradient-to-b from-stone-400 to-stone-800 rounded-full mt-1" />
                </div>
              </div>
            </div>

            {slotWinBanner && (
              <div
                className={`p-2.5 rounded-xl text-center text-xs font-black shadow transition-all animate-bounce ${
                  slotWinBanner.includes('JACKPOT') || slotWinBanner.includes('Won')
                    ? 'bg-amber-400 text-slate-950 border border-white'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {slotWinBanner}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2 justify-center">
                {[10, 25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      playChipSound();
                      setSlotBet(amt);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer ${
                      slotBet === amt
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {currencySymbol}{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={pullSlotLever}
                disabled={isSpinningSlots || playerCash < slotBet}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>🎰</span>
                <span>{isSpinningSlots ? 'SPINNING REELS...' : `SPIN SLOTS (${currencySymbol}${slotBet})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= 4. VEGAS CRAPS / DICE ================= */}
        {activeTab === 'DICE' && (
          <div className="p-4 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 border-b border-emerald-800/60 flex flex-col space-y-4">
            
            {/* Craps Table Felt with Tumbling Dice */}
            <div className="relative h-44 rounded-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-900 border-4 border-amber-800/80 p-4 shadow-inner flex flex-col items-center justify-between">
              
              <div className="text-[11px] font-mono font-bold text-amber-300">
                VEGAS CRAPS & DICE TABLE
              </div>

              {/* The 2 Tumbling Dice */}
              <div className="flex items-center gap-6 my-2">
                {diceValues.map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-16 h-16 rounded-2xl bg-white text-slate-950 border-2 border-slate-300 shadow-2xl flex items-center justify-center text-3xl font-black transition-all ${
                      isRollingDice ? 'animate-spin scale-110' : 'scale-100'
                    }`}
                  >
                    {val === 1 && '⚀'}
                    {val === 2 && '⚁'}
                    {val === 3 && '⚂'}
                    {val === 4 && '⚃'}
                    {val === 5 && '⚄'}
                    {val === 6 && '⚅'}
                  </div>
                ))}
              </div>

              <div className="text-xs font-mono font-bold text-emerald-300">
                TOTAL: {diceValues[0] + diceValues[1]}
              </div>
            </div>

            {diceResultText && (
              <div
                className={`p-2.5 rounded-xl text-center text-xs font-black shadow ${
                  diceResultText.includes('WIN')
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {diceResultText}
              </div>
            )}

            {/* DICE BET OPTIONS */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5 text-xs font-black">
                <button
                  onClick={() => {
                    playClickSound();
                    setDiceType('OVER7');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    diceType === 'OVER7'
                      ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-white shadow'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  Over 7
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setDiceType('7');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    diceType === '7'
                      ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-white shadow'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  Lucky 7
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setDiceType('UNDER7');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    diceType === 'UNDER7'
                      ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-white shadow'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  Under 7
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    setDiceType('DOUBLES');
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    diceType === 'DOUBLES'
                      ? 'bg-purple-500 text-white font-bold ring-2 ring-white shadow'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  Doubles
                </button>
              </div>

              <div className="flex gap-2 justify-center pt-1">
                {[25, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      playChipSound();
                      setDiceBet(amt);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer ${
                      diceBet === amt
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {currencySymbol}{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={rollDice}
                disabled={isRollingDice || playerCash < diceBet}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                <span>🎲</span>
                <span>{isRollingDice ? 'ROLLING DICE...' : `ROLL DICE (${currencySymbol}${diceBet})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
