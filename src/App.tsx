/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Character, Gender, PastLifeRecord, Relationship, RibbonType } from './types/bitlife';
import {
  createNewCharacter,
  processAgeUp,
  calculateNetWorth,
  calculateRibbon,
  generateEpitaph,
  clamp,
} from './utils/lifeEngine';
import {
  playAgeUpSound,
  playBellSound,
  playCashSound,
  playClickSound,
  playFailSound,
  playSirenSound,
  playSuccessSound,
  setSoundEnabled,
  isSoundEnabled,
  toggleSound,
} from './utils/audio';
import { RANDOM_EVENTS, EventDefinition } from './data/randomEvents';
import { ACHIEVEMENTS } from './data/achievements';

// Tab components
import { LifeTab } from './components/tabs/LifeTab';
import { OccupationTab } from './components/tabs/OccupationTab';
import { AssetsTab } from './components/tabs/AssetsTab';
import { RelationshipsTab } from './components/tabs/RelationshipsTab';
import { ActivitiesTab } from './components/tabs/ActivitiesTab';

// Modal components
import { LifeEventModal } from './components/LifeEventModal';
import { TombstoneModal } from './components/TombstoneModal';
import { CemeteryModal } from './components/CemeteryModal';
import { NewLifeModal } from './components/NewLifeModal';
import { BlackjackGame } from './components/minigames/BlackjackGame';
import { PrisonEscapeGame } from './components/minigames/PrisonEscapeGame';
import { DMVTestModal } from './components/minigames/DMVTestModal';
import { LotteryModal } from './components/minigames/LotteryModal';
import { CrimeModal } from './components/minigames/CrimeModal';
import { DoctorModal } from './components/minigames/DoctorModal';
import { DatingModal } from './components/minigames/DatingModal';
import { CelebrityModal } from './components/minigames/CelebrityModal';
import { PoliticsModal } from './components/politics/PoliticsModal';
import { RoyaltyModal } from './components/royalty/RoyaltyModal';
import { KendamaModal } from './components/minigames/KendamaModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { TimeZoneModal } from './components/TimeZoneModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { SystopsDashboardModal } from './components/SystopsDashboardModal';
import {
  getSelectedTimezone,
  getTimezoneMeta,
  formatTimeInZone,
  getTimezoneAbbreviation,
} from './utils/timezone';
import {
  auth,
  testConnection,
  saveCharacterToCloud,
  loadCharacterFromCloud,
  subscribeToCharacterCloudSync,
  savePastLifeToCloud,
  loadPastLivesFromCloud,
  saveDailyStreakToCloud,
  loadDailyStreakFromCloud,
  signOutUser,
  onAppAuthStateChange,
} from './lib/firebase';
import {
  getDailyStreakData,
  checkAndUpdateStreakOnLogin,
  isDailyRewardClaimable,
} from './utils/dailyStreak';
import { DailyStreakData } from './types/bitlife';
import { User as FirebaseUser } from 'firebase/auth';
import { generateProceduralEvent } from './utils/proceduralEvents';

type ActiveTab = 'LIFE' | 'OCCUPATION' | 'ASSETS' | 'RELATIONSHIPS' | 'ACTIVITIES';

const STORAGE_KEY_CHAR = 'bitlife_active_character_v1';
const STORAGE_KEY_PAST = 'bitlife_past_lives_v1';
const STORAGE_KEY_GLOBAL_ACHIEVEMENTS = 'bitlife_global_unlocked_achievements_v1';

