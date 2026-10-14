import {
  Character,
  Gender,
  SexualOrientation,
  Relationship,
  RibbonType,
  YearLog,
} from '../types/bitlife';
import { COUNTRIES, CountryData } from '../data/countries';
import { MALE_NAMES, FEMALE_NAMES, SURNAMES } from '../data/names';
import { DISEASES_CATALOG } from '../data/diseases';
import { HEIRLOOM_POOL } from '../data/heirlooms';
import {
  SPECIAL_CELEBRITIES,
  createSpecialCelebrityCharacter,
} from '../data/specialCelebrityLives';

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function createNewCharacter(custom?: {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryName?: string;
  cityName?: string;
  bornRoyal?: boolean;
  specialCelebrity?: 'donald_trump' | 'elon_musk';
  unlockedAchievements?: string[];
}): Character {
  // Direct requested special celebrity life
  if (custom?.specialCelebrity) {
    return createSpecialCelebrityCharacter(custom.specialCelebrity, custom.unlockedAchievements);
  }

  // USER REQUIREMENT: 1/500 chance (0.2%) to be born as Donald Trump or Elon Musk!
  const isPureRandom =
    !custom ||
    (!custom.firstName &&
      !custom.lastName &&
      !custom.countryName &&
      !custom.cityName &&
      !custom.bornRoyal);

  if (isPureRandom && Math.random() < 0.002) {
    const pickedCeleb = Math.random() < 0.5 ? 'donald_trump' : 'elon_musk';
    return createSpecialCelebrityCharacter(pickedCeleb, custom?.unlockedAchievements);
  }

  const gender: Gender = custom?.gender || (Math.random() > 0.5 ? 'Male' : 'Female');
  const firstName =
    custom?.firstName?.trim() ||
    (gender === 'Male'
      ? pickRandom(MALE_NAMES)
      : gender === 'Female'
      ? pickRandom(FEMALE_NAMES)
      : pickRandom([...MALE_NAMES, ...FEMALE_NAMES]));
  const lastName = custom?.lastName?.trim() || pickRandom(SURNAMES);

  const countryData: CountryData =
    (custom?.countryName && COUNTRIES.find((c) => c.name === custom.countryName)) ||
    pickRandom(COUNTRIES);
  const city = custom?.cityName?.trim() || pickRandom(countryData.cities);

  // Royalty generation check
  const isBornRoyal =
    !!countryData.monarchy &&
    (custom?.bornRoyal === true || (!custom && Math.random() < 0.08));

  const royalInfo = isBornRoyal && countryData.monarchy
    ? {
        title:
          gender === 'Male'
            ? countryData.monarchy.princeTitle
            : countryData.monarchy.princessTitle,
        country: countryData.name,
        respect: 90,
        yearlyAllowance: randomInt(10000000, 100000000), // Sovereign grant 10M to 100M
        isMonarch: false,
      }
    : undefined;

  // Generate Parents
  const motherAge = randomInt(20, 36);
  const fatherAge = motherAge + randomInt(-3, 6);

  const motherOccupation = isBornRoyal && countryData.monarchy
    ? countryData.monarchy.monarchFemale
    : pickRandom(['Accountant', 'Teacher', 'Nurse', 'Store Manager', 'Graphic Designer', 'Homemaker']);

  const fatherOccupation = isBornRoyal && countryData.monarchy
    ? countryData.monarchy.monarchMale
    : pickRandom(['Engineer', 'Mechanic', 'Electrician', 'Sales Representative', 'Architect', 'Small Business Owner']);

  const mother: Relationship = {
    id: 'rel_mom_' + Date.now(),
    name: `${pickRandom(FEMALE_NAMES)} ${lastName}`,
    relation: 'Mother',
    age: motherAge,
    alive: true,
    relationshipLevel: randomInt(70, 95),
    smarts: randomInt(40, 90),
    looks: randomInt(40, 90),
    money: randomInt(3000, 15000),
    occupation: motherOccupation,
  };

  const father: Relationship = {
    id: 'rel_dad_' + Date.now(),
    name: `${pickRandom(MALE_NAMES)} ${lastName}`,
    relation: 'Father',
    age: Math.max(19, fatherAge),
    alive: true,
    relationshipLevel: randomInt(65, 95),
    smarts: randomInt(40, 90),
    looks: randomInt(40, 90),
    money: randomInt(3000, 18000),
    occupation: fatherOccupation,
  };

  const relationships: Relationship[] = [mother, father];

  // Optional Sibling (45% chance)
  if (Math.random() < 0.45) {
    const sibGender = Math.random() > 0.5 ? 'Brother' : 'Sister';
    const sibAge = randomInt(1, 8);
    const sibOccupation = isBornRoyal && countryData.monarchy
      ? sibGender === 'Brother'
        ? countryData.monarchy.princeTitle
        : countryData.monarchy.princessTitle
      : 'Student';

    relationships.push({
      id: 'rel_sib_' + Date.now(),
      name: `${sibGender === 'Brother' ? pickRandom(MALE_NAMES) : pickRandom(FEMALE_NAMES)} ${lastName}`,
      relation: sibGender,
      age: sibAge,
      alive: true,
      relationshipLevel: randomInt(50, 90),
      smarts: randomInt(30, 80),
      looks: randomInt(30, 80),
      money: 10,
      occupation: sibOccupation,
    });
  }

  const initialLog: YearLog = {
    age: 0,
    yearNumber: 0,
    events: isBornRoyal && countryData.monarchy
      ? [
          `👑 I was born into the Royal Family of ${countryData.name} at ${countryData.monarchy.palace}!`,
          `My royal title is ${royalInfo?.title}.`,
          `My mother is ${mother.name}, the ${mother.occupation} (age ${mother.age}).`,
          `My father is ${father.name}, the ${father.occupation} (age ${father.age}).`,
        ]
      : [
          `I was born in ${city}, ${countryData.name}.`,
          `My mother is ${mother.name}, a ${mother.occupation} (age ${mother.age}).`,
          `My father is ${father.name}, a ${father.occupation} (age ${father.age}).`,
        ],
  };

  return {
    id: 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    firstName,
    lastName,
    gender,
    sexualOrientation: 'Straight',
    age: 0,
    alive: true,
    country: countryData.name,
    city,
    currencySymbol: countryData.currencySymbol,
    flag: countryData.flag,
    happiness: randomInt(65, 95),
    health: randomInt(80, 99),
    smarts: randomInt(35, 90),
    looks: isBornRoyal ? randomInt(60, 95) : randomInt(35, 90),
    karma: randomInt(50, 85),
    fame: isBornRoyal ? 60 : 0,
    discipline: randomInt(30, 80),
    money: 0,
    debt: 0,
    educationLevel: 'None',
    inSchool: false,
    schoolPerformance: 70,
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
    royalty: royalInfo,
    unlockedAchievements: custom?.unlockedAchievements || [],
    lifeLog: [initialLog],
  };
}

