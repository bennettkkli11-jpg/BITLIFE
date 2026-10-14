import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Character, KendamaItem, KendamaBrand } from '../../types/bitlife';
import {
  KENDAMA_CATALOG,
  KENDAMA_TRICKS,
  NAKO_DIVISIONS,
  KendamaCatalogItem,
  KendamaTrick,
  NakoDivision,
} from '../../data/kendamas';
import { clamp, randomInt, pickRandom } from '../../utils/lifeEngine';
import {
  playCashSound,
  playClickSound,
  playFailSound,
  playSuccessSound,
} from '../../utils/audio';

interface KendamaModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onClose: () => void;
  initialTab?: 'BAG' | 'SHOP' | 'NAKO';
}

type TabType = 'BAG' | 'SHOP' | 'NAKO' | 'TRICKS';

export const KendamaModal: React.FC<KendamaModalProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onClose,
  initialTab = 'BAG',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Equipped / selected kendama in bag
  const playerKendamas = character.kendamas || [];
  const [selectedKendamaId, setSelectedKendamaId] = useState<string | null>(
    playerKendamas.length > 0 ? playerKendamas[0].id : null
  );

  // Trick practice states
  const [practicingTrick, setPracticingTrick] = useState<KendamaTrick | null>(null);
  const [trickResult, setTrickResult] = useState<{
    success: boolean;
    trickName: string;
    details: string;
  } | null>(null);

  // NAKO competition states
  const [competingDivision, setCompetingDivision] = useState<NakoDivision | null>(null);
  const [nakoCompResult, setNakoCompResult] = useState<{
    placed1st: boolean;
    score: number;
    title: string;
    description: string;
    prize: number;
  } | null>(null);

  // Matt Sweets Jorgensen Encounter state
  const [meetingJorgensen, setMeetingJorgensen] = useState(false);
  const [kenGameState, setKenGameState] = useState<{
    playerLetters: string; // e.g. "K", "KE", "KEN"
    mattLetters: string;
    round: number;
    log: string[];
    gameOver: boolean;
    winner: 'PLAYER' | 'MATT' | null;
  } | null>(null);
  const [jorgensenOutcome, setJorgensenOutcome] = useState<string | null>(null);

  const currentSkill = character.kendamaSkill || 0;

  // Selected kendama object
  const activeKendama =
    playerKendamas.find((k) => k.id === selectedKendamaId) || playerKendamas[0] || null;

  // Helper for skill rank
  const getSkillRankTitle = (skill: number) => {
    if (skill >= 95) return '👑 NAKO Legend & Kendama Master';
    if (skill >= 80) return '🔥 Kendama Samurai / Freestyle Icon';
    if (skill >= 60) return '⚡ Pro Slinger / Team Rider';
    if (skill >= 40) return '🎯 Flow Master';
    if (skill >= 20) return '🪀 Cup Hopper';
    return '🌱 Novice Slinger';
  };

  // 1. BUY KENDAMA
  const handleBuyKendama = (item: KendamaCatalogItem) => {
    playClickSound();
    if (character.money < item.price) {
      setFeedbackMsg(`You need ${character.currencySymbol}${item.price} to buy the ${item.name}.`);
      return;
    }

    playCashSound();
    playSuccessSound();

    const newKendama: KendamaItem = {
      id: 'dama_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: item.name,
      brand: item.brand,
      wood: item.wood,
      coating: item.coating,
      condition: item.condition,
      price: item.price,
      timesPlayed: 0,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - item.price,
      kendamas: [...(prev.kendamas || []), newKendama],
      happiness: clamp(prev.happiness + 12),
      smarts: clamp(prev.smarts + 2),
    }));

    onAddLog(`I bought a brand new ${item.name} (${item.brand}) for ${character.currencySymbol}${item.price}.`);
    setFeedbackMsg(`Purchased ${item.name}! Added to your Kendama Bag! 🎯`);
    setSelectedKendamaId(newKendama.id);
  };

  // 2. FREE STARTER KENDAMA IF EMPTY
  const handleClaimFreeStarter = () => {
    playClickSound();
    playSuccessSound();
    const starter: KendamaItem = {
      id: 'dama_starter_' + Date.now(),
      name: 'Sweets Starter Beech',
      brand: 'Sweets Kendamas',
      wood: 'Natural Beech Wood',
      coating: 'Prime Sticky Clear',
      condition: 100,
      price: 25,
      timesPlayed: 0,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      kendamas: [starter],
      kendamaSkill: Math.max(prev.kendamaSkill || 0, 5),
      happiness: clamp(prev.happiness + 15),
    }));

    onAddLog('I received my first Sweets Kendama! Time to learn some tricks!');
    setSelectedKendamaId(starter.id);
    setFeedbackMsg('You unboxed your first Sweets Kendama! Welcome to the dama community! 🎯');
  };

  // 3. PRACTICE TRICK
  const handlePracticeTrick = (trick: KendamaTrick) => {
    if (!activeKendama) {
      setFeedbackMsg('Equip or buy a Kendama first before attempting tricks!');
      return;
    }

    playClickSound();
    setPracticingTrick(trick);

    // Calculate success chance
    const conditionMultiplier = activeKendama.condition / 100;
    const baseChance = Math.min(
      95,
      Math.max(10, currentSkill + 30 - trick.difficulty + (activeKendama.signedByMattJorgensen ? 10 : 0))
    );
    const finalChance = baseChance * conditionMultiplier;
    const roll = Math.random() * 100;
    const success = roll <= finalChance;

    // Degrade kendama condition slightly with each session
    const conditionDrop = randomInt(1, 4);

    if (success) {
      playSuccessSound();
      const xpGained = randomInt(3, trick.xpGain);
      const newSkill = clamp(currentSkill + xpGained);

      onUpdateCharacter((prev) => {
        const updatedDamas = (prev.kendamas || []).map((k) =>
          k.id === activeKendama.id
            ? {
                ...k,
                condition: Math.max(10, k.condition - conditionDrop),
                timesPlayed: (k.timesPlayed || 0) + 1,
              }
            : k
        );
        return {
          ...prev,
          kendamaSkill: newSkill,
          kendamas: updatedDamas,
          happiness: clamp(prev.happiness + 8),
          smarts: clamp(prev.smarts + 3),
          health: clamp(prev.health + 2),
        };
      });

      setTrickResult({
        success: true,
        trickName: trick.name,
        details: `Laced it first try! The click was so satisfying. (+${xpGained} Kendama Skill)`,
      });
      onAddLog(`I laced ${trick.name} (${trick.japaneseName}) with my ${activeKendama.name}!`);
    } else {
      playFailSound();
      onUpdateCharacter((prev) => {
        const updatedDamas = (prev.kendamas || []).map((k) =>
          k.id === activeKendama.id
            ? {
                ...k,
                condition: Math.max(10, k.condition - conditionDrop),
                timesPlayed: (k.timesPlayed || 0) + 1,
              }
            : k
        );
        return {
          ...prev,
          kendamas: updatedDamas,
          kendamaSkill: clamp(currentSkill + 1), // small XP even on miss
          happiness: clamp(prev.happiness - 2),
        };
      });

      setTrickResult({
        success: false,
        trickName: trick.name,
        details: `Missed the cup! The tama pinged off the rim, but you learned the timing. (+1 Skill)`,
      });
    }
  };

  // 4. RESTORE / WAX KENDAMA
  const handleRestringAndWax = () => {
    if (!activeKendama) return;
    playClickSound();
    playCashSound();
    const cost = 10;
    if (character.money < cost) {
      setFeedbackMsg(`Need ${character.currencySymbol}${cost} to buy fresh string and beeswax.`);
      return;
    }

    onUpdateCharacter((prev) => {
      const updatedDamas = (prev.kendamas || []).map((k) =>
        k.id === activeKendama.id ? { ...k, condition: 100 } : k
      );
      return {
        ...prev,
        money: prev.money - cost,
        kendamas: updatedDamas,
        happiness: clamp(prev.happiness + 6),
      };
    });

    playSuccessSound();
    setFeedbackMsg(`Restrung and treated ${activeKendama.name} with fresh string & beeswax! Condition restored to 100%! ✨`);
  };

  // 5. COMPETE AT NAKO
  const handleCompeteNako = (div: NakoDivision) => {
    playClickSound();
    if (character.money < div.entryFee) {
      setFeedbackMsg(`You need ${character.currencySymbol}${div.entryFee} for the NAKO entry registration fee.`);
      return;
    }
    if (!activeKendama) {
      setFeedbackMsg('You need a kendama to compete in the NAKO championship!');
      return;
    }

    setCompetingDivision(div);
    const scoreBase = currentSkill * 0.7 + (activeKendama.signedByMattJorgensen ? 10 : 0);
    const runPerformance = randomInt(50, 100);
    const totalScore = Math.round(scoreBase + runPerformance * 0.3);

    // Win condition check
    const won = totalScore >= div.recommendedSkill + 15;

    if (won) {
      playSuccessSound();
      playCashSound();
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 } });
      } catch {}

      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money - div.entryFee + div.prizeMoney,
        fame: clamp(prev.fame + div.fameReward),
        happiness: clamp(prev.happiness + 35),
        nakoTitlesWon: (prev.nakoTitlesWon || 0) + 1,
        kendamaSkill: clamp(currentSkill + 12),
      }));

      onAddLog(
        `🏆 I WON 1st Place in the North American Kendama Open (${div.name})! Won ${div.trophyName} and ${character.currencySymbol}${div.prizeMoney.toLocaleString()} prize money!`
      );

      setNakoCompResult({
        placed1st: true,
        score: totalScore,
        title: `1st Place Champion! 🏆`,
        description: `You stomped your run on the center stage under the bright lights in Minneapolis! The crowd erupted into deafening cheers! You were awarded the ${div.trophyName}!`,
        prize: div.prizeMoney,
      });
    } else {
      playFailSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money - div.entryFee,
        happiness: clamp(prev.happiness - 5),
        kendamaSkill: clamp(currentSkill + 5), // valuable experience
      }));

      onAddLog(`I competed in the NAKO (${div.name}) and placed among the top finalists with a score of ${totalScore}.`);
      setNakoCompResult({
        placed1st: false,
        score: totalScore,
        title: 'NAKO Finalist!',
        description: `You put on an impressive display of kendama tricks with a score of ${totalScore}/100. Other pro riders edged ahead, but your flow earned big respect in the community!`,
        prize: 0,
      });
    }
  };

  // 6. ENCOUNTER MATT "SWEETS" JORGENSEN AT NAKO
  // Choice A: Lace trick for Matt
  const handleLaceTrickForMatt = () => {
    playClickSound();
    const success = currentSkill >= 30 || Math.random() < 0.55;

    if (success) {
      playSuccessSound();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.3 } });
      } catch {}

      // Gift a special prototype Sweets Kendama if they don't have one
      const prototypeDama: KendamaItem = {
        id: 'sweets_proto_' + Date.now(),
        name: 'Sweets NAKO Special Prototype (Hand-Signed)',
        brand: 'Sweets Kendamas',
        wood: 'Maple & Purpleheart Honeycomb',
        coating: 'Cushion Clear 2.0',
        condition: 100,
        price: 250,
        signedByMattJorgensen: true,
        timesPlayed: 0,
      };

      onUpdateCharacter((prev) => ({
        ...prev,
        happiness: clamp(prev.happiness + 35),
        fame: clamp(prev.fame + 18),
        kendamaSkill: clamp(currentSkill + 10),
        kendamas: [...(prev.kendamas || []), prototypeDama],
        celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
      }));

      onAddLog(
        `I met Matt "Sweets" Jorgensen at NAKO and laced an insane trick for him! He yelled "LET'S GOOO!" and gifted me a hand-signed Sweets Prototype Kendama!`
      );

      setJorgensenOutcome(
        `Matt's jaw dropped: "ARE YOU KIDDING ME?! Cleanest lace in Minneapolis! You got absolute ice in your veins!" He slapped a high-five, signed an exclusive prototype Sweets kendama with a gold pen, and handed it to you on the spot!`
      );
    } else {
      playFailSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        happiness: clamp(prev.happiness + 15),
        kendamaSkill: clamp(currentSkill + 4),
        celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
      }));

      onAddLog(`I attempted a trick for Matt Jorgensen at NAKO. He smiled, offered tips on knee bend, and cheered me on.`);
      setJorgensenOutcome(
        `You missed the spike by a millimeter, but Matt smiled and gave you a fist bump: "The knees! Bend the knees more and catch it soft! You got that next try, homie. Keep spreading kendama love!"`
      );
    }
  };

  // Choice B: Start Game of KEN with Matt
  const handleStartGameOfKen = () => {
    playClickSound();
    setKenGameState({
      playerLetters: '',
      mattLetters: '',
      round: 1,
      log: ['Game of KEN started against Matt "Sweets" Jorgensen! Calling tricks back and forth.'],
      gameOver: false,
      winner: null,
    });
  };

  const handlePlayKenTurn = () => {
    if (!kenGameState || kenGameState.gameOver) return;
    playClickSound();

    const letters = ['K', 'E', 'N'];
    const playerWinRoundChance = Math.min(85, Math.max(25, currentSkill * 0.7));
    const playerScored = Math.random() * 100 < playerWinRoundChance;

    let nextPlayerLetters = kenGameState.playerLetters;
    let nextMattLetters = kenGameState.mattLetters;
    const roundNumber = kenGameState.round;
    let turnLog = '';

    if (playerScored) {
      // Matt gets a letter
      const nextLetterIdx = nextMattLetters.length;
      if (nextLetterIdx < letters.length) {
        nextMattLetters += letters[nextLetterIdx];
      }
      turnLog = `Round ${roundNumber}: You set a wicked Lunar Flip! Matt missed the spike and got letter "${letters[nextLetterIdx]}"!`;
    } else {
      // Player gets a letter
      const nextLetterIdx = nextPlayerLetters.length;
      if (nextLetterIdx < letters.length) {
        nextPlayerLetters += letters[nextLetterIdx];
      }
      turnLog = `Round ${roundNumber}: Matt set a rapid Bird-to-Nightingale combo! You dropped the tama and got letter "${letters[nextLetterIdx]}"!`;
    }

    const playerLost = nextPlayerLetters === 'KEN';
    const mattLost = nextMattLetters === 'KEN';

    if (playerLost || mattLost) {
      const winner = mattLost ? 'PLAYER' : 'MATT';
      if (winner === 'PLAYER') {
        playSuccessSound();
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
        } catch {}
        onUpdateCharacter((prev) => ({
          ...prev,
          happiness: clamp(prev.happiness + 40),
          fame: clamp(prev.fame + 25),
          kendamaSkill: clamp(currentSkill + 15),
          celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
        }));
        onAddLog(`🔥 I DEFEATED Matt "Sweets" Jorgensen in a Game of KEN at the NAKO championship! The entire room went crazy!`);
      } else {
        playFailSound();
        onUpdateCharacter((prev) => ({
          ...prev,
          happiness: clamp(prev.happiness + 15),
          kendamaSkill: clamp(currentSkill + 6),
          celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
        }));
        onAddLog(`I played a heated Game of KEN against Matt Jorgensen at NAKO. He took the win with a whirlwind, but praised my style.`);
      }

      setKenGameState({
        playerLetters: nextPlayerLetters,
        mattLetters: nextMattLetters,
        round: roundNumber + 1,
        log: [turnLog, ...kenGameState.log],
        gameOver: true,
        winner,
      });
    } else {
      playClickSound();
      setKenGameState({
        playerLetters: nextPlayerLetters,
        mattLetters: nextMattLetters,
        round: roundNumber + 1,
        log: [turnLog, ...kenGameState.log],
        gameOver: false,
        winner: null,
      });
    }
  };

  // Choice C: Ask Matt to Sign Dama
  const handleAskAutograph = () => {
    if (!activeKendama) {
      setFeedbackMsg('Equip a kendama to get signed!');
      return;
    }
    playClickSound();
    playSuccessSound();

    onUpdateCharacter((prev) => {
      const updatedDamas = (prev.kendamas || []).map((k) =>
        k.id === activeKendama.id ? { ...k, signedByMattJorgensen: true, price: k.price * 5 } : k
      );
      return {
        ...prev,
        kendamas: updatedDamas,
        happiness: clamp(prev.happiness + 25),
        fame: clamp(prev.fame + 10),
        celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
      };
    });

    onAddLog(
      `Matt "Sweets" Jorgensen signed my ${activeKendama.name} with gold paint: "Spread Kendama Love! - Matt Sweets" ✍️`
    );

    setJorgensenOutcome(
      `Matt pulled out his gold metallic paint marker, signed the big cup and spike with the iconic Sweets arrow, and wrote: "Spread Kendama Love! - Matt Sweets". It is now a prized collector heirloom worth 5x its original value!`
    );
  };

  // Choice D: Audition for Team Sweets Kendamas Pro Squad
  const handleAuditionTeamSweets = () => {
    playClickSound();
    const canJoin = currentSkill >= 55 || (character.nakoTitlesWon && character.nakoTitlesWon > 0);

    if (canJoin) {
      playSuccessSound();
      playCashSound();
      try {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.25 } });
      } catch {}

      const signingBonus = 5000;
      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money + signingBonus,
        fame: clamp(prev.fame + 30),
        happiness: clamp(prev.happiness + 45),
        kendamaSkill: clamp(currentSkill + 10),
        celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
      }));

      onAddLog(
        `🌟 I WAS SIGNED TO TEAM SWEETS KENDAMAS AS AN OFFICIAL PRO RIDER by Matt Jorgensen! Received ${character.currencySymbol}${signingBonus.toLocaleString()} signing bonus!`
      );

      setJorgensenOutcome(
        `Matt shook your hand with tears of pride: "Welcome to the family. You embody everything Sweets Kendamas stands for: insane skill, creativity, and community love!" He handed you an official Team Sweets jersey, your own custom pro model contract, and a ${character.currencySymbol}${signingBonus.toLocaleString()} signing bonus!`
      );
    } else {
      playFailSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        happiness: clamp(prev.happiness + 10),
        kendamaSkill: clamp(currentSkill + 5),
        celebrityInteractions: (prev.celebrityInteractions || 0) + 1,
      }));

      onAddLog(`I auditioned for Team Sweets at NAKO. Matt encouraged me to keep practicing and try again next year.`);
      setJorgensenOutcome(
        `Matt patted your shoulder encouragingly: "You've got tremendous heart and raw rhythm! Keep grinding your tricks, hit 55+ skill or win a NAKO bracket, and the Sweets squad spot will be waiting for you!"`
      );
    }
  };

  // Filter catalog
  const filteredCatalog = KENDAMA_CATALOG.filter((item) => {
    if (selectedBrandFilter === 'ALL') return true;
    return item.brand === selectedBrandFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-950 border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <header className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/70 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 shadow-inner">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-amber-300">
                  Kendama Universe & NAKO
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Sweets • Krom • Yuntrove
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Skill Toy Sport • Hand-Eye Mastery • North American Kendama Open
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 font-semibold cursor-pointer"
          >
            ✕ Close
          </button>
        </header>

        {/* Global Stats Ribbon */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">
              Rank: <span className="text-amber-400 font-bold">{getSkillRankTitle(currentSkill)}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              Skill: <span className="text-emerald-400 font-mono font-bold">{currentSkill}/100</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              NAKO Titles: <span className="text-amber-300 font-bold font-mono">🏆 {character.nakoTitlesWon || 0}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              Cash:{' '}
              <span className="text-emerald-400 font-mono font-bold">
                {character.currencySymbol}
                {character.money.toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 text-xs">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('BAG');
            }}
            className={`flex-1 py-3 font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'BAG'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎒</span> My Kendamas ({playerKendamas.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('SHOP');
            }}
            className={`flex-1 py-3 font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'SHOP'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛒</span> Pro Shop (Sweets, Krom, Yuntrove)
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('NAKO');
            }}
            className={`flex-1 py-3 font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'NAKO'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏆</span> NAKO Championship & Sweets
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('TRICKS');
            }}
            className={`flex-1 py-3 font-bold transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'TRICKS'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📜</span> Trick Book
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <aside
            aria-live="polite"
            className="mx-4 mt-3 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex justify-between items-center"
          >
            <span>{feedbackMsg}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-[11px] font-bold text-amber-400 hover:text-white px-2 py-0.5"
            >
              ✕
            </button>
          </aside>
        )}

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: MY KENDAMAS */}
          {activeTab === 'BAG' && (
            <div className="space-y-4">
              {playerKendamas.length === 0 ? (
                <div className="text-center py-10 space-y-4 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
                  <div className="text-5xl">🪀</div>
                  <h4 className="text-base font-bold text-slate-200">Your Kendama Bag is Empty</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Kendama is a game of patience, community, and flow. Claim your complimentary starter Sweets Kendama to begin your journey, or check out top models from Sweets, KROM, and Yuntrove in the Pro Shop!
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleClaimFreeStarter}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950 cursor-pointer"
                    >
                      🎁 Claim Free Sweets Starter Dama
                    </button>
                    <button
                      onClick={() => setActiveTab('SHOP')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
                    >
                      Browse Pro Shop 🛒
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Active Equipped Kendama Card */}
                  {activeKendama && (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/40 shadow-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              {activeKendama.brand}
                            </span>
                            {activeKendama.signedByMattJorgensen && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-extrabold flex items-center gap-1">
                                ✍️ Signed by Matt Sweets Jorgensen
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-base text-white mt-1">
                            {activeKendama.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {activeKendama.wood} • {activeKendama.coating}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Condition</span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              activeKendama.condition > 70
                                ? 'text-emerald-400'
                                : activeKendama.condition > 30
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {activeKendama.condition}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar of condition */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            activeKendama.condition > 70
                              ? 'bg-emerald-500'
                              : activeKendama.condition > 30
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${activeKendama.condition}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">
                          Sessions played: <span className="font-mono text-white font-bold">{activeKendama.timesPlayed || 0}</span>
                        </span>
                        <button
                          onClick={handleRestringAndWax}
                          disabled={activeKendama.condition >= 98}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-amber-300 border border-slate-700 cursor-pointer"
                        >
                          Restring & Wax Dama ({character.currencySymbol}10) 🪢
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Practice Quick Tricks Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                        Practice Tricks with Equipped Dama
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Higher skill = cleaner lacing
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {KENDAMA_TRICKS.slice(0, 6).map((trick) => (
                        <button
                          key={trick.id}
                          onClick={() => handlePracticeTrick(trick)}
                          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xl">{trick.icon}</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              Diff: {trick.difficulty}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="font-bold text-xs text-white leading-tight">
                              {trick.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {trick.japaneseName}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {trickResult && (
                      <div
                        className={`p-3 rounded-2xl border text-xs font-medium mt-2 flex items-center justify-between ${
                          trickResult.success
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold">{trickResult.trickName}:</span>{' '}
                          {trickResult.details}
                        </div>
                        <button
                          onClick={() => setTrickResult(null)}
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Other kendamas in bag */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                      Switch Kendama ({playerKendamas.length})
                    </h4>
                    <div className="space-y-2">
                      {playerKendamas.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => {
                            playClickSound();
                            setSelectedKendamaId(k.id);
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            k.id === activeKendama?.id
                              ? 'bg-amber-950/30 border-amber-500/50 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {k.brand === 'Sweets Kendamas'
                                ? '🎯'
                                : k.brand === 'KROM Kendama'
                                ? '🇩🇰'
                                : '🍃'}
                            </span>
                            <div>
                              <div className="font-bold text-xs flex items-center gap-2">
                                <span>{k.name}</span>
                                {k.signedByMattJorgensen && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500 text-slate-950 font-bold">
                                    ✍️ Signed
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {k.brand} • {k.wood} • Condition: {k.condition}%
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                              k.id === activeKendama?.id
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {k.id === activeKendama?.id ? 'Equipped ✅' : 'Equip'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PRO SHOP */}
          {activeTab === 'SHOP' && (
            <div className="space-y-4">
              {/* Brand filter tabs */}
              <div className="flex gap-2 pb-1 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Brands' },
                  { id: 'Sweets Kendamas', label: '🎯 Sweets Kendamas' },
                  { id: 'KROM Kendama', label: '🇩🇰 KROM Kendama' },
                  { id: 'Yuntrove', label: '🍃 Yuntrove' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedBrandFilter(b.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedBrandFilter === b.id
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Catalog list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-2xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                          {item.icon}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-mono font-extrabold text-emerald-400">
                            {character.currencySymbol}
                            {item.price}
                          </span>
                          <span className="text-[10px] text-amber-400 block font-medium">
                            +{item.skillBonus} Skill
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {item.brand}
                        </span>
                        <h4 className="font-bold text-xs text-white">{item.name}</h4>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-xl space-y-0.5 font-mono">
                        <div>Wood: {item.wood}</div>
                        <div>Coating: {item.coating}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyKendama(item)}
                      disabled={character.money < item.price}
                      className="mt-3 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs shadow cursor-pointer transition-all active:scale-[0.98]"
                    >
                      {character.money >= item.price ? `Buy for ${character.currencySymbol}${item.price}` : 'Insufficient Cash'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NAKO CHAMPIONSHIP & MATT JORGENSEN */}
          {activeTab === 'NAKO' && (
            <div className="space-y-4">
              {/* NAKO Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-amber-500/50 shadow-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                      Minneapolis, Minnesota 🇺🇸
                    </span>
                    <h3 className="font-black text-lg text-white mt-1 flex items-center gap-2">
                      <span>🏆</span> North American Kendama Open (NAKO)
                    </h3>
                    <p className="text-xs text-slate-300 max-w-lg mt-1 leading-relaxed">
                      Founded and hosted by Matt &quot;Sweets&quot; Jorgensen and Sweets Kendamas. The biggest, most electric kendama championship in North America! Compete for prize money, fame, and gold championship rings!
                    </p>
                  </div>
                </div>

                {/* Meet Matt Sweets Jorgensen Encounter Banner */}
                <div className="mt-3 p-4 rounded-2xl bg-amber-950/70 border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <span className="text-4xl">🧢</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-300">
                        Meet Matt &quot;Sweets&quot; Jorgensen at NAKO!
                      </h4>
                      <p className="text-xs text-amber-100/80">
                        Matt is jamming backstage at the Sweets Booth spreading kendama love!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playClickSound();
                      setMeetingJorgensen(true);
                      setJorgensenOutcome(null);
                      setKenGameState(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer whitespace-nowrap"
                  >
                    Walk Up & Jam with Matt! 🎯
                  </button>
                </div>
              </div>

              {/* Interactive Meeting with Matt Sweets Jorgensen Modal Overlay */}
              {meetingJorgensen && (
                <div className="p-5 rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      <h4 className="font-black text-sm text-amber-300">
                        Backstage Jam with Matt &quot;Sweets&quot; Jorgensen
                      </h4>
                    </div>
                    <button
                      onClick={() => setMeetingJorgensen(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Back to Brackets
                    </button>
                  </div>

                  {jorgensenOutcome ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-100 leading-relaxed font-medium">
                        {jorgensenOutcome}
                      </div>
                      <button
                        onClick={() => setJorgensenOutcome(null)}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Keep Jamming with Matt 🎯
                      </button>
                    </div>
                  ) : kenGameState ? (
                    /* Minigame: Game of KEN against Matt */
                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Game of KEN (Round {kenGameState.round})</span>
                        <span className="text-slate-400">First to spell K-E-N loses</span>
                      </div>

                      {/* Letters display */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-blue-500/40">
                          <span className="text-[11px] text-slate-400 block">Your Letters</span>
                          <span className="text-2xl font-black font-mono tracking-widest text-rose-400">
                            {kenGameState.playerLetters || '---'}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/40">
                          <span className="text-[11px] text-slate-400 block">Matt&apos;s Letters</span>
                          <span className="text-2xl font-black font-mono tracking-widest text-amber-400">
                            {kenGameState.mattLetters || '---'}
                          </span>
                        </div>
                      </div>

                      {/* Battle Log */}
                      <div className="p-3 rounded-xl bg-slate-900/90 max-h-32 overflow-y-auto space-y-1 text-[11px] text-slate-300 font-mono">
                        {kenGameState.log.map((entry, idx) => (
                          <div key={idx} className="border-b border-slate-800/60 pb-0.5">
                            {entry}
                          </div>
                        ))}
                      </div>

                      {!kenGameState.gameOver ? (
                        <button
                          onClick={handlePlayKenTurn}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
                        >
                          Lace Trick for Next Round! 🪀
                        </button>
                      ) : (
                        <div className="text-center space-y-2">
                          <div
                            className={`font-black text-sm ${
                              kenGameState.winner === 'PLAYER' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {kenGameState.winner === 'PLAYER'
                              ? '🏆 YOU DEFEATED MATT JORGENSEN!'
                              : '👏 Good game! Matt took the victory!'}
                          </div>
                          <button
                            onClick={() => setKenGameState(null)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                          >
                            Return to Choices
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 4 Interactive Choices with Matt */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleLaceTrickForMatt}
                        className="p-3.5 rounded-2xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-2xl mb-1">⚡</div>
                        <div>
                          <div className="font-bold text-xs text-amber-300">
                            1. Lace a Trick for Matt
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">
                            Pull out your dama and show off your best combo. If you impress him, get an unreleased Sweets prototype!
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleStartGameOfKen}
                        className="p-3.5 rounded-2xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-2xl mb-1">⚔️</div>
                        <div>
                          <div className="font-bold text-xs text-amber-300">
                            2. Challenge Matt to Game of KEN
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">
                            Go head-to-head in a traditional trick-for-trick battle. First to spell K-E-N takes the L!
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleAskAutograph}
                        className="p-3.5 rounded-2xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-2xl mb-1">✍️</div>
                        <div>
                          <div className="font-bold text-xs text-amber-300">
                            3. Ask for Autograph on Dama
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">
                            Matt signs your equipped kendama with gold metallic ink: &quot;Spread Kendama Love&quot;. Multiplies value 5x!
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleAuditionTeamSweets}
                        className="p-3.5 rounded-2xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-2xl mb-1">🌟</div>
                        <div>
                          <div className="font-bold text-xs text-amber-300">
                            4. Audition for Team Sweets Pro Squad
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">
                            Audition for an official sponsorship contract with Sweets Kendamas! (Requires 55+ skill or NAKO trophy).
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* NAKO Brackets List */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                  NAKO Tournament Divisions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NAKO_DIVISIONS.map((div) => (
                    <div
                      key={div.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-xs text-white">{div.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            Prize: {character.currencySymbol}
                            {div.prizeMoney.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{div.subtitle}</p>
                        <div className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded-xl space-y-0.5 font-mono">
                          <div>Trophy: {div.trophyName}</div>
                          <div>Rec. Skill: {div.recommendedSkill}+</div>
                          <div>Fame Gain: +{div.fameReward}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompeteNako(div)}
                        disabled={character.money < div.entryFee}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs shadow cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Enter Bracket ({character.currencySymbol}{div.entryFee}) 🏆
                      </button>
                    </div>
                  ))}
                </div>

                {/* Competition result feedback */}
                {nakoCompResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 mt-2 ${
                      nakoCompResult.placed1st
                        ? 'bg-amber-950/70 border-amber-400 text-amber-100'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm">{nakoCompResult.title}</span>
                      <button
                        onClick={() => setNakoCompResult(null)}
                        className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    <p>{nakoCompResult.description}</p>
                    {nakoCompResult.prize > 0 && (
                      <div className="font-mono font-bold text-emerald-400">
                        Awarded: +{character.currencySymbol}
                        {nakoCompResult.prize.toLocaleString()} cash!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TRICK BOOK */}
          {activeTab === 'TRICKS' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                  Master Trick Encyclopedia
                </h4>
                <span className="text-[11px] text-slate-400">
                  {KENDAMA_TRICKS.length} Official Tricks
                </span>
              </div>

              <div className="space-y-2">
                {KENDAMA_TRICKS.map((trick) => {
                  const unlocked = currentSkill >= trick.requiredSkill;
                  return (
                    <div
                      key={trick.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        unlocked
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-950/60 border-slate-900 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{trick.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{trick.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({trick.japaneseName})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {trick.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap pl-2">
                        <span className="text-[10px] block font-mono text-amber-400">
                          Diff: {trick.difficulty}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            unlocked ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {unlocked ? 'Unlocked ✅' : `Req: ${trick.requiredSkill} Skill`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
