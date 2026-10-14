import { KendamaItem, KendamaBrand } from '../types/bitlife';

export interface KendamaCatalogItem {
  id: string;
  name: string;
  brand: KendamaBrand;
  wood: string;
  coating: string;
  description: string;
  price: number;
  icon: string;
  skillBonus: number;
  condition: number;
}

export const KENDAMA_CATALOG: KendamaCatalogItem[] = [
  // --- SWEETS KENDAMAS ---
  {
    id: 'sweets_starter',
    name: 'Sweets Starter Solid',
    brand: 'Sweets Kendamas',
    wood: 'Beech Wood',
    coating: 'Sticky Clear',
    description: 'The beloved classic entry kendama by Sweets Kendamas. Perfect tracking and oversized cups.',
    price: 25,
    icon: '🎯',
    skillBonus: 5,
    condition: 100,
  },
  {
    id: 'sweets_boost_radar',
    name: 'Sweets Boost Radar',
    brand: 'Sweets Kendamas',
    wood: 'Beech Wood',
    coating: 'Prime Sticky Clear',
    description: 'Iconic Sweets radar tracking lines with the famous Boost shape. Incredible for cups and lunars.',
    price: 35,
    icon: '🎯',
    skillBonus: 10,
    condition: 100,
  },
  {
    id: 'sweets_amped_cushion',
    name: 'Sweets Amped Cushion Clear',
    brand: 'Sweets Kendamas',
    wood: 'Maple Ken / Beech Tama',
    coating: 'Sweets Cushion Clear',
    description: 'Legendary matte Cushion Clear formula developed in Minnesota. Grippy, pillow-soft stalls for birds and stilts.',
    price: 65,
    icon: '🎯',
    skillBonus: 18,
    condition: 100,
  },
  {
    id: 'sweets_jorgensen_pro',
    name: 'Sweets Matt "Sweets" Jorgensen Signature Pro Model',
    brand: 'Sweets Kendamas',
    wood: 'Maple & Walnut Laminate',
    coating: 'Custom Cushion Clear 2.0',
    description: 'The official signature pro kendama of founder Matt Jorgensen! Custom engraved Sweets arrows, balance hole, and maximum honed weight.',
    price: 85,
    icon: '🌟',
    skillBonus: 25,
    condition: 100,
  },
  {
    id: 'sweets_legend_craft',
    name: 'Sweets Legend Hand-Turned Walnut',
    brand: 'Sweets Kendamas',
    wood: 'American Walnut & Ash',
    coating: 'Hand-Dipped Cushion Clear',
    description: 'Boutique hand-crafted Kendama turned in the USA by master artisans at the Sweets workshop.',
    price: 130,
    icon: '🪵',
    skillBonus: 30,
    condition: 100,
  },
  {
    id: 'sweets_nako_gold',
    name: 'Sweets NAKO Special Edition Gold Championship',
    brand: 'Sweets Kendamas',
    wood: 'Hard Rock Maple & Purpleheart',
    coating: '24K Gold Splatter Cushion Clear',
    description: 'The commemorative North American Kendama Open (NAKO) championship weapon. Made exclusively for podium contenders.',
    price: 220,
    icon: '🏆',
    skillBonus: 38,
    condition: 100,
  },

  // --- KROM KENDAMA ---
  {
    id: 'krom_pop_2',
    name: 'KROM Pop 2.0',
    brand: 'KROM Kendama',
    wood: 'Grade-A Beech',
    coating: 'KROM Rubber Silk Paint',
    description: 'Copenhagen design with wide CK shape and skinny spike. The worldwide standard for street style.',
    price: 25,
    icon: '🇩🇰',
    skillBonus: 6,
    condition: 100,
  },
  {
    id: 'krom_strogo',
    name: 'KROM Gas Strogo Edition',
    brand: 'KROM Kendama',
    wood: 'Beech & Birch',
    coating: 'KROM LOL Clear',
    description: 'Designed for fast slinger combos and lightning quick tap tricks.',
    price: 45,
    icon: '🇩🇰',
    skillBonus: 12,
    condition: 100,
  },
  {
    id: 'krom_slaydawg_2',
    name: 'KROM Slaydawg 2',
    brand: 'KROM Kendama',
    wood: '100% Solid Maple',
    coating: 'KROM Super LOL Clear',
    description: 'The heavyweight championship beast designed by KROM world champs with oversized 2-Good shape.',
    price: 68,
    icon: '🇩🇰',
    skillBonus: 20,
    condition: 100,
  },
  {
    id: 'krom_noia_beams',
    name: 'KROM Noia Beams',
    brand: 'KROM Kendama',
    wood: 'Ash Wood with Heavy Grain',
    coating: 'KROM LOL Clear',
    description: 'Mesmerizing kaleidoscopic generative art patterns for ultra-sharp eye tracking and orientation.',
    price: 75,
    icon: '🌈',
    skillBonus: 22,
    condition: 100,
  },
  {
    id: 'krom_dj_pro_mod',
    name: 'KROM DJ Pro Mod 2-Good',
    brand: 'KROM Kendama',
    wood: 'Maple & Purpleheart Splice',
    coating: 'High-Tech LOL Clear',
    description: 'Pro model engineered with base cup warp hole for insane lunar balance point and rapid flips.',
    price: 88,
    icon: '🔥',
    skillBonus: 26,
    condition: 100,
  },

  // --- YUNTROVE ---
  {
    id: 'yuntrove_birch_classic',
    name: 'Yuntrove Birch Classic',
    brand: 'Yuntrove',
    wood: 'Selected Silver Birch',
    coating: 'Yuntrove Satin Matte Coat',
    description: 'Precision balanced ken crafted by Yuntrove with clean minimalist aesthetics and acoustic clicks.',
    price: 28,
    icon: '🍃',
    skillBonus: 8,
    condition: 100,
  },
  {
    id: 'yuntrove_hybrid_bamboo',
    name: 'Yuntrove Beech & Bamboo Hybrid',
    brand: 'Yuntrove',
    wood: 'Segmented Beech & Bamboo',
    coating: 'Yuntrove Grip Silk Clear',
    description: 'Laminated vertical bamboo stripes give an unmistakable crisp stall click and featherlight sling.',
    price: 52,
    icon: '🎋',
    skillBonus: 16,
    condition: 100,
  },
  {
    id: 'yuntrove_purpleheart_balance',
    name: 'Yuntrove Purpleheart Balance Mod',
    brand: 'Yuntrove',
    wood: 'Royal Purpleheart & Sugar Maple',
    coating: 'Yuntrove High-Tack Clear',
    description: 'Distinctive deep purple exotic wood ring for lower center of gravity and effortless birds.',
    price: 82,
    icon: '💜',
    skillBonus: 24,
    condition: 100,
  },
  {
    id: 'yuntrove_damascus_masterpiece',
    name: 'Yuntrove Damascus Wood Masterpiece',
    brand: 'Yuntrove',
    wood: 'Multi-Ply Laminated Damascus Wood',
    coating: 'Micro-Texture Zero-Slip Clear',
    description: 'Stunning swirling wood grain patterns reminiscent of Damascus steel. Top-tier collector craft.',
    price: 120,
    icon: '⚔️',
    skillBonus: 32,
    condition: 100,
  },
  {
    id: 'yuntrove_cosmic_craft',
    name: 'Yuntrove Cosmic Craft Prototype',
    brand: 'Yuntrove',
    wood: 'Stabilized Burl & Wenge',
    coating: 'Space Grip Polymer',
    description: 'Extremely rare hand-poured stabilized dyed burl wood with laser-engraved serial numbering.',
    price: 175,
    icon: '🌌',
    skillBonus: 36,
    condition: 100,
  },
];