export interface AgeUpResult {
  newChar: Character;
  eventsLog: string[];
}

export function processAgeUp(char: Character): AgeUpResult {
  if (!char.alive) return { newChar: char, eventsLog: ['You are already dead.'] };

  let updated: Character = JSON.parse(JSON.stringify(char));
  updated.age += 1;
  const newEvents: string[] = [];

  // SPECIAL CELEBRITY HISTORICAL CHRONOLOGY (Donald Trump / Elon Musk)
  let hasCelebrityMilestone = false;
  if (updated.specialCelebrityId && SPECIAL_CELEBRITIES[updated.specialCelebrityId]) {
    const celeb = SPECIAL_CELEBRITIES[updated.specialCelebrityId];
    const milestone = celeb.milestones[updated.age];
    if (milestone) {
      hasCelebrityMilestone = true;
      milestone.events.forEach((ev) => newEvents.push(ev));
      if (milestone.moneyGrant) {
        updated.money = Math.max(0, updated.money + milestone.moneyGrant);
      }
      if (milestone.fameChange) {
        updated.fame = clamp(updated.fame + milestone.fameChange);
      }
      if (milestone.jobTitle) {
        updated.job = {
          id: 'job_celeb_' + updated.age,
          title: milestone.jobTitle,
          company: milestone.jobCompany || 'Enterprise',
          salary: milestone.jobSalary || 500000,
          careerTrack: 'Executive',
          requiredEducation: 'None',
          requiredSmarts: 0,
          yearsInRole: 1,
          performance: 99,
          stress: 15,
        };
      }
      if (milestone.politicalOffice) {
        updated.politicalOffice = milestone.politicalOffice;
        updated.presidentialTermsWon = (updated.presidentialTermsWon || 0) + 1;
      }
    }
  }

  // Age in prison
  if (updated.inPrison) {
    updated.prisonYearsLeft = Math.max(0, updated.prisonYearsLeft - 1);
    newEvents.push(`I spent another year behind bars. Years remaining: ${updated.prisonYearsLeft}`);
    updated.happiness = clamp(updated.happiness - randomInt(5, 12));
    if (updated.prisonYearsLeft === 0) {
      updated.inPrison = false;
      newEvents.push('I was released from prison on good behavior! Freedom at last!');
      updated.happiness = clamp(updated.happiness + 35);
    }
  }

  // School progression
  if (updated.age === 5) {
    updated.educationLevel = 'Elementary';
    updated.inSchool = true;
    newEvents.push('I began primary elementary school.');
  } else if (updated.age === 11) {
    updated.educationLevel = 'Middle School';
    newEvents.push('I graduated elementary and entered middle school.');
  } else if (updated.age === 14) {
    updated.educationLevel = 'High School';
    newEvents.push('I enrolled in High School.');
  } else if (updated.age === 18 && updated.inSchool && updated.educationLevel === 'High School') {
    updated.inSchool = false;
    newEvents.push('I graduated from High School! Time to enter adulthood.');
    updated.happiness = clamp(updated.happiness + 15);
  }

  // University & Higher Education Annual Progression & Graduation
  if (updated.inSchool && updated.age >= 18) {
    if (updated.educationLevel === 'University') {
      const currentYear = (updated.schoolYearsCompleted || 0) + 1;
      updated.schoolYearsCompleted = currentYear;
      updated.schoolTotalYears = 4;

      const yearNames = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
      const yearLabel = yearNames[currentYear - 1] || `Year ${currentYear}`;

      if (currentYear < 4) {
        newEvents.push(
          `University (${updated.educationMajor || 'General Studies'}): I completed my ${yearLabel} year with a performance rating of ${updated.schoolPerformance}%.`
        );
        updated.smarts = clamp(updated.smarts + 2);
      } else {
        // 4 Years Finished -> Official University Graduation!
        updated.inSchool = false;
        const degreeTitle = `Bachelor’s Degree in ${updated.educationMajor || 'General Studies'}`;
        updated.completedDegrees = [
          ...new Set([...(updated.completedDegrees || []), degreeTitle, 'University']),
        ];
        updated.educationLevel = 'None';
        updated.educationMajor = undefined;
        updated.schoolYearsCompleted = 0;
        newEvents.push(
          `🎓 UNIVERSITY GRADUATION! After 4 rigorous years of study, I graduated from university and was awarded my ${degreeTitle}! I am now eligible to launch a corporate career or apply to Higher Education (Medical School, Law School, Business School, or Graduate School)!`
        );
        updated.happiness = clamp(updated.happiness + 25);
        updated.smarts = clamp(updated.smarts + 10);
      }
    } else if (
      ['Medical School', 'Law School', 'Business School', 'Graduate School'].includes(updated.educationLevel)
    ) {
      const totalRequired =
        updated.schoolTotalYears ||
        (updated.educationLevel === 'Medical School'
          ? 4
          : updated.educationLevel === 'Law School'
          ? 3
          : 2);
      const currentYear = (updated.schoolYearsCompleted || 0) + 1;
      updated.schoolYearsCompleted = currentYear;
      updated.schoolTotalYears = totalRequired;

      if (currentYear < totalRequired) {
        newEvents.push(
          `${updated.educationLevel}: I completed Year ${currentYear} of ${totalRequired} with a performance rating of ${updated.schoolPerformance}%.`
        );
        updated.smarts = clamp(updated.smarts + 3);
      } else {
        // Higher Ed Degree Completed -> Graduation!
        const completedSchool = updated.educationLevel;
        updated.inSchool = false;
        updated.educationLevel = 'None';
        updated.schoolYearsCompleted = 0;
        let gradText = '';
        if (completedSchool === 'Medical School') {
          gradText =
            '🎓 MEDICAL SCHOOL GRADUATION! After 4 demanding years of clinical rotations, I graduated from Medical School and received my Doctor of Medicine (MD) diploma! I am now fully licensed to practice medicine!';
        } else if (completedSchool === 'Law School') {
          gradText =
            '🎓 LAW SCHOOL GRADUATION! After 3 years of legal study, I graduated from Law School, passed the Bar Examination, and was awarded my Juris Doctor (JD)! I am now an Attorney-at-Law!';
        } else if (completedSchool === 'Business School') {
          gradText =
            '🎓 BUSINESS SCHOOL GRADUATION! I graduated from Business School and earned my Master of Business Administration (MBA)! Executive leadership and C-suite career tracks are now open to me!';
        } else {
          gradText =
            `🎓 GRADUATE SCHOOL COMMENCEMENT! I defended my thesis, completed Graduate School, and was conferred my Master of Science degree with honors!`;
        }
        updated.completedDegrees = [
          ...new Set([...(updated.completedDegrees || []), completedSchool]),
        ];
        newEvents.push(gradText);
        updated.happiness = clamp(updated.happiness + 30);
        updated.smarts = clamp(updated.smarts + 12);
      }
    }
  }

  // Political Office salary & term progression
  if (updated.politicalOffice) {
    updated.politicalOffice.totalYearsServed += 1;
    updated.politicalOffice.termYearsLeft -= 1;
    updated.money += updated.politicalOffice.salary;
    const approvalDelta = randomInt(-3, 4);
    updated.politicalOffice.approvalRating = clamp(updated.politicalOffice.approvalRating + approvalDelta);

    newEvents.push(
      `I served as ${updated.politicalOffice.title} (Approval: ${updated.politicalOffice.approvalRating}%). Earned ${updated.currencySymbol}${updated.politicalOffice.salary.toLocaleString()} salary.`
    );

    if (updated.politicalOffice.termYearsLeft <= 0) {
      newEvents.push(
        `My term in office as ${updated.politicalOffice.title} has concluded! Final approval rating: ${updated.politicalOffice.approvalRating}%.`
      );
      updated.politicalOffice = undefined;
    }
  }

  // Royalty Crown Allowance & Royal Duties (Adulthood only)
  if (updated.royalty && updated.age >= 18) {
    updated.money += updated.royalty.yearlyAllowance;
    newEvents.push(
      `As ${updated.royalty.title}, I received my annual sovereign grant of ${updated.currencySymbol}${updated.royalty.yearlyAllowance.toLocaleString()} from the Crown.`
    );
    if (Math.random() < 0.25) {
      updated.royalty.respect = clamp(updated.royalty.respect + randomInt(-2, 3));
    }
  }

  // Work & income
  if (updated.job) {
    updated.job.yearsInRole += 1;
    updated.job.timesWorkedHarderThisYear = 0;
    updated.job.askedForRaiseThisYear = false;
    const netSalary = Math.round(updated.job.salary * 0.82); // after taxes
    updated.money += netSalary;

    // Small yearly raise (2 - 5%)
    const raise = Math.round(updated.job.salary * (randomInt(2, 5) / 100));
    updated.job.salary += raise;

    // Stress impact
    if (updated.job.stress > 60) {
      updated.health = clamp(updated.health - 2);
    }
  }

  // Part time income
  if (updated.partTimeJob) {
    const annualGigs = Math.round(updated.partTimeJob.hourlyRate * updated.partTimeJob.hoursPerWeek * 48);
    updated.money += annualGigs;
  }

  // Modest pocket money allowance from parents during childhood (age 8 - 17)
  if (updated.age >= 8 && updated.age < 18) {
    const allowance = randomInt(5, 15);
    updated.money += allowance;
  }

  // Real estate expenses & appreciation
  updated.realEstate.forEach((prop) => {
    // Appreciates 2 - 6%
    const appreciation = Math.round(prop.price * (randomInt(2, 6) / 100));
    prop.price += appreciation;
    // Costs
    updated.money -= prop.monthlyCost * 12;
    if (prop.hasMortgage && prop.mortgageLeft > 0) {
      const payment = Math.min(prop.mortgageLeft, Math.round(prop.price * 0.05));
      prop.mortgageLeft -= payment;
      updated.money -= payment;
    }
  });

  // Vehicle depreciation & maintenance
  updated.vehicles.forEach((veh) => {
    veh.price = Math.max(500, Math.round(veh.price * 0.88));
    veh.condition = clamp(veh.condition - randomInt(3, 8));
    updated.money -= randomInt(400, 1200); // insurance & fuel
  });

  // Pets
  const survivingPets = [];
  for (const pet of updated.pets) {
    pet.age += 1;
    pet.health = clamp(pet.health - randomInt(2, 6));
    if (pet.age > 15 || (pet.health < 20 && Math.random() < 0.4)) {
      newEvents.push(`My beloved ${pet.species.toLowerCase()} ${pet.name} passed away peacefully from old age. Rest in peace.`);
      updated.happiness = clamp(updated.happiness - 25);
    } else {
      survivingPets.push(pet);
    }
  }
  updated.pets = survivingPets;

  // Family / Relationships aging & events
  updated.relationships.forEach((rel) => {
    if (rel.alive) {
      rel.age += 1;
      // Elderly death chance (age 76+)
      if (rel.age > 76 && Math.random() < 0.09) {
        rel.alive = false;
        newEvents.push(`My ${rel.relation.toLowerCase()}, ${rel.name}, passed away at age ${rel.age}.`);
        updated.happiness = clamp(updated.happiness - 30);

        // ROYAL SUCCESSION: If character is royal and not yet a reigning monarch, ascend the throne!
        if (
          (rel.relation === 'Mother' || rel.relation === 'Father') &&
          updated.royalty &&
          !updated.royalty.isMonarch
        ) {
          const { character: ascended, eventText } = ascendRoyalLadder(updated, rel.name);
          updated = ascended;
          newEvents.push(eventText);
        } else if (rel.money > 2000 && (rel.relation === 'Mother' || rel.relation === 'Father')) {
          // Modest inheritance after medical bills, estate taxes, and sibling distribution
          const inheritance = Math.min(2500, Math.round(rel.money * 0.15));
          if (inheritance > 0) {
            updated.money += inheritance;
            newEvents.push(`I received a modest inheritance of ${updated.currencySymbol}${inheritance.toLocaleString()} from ${rel.name}'s estate.`);
          }
        }
      }
    }
  });

  // Chance to discover heirloom in attic (5% chance per year if age >= 10)
  if (updated.age >= 10 && Math.random() < 0.06) {
    const heirloom = pickRandom(HEIRLOOM_POOL);
    updated.heirlooms.push(heirloom);
    newEvents.push(`I found an heirloom in the attic: ${heirloom.icon} ${heirloom.name} (Estimated value: ${updated.currencySymbol}${heirloom.value.toLocaleString()})!`);
    updated.happiness = clamp(updated.happiness + 15);
  }

  // Diseases & health decay
  if (updated.diseases.length > 0) {
    for (const d of updated.diseases) {
      updated.health = clamp(updated.health - d.healthDrain);
      if (Math.random() * 100 < d.lethality) {
        updated.alive = false;
        updated.causeOfDeath = `Complications from ${d.name}`;
        newEvents.push(`Tragically, I succumbed to ${d.name} at age ${updated.age}.`);
        break;
      }
    }
  }

  // Random spontaneous sickness (7% chance)
  if (updated.alive && Math.random() < 0.07 && updated.diseases.length < 2) {
    const disease = pickRandom(DISEASES_CATALOG);
    if (!updated.diseases.find((d) => d.id === disease.id)) {
      updated.diseases.push(disease);
      newEvents.push(`I was diagnosed with ${disease.name}!`);
      updated.happiness = clamp(updated.happiness - 15);
    }
  }

  // Natural aging health decay for elderly
  if (updated.age > 65) {
    const ageDrain = Math.floor((updated.age - 60) / 7);
    updated.health = clamp(updated.health - ageDrain);
    updated.looks = clamp(updated.looks - 2);
  }

  // Death from zero health or extreme age (> 100)
  if (updated.alive) {
    if (updated.health <= 0) {
      updated.alive = false;
      updated.causeOfDeath = 'Poor health and systemic organ failure';
      newEvents.push(`I died of acute health failure at age ${updated.age}.`);
    } else if (updated.age > 95 && Math.random() < (updated.age - 90) * 0.06) {
      updated.alive = false;
      updated.causeOfDeath = 'Natural causes and extreme old age';
      newEvents.push(`I passed away peacefully in my sleep at age ${updated.age}.`);
    }
  }

  if (!updated.alive) {
    updated.ribbon = calculateRibbon(updated);
    updated.epitaph = generateEpitaph(updated);
  }

  // Append a rich, unique procedural anecdote if year was otherwise quiet
  if (newEvents.length === 0) {
    newEvents.push(generateProceduralYearlyAnecdote(updated));
  } else if (!hasCelebrityMilestone && Math.random() < 0.45 && updated.alive) {
    // 45% chance to append an additional colorful annual anecdote alongside milestones
    newEvents.push(generateProceduralYearlyAnecdote(updated));
  }

  updated.lifeLog.push({
    age: updated.age,
    yearNumber: updated.lifeLog.length,
    events: newEvents,
  });

  return {
    newChar: updated,
    eventsLog: newEvents,
  };
}

