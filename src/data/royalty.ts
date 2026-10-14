export interface RoyalDecree {
  id: string;
  title: string;
  icon: string;
  description: string;
  respectChange: number;
  karmaChange: number;
  cost?: number;
}

export const ROYAL_DECREES: RoyalDecree[] = [
  {
    id: 'charity_patronage',
    title: 'Sovereign Patronage for Children’s Hospitals',
    icon: '🏥',
    description: 'Donate royal trust funds to pediatric medical wards and establish a national health fund.',
    respectChange: 15,
    karmaChange: 15,
    cost: 500000,
  },
  {
    id: 'national_holiday',
    title: 'Proclaim Royal Jubilee National Holiday',
    icon: '🎉',
    description: 'Grant every worker in the kingdom a paid holiday with public street festivals and fireworks.',
    respectChange: 20,
    karmaChange: 10,
    cost: 1000000,
  },
  {
    id: 'historic_preservation',
    title: 'Protect Ancient Castle & Rainforest Sanctuaries',
    icon: '🏰',
    description: 'Declare thousands of square kilometers of pristine nature as inviolable Royal Forest Reserves.',
    respectChange: 12,
    karmaChange: 10,
    cost: 750000,
  },
  {
    id: 'tyrannical_curfew',
    title: 'Impose Royal Curfew & Censorship of Critics',
    icon: '⚔️',
    description: 'Command royal guards to silence dissenting tabloid journalists and enforce sovereign obedience.',
    respectChange: -30,
    karmaChange: -25,
  },
  {
    id: 'palace_renovation',
    title: 'Commission 24-Karat Gold Throne Room Extravaganza',
    icon: '👑',
    description: 'Import rare Italian marble, crystal chandeliers, and gold leaf for the Grand Ballroom.',
    respectChange: -12,
    karmaChange: -10,
    cost: 3000000,
  },
];

export const KNIGHTHOOD_CANDIDATES = [
  { name: 'Dr. Evelyn Vance', field: 'Nobel Prize in Medicine', icon: '🧬' },
  { name: 'Marcus Sterling', field: 'Olympic Gold Decathlon Champion', icon: '🏅' },
  { name: 'Professor Alistair Finch', field: 'Pioneering Quantum Astrophysicist', icon: '🔭' },
  { name: 'Elena Rostova', field: 'World-Renowned Concert Pianist', icon: '🎹' },
  { name: 'Captain Samuel Davies', field: 'Heroic Naval Search & Rescue Commander', icon: '⚓' },
];

export interface RoyalSuitor {
  name: string;
  title: string;
  country: string;
  flag: string;
  age: number;
  looks: number;
  smarts: number;
  netWorth: number;
  avatar: string;
}

export const ROYAL_SUITORS_POOL: RoyalSuitor[] = [
  {
    name: 'Prince George of Windsor',
    title: 'Prince',
    country: 'United Kingdom',
    flag: '🇬🇧',
    age: 28,
    looks: 92,
    smarts: 85,
    netWorth: 85000000,
    avatar: '🤴',
  },
  {
    name: 'Princess Charlotte of Wales',
    title: 'Princess',
    country: 'United Kingdom',
    flag: '🇬🇧',
    age: 26,
    looks: 95,
    smarts: 90,
    netWorth: 95000000,
    avatar: '👸',
  },
  {
    name: 'Hereditary Prince Jacques Grimaldi',
    title: 'Hereditary Prince',
    country: 'Monaco',
    flag: '🇲🇨',
    age: 30,
    looks: 94,
    smarts: 88,
    netWorth: 240000000,
    avatar: '🤴',
  },
  {
    name: 'Princess Gabriella of Monaco',
    title: 'Princess',
    country: 'Monaco',
    flag: '🇲🇨',
    age: 29,
    looks: 96,
    smarts: 89,
    netWorth: 260000000,
    avatar: '👸',
  },
  {
    name: 'Muhammed bin Salmad',
    title: 'Crown Sovereign',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    age: 33,
    looks: 92,
    smarts: 95,
    netWorth: 8000000000,
    avatar: '👑',
  },
  {
    name: 'Infanta Sofia of Bourbon',
    title: 'Princess of Asturias',
    country: 'Spain',
    flag: '🇪🇸',
    age: 27,
    looks: 93,
    smarts: 88,
    netWorth: 65000000,
    avatar: '👸',
  },
  {
    name: 'Prince Carl Philip of Sweden',
    title: 'Duke of Värmland',
    country: 'Sweden',
    flag: '🇸🇪',
    age: 34,
    looks: 96,
    smarts: 84,
    netWorth: 55000000,
    avatar: '🤴',
  },
  {
    name: 'Crown Prince Christian of Denmark',
    title: 'Crown Prince of Denmark',
    country: 'Denmark',
    flag: '🇩🇰',
    age: 23,
    looks: 91,
    smarts: 87,
    netWorth: 48000000,
    avatar: '🤴',
  },
  {
    name: 'Princess Elisabeth of Belgium',
    title: 'Duchess of Brabant',
    country: 'Belgium',
    flag: '🇧🇪',
    age: 25,
    looks: 94,
    smarts: 92,
    netWorth: 62000000,
    avatar: '👸',
  },
  {
    name: 'Princess Sirivannavari of Thailand',
    title: 'Princess of Thailand',
    country: 'Thailand',
    flag: '🇹🇭',
    age: 31,
    looks: 93,
    smarts: 89,
    netWorth: 350000000,
    avatar: '👸',
  },
  {
    name: 'Sheikh Hamdan Al Maktoum',
    title: 'Crown Prince of the Emirates',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    age: 32,
    looks: 97,
    smarts: 91,
    netWorth: 920000000,
    avatar: '🤴',
  },
  {
    name: 'Crown Prince Hussein of Jordan',
    title: 'Crown Prince of Jordan',
    country: 'Jordan',
    flag: '🇯🇴',
    age: 29,
    looks: 93,
    smarts: 90,
    netWorth: 110000000,
    avatar: '🤴',
  },
  {
    name: 'Princess Catharina-Amalia',
    title: 'Princess of Orange',
    country: 'Netherlands',
    flag: '🇳🇱',
    age: 24,
    looks: 89,
    smarts: 93,
    netWorth: 75000000,
    avatar: '👸',
  },
  {
    name: 'Princess Ingrid Alexandra of Norway',
    title: 'Crown Princess',
    country: 'Norway',
    flag: '🇳🇴',
    age: 24,
    looks: 95,
    smarts: 88,
    netWorth: 58000000,
    avatar: '👸',
  },
  {
    name: 'Prince Fumihito of Akishino',
    title: 'Crown Prince',
    country: 'Japan',
    flag: '🇯🇵',
    age: 33,
    looks: 87,
    smarts: 95,
    netWorth: 85000000,
    avatar: '🤴',
  },
];
