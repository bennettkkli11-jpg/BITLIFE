import React, { useState } from 'react';
import { Character, SexualOrientation } from '../../types/bitlife';
import { COUNTRIES } from '../../data/countries';
import { clamp, pickRandom } from '../../utils/lifeEngine';
import { playClickSound, playSuccessSound, playBellSound, playFailSound } from '../../utils/audio';
import { convertCurrency, getExchangeRate, formatRateDisplay } from '../../utils/currency';

interface ActivitiesTabProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onOpenCrime: () => void;
  onOpenCelebrities: () => void;
  onOpenPolitics: () => void;
  onOpenRoyalty: () => void;
  onOpenBlackjack: () => void;
  onOpenLottery: () => void;
  onOpenDoctor: () => void;
  onOpenDMV: () => void;
  onOpenPrisonEscape: () => void;
  onOpenKendama?: (initialTab?: 'BAG' | 'SHOP' | 'NAKO') => void;
  onOpenDailyStreak?: () => void;
  onOpenAdmin?: () => void;
  onOpenTimeZone?: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onOpenCrime,
  onOpenCelebrities,
  onOpenPolitics,
  onOpenRoyalty,
  onOpenBlackjack,
  onOpenLottery,
  onOpenDoctor,
  onOpenDMV,
  onOpenPrisonEscape,
  onOpenKendama,
  onOpenDailyStreak,
  onOpenAdmin,
  onOpenTimeZone,
}) => {
  const [activeModal, setActiveModal] = useState<'NONE' | 'EMIGRATE' | 'IDENTITY' | 'WILL' | 'SURRENDER'>('NONE');
  const [msg, setMsg] = useState<string | null>(null);

  // Emigration states
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);
  const [immigrationDenied, setImmigrationDenied] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const currentCountryData = COUNTRIES.find((c) => c.name === character.country);
  const countryHasMonarchy = !!currentCountryData?.monarchy;

  // Identity form
  const [newFirst, setNewFirst] = useState(character.firstName);
  const [newLast, setNewLast] = useState(character.lastName);

  // Mind and body actions
  const handleGym = () => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      health: clamp(prev.health + 7),
      looks: clamp(prev.looks + 4),
      happiness: clamp(prev.happiness + 5),
    }));
    const workouts = [
      'pumped iron in the free weights area',
      'ran 5 kilometers on the treadmill',
      'attended an intense high-energy spin cycling class',
      'did heavy deadlifts and felt the burn',
    ];
    setMsg(`You went to the fitness gym and ${pickRandom(workouts)}!`);
    onAddLog('I went to the gym for a workout.');
  };

  const handleMeditate = () => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 8),
      karma: clamp(prev.karma + 5),
    }));
    setMsg('You sat in the lotus position, focused on your breath, and achieved inner tranquility.');
    onAddLog('I practiced mindfulness meditation.');
  };

  const handleReadBook = () => {
    playClickSound();
    playSuccessSound();
    const books = [
      'War and Peace by Leo Tolstoy',
      'The Great Gatsby by F. Scott Fitzgerald',
      'A Brief History of Time by Stephen Hawking',
      'To Kill a Mockingbird by Harper Lee',
      'Green Eggs and Ham by Dr. Seuss',
      '1984 by George Orwell',
    ];
    const book = pickRandom(books);
    onUpdateCharacter((prev) => ({
      ...prev,
      smarts: clamp(prev.smarts + 6),
      happiness: clamp(prev.happiness + 4),
    }));
    setMsg(`You finished reading "${book}". You feel significantly enlightened!`);
    onAddLog(`I read "${book}".`);
  };

  const handleClubbing = () => {
    playClickSound();
    const cost = 80;
    if (character.money < cost) {
      setMsg('You cannot afford the club entry and drinks fee.');
      return;
    }
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - cost,
      happiness: clamp(prev.happiness + 15),
      health: clamp(prev.health - 2),
    }));
    const outcomes = [
      'danced until 4:00 AM under laser beams and strobe lights!',
      'sipped expensive neon cocktails and sang along to the DJ set!',
      'made friends with strangers in the VIP lounge bathroom line!',
    ];
    setMsg(`You hit Club Neon and ${pickRandom(outcomes)}`);
    onAddLog('I went out clubbing with friends.');
  };

  const handleEmigrate = (countryName: string) => {
    playClickSound();
    const target = COUNTRIES.find((c) => c.name === countryName);
    if (!target) return;
    const cost = 2500;
    if (character.money < cost) {
      setMsg(`You need at least ${character.currencySymbol}${cost} for visa processing and airfare.`);
      return;
    }

    // Immigration denial chance (higher if player has criminal history)
    const hasCriminalRecord = (character.crimesCommitted || 0) > 0 || (character.prisonRecord || []).length > 0;
    const denialProbability = hasCriminalRecord ? 0.75 : 0.35;
    const isDenied = Math.random() < denialProbability;

    if (isDenied) {
      playFailSound();
      setPendingCountry(target.name);
      setImmigrationDenied(true);
      setDenialReason(
        hasCriminalRecord
          ? `Criminal record detected (${character.crimesCommitted} felonies/priors). The Border Ministry denied your entry visa.`
          : `Strict immigration quota & points criteria. Your relocation visa was rejected.`
      );
      return;
    }

    // Legal Immigration Approved
    playSuccessSound();
    const currentCountryData = COUNTRIES.find((c) => c.name === character.country);
    const sourceCurrency = currentCountryData?.currency || 'USD';
    const targetCurrency = target.currency;
    const exchangeMultiplier = getExchangeRate(sourceCurrency, targetCurrency);
    const remainingSourceMoney = Math.max(0, character.money - cost);
    const convertedMoney = convertCurrency(remainingSourceMoney, sourceCurrency, targetCurrency);

    onUpdateCharacter((prev) => {
      // Retain royal title and sovereign kingdom of origin even after emigrating!
      const updatedRoyalty = prev.royalty
        ? {
            ...prev.royalty,
            country: prev.royalty.country || prev.country,
            yearlyAllowance: Math.round(prev.royalty.yearlyAllowance * exchangeMultiplier),
          }
        : undefined;

      // Adjust existing property and vehicle values/mortgages to new currency scale
      const convertedRealEstate = (prev.realEstate || []).map((r) => ({
        ...r,
        price: Math.round(r.price * exchangeMultiplier),
        monthlyCost: Math.max(1, Math.round(r.monthlyCost * exchangeMultiplier)),
        mortgageLeft: Math.round((r.mortgageLeft || 0) * exchangeMultiplier),
      }));

      const convertedVehicles = (prev.vehicles || []).map((v) => ({
        ...v,
        price: Math.round(v.price * exchangeMultiplier),
      }));

      return {
        ...prev,
        money: convertedMoney,
        realEstate: convertedRealEstate,
        vehicles: convertedVehicles,
        country: target.name,
        city: pickRandom(target.cities),
        flag: target.flag,
        currencySymbol: target.currencySymbol,
        isUndocumented: false,
        royalty: updatedRoyalty,
        happiness: clamp(prev.happiness + 20),
      };
    });

    const rateString = formatRateDisplay(sourceCurrency, targetCurrency);
    onAddLog(
      `At the foreign exchange bureau, I exchanged ${character.currencySymbol}${remainingSourceMoney.toLocaleString()} ${sourceCurrency} for ${target.currencySymbol}${convertedMoney.toLocaleString()} ${targetCurrency} (${rateString}).`
    );

    if (character.royalty) {
      const originRealm = character.royalty.country || character.country;
      onAddLog(
        `I legally emigrated to ${target.name}. I maintained my royal title as ${character.royalty.title} of ${originRealm}, living abroad in high society!`
      );
    }

    setMsg(`VISA APPROVED! You legally emigrated to ${target.name} ${target.flag}! Your funds converted to ${target.currencySymbol}${convertedMoney.toLocaleString()} ${targetCurrency} (${rateString}).`);
    onAddLog(`I legally emigrated to ${target.name}.`);
    setActiveModal('NONE');
    setImmigrationDenied(false);
    setPendingCountry(null);
  };

  const handleIllegalImmigration = () => {
    if (!pendingCountry) return;
    const target = COUNTRIES.find((c) => c.name === pendingCountry);
    if (!target) return;

    playClickSound();
    const smugglerCost = 3500;
    if (character.money < smugglerCost) {
      setMsg(`You need at least ${character.currencySymbol}${smugglerCost} in cash to pay human smugglers / coyotes.`);
      return;
    }

    // 70% chance of successfully slipping across the border, 30% caught
    const success = Math.random() < 0.70;
    if (success) {
      playSuccessSound();
      const currentCountryData = COUNTRIES.find((c) => c.name === character.country);
      const sourceCurrency = currentCountryData?.currency || 'USD';
      const targetCurrency = target.currency;
      const exchangeMultiplier = getExchangeRate(sourceCurrency, targetCurrency);
      const remainingSourceMoney = Math.max(0, character.money - smugglerCost);
      const convertedMoney = convertCurrency(remainingSourceMoney, sourceCurrency, targetCurrency);

      onUpdateCharacter((prev) => {
        const updatedRoyalty = prev.royalty
          ? {
              ...prev.royalty,
              country: prev.royalty.country || prev.country,
              yearlyAllowance: Math.round(prev.royalty.yearlyAllowance * exchangeMultiplier),
            }
          : undefined;

        const convertedRealEstate = (prev.realEstate || []).map((r) => ({
          ...r,
          price: Math.round(r.price * exchangeMultiplier),
          monthlyCost: Math.max(1, Math.round(r.monthlyCost * exchangeMultiplier)),
          mortgageLeft: Math.round((r.mortgageLeft || 0) * exchangeMultiplier),
        }));

        const convertedVehicles = (prev.vehicles || []).map((v) => ({
          ...v,
          price: Math.round(v.price * exchangeMultiplier),
        }));

        return {
          ...prev,
          money: convertedMoney,
          realEstate: convertedRealEstate,
          vehicles: convertedVehicles,
          country: target.name,
          city: pickRandom(target.cities),
          flag: target.flag,
          currencySymbol: target.currencySymbol,
          isUndocumented: true,
          royalty: updatedRoyalty,
          happiness: clamp(prev.happiness + 15),
          karma: clamp(prev.karma - 5),
        };
      });

      const rateString = formatRateDisplay(sourceCurrency, targetCurrency);
      onAddLog(
        `On the underground black market, I converted my savings of ${character.currencySymbol}${remainingSourceMoney.toLocaleString()} ${sourceCurrency} into ${target.currencySymbol}${convertedMoney.toLocaleString()} ${targetCurrency} (${rateString}).`
      );

      if (character.royalty) {
        const originRealm = character.royalty.country || character.country;
        onAddLog(
          `Even while crossing borders into ${target.name}, I retained my royal pedigree as ${character.royalty.title} of ${originRealm}!`
        );
      }
      setMsg(`You successfully crossed the border into ${target.name} ${target.flag} under cover of night! Converted funds: ${target.currencySymbol}${convertedMoney.toLocaleString()} ${targetCurrency}. You are living as an undocumented resident.`);
      onAddLog(`After my visa was denied, I paid smugglers and illegally crossed into ${target.name}.`);
    } else {
      playFailSound();
      // Arrested & detained
      onUpdateCharacter((prev) => ({
        ...prev,
        money: Math.max(0, prev.money - smugglerCost),
        inPrison: true,
        prisonYearsLeft: 2,
        prisonRecord: [...(prev.prisonRecord || []), 'Illegal Border Crossing'],
        job: undefined,
        happiness: clamp(prev.happiness - 25),
      }));
      setMsg(`INTERCEPTED! Border Patrol & Coast Guard intercepted your smuggling boat. You were sentenced to 2 years in prison!`);
      onAddLog(`I was arrested by border guards attempting to illegally enter ${target.name}.`);
    }

    setActiveModal('NONE');
    setImmigrationDenied(false);
    setPendingCountry(null);
  };

  const handleSaveIdentity = () => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      firstName: newFirst.trim() || prev.firstName,
      lastName: newLast.trim() || prev.lastName,
    }));
    setMsg('You filed legal paperwork and changed your name!');
    onAddLog(`I legally changed my name to ${newFirst} ${newLast}.`);
    setActiveModal('NONE');
  };

  const handleSurrender = () => {
    playClickSound();
    playBellSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      alive: false,
      causeOfDeath: 'Surrendered to destiny (voluntary exit)',
    }));
    setActiveModal('NONE');
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pr-1">
      {msg && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-teal-500/50 text-xs text-teal-200 font-medium">
          {msg}
        </div>
      )}

      {/* Special Prison Banner if inmate */}
      {character.inPrison && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-750 shadow-lg space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-red-300 flex items-center gap-2">
              <span>⛓️</span> State Penitentiary Cellblock
            </h3>
            <span className="text-xs text-red-400 font-bold">{character.prisonYearsLeft} yrs left</span>
          </div>
          <p className="text-xs text-red-200/80">
            You are incarcerated. Plan a daring yard escape past guards to reclaim freedom!
          </p>
          <button
            onClick={onOpenPrisonEscape}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow"
          >
            Attempt Prison Escape 🚨
          </button>
        </div>
      )}

      {/* Core Activities Roster */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Crime */}
        <button
          onClick={() => {
            playClickSound();
            onOpenCrime();
          }}
          disabled={character.age < 13 || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🦹</div>
          <div>
            <div className="font-bold text-xs text-white">Crime</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {character.age < 13
                ? 'Locked (Unlocks at Age 13)'
                : character.age < 18
                ? 'Mischief & Pickpocketing (Age 13+)'
                : 'Mischief, Pickpocketing, GTA, Heists'}
            </div>
          </div>
        </button>

        {/* Celebrity VIP Lounge */}
        <button
          onClick={() => {
            playClickSound();
            onOpenCelebrities();
          }}
          disabled={character.age < 18 || character.inPrison}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 hover:from-amber-950/60 hover:to-slate-850 disabled:opacity-40 border border-amber-600/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🌟</div>
          <div>
            <div className="font-bold text-xs text-amber-300">Celebrity VIP Lounge</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {character.age < 18 ? 'Locked (Age 18+)' : 'DJT, Matt Sweets, Bezos, Taylor...'}
            </div>
          </div>
        </button>

        {/* Kendama Club & NAKO Championship */}
        <button
          onClick={() => {
            playClickSound();
            onOpenKendama?.('BAG');
          }}
          disabled={character.inPrison}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/40 via-amber-950/30 to-slate-900 hover:from-red-950/60 hover:to-slate-850 disabled:opacity-40 border border-amber-500/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🎯</div>
          <div>
            <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <span>Kendama Club & NAKO</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sweets, Krom, Yuntrove & Matt Jorgensen
            </div>
          </div>
        </button>

        {/* Daily Streak & Login Rewards */}
        <button
          onClick={() => {
            playClickSound();
            onOpenDailyStreak?.();
          }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/50 via-orange-950/30 to-slate-900 hover:from-amber-950/70 hover:to-slate-850 border border-amber-500/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🔥</div>
          <div>
            <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <span>Daily Streak Rewards</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              7-Day bonuses, cash, shields & rare drops
            </div>
          </div>
        </button>

        {/* Master Admin & God Mode Dashboard */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAdmin?.();
          }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/60 via-purple-950/40 to-slate-900 hover:from-red-950/80 hover:to-slate-850 border border-red-500/50 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🛡️</div>
          <div>
            <div className="font-bold text-xs text-red-300 flex items-center gap-1.5">
              <span>Admin & God Mode</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-600/30 text-red-300 font-mono">ROOT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              God stats, billions, spawners, streaks & test engine
            </div>
          </div>
        </button>

        {/* Politics & Public Office */}
        <button
          onClick={() => {
            playClickSound();
            onOpenPolitics();
          }}
          disabled={character.age < 21 || character.inPrison}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 hover:from-blue-950/60 hover:to-slate-850 disabled:opacity-40 border border-blue-600/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🏛️</div>
          <div>
            <div className="font-bold text-xs text-blue-300">
              {character.politicalOffice ? character.politicalOffice.level : 'Political Campaigns'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {character.politicalOffice
                ? `${character.politicalOffice.approvalRating}% Approval`
                : character.age < 21
                ? 'Locked (Age 21+)'
                : 'President ($100M), Mayor, Governor'}
            </div>
          </div>
        </button>

        {/* Royalty & Royal Court - Monarchy countries or titled royals abroad or courting foreign suitors */}
        <button
          onClick={() => {
            playClickSound();
            onOpenRoyalty();
          }}
          disabled={character.inPrison}
          className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between cursor-pointer ${
            character.royalty
              ? 'bg-gradient-to-br from-amber-950/60 via-purple-950/50 to-slate-900 hover:from-amber-900/60 hover:to-slate-850 border-amber-500/60'
              : countryHasMonarchy
              ? 'bg-gradient-to-br from-purple-950/40 to-slate-900 hover:from-purple-950/60 hover:to-slate-850 border-amber-500/40'
              : 'bg-gradient-to-br from-slate-900 to-purple-950/30 hover:bg-slate-850 border-slate-700/70 hover:border-amber-500/40'
          }`}
        >
          <div className="text-2xl mb-1">{character.royalty ? '👑' : countryHasMonarchy ? '👑' : '💍'}</div>
          <div>
            <div className="font-bold text-xs text-amber-300">
              {character.royalty
                ? character.royalty.title
                : countryHasMonarchy
                ? 'Royal Court & Nobility'
                : 'Court Foreign Royalty'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {character.royalty
                ? `${character.royalty.respect}% Respect ${
                    character.royalty.country && character.royalty.country !== character.country
                      ? `• ${character.royalty.country}`
                      : ''
                  }`
                : countryHasMonarchy
                ? 'Decrees, Knighthoods, Suitors'
                : 'Court princes & suitors abroad'}
            </div>
          </div>
        </button>

        {/* Casino & Blackjack */}
        <button
          onClick={() => {
            playClickSound();
            onOpenBlackjack();
          }}
          disabled={character.age < 18 || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">♠️</div>
          <div>
            <div className="font-bold text-xs text-white">Casino Blackjack</div>
            <div className="text-[10px] text-slate-400 mt-0.5">High-stakes table games</div>
          </div>
        </button>

        {/* Lottery */}
        <button
          onClick={() => {
            playClickSound();
            onOpenLottery();
          }}
          disabled={character.age < 18 || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🎟️</div>
          <div>
            <div className="font-bold text-xs text-white">Lottery</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Mega Millions Jackpots</div>
          </div>
        </button>

        {/* Doctor & Plastic Surgery */}
        <button
          onClick={() => {
            playClickSound();
            onOpenDoctor();
          }}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🏥</div>
          <div>
            <div className="font-bold text-xs text-white">Doctor & Surgery</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Treat illness & botox</div>
          </div>
        </button>

        {/* Driver License DMV */}
        <button
          onClick={() => {
            playClickSound();
            onOpenDMV();
          }}
          disabled={character.age < 16 || character.hasDriversLicense || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🚗</div>
          <div>
            <div className="font-bold text-xs text-white">Driver's License</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {character.hasDriversLicense ? 'License Active ✅' : 'Take DMV Road Quiz'}
            </div>
          </div>
        </button>

        {/* Fitness Gym */}
        <button
          onClick={handleGym}
          disabled={character.age < 12}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🏋️</div>
          <div>
            <div className="font-bold text-xs text-white">Gym Workout</div>
            <div className="text-[10px] text-slate-400 mt-0.5">+Health & +Looks</div>
          </div>
        </button>

        {/* Meditate */}
        <button
          onClick={handleMeditate}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🧘</div>
          <div>
            <div className="font-bold text-xs text-white">Meditate</div>
            <div className="text-[10px] text-slate-400 mt-0.5">+Happiness & +Karma</div>
          </div>
        </button>

        {/* Read Book */}
        <button
          onClick={handleReadBook}
          disabled={character.age < 6}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">📖</div>
          <div>
            <div className="font-bold text-xs text-white">Read a Book</div>
            <div className="text-[10px] text-slate-400 mt-0.5">+Smarts increase</div>
          </div>
        </button>

        {/* Nightlife / Club */}
        <button
          onClick={handleClubbing}
          disabled={character.age < 18 || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🪩</div>
          <div>
            <div className="font-bold text-xs text-white">Nightclub</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dancing & drinks ($80)</div>
          </div>
        </button>

        {/* Emigrate */}
        <button
          onClick={() => {
            playClickSound();
            setActiveModal('EMIGRATE');
          }}
          disabled={character.age < 18 || character.inPrison}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">✈️</div>
          <div>
            <div className="font-bold text-xs text-white">Emigrate</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Move to another country</div>
          </div>
        </button>

        {/* Time Zone & World Clock */}
        <button
          onClick={() => {
            playClickSound();
            onOpenTimeZone?.();
          }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 hover:from-cyan-950/70 hover:to-slate-850 border border-cyan-500/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between cursor-pointer"
        >
          <div className="text-2xl mb-1">🌐</div>
          <div>
            <div className="font-bold text-xs text-cyan-300">Time Zone & Clock</div>
            <div className="text-[10px] text-slate-400 mt-0.5">US, Canada, Mexico & Obscure Zones</div>
          </div>
        </button>

        {/* Identity */}
        <button
          onClick={() => {
            playClickSound();
            setActiveModal('IDENTITY');
          }}
          disabled={character.age < 18}
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🆔</div>
          <div>
            <div className="font-bold text-xs text-white">Identity</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Change name & details</div>
          </div>
        </button>

        {/* Surrender */}
        <button
          onClick={() => {
            playClickSound();
            setActiveModal('SURRENDER');
          }}
          className="p-3.5 rounded-2xl bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <div className="text-2xl mb-1">🏳️</div>
          <div>
            <div className="font-bold text-xs text-red-300">Surrender</div>
            <div className="text-[10px] text-slate-400 mt-0.5">End current life early</div>
          </div>
        </button>
      </div>

      {/* Modal: Emigrate */}
      {activeModal === 'EMIGRATE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-teal-400 flex items-center gap-2">
                <span>✈️</span> Emigration & Border Control
              </h4>
              <button
                onClick={() => {
                  setActiveModal('NONE');
                  setImmigrationDenied(false);
                  setPendingCountry(null);
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            {immigrationDenied && pendingCountry ? (
              /* Visa Denied Screen with Illegal Immigration Option */
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-600/80 text-left">
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                    <span>⛔</span> IMMIGRATION VISA DENIED!
                  </div>
                  <p className="text-[11px] text-red-200 leading-relaxed mb-2">
                    The embassy and border inspection of <span className="font-bold">{pendingCountry}</span> has officially rejected your application for residency.
                  </p>
                  <p className="text-[10px] text-red-300/80 italic font-mono bg-red-900/40 p-2 rounded-lg">
                    "{denialReason}"
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-300 font-semibold text-left">What do you want to do?</p>

                  {/* Illegal Immigration option */}
                  <button
                    onClick={handleIllegalImmigration}
                    className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs shadow-lg flex items-center justify-between text-left transition-transform active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>📦</span> Immigrate Illegally (Smuggle in)
                      </div>
                      <div className="text-[10px] text-amber-150 font-normal mt-0.5">
                        Pay human smugglers / cargo passage ({character.currencySymbol}3,500)
                      </div>
                    </div>
                    <span className="text-base font-black">→</span>
                  </button>

                  <button
                    onClick={() => {
                      setImmigrationDenied(false);
                      setPendingCountry(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700"
                  >
                    Try Another Country
                  </button>

                  <button
                    onClick={() => {
                      setActiveModal('NONE');
                      setImmigrationDenied(false);
                      setPendingCountry(null);
                    }}
                    className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                  >
                    Accept Denial & Stay in {character.country}
                  </button>
                </div>
              </div>
            ) : (
              /* Country Selection List */
              <>
                <div className="text-left mb-2.5">
                  <p className="text-xs text-slate-300">
                    Apply for a legal entry visa to relocate to another country.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Fee: {character.currencySymbol}2,500</span>
                    <span className="text-cyan-400">💱 Live Forex Exchange Applied</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {COUNTRIES.filter((c) => c.name !== character.country).map((c) => {
                    const sourceCur = currentCountryData?.currency || 'USD';
                    const rateDisplay = formatRateDisplay(sourceCur, c.currency);
                    const netSource = Math.max(0, character.money - 2500);
                    const convertedPreview = convertCurrency(netSource, sourceCur, c.currency);

                    return (
                      <button
                        key={c.name}
                        onClick={() => handleEmigrate(c.name)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs text-left transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{c.flag}</span>
                            <span className="truncate">{c.name}</span>
                            {c.monarchy && <span className="text-[10px]" title="Monarchy">👑</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{c.currency} ({c.currencySymbol})</span>
                            <span className="text-cyan-400 font-mono">{rateDisplay}</span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-medium mt-0.5">
                            Your cash converts to: {c.currencySymbol}{convertedPreview.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-[11px] text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                          Apply ✈️
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Identity */}
      {activeModal === 'IDENTITY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-blue-400">Legal Name Change</h4>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">First Name</label>
                <input
                  type="text"
                  value={newFirst}
                  onChange={(e) => setNewFirst(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={newLast}
                  onChange={(e) => setNewLast(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <button
                onClick={handleSaveIdentity}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Surrender */}
      {activeModal === 'SURRENDER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-red-800 shadow-2xl p-6 text-white text-center space-y-3">
            <div className="text-3xl">🏳️</div>
            <h4 className="font-bold text-sm text-red-400">Surrender Life?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to end this life? You will immediately receive your final gravestone and ribbon.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Nevermind
              </button>
              <button
                onClick={handleSurrender}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow"
              >
                Confirm Surrender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
