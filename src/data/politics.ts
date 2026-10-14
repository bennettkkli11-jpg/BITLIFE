import { PoliticalOfficeLevel } from '../types/bitlife';

export interface OfficeDefinition {
  level: PoliticalOfficeLevel;
  titlePattern: string; // e.g. "President of the {country}" or "Mayor of {city}"
  minAge: number;
  minCampaignBudget: number; // recommended / required
  strictMinBudgetForPresident: number; // $100,000,000
  salary: number;
  termYears: number;
  fameBonus: number;
  description: string;
}

export const POLITICAL_OFFICES: OfficeDefinition[] = [
  {
    level: 'School Board Director',
    titlePattern: 'School Board Director',
    minAge: 21,
    minCampaignBudget: 15000,
    strictMinBudgetForPresident: 0,
    salary: 22000,
    termYears: 2,
    fameBonus: 10,
    description: 'Oversee local district education curricula, teacher budgets, and school policies.',
  },
  {
    level: 'Mayor',
    titlePattern: 'Mayor of {city}',
    minAge: 25,
    minCampaignBudget: 350000,
    strictMinBudgetForPresident: 0,
    salary: 145000,
    termYears: 4,
    fameBonus: 35,
    description: 'Executive leadership over municipal police, emergency services, city planning, and local commerce.',
  },
  {
    level: 'State Governor',
    titlePattern: 'Governor / Premier',
    minAge: 30,
    minCampaignBudget: 5000000,
    strictMinBudgetForPresident: 0,
    salary: 235000,
    termYears: 4,
    fameBonus: 65,
    description: 'Govern state administration, sign statewide legislative budgets, and lead the National Guard.',
  },
  {
    level: 'President',
    titlePattern: '{headOfState} of {country}',
    minAge: 35,
    minCampaignBudget: 100000000, // $100M minimum
    strictMinBudgetForPresident: 100000000, // STRICT: AT LEAST $100M
    salary: 400000,
    termYears: 4,
    fameBonus: 100,
    description: 'Highest political office on Earth. Commander-in-Chief of the armed forces, leader of the free world, Air Force One, and Oval Office authority. REQUIRES AT LEAST $100M TO WIN!',
  },
];

export const POLITICAL_PARTIES = [
  { name: 'Democratic Party', icon: '🔵', color: 'from-blue-600 to-indigo-700' },
  { name: 'Republican Party', icon: '🔴', color: 'from-red-600 to-rose-700' },
  { name: 'Independent / Unity Party', icon: '⚪', color: 'from-purple-600 to-slate-700' },
  { name: 'Conservative Party', icon: '🔷', color: 'from-blue-700 to-cyan-800' },
  { name: 'Labour Party', icon: '🌹', color: 'from-rose-600 to-red-800' },
  { name: 'Green Alliance', icon: '🌿', color: 'from-emerald-600 to-teal-700' },
];

export const CAMPAIGN_PLATFORMS = [
  { id: 'econ', title: 'Economic Boom & Tax Cuts', icon: '📈', appeal: 'Business & Middle Class' },
  { id: 'tech', title: 'AI & Quantum Moonshot Initiative', icon: '🤖', appeal: 'Young Voters & Tech' },
  { id: 'health', title: 'Universal Healthcare Overhaul', icon: '🏥', appeal: 'Working Families' },
  { id: 'defense', title: 'Strong National Defense & Space Force', icon: '🛡️', appeal: 'Patriots & Military' },
  { id: 'infra', title: 'High-Speed Rail & Green Grid', icon: '🚅', appeal: 'Innovators & Environmentalists' },
];

export interface LegislativeBill {
  id: string;
  title: string;
  category: string;
  description: string;
  approvalChangeSuccess: number;
  approvalChangeFail: number;
}

export const PRESIDENTIAL_BILLS: LegislativeBill[] = [
  {
    id: 'ai_moonshot_act',
    title: 'The National AI & Quantum Dominance Act',
    category: 'Technology & Defense',
    description: 'Federally fund cutting-edge sovereign supercomputing labs and AI engineering apprenticeships.',
    approvalChangeSuccess: 12,
    approvalChangeFail: -6,
  },
  {
    id: 'tax_relief_act',
    title: 'Middle-Class Prosperity Tax Cut',
    category: 'Economy',
    description: 'Slashing income tax rates for everyday families while closing offshore billionaire loopholes.',
    approvalChangeSuccess: 15,
    approvalChangeFail: -8,
  },
  {
    id: 'bullet_train_act',
    title: 'Transcontinental High-Speed Rail Project',
    category: 'Infrastructure',
    description: 'Construct 300 mph magnetic-levitation rail corridors connecting all major economic hubs.',
    approvalChangeSuccess: 14,
    approvalChangeFail: -5,
  },
  {
    id: 'mars_gateway_act',
    title: 'Permanent Lunar & Mars Colonization Treaty',
    category: 'Space Exploration',
    description: 'Establish permanent orbital space docks and human habitats on Mars within the decade.',
    approvalChangeSuccess: 10,
    approvalChangeFail: -4,
  },
  {
    id: 'clean_water_act',
    title: 'Pure Water & Clean Grid Modernization',
    category: 'Environment',
    description: 'Replace aging lead pipes across all school districts and transition power to advanced nuclear fission.',
    approvalChangeSuccess: 13,
    approvalChangeFail: -7,
  },
];
