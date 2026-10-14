import React, { useState } from 'react';
import { Character, Relationship } from '../../types/bitlife';
import { clamp, randomInt, pickRandom, ascendRoyalLadder } from '../../utils/lifeEngine';
import {
  playCashSound,
  playFailSound,
  playSirenSound,
  playSuccessSound,
  playClickSound,
} from '../../utils/audio';

interface CrimeModalProps {
  character?: Character;
  currencySymbol: string;
  characterAge?: number;
  onSuccessCrime: (cashGained: number, message: string) => void;
  onArrested: (sentenceYears: number, crimeTitle: string) => void;
  onUpdateCharacter?: (updater: (prev: Character) => Character) => void;
  onAddLog?: (msg: string) => void;
  onClose: () => void;
}

type CrimeCategory =
  | 'MENU'
  | 'MISCHIEF'
  | 'PICKPOCKET'
  | 'SHOPLIFT'
  | 'BANK_ROBBERY'
  | 'GRAND_THEFT'
  | 'MURDER'
  | 'HITMAN';

export const CrimeModal: React.FC<CrimeModalProps> = ({
  character,
  currencySymbol,
  characterAge = 18,
  onSuccessCrime,
  onArrested,
  onUpdateCharacter,
  onAddLog,
  onClose,
}) => {
  const [screen, setScreen] = useState<CrimeCategory>('MENU');
  const [immunityNotice, setImmunityNotice] = useState<string | null>(null);

  // Check Sovereign & Executive Immunity
  const isMonarch =
    !!character?.royalty?.isMonarch ||
    character?.royalty?.title?.includes('King') ||
    character?.royalty?.title?.includes('Queen') ||
    character?.royalty?.title?.includes('Emperor') ||
    character?.royalty?.title?.includes('Sultan') ||
    character?.royalty?.title?.includes('Sovereign');

  const isPresident = character?.politicalOffice?.level === 'President';
  const hasImmunity = isMonarch || isPresident;
  const isMinor = characterAge < 18;

  // STRICT REQUIREMENT: Mischief and Pickpocketing unlock once you turn 13!
  if (characterAge < 13) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-red-900/60 shadow-2xl p-6 text-white text-center space-y-3">
          <div className="text-3xl">🚸</div>
          <h3 className="text-base font-bold text-red-400">Underage Notice</h3>
          <p className="text-xs text-zinc-300">
            You are currently {characterAge} years old. Kids under 13 cannot commit crimes! Mischief crime and pickpocketing unlock once you turn <strong>13</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Bank robbery selections
  const [weapon, setWeapon] = useState('Crowbar');
  const [disguise, setDisguise] = useState('Ski Mask');
  const [getaway, setGetaway] = useState('Sports Car');

  // Murder selections
  const [murderTargetId, setMurderTargetId] = useState<string>('stranger');
  const [murderMethod, setMurderMethod] = useState<string>('Drive-by Shooting');

  // Hitman selections
  const [hitmanTargetId, setHitmanTargetId] = useState<string>('stranger');
  const [hitmanTier, setHitmanTier] = useState<'THUG' | 'MERCENARY' | 'GHOST'>('THUG');

  const handleArrestOrImmunity = (sentenceYears: number, crimeTitle: string) => {
    if (hasImmunity) {
      playSuccessSound();
      const text = isMonarch
        ? `👑 SOVEREIGN IMMUNITY INVOKED! The Chief of Police and High Court prosecutors caught you for ${crimeTitle}, but dropped all charges with deep bows: "Forgive us, Your Majesty! Under sovereign constitutional law, the Crown cannot be charged, prosecuted, or arrested!"`
        : `🦅 EXECUTIVE IMMUNITY INVOKED! Federal marshals attempted to detain you for ${crimeTitle}, but Secret Service and the Attorney General intervened: "The sitting President holds constitutional executive immunity from prosecution!" Case dismissed!`;

      setImmunityNotice(text);
      onAddLog?.(text);
      return;
    }

    playSirenSound();
    playFailSound();
    onArrested(sentenceYears, crimeTitle);
  };

  const executeSimpleCrime = (
    title: string,
    successRate: number,
    minCash: number,
    maxCash: number,
    jailSentence: number
  ) => {
    playClickSound();
    const roll = Math.random();
    if (roll < successRate) {
      const loot = Math.floor(Math.random() * (maxCash - minCash + 1)) + minCash;
      playSuccessSound();
      playCashSound();
      onSuccessCrime(
        loot,
        loot > 0
          ? `You successfully pulled off a ${title} and escaped with ${currencySymbol}${loot.toLocaleString()}!`
          : `You successfully committed ${title} without getting caught!`
      );
    } else {
      handleArrestOrImmunity(jailSentence, title);
    }
  };

  const executeBankRobbery = () => {
    playClickSound();
    let chance = 0.35;
    if (weapon === 'Shotgun') chance += 0.15;
    if (weapon === 'Water Gun') chance -= 0.1;
    if (weapon === 'Banana') chance -= 0.15;

    if (disguise === 'Ski Mask') chance += 0.1;
    if (disguise === 'French Maid Outfit') chance -= 0.05;

    if (getaway === 'Sports Car') chance += 0.15;
    if (getaway === 'Bicycle') chance -= 0.15;
    if (getaway === 'Segway') chance -= 0.2;

    const roll = Math.random();
    if (roll < chance) {
      const loot = Math.floor(Math.random() * 90000) + 40000;
      playSuccessSound();
      playCashSound();
      onSuccessCrime(
        loot,
        `BANK HEIST SUCCESS! Armed with your ${weapon} and wearing your ${disguise}, you raided the vault and zoomed away in your ${getaway} with ${currencySymbol}${loot.toLocaleString()}!`
      );
    } else {
      handleArrestOrImmunity(12, 'Armed Bank Robbery');
    }
  };

  // Murder execution
  const executeMurder = () => {
    playClickSound();

    let targetName = 'a Random High-Society Rival';
    let targetRel: Relationship | undefined;

    if (character && murderTargetId !== 'stranger') {
      targetRel = character.relationships.find((r) => r.id === murderTargetId && r.alive);
      if (targetRel) {
        targetName = `${targetRel.name} (${targetRel.relation})`;
      }
    }

    const roll = Math.random();
    const successRate = 0.55;

    if (roll < successRate) {
      playSuccessSound();

      let ascensionLog = '';
      if (targetRel && onUpdateCharacter && character) {
        onUpdateCharacter((prev) => {
          let updated = {
            ...prev,
            relationships: prev.relationships.map((r) =>
              r.id === targetRel?.id ? { ...r, alive: false } : r
            ),
          };

          if (
            targetRel?.relation === 'Mother' ||
            targetRel?.relation === 'Father' ||
            targetRel?.relation?.includes('Parent')
          ) {
            const hasLivingParents = updated.relationships.some(
              (r) =>
                r.alive &&
                (r.relation === 'Mother' ||
                  r.relation === 'Father' ||
                  r.relation?.includes('Parent'))
            );
            if (!hasLivingParents && updated.royalty) {
              const ascension = ascendRoyalLadder(updated);
              if (ascension.character.royalty?.title !== updated.royalty.title) {
                ascensionLog = ` 👑 CORONATION BY SUCCESSION: Following the tragic demise of your royal parent, you have ascended the throne as ${ascension.character.royalty?.title}!`;
                updated = ascension.character;
              }
            }
          }
          return updated;
        });
      }

      const msg = `MURDER ACCOMPLISHED: You eliminated ${targetName} using ${murderMethod}! You covered your tracks and left no evidence behind.${ascensionLog}`;
      onSuccessCrime(0, msg);
    } else {
      handleArrestOrImmunity(25, `First-Degree Murder of ${targetName}`);
    }
  };

  // Hitman execution
  const executeHitman = () => {
    playClickSound();

    let cost = 5000;
    let successRate = 0.6;
    let stingRate = 0.25;

    if (hitmanTier === 'MERCENARY') {
      cost = 25000;
      successRate = 0.8;
      stingRate = 0.12;
    } else if (hitmanTier === 'GHOST') {
      cost = 100000;
      successRate = 0.95;
      stingRate = 0.04;
    }

    if (character && character.money < cost) {
      playFailSound();
      alert(`You do not have enough funds! Hiring a ${hitmanTier} hitman requires ${currencySymbol}${cost.toLocaleString()}.`);
      return;
    }

    if (onUpdateCharacter) {
      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money - cost,
      }));
    }

    let targetName = 'the designated target';
    let targetRel: Relationship | undefined;

    if (character && hitmanTargetId !== 'stranger') {
      targetRel = character.relationships.find((r) => r.id === hitmanTargetId && r.alive);
      if (targetRel) {
        targetName = `${targetRel.name} (${targetRel.relation})`;
      }
    }

    const roll = Math.random();

    // Check for undercover police sting
    if (roll < stingRate) {
      handleArrestOrImmunity(20, `Solicitation of Contract Murder against ${targetName} (Undercover Police Sting)`);
      return;
    }

    if (roll < successRate) {
      playSuccessSound();

      let ascensionLog = '';
      if (targetRel && onUpdateCharacter && character) {
        onUpdateCharacter((prev) => {
          let updated = {
            ...prev,
            relationships: prev.relationships.map((r) =>
              r.id === targetRel?.id ? { ...r, alive: false } : r
            ),
          };

          if (
            targetRel?.relation === 'Mother' ||
            targetRel?.relation === 'Father' ||
            targetRel?.relation?.includes('Parent')
          ) {
            const hasLivingParents = updated.relationships.some(
              (r) =>
                r.alive &&
                (r.relation === 'Mother' ||
                  r.relation === 'Father' ||
                  r.relation?.includes('Parent'))
            );
            if (!hasLivingParents && updated.royalty) {
              const ascension = ascendRoyalLadder(updated);
              if (ascension.character.royalty?.title !== updated.royalty.title) {
                ascensionLog = ` 👑 CORONATION: With the untimely demise of your parent, you have ascended the throne as ${ascension.character.royalty?.title}!`;
                updated = ascension.character;
              }
            }
          }
          return updated;
        });
      }

      const msg = `HITMAN CONTRACT FULFILLED: Your hired ${hitmanTier} assassin executed the contract on ${targetName}! The coroner ruled it an untraceable accident.${ascensionLog}`;
      onSuccessCrime(0, msg);
    } else {
      playFailSound();
      onAddLog?.(`The hitman botched the contract on ${targetName} and fled the country, pocketing your deposit!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦹</span>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Crime & Delinquency</span>
                {isMinor && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                    Juvenile (Age {characterAge})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isMinor
                  ? 'Mischief and Pickpocketing available (Age 13+)'
                  : 'Petty crimes, heists, assassinations & contracts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {immunityNotice && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/80 border border-amber-500/70 text-amber-200 text-xs leading-relaxed animate-in fade-in">
            {immunityNotice}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {screen === 'MENU' && (
            <>
              {hasImmunity && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-[11px] text-red-200 flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span>
                    <strong>Crime Immunity Active:</strong> As {isMonarch ? 'Reigning Monarch' : 'President'}, you cannot be arrested or sent to prison!
                  </span>
                </div>
              )}

              {/* MISCHIEF (UNLOCKED AT AGE 13) */}
              <button
                onClick={() => setScreen('MISCHIEF')}
                className="w-full p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-zinc-900 hover:from-purple-900/60 hover:to-zinc-850 border border-purple-500/50 text-left flex items-center justify-between transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="font-bold text-sm text-purple-200 flex items-center gap-2">
                    <span>😈</span> Mischief (Pranks & Chaos)
                  </div>
                  <div className="text-[11px] text-purple-300/80 mt-0.5">
                    TP-ing houses, ding-dong ditching, porch piracy, school pranks & graffiti.
                  </div>
                </div>
                <span className="text-xs text-purple-300 font-bold">Age 13+</span>
              </button>

              {/* PICKPOCKETING (UNLOCKED AT AGE 13) */}
              <button
                onClick={() => setScreen('PICKPOCKET')}
                className="w-full p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                    <span>👛</span> Pickpocketing
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Lift unsuspecting wallets from tourists, subway riders, and shoppers.
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-medium">Age 13+</span>
              </button>

              {/* SHOPLIFTING (UNLOCKED AT AGE 13) */}
              <button
                onClick={() => setScreen('SHOPLIFT')}
                className="w-full p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                    <span>🏬</span> Shoplifting
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Swipe snacks, cosmetics, electronics, or designer goods.
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium">Age 13+</span>
              </button>

              {/* ADULT FELONIES (AGE 18+) */}
              <div className="pt-2">
                <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1 mb-1.5 flex items-center justify-between">
                  <span>Adult Felonies</span>
                  <span>{isMinor ? 'Locked until 18' : 'Available'}</span>
                </div>

                {/* Grand Theft Auto */}
                <button
                  disabled={isMinor}
                  onClick={() => executeSimpleCrime('Grand Theft Auto', 0.5, 3000, 18000, 5)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all mb-2 ${
                    isMinor
                      ? 'bg-zinc-950/60 border-zinc-850 opacity-40 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                      <span>🏎️</span> Grand Theft Auto
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Hotwire and steal luxury sedans from parking structures.
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isMinor ? 'text-zinc-500' : 'text-red-400'}`}>
                    {isMinor ? 'Age 18+' : 'High Risk'}
                  </span>
                </button>

                {/* Bank Robbery */}
                <button
                  disabled={isMinor}
                  onClick={() => setScreen('BANK_ROBBERY')}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all mb-2 ${
                    isMinor
                      ? 'bg-zinc-950/60 border-zinc-850 opacity-40 cursor-not-allowed'
                      : 'bg-red-950/40 hover:bg-red-900/40 border-red-800/60 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-red-300 flex items-center gap-2">
                      <span>🏦</span> Bank Robbery
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      High-stakes vault heist with weapons and getaway vehicles!
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${isMinor ? 'text-zinc-500' : 'text-red-400'}`}>
                    {isMinor ? 'Age 18+' : 'Extreme Risk'}
                  </span>
                </button>

                {/* MURDER */}
                <button
                  disabled={isMinor}
                  onClick={() => setScreen('MURDER')}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all mb-2 ${
                    isMinor
                      ? 'bg-zinc-950/60 border-zinc-850 opacity-40 cursor-not-allowed'
                      : 'bg-red-950/70 hover:bg-red-900/70 border-red-600/70 cursor-pointer shadow-md'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-rose-300 flex items-center gap-2">
                      <span>🔪</span> Murder (Homicide)
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-0.5">
                      Assassinate a relative, parent, sister, or rival.
                    </div>
                  </div>
                  <span className={`text-xs font-black ${isMinor ? 'text-zinc-500' : 'text-rose-400'}`}>
                    {isMinor ? 'Age 18+' : 'Capital Crime'}
                  </span>
                </button>

                {/* HITMEN */}
                <button
                  disabled={isMinor}
                  onClick={() => setScreen('HITMAN')}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isMinor
                      ? 'bg-zinc-950/60 border-zinc-850 opacity-40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-950/70 to-red-950/70 hover:from-purple-900/70 hover:to-red-900/70 border border-purple-500/70 cursor-pointer shadow-md'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-purple-200 flex items-center gap-2">
                      <span>🕶️</span> Underground Hitmen
                    </div>
                    <div className="text-[11px] text-purple-300/80 mt-0.5">
                      Hire contract assassins to eliminate targets.
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${isMinor ? 'text-zinc-500' : 'text-purple-300'}`}>
                    {isMinor ? 'Age 18+' : 'Contract Hit'}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* MISCHIEF SUB-SCREEN */}
          {screen === 'MISCHIEF' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider font-mono">
                  😈 Juvenile Mischief & Pranks
                </h4>
                <button
                  onClick={() => setScreen('MENU')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    title: 'Toilet-Papering a House (TP-ing)',
                    icon: '🧻',
                    desc: 'Wrap giant rolls of 2-ply toilet paper across a grumpy neighbor’s trees.',
                    rate: 0.88,
                    min: 0,
                    max: 25,
                    jail: 1,
                  },
                  {
                    title: 'Ding-Dong Ditch',
                    icon: '🔔',
                    desc: 'Ring a neighbor’s front doorbell at night and sprint through the hedges!',
                    rate: 0.92,
                    min: 0,
                    max: 0,
                    jail: 1,
                  },
                  {
                    title: 'Porch Piracy (Swipe Package)',
                    icon: '📦',
                    desc: 'Swipe an unattended delivery package sitting on a front porch!',
                    rate: 0.68,
                    min: 35,
                    max: 220,
                    jail: 2,
                  },
                  {
                    title: 'Spray Paint Graffiti',
                    icon: '🎨',
                    desc: 'Tag your street moniker with neon spray paint on the school wall.',
                    rate: 0.76,
                    min: 0,
                    max: 0,
                    jail: 1,
                  },
                  {
                    title: 'Slash Bully’s Bicycle Tires',
                    icon: '🚲',
                    desc: 'Puncture both tires of the school bully’s bike behind the cafeteria.',
                    rate: 0.82,
                    min: 0,
                    max: 0,
                    jail: 1,
                  },
                  {
                    title: 'Prank Call Local Pizzeria',
                    icon: '🍕',
                    desc: 'Order 30 anchovy pizzas to the principal’s home address.',
                    rate: 0.78,
                    min: 0,
                    max: 0,
                    jail: 1,
                  },
                  {
                    title: 'Release Mice in School Hallway',
                    icon: '🐁',
                    desc: 'Open a cage of white feeder mice during the 4th period passing period!',
                    rate: 0.85,
                    min: 0,
                    max: 0,
                    jail: 1,
                  },
                ].map((act) => (
                  <button
                    key={act.title}
                    type="button"
                    onClick={() => executeSimpleCrime(act.title, act.rate, act.min, act.max, act.jail)}
                    className="w-full p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-2xl shrink-0">{act.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{act.title}</div>
                        <p className="text-[10px] text-purple-200/70 truncate">{act.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-bold shrink-0">
                      {act.max > 0 ? `Loot ${currencySymbol}${act.max}` : 'Prank'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PICKPOCKET SUB-SCREEN */}
          {screen === 'PICKPOCKET' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  👛 Pickpocketing Victims
                </h4>
                <button
                  onClick={() => setScreen('MENU')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    title: 'Distracted Tourist with Map',
                    icon: '🗺️',
                    desc: 'Unaware visitor trying to decipher subway routes.',
                    rate: 0.78,
                    min: 50,
                    max: 220,
                    jail: 1,
                  },
                  {
                    title: 'Crowded Train Passenger',
                    icon: '🚇',
                    desc: 'Packed tightly in the subway car during rush hour.',
                    rate: 0.72,
                    min: 70,
                    max: 380,
                    jail: 2,
                  },
                  {
                    title: 'Mall Shopper with Bags',
                    icon: '🛍️',
                    desc: 'Balancing bags at the food court counter.',
                    rate: 0.75,
                    min: 60,
                    max: 290,
                    jail: 2,
                  },
                  {
                    title: 'Drunk Bar Patron',
                    icon: '🍺',
                    desc: 'Stumbling down the sidewalk outside an upscale tavern.',
                    rate: 0.82,
                    min: 100,
                    max: 450,
                    jail: 2,
                  },
                  {
                    title: 'Wall Street Executive',
                    icon: '💼',
                    desc: 'Wearing an Armani suit and hailing a cab.',
                    rate: 0.55,
                    min: 250,
                    max: 850,
                    jail: 3,
                  },
                ].map((act) => (
                  <button
                    key={act.title}
                    type="button"
                    onClick={() => executeSimpleCrime(`Pickpocketing (${act.title})`, act.rate, act.min, act.max, act.jail)}
                    className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-2xl shrink-0">{act.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{act.title}</div>
                        <p className="text-[10px] text-zinc-400 truncate">{act.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                      ~{currencySymbol}{act.max}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SHOPLIFTING SUB-SCREEN */}
          {screen === 'SHOPLIFT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider font-mono">
                  🏬 Shoplifting Stores
                </h4>
                <button
                  onClick={() => setScreen('MENU')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    title: 'Corner Convenience Store (Candy & Energy Drinks)',
                    icon: '🍫',
                    rate: 0.85,
                    min: 15,
                    max: 45,
                    jail: 1,
                  },
                  {
                    title: 'Boutique (Cosmetics & Sunglasses)',
                    icon: '💄',
                    rate: 0.74,
                    min: 60,
                    max: 200,
                    jail: 1,
                  },
                  {
                    title: 'Electronics Shop (Video Games & Headphones)',
                    icon: '🎮',
                    rate: 0.62,
                    min: 120,
                    max: 380,
                    jail: 2,
                  },
                  {
                    title: 'Jewelry Department Counter (Watches)',
                    icon: '💎',
                    rate: 0.45,
                    min: 400,
                    max: 1800,
                    jail: 3,
                  },
                ].map((act) => (
                  <button
                    key={act.title}
                    type="button"
                    onClick={() => executeSimpleCrime(`Shoplifting from ${act.title}`, act.rate, act.min, act.max, act.jail)}
                    className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-2xl shrink-0">{act.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{act.title}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                      ~{currencySymbol}{act.max}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BANK ROBBERY */}
          {screen === 'BANK_ROBBERY' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Choose Weapon</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Crowbar', 'Shotgun', 'Water Gun', 'Banana'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeapon(w)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        weapon === w
                          ? 'bg-red-900 border-red-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Choose Disguise</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Ski Mask', 'French Maid Outfit', 'Paper Bag', 'Clown Mask'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDisguise(d)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        disguise === d
                          ? 'bg-red-900 border-red-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Choose Getaway Vehicle</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['Sports Car', 'Bicycle', 'Segway'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGetaway(g)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        getaway === g
                          ? 'bg-red-900 border-red-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('MENU')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={executeBankRobbery}
                  className="w-2/3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-950 cursor-pointer"
                >
                  Rob Vault 💰
                </button>
              </div>
            </div>
          )}

          {/* MURDER */}
          {screen === 'MURDER' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Select Target</label>
                <select
                  value={murderTargetId}
                  onChange={(e) => setMurderTargetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="stranger">Unknown Wealthy Rival / Stranger</option>
                  {character?.relationships
                    .filter((r) => r.alive)
                    .map((rel) => (
                      <option key={rel.id} value={rel.id}>
                        {rel.name} ({rel.relation}) — Age {rel.age}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Murder Method</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { name: 'Drive-by Shooting', icon: '🚗' },
                    { name: 'Poisoning with Cyanide', icon: '🍷' },
                    { name: 'Push Down Balcony Stairs', icon: '🪜' },
                    { name: 'Bathtub Electrocution', icon: '⚡' },
                    { name: 'Dark Alley Stabbing', icon: '🔪' },
                    { name: 'Run Over With Car', icon: '🚙' },
                  ].map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setMurderMethod(m.name)}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition-all ${
                        murderMethod === m.name
                          ? 'bg-red-900 border-red-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('MENU')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={executeMurder}
                  className="w-2/3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-950 cursor-pointer"
                >
                  Execute Murder 🔪
                </button>
              </div>
            </div>
          )}

          {/* HITMEN */}
          {screen === 'HITMAN' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Contract Target</label>
                <select
                  value={hitmanTargetId}
                  onChange={(e) => setHitmanTargetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="stranger">Unknown Mark / Blackmail Enemy</option>
                  {character?.relationships
                    .filter((r) => r.alive)
                    .map((rel) => (
                      <option key={rel.id} value={rel.id}>
                        {rel.name} ({rel.relation}) — Age {rel.age}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Hitman Quality Tier</label>
                <div className="space-y-2">
                  {[
                    {
                      tier: 'THUG',
                      title: 'Street Thug',
                      cost: 5000,
                      success: '60%',
                      sting: '25%',
                      desc: 'Desperate street enforcer. High risk of police entrapment.',
                    },
                    {
                      tier: 'MERCENARY',
                      title: 'Ex-Military Mercenary',
                      cost: 25000,
                      success: '80%',
                      sting: '12%',
                      desc: 'Disciplined professional. Moderate cost, reliable execution.',
                    },
                    {
                      tier: 'GHOST',
                      title: 'Ghost Syndicate Assassin',
                      cost: 100000,
                      success: '95%',
                      sting: '4%',
                      desc: 'Elite international black-ops operator. Virtually untraceable.',
                    },
                  ].map((h) => (
                    <button
                      key={h.tier}
                      type="button"
                      onClick={() => setHitmanTier(h.tier as any)}
                      className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        hitmanTier === h.tier
                          ? 'bg-purple-950 border-purple-500 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-white">{h.title}</span>
                        <span className="font-mono text-xs text-amber-300 font-bold">
                          {currencySymbol}{h.cost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{h.desc}</p>
                      <div className="flex gap-3 text-[10px] mt-1 text-zinc-500 font-mono">
                        <span>Success: {h.success}</span>
                        <span>Undercover Sting Risk: {h.sting}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('MENU')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={executeHitman}
                  className="w-2/3 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-950 cursor-pointer"
                >
                  Contract Hit 🕶️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