export function generateProceduralYearlyAnecdote(char: Character): string {
  const age = char.age;

  const YOUTH_ANECDOTES = [
    'I tried to jump off the sofa with an open umbrella, expecting to float like Mary Poppins. I landed on the coffee table.',
    'I convinced my elementary school friends that our principal was secretly a retired spy who lived in an underground bunker.',
    'I ate a purple crayon on a $1 playground dare and had to visit the school nurse.',
    'I buried a time capsule containing a plastic dinosaur and half a granola bar behind the garden shed.',
    'I attempted to teach the neighborhood dog how to play checkers, but he chewed the board.',
    'I got my head temporarily wedged between the banister railings while spying on my parents downstairs.',
    'I traded my lunch dessert for a holographic sticker that turned out to be completely counterfeit.',
    'I spent three weeks obsessively digging a hole to China in the backyard before hitting a sprinkler pipe.',
    'I participated in the school talent show with an interpretive dance about a leaf blowing in the wind.',
    'I tried to make an invisibility potion using tap water, blue food dye, and half a bottle of shampoo.',
  ];

  const TEEN_ANECDOTES = [
    'I attempted to give myself a modern haircut at 2 AM with blunt kitchen shears. It did not go well.',
    'I accidentally texted a screenshot of my crush’s profile directly to my crush with the caption "look at this cutie."',
    'I learned the opening riff to "Smoke on the Water" on guitar and played it for four hours straight until my parents begged me to stop.',
    'I tried to sneak out to a party through the basement window, but my hoodie got hooked on the latch and I hung there for twenty minutes.',
    'I entered a local spicy wing-eating contest and drank four glasses of milk in front of forty laughing strangers.',
    'I won third place in the high school science fair with an explosive baking soda volcano that coated the ceiling.',
    'I got stuck inside an automatic shopping cart corral in the mall parking lot while looking for my lost phone.',
    'I tried parallel parking during driver’s ed and mounted the curb so forcefully that both hubcaps flew off.',
    'I got into an intense 3-hour debate at a diner over whether a hot dog qualifies as a sandwich.',
    'I attempted to skateboard down the steepest hill in town and had to bail straight into a pile of autumn leaves.',
  ];

  const ADULT_ANECDOTES = [
    'A rogue squirrel broke into my kitchen through the chimney, stole half an avocado, and stared at me defiantly before exiting.',
    'I accidentally bought twelve identical pairs of neon compression socks during a 3:30 AM online flash sale.',
    'I got trapped inside an automatic car wash when my driver-side window mechanism chose that exact moment to jam open.',
    'I entered a chili cook-off using a recipe I hallucinated after a fever dream, and surprisingly took home second prize.',
    'I spent a whole Saturday assembling a Scandinavian flat-pack wardrobe without the manual, creating what looked like a contemporary art sculpture.',
    'I was interviewed on the evening news as a confused bystander when a flock of escaped emus ran down Main Street.',
    'My bank mistakenly credited $28 to my checking balance, then mailed me three stern certified letters demanding it back with interest.',
    'I tried to learn conversational French using a podcast while sleeping, and woke up only remembering how to order cheese.',
    'I got stuck in an elevator for an hour with a motivational speaker who refused to stop practicing their keynote speech.',
    'I bought an expensive mechanical espresso machine that produced an astonishing geyser of steamed milk across the ceiling.',
    'A stray ginger cat wandered through my front door, claimed the sofa, and officially became my roommate.',
    'I accidentally matched with my high school biology teacher on a dating app and immediately deactivated my profile.',
    'I tried to assemble a high-end drone, flew it once in the park, and watched it ascend majestically into the clouds, never to return.',
    'I won a radio station trivia contest by correctly naming all four Beatles’ middle names while sitting in a dentist chair.',
    'I developed an intense three-month fascination with vintage mechanical typewriters and typed all my grocery lists on one.',
  ];

  const SENIOR_ANECDOTES = [
    'I won fourteen consecutive games of Scrabble at the community center, officially earning the nickname "The Lexicon."',
    'I got into a polite 45-minute argument with a botanical garden curator over whether my prize begonias have feelings.',
    'I accidentally joined a motorized scooter synchronized drill team at the retirement village.',
    'I mistook an avant-garde modern art installation for a comfortable park bench and sat on it for half an hour.',
    'I won the neighborhood association’s highest award for most aggressively manicured hydrangeas.',
    'I found a 1968 mint-condition nickel in my sofa cushions that an appraiser told me was worth ninety cents.',
  ];

  if (age < 12) return pickRandom(YOUTH_ANECDOTES);
  if (age < 18) return pickRandom(TEEN_ANECDOTES);
  if (age < 65) return pickRandom(ADULT_ANECDOTES);
  return pickRandom(SENIOR_ANECDOTES);
}