export interface KendamaTrick {
  id: string;
  name: string;
  japaneseName: string;
  difficulty: number; // 1-100
  requiredSkill: number;
  xpGain: number;
  description: string;
  icon: string;
}

export const KENDAMA_TRICKS: KendamaTrick[] = [
  {
    id: 'big_cup',
    name: 'Big Cup (Ozara)',
    japaneseName: '大皿',
    difficulty: 10,
    requiredSkill: 0,
    xpGain: 5,
    description: 'Pull the tama straight up and catch it smoothly on the largest cup.',
    icon: '🥣',
  },
  {
    id: 'candle',
    name: 'Candlestick (Rosoku)',
    japaneseName: 'ろうそく',
    difficulty: 20,
    requiredSkill: 5,
    xpGain: 8,
    description: 'Hold the ken upside-down by the spike and catch the tama on the base cup.',
    icon: '🕯️',
  },
  {
    id: 'around_the_block',
    name: 'Around the Block (Moshikame)',
    japaneseName: 'もしもし亀よ',
    difficulty: 30,
    requiredSkill: 15,
    xpGain: 12,
    description: 'Bounce the ball rhythmically between the big cup and base cup to the beat!',
    icon: '🐢',
  },
  {
    id: 'around_the_usa',
    name: 'Around the USA',
    japaneseName: 'アラウンド・USA',
    difficulty: 45,
    requiredSkill: 25,
    xpGain: 16,
    description: 'Big Cup -> Small Cup -> Spike -> Base Cup -> Spike in one fluid motion!',
    icon: '🇺🇸',
  },
  {
    id: 'bird_stall',
    name: 'Bird (Tori)',
    japaneseName: 'うぐいす',
    difficulty: 60,
    requiredSkill: 40,
    xpGain: 22,
    description: 'Perch the ball delicately on the bevel between the cup rim and the spike. Pure finesse.',
    icon: '🐦',
  },
  {
    id: 'lighthouse',
    name: 'Lighthouse (Todai)',
    japaneseName: '灯台',
    difficulty: 70,
    requiredSkill: 50,
    xpGain: 26,
    description: 'Pull the ken straight up and balance the base cup squarely on top of the tama!',
    icon: '🗼',
  },
  {
    id: 'lunar',
    name: 'Lunar (Tsuki)',
    japaneseName: '月面着陸',
    difficulty: 78,
    requiredSkill: 60,
    xpGain: 30,
    description: 'Balance the big cup tilted horizontally across the tama like an astronaut landing on the moon.',
    icon: '🌙',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind (Senpuu)',
    japaneseName: '旋風',
    difficulty: 86,
    requiredSkill: 70,
    xpGain: 36,
    description: 'Earth turn the tama 360 while spinning the ken 360 in the air and lacing the spike!',
    icon: '🌪️',
  },
  {
    id: 'kenflip_spike',
    name: '1-2-3 Kenflip to Spike',
    japaneseName: 'ケンフリップ連打',
    difficulty: 92,
    requiredSkill: 80,
    xpGain: 42,
    description: 'Toss the ken into rapid multiple rotations before spiking the descending tama.',
    icon: '⚡',
  },
  {
    id: 'inward_lunar_juggle',
    name: 'Inward Lunar Juggle to Spike',
    japaneseName: 'ジャグリング・スパイク',
    difficulty: 98,
    requiredSkill: 90,
    xpGain: 50,
    description: 'Inward lunar, pop both into the air, juggle the tama and ken mid-flight, and land clean on the spike!',
    icon: '🔥',
  },
];

