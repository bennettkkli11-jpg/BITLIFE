import { Character } from '../types/bitlife';
import { calculateNetWorth } from '../utils/lifeEngine';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Wealth' | 'Crime' | 'Career' | 'Life' | 'Gambling' | 'Secret';
  targetValue: number;
  unit?: string;
  isSecret?: boolean;
  isUltimate?: boolean;
  formatValue?: (val: number) => string;
  getCurrentValue: (char: Character) => number;
}

export const ACHIEVEMENTS: AchievementItem[] = [
  // WEALTH
  {
    id: 'millionaire',
    title: 'Amass 1 Million',
    description: 'Reach an estimated net worth of $1,000,000 or more.',
    icon: '💰',
    category: 'Wealth',
    targetValue: 1000000,
    unit: '$',
    formatValue: (v) => `$${Math.max(0, v).toLocaleString()}`,
    getCurrentValue: (char) => calculateNetWorth(char),
  },
  {
    id: 'multimillionaire',
    title: 'Multimillionaire',
    description: 'Amass a vast fortune of $10,000,000 or greater.',
    icon: '💎',
    category: 'Wealth',
    targetValue: 10000000,
    unit: '$',
    formatValue: (v) => `$${Math.max(0, v).toLocaleString()}`,
    getCurrentValue: (char) => calculateNetWorth(char),
  },
  {
    id: 'real_estate_mogul',
    title: 'Property Tycoon',
    description: 'Own 3 or more pieces of real estate at the same time.',
    icon: '🏰',
    category: 'Wealth',
    targetValue: 3,
    unit: 'properties',
    getCurrentValue: (char) => char.realEstate.length,
  },
  {
    id: 'supercar_owner',
    title: 'Need for Speed',
    description: 'Purchase and own a Sports Car or Supercar in your garage.',
    icon: '🏎️',
    category: 'Wealth',
    targetValue: 1,
    unit: 'car',
    getCurrentValue: (char) =>
      char.vehicles.filter((v) => v.type === 'Sports Car' || v.type === 'Supercar').length,
  },

  // CRIME
  {
    id: 'crime_spree',
    title: 'Commit 10 Crimes',
    description: 'Engage in a continuous life of crime by pulling off 10 criminal acts.',
    icon: '🦹',
    category: 'Crime',
    targetValue: 10,
    unit: 'crimes',
    getCurrentValue: (char) => char.crimesCommitted || 0,
  },
  {
    id: 'mastermind',
    title: 'Underworld Kingpin',
    description: 'Commit 25 criminal operations across your life.',
    icon: '🎭',
    category: 'Crime',
    targetValue: 25,
    unit: 'crimes',
    getCurrentValue: (char) => char.crimesCommitted || 0,
  },
  {
    id: 'great_escape',
    title: 'The Great Escape',
    description: 'Successfully outsmart prison guards and break out of maximum security.',
    icon: '🚨',
    category: 'Crime',
    targetValue: 1,
    unit: 'escape',
    getCurrentValue: (char) => char.escapedPrisonCount || 0,
  },

  // LIFE & HEALTH
  {
    id: 'centenarian',
    title: 'Centenarian',
    description: 'Defy the odds and live to reach the grand age of 100 years old.',
    icon: '🎂',
    category: 'Life',
    targetValue: 100,
    unit: 'yrs',
    getCurrentValue: (char) => char.age,
  },
  {
    id: 'peak_vitality',
    title: 'Peak Vitality',
    description: 'Achieve a state of total bliss with 100% Health and 100% Happiness.',
    icon: '✨',
    category: 'Life',
    targetValue: 1,
    unit: 'milestone',
    getCurrentValue: (char) => (char.health >= 100 && char.happiness >= 100 ? 1 : 0),
  },
  {
    id: 'big_family',
    title: 'Fertile Dynasty',
    description: 'Raise a big and bustling family with 3 or more children.',
    icon: '👶',
    category: 'Life',
    targetValue: 3,
    unit: 'children',
    getCurrentValue: (char) =>
      char.relationships.filter((r) => r.relation === 'Son' || r.relation === 'Daughter').length,
  },
  {
    id: 'attic_hunter',
    title: 'Heirloom Collector',
    description: 'Discover and hoard 3 or more antique heirlooms from the attic.',
    icon: '🏆',
    category: 'Life',
    targetValue: 3,
    unit: 'heirlooms',
    getCurrentValue: (char) => char.heirlooms.length,
  },

  // CAREER & ACADEMICS
  {
    id: 'doctorate_scholar',
    title: 'Doctorate Scholar',
    description: 'Graduate from Medical School or Law School.',
    icon: '🎓',
    category: 'Career',
    targetValue: 1,
    unit: 'degree',
    getCurrentValue: (char) =>
      char.educationLevel === 'Medical School' || char.educationLevel === 'Law School' ? 1 : 0,
  },
  {
    id: 'c_suite_leader',
    title: 'Executive Pinnacle',
    description: 'Ascend to top leadership as a CEO, CTO, or Chief of Surgery.',
    icon: '💼',
    category: 'Career',
    targetValue: 1,
    unit: 'role',
    getCurrentValue: (char) => {
      const title = char.job?.title?.toLowerCase() || '';
      return title.includes('ceo') ||
        title.includes('cto') ||
        title.includes('chief of surgery') ||
        title.includes('managing director')
        ? 1
        : 0;
    },
  },

  // GAMBLING
  {
    id: 'casino_shark',
    title: 'Casino Shark',
    description: 'Rake in over $10,000 in net winnings at Diamond Casino Blackjack.',
    icon: '♠️',
    category: 'Gambling',
    targetValue: 10000,
    unit: '$',
    formatValue: (v) => `$${Math.max(0, v).toLocaleString()}`,
    getCurrentValue: (char) => char.blackjackWinnings || 0,
  },
  {
    id: 'lottery_winner',
    title: 'Lucky Strike',
    description: 'Match the numbers and win a prize in the Mega Millions Lottery.',
    icon: '🎟️',
    category: 'Gambling',
    targetValue: 1,
    unit: 'win',
    getCurrentValue: (char) => char.lotteryWinsCount || 0,
  },
  {
    id: 'celebrity_orbit',
    title: 'Titan Handshake',
    description: 'Mingle, pitch, or romance world leaders & titans like DJT, Jeff Bezos, or Sundar Pichai.',
    icon: '🌟',
    category: 'Career',
    targetValue: 1,
    unit: 'encounter',
    getCurrentValue: (char) => char.celebrityInteractions || 0,
  },
  {
    id: 'commander_in_chief',
    title: 'Commander-in-Chief',
    description: 'Win the Presidency or Head of State election with an epic $100M+ war chest!',
    icon: '🦅',
    category: 'Career',
    targetValue: 1,
    unit: 'term',
    getCurrentValue: (char) =>
      (char.presidentialTermsWon && char.presidentialTermsWon > 0) ||
      char.politicalOffice?.level === 'President'
        ? 1
        : 0,
  },
  {
    id: 'crowned_monarch',
    title: 'Crowned Sovereign',
    description: 'Reign as royal nobility (King, Queen, Crown Prince, Princess, or Sultan).',
    icon: '👑',
    category: 'Career',
    targetValue: 1,
    unit: 'title',
    getCurrentValue: (char) => (char.royalty ? 1 : 0),
  },
  {
    id: 'reign_of_respect',
    title: 'Sovereign Devotion',
    description: 'Earn 90% or higher Royal Respect from your kingdom’s loyal subjects.',
    icon: '✨',
    category: 'Life',
    targetValue: 1,
    unit: 'milestone',
    getCurrentValue: (char) => (char.royalty && char.royalty.respect >= 90 ? 1 : 0),
  },

  // SECRET ACHIEVEMENTS (UNLOCKED BY ACHIEVING OTHER ACHIEVEMENTS)
  {
    id: 'secret_achievement_hunter',
    title: 'Secret: The Trophy Hunter',
    description: 'Unlock 5 other achievements in the game to prove your mastery across multiple paths.',
    icon: '🗝️',
    category: 'Secret',
    isSecret: true,
    targetValue: 5,
    unit: 'unlocked',
    getCurrentValue: (char) =>
      (char.unlockedAchievements || []).filter(
        (id) => id !== 'secret_achievement_hunter' && id !== 'secret_master_of_destiny'
      ).length,
  },
  {
    id: 'secret_master_of_destiny',
    title: 'Secret: Omnipotent Legend',
    description: 'Unlock 10 other achievements across wealth, crime, royalty, career, and life milestones.',
    icon: '🔮',
    category: 'Secret',
    isSecret: true,
    targetValue: 10,
    unit: 'unlocked',
    getCurrentValue: (char) =>
      (char.unlockedAchievements || []).filter(
        (id) =>
          id !== 'secret_achievement_hunter' &&
          id !== 'secret_master_of_destiny' &&
          id !== 'secret_god_of_everything'
      ).length,
  },

  // =========================================================================
  // THE SPECIAL ONE FOR EVERYTHING: THE ULTIMATE 100% ACHIEVEMENT
  // =========================================================================
  {
    id: 'secret_god_of_everything',
    title: 'The Omnipotent God: Master of Everything',
    description: 'The supreme pinnacle of BitLife! Achieve absolute 100% perfection by unlocking every single other achievement in the game.',
    icon: '🌌',
    category: 'Secret',
    isSecret: true,
    isUltimate: true,
    targetValue: 21,
    unit: 'milestones',
    getCurrentValue: (char) => {
      const allOtherIds = ACHIEVEMENTS.filter((a) => a.id !== 'secret_god_of_everything').map((a) => a.id);
      const unlocked = new Set(char.unlockedAchievements || []);
      return allOtherIds.filter((id) => unlocked.has(id)).length;
    },
  },
];
