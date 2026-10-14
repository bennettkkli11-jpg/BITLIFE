export type Gender = 'Male' | 'Female' | 'Non-Binary';
export type SexualOrientation = 'Straight' | 'Bisexual' | 'Gay';

export type EducationLevel =
  | 'None'
  | 'Elementary'
  | 'Middle School'
  | 'High School'
  | 'University'
  | 'Graduate School'
  | 'Medical School'
  | 'Law School'
  | 'Business School';

export interface Disease {
  id: string;
  name: string;
  description: string;
  lethality: number; // 0-100% chance per year
  healthDrain: number;
  isCurable: boolean;
  costToCure: number;
}

export interface JobOccupation {
  id: string;
  title: string;
  company: string;
  salary: number;
  careerTrack: string;
  requiredEducation: EducationLevel;
  requiredSmarts: number;
  yearsInRole: number;
  performance: number; // 0-100
  stress: number; // 0-100
  timesWorkedHarderThisYear?: number;
  askedForRaiseThisYear?: boolean;
}

export interface PartTimeJob {
  id: string;
  title: string;
  hourlyRate: number;
  hoursPerWeek: number;
}

export interface RealEstate {
  id: string;
  name: string;
  type: 'Trailer' | 'Condo' | 'Suburban House' | 'Penthouse' | 'Mansion' | 'Castle';
  price: number;
  monthlyCost: number;
  condition: number; // 0-100
  hasMortgage: boolean;
  mortgageLeft: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'Compact' | 'Sedan' | 'SUV' | 'Sports Car' | 'Supercar' | 'Motorcycle';
  price: number;
  condition: number; // 0-100
}

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Parrot' | 'Snake' | 'Tiger' | 'Hamster';
  breed: string;
  age: number;
  relationshipLevel: number; // 0-100
  health: number; // 0-100
}

export interface Heirloom {
  id: string;
  name: string;
  value: number;
  rarity: 'Common' | 'Rare' | 'Very Rare' | 'Super Rare';
  icon: string;
}

export type KendamaBrand = 'Sweets Kendamas' | 'KROM Kendama' | 'Yuntrove' | 'Custom Craft';

export interface KendamaItem {
  id: string;
  name: string;
  brand: KendamaBrand;
  wood: string;
  coating: string;
  condition: number; // 0-100%
  price: number;
  signedByMattJorgensen?: boolean;
  timesPlayed?: number;
}

export type RelationType =
  | 'Mother'
  | 'Father'
  | 'Sister'
  | 'Brother'
  | 'Boyfriend'
  | 'Girlfriend'
  | 'Fiancé'
  | 'Husband'
  | 'Wife'
  | 'Son'
  | 'Daughter'
  | 'Friend';

export interface Relationship {
  id: string;
  name: string;
  relation: RelationType;
  age: number;
  alive: boolean;
  relationshipLevel: number; // 0-100
  smarts: number;
  looks: number;
  money: number;
  occupation: string;
}

export interface YearLog {
  age: number;
  yearNumber: number;
  events: string[];
}

export type RibbonType =
  | 'Mediocre'
  | 'Loaded'
  | 'Rich'
  | 'Hero'
  | 'Wicked'
  | 'Scandalous'
  | 'Jailbird'
  | 'Academic'
  | 'Geriatric'
  | 'High Roller'
  | 'Fertile'
  | 'Famous'
  | 'Globetrotter'
  | 'Unlucky'
  | 'Monarch'
  | 'Presidential'
  | 'Catanic';

export type PoliticalOfficeLevel =
  | 'School Board Director'
  | 'Mayor'
  | 'State Governor'
  | 'President';

export interface PoliticalOffice {
  title: string;
  level: PoliticalOfficeLevel;
  salary: number;
  termYearsLeft: number;
  totalYearsServed: number;
  approvalRating: number; // 0-100%
  party: string;
}

export interface RoyaltyInfo {
  title: string;
  country: string;
  respect: number; // 0-100%
  yearlyAllowance: number;
  isMonarch: boolean;
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  age: number;
  alive: boolean;
  causeOfDeath?: string;
  epitaph?: string;
  ribbon?: RibbonType;