export default function App() {
  const [character, setCharacter] = useState<Character>(() => {
    let globalAchievements: string[] = [];
    try {
      const savedAch = localStorage.getItem(STORAGE_KEY_GLOBAL_ACHIEVEMENTS);
      if (savedAch) globalAchievements = JSON.parse(savedAch);
    } catch {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAR);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedAch = Array.from(
          new Set([...globalAchievements, ...(parsed.unlockedAchievements ?? [])])
        );
        return {
          ...parsed,
          crimesCommitted: parsed.crimesCommitted ?? 0,
          blackjackWinnings: parsed.blackjackWinnings ?? 0,
          escapedPrisonCount: parsed.escapedPrisonCount ?? 0,
          lotteryWinsCount: parsed.lotteryWinsCount ?? 0,
          celebrityInteractions: parsed.celebrityInteractions ?? 0,
          unlockedAchievements: mergedAch,
        };
      }
    } catch {}
    const fresh = createNewCharacter();
    fresh.unlockedAchievements = globalAchievements;
    return fresh;
  });

  const [pastLives, setPastLives] = useState<PastLifeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAST);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isSyncingFromRemoteRef = useRef(false);
  const lastCloudSavedAtRef = useRef<number>(0);
  const [showDailyStreak, setShowDailyStreak] = useState(false);
  const [streakData, setStreakData] = useState<DailyStreakData>(getDailyStreakData());

  const [activeTab, setActiveTab] = useState<ActiveTab>('LIFE');
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled);

  // Modals state
  const [activeEvent, setActiveEvent] = useState<EventDefinition | null>(null);
  const [showTombstone, setShowTombstone] = useState(false);
  const [showCemetery, setShowCemetery] = useState(false);
  const [showNewLifeModal, setShowNewLifeModal] = useState(false);

  // Mini-game & Activity modals
  const [showBlackjack, setShowBlackjack] = useState(false);
  const [showPrisonEscape, setShowPrisonEscape] = useState(false);
  const [showDMV, setShowDMV] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [showCrime, setShowCrime] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);
  const [showDating, setShowDating] = useState(false);
  const [showCelebrities, setShowCelebrities] = useState(false);
  const [showPolitics, setShowPolitics] = useState(false);
  const [showRoyalty, setShowRoyalty] = useState(false);
  const [showKendama, setShowKendama] = useState(false);
  const [kendamaInitialTab, setKendamaInitialTab] = useState<'BAG' | 'SHOP' | 'NAKO'>('BAG');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSystopsModal, setShowSystopsModal] = useState(false);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);
  const [currentTimezone, setCurrentTimezone] = useState(() => getSelectedTimezone());
  const [liveClock, setLiveClock] = useState(new Date());

  // Listen for timezone changes & update live clock
  useEffect(() => {
    const handleTzChange = (e: any) => {
      setCurrentTimezone(e.detail?.timezone || getSelectedTimezone());
    };
    window.addEventListener('bitlife_timezone_changed', handleTzChange);
    const clockTimer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => {
      window.removeEventListener('bitlife_timezone_changed', handleTzChange);
      clearInterval(clockTimer);
    };
  }, []);

  // Global admin shortcut (`~` backtick or Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || e.key === '`') {
        setShowAdminModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check achievements automatically whenever relevant attributes change
  useEffect(() => {
    let currentUnlocked = [...(character.unlockedAchievements || [])];
    let changed = false;

    // Up to 5 passes to immediately cascade dependent achievements (5 other -> 10 other -> All other -> God of Everything)
    for (let pass = 0; pass < 5; pass++) {
      let newlyAddedInPass = 0;
      ACHIEVEMENTS.forEach((ach) => {
        if (!currentUnlocked.includes(ach.id)) {
          const simulatedChar = { ...character, unlockedAchievements: currentUnlocked };
          const val = ach.getCurrentValue(simulatedChar);
          if (val >= ach.targetValue) {
            currentUnlocked.push(ach.id);
            newlyAddedInPass++;
            changed = true;
          }
        }
      });
      if (newlyAddedInPass === 0) break;
    }

    if (changed) {
      try {
        localStorage.setItem(STORAGE_KEY_GLOBAL_ACHIEVEMENTS, JSON.stringify(currentUnlocked));
      } catch {}
      setCharacter((prev) => ({
        ...prev,
        unlockedAchievements: currentUnlocked,
      }));
    }
  }, [
    character.money,
    character.age,
    character.realEstate.length,
    character.vehicles.length,
    character.crimesCommitted,
    character.blackjackWinnings,
    character.escapedPrisonCount,
    character.lotteryWinsCount,
    character.celebrityInteractions,
    character.politicalOffice?.level,
    character.politicalOffice?.approvalRating,
    character.presidentialTermsWon,
    character.royalty?.respect,
    character.royalty?.title,
    character.health,
    character.happiness,
    character.relationships.length,
    character.educationLevel,
    character.job?.title,
    character.heirlooms.length,
    character.unlockedAchievements?.length,
  ]);

  // App Auth listener (Firebase Auth and Temporary Guest accounts)
  useEffect(() => {
    testConnection().catch(console.warn);
    const unsubscribe = onAppAuthStateChange((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Cross-device cloud sync: retrieve character, past lives, and daily streak on login
  useEffect(() => {
    if (!currentUser) {
      setIsCloudLoaded(false);
      return;
    }

    let isSubscribed = true;
    setIsCloudSyncing(true);

    // Initial load from cloud across devices
    (async () => {
      try {
        const [cloudChar, cloudPast, cloudStreak] = await Promise.all([
          loadCharacterFromCloud(),
          loadPastLivesFromCloud(),
          loadDailyStreakFromCloud(),
        ]);

        if (!isSubscribed) return;

        if (cloudChar) {
          isSyncingFromRemoteRef.current = true;
          setCharacter(cloudChar);
          setTimeout(() => {
            isSyncingFromRemoteRef.current = false;
          }, 400);
        }

        if (cloudPast && cloudPast.length > 0) {
          setPastLives(cloudPast);
        }

        if (cloudStreak) {
          setStreakData(cloudStreak);
        } else {
          const { streakData: sData } = checkAndUpdateStreakOnLogin();
          setStreakData(sData);
          saveDailyStreakToCloud(sData).catch(console.error);
        }

        if (isDailyRewardClaimable()) {
          setShowDailyStreak(true);
        }
      } catch (err) {
        console.warn('Initial cloud load notice:', err);
      } finally {
        if (isSubscribed) {
          setIsCloudLoaded(true);
          setIsCloudSyncing(false);
        }
      }
    })();

    // Real-time listener for live sync across devices
    const unsubLiveSync = subscribeToCharacterCloudSync((remoteChar) => {
      if (!isSubscribed) return;
      // Skip echo if save was dispatched by this device in the last 2 seconds
      if (Date.now() - lastCloudSavedAtRef.current < 2000) {
        return;
      }
      isSyncingFromRemoteRef.current = true;
      setCharacter(remoteChar);
      setTimeout(() => {
        isSyncingFromRemoteRef.current = false;
      }, 400);
    });

    return () => {
      isSubscribed = false;
      unsubLiveSync();
    };
  }, [currentUser?.uid, (currentUser as any)?.email]);

  // Sync to LocalStorage & Cloud Firestore across devices
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAR, JSON.stringify(character));
    } catch {}

    // Only save to cloud once initial load has completed, avoiding overwriting existing cloud save with local starting state
    if (currentUser && isCloudLoaded && !isSyncingFromRemoteRef.current) {
      lastCloudSavedAtRef.current = Date.now();
      saveCharacterToCloud(character).catch(console.error);
    }
  }, [character, currentUser, isCloudLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAST, JSON.stringify(pastLives));
    } catch {}
  }, [pastLives]);

  // Check death state
  useEffect(() => {
    if (!character.alive && !showTombstone) {
      playBellSound();
      setShowTombstone(true);
      recordGraveyardEntry(character);
    }
  }, [character.alive]);

  const recordGraveyardEntry = (char: Character) => {
    const netWorth = calculateNetWorth(char);
    const ribbon: RibbonType = char.ribbon || calculateRibbon(char);
    const record: PastLifeRecord = {
      id: 'grave_' + Date.now(),
      fullName: `${char.firstName} ${char.lastName}`,
      age: char.age,
      gender: char.gender,
      country: char.country,
      city: char.city,
      flag: char.flag,
      netWorth,
      causeOfDeath: char.causeOfDeath || 'Peaceful sleep',
      ribbon,
      loversCount: char.relationships.filter(
        (r) => r.relation === 'Boyfriend' || r.relation === 'Girlfriend' || r.relation === 'Husband' || r.relation === 'Wife'
      ).length,
      childrenCount: char.relationships.filter((r) => r.relation === 'Son' || r.relation === 'Daughter').length,
      career: char.job ? char.job.title : 'Unemployed',
      dateCompleted: new Date().toLocaleDateString(),
    };

    setPastLives((prev) => [record, ...prev.filter((p) => p.id !== record.id)]);
    if (currentUser) {
      savePastLifeToCloud(record).catch(console.error);
    }
  };

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundActive(newState);
    if (newState) playClickSound();
  };

  const addLogToCurrentYear = (text: string) => {
    setCharacter((prev) => {
      const logs = [...prev.lifeLog];
      if (logs.length > 0) {
        logs[logs.length - 1].events.push(text);
      }
      return { ...prev, lifeLog: logs };
    });
  };

  // Main Age Up trigger
  const handleAgeUp = () => {
    if (!character.alive) return;
    playAgeUpSound();

    const { newChar, eventsLog } = processAgeUp(character);
    setCharacter(newChar);

    if (!newChar.alive) {
      setShowTombstone(true);
      return;
    }

    // DMV prompt at age 16
    if (newChar.age === 16 && !newChar.hasDriversLicense && !newChar.inPrison) {
      setShowDMV(true);
      return;
    }

    // Random Interactive Event check (80% chance for rich gameplay)
    if (Math.random() < 0.80) {
      // Prioritize our massive 1,000,000+ combinatorial procedural pool!
      if (Math.random() < 0.85) {
        const procEvent = generateProceduralEvent(newChar);
        setActiveEvent(procEvent);
      } else {
        const eligibleEvents = RANDOM_EVENTS.filter((e) => {
          if (newChar.age < e.minAge || newChar.age > e.maxAge) return false;
          if (e.condition && !e.condition(newChar)) return false;
          return true;
        });

        if (eligibleEvents.length > 0) {
          const picked = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
          setActiveEvent(picked);
        } else {
          setActiveEvent(generateProceduralEvent(newChar));
        }
      }
    }
  };

  // Resolve random life event choice
  const handleResolveEvent = (outcome: ReturnType<EventDefinition['options'][0]['action']>) => {
    playClickSound();
    setActiveEvent(null);

    setCharacter((prev) => {
      let updated = { ...prev };
      if (outcome.happinessChange) updated.happiness = clamp(updated.happiness + outcome.happinessChange);
      if (outcome.healthChange) updated.health = clamp(updated.health + outcome.healthChange);
      if (outcome.smartsChange) updated.smarts = clamp(updated.smarts + outcome.smartsChange);
      if (outcome.looksChange) updated.looks = clamp(updated.looks + outcome.looksChange);
      if (outcome.karmaChange) updated.karma = clamp(updated.karma + outcome.karmaChange);
      if (outcome.fameChange) updated.fame = clamp(updated.fame + outcome.fameChange);
      if (outcome.moneyChange) updated.money = updated.money + outcome.moneyChange;

      if (outcome.diseaseCured) {
        updated.diseases = updated.diseases.filter((d) => d.id !== outcome.diseaseCured);
      }
      if (outcome.diseaseAdded) {
        updated.diseases.push(outcome.diseaseAdded);
      }

      if (outcome.arrested) {
        updated.inPrison = true;
        updated.prisonYearsLeft = outcome.prisonSentence || 5;
        updated.prisonRecord.push('Felony Conviction');
        updated.job = undefined;
      }

      if (outcome.death) {
        updated.alive = false;
        updated.causeOfDeath = outcome.causeOfDeath || 'Fatal incident';
        updated.ribbon = calculateRibbon(updated);
        updated.epitaph = generateEpitaph(updated);
      }

      if (outcome.celebrityInteraction) {
        updated.celebrityInteractions = (updated.celebrityInteractions || 0) + 1;
      }

      // Append outcome text to log
      const logs = [...updated.lifeLog];
      if (logs.length > 0) {
        logs[logs.length - 1].events.push(outcome.outcomeText);
      }
      updated.lifeLog = logs;

      return updated;
    });

    if (outcome.moneyChange && outcome.moneyChange > 0) {
      playCashSound();
    } else if (outcome.arrested) {
      playSirenSound();
    }
  };

  // Start New Life
  const handleStartNewLife = () => {
    playClickSound();
    const newChar = createNewCharacter();
    newChar.unlockedAchievements = character.unlockedAchievements || [];
    setCharacter(newChar);
    setShowTombstone(false);
    setShowNewLifeModal(false);
    setActiveTab('LIFE');
  };

  const handleStartCustomLife = (custom: {
    firstName: string;
    lastName: string;
    gender: Gender;
    countryName: string;
    cityName?: string;
    bornRoyal?: boolean;
    specialCelebrity?: 'donald_trump' | 'elon_musk';
  }) => {
    playClickSound();
    const newChar = createNewCharacter(custom);
    newChar.unlockedAchievements = character.unlockedAchievements || [];
    setCharacter(newChar);
    setShowTombstone(false);
    setShowNewLifeModal(false);
    setActiveTab('LIFE');
  };

  const handleRestartSameName = () => {
    playClickSound();
    const newChar = createNewCharacter({
      firstName: character.firstName,
      lastName: character.lastName,
      gender: character.gender,
      countryName: character.country,
      cityName: character.city,
      specialCelebrity: character.specialCelebrityId,
    });
    newChar.unlockedAchievements = character.unlockedAchievements || [];
    setCharacter(newChar);
    setShowTombstone(false);
    setActiveTab('LIFE');
  };

  // Gate gameplay behind authentication: prominently show login until player logs in
  if (!authChecked) {
    return (
      <div className="h-screen h-[100dvh] bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="text-4xl animate-bounce mb-3">🔴</div>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Loading BitLife...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => setShowAuthModal(false)} />;
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col items-center overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Top Application Header Contract */}
      <header className="shrink-0 w-full max-w-lg mx-auto flex items-center justify-between px-3.5 py-2.5 border-b border-slate-900 bg-slate-950 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowAdminModal(true);
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-transform text-left"
            title="BitLife (Click to open Admin Dashboard)"
          >
            <span className="text-xl">🔴</span>
            <span className="text-lg font-black tracking-tight text-white uppercase font-sans">
              Bit<span className="text-red-500">Life</span>
            </span>
          </button>

          {/* Daily Streak Flame Counter Button */}
          <button
            onClick={() => {
              playClickSound();
              setShowDailyStreak(true);
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-950/90 to-red-950/80 hover:from-amber-900/90 hover:to-red-900/90 border border-amber-500/50 text-amber-300 text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95"
            title="Daily Streak Rewards: Tap to view & claim!"
          >
            <span className="text-sm">🔥</span>
            <span>{streakData.currentStreak}d</span>
            {isDailyRewardClaimable() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Prominent Cloud Account & Log Out Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  setShowAuthModal(true);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors ${
                  currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife')
                    ? 'bg-purple-950/70 hover:bg-purple-900/70 border border-purple-500/60 text-purple-200'
                    : 'bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-600/70 text-emerald-300'
                }`}
                title={
                  currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife')
                    ? `Playing as ${currentUser.displayName || 'Guest'} (Temporary Account) • Click to manage`
                    : `Logged in as ${currentUser.email} • Click to manage cloud sync`
                }
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Avatar"
                    className="w-4 h-4 rounded-full border border-emerald-400 object-cover"
                  />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center font-bold ${
                      currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife')
                        ? 'bg-purple-600'
                        : 'bg-emerald-500'
                    }`}
                  >
                    {currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife')
                      ? '🎭'
                      : (currentUser.displayName ? currentUser.displayName[0].toUpperCase() : '✓')}
                  </span>
                )}
                <span className="truncate max-w-[65px]">
                  {currentUser.displayName?.split(' ')[0] || (currentUser.isAnonymous ? 'Guest' : 'Synced')}
                </span>
                <span className="text-[10px]">
                  {currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife')
                    ? '🎭'
                    : '☁️'}
                </span>
              </button>
              <button
                onClick={async () => {
                  playClickSound();
                  setIsCloudSyncing(true);
                  try {
                    await saveCharacterToCloud(character);
                    const cloudChar = await loadCharacterFromCloud();
                    if (cloudChar) {
                      isSyncingFromRemoteRef.current = true;
                      setCharacter(cloudChar);
                      setTimeout(() => {
                        isSyncingFromRemoteRef.current = false;
                      }, 300);
                    }
                  } finally {
                    setTimeout(() => setIsCloudSyncing(false), 500);
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors ${
                  isCloudSyncing
                    ? 'bg-amber-950/80 border border-amber-500/80 text-amber-300 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-emerald-400'
                }`}
                title="Cross-Device Cloud Sync: Active across all devices. Tap to force sync now."
              >
                <span className={isCloudSyncing ? 'animate-spin' : ''}>🔄</span>
                <span className="hidden sm:inline">{isCloudSyncing ? 'Syncing...' : 'Synced'}</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowAdminModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 text-[11px] font-bold shadow-xs cursor-pointer transition-colors active:scale-95"
                title="Master Admin & God Mode Dashboard (Hotkey: ~ or Ctrl+Shift+A)"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setShowSystopsModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-500/70 text-red-200 text-[11px] font-mono font-bold shadow-xs cursor-pointer transition-colors active:scale-95"
                title="SYStops Secret Dashboard - View all logins & change passwords across all devices"
              >
                <span>⚡</span>
                <span>SYStops</span>
              </button>
              <button
                onClick={async () => {
                  playClickSound();
                  await signOutUser();
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-red-950/80 border border-slate-800 hover:border-red-700/60 text-slate-300 hover:text-red-300 text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                title="Log Out"
              >
                Log Out 🚪
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                playClickSound();
                setShowAuthModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
              title="Sign in with Google or Email to save to database"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              setShowNewLifeModal(true);
            }}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
          >
            New Life
          </button>
          <button
            onClick={() => {
              playClickSound();
              setShowCemetery(true);
            }}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Cemetery & Past Lives"
          >
            🪦
          </button>
          <button
            onClick={() => {
              playClickSound();
              setShowTimeZoneModal(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold shadow-xs cursor-pointer transition-colors active:scale-95"
            title={`Time Zone: ${getTimezoneMeta(currentTimezone).name} • Click to change`}
          >
            <span>🌐</span>
            <span className="font-mono text-[10px] hidden sm:inline">
              {formatTimeInZone(liveClock, currentTimezone, false)}
            </span>
            <span className="text-[10px] uppercase font-black text-cyan-400">
              {getTimezoneAbbreviation(liveClock, currentTimezone)}
            </span>
          </button>
          <button
            onClick={handleToggleSound}
            className="p-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={soundActive ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundActive ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      {/* Main Container Frame */}
      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto flex flex-col px-4 pt-2 pb-1 overflow-hidden">
        {/* Core 4 Stat Bars (Happiness, Health, Smarts, Looks) */}
        <section aria-label="Player Vital Stats" className="shrink-0 grid grid-cols-4 gap-2 mb-2">
          {/* Happiness */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Happiness</span>
              <span className="text-emerald-400 font-mono">{character.happiness}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${character.happiness}%` }}
              />
            </div>
          </div>

          {/* Health */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Health</span>
              <span className="text-teal-400 font-mono">{character.health}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${character.health}%` }}
              />
            </div>
          </div>

          {/* Smarts */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Smarts</span>
              <span className="text-blue-400 font-mono">{character.smarts}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${character.smarts}%` }}
              />
            </div>
          </div>

          {/* Looks */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Looks</span>
              <span className="text-pink-400 font-mono">{character.looks}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${character.looks}%` }}
              />
            </div>
          </div>
        </section>

        {/* Dynamic Tab Body */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'LIFE' && (
            <LifeTab character={character} onAgeUp={handleAgeUp} />
          )}

          {activeTab === 'OCCUPATION' && (
            <OccupationTab
              character={character}
              onUpdateCharacter={setCharacter}
              onAddLog={addLogToCurrentYear}
            />
          )}

          {activeTab === 'ASSETS' && (
            <AssetsTab
              character={character}
              onUpdateCharacter={setCharacter}
              onAddLog={addLogToCurrentYear}
              onOpenKendama={(tab) => {
                setKendamaInitialTab(tab || 'BAG');
                setShowKendama(true);
              }}
            />
          )}

          {activeTab === 'RELATIONSHIPS' && (
            <RelationshipsTab
              character={character}
              onUpdateCharacter={setCharacter}
              onAddLog={addLogToCurrentYear}
              onOpenDatingModal={() => setShowDating(true)}
            />
          )}

          {activeTab === 'ACTIVITIES' && (
            <ActivitiesTab
              character={character}
              onUpdateCharacter={setCharacter}
              onAddLog={addLogToCurrentYear}
              onOpenCrime={() => {
                if (character.age >= 13 && !character.inPrison) {
                  setShowCrime(true);
                }
              }}
              onOpenCelebrities={() => {
                if (character.age >= 18 && !character.inPrison) {
                  setShowCelebrities(true);
                }
              }}
              onOpenPolitics={() => setShowPolitics(true)}
              onOpenRoyalty={() => setShowRoyalty(true)}
              onOpenBlackjack={() => setShowBlackjack(true)}
              onOpenLottery={() => setShowLottery(true)}
              onOpenDoctor={() => setShowDoctor(true)}
              onOpenDMV={() => setShowDMV(true)}
              onOpenPrisonEscape={() => setShowPrisonEscape(true)}
              onOpenKendama={(tab) => {
                setKendamaInitialTab(tab || 'BAG');
                setShowKendama(true);
              }}
              onOpenDailyStreak={() => setShowDailyStreak(true)}
              onOpenAdmin={() => setShowAdminModal(true)}
              onOpenTimeZone={() => setShowTimeZoneModal(true)}
            />
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation Tab Bar (BitLife signature iOS thumb-zone) */}
      <nav className="shrink-0 w-full bg-slate-950/95 border-t border-slate-900 z-40">
        <div className="w-full max-w-lg mx-auto grid grid-cols-5 h-16 items-center px-1">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('LIFE');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'LIFE' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">📜</span>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Life</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('OCCUPATION');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'OCCUPATION' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">💼</span>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Career</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('ASSETS');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'ASSETS' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">🏡</span>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Assets</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('RELATIONSHIPS');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'RELATIONSHIPS' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">👥</span>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Relations</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('ACTIVITIES');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'ACTIVITIES' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">⚡</span>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Activities</span>
          </button>
        </div>
      </nav>

      {/* --- ALL MODALS & OVERLAYS --- */}

      {/* Random Life Event Popup */}
      {activeEvent && (
        <LifeEventModal
          event={activeEvent}
          character={character}
          onResolve={handleResolveEvent}
        />
      )}

      {/* Tombstone / Death Screen */}
      {showTombstone && (
        <TombstoneModal
          character={character}
          onStartNewLife={handleStartNewLife}
          onRestartSameCharacter={handleRestartSameName}
          onOpenCemetery={() => {
            setShowTombstone(false);
            setShowCemetery(true);
          }}
        />
      )}

      {/* Cemetery / Hall of Fame */}
      {showCemetery && (
        <CemeteryModal
          records={pastLives}
          onClearCemetery={() => setPastLives([])}
          onClose={() => setShowCemetery(false)}
        />
      )}

      {/* New Life / Custom Character Creator */}
      {showNewLifeModal && (
        <NewLifeModal
          onStartRandom={handleStartNewLife}
          onStartCustom={handleStartCustomLife}
          onClose={() => setShowNewLifeModal(false)}
        />
      )}

      {/* Blackjack Casino Mini-game */}
      {showBlackjack && (
        <BlackjackGame
          playerCash={character.money}
          currencySymbol={character.currencySymbol}
          onCashChange={(delta) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money + delta,
              blackjackWinnings: delta > 0 ? (prev.blackjackWinnings || 0) + delta : (prev.blackjackWinnings || 0),
            }));
            if (delta > 0) {
              addLogToCurrentYear(`I won ${character.currencySymbol}${delta.toLocaleString()} playing blackjack at the casino.`);
            } else if (delta < 0) {
              addLogToCurrentYear(`I lost ${character.currencySymbol}${Math.abs(delta).toLocaleString()} at the casino.`);
            }
          }}
          onClose={() => setShowBlackjack(false)}
        />
      )}

      {/* Prison Escape Mini-game */}
      {showPrisonEscape && (
        <PrisonEscapeGame
          character={character}
          onUpdateCharacter={setCharacter}
          onSuccess={() => {
            setCharacter((prev) => ({
              ...prev,
              inPrison: false,
              prisonYearsLeft: 0,
              escapedPrisonCount: (prev.escapedPrisonCount || 0) + 1,
              happiness: clamp(prev.happiness + 40),
            }));
            addLogToCurrentYear('I executed a daring prison escape and made a run for freedom!');
            setShowPrisonEscape(false);
          }}
          onFailure={(extraYears) => {
            setCharacter((prev) => ({
              ...prev,
              prisonYearsLeft: prev.prisonYearsLeft + extraYears,
              happiness: clamp(prev.happiness - 20),
              health: clamp(prev.health - 15),
            }));
            addLogToCurrentYear(`My prison escape attempt failed! The guards beat me and tacked ${extraYears} extra years onto my sentence.`);
            setShowPrisonEscape(false);
          }}
          onClose={() => setShowPrisonEscape(false)}
        />
      )}

      {/* DMV Road Test */}
      {showDMV && (
        <DMVTestModal
          onPass={() => {
            setCharacter((prev) => ({
              ...prev,
              hasDriversLicense: true,
              happiness: clamp(prev.happiness + 15),
            }));
            addLogToCurrentYear("I passed my driver's test and received my driver's license!");
            setShowDMV(false);
          }}
          onFail={() => {
            setCharacter((prev) => ({
              ...prev,
              happiness: clamp(prev.happiness - 10),
            }));
            addLogToCurrentYear("I failed my driver's test at the DMV.");
            setShowDMV(false);
          }}
          onClose={() => setShowDMV(false)}
        />
      )}

      {/* Lottery Modal */}
      {showLottery && (
        <LotteryModal
          playerCash={character.money}
          currencySymbol={character.currencySymbol}
          onCashChange={(delta) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money + delta,
              lotteryWinsCount: delta > 100 ? (prev.lotteryWinsCount || 0) + 1 : (prev.lotteryWinsCount || 0),
            }));
            if (delta > 1000) {
              addLogToCurrentYear(`I won ${character.currencySymbol}${delta.toLocaleString()} in the lottery!`);
            }
          }}
          onClose={() => setShowLottery(false)}
        />
      )}

      {/* Crime Modal */}
      {showCrime && character.age >= 13 && (
        <CrimeModal
          character={character}
          characterAge={character.age}
          currencySymbol={character.currencySymbol}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onSuccessCrime={(cashGained, message) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money + cashGained,
              crimesCommitted: (prev.crimesCommitted || 0) + 1,
              karma: clamp(prev.karma - 15),
              happiness: clamp(prev.happiness + 15),
            }));
            addLogToCurrentYear(message);
            setShowCrime(false);
          }}
          onArrested={(sentenceYears, crimeTitle) => {
            const isMonarch =
              !!character.royalty?.isMonarch ||
              character.royalty?.title?.includes('King') ||
              character.royalty?.title?.includes('Queen') ||
              character.royalty?.title?.includes('Emperor') ||
              character.royalty?.title?.includes('Sultan') ||
              character.royalty?.title?.includes('Sovereign');
            const isPresident = character.politicalOffice?.level === 'President';

            if (isMonarch || isPresident) {
              const immunityNotice = isMonarch
                ? `👑 SOVEREIGN IMMUNITY: As Reigning Monarch, the Crown dismissed all charges for ${crimeTitle}!`
                : `🦅 EXECUTIVE IMMUNITY: As President, Executive Article II Immunity dismissed all charges for ${crimeTitle}!`;
              addLogToCurrentYear(immunityNotice);
              setShowCrime(false);
              return;
            }

            const isMinor = character.age < 18;
            setCharacter((prev) => ({
              ...prev,
              inPrison: true,
              prisonYearsLeft: sentenceYears,
              prisonRecord: [...prev.prisonRecord, `${crimeTitle} (${isMinor ? 'Juvenile Record' : 'Adult Record'})`],
              crimesCommitted: (prev.crimesCommitted || 0) + 1,
              job: isMinor ? prev.job : undefined,
              happiness: clamp(prev.happiness - 35),
            }));
            addLogToCurrentYear(
              isMinor
                ? `I was caught by authorities for ${crimeTitle} and sentenced to ${sentenceYears} year(s) in Juvenile Detention (Juvenile Hall)!`
                : `I was arrested for ${crimeTitle} and sentenced to ${sentenceYears} years in prison!`
            );
            setShowCrime(false);
          }}
          onClose={() => setShowCrime(false)}
        />
      )}

      {/* Doctor & Plastic Surgery */}
      {showDoctor && (
        <DoctorModal
          playerCash={character.money}
          playerAge={character.age}
          currencySymbol={character.currencySymbol}
          diseases={character.diseases}
          onCureDisease={(diseaseId, cost) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money - cost,
              diseases: prev.diseases.filter((d) => d.id !== diseaseId),
              health: clamp(prev.health + 25),
              happiness: clamp(prev.happiness + 20),
            }));
            addLogToCurrentYear('I was cured by the medical doctor at the hospital.');
          }}
          onBotchedSurgery={(damageLooks, cost) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money - cost,
              looks: clamp(prev.looks - damageLooks),
              happiness: clamp(prev.happiness - 25),
            }));
            addLogToCurrentYear('My cosmetic plastic surgery was horribly botched!');
          }}
          onSuccessfulSurgery={(bonusLooks, cost) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money - cost,
              looks: clamp(prev.looks + bonusLooks),
              happiness: clamp(prev.happiness + 20),
            }));
            addLogToCurrentYear('My cosmetic plastic surgery was an astounding success!');
          }}
          onWitchDoctorResult={(healed, cost, message) => {
            setCharacter((prev) => ({
              ...prev,
              money: prev.money - cost,
              diseases: healed ? [] : prev.diseases,
              health: healed ? clamp(prev.health + 30) : clamp(prev.health - 20),
              happiness: healed ? clamp(prev.happiness + 25) : clamp(prev.happiness - 20),
            }));
            addLogToCurrentYear(message);
          }}
          onClose={() => setShowDoctor(false)}
        />
      )}

      {/* Dating Love App */}
      {showDating && (
        <DatingModal
          playerAge={character.age}
          playerLooks={character.looks}
          playerSmarts={character.smarts}
          playerGender={character.gender}
          orientation={character.sexualOrientation}
          currencySymbol={character.currencySymbol}
          onNewPartner={(partner: Relationship, isCelebrity?: boolean) => {
            setCharacter((prev) => ({
              ...prev,
              relationships: [...prev.relationships, partner],
              happiness: clamp(prev.happiness + (isCelebrity ? 40 : 25)),
              fame: isCelebrity ? clamp(prev.fame + 25) : prev.fame,
              celebrityInteractions: isCelebrity
                ? (prev.celebrityInteractions || 0) + 1
                : prev.celebrityInteractions,
            }));
            addLogToCurrentYear(`Going Steady. You are now dating ${partner.name}.`);
            setShowDating(false);
          }}
          onClose={() => setShowDating(false)}
        />
      )}

      {/* Celebrity & Titans VIP Lounge */}
      {showCelebrities && character.age >= 18 && (
        <CelebrityModal
          character={character}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onClose={() => setShowCelebrities(false)}
        />
      )}

      {/* Political Office & Campaigns */}
      {showPolitics && (
        <PoliticsModal
          character={character}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onClose={() => setShowPolitics(false)}
        />
      )}

      {/* Royalty & Royal Court */}
      {showRoyalty && (
        <RoyaltyModal
          character={character}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onClose={() => setShowRoyalty(false)}
        />
      )}

      {/* Kendama & NAKO Championship Modal */}
      {showKendama && (
        <KendamaModal
          character={character}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onClose={() => setShowKendama(false)}
          initialTab={kendamaInitialTab}
        />
      )}

      {/* Daily Streak & Login Rewards Modal */}
      {showDailyStreak && (
        <DailyStreakModal
          character={character}
          onUpdateCharacter={setCharacter}
          onAddLog={addLogToCurrentYear}
          onOpenTimeZone={() => setShowTimeZoneModal(true)}
          onClose={() => {
            setShowDailyStreak(false);
            setStreakData(getDailyStreakData());
          }}
        />
      )}

      {/* Time Zone Selector Modal */}
      {showTimeZoneModal && (
        <TimeZoneModal
          onClose={() => {
            setShowTimeZoneModal(false);
            setStreakData(getDailyStreakData());
          }}
          onTimezoneChanged={(newTz) => {
            setCurrentTimezone(newTz);
            setStreakData(getDailyStreakData());
          }}
        />
      )}

      {/* Master Admin Dashboard & God Mode Modal */}
      {showAdminModal && (
        <AdminDashboardModal
          character={character}
          onUpdateCharacter={setCharacter}
          onTriggerEvent={(evt) => setActiveEvent(evt)}
          pastLives={pastLives}
          onUpdatePastLives={setPastLives}
          currentUser={currentUser}
          onOpenSystops={() => setShowSystopsModal(true)}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* Cloud Authentication & Database Modal */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          character={character}
          onCharacterLoaded={(loaded) => setCharacter(loaded)}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* SYStops Secret Dashboard Modal */}
      {showSystopsModal && (
        <SystopsDashboardModal
          onClose={() => setShowSystopsModal(false)}
        />
      )}
    </div>
  );
}
