import { Character, DailyStreakData, DailyStreakReward, Heirloom, KendamaItem } from '../types/bitlife';
import { clamp } from './lifeEngine';
import { getDateKeyInZone, getSelectedTimezone } from './timezone';

export const STREAK_STORAGE_KEY = 'bitlife_daily_streak_v1';

// 7-day cyclical reward calendar
export const DAILY_REWARDS_LADDER: DailyStreakReward[] = [
  {
    day: 1,
    title: 'Novice Awakening',
    cashBonus: 5000,
    statBonus: {
      health: 15,
      happiness: 15,
      karma: 5,
    },
    highlight: false,
  },
  {
    day: 2,
    title: 'Brain Boost & Lottery Rush',
    cashBonus: 10000,
    statBonus: {
      smarts: 20,
      happiness: 10,
    },
    specialItem: {
      type: 'LOTTERY_TICKETS',
      name: '5x Mega Millions Quick-Picks',
      description: '5 complimentary lottery tickets added straight to your ticket pouch!',
      icon: '🎟️',
    },
    highlight: false,
  },
  {
    day: 3,
    title: 'Glow-Up & Clout Surge',
    cashBonus: 20000,
    statBonus: {
      looks: 25,
      fame: 10,
      happiness: 15,
    },
    specialItem: {
      type: 'FREEZE_TOKEN',
      name: 'Streak Freeze Shield 🛡️',
      description: 'Protects your daily login streak from resetting if you miss a day!',
      icon: '🛡️',
    },
    highlight: false,
  },
  {
    day: 4,
    title: 'Sweets x NAKO Kendama Drop',
    cashBonus: 35000,
    statBonus: {
      smarts: 15,
      health: 10,
      happiness: 20,
    },
    specialItem: {
      type: 'KENDAMA',
      name: 'Sweets x NAKO Golden Maple Pro',
      description: 'Exclusive commemorative NAKO kendama with Cushion Clear coating and maple ken!',
      icon: '🎯',
    },
    highlight: true,
  },
  {
    day: 5,
    title: 'Fortune & Angelic Karma',
    cashBonus: 50000,
    statBonus: {
      karma: 35,
      happiness: 25,
      health: 15,
    },
    highlight: false,
  },
  {
    day: 6,
    title: 'High Roller All-Stat Surge',
    cashBonus: 75000,
    statBonus: {
      health: 15,
      happiness: 15,
      smarts: 15,
      looks: 15,
      fame: 10,
    },
    specialItem: {
      type: 'FREEZE_TOKEN',
      name: 'Streak Freeze Shield 🛡️',
      description: 'Another shield banked to protect your ongoing multi-week streak!',
      icon: '🛡️',
    },
    highlight: false,
  },
  {
    day: 7,
    title: 'Grand 7-Day Champion Jackpot',
    cashBonus: 150000,
    statBonus: {
      health: 30,
      happiness: 50,
      fame: 25,
      smarts: 20,
      looks: 20,
      karma: 25,
    },
    specialItem: {
      type: 'HEIRLOOM',
      name: '18K Solid Gold BitLife Crown',
      description: 'An appraisal-certified legendary family heirloom valued at $125,000!',
      icon: '👑',
    },
    highlight: true,
  },
];

export function getTodayDateString(): string {
  return getDateKeyInZone(new Date(), getSelectedTimezone());
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKeyInZone(yesterday, getSelectedTimezone());
}

export function getDaysAgoDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getDateKeyInZone(d, getSelectedTimezone());
}

export function getDefaultStreakData(): DailyStreakData {
  const today = getTodayDateString();
  return {
    currentStreak: 1,
    longestStreak: 1,
    lastLoginDate: today,
    lastClaimDate: '',
    freezeTokens: 1, // Start with 1 complimentary freeze token!
    totalClaims: 0,
    streakCycleDay: 1,
    claimedDates: [],
  };
}