  country: string;
  city: string;
  currencySymbol: string;
  flag: string;
  isUndocumented?: boolean;

  // Primary stats (0 - 100)
  happiness: number;
  health: number;
  smarts: number;
  looks: number;

  // Secondary stats (0 - 100)
  karma: number;
  fame: number;
  discipline: number;

  money: number;
  debt: number;

  // Education
  educationLevel: EducationLevel;
  educationMajor?: string;
  inSchool: boolean;
  schoolPerformance: number; // 0-100
  schoolYearsCompleted?: number; // Completed years in current degree program
  schoolTotalYears?: number; // Total years needed (e.g. 4 for University)
  completedDegrees?: string[]; // List of awarded diplomas & degrees

  // Licenses
  hasDriversLicense: boolean;
  hasPilotsLicense: boolean;

  // Career
  job?: JobOccupation;
  partTimeJob?: PartTimeJob;

  // Politics & Public Office
  politicalOffice?: PoliticalOffice;
  presidentialTermsWon?: number;
  politicalCampaignsRun?: number;

  // Royalty
  royalty?: RoyaltyInfo;

  // Assets
  realEstate: RealEstate[];
  vehicles: Vehicle[];
  pets: Pet[];
  heirlooms: Heirloom[];
  kendamas?: KendamaItem[];
  kendamaSkill?: number; // 0-100 (Novice to NAKO Legend)
  nakoTitlesWon?: number;

  // Relationships & Family
  relationships: Relationship[];

  // Health conditions
  diseases: Disease[];

  // Justice system
  inPrison: boolean;
  prisonYearsLeft: number;
  prisonRecord: string[];

  // Milestone / Achievement stats
  crimesCommitted: number;
  blackjackWinnings: number;
  escapedPrisonCount: number;
  lotteryWinsCount: number;
  celebrityInteractions: number;
  unlockedAchievements: string[];

  // Special Celebrity Life
  specialCelebrityId?: 'donald_trump' | 'elon_musk';
  specialCelebrityTitle?: string;

  // Chronicle
  lifeLog: YearLog[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Wealth' | 'Crime' | 'Career' | 'Life' | 'Gambling' | 'Secret';
  targetValue: number;
  unit?: string;
  isSecret?: boolean;
  isUltimate?: boolean;
}

export interface EventOption {
  text: string;
  action: () => {
    outcomeText: string;
    happinessChange?: number;
    healthChange?: number;
    smartsChange?: number;
    looksChange?: number;
    moneyChange?: number;
    karmaChange?: number;
    fameChange?: number;
    diseaseAdded?: Disease;
    diseaseCured?: string;
    arrested?: boolean;
    prisonSentence?: number;
    death?: boolean;
    causeOfDeath?: string;
    newRelationship?: Relationship;
    customEffect?: () => void;
  };
}

export interface LifeEvent {
  id: string;
  title: string;
  prompt: string;
  icon?: string;
  options: EventOption[];
}

export interface PastLifeRecord {
  id: string;
  fullName: string;
  age: number;
  gender: Gender;
  country: string;
  city: string;
  flag: string;
  netWorth: number;
  causeOfDeath: string;
  ribbon: RibbonType;
  loversCount: number;
  childrenCount: number;
  career: string;
  dateCompleted: string;
}

export interface DailyStreakReward {
  day: number;
  title: string;
  cashBonus: number;
  statBonus?: {
    happiness?: number;
    health?: number;
    smarts?: number;
    looks?: number;
    karma?: number;
    fame?: number;
  };
  specialItem?: {
    type: 'HEIRLOOM' | 'KENDAMA' | 'LOTTERY_TICKETS' | 'FREEZE_TOKEN';
    name: string;
    description: string;
    icon: string;
    data?: any;
  };
  highlight?: boolean;
}

export interface DailyStreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  lastClaimDate: string; // YYYY-MM-DD
  freezeTokens: number;
  totalClaims: number;
  streakCycleDay: number; // 1-7
  claimedDates: string[];
}

export interface GuestAccount {
  uid: string;
  displayName: string;
  email: string;
  isAnonymous: boolean;
  avatarEmoji: string;
  createdAt: string;
}

