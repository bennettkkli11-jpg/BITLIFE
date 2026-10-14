import { Character, Gender, Relationship, YearLog } from '../types/bitlife';

export interface CelebrityMilestone {
  events: string[];
  moneyGrant?: number;
  fameChange?: number;
  jobTitle?: string;
  jobCompany?: string;
  jobSalary?: number;
  politicalOffice?: {
    title: string;
    level: 'President';
    salary: number;
    termYearsLeft: number;
    totalYearsServed: number;
    approvalRating: number;
    party: string;
  };
}

export interface SpecialCelebrityConfig {
  id: 'donald_trump' | 'elon_musk';
  name: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  city: string;
  country: string;
  flag: string;
  currencySymbol: string;
  avatar: string;
  title: string;
  mother: {
    name: string;
    occupation: string;
    age: number;
  };
  father: {
    name: string;
    occupation: string;
    age: number;
  };
  siblings: Array<{
    name: string;
    relation: 'Brother' | 'Sister';
    age: number;
    occupation: string;
  }>;
  startingStats: {
    happiness: number;
    health: number;
    smarts: number;
    looks: number;
    karma: number;
    fame: number;
    discipline: number;
    money: number;
  };
  birthLog: string[];
  milestones: Record<number, CelebrityMilestone>;
}