export function getDailyStreakData(): DailyStreakData {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultStreakData();
      saveDailyStreakData(initial);
      return initial;
    }
    const parsed: DailyStreakData = JSON.parse(raw);
    return {
      currentStreak: Number(parsed.currentStreak) || 1,
      longestStreak: Number(parsed.longestStreak) || 1,
      lastLoginDate: parsed.lastLoginDate || getTodayDateString(),
      lastClaimDate: parsed.lastClaimDate || '',
      freezeTokens: typeof parsed.freezeTokens === 'number' ? parsed.freezeTokens : 1,
      totalClaims: Number(parsed.totalClaims) || 0,
      streakCycleDay: Number(parsed.streakCycleDay) || 1,
      claimedDates: Array.isArray(parsed.claimedDates) ? parsed.claimedDates : [],
    };
  } catch (e) {
    const fallback = getDefaultStreakData();
    saveDailyStreakData(fallback);
    return fallback;
  }
}

export function saveDailyStreakData(data: DailyStreakData): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save daily streak data', e);
  }
}

/**
 * Validates and updates daily streak state upon application boot or tab switch.
 */
export function checkAndUpdateStreakOnLogin(): {
  streakData: DailyStreakData;
  savedByFreeze: boolean;
  streakReset: boolean;
  isNewDay: boolean;
} {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const current = getDailyStreakData();

  let savedByFreeze = false;
  let streakReset = false;
  let isNewDay = false;

  if (current.lastLoginDate === today) {
    // Already launched today
    return { streakData: current, savedByFreeze: false, streakReset: false, isNewDay: false };
  }

  isNewDay = true;

  if (current.lastLoginDate === yesterday) {
    // Yesterday was logged in! Streak is intact.
    // If yesterday was claimed, advance streak day
    if (current.lastClaimDate === yesterday) {
      // Consecutive active streak!
      current.currentStreak += 1;
      if (current.currentStreak > current.longestStreak) {
        current.longestStreak = current.currentStreak;
      }
      current.streakCycleDay = ((current.streakCycleDay % 7) + 1);
    }
    current.lastLoginDate = today;
  } else {
    // Missed at least one calendar day
    const twoDaysAgo = getDaysAgoDateString(2);
    if (current.lastLoginDate === twoDaysAgo && current.freezeTokens > 0) {
      // Saved by freeze token!
      current.freezeTokens -= 1;
      savedByFreeze = true;
      current.lastLoginDate = today;
    } else {
      // Missed streak without protection
      streakReset = current.currentStreak > 1;
      current.currentStreak = 1;
      current.streakCycleDay = 1;
      current.lastLoginDate = today;
    }
  }

  saveDailyStreakData(current);
  return { streakData: current, savedByFreeze, streakReset, isNewDay };
}

export function isDailyRewardClaimable(): boolean {
  const today = getTodayDateString();
  const data = getDailyStreakData();
  return data.lastClaimDate !== today;
}

export function getCurrentRewardDefinition(cycleDay: number): DailyStreakReward {
  const normalizedIndex = ((cycleDay - 1) % 7 + 7) % 7;
  return DAILY_REWARDS_LADDER[normalizedIndex];
}

/**
 * Claims today's daily streak reward, updates character buffs, inventory, items, and streak data.
 */
