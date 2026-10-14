import React, { useState } from 'react';
import {
  Character,
  Disease,
  Heirloom,
  JobOccupation,
  KendamaItem,
  RealEstate,
  Vehicle,
  PastLifeRecord,
} from '../types/bitlife';
import { clamp, randomInt, calculateNetWorth } from '../utils/lifeEngine';
import { createSpecialCelebrityCharacter } from '../data/specialCelebrityLives';
import { DISEASES_CATALOG } from '../data/diseases';
import { COUNTRIES } from '../data/countries';
import {
  getDailyStreakData,
  saveDailyStreakData,
  getDefaultStreakData,
} from '../utils/dailyStreak';
import { SITUATION_ARCHETYPES } from '../utils/proceduralEvents';
import { EventDefinition } from '../data/randomEvents';
import { ACHIEVEMENTS } from '../data/achievements';
import {
  playCashSound,
  playClickSound,
  playSuccessSound,
  playFailSound,
  playJackpotFanfare,
} from '../utils/audio';
import {
  verifyGodModePassword,
  isGodModeUnlocked,
  setGodModeUnlocked,
} from '../utils/godModeAuth';
import {
  getSelectedTimezone,
  setSelectedTimezone,
  getTimezoneMeta,
  formatTimeInZone,
} from '../utils/timezone';

interface AdminDashboardModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onTriggerEvent: (event: EventDefinition) => void;
  pastLives: PastLifeRecord[];
  onUpdatePastLives: (records: PastLifeRecord[]) => void;
  currentUser: any;
  onOpenSystops?: () => void;
  onClose: () => void;
}