export function calculateNetWorth(char: Character): number {
  let total = char.money;
  char.realEstate.forEach((re) => {
    total += re.price - (re.hasMortgage ? re.mortgageLeft : 0);
  });
  char.vehicles.forEach((v) => {
    total += v.price;
  });
  char.heirlooms.forEach((h) => {
    total += h.value;
  });
  (char.kendamas || []).forEach((k) => {
    total += k.price;
  });
  return total;
}

export function calculateRibbon(char: Character): RibbonType {
  const netWorth = calculateNetWorth(char);
  if (char.royalty) return 'Monarch';
  if ((char.presidentialTermsWon && char.presidentialTermsWon > 0) || char.politicalOffice?.level === 'President') return 'Presidential';
  if (netWorth >= 20000000) return 'Loaded';
  if (netWorth >= 2500000) return 'Rich';
  if (char.prisonRecord.length >= 2 || (char.inPrison && char.age > 25)) return 'Jailbird';
  if (char.age >= 100) return 'Geriatric';
  if (char.karma < 20) return 'Wicked';
  if (char.karma > 85 && char.happiness > 70) return 'Hero';
  if (char.fame > 70) return 'Famous';
  if (char.educationLevel === 'Medical School' || char.educationLevel === 'Graduate School') return 'Academic';
  if (char.relationships.filter((r) => r.relation === 'Son' || r.relation === 'Daughter').length >= 5) return 'Fertile';
  if (char.health < 30 && char.age < 40) return 'Unlucky';
  return 'Mediocre';
}