export function claimDailyReward(character: Character): {
  updatedCharacter: Character;
  reward: DailyStreakReward;
  updatedStreak: DailyStreakData;
  bonusSummary: string[];
} {
  const today = getTodayDateString();
  const streak = getDailyStreakData();

  if (streak.lastClaimDate === today) {
    throw new Error("Today's daily reward has already been claimed.");
  }

  const reward = getCurrentRewardDefinition(streak.streakCycleDay);
  const bonusSummary: string[] = [];

  // Update character
  const updatedChar: Character = { ...character };

  // 1. Cash bonus
  updatedChar.money += reward.cashBonus;
  bonusSummary.push(`+${character.currencySymbol}${reward.cashBonus.toLocaleString()} Cash`);

  // 2. Stat boosts
  if (reward.statBonus) {
    if (reward.statBonus.health) {
      updatedChar.health = clamp(updatedChar.health + reward.statBonus.health);
      bonusSummary.push(`+${reward.statBonus.health}% Health`);
    }
    if (reward.statBonus.happiness) {
      updatedChar.happiness = clamp(updatedChar.happiness + reward.statBonus.happiness);
      bonusSummary.push(`+${reward.statBonus.happiness}% Happiness`);
    }
    if (reward.statBonus.smarts) {
      updatedChar.smarts = clamp(updatedChar.smarts + reward.statBonus.smarts);
      bonusSummary.push(`+${reward.statBonus.smarts}% Smarts`);
    }
    if (reward.statBonus.looks) {
      updatedChar.looks = clamp(updatedChar.looks + reward.statBonus.looks);
      bonusSummary.push(`+${reward.statBonus.looks}% Looks`);
    }
    if (reward.statBonus.karma) {
      updatedChar.karma = clamp(updatedChar.karma + reward.statBonus.karma);
      bonusSummary.push(`+${reward.statBonus.karma}% Karma`);
    }
    if (reward.statBonus.fame) {
      updatedChar.fame = clamp(updatedChar.fame + reward.statBonus.fame);
      bonusSummary.push(`+${reward.statBonus.fame}% Fame`);
    }
  }

  // 3. Special items & tokens
  let newFreezeTokens = streak.freezeTokens;
  if (reward.specialItem) {
    if (reward.specialItem.type === 'FREEZE_TOKEN') {
      newFreezeTokens += 1;
      bonusSummary.push('🛡️ +1 Streak Freeze Shield');
    } else if (reward.specialItem.type === 'HEIRLOOM') {
      const heirloom: Heirloom = {
        id: `streak_heirloom_${Date.now()}`,
        name: reward.specialItem.name,
        value: 125000,
        rarity: 'Super Rare',
        icon: reward.specialItem.icon,
      };
      updatedChar.heirlooms = [heirloom, ...(updatedChar.heirlooms || [])];
      bonusSummary.push(`✨ ${reward.specialItem.name} added to Attic Heirlooms ($125,000 value)`);
    } else if (reward.specialItem.type === 'KENDAMA') {
      const dama: KendamaItem = {
        id: `streak_dama_${Date.now()}`,
        name: reward.specialItem.name,
        brand: 'Sweets Kendamas',
        wood: 'Maple & Purpleheart',
        coating: 'Cushion Clear Tracking V2',
        condition: 100,
        price: 95,
        signedByMattJorgensen: true,
        timesPlayed: 0,
      };
      updatedChar.kendamas = [dama, ...(updatedChar.kendamas || [])];
      updatedChar.kendamaSkill = clamp((updatedChar.kendamaSkill || 0) + 20);
      bonusSummary.push(`🎯 ${reward.specialItem.name} added to Kendama Bag (+20 Skill)`);
    } else if (reward.specialItem.type === 'LOTTERY_TICKETS') {
      bonusSummary.push('🎟️ 5x Lucky Lottery Tickets (Instant Luck Buff)');
    }
  }

  // Update streak metrics
  const updatedStreak: DailyStreakData = {
    ...streak,
    lastClaimDate: today,
    totalClaims: streak.totalClaims + 1,
    freezeTokens: newFreezeTokens,
    claimedDates: [...streak.claimedDates, today],
  };

  saveDailyStreakData(updatedStreak);

  return {
    updatedCharacter: updatedChar,
    reward,
    updatedStreak,
    bonusSummary,
  };
}

/**
 * Calculates countdown until next midnight reset in the player's chosen timezone
 */
export function getTimeUntilNextReset(tzId: string = getSelectedTimezone()): { hours: number; minutes: number; seconds: number } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(now);

    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    const s = Number(parts.find((p) => p.type === 'second')?.value || 0);

    const totalSecsToday = h * 3600 + m * 60 + s;
    const totalSecsInDay = 86400;
    const diffSecs = (totalSecsInDay - totalSecsToday) % totalSecsInDay;

    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;

    return { hours, minutes, seconds };
  } catch {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }
}