export const SPECIAL_CELEBRITIES: Record<'donald_trump' | 'elon_musk', SpecialCelebrityConfig> = {
  donald_trump: {
    id: 'donald_trump',
    name: 'Donald J. Trump',
    firstName: 'Donald',
    lastName: 'Trump',
    gender: 'Male',
    city: 'New York',
    country: 'United States',
    flag: '🇺🇸',
    currencySymbol: '$',
    avatar: '🦅',
    title: '45th & 47th President of the United States • Real Estate Titan',
    mother: {
      name: 'Mary Anne MacLeod Trump',
      occupation: 'Philanthropist & Homemaker',
      age: 34,
    },
    father: {
      name: 'Fred Trump',
      occupation: 'Real Estate Developer',
      age: 40,
    },
    siblings: [
      { name: 'Maryanne Trump', relation: 'Sister', age: 9, occupation: 'Student' },
      { name: 'Fred Trump Jr.', relation: 'Brother', age: 8, occupation: 'Student' },
      { name: 'Elizabeth Trump', relation: 'Sister', age: 4, occupation: 'Toddler' },
      { name: 'Robert Trump', relation: 'Brother', age: 0, occupation: 'Baby' },
    ],
    startingStats: {
      happiness: 95,
      health: 98,
      smarts: 90,
      looks: 85,
      karma: 70,
      fame: 80,
      discipline: 92,
      money: 1000000,
    },
    birthLog: [
      '👶 June 14, 1946: I was born at Jamaica Hospital in Queens, New York City.',
      'My mother is Mary Anne MacLeod Trump, a Scottish immigrant from the Isle of Lewis.',
      'My father is Fred Trump, a formidable and successful New York real estate developer.',
      'We live in a grand 23-room colonial revival brick mansion in Jamaica Estates, Queens.',
    ],
    milestones: {
      2: {
        events: [
          'I took my first steps in our grand residence in Jamaica Estates, Queens.',
          'My father often drives me around Queens to look at his apartment complexes in Flatbush and Coney Island.',
        ],
      },
      6: {
        events: [
          'I started elementary school at The Kew-Forest School in Forest Hills, Queens.',
          'Teachers note I am fiercely competitive and charismatic with a strong will.',
        ],
      },
      10: {
        events: [
          'Playing Little League baseball in Queens — coach says I have natural athletic talent.',
          'My father takes me on Saturday construction site inspections. I learned how every brick and girder is paid for.',
        ],
      },
      13: {
        events: [
          'My father enrolled me at the New York Military Academy (NYMA) in Cornwall-on-Hudson, NY to instill ironclad discipline.',
          'The military academy routine is rigorous: 6:00 AM reveille, uniform inspections, and drilling.',
        ],
      },
      16: {
        events: [
          'Promoted to Cadet Captain and battalion leader at New York Military Academy.',
          'I starred as captain of the varsity baseball team — major league scouts from the Phillies took notice of my batting power!',
        ],
      },
      18: {
        events: [
          'Graduated from the New York Military Academy with honors in leadership and athletics.',
          'Enrolled at Fordham University in the Bronx to begin undergraduate university studies.',
        ],
        jobTitle: 'University Student',
        jobCompany: 'Fordham University',
      },
      20: {
        events: [
          'Transferred to the Wharton School of Finance and Commerce at the University of Pennsylvania, the country’s top undergraduate real estate program.',
          'Focused intensely on commercial finance, property appraisal, and market negotiations.',
        ],
      },
      22: {
        events: [
          'Graduated from Wharton with a Bachelor of Science in Economics!',
          'Joined my father Fred’s company, Elizabeth Trump & Son, managing 14,000 apartments across Queens and Brooklyn.',
        ],
        jobTitle: 'VP of Development',
        jobCompany: 'Elizabeth Trump & Son',
        jobSalary: 150000,
        moneyGrant: 500000,
      },
      25: {
        events: [
          'Took full executive control of the family real estate business and rebranded it as "The Trump Organization"!',
          'Moved across the river into Manhattan, taking an apartment on the Upper East Side to conquer the most competitive real estate market in the world.',
        ],
        jobTitle: 'President & CEO',
        jobCompany: 'The Trump Organization',
        jobSalary: 1200000,
        moneyGrant: 2000000,
        fameChange: 15,
      },
      27: {
        events: [
          'Acquired an option on the Penn Central 30th Street rail yards along the Hudson River for future development.',
          'Settled a Department of Justice housing civil rights inquiry with no admission of wrongdoing, counter-suing for $100M with legendary attorney Roy Cohn.',
        ],
      },
      30: {
        events: [
          'The Grand Hyatt New York deal: Partnered with Hyatt to rescue and rebuild the decaying Commodore Hotel next to Grand Central Terminal into a sleek reflective glass landmark!',
          'Secured a groundbreaking 40-year tax abatement that saved Midtown Manhattan during the 1970s financial crisis.',
        ],
        moneyGrant: 8000000,
        fameChange: 15,
      },
      31: {
        events: [
          'Married Czech athlete and model Ivana Zelníčková at Marble Collegiate Church in Manhattan! 💍',
          'Our first son, Donald Trump Jr., was born on New Year’s Eve.',
        ],
      },
      33: {
        events: [
          'Broke ground on Fifth Avenue & 56th Street next to Tiffany & Co. for my signature crown jewel: Trump Tower!',
          'Hired architect Der Scutt to design an iconic 58-story stepped skyscraper with a 60-foot indoor waterfall and pink Italian marble atrium.',
        ],
      },
      35: {
        events: [
          'Daughter Ivanka Trump was born! 🎀',
          'Acquired premier boardwalk property in Atlantic City, New Jersey to enter the gaming and casino resort industry.',
        ],
        moneyGrant: 12000000,
      },
      37: {
        events: [
          'GRAND OPENING: Trump Tower opened on Fifth Avenue! Millions of visitors flock to the brass and marble atrium. It is a global media sensation!',
          'Son Eric Trump was born.',
        ],
        moneyGrant: 35000000,
        fameChange: 20,
      },
      38: {
        events: [
          'Purchased the New Jersey Generals in the United States Football League (USFL), signing Heisman Trophy winner Doug Flutie!',
          'Pushed the USFL to challenge the NFL directly in an antitrust lawsuit, winning a famous symbolic verdict.',
        ],
      },
      39: {
        events: [
          'Purchased the legendary 128-room Mar-a-Lago estate in Palm Beach, Florida for $10,000,000 — considered one of the great architectural treasures of the gilded age.',
        ],
        moneyGrant: -10000000,
      },
      40: {
        events: [
          'Central Park Wollman Skating Rink Miracle: The City of New York failed for 6 years to repair the rink. I took it over and finished it in 3 months, $750,000 under budget, returning ice skating to NYC children!',
        ],
        fameChange: 15,
      },
      41: {
        events: [
          'Published "The Art of the Deal" co-authored with Tony Schwartz. It debuted at #1 on the New York Times Bestseller list and remained on the bestseller list for 48 weeks, selling over 1 million copies!',
        ],
        moneyGrant: 15000000,
        fameChange: 15,
      },
      42: {
        events: [
          'Purchased the iconic Plaza Hotel overlooking Central Park for $407 million: "I haven\'t purchased a building, I have purchased a masterpiece."',
        ],
        moneyGrant: 50000000,
      },
      44: {
        events: [
          'Grand opening of the $1 Billion Trump Taj Mahal casino in Atlantic City, billed as the "Eighth Wonder of the World" with minarets and crystal chandeliers!',
        ],
        moneyGrant: 40000000,
      },
      45: {
        events: [
          'Weathered the early 1990s real estate and credit crunch; successfully restructured corporate casino debt while keeping ownership of core Manhattan crown jewel towers.',
        ],
      },
      47: {
        events: [
          'Married Marla Maples at the Plaza Hotel in New York City.',
          'Daughter Tiffany Trump was born.',
        ],
      },
      49: {
        events: [
          'Transformed Mar-a-Lago into an ultra-exclusive private members\' club with world-class golf, dining, and oceanfront amenities.',
        ],
        moneyGrant: 25000000,
      },
      50: {
        events: [
          'Acquired full ownership of the Miss Universe, Miss USA, and Miss Teen USA beauty pageants, broadcasting glamour to billions across the globe.',
        ],
        moneyGrant: 30000000,
        fameChange: 10,
      },
      53: {
        events: [
          'My beloved father, Fred Trump, passed away at age 93. He was my greatest mentor and teacher.',
          'Explored a Reform Party presidential run, campaigning on economic nationalism, tariffs, and protecting American manufacturing jobs.',
        ],
        moneyGrant: 100000000,
      },
      55: {
        events: [
          'Completed Trump World Tower, a 72-story luxury residential skyscraper standing proudly across from the United Nations headquarters in NYC.',
        ],
        moneyGrant: 60000000,
      },
      58: {
        events: [
          'TELEVISION PHENOMENON: Premiered NBC prime-time reality TV competition "The Apprentice" with executive producer Mark Burnett!',
          'My signature boardroom catchphrase "You\'re Fired!" becomes a worldwide cultural catchphrase. 28.1 million Americans tuned into the season finale!',
        ],
        moneyGrant: 45000000,
        fameChange: 20,
      },
      59: {
        events: [
          'Married Slovenian model Melania Knauss at The Episcopal Church of Bethesda-by-the-Sea in Palm Beach, followed by a star-studded gala at Mar-a-Lago! 💍',
        ],
      },
      60: {
        events: [
          'Son Barron William Trump was born! 👶',
          'Awarded a star on the Hollywood Walk of Fame in Los Angeles for television entertainment stardom.',
        ],
      },
      65: {
        events: [
          'Delivered a barnburner keynote address at CPAC, galvanizing conservative voters across the country and teasing a future presidential campaign.',
        ],
      },
      69: {
        events: [
          'JUNE 16, 2015: Descended the golden escalator at Trump Tower with Melania to announce my historic campaign for President of the United States!',
          '"We are going to Make America Great Again!" The movement sends shockwaves through the political establishment.',
        ],
        fameChange: 25,
      },
      70: {
        events: [
          'NOVEMBER 8, 2016: ELECTED 45TH PRESIDENT OF THE UNITED STATES! 🦅 Defeated Hillary Clinton with 304 electoral votes in a stunning political victory that rewrote American history!',
        ],
        politicalOffice: {
          title: 'President of the United States',
          level: 'President',
          salary: 400000,
          termYearsLeft: 4,
          totalYearsServed: 1,
          approvalRating: 54,
          party: 'Republican',
        },
        jobTitle: 'Commander-in-Chief & 45th POTUS',
        jobCompany: 'The White House',
        fameChange: 30,
      },
      71: {
        events: [
          'Inaugurated as the 45th President of the United States in Washington, D.C.',
          'Signed the landmark Tax Cuts and Jobs Act of 2017 into law, slashing corporate and individual taxes and sparking American economic boom!',
        ],
      },
      72: {
        events: [
          'Historic Singapore Peace Summit: First sitting US President to meet North Korean leader Kim Jong Un.',
          'Officially recognized Jerusalem as the capital of Israel and moved the United States Embassy to Jerusalem.',
        ],
      },
      73: {
        events: [
          'Signed the bipartisan First Step Act criminal justice reform bill.',
          'Established the United States Space Force as the first new branch of the US Armed Forces in 72 years!',
          'Brokered the historic Abraham Accords peace agreements between Israel, UAE, and Bahrain.',
        ],
      },
      74: {
        events: [
          'Contested the 2020 presidential election; finished presidential term and relocated residence back to Mar-a-Lago in Palm Beach, Florida.',
        ],
        politicalOffice: undefined,
        jobTitle: '45th President of the United States (Ret.)',
        jobCompany: 'The Trump Organization',
      },
      75: {
        events: [
          'Founded Trump Media & Technology Group (TMTG) and launched Truth Social to give millions of Americans an uncensored voice online.',
        ],
        moneyGrant: 150000000,
      },
      76: {
        events: [
          'Announced 2024 presidential campaign to reclaim the White House, rallying millions at sold-out arena events across the nation.',
        ],
      },
      77: {
        events: [
          'Swept the 2024 Republican primaries in historic landslide victories across Iowa, New Hampshire, Nevada, and Super Tuesday!',
        ],
      },
      78: {
        events: [
          'JULY 13, 2024: Survived an assassination attempt in Butler, PA! Stood up with blood on my ear, pumping my fist into the air shouting "Fight! Fight! Fight!" in an image etched into world history.',
          'NOVEMBER 5, 2024: HISTORIC PRESIDENTIAL LANDSLIDE! Elected 47th President of the United States with 312 electoral votes and winning the national popular vote!',
        ],
        politicalOffice: {
          title: 'President of the United States (47th)',
          level: 'President',
          salary: 400000,
          termYearsLeft: 4,
          totalYearsServed: 5,
          approvalRating: 62,
          party: 'Republican',
        },
        jobTitle: '47th President of the United States',
        jobCompany: 'The White House',
        fameChange: 35,
        moneyGrant: 200000000,
      },
    },
  },

  elon_musk: {
    id: 'elon_musk',
    name: 'Elon Musk',
    firstName: 'Elon',
    lastName: 'Musk',
    gender: 'Male',
    city: 'Pretoria',
    country: 'South Africa',
    flag: '🇿🇦',
    currencySymbol: '$',
    avatar: '🚀',
    title: 'Technoking of Tesla • Chief Engineer of SpaceX • Owner of X',
    mother: {
      name: 'Maye Musk',
      occupation: 'Model & Registered Dietitian',
      age: 23,
    },
    father: {
      name: 'Errol Musk',
      occupation: 'Electromechanical Engineer',
      age: 25,
    },
    siblings: [
      { name: 'Kimbal Musk', relation: 'Brother', age: 1, occupation: 'Baby' },
      { name: 'Tosca Musk', relation: 'Sister', age: 0, occupation: 'Baby' },
    ],
    startingStats: {
      happiness: 90,
      health: 96,
      smarts: 100,
      looks: 80,
      karma: 75,
      fame: 80,
      discipline: 98,
      money: 10000,
    },
    birthLog: [
      '👶 June 28, 1971: I was born in Pretoria, Transvaal, South Africa.',
      'My mother is Maye Musk, a Canadian-South African fashion model and dietitian.',
      'My father is Errol Musk, a brilliant electromechanical engineer and pilot.',
      'I have an intense, photographic curiosity about physics, astronomy, and science fiction.',
    ],
    milestones: {
      2: {
        events: [
          'Growing up in Pretoria with my younger brother Kimbal and sister Tosca.',
          'My parents noticed that I drift into deep trances staring into space, calculating things in my head.',
        ],
      },
      5: {
        events: [
          'Finished reading the entire Encyclopaedia Britannica from front to back.',
          'Obsessed with Isaac Asimov’s Foundation books and Douglas Adams’ Hitchhiker’s Guide to the Galaxy.',
        ],
      },
      9: {
        events: [
          'My parents divorced; I chose to move in with my father Errol in Pretoria.',
          'Fascinated by rocketry, electronics, and early personal computers.',
        ],
      },
      10: {
        events: [
          'Acquired an 8-bit Commodore VIC-20 computer; devoured the multi-hundred-page programming manual and taught myself Commodore BASIC programming in three days!',
        ],
      },
      12: {
        events: [
          'Wrote the code for a space video game called "Blastar" in 168 lines of BASIC!',
          'Sold the source code to PC and Office Technology magazine for $500! My first commercial software venture.',
        ],
        moneyGrant: 500,
      },
      14: {
        events: [
          'Bullied heavily at Pretoria Boys High School; took up karate, judo, and wrestling to defend myself and hit a major athletic growth spurt.',
        ],
      },
      17: {
        events: [
          'Obtained a Canadian passport through my mother Maye; left South Africa for Canada to avoid mandatory military conscription under apartheid and pursue university in North America.',
        ],
      },
      18: {
        events: [
          'Arrived in Canada alone with $2,000; worked grueling jobs tending vegetables, shoveling grain, and cleaning the boiler room of a British Columbia sawmill for $18/hr.',
        ],
        jobTitle: 'Boiler Cleaner',
        jobCompany: 'BC Sawmill',
        jobSalary: 25000,
      },
      19: {
        events: [
          'Enrolled at Queen\'s University in Kingston, Ontario. Met aspiring author Justine Wilson.',
          'Studied economics, physics, and computer science while running a computer hardware sales side-hustle.',
        ],
        jobTitle: 'University Student',
        jobCompany: 'Queen\'s University',
      },
      21: {
        events: [
          'Transferred on a scholarship to the University of Pennsylvania in Philadelphia.',
          'Rented a 10-bedroom fraternity house with classmate Adeo Ressi; covered our rent by operating an unlicensed weekend nightclub with blackout curtains and neon lights!',
        ],
      },
      24: {
        events: [
          'Graduated from UPenn with dual degrees: Bachelor of Science in Economics from Wharton and Bachelor of Arts in Physics!',
          'Moved to California to pursue a Ph.D. in materials science at Stanford University, but dropped out after two days to start an internet company!',
          'Co-founded Zip2 (online city guide and mapping software for newspapers) with brother Kimbal in Palo Alto. Slept on the office futon and showered at the YMCA.',
        ],
        jobTitle: 'Co-Founder & CTO',
        jobCompany: 'Zip2 Corp',
        jobSalary: 45000,
      },
      27: {
        events: [
          'COMPAQ ACQUISITION: Compaq acquired Zip2 for $307 million in cash! I received $22 million from the sale!',
          'Purchased a $1,000,000 McLaren F1 supercar and a 1,800-sq-ft condo in Palo Alto.',
        ],
        moneyGrant: 22000000,
        fameChange: 15,
      },
      28: {
        events: [
          'Founded X.com with $12,000,000 of my own capital, pioneering one of the world\'s first online financial services and instant email payments.',
        ],
        jobTitle: 'Founder & CEO',
        jobCompany: 'X.com',
        jobSalary: 200000,
      },
      29: {
        events: [
          'X.com merged with Confinity (creators of PayPal) to dominate internet payments. I served as CEO.',
          'Married Justine Wilson. 💍',
        ],
        fameChange: 10,
      },
      30: {
        events: [
          'Rebranded the merged company to PayPal.',
          'Survived a severe, near-fatal case of cerebral malaria contracted during a holiday in South Africa.',
        ],
      },
      31: {
        events: [
          'EBAY BUYS PAYPAL: eBay acquired PayPal for $1.5 billion in stock in October 2002. I netted $175 million after taxes!',
          'FOUNDED SPACEX: Started Space Exploration Technologies (SpaceX) in Hawthorne, California with $100 million of my personal fortune to revolutionize spaceflight and make humanity multi-planetary!',
        ],
        moneyGrant: 175000000,
        jobTitle: 'Chief Engineer & CEO',
        jobCompany: 'SpaceX',
        jobSalary: 1,
        fameChange: 20,
      },
      33: {
        events: [
          'Led Series A investment ($6.5 million) into Tesla Motors, joining as Chairman of the Board alongside Martin Eberhard to create high-performance electric vehicles.',
        ],
        moneyGrant: -6500000,
        fameChange: 10,
      },
      35: {
        events: [
          'Co-founded SolarCity with cousins Lyndon and Peter Rive to deploy rooftop solar power at scale.',
          'SpaceX won a $278 million NASA Commercial Orbital Transportation Services (COTS) contract.',
        ],
      },
      37: {
        events: [
          'THE 2008 EXISTENTIAL CRISIS: Falcon 1\'s first 3 launches failed. Tesla Roadster was burning through cash during the Great Recession.',
          'On December 23, 2008, Falcon 1 Flight 4 successfully reached Earth orbit! NASA awarded SpaceX a $1.6B ISS cargo contract, and I put my last $20M into Tesla on Christmas Eve to save both companies from bankruptcy!',
        ],
        fameChange: 20,
      },
      39: {
        events: [
          'TESLA IPO: Tesla went public on NASDAQ (ticker: TSLA) at $17/share, raising $226M — the first American automaker IPO since Ford in 1956!',
          'SpaceX Dragon became the first commercially built spacecraft to reach orbit and return to Earth intact!',
        ],
        moneyGrant: 120000000,
        fameChange: 15,
      },
      41: {
        events: [
          'Tesla launched the revolutionary Model S luxury all-electric sedan, winning Motor Trend Car of the Year unanimously!',
          'SpaceX Dragon successfully docked with the International Space Station, making aerospace history!',
        ],
        moneyGrant: 800000000,
        fameChange: 15,
      },
      42: {
        events: [
          'Published the open-source Hyperloop alpha design whitepaper for high-speed pneumatic tube travel between Los Angeles and San Francisco.',
        ],
      },
      43: {
        events: [
          'Released all Tesla electric vehicle patents to the public domain in the spirit of open-source clean technology!',
        ],
      },
      44: {
        events: [
          'HISTORIC FALCON 9 LANDING: SpaceX landed an orbital-class Falcon 9 rocket booster vertically at Landing Zone 1 in Cape Canaveral!',
          'Co-founded OpenAI as a non-profit artificial intelligence research institute.',
        ],
        fameChange: 25,
      },
      45: {
        events: [
          'Founded Neuralink to develop high-bandwidth brain-computer neural interfaces.',
          'Founded The Boring Company to dig high-speed underground transit tunnels.',
          'Tesla acquired SolarCity and unveiled the integrated Solar Roof.',
        ],
        moneyGrant: 2000000000,
      },
      46: {
        events: [
          'Tesla launched the mass-market Model 3, entering brutal "production hell" where I slept on the factory floor at Fremont and worked 120-hour weeks.',
        ],
      },
      47: {
        events: [
          'FALCON HEAVY MAIDEN FLIGHT: Launched my personal midnight-cherry Tesla Roadster into deep space orbit on Falcon Heavy, with spacesuit dummy "Starman" playing David Bowie!',
        ],
        fameChange: 25,
      },
      48: {
        events: [
          'Unveiled the cold-rolled stainless-steel Tesla Cybertruck in Los Angeles!',
          'Completed construction of Tesla Gigafactory Shanghai in record-breaking 10 months.',
        ],
        moneyGrant: 15000000000,
      },
      49: {
        events: [
          'DEMO-2 ASTRONAUT LAUNCH: SpaceX launched NASA astronauts Bob Behnken and Doug Hurley to the ISS, returning American human orbital spaceflight capability!',
          'Tesla joined the S&P 500 as stock skyrocketed over 700% in a single year.',
        ],
        moneyGrant: 80000000000,
        fameChange: 30,
      },
      50: {
        events: [
          'RICHEST PERSON IN THE WORLD: My personal net worth surpassed $300 BILLION as Tesla valuation hit $1 Trillion! 💰',
          'SpaceX won the NASA Artemis Human Landing System contract to land astronauts on the Moon with Starship.',
          'Hosted NBC\'s Saturday Night Live.',
        ],
        moneyGrant: 150000000000,
        fameChange: 25,
      },
      51: {
        events: [
          'OCTOBER 2022: Acquired social media platform Twitter for $44 billion to preserve the global digital town square and defend free speech; rebranded it to "X"!',
        ],
        moneyGrant: -44000000000,
        fameChange: 20,
      },
      52: {
        events: [
          'Founded xAI to build maximum truth-seeking artificial intelligence, launching the Grok conversational model.',
          'Neuralink received FDA approval for its first-in-human clinical brain implant trial.',
        ],
        moneyGrant: 25000000000,
      },
      53: {
        events: [
          'MECHAZILLA CATCHES STARSHIP: SpaceX achieved the greatest engineering feat in aerospace history, catching the 232-foot Super Heavy booster in mid-air with launch tower "chopstick" arms!',
          'Appointed to co-lead the Department of Government Efficiency (DOGE) to streamline American federal government operations!',
        ],
        moneyGrant: 50000000000,
        fameChange: 35,
      },
    },
  },
};