export interface NakoDivision {
  id: string;
  name: string;
  subtitle: string;
  entryFee: number;
  recommendedSkill: number;
  prizeMoney: number;
  trophyName: string;
  fameReward: number;
}

export const NAKO_DIVISIONS: NakoDivision[] = [
  {
    id: 'nako_beginner',
    name: 'NAKO Beginner Ladder',
    subtitle: 'Entry bracket for new slingers',
    entryFee: 30,
    recommendedSkill: 15,
    prizeMoney: 300,
    trophyName: 'NAKO Beginner Bronze Medal 🥉',
    fameReward: 8,
  },
  {
    id: 'nako_intermediate',
    name: 'NAKO Intermediate Open',
    subtitle: 'Competitive bracket for seasoned players',
    entryFee: 75,
    recommendedSkill: 40,
    prizeMoney: 1500,
    trophyName: 'NAKO Intermediate Silver Cup 🥈',
    fameReward: 16,
  },
  {
    id: 'nako_pro',
    name: 'NAKO Pro Speed Ladder',
    subtitle: 'Elite competition against sponsored riders',
    entryFee: 175,
    recommendedSkill: 65,
    prizeMoney: 6000,
    trophyName: 'NAKO Pro Gold Championship Belt 🥇',
    fameReward: 30,
  },
  {
    id: 'nako_freestyle',
    name: 'NAKO Open Freestyle World Championship',
    subtitle: 'Main event: 45-second run against the best on Earth',
    entryFee: 350,
    recommendedSkill: 85,
    prizeMoney: 20000,
    trophyName: 'NAKO World Grand Champion Ring & Trophy 💍🏆',
    fameReward: 50,
  },
];