export function generateEpitaph(char: Character): string {
  const netWorth = calculateNetWorth(char);
  if (char.ribbon === 'Monarch') {
    return 'Reigned in sovereign majesty and royal grandeur from the golden throne.';
  }
  if (char.ribbon === 'Presidential') {
    return 'Served as Commander-in-Chief, shaping the course of history and national destiny.';
  }
  if (char.ribbon === 'Loaded' || char.ribbon === 'Rich') {
    return `Left behind an empire of ${char.currencySymbol}${netWorth.toLocaleString()} and fond memories.`;
  }
  if (char.ribbon === 'Hero') {
    return 'A saint of endless generosity whose kindness warmed every soul.';
  }
  if (char.ribbon === 'Jailbird') {
    return 'Lived dangerously, feared by prison guards, never truly tamed.';
  }
  if (char.ribbon === 'Geriatric') {
    return `Witnessed a whole century unfold with grace and resilience.`;
  }
  return 'Lived their life, made their mark, and rest in peaceful slumber.';
}

export function ascendRoyalLadder(
  character: Character,
  deceasedParentName?: string
): { character: Character; eventText: string } {
  if (!character.royalty) {
    return { character, eventText: '' };
  }

  const countryData = COUNTRIES.find((c) => c.name === (character.royalty?.country || character.country));
  const monarchyConfig = countryData?.monarchy;
  const newMonarchTitle =
    character.gender === 'Female'
      ? (monarchyConfig?.monarchFemale || 'Queen')
      : (monarchyConfig?.monarchMale || 'King');

  const fortune = randomInt(40000000, 180000000);
  const updatedRoyalty = {
    ...character.royalty,
    title: newMonarchTitle,
    isMonarch: true,
    respect: Math.max(90, character.royalty.respect),
    yearlyAllowance: clamp(randomInt(35000000, 100000000), 10000000, 100000000),
  };

  const updatedChar: Character = {
    ...character,
    royalty: updatedRoyalty,
    money: character.money + fortune,
    fame: clamp(character.fame + 40),
    happiness: clamp(character.happiness + 25),
  };

  const cause = deceasedParentName
    ? `the demise of your royal parent (${deceasedParentName})`
    : 'the passing of the sovereign monarch';
  const eventText = `👑 ROYAL ASCENSION! Following ${cause}, you moved up the royal succession ladder and ascended the throne! You have been officially crowned ${newMonarchTitle} of ${character.royalty.country || character.country}! You inherited ${character.currencySymbol}${fortune.toLocaleString()} from the Crown Estate! Long live the Sovereign!`;

  return { character: updatedChar, eventText };
}