export function createSpecialCelebrityCharacter(
  id: 'donald_trump' | 'elon_musk',
  unlockedAchievements: string[] = []
): Character {
  const config = SPECIAL_CELEBRITIES[id];

  const mother: Relationship = {
    id: 'rel_mom_' + Date.now(),
    name: config.mother.name,
    relation: 'Mother',
    age: config.mother.age,
    alive: true,
    relationshipLevel: 95,
    smarts: 88,
    looks: 88,
    money: 100000,
    occupation: config.mother.occupation,
  };

  const father: Relationship = {
    id: 'rel_dad_' + Date.now(),
    name: config.father.name,
    relation: 'Father',
    age: config.father.age,
    alive: true,
    relationshipLevel: 92,
    smarts: 92,
    looks: 85,
    money: 500000,
    occupation: config.father.occupation,
  };

  const relationships: Relationship[] = [mother, father];

  config.siblings.forEach((sib, idx) => {
    relationships.push({
      id: `rel_sib_${idx}_` + Date.now(),
      name: sib.name,
      relation: sib.relation,
      age: sib.age,
      alive: true,
      relationshipLevel: 85,
      smarts: 80,
      looks: 80,
      money: 100,
      occupation: sib.occupation,
    });
  });

  const initialLog: YearLog = {
    age: 0,
    yearNumber: 0,
    events: [
      `⭐ SPECIAL CELEBRITY LIFE: You were born as ${config.name}! (1 in 500 rare destiny)`,
      ...config.birthLog,
    ],
  };

  return {
    id: 'char_celeb_' + config.id + '_' + Date.now(),
    firstName: config.firstName,
    lastName: config.lastName,
    gender: config.gender,
    sexualOrientation: 'Straight',
    age: 0,
    alive: true,
    country: config.country,
    city: config.city,
    currencySymbol: config.currencySymbol,
    flag: config.flag,
    specialCelebrityId: config.id,
    specialCelebrityTitle: config.title,
    happiness: config.startingStats.happiness,
    health: config.startingStats.health,
    smarts: config.startingStats.smarts,
    looks: config.startingStats.looks,
    karma: config.startingStats.karma,
    fame: config.startingStats.fame,
    discipline: config.startingStats.discipline,
    money: config.startingStats.money,
    debt: 0,
    educationLevel: 'None',
    inSchool: false,
    schoolPerformance: 95,
    schoolYearsCompleted: 0,
    schoolTotalYears: 0,
    completedDegrees: [],
    hasDriversLicense: false,
    hasPilotsLicense: false,
    realEstate: [],
    vehicles: [],
    pets: [],
    heirlooms: [],
    relationships,
    diseases: [],
    inPrison: false,
    prisonYearsLeft: 0,
    prisonRecord: [],
    crimesCommitted: 0,
    blackjackWinnings: 0,
    escapedPrisonCount: 0,
    lotteryWinsCount: 0,
    celebrityInteractions: 0,
    presidentialTermsWon: 0,
    politicalCampaignsRun: 0,
    unlockedAchievements,
    lifeLog: [initialLog],
  };
}