type AdminTab = 'GOD_MODE' | 'PLAYERS' | 'SPAWNER' | 'STREAKS' | 'EVENT_ENGINE' | 'DATABASE';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  character,
  onUpdateCharacter,
  onTriggerEvent,
  pastLives,
  onUpdatePastLives,
  currentUser,
  onOpenSystops,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('GOD_MODE');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Player Directory state
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(character.id || 'active_sim');
  const [playerFilterCategory, setPlayerFilterCategory] = useState<'ALL' | 'ACTIVE' | 'CEMETERY' | 'ROYALS' | 'WEALTHY'>('ALL');

  // God Mode form state
  const [customCash, setCustomCash] = useState<string>(character.money.toString());
  const [customAge, setCustomAge] = useState<number>(character.age);
  const [firstName, setFirstName] = useState(character.firstName);
  const [lastName, setLastName] = useState(character.lastName);

  // God Mode Password Auth state
  const [isUnlocked, setIsUnlocked] = useState(() => isGodModeUnlocked());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessing, setIsSuccessing] = useState(false);

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playClickSound();
    if (verifyGodModePassword(passwordInput)) {
      playSuccessSound();
      setIsSuccessing(true);
      setAuthError(null);
      setGodModeUnlocked(true);
      setTimeout(() => {
        setIsUnlocked(true);
        setIsSuccessing(false);
        showToast('⚡ God Mode & Admin Root Shell Unlocked!');
      }, 350);
    } else {
      playFailSound();
      setAuthError('Access Denied: Invalid God Mode Passphrase.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleLockGodMode = () => {
    playClickSound();
    setGodModeUnlocked(false);
    setIsUnlocked(false);
    setPasswordInput('');
    setAuthError(null);
    showToast('🔒 God Mode Locked');
  };

  // Streak state
  const [streakData, setStreakData] = useState(() => getDailyStreakData());

  const showToast = (msg: string) => {
    setAdminNotice(msg);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  // =========================================================================
  // GOD MODE ACTIONS
  // =========================================================================
  const setAllStatsToMax = () => {
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      health: 100,
      happiness: 100,
      smarts: 100,
      looks: 100,
      karma: 100,
      fame: 100,
    }));
    showToast('⚡ All Core Stats Maxed out to 100%!');
  };

  const updateStat = (statName: keyof Character, val: number) => {
    onUpdateCharacter((prev) => ({
      ...prev,
      [statName]: clamp(val),
    }));
  };

  const applyCashChange = (newAmount: number) => {
    playCashSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      money: Math.max(0, newAmount),
    }));
    setCustomCash(newAmount.toString());
    showToast(`💰 Bank balance set to ${character.currencySymbol}${newAmount.toLocaleString()}`);
  };

  const addCashDelta = (delta: number) => {
    playCashSound();
    onUpdateCharacter((prev) => {
      const nextMoney = Math.max(0, prev.money + delta);
      setCustomCash(nextMoney.toString());
      return { ...prev, money: nextMoney };
    });
    showToast(`💵 Added ${delta > 0 ? '+' : ''}${character.currencySymbol}${delta.toLocaleString()}`);
  };

  const applyAgeChange = (targetAge: number) => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      age: Math.max(0, Math.min(125, targetAge)),
    }));
    setCustomAge(targetAge);
    showToast(`⏳ Age modified to ${targetAge} years old`);
  };

  const cureAllDiseases = () => {
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      diseases: [],
      health: Math.max(80, prev.health),
    }));
    showToast('💊 All Diseases Cured & Eradicated!');
  };

  const infectDisease = (disease: Disease) => {
    playClickSound();
    onUpdateCharacter((prev) => {
      if (prev.diseases.some((d) => d.id === disease.id)) return prev;
      return {
        ...prev,
        diseases: [...prev.diseases, disease],
      };
    });
    showToast(`🦠 Character infected with ${disease.name}`);
  };

  const pardonPrisoner = () => {
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      inPrison: false,
      prisonYearsLeft: 0,
      prisonRecord: [],
      happiness: clamp(prev.happiness + 40),
    }));
    showToast('🏛️ Executive Pardon Granted! Fully Released from Prison.');
  };

  const sentenceToPrison = (years: number) => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      inPrison: true,
      prisonYearsLeft: years,
      prisonRecord: [...prev.prisonRecord, 'Executive Administrative Detention'],
      job: undefined,
    }));
    showToast(`⚖️ Sentenced to ${years} years in maximum security prison.`);
  };

  const crownRoyalty = (title: string) => {
    playJackpotFanfare();
    onUpdateCharacter((prev) => ({
      ...prev,
      royalty: {
        title,
        country: prev.country,
        respect: 100,
        yearlyAllowance: 1000000,
        isMonarch: true,
      },
      fame: 100,
      happiness: 100,
    }));
    showToast(`👑 Crowned as ${title}! Sovereign allowance: $1,000,000/yr`);
  };

  const appointPresident = () => {
    playJackpotFanfare();
    onUpdateCharacter((prev) => ({
      ...prev,
      politicalOffice: {
        level: 'President',
        title: `President of ${prev.country}`,
        salary: 400000,
        termYearsLeft: 4,
        totalYearsServed: 1,
        approvalRating: 98,
        party: 'Independent',
      },
      presidentialTermsWon: (prev.presidentialTermsWon || 0) + 1,
      fame: 100,
      happiness: 100,
    }));
    showToast(`🏛️ Inaugurated as Head of State / President of ${character.country}!`);
  };

  const appointCareer = (title: string, salary: number) => {
    playClickSound();
    const newJob: JobOccupation = {
      id: `admin_job_${Date.now()}`,
      title,
      company: 'Global Enterprises Inc.',
      salary,
      careerTrack: 'Executive',
      requiredEducation: 'University',
      requiredSmarts: 80,
      yearsInRole: 1,
      performance: 100,
      stress: 10,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      job: newJob,
      educationLevel: 'University',
      completedDegrees: [...new Set([...(prev.completedDegrees || []), 'University', 'Bachelor’s Degree'])],
    }));
    showToast(`💼 Appointed as ${title} ($${salary.toLocaleString()}/yr)`);
  };

  const resurrectCharacter = () => {
    playJackpotFanfare();
    onUpdateCharacter((prev) => ({
      ...prev,
      alive: true,
      health: 100,
      happiness: 100,
      causeOfDeath: undefined,
      diseases: [],
    }));
    showToast('✨ Character Resurrected! Restored to full life & health!');
  };

  const unlockAllAchievementsCheat = () => {
    playJackpotFanfare();
    const allIds = ACHIEVEMENTS.map((a) => a.id);
    onUpdateCharacter((prev) => ({
      ...prev,
      unlockedAchievements: allIds,
    }));
    try {
      localStorage.setItem('bitlife_global_unlocked_achievements_v1', JSON.stringify(allIds));
    } catch {}
    showToast(`🏆 All ${allIds.length} achievements unlocked! Master of Everything achieved.`);
  };

  const unlockMasterOfEverythingCheat = () => {
    playJackpotFanfare();
    onUpdateCharacter((prev) => ({
      ...prev,
      unlockedAchievements: Array.from(
        new Set([...(prev.unlockedAchievements || []), 'secret_god_of_everything'])
      ),
    }));
    showToast('🌌 Unlocked "The Omnipotent God: Master of Everything"!');
  };

  const resetAchievementsCheat = () => {
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      unlockedAchievements: [],
    }));
    try {
      localStorage.setItem('bitlife_global_unlocked_achievements_v1', JSON.stringify([]));
    } catch {}
    showToast('🗑️ All achievements reset.');
  };

  // =========================================================================
  // SPAWNER ACTIONS
  // =========================================================================
  const spawnHeirloom = (name: string, value: number, icon: string) => {
    playCashSound();
    const item: Heirloom = {
      id: `spawned_${Date.now()}_${randomInt(100, 999)}`,
      name,
      value,
      rarity: value > 1000000 ? 'Super Rare' : 'Very Rare',
      icon,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      heirlooms: [item, ...(prev.heirlooms || [])],
    }));
    showToast(`✨ Spawned Heirloom: ${icon} ${name} ($${value.toLocaleString()})`);
  };

  const spawnRealEstate = (name: string, type: RealEstate['type'], price: number) => {
    playCashSound();
    const prop: RealEstate = {
      id: `spawned_re_${Date.now()}`,
      name,
      type,
      price,
      monthlyCost: Math.round(price * 0.002),
      condition: 100,
      hasMortgage: false,
      mortgageLeft: 0,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      realEstate: [prop, ...(prev.realEstate || [])],
    }));
    showToast(`🏰 Spawned Property: ${name} ($${price.toLocaleString()})`);
  };

  const spawnVehicle = (name: string, type: Vehicle['type'], price: number) => {
    playCashSound();
    const veh: Vehicle = {
      id: `spawned_veh_${Date.now()}`,
      name,
      type,
      price,
      condition: 100,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      vehicles: [veh, ...(prev.vehicles || [])],
      hasDriversLicense: true,
    }));
    showToast(`🏎️ Spawned Supercar: ${name} ($${price.toLocaleString()})`);
  };

  const spawnKendama = (name: string, brand: KendamaItem['brand']) => {
    playCashSound();
    const dama: KendamaItem = {
      id: `spawned_dama_${Date.now()}`,
      name,
      brand,
      wood: 'Hard Maple & Walnut',
      coating: 'Cushion Clear Track V3',
      condition: 100,
      price: 150,
      signedByMattJorgensen: true,
      timesPlayed: 0,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      kendamas: [dama, ...(prev.kendamas || [])],
      kendamaSkill: 100,
    }));
    showToast(`🎯 Spawned Pro Kendama: ${name} (100 Max Skill)`);
  };

  // =========================================================================
  // STREAK ACTIONS
  // =========================================================================
  const updateStreakCount = (days: number) => {
    playSuccessSound();
    const updated = {
      ...streakData,
      currentStreak: days,
      longestStreak: Math.max(streakData.longestStreak, days),
    };
    setStreakData(updated);
    saveDailyStreakData(updated);
    showToast(`🔥 Daily Streak modified to ${days} consecutive days!`);
  };

  const addStreakFreezes = (count: number) => {
    playClickSound();
    const updated = {
      ...streakData,
      freezeTokens: Math.max(0, streakData.freezeTokens + count),
    };
    setStreakData(updated);
    saveDailyStreakData(updated);
    showToast(`🛡️ Added ${count > 0 ? '+' : ''}${count} Streak Freeze Shields!`);
  };

  const resetDailyCooldown = () => {
    playClickSound();
    const updated = {
      ...streakData,
      lastClaimDate: '1970-01-01', // Reset date so today's claim is unlocked!
    };
    setStreakData(updated);
    saveDailyStreakData(updated);
    showToast("⏰ Today's Daily Streak Reward Cooldown Reset! Ready to claim.");
  };

  // =========================================================================
  // EVENT TRIGGER
  // =========================================================================
  const triggerProceduralArchetype = (archetypeId: string) => {
    playClickSound();
    const arch = SITUATION_ARCHETYPES.find((a) => a.id === archetypeId) || SITUATION_ARCHETYPES[0];
    const loc = 'the high-stakes international VIP suite';
    const actor = 'an eccentric billionaire in bespoke silk attire';
    const cat = 'a locked titanium briefcase containing bearer bonds';

    const event: EventDefinition = {
      id: `admin_triggered_${Date.now()}`,
      title: `[TEST] ${arch.title}`,
      prompt: arch.generatePrompt(loc, actor, cat, character),
      icon: arch.icon,
      minAge: 1,
      maxAge: 120,
      options: arch.buildOptions(cat, actor, loc),
    };

    onClose();
    onTriggerEvent(event);
  };

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
        <div
          className={`w-full max-w-md rounded-3xl bg-slate-950 border border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.3)] p-6 sm:p-8 text-center text-white my-auto animate-in fade-in zoom-in-95 duration-200 transition-transform ${
            isShaking ? 'translate-x-[-8px] scale-[0.98]' : ''
          }`}
        >
          {/* Header Icon */}
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-3xl shadow-xl shadow-red-950/60 mb-4 border border-red-400/40 animate-pulse">
            🔒
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-[10px] font-mono font-black text-red-300 tracking-wider uppercase mb-2">
            RESTRICTED ACCESS LEVEL 9
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white uppercase font-sans mb-1">
            God Mode Passcode
          </h2>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Enter authorized passphrase to unlock God Mode stat overrides, spawner tools, infinite wealth, and event triggers.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/90 border border-red-600 text-red-200 text-xs font-bold flex items-center gap-2 justify-center shadow-md animate-pulse">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          {isSuccessing && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 justify-center shadow-md">
              <span>⚡</span>
              <span>Access Granted! Initializing God Mode...</span>
            </div>
          )}

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter God Mode Password..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-white placeholder-slate-500 text-sm font-medium pr-11 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSuccessing}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] uppercase tracking-wide"
              >
                <span>⚡</span>
                <span>Unlock God Mode</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
            BitLife Master Control Terminal v4.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-950 border border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.25)] flex flex-col overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= ADMIN HEADER ================= */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-950 via-slate-900 to-purple-950 border-b border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-xl shadow-lg animate-pulse">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white uppercase font-sans">
                  BitLife God Mode & Master Admin
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/50 font-mono font-bold">
                  LEVEL 9 MASTER
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono flex items-center gap-2">
                <span>User: {currentUser?.email || 'Admin Operator'}</span>
                <span className="text-emerald-400 font-bold">● GOD MODE UNLOCKED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSystops && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenSystops();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow cursor-pointer transition-transform active:scale-95"
                title="Open SYStops Dashboard to view all logins and change all passwords across all devices"
              >
                <span>⚡</span>
                <span>SYStops Terminal</span>
              </button>
            )}
            <button
              onClick={handleLockGodMode}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-[11px] font-bold text-red-300 transition-colors cursor-pointer"
              title="Lock God Mode (re-arms password requirement)"
            >
              <span>🔒</span>
              <span>Lock</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Global Action Toast */}
        {adminNotice && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-black text-center shadow-md animate-in slide-in-from-top-1">
            {adminNotice}
          </div>
        )}

        {/* ================= TAB NAVIGATION ================= */}
        <div className="grid grid-cols-6 bg-slate-900 border-b border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('GOD_MODE')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'GOD_MODE'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">⚡</span>
            <span>God Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('PLAYERS')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'PLAYERS'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">👥</span>
            <span>Players</span>
          </button>

          <button
            onClick={() => setActiveTab('SPAWNER')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'SPAWNER'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">🎁</span>
            <span>Spawner</span>
          </button>

          <button
            onClick={() => setActiveTab('STREAKS')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'STREAKS'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">🔥</span>
            <span>Streaks</span>
          </button>

          <button
            onClick={() => setActiveTab('EVENT_ENGINE')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'EVENT_ENGINE'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">🎲</span>
            <span>Events (1M+)</span>
          </button>

          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`py-3 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTab === 'DATABASE'
                ? 'bg-red-950/70 text-red-300 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">☁️</span>
            <span>Database</span>
          </button>
        </div>

        {/* ================= TAB 1: GOD MODE ATTRIBUTES & CAREERS ================= */}
        {activeTab === 'GOD_MODE' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Quick Master Superhuman Button */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-900/60 via-purple-900/40 to-slate-900 border border-red-500/40 flex items-center justify-between">
              <div>
                <div className="font-black text-sm text-white flex items-center gap-2">
                  <span>👑</span> God Mode Max Overdrive
                </div>
                <div className="text-[11px] text-slate-300">
                  Sets Health, Happiness, Smarts, Looks, Karma, and Fame to 100%
                </div>
              </div>

              <button
                onClick={setAllStatsToMax}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                MAX ALL STATS
              </button>
            </div>

            {/* Individual Attribute Sliders */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
                Live Core Attribute Sliders
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'health', label: 'Health', color: 'accent-teal-400', val: character.health },
                  { name: 'happiness', label: 'Happiness', color: 'accent-emerald-400', val: character.happiness },
                  { name: 'smarts', label: 'Smarts', color: 'accent-blue-400', val: character.smarts },
                  { name: 'looks', label: 'Looks', color: 'accent-pink-400', val: character.looks },
                  { name: 'karma', label: 'Karma', color: 'accent-amber-400', val: character.karma },
                  { name: 'fame', label: 'Fame', color: 'accent-purple-400', val: character.fame },
                ].map((stat) => (
                  <div key={stat.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-300">{stat.label}</span>
                      <span className="font-mono text-amber-300">{stat.val}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stat.val}
                        onChange={(e) => updateStat(stat.name as keyof Character, Number(e.target.value))}
                        className={`w-full ${stat.color} cursor-pointer`}
                      />
                      <button
                        onClick={() => updateStat(stat.name as keyof Character, 100)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white"
                      >
                        100
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Money Printing & Bankroll Controller */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex justify-between">
                <span>Financial Reserve Controller</span>
                <span className="text-emerald-400 font-mono">
                  Current: {character.currencySymbol}{character.money.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={customCash}
                  onChange={(e) => setCustomCash(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-red-500"
                  placeholder="Set exact balance"
                />
                <button
                  onClick={() => applyCashChange(Number(customCash) || 0)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
                >
                  Apply Balance
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => addCashDelta(100000)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-300"
                >
                  +$100,000
                </button>
                <button
                  onClick={() => addCashDelta(1000000)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-300"
                >
                  +$1,000,000
                </button>
                <button
                  onClick={() => addCashDelta(100000000)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-300"
                >
                  +$100,000,000
                </button>
                <button
                  onClick={() => applyCashChange(1000000000)}
                  className="py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-mono font-black text-white"
                >
                  $1 BILLION
                </button>
              </div>
            </div>

            {/* Age Manipulation & Immortality / Resurrect */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex justify-between">
                <span>Age Manipulation & Life Status</span>
                <span className="text-amber-400 font-mono">Current Age: {character.age}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {[0, 18, 21, 35, 65, 100].map((ageTarget) => (
                  <button
                    key={ageTarget}
                    onClick={() => applyAgeChange(ageTarget)}
                    className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-slate-200"
                  >
                    Age {ageTarget}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={cureAllDiseases}
                  className="py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-700 border border-teal-500/50 text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💊</span> Cure All Diseases
                </button>

                <button
                  onClick={resurrectCharacter}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <span>✨</span> Resurrect / Revive Life
                </button>
              </div>
            </div>

            {/* Career, Royalty & Executive Office */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
                Instant Career & Sovereign Titles
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => appointPresident()}
                  className="py-2.5 px-3 rounded-xl bg-blue-900/80 hover:bg-blue-800 border border-blue-500/60 font-black text-xs text-blue-200 flex items-center justify-center gap-1"
                >
                  <span>🏛️</span> Appoint President
                </button>

                <button
                  onClick={() => crownRoyalty('King')}
                  className="py-2.5 px-3 rounded-xl bg-amber-900/80 hover:bg-amber-800 border border-amber-500/60 font-black text-xs text-amber-200 flex items-center justify-center gap-1"
                >
                  <span>👑</span> Crown King / Queen
                </button>

                <button
                  onClick={() => appointCareer('Chief Executive Officer (CEO)', 850000)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  💼 Corporate CEO
                </button>

                <button
                  onClick={() => appointCareer('Chief Brain Surgeon', 650000)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  🩺 Brain Surgeon
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={pardonPrisoner}
                  className="py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 font-bold text-xs"
                >
                  🔓 Executive Pardon (Exit Prison)
                </button>
                <button
                  onClick={() => sentenceToPrison(10)}
                  className="py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-bold text-xs"
                >
                  ⛓️ Sentence to Prison (10 yrs)
                </button>
              </div>
            </div>

            {/* Achievements & Pantheon Cheats */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-amber-950/30 to-slate-900 border border-purple-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <span>🏆</span> Achievements & 100% Pantheon
                </div>
                <span className="text-[10px] font-mono text-purple-300">
                  {(character.unlockedAchievements || []).length} / {ACHIEVEMENTS.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={unlockAllAchievementsCheat}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 font-black text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <span>👑</span> Unlock All 100% (Instant Deity)
                </button>

                <button
                  onClick={unlockMasterOfEverythingCheat}
                  className="py-2.5 px-3 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/70 font-black text-xs text-purple-200 flex items-center justify-center gap-1.5 shadow cursor-pointer transition-transform active:scale-95"
                >
                  <span>🌌</span> Unlock "Master of Everything"
                </button>

                <button
                  onClick={resetAchievementsCheat}
                  className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 font-bold text-xs text-red-200 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <span>🗑️</span> Reset Achievements (0)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PLAYERS DIRECTORY & STATS LOOKUP ================= */}
        {activeTab === 'PLAYERS' && (() => {
          const allDirectoryPlayers = [
            {
              id: character.id || 'active_sim',
              name: `${character.firstName} ${character.lastName}`,
              firstName: character.firstName,
              lastName: character.lastName,
              age: character.age,
              gender: character.gender,
              city: character.city,
              country: character.country,
              flag: character.flag,
              status: character.alive ? 'Alive' : 'Deceased',
              money: character.money,
              netWorth: calculateNetWorth(character),
              occupation:
                character.royalty?.title ||
                character.politicalOffice?.title ||
                character.job?.title ||
                (character.inSchool ? `${character.educationLevel} Student` : 'Unemployed'),
              health: character.health,
              happiness: character.happiness,
              smarts: character.smarts,
              looks: character.looks,
              karma: character.karma,
              fame: character.fame,
              discipline: character.discipline,
              isCurrent: true,
              isRoyal: !!character.royalty,
              isPresident: character.politicalOffice?.level === 'President',
              isWealthy: calculateNetWorth(character) >= 10000000,
              avatar: character.specialCelebrityId === 'donald_trump' ? '🦅' : character.specialCelebrityId === 'elon_musk' ? '🚀' : character.gender === 'Female' ? '👩' : '👨',
              specialCelebrityId: character.specialCelebrityId,
              crimes: character.crimesCommitted || 0,
              spouses: character.relationships.filter((r) => r.relation === 'Husband' || r.relation === 'Wife').length,
            },
            ...pastLives.map((pl) => ({
              id: pl.id,
              name: pl.fullName,
              firstName: pl.fullName.split(' ')[0] || pl.fullName,
              lastName: pl.fullName.split(' ').slice(1).join(' ') || '',
              age: pl.age,
              gender: pl.gender,
              city: pl.city || 'Historic City',
              country: pl.country,
              flag: pl.flag || '🪦',
              status: 'Deceased',
              money: pl.netWorth,
              netWorth: pl.netWorth,
              occupation: pl.career || (pl.ribbon ? `${pl.ribbon} Life` : 'Deceased Ancestor'),
              health: 0,
              happiness: 50,
              smarts: 60,
              looks: 60,
              karma: 50,
              fame: pl.ribbon === 'Famous' ? 100 : 25,
              discipline: 50,
              isCurrent: false,
              isCemetery: true,
              isRoyal: pl.ribbon === 'Monarch',
              isPresident: pl.ribbon === 'Presidential',
              isWealthy: pl.netWorth >= 10000000,
              avatar: '🪦',
              specialCelebrityId: undefined as 'donald_trump' | 'elon_musk' | undefined,
              causeOfDeath: pl.causeOfDeath,
              ribbon: pl.ribbon,
              crimes: 0,
              spouses: pl.loversCount || 0,
            })),
            {
              id: 'sim_trump',
              name: 'Donald J. Trump',
              firstName: 'Donald',
              lastName: 'Trump',
              age: 78,
              gender: 'Male' as const,
              city: 'New York',
              country: 'United States',
              flag: '🇺🇸',
              status: 'Alive',
              money: 450000000,
              netWorth: 2600000000,
              occupation: '47th President of the United States',
              health: 95,
              happiness: 98,
              smarts: 92,
              looks: 85,
              karma: 70,
              fame: 100,
              discipline: 95,
              isCurrent: false,
              isRoyal: false,
              isPresident: true,
              isWealthy: true,
              avatar: '🦅',
              specialCelebrityId: 'donald_trump' as const,
              crimes: 0,
              spouses: 3,
            },
            {
              id: 'sim_musk',
              name: 'Elon Musk',
              firstName: 'Elon',
              lastName: 'Musk',
              age: 53,
              gender: 'Male' as const,
              city: 'Pretoria',
              country: 'South Africa',
              flag: '🇿🇦',
              status: 'Alive',
              money: 25000000000,
              netWorth: 340000000000,
              occupation: 'Technoking of Tesla & Chief Engineer of SpaceX',
              health: 96,
              happiness: 92,
              smarts: 100,
              looks: 80,
              karma: 75,
              fame: 100,
              discipline: 98,
              isCurrent: false,
              isRoyal: false,
              isPresident: false,
              isWealthy: true,
              avatar: '🚀',
              specialCelebrityId: 'elon_musk' as const,
              crimes: 0,
              spouses: 2,
            },
            {
              id: 'sim_mbs',
              name: 'Muhammed bin Salmad',
              firstName: 'Muhammed',
              lastName: 'bin Salmad',
              age: 39,
              gender: 'Male' as const,
              city: 'Riyadh',
              country: 'Saudi Arabia',
              flag: '🇸🇦',
              status: 'Alive',
              money: 8000000000,
              netWorth: 8000000000,
              occupation: 'Crown Sovereign & Prime Minister',
              health: 94,
              happiness: 90,
              smarts: 95,
              looks: 92,
              karma: 70,
              fame: 95,
              discipline: 90,
              isCurrent: false,
              isRoyal: true,
              isPresident: false,
              isWealthy: true,
              avatar: '👑',
              specialCelebrityId: undefined as 'donald_trump' | 'elon_musk' | undefined,
              crimes: 0,
              spouses: 1,
            },
            {
              id: 'sim_charles',
              name: 'King Charles III',
              firstName: 'Charles',
              lastName: 'Mountbatten-Windsor',
              age: 76,
              gender: 'Male' as const,
              city: 'London',
              country: 'United Kingdom',
              flag: '🇬🇧',
              status: 'Alive',
              money: 850000000,
              netWorth: 2200000000,
              occupation: 'Monarch of the United Kingdom',
              health: 80,
              happiness: 85,
              smarts: 90,
              looks: 75,
              karma: 85,
              fame: 98,
              discipline: 88,
              isCurrent: false,
              isRoyal: true,
              isPresident: false,
              isWealthy: true,
              avatar: '🤴',
              specialCelebrityId: undefined as 'donald_trump' | 'elon_musk' | undefined,
              crimes: 0,
              spouses: 2,
            },
          ];

          const filteredPlayers = allDirectoryPlayers.filter((p) => {
            const matchesQuery =
              !playerSearchQuery ||
              p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
              p.city.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
              p.country.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
              p.occupation.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
              p.id.toLowerCase().includes(playerSearchQuery.toLowerCase());

            if (!matchesQuery) return false;

            if (playerFilterCategory === 'ACTIVE') return p.isCurrent;
            if (playerFilterCategory === 'CEMETERY') return p.status === 'Deceased';
            if (playerFilterCategory === 'ROYALS') return p.isRoyal || p.isPresident;
            if (playerFilterCategory === 'WEALTHY') return p.isWealthy;
            return true;
          });

          const activeInspector = allDirectoryPlayers.find((p) => p.id === selectedPlayerId) || allDirectoryPlayers[0];

          return (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Search & Lookup Header */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>👥</span> Player Directory & Stats Telemetry
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {filteredPlayers.length} / {allDirectoryPlayers.length} Indexed
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Lookup player by name, city, country, or occupation..."
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    className="w-full py-2.5 pl-9 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-red-500"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
                  {playerSearchQuery && (
                    <button
                      onClick={() => setPlayerSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 'ACTIVE', 'CEMETERY', 'ROYALS', 'WEALTHY'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPlayerFilterCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        playerFilterCategory === cat
                          ? 'bg-red-950 text-red-300 border border-red-500/80 shadow'
                          : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                      }`}
                    >
                      {cat === 'ALL' && 'All Players'}
                      {cat === 'ACTIVE' && '🟢 Active Sim'}
                      {cat === 'CEMETERY' && '🪦 Cemetery'}
                      {cat === 'ROYALS' && '👑 Royalty & Heads of State'}
                      {cat === 'WEALTHY' && '💰 Wealthy ($10M+)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster & Stats Dossier Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Left: Players List */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Indexed Player Roster ({filteredPlayers.length})
                  </h5>
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {filteredPlayers.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs text-slate-500">
                        No players matched your lookup query "{playerSearchQuery}".
                      </div>
                    ) : (
                      filteredPlayers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlayerId(p.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            activeInspector?.id === p.id
                              ? 'bg-red-950/40 border-red-500/80 shadow-md ring-1 ring-red-500/40'
                              : 'bg-slate-950 hover:bg-slate-900 border-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{p.avatar}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white truncate">{p.name}</span>
                                {p.isCurrent && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-bold border border-emerald-500/30 shrink-0">
                                    YOU
                                  </span>
                                )}
                                {p.specialCelebrityId && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold border border-amber-500/30 shrink-0">
                                    CELEB
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                📍 {p.city}, {p.country} · {p.occupation}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-mono font-bold text-emerald-400">
                              ${(p.netWorth / 1000000).toFixed(p.netWorth >= 1000000000 ? 1 : 0)}M
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Age {p.age} · {p.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Selected Player Detailed Stats Dossier */}
                {activeInspector && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                          {activeInspector.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            {activeInspector.name}
                            <span>{activeInspector.flag}</span>
                          </h4>
                          <p className="text-[10px] text-amber-300 font-medium truncate">
                            {activeInspector.occupation}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeInspector.status === 'Alive'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {activeInspector.status}
                      </span>
                    </div>

                    {/* Birthplace & Demographic Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-500">Birth City & Nation</div>
                        <div className="font-bold text-white truncate">📍 {activeInspector.city}, {activeInspector.country}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-500">Age & Gender</div>
                        <div className="font-bold text-white font-mono">{activeInspector.age} yrs · {activeInspector.gender}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-500">Liquid Cash</div>
                        <div className="font-bold text-emerald-400 font-mono">${activeInspector.money.toLocaleString()}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="text-[10px] text-slate-500">Total Net Worth</div>
                        <div className="font-bold text-emerald-300 font-mono">${activeInspector.netWorth.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Core 6 Attributes Bars */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Live Vital Stat Meters
                      </div>
                      {[
                        { label: 'Health', val: activeInspector.health, color: 'bg-teal-500' },
                        { label: 'Happiness', val: activeInspector.happiness, color: 'bg-emerald-500' },
                        { label: 'Smarts', val: activeInspector.smarts, color: 'bg-purple-500' },
                        { label: 'Looks', val: activeInspector.looks, color: 'bg-amber-500' },
                        { label: 'Karma', val: activeInspector.karma, color: 'bg-blue-500' },
                        { label: 'Fame', val: activeInspector.fame, color: 'bg-yellow-400' },
                      ].map((st) => (
                        <div key={st.label} className="flex items-center gap-2 text-[10px]">
                          <span className="w-14 text-slate-400 font-medium">{st.label}</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full ${st.color} rounded-full`} style={{ width: `${st.val}%` }} />
                          </div>
                          <span className="w-8 text-right font-mono font-bold text-white">{st.val}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick God Actions for Active Player */}
                    {activeInspector.isCurrent && (
                      <div className="pt-2 border-t border-slate-850 space-y-1.5">
                        <div className="text-[10px] uppercase font-black text-red-400 tracking-wider">
                          Active Sim God Controls
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={setAllStatsToMax}
                            className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            ⚡ Max All Stats (100%)
                          </button>
                          <button
                            onClick={() => addCashDelta(100000000)}
                            className="py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            💰 +$100M Sovereign Grant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ================= TAB 3: ASSET & INVENTORY SPAWNER ================= */}
        {activeTab === 'SPAWNER' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Special Celebrity Morph & Spawn */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-cyan-950/60 border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <span>⭐</span> Spawn Special Celebrity Lives (1/500 Destiny)
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Instant Morph
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Immediately morph your current simulation into Donald Trump or Elon Musk, unlocking their historical milestones and authentic life events!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playSuccessSound();
                    playCashSound();
                    onUpdateCharacter(() => createSpecialCelebrityCharacter('donald_trump', character.unlockedAchievements));
                    showToast('🦅 Morphed into Donald Trump! (Born in Queens, NYC)');
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-500/60 hover:border-amber-400 text-left transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="text-2xl">🦅</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white">Donald J. Trump</div>
                    <div className="text-[10px] text-amber-300">Queens, NYC • 45th & 47th POTUS</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playSuccessSound();
                    playCashSound();
                    onUpdateCharacter(() => createSpecialCelebrityCharacter('elon_musk', character.unlockedAchievements));
                    showToast('🚀 Morphed into Elon Musk! (Born in Pretoria, South Africa)');
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-cyan-500/60 hover:border-cyan-400 text-left transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="text-2xl">🚀</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white">Elon Musk</div>
                    <div className="text-[10px] text-cyan-300">Pretoria, SA • Tesla & SpaceX</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Heirloom Spawner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider">
                Spawn Legendary Attic Heirlooms
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: '18K Solid Gold BitLife Crown', val: 125000, icon: '👑' },
                  { name: 'Holy Grail of Antiquity', val: 1000000000, icon: '🏆' },
                  { name: '1968 Vintage Rolex Daytona', val: 85000, icon: '⌚' },
                  { name: 'Stradivarius Violin (1715)', val: 3500000, icon: '🎻' },
                  { name: 'Diamond Encrusted Skull', val: 500000, icon: '💀' },
                  { name: '1776 Original Declaration Fragment', val: 2500000, icon: '📜' },
                ].map((h) => (
                  <button
                    key={h.name}
                    onClick={() => spawnHeirloom(h.name, h.val, h.icon)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-base mb-0.5">{h.icon}</div>
                    <div className="font-bold text-xs text-white truncate">{h.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      ${h.val.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Real Estate Mega Properties */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs uppercase font-extrabold text-blue-300 tracking-wider">
                Spawn Mega Real Estate (No Mortgage)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Beverly Hills Mega Compound', type: 'Mansion' as const, price: 25000000 },
                  { name: 'Highland Sovereign Castle', type: 'Castle' as const, price: 65000000 },
                  { name: 'Manhattan Triple Penthouse', type: 'Penthouse' as const, price: 18000000 },
                ].map((re) => (
                  <button
                    key={re.name}
                    onClick={() => spawnRealEstate(re.name, re.type, re.price)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-base mb-0.5">🏰</div>
                    <div className="font-bold text-xs text-white truncate">{re.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      ${re.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Supercar Fleet */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs uppercase font-extrabold text-purple-300 tracking-wider">
                Spawn Exotic Supercars & Hypercars
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Bugatti Chiron Super Sport', type: 'Supercar' as const, price: 3900000 },
                  { name: 'Ferrari SF90 Stradale', type: 'Sports Car' as const, price: 620000 },
                  { name: 'Rolls-Royce Phantom VIII', type: 'Sedan' as const, price: 540000 },
                ].map((v) => (
                  <button
                    key={v.name}
                    onClick={() => spawnVehicle(v.name, v.type, v.price)}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-base mb-0.5">🏎️</div>
                    <div className="font-bold text-xs text-white truncate">{v.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      ${v.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pro Kendama Models */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs uppercase font-extrabold text-red-300 tracking-wider">
                Spawn Commemorative Kendamas
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => spawnKendama('Sweets x NAKO Golden Legend Edition', 'Sweets Kendamas')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-left transition-colors cursor-pointer"
                >
                  <div className="text-base mb-0.5">🎯</div>
                  <div className="font-bold text-xs text-white">Sweets x NAKO Golden Legend</div>
                  <div className="text-[10px] text-amber-300">Signed Cushion Clear · 100 Skill</div>
                </button>

                <button
                  onClick={() => spawnKendama('KROM Gas Masterpiece Pro', 'KROM Kendama')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-left transition-colors cursor-pointer"
                >
                  <div className="text-base mb-0.5">🎯</div>
                  <div className="font-bold text-xs text-white">KROM Gas Masterpiece Pro</div>
                  <div className="text-[10px] text-amber-300">2026 World Champion Specs</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STREAKS & REWARDS ================= */}
        {activeTab === 'STREAKS' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs uppercase font-extrabold text-amber-400 tracking-wider flex justify-between">
                <span>Daily Streak State Controller</span>
                <span className="font-mono text-white">Current Streak: {streakData.currentStreak} Days</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="text-[10px] text-slate-400">Current Streak</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {streakData.currentStreak}d
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="text-[10px] text-slate-400">Best Streak</div>
                  <div className="text-lg font-black text-yellow-300 font-mono">
                    {streakData.longestStreak}d
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                  <div className="text-[10px] text-slate-400">Freeze Shields</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">
                    {streakData.freezeTokens}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300">Set Active Streak Days:</div>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 7, 14, 30, 50, 100].map((d) => (
                    <button
                      key={d}
                      onClick={() => updateStreakCount(d)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-amber-300 cursor-pointer"
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => addStreakFreezes(5)}
                  className="py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🛡️</span> +5 Freeze Shields
                </button>

                <button
                  onClick={resetDailyCooldown}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <span>⏰</span> Reset Claim Cooldown
                </button>
              </div>
            </div>

            {/* Time Zone Teleport & Global Clock Controller */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider flex items-center justify-between">
                <span>🌐 Time Zone Teleport & Clock Control</span>
                <span className="font-mono text-white text-[11px]">
                  {formatTimeInZone(new Date(), getSelectedTimezone(), true)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instantly swap timezones to test midnight streak resets and calendar roll-overs.
                Active: <strong className="text-cyan-300">{getTimezoneMeta(getSelectedTimezone()).name}</strong>
              </p>

              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  🇺🇸 United States Quick-Pick:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'America/New_York', label: '🗽 New York (ET)' },
                    { id: 'America/Chicago', label: '🏙️ Chicago (CT)' },
                    { id: 'America/Denver', label: '🏔️ Denver (MT)' },
                    { id: 'America/Los_Angeles', label: '🌴 Los Angeles (PT)' },
                    { id: 'America/Anchorage', label: '❄️ Alaska' },
                    { id: 'Pacific/Honolulu', label: '🌺 Hawaii' },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedTimezone(tz.id);
                        setAdminNotice(`Timezone teleported to ${tz.label}`);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        getSelectedTimezone() === tz.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                  🇨🇦 Canada & 🇲🇽 Mexico:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'America/Toronto', label: '🇨🇦 Toronto' },
                    { id: 'America/Vancouver', label: '🇨🇦 Vancouver' },
                    { id: 'America/St_Johns', label: '🇨🇦 St. John\'s (-3:30)' },
                    { id: 'America/Mexico_City', label: '🇲🇽 Mexico City' },
                    { id: 'America/Cancun', label: '🇲🇽 Cancún (EST)' },
                    { id: 'America/Tijuana', label: '🇲🇽 Tijuana (PST)' },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedTimezone(tz.id);
                        setAdminNotice(`Timezone teleported to ${tz.label}`);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        getSelectedTimezone() === tz.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                  🇪🇺 Europe & 🌏 Asia:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Europe/London', label: '🇬🇧 London (GMT)' },
                    { id: 'Europe/Paris', label: '🇫🇷 Paris (CET)' },
                    { id: 'Europe/Berlin', label: '🇩🇪 Berlin' },
                    { id: 'Asia/Tokyo', label: '🇯🇵 Tokyo (JST)' },
                    { id: 'Asia/Singapore', label: '🇸🇬 Singapore' },
                    { id: 'Asia/Dubai', label: '🇦🇪 Dubai' },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedTimezone(tz.id);
                        setAdminNotice(`Timezone teleported to ${tz.label}`);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        getSelectedTimezone() === tz.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                  🌍 Africa & 🌎 South America:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Africa/Cairo', label: '🇪🇬 Cairo' },
                    { id: 'Africa/Johannesburg', label: '🇿🇦 Johannesburg' },
                    { id: 'Africa/Lagos', label: '🇳🇬 Lagos' },
                    { id: 'America/Sao_Paulo', label: '🇧🇷 São Paulo' },
                    { id: 'America/Buenos_Aires', label: '🇦🇷 Buenos Aires' },
                    { id: 'America/Bogota', label: '🇨🇴 Bogotá' },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedTimezone(tz.id);
                        setAdminNotice(`Timezone teleported to ${tz.label}`);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        getSelectedTimezone() === tz.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 pt-1">
                  🏝️ The Obscure Ones in the Middle of Nowhere:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Pacific/Chatham', label: '🇳🇿 Chatham (+12:45 offset)' },
                    { id: 'Pacific/Kiritimati', label: '🇰🇮 Kiritimati (+14:00)' },
                    { id: 'Atlantic/St_Helena', label: '🌋 Tristan da Cunha (Remote)' },
                    { id: 'Pacific/Pitcairn', label: '🇵🇳 Pitcairn Islands (45 pop)' },
                    { id: 'Antarctica/McMurdo', label: '🧊 McMurdo Station (Polar)' },
                    { id: 'Australia/Eucla', label: '🦘 Eucla Border (+8:45)' },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedTimezone(tz.id);
                        setAdminNotice(`Timezone teleported to ${tz.label}`);
                      }}
                      className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        getSelectedTimezone() === tz.id
                          ? 'bg-amber-950 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: EVENT & PROCEDURAL ENGINE ================= */}
        {activeTab === 'EVENT_ENGINE' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs text-slate-300 font-medium">
              Manually trigger any of the 28 procedural situation archetypes from the 137M+ combinatorial pool:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SITUATION_ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => triggerProceduralArchetype(arch.id)}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-red-500/50 text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{arch.icon}</span>
                    <div className="truncate">
                      <div className="font-bold text-xs text-white truncate">{arch.title}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{arch.category}</div>
                    </div>
                  </div>
                  <span className="text-xs text-red-400 font-bold ml-2 shrink-0">Trigger ›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: DATABASE & SYSTEM TELEMETRY ================= */}
        {activeTab === 'DATABASE' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="text-xs uppercase font-extrabold text-slate-300 font-sans tracking-wider">
                Firestore Cloud Telemetry & Config
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <div><span className="text-slate-500">Database ID:</span> <span className="text-amber-300">ai-studio-bitlifelifesimul-7f64baf2-0173-43b8-bb96-fbe2285492b9</span></div>
                <div><span className="text-slate-500">Auth UID:</span> <span className="text-cyan-300">{currentUser?.uid || 'guest_local_session'}</span></div>
                <div><span className="text-slate-500">Account Type:</span> <span className="text-emerald-400">{currentUser?.isAnonymous ? 'Temporary Dummy Guest' : 'Authenticated Cloud User'}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">{currentUser?.email || 'bennettkkli11@gmail.com'}</span></div>
                <div><span className="text-slate-500">Past Cemetery Lives:</span> <span className="text-purple-300">{pastLives.length} recorded</span></div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="font-sans font-bold text-slate-300 text-xs">Cemetery Management:</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (pastLives.length === 0) return;
                      onUpdatePastLives([]);
                      showToast('🪦 Cemetery records cleared.');
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 border border-slate-700 text-slate-300 text-xs font-sans font-bold cursor-pointer transition-colors"
                  >
                    Clear Cemetery Records
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `bitlife_char_${character.firstName}_${character.lastName}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast('💾 Character JSON Save Exported!');
                    }}
                    className="py-2 px-3 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-600 text-blue-200 text-xs font-sans font-bold cursor-pointer transition-colors"
                  >
                    Export Character JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>BitLife Administration Shell v4.0</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
