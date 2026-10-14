import { Character, Disease, Relationship } from '../types/bitlife';
import { DISEASES_CATALOG } from './diseases';
import { randomInt } from '../utils/lifeEngine';

export interface EventDefinition {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  minAge: number;
  maxAge: number;
  condition?: (char: Character) => boolean;
  options: {
    text: string;
    action: (char: Character) => {
      outcomeText: string;
      happinessChange?: number;
      healthChange?: number;
      smartsChange?: number;
      looksChange?: number;
      moneyChange?: number;
      karmaChange?: number;
      fameChange?: number;
      celebrityInteraction?: boolean;
      diseaseAdded?: Disease;
      diseaseCured?: string;
      arrested?: boolean;
      prisonSentence?: number;
      death?: boolean;
      causeOfDeath?: string;
      newRelationship?: Relationship;
    };
  }[];
}

export const RANDOM_EVENTS: EventDefinition[] = [
  // BABY / TODDLER (0 - 5)
  {
    id: 'vaccination_cry',
    title: 'Pediatric Visit',
    prompt: 'Your mother took you to the doctor for your routine MMR vaccination. The nurse approaches with a sharp needle!',
    icon: '💉',
    minAge: 1,
    maxAge: 4,
    options: [
      {
        text: 'Scream bloody murder and kick the pediatrician',
        action: () => ({
          outcomeText: 'You kicked the doctor squarely in the groin! Your parents were horrified, but you felt victorious.',
          happinessChange: 10,
          karmaChange: -5,
        }),
      },
      {
        text: 'Bite down on your pacifier stoically',
        action: () => ({
          outcomeText: 'You took the needle like a champ. The nurse rewarded you with a sparkly dinosaur sticker.',
          happinessChange: 15,
          healthChange: 5,
          smartsChange: 2,
        }),
      },
      {
        text: 'Burst into terrified tears',
        action: () => ({
          outcomeText: 'You cried until you vomited baby formula all over your dad’s favorite button-down shirt.',
          happinessChange: -10,
        }),
      },
    ],
  },
  {
    id: 'eat_crayon',
    title: 'Crayon Feast',
    prompt: 'While playing on the carpet, you discovered a box of colorful wax crayons. The red one looks particularly appetizing.',
    icon: '🖍️',
    minAge: 2,
    maxAge: 5,
    options: [
      {
        text: 'Eat the red crayon whole',
        action: () => ({
          outcomeText: 'It tasted like waxy cherries! You pooped red for the next two days, panicking your parents.',
          happinessChange: 5,
          healthChange: -5,
          smartsChange: -3,
        }),
      },
      {
        text: 'Draw on the living room wallpaper',
        action: () => ({
          outcomeText: 'You crafted a masterpiece of scribbles on the wall. Your parents put you in time-out.',
          happinessChange: -5,
          smartsChange: 5,
        }),
      },
      {
        text: 'Share the crayons with the family dog',
        action: () => ({
          outcomeText: 'The dog chewed them up with glee. You bonded deeply.',
          happinessChange: 10,
          karmaChange: 5,
        }),
      },
    ],
  },

  // SCHOOL AGE (6 - 12)
  {
    id: 'school_bully',
    title: 'Schoolyard Bully',
    prompt: 'During recess, a loudmouth kid named Chad corners you by the swings and demands your lunch money!',
    icon: '🥊',
    minAge: 6,
    maxAge: 13,
    options: [
      {
        text: 'Deliver a swift uppercut to his jaw',
        action: () => ({
          outcomeText: 'POW! You knocked him down! He cried to the principal, and you were suspended for two days, but earned street cred.',
          happinessChange: 15,
          karmaChange: -5,
        }),
      },
      {
        text: 'Surrender your lunch money ($5)',
        action: () => ({
          outcomeText: 'Chad sneered and took your lunch money. You spent lunch hour hungry and humiliated.',
          happinessChange: -20,
          moneyChange: -5,
        }),
      },
      {
        text: 'Tell the playground supervisor',
        action: () => ({
          outcomeText: 'The supervisor intervened and gave Chad detention. Chad called you a snitch, but you got to keep your lunch.',
          happinessChange: 5,
          karmaChange: 5,
          smartsChange: 3,
        }),
      },
      {
        text: 'Challenge him to a Pokémon battle instead',
        action: () => ({
          outcomeText: 'Chad pulled out his Charizard card. You beat him with a tactical water-type counter and became best friends!',
          happinessChange: 20,
          smartsChange: 4,
          karmaChange: 10,
        }),
      },
    ],
  },
  {
    id: 'spelling_bee',
    title: 'Annual Spelling Bee',
    prompt: 'You qualified for the school-wide spelling bee! The final deciding word is: "ACQUIESCE".',
    icon: '🐝',
    minAge: 8,
    maxAge: 14,
    options: [
      {
        text: 'Spell it: A-C-Q-U-I-E-S-C-E',
        action: (char) => {
          const success = char.smarts > 40;
          return {
            outcomeText: success
              ? 'CORRECT! The crowd erupted into thunderous applause! You took home the 1st place gold trophy!'
              : 'You mispronounced the vowel order! The buzzer buzzed loudly and you took 2nd place.',
            happinessChange: success ? 25 : -10,
            smartsChange: success ? 8 : 2,
          };
        },
      },
      {
        text: 'Freeze up and pretend to faint',
        action: () => ({
          outcomeText: 'You collapsed dramatically on stage! The school nurse rushed out. You avoided embarrassment, sort of.',
          happinessChange: -5,
          looksChange: 2,
        }),
      },
    ],
  },

  // TEENAGE (13 - 17)
  {
    id: 'skip_school_dare',
    title: 'Ditching Class',
    prompt: 'Your classmate Tyler whispers that everyone is jumping the school fence to hang out at the local mall arcade.',
    icon: '🎒',
    minAge: 13,
    maxAge: 17,
    options: [
      {
        text: 'Jump the fence and ditch with them',
        action: () => ({
          outcomeText: 'You spent the day playing rhythm games and eating curly fries. It was exhilarating!',
          happinessChange: 20,
          smartsChange: -5,
          karmaChange: -5,
        }),
      },
      {
        text: 'Stay in chemistry class and study',
        action: () => ({
          outcomeText: 'The teacher praised your focus and bumped your grade. Tyler got caught by the truant officer.',
          happinessChange: 5,
          smartsChange: 8,
          karmaChange: 5,
        }),
      },
    ],
  },
  {
    id: 'first_crush_confession',
    title: 'High School Romance',
    prompt: 'Your longtime secret crush asks if you would like to attend the homecoming school dance with them!',
    icon: '💖',
    minAge: 14,
    maxAge: 18,
    options: [
      {
        text: 'Say YES enthusiastically!',
        action: () => ({
          outcomeText: 'They beamed and hugged you tightly! You danced under the gymnasium disco ball all night long.',
          happinessChange: 35,
          looksChange: 5,
        }),
      },
      {
        text: 'Politely decline — you prefer flying solo',
        action: () => ({
          outcomeText: 'They seemed disappointed but respected your independence. You spent the night gaming in peace.',
          happinessChange: 5,
        }),
      },
      {
        text: 'Laugh in their face and walk away',
        action: () => ({
          outcomeText: 'They ran away crying. Everyone in the hallway gave you filthy looks. You monster!',
          happinessChange: -15,
          karmaChange: -25,
        }),
      },
    ],
  },

  // YOUNG ADULT & ADULT (18 - 60)
  {
    id: 'lottery_ticket_found',
    title: 'Scratch-Off on the Sidewalk',
    prompt: 'While walking down the street, you spot a scratch-off lottery ticket lying face up on the pavement.',
    icon: '🎟️',
    minAge: 18,
    maxAge: 90,
    options: [
      {
        text: 'Scratch it off immediately',
        action: () => {
          const win = Math.random() < 0.25;
          const prize = win ? 5000 : 0;
          return {
            outcomeText: win
              ? `HOLY MOLY! The ticket revealed a matching triple diamond! You redeemed it for a clean $${prize}!`
              : 'You scratched it with a dime... zero matching symbols. At least the hope was exciting.',
            happinessChange: win ? 30 : -2,
            moneyChange: prize,
          };
        },
      },
      {
        text: 'Leave it on the pavement',
        action: () => ({
          outcomeText: 'You walked past it without glancing back, minding your own business.',
          happinessChange: 0,
        }),
      },
    ],
  },
  {
    id: 'coworker_lunch_thief',
    title: 'Office Mystery',
    prompt: 'Someone in your office has repeatedly eaten your labeled artisanal lasagna from the shared breakroom fridge.',
    icon: '🍝',
    minAge: 19,
    maxAge: 65,
    condition: (char) => !!char.job,
    options: [
      {
        text: 'Spike the next lasagna with ultra-hot ghost pepper sauce',
        action: () => ({
          outcomeText: 'At 12:15 PM, your manager Steve burst out of the kitchen coughing fire, tears streaming down his face! Justice served.',
          happinessChange: 25,
          karmaChange: -5,
        }),
      },
      {
        text: 'Send a polite, passive-aggressive email to All-Company',
        action: () => ({
          outcomeText: 'Your email ignited a company-wide Slack thread debate about fridge etiquette that lasted 3 days.',
          happinessChange: 5,
        }),
      },
      {
        text: 'Let it go and order expensive sushi instead',
        action: () => ({
          outcomeText: 'The sushi was heavenly, though your bank account took a $45 hit.',
          happinessChange: 10,
          moneyChange: -45,
        }),
      },
    ],
  },
  {
    id: 'wallet_on_street',
    title: 'Lost Wallet',
    prompt: 'You find a thick leather wallet on the sidewalk containing credit cards and $650 in crisp cash.',
    icon: '👛',
    minAge: 18,
    maxAge: 95,
    options: [
      {
        text: 'Return the wallet with all the cash to the police',
        action: () => ({
          outcomeText: 'The grateful owner tracked you down and gave you a $100 reward and heartfelt thank-you letter.',
          happinessChange: 20,
          moneyChange: 100,
          karmaChange: 30,
        }),
      },
      {
        text: 'Pocket the cash and toss the wallet in the trash',
        action: () => ({
          outcomeText: 'You stuffed the $650 into your pocket. Your wallet feels thick, but your conscience feels dirty.',
          happinessChange: 10,
          moneyChange: 650,
          karmaChange: -30,
        }),
      },
      {
        text: 'Take half the cash and mail the wallet back',
        action: () => ({
          outcomeText: 'You called it a "finder’s fee" and mailed the wallet anonymously with the cards intact.',
          happinessChange: 5,
          moneyChange: 325,
          karmaChange: -10,
        }),
      },
    ],
  },
  {
    id: 'crypto_bro_scam',
    title: 'Investment Opportunity',
    prompt: 'An old high school acquaintance slides into your DMs hyping a new cryptocurrency called "MoonDogeRocket". He swears it will 100x!',
    icon: '🚀',
    minAge: 18,
    maxAge: 70,
    options: [
      {
        text: 'Invest $2,000 in MoonDogeRocket',
        action: () => {
          const rugPull = Math.random() < 0.8;
          return {
            outcomeText: rugPull
              ? 'The developers rugged the liquidity pool three hours later! MoonDogeRocket crashed 99.9%. You lost everything.'
              : 'Against all odds, the token pumped on a celebrity tweet! You cashed out $8,000 in profits!',
            happinessChange: rugPull ? -25 : 35,
            moneyChange: rugPull ? -2000 : 6000,
            smartsChange: rugPull ? 2 : 0,
          };
        },
      },
      {
        text: 'Block them immediately',
        action: () => ({
          outcomeText: 'You hit Block and saved yourself from endless crypto spam.',
          happinessChange: 5,
          smartsChange: 4,
        }),
      },
    ],
  },
  {
    id: 'stray_animal_encounter',
    title: 'Stray Encounter',
    prompt: 'A scruffy, sad-eyed stray golden retriever puppy follows you home from the bus stop, whining at your doorstep.',
    icon: '🐕',
    minAge: 14,
    maxAge: 85,
    options: [
      {
        text: 'Adopt the puppy and welcome it to the family!',
        action: (char) => {
          const newPet = {
            id: 'pet_' + Date.now(),
            name: 'Lucky',
            species: 'Dog' as const,
            breed: 'Golden Retriever',
            age: 1,
            relationshipLevel: 100,
            health: 90,
          };
          char.pets.push(newPet);
          return {
            outcomeText: 'You bathed the pup, bought a bag of kibble, and named him Lucky! He wagged his tail happily.',
            happinessChange: 30,
            karmaChange: 20,
            moneyChange: -150,
          };
        },
      },
      {
        text: 'Take it to a no-kill animal shelter',
        action: () => ({
          outcomeText: 'The shelter thanked you warmly and promised to find Lucky a loving forever home.',
          happinessChange: 10,
          karmaChange: 15,
        }),
      },
      {
        text: 'Shoo it away',
        action: () => ({
          outcomeText: 'You slammed the door shut. You can hear its faint whimpers in the rain.',
          happinessChange: -15,
          karmaChange: -20,
        }),
      },
    ],
  },
  {
    id: 'ufo_sighting',
    title: 'Strange Lights in the Sky',
    prompt: 'At 2:00 AM, a bright neon-green circular disc hovers silently above your backyard before zooming off at hypersonic speed!',
    icon: '🛸',
    minAge: 16,
    maxAge: 90,
    options: [
      {
        text: 'Post your blurry video footage on YouTube',
        action: () => ({
          outcomeText: 'Your video went viral! Millions of alien enthusiasts subscribed and you made the evening news!',
          happinessChange: 20,
          fameChange: 25,
          moneyChange: 1200,
        }),
      },
      {
        text: 'Keep quiet and build a tin-foil hat',
        action: () => ({
          outcomeText: 'You lined your bedroom with foil. You felt safe, but your friends questioned your sanity.',
          happinessChange: 5,
          smartsChange: -5,
        }),
      },
    ],
  },
  {
    id: 'witch_doctor_offer',
    title: 'Mysterious Healer',
    prompt: 'An enigmatic elder in the market claims they can cleanse all impurities from your aura using fermented cobra venom.',
    icon: '🧙‍♂️',
    minAge: 18,
    maxAge: 85,
    options: [
      {
        text: 'Drink the cobra concoction ($250)',
        action: (char) => {
          const healed = Math.random() < 0.4;
          if (healed && char.diseases.length > 0) {
            const curedName = char.diseases[0].name;
            return {
              outcomeText: `Miraculously, your body shuddered and your ${curedName} was completely cured!`,
              happinessChange: 30,
              healthChange: 25,
              moneyChange: -250,
              diseaseCured: char.diseases[0].id,
            };
          }
          return {
            outcomeText: 'You suffered violent stomach cramps for 48 hours straight. Your aura remains unchanged.',
            happinessChange: -20,
            healthChange: -20,
            moneyChange: -250,
          };
        },
      },
      {
        text: 'Decline politely and walk away',
        action: () => ({
          outcomeText: 'You chose not to ingest strange snake venom. A very reasonable choice.',
          happinessChange: 2,
        }),
      },
    ],
  },
  {
    id: 'road_rage',
    title: 'Traffic Altercation',
    prompt: 'A driver in a rusty pickup cuts you off aggressively, stomps on their brakes, and flips you the bird!',
    icon: '🚗',
    minAge: 18,
    maxAge: 80,
    condition: (char) => char.vehicles.length > 0,
    options: [
      {
        text: 'Honk violently and flip them off back',
        action: () => ({
          outcomeText: 'The driver threw a half-eaten burrito at your windshield and sped off!',
          happinessChange: -10,
          karmaChange: -5,
        }),
      },
      {
        text: 'Take a deep breath and change lanes safely',
        action: () => ({
          outcomeText: 'You practiced mindful breathing. Road rage avoided.',
          happinessChange: 10,
          karmaChange: 10,
        }),
      },
      {
        text: 'Ram their bumper with your vehicle',
        action: () => ({
          outcomeText: 'CRASH! You smashed their tailgate! Police arrived and cited you for reckless endangerment.',
          happinessChange: -30,
          healthChange: -10,
          moneyChange: -1500,
          karmaChange: -25,
        }),
      },
    ],
  },
  {
    id: 'bingo_dispute',
    title: 'Bingo Night Drama',
    prompt: 'At the community center, Gertrude claims you shouted "BINGO!" one ball early and demands your prize basket of fancy jams!',
    icon: '👵',
    minAge: 60,
    maxAge: 100,
    options: [
      {
        text: 'Defend your jam basket with your cane',
        action: () => ({
          outcomeText: 'You raised your cane high! Gertrude backed off into her armchair. The raspberry jam is yours!',
          happinessChange: 20,
        }),
      },
      {
        text: 'Share the jam with Gertrude',
        action: () => ({
          outcomeText: 'You offered Gertrude half the preserves. You two ended up eating scones together.',
          happinessChange: 15,
          karmaChange: 15,
        }),
      },
    ],
  },

  // CELEBRITY ENCOUNTERS (Rare / High Fame only)
  {
    id: 'djt_golf_encounter',
    title: 'Mar-a-Lago Fairways',
    prompt: 'While visiting Florida, Donald J. Trump (DJT) pulls up in a gold-plated golf cart, flashes a thumbs up, and says: "Tremendous day for golf, folks. Best greens in the world! Want to play a 9-hole putting challenge?"',
    icon: '👱‍♂️',
    minAge: 21,
    maxAge: 95,
    condition: (char) => (char.fame >= 50 || Math.random() < 0.04),
    options: [
      {
        text: 'Challenge DJT to a $10,000 putting showdown',
        action: (char) => {
          const win = char.smarts > 60 || Math.random() < 0.5;
          return {
            outcomeText: win
              ? 'You sank a 25-foot birdie putt! DJT nodded with respect: "Great player, very high energy! You win fair and square!" and handed you a crisp stack of $10,000 cash!'
              : 'DJT drained an impossible curve putt into the cup! "Never bet against the Trump swing, believe me!" You paid him the bet, but he signed your golf ball as a souvenir.',
            happinessChange: win ? 30 : -5,
            moneyChange: win ? 10000 : -10000,
            fameChange: 15,
            celebrityInteraction: true,
          };
        },
      },
      {
        text: 'Ask him for real estate negotiation advice',
        action: () => ({
          outcomeText: 'DJT explained the "Art of the Deal" over club sandwiches and iced tea. You felt energized and smarter about high-stakes negotiations!',
          happinessChange: 20,
          smartsChange: 10,
          karmaChange: 5,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Compliment his golf swing and take a selfie',
        action: () => ({
          outcomeText: 'DJT smiled warmly for the photo: "Make sure you post this, it’s going to break the internet!" It racked up 250,000 likes on social media.',
          happinessChange: 20,
          fameChange: 20,
          celebrityInteraction: true,
        }),
      },
    ],
  },
  {
    id: 'bezos_yacht_summit',
    title: 'Billionaire Superyacht',
    prompt: 'Jeff Bezos invites you aboard his multi-million dollar sailing superyacht Koru. He stands on the deck in aviator sunglasses, offering you a cup of artisanal espresso.',
    icon: '🚀',
    minAge: 21,
    maxAge: 90,
    condition: (char) => (char.fame >= 50 || Math.random() < 0.04),
    options: [
      {
        text: 'Pitch him an AI logistics algorithm for Amazon',
        action: (char) => {
          const success = char.smarts > 60;
          return {
            outcomeText: success
              ? 'Bezos paused, his eyes lighting up: "Fascinating optimization theorem. I want this deployed across our fulfillment centers immediately." His venture arm wired you a $150,000 consultancy grant!'
              : 'Bezos chuckled politely: "We solved that problem back in 2004. Keep thinking big, though!" He gave you a 1-year free Prime membership.',
            happinessChange: success ? 35 : 10,
            moneyChange: success ? 150000 : 0,
            smartsChange: 8,
            fameChange: 15,
            celebrityInteraction: true,
          };
        },
      },
      {
        text: 'Ask to fly on Blue Origin’s next rocket to space',
        action: () => ({
          outcomeText: 'Bezos handed you an astronaut flight patch: "Clear your schedule for next summer. You’re going to zero gravity!" What a thrill!',
          happinessChange: 40,
          fameChange: 25,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Work out with him in the yacht’s gym',
        action: () => ({
          outcomeText: 'You and Jeff benched heavy dumbbells on the top deck overlooking the ocean. Your muscles were sore for a week!',
          happinessChange: 15,
          healthChange: 10,
          looksChange: 5,
          celebrityInteraction: true,
        }),
      },
    ],
  },
  {
    id: 'sundar_larry_google_encounter',
    title: 'The Googleplex Secret Lab',
    prompt: 'You are visiting Silicon Valley when Alphabet CEO Sundar Pichai and Google co-founder Larry Page invite you into the Google X secret lab to see an experimental quantum computer prototype!',
    icon: '💻',
    minAge: 21,
    maxAge: 85,
    condition: (char) => (char.fame >= 50 || Math.random() < 0.04),
    options: [
      {
        text: 'Suggest a novel architecture for search & neural networks',
        action: () => ({
          outcomeText: 'Larry Page leaned forward and Sundar smiled warmly: "Brilliant insight. Would you be interested in joining Alphabet as a Distinguished Fellow?" They offered you a $200,000 technology fellowship grant!',
          happinessChange: 35,
          smartsChange: 15,
          moneyChange: 200000,
          fameChange: 20,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Ask Larry Page for a test flight in his electric flying car',
        action: () => ({
          outcomeText: 'Larry strapped you into an autonomous electric vertical takeoff prototype. You zoomed above the San Francisco Bay at 150 mph! Absolutely exhilarating!',
          happinessChange: 35,
          healthChange: 5,
          fameChange: 15,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Take a group selfie with Sundar and Larry Page',
        action: () => ({
          outcomeText: 'You snapped a legendary photo with the architects of the modern internet. It became the #1 trending post on LinkedIn and Twitter!',
          happinessChange: 25,
          fameChange: 25,
          celebrityInteraction: true,
        }),
      },
    ],
  },
  {
    id: 'elon_musk_starship',
    title: 'Rocket Launch VIP',
    prompt: 'Elon Musk invites you to Starbase Boca Chica to watch the monumental launch of the largest rocket in human history. He hands you ear protection as engines ignite!',
    icon: '🛰️',
    minAge: 21,
    maxAge: 85,
    condition: (char) => (char.fame >= 50 || Math.random() < 0.04),
    options: [
      {
        text: 'Watch the rocket liftoff and shout "OCCUPY MARS!"',
        action: () => ({
          outcomeText: 'The ground shook with 16 million pounds of thrust as the stainless steel giant ascended into space! Elon laughed and high-fived you!',
          happinessChange: 30,
          fameChange: 15,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Pitch him an idea for dogecoin integration',
        action: () => ({
          outcomeText: 'Elon tweeted your idea with a meme! The crypto market surged and you made $25,000 on the sudden hype!',
          happinessChange: 25,
          moneyChange: 25000,
          fameChange: 20,
          celebrityInteraction: true,
        }),
      },
    ],
  },

  // NEW DIVERSE RANDOM EVENTS
  // Childhood & School
  {
    id: 'science_fair_volcano',
    title: 'School Science Fair',
    prompt: 'It is the annual science fair! You constructed a papier-mâché volcano, but your friend Tyler secretly added triple the red food dye and hydrogen peroxide.',
    icon: '🌋',
    minAge: 8,
    maxAge: 14,
    options: [
      {
        text: 'Pour the catalyst and trigger the mega eruption!',
        action: () => ({
          outcomeText: 'KA-BOOM! A geyser of bubbling crimson foam shot 15 feet high, splattering the principal and ceiling tiles! The crowd roared with applause and you won the Crowd Favorite ribbon!',
          happinessChange: 25,
          smartsChange: 6,
        }),
      },
      {
        text: 'Dilute the mixture with water to play it safe',
        action: () => ({
          outcomeText: 'Your volcano produced a polite, gentle fizzle. The judges awarded you 3rd place for safety compliance.',
          happinessChange: 5,
          smartsChange: 4,
        }),
      },
      {
        text: 'Blame Tyler and run out of the gymnasium',
        action: () => ({
          outcomeText: 'You sprinted away! Tyler took all the glory and earned 1st place while you hid in the boys’ restroom.',
          happinessChange: -10,
          karmaChange: -10,
        }),
      },
    ],
  },
  {
    id: 'talent_show_performance',
    title: 'School Talent Show',
    prompt: 'You stand backstage in the school auditorium. It is your turn to perform in front of 600 students, teachers, and parents!',
    icon: '🎭',
    minAge: 9,
    maxAge: 15,
    options: [
      {
        text: 'Perform an electrifying electric guitar solo',
        action: (char) => {
          const success = char.smarts > 45 || Math.random() < 0.6;
          return {
            outcomeText: success
              ? 'You shredded a lightning-fast rock solo! The entire auditorium gave you a standing ovation!'
              : 'You snapped a guitar string halfway through, but bowed gracefully. People cheered for the effort!',
            happinessChange: success ? 30 : 5,
            looksChange: 4,
            karmaChange: 5,
          };
        },
      },
      {
        text: 'Perform a high-stakes comedy stand-up routine',
        action: () => ({
          outcomeText: 'Your jokes about cafeteria mystery meat had teachers crying with laughter! You became an instant school legend.',
          happinessChange: 25,
          smartsChange: 5,
        }),
      },
      {
        text: 'Freeze up and recite the periodic table',
        action: () => ({
          outcomeText: 'You rattled off all 118 chemical elements flawlessly from memory. The chemistry teacher wiped away a single tear of joy.',
          happinessChange: 10,
          smartsChange: 10,
        }),
      },
    ],
  },
  {
    id: 'lost_bulldog_rescue',
    title: 'Runaway Bulldog',
    prompt: 'While walking through the park, a stout English bulldog wearing a glittery collar waddles up to you, panting with a tennis ball in its mouth.',
    icon: '🐶',
    minAge: 7,
    maxAge: 17,
    options: [
      {
        text: 'Call the phone number engraved on its collar tag',
        action: () => ({
          outcomeText: 'The grateful owner, an elderly bakery chef, arrived in tears! She rewarded you with $100 and a warm box of homemade chocolate chip cookies!',
          happinessChange: 25,
          karmaChange: 20,
          moneyChange: 100,
        }),
      },
      {
        text: 'Play fetch with the bulldog for an hour',
        action: () => ({
          outcomeText: 'You two played fetch until the owner spotted you from across the field. You made a canine best friend.',
          happinessChange: 20,
          healthChange: 5,
          karmaChange: 10,
        }),
      },
    ],
  },

  // Young Adult & Career
  {
    id: 'shark_tank_pitch',
    title: 'Shark Tank Audition',
    prompt: 'You passed auditions to pitch your patented smart backpack invention on prime-time television before five billionaire investor judges!',
    icon: '🦈',
    minAge: 18,
    maxAge: 70,
    options: [
      {
        text: 'Ask for $250,000 for 10% equity with aggressive projections',
        action: (char) => {
          const success = char.smarts > 50;
          return {
            outcomeText: success
              ? 'TWO SHARKS ENGAGED IN A BIDDING WAR! You accepted an offer of $350,000 for 15% from Mark Cuban! The episode aired to 8 million viewers!'
              : 'Kevin O’Leary grimaced: "You’re dead to me. Take this dog behind the barn and shoot it." You left with zero deals, but had fun on TV.',
            happinessChange: success ? 35 : -10,
            moneyChange: success ? 350000 : 0,
            fameChange: 20,
            smartsChange: 5,
          };
        },
      },
      {
        text: 'Tell a tear-jerking emotional backstory',
        action: () => ({
          outcomeText: 'The judges were visibly moved! An investor offered you a $100,000 licensing royalty agreement!',
          happinessChange: 25,
          moneyChange: 100000,
          fameChange: 15,
        }),
      },
    ],
  },
  {
    id: 'flea_market_masterpiece',
    title: 'Garage Sale Treasure',
    prompt: 'At a neighborhood yard sale, you spot a dusty, framed oil painting of a Venetian canal marked for $25. Something about the brushwork looks remarkably authentic.',
    icon: '🎨',
    minAge: 18,
    maxAge: 85,
    options: [
      {
        text: 'Buy it for $25 and take it to an antique appraiser',
        action: () => {
          const jackpot = Math.random() < 0.6;
          const value = jackpot ? 120000 : 800;
          return {
            outcomeText: jackpot
              ? `ASTONISHING DISCOVERY! The appraiser gasped: It was a lost 18th-century masterwork by Canaletto! Sotheby's auctioned it for an incredible $${value.toLocaleString()}!`
              : `The appraiser inspected it with a magnifying glass: It is a charming 1970s reproduction worth around $${value}. Still a great profit!`,
            happinessChange: jackpot ? 35 : 10,
            moneyChange: value - 25,
            smartsChange: 4,
          };
        },
      },
      {
        text: 'Pass on it — it looks like dusty junk',
        action: () => ({
          outcomeText: 'You walked away. Three weeks later you read in the local paper that someone else bought it and made six figures. Ouch.',
          happinessChange: -15,
        }),
      },
    ],
  },
  {
    id: 'meteorite_fall',
    title: 'Meteorite in the Garden',
    prompt: 'At 3:00 AM, a sonic boom shakes your house! You race outside to find a smoking, metallic extraterrestrial meteorite resting in a crater in your backyard!',
    icon: '☄️',
    minAge: 18,
    maxAge: 90,
    options: [
      {
        text: 'Sell the rare pallasite meteorite to a private space museum',
        action: () => ({
          outcomeText: 'Geologists verified it was an ultra-rare olivine crystal pallasite from deep space! A private space billionaire bought it for $180,000!',
          happinessChange: 30,
          moneyChange: 180000,
          fameChange: 10,
        }),
      },
      {
        text: 'Keep it on your mantelpiece as an alien conversation piece',
        action: () => ({
          outcomeText: 'Every dinner guest marvelled at the cosmic stone. You swear it faintly hums when the full moon rises.',
          happinessChange: 15,
          smartsChange: 6,
        }),
      },
      {
        text: 'Donate it to the National History Museum',
        action: () => ({
          outcomeText: 'The museum named the meteorite wing after you in a formal ceremony! A plaque commemorates your gift.',
          happinessChange: 25,
          karmaChange: 25,
          fameChange: 15,
        }),
      },
    ],
  },
  {
    id: 'eccentric_inheritance',
    title: 'Mysterious Benefactor',
    prompt: 'A prestigious law firm summons you to a mahogany boardroom. A wealthy eccentric philanthropist named Arthur Pendelton has passed away and named you in his will!',
    icon: '📜',
    minAge: 18,
    maxAge: 90,
    options: [
      {
        text: 'Accept the inheritance unconditionally',
        action: () => ({
          outcomeText: 'The lawyer handed you a certified cashier’s check for $75,000! Arthur’s diary noted: "They once held the subway door open for me when everyone else ignored me."',
          happinessChange: 30,
          moneyChange: 75000,
          karmaChange: 15,
        }),
      },
      {
        text: 'Donate half to Arthur’s favorite animal rescue charity',
        action: () => ({
          outcomeText: 'You accepted $37,500 and directed the remaining $37,500 to dog shelters. The community praised your noble heart!',
          happinessChange: 35,
          moneyChange: 37500,
          karmaChange: 30,
        }),
      },
    ],
  },
  {
    id: 'hollywood_cameo_offer',
    title: 'Hollywood Cameo',
    prompt: 'A famous Hollywood director spots you at an airport lounge and insists you have the exact captivating face needed for a surprise cameo in a $200M sci-fi blockbuster!',
    icon: '🎬',
    minAge: 18,
    maxAge: 80,
    options: [
      {
        text: 'Fly to the film set and film your scene',
        action: () => ({
          outcomeText: 'You delivered your single iconic line opposite superstar actors! The movie became a box office smash and your 5-second scene became a viral meme!',
          happinessChange: 30,
          moneyChange: 45000,
          fameChange: 25,
        }),
      },
      {
        text: 'Demand a trailer with a private espresso machine',
        action: () => ({
          outcomeText: 'The director laughed at your diva demands and cast someone else. You missed your silver screen debut!',
          happinessChange: -10,
        }),
      },
    ],
  },

  // Politics & Royalty Life Events
  {
    id: 'state_dinner_toast',
    title: 'State Dinner Gaffe',
    prompt: 'At a prestigious diplomatic state dinner, a distinguished foreign ambassador raises a crystal goblet of vintage champagne to deliver a formal toast to you.',
    icon: '🥂',
    minAge: 25,
    maxAge: 90,
    options: [
      {
        text: 'Deliver a poetic toast in the ambassador’s native tongue',
        action: (char) => {
          const success = char.smarts > 50;
          return {
            outcomeText: success
              ? 'You recited an ancient proverb in their native language with pristine accent! The room burst into applause and international relations blossomed!'
              : 'You accidentally mispronounced a word, translating "eternal friendship" into "pickled turnip"! The ambassador chuckled heartily and raised his glass.',
            happinessChange: success ? 25 : 10,
            fameChange: 15,
            smartsChange: 4,
          };
        },
      },
      {
        text: 'Keep it short, dignified, and raise your glass',
        action: () => ({
          outcomeText: '"To peace, prosperity, and enduring alliance!" Glasses clinked across the banquet hall. Flawless diplomatic execution.',
          happinessChange: 15,
          fameChange: 10,
        }),
      },
    ],
  },
  {
    id: 'warren_buffett_lunch',
    title: 'The Oracle of Omaha',
    prompt: 'You find yourself sitting across from legendary investor Warren Buffett at a vintage diner in Nebraska. He is sipping an ice-cold cherry cola and eating hash browns.',
    icon: '📈',
    minAge: 21,
    maxAge: 90,
    options: [
      {
        text: 'Ask for his single greatest piece of financial wisdom',
        action: () => ({
          outcomeText: 'Buffett smiled warmly: "Rule No. 1 is never lose money. Rule No. 2 is never forget Rule No. 1. Invest in what you understand." You felt your financial intelligence double on the spot!',
          happinessChange: 25,
          smartsChange: 15,
          fameChange: 15,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Treat Warren Buffett to his breakfast ($18)',
        action: () => ({
          outcomeText: 'Warren chuckled: "Nobody has ever bought me breakfast before!" He gifted you a signed share certificate of Berkshire Hathaway stock worth $15,000!',
          happinessChange: 30,
          moneyChange: 15000,
          karmaChange: 15,
          celebrityInteraction: true,
        }),
      },
    ],
  },
  {
    id: 'royal_jubilee_balcony',
    title: 'Palace Balcony Appearance',
    prompt: 'On a historic national holiday, 200,000 flag-waving citizens gather outside the palace gates chanting for the sovereign to appear on the balcony!',
    icon: '👑',
    minAge: 18,
    maxAge: 95,
    condition: (char) => !!char.royalty,
    options: [
      {
        text: 'Step onto the balcony in full royal regalia and wave',
        action: (char) => {
          if (char.royalty) {
            char.royalty.respect = Math.min(100, char.royalty.respect + 15);
          }
          return {
            outcomeText: 'The roar of the crowd was deafening! RAF jets flew overhead in red, white, and blue smoke trails. Royal respect surged to record highs!',
            happinessChange: 35,
            fameChange: 25,
          };
        },
      },
      {
        text: 'Deliver an unscripted heartfelt speech into the microphone',
        action: (char) => {
          if (char.royalty) {
            char.royalty.respect = Math.min(100, char.royalty.respect + 20);
          }
          return {
            outcomeText: 'Your voice echoed across the square. People were moved to tears by your humility and dedication. Pundits proclaimed you the People’s Monarch!',
            happinessChange: 35,
            fameChange: 30,
            karmaChange: 15,
          };
        },
      },
    ],
  },
  {
    id: 'oval_office_press_grilling',
    title: 'West Wing Press Briefing',
    prompt: 'White House press correspondents aggressively grill you about your latest federal budget allocations and space exploration spending!',
    icon: '🎙️',
    minAge: 35,
    maxAge: 90,
    condition: (char) => char.politicalOffice?.level === 'President',
    options: [
      {
        text: 'Counter with razor-sharp data and macroeconomic statistics',
        action: (char) => {
          const success = char.smarts > 55;
          if (char.politicalOffice) {
            char.politicalOffice.approvalRating = Math.min(100, char.politicalOffice.approvalRating + (success ? 12 : -5));
          }
          return {
            outcomeText: success
              ? 'You dissected every budget question with effortless mastery. The reporters conceded the point and cable news praised your commanding intellect!'
              : 'You mixed up two fiscal acronyms. Late-night television comedy shows roasted the mistake, but you survived the press conference.',
            happinessChange: success ? 20 : -5,
            smartsChange: 5,
          };
        },
      },
      {
        text: 'Crack a disarming, self-deprecating joke',
        action: (char) => {
          if (char.politicalOffice) {
            char.politicalOffice.approvalRating = Math.min(100, char.politicalOffice.approvalRating + 8);
          }
          return {
            outcomeText: 'The entire press briefing room erupted into hearty laughter! The headline read: "Commander-in-Chief Wins Over Press with Wit and Charm."',
            happinessChange: 20,
            fameChange: 10,
          };
        },
      },
    ],
  },
  // KENDAMA, SWEETS, KROM, YUNTROVE & NAKO EVENTS
  {
    id: 'nako_championship_encounter',
    title: 'North American Kendama Open (NAKO)',
    prompt: 'While walking through Minneapolis, Minnesota, you stumble upon the electric North American Kendama Open (NAKO) hosted by Sweets Kendamas! Founder Matt "Sweets" Jorgensen is standing on stage hype-checking a crowd of slingers!',
    icon: '🎯',
    minAge: 8,
    maxAge: 75,
    options: [
      {
        text: 'Walk up to Matt "Sweets" Jorgensen and show him your cleanest trick',
        action: (char) => {
          const success = (char.kendamaSkill || 0) >= 20 || Math.random() < 0.6;
          if (success) {
            char.kendamaSkill = Math.min(100, (char.kendamaSkill || 0) + 12);
            char.celebrityInteractions = (char.celebrityInteractions || 0) + 1;
            return {
              outcomeText: 'You grabbed a Sweets Cushion Clear dama and laced an around-the-world to bird stall! Matt Jorgensen went wild: "LET\'S GOOO! Absolute heat!" He handed you a signed Sweets sticker pack and high-fived you!',
              happinessChange: 35,
              fameChange: 15,
              smartsChange: 5,
            };
          } else {
            return {
              outcomeText: 'You dropped the tama on the spike attempt, but Matt smiled and gave you pointers: "Bend those knees and watch the tracking bevel!" You felt deeply motivated.',
              happinessChange: 15,
              smartsChange: 4,
            };
          }
        },
      },
      {
        text: 'Browse the Sweets, KROM, and Yuntrove vendor booths',
        action: () => ({
          outcomeText: 'You tested out the newest KROM LOL Clear models and Yuntrove exotic wood craft balance damas. The community vibe was pure joy and friendship.',
          happinessChange: 25,
          smartsChange: 3,
        }),
      },
      {
        text: 'Enter the beginner speed ladder tournament on the spot',
        action: (char) => {
          const won = (char.kendamaSkill || 0) > 30 || Math.random() < 0.45;
          if (won) {
            char.kendamaSkill = Math.min(100, (char.kendamaSkill || 0) + 15);
            char.nakoTitlesWon = (char.nakoTitlesWon || 0) + 1;
            return {
              outcomeText: 'You blitzed through the ladder without dropping a single trick! You won a NAKO medal and a cash prize envelope on stage!',
              happinessChange: 40,
              moneyChange: 500,
              fameChange: 20,
            };
          } else {
            return {
              outcomeText: 'You made it to the semi-finals before missing a tricky base cup stall. The crowd gave you a warm round of applause!',
              happinessChange: 15,
              smartsChange: 5,
            };
          }
        },
      },
    ],
  },
  {
    id: 'kendama_jam_street',
    title: 'Street Kendama Jam',
    prompt: 'You see a crew of street players jamming with colorful Sweets Radar and KROM Pop kendamas outside a coffee shop. One player invites you to lace a trick.',
    icon: '🪀',
    minAge: 7,
    maxAge: 70,
    options: [
      {
        text: 'Grab the dama and attempt a whirlwind spin trick',
        action: (char) => {
          char.kendamaSkill = Math.min(100, (char.kendamaSkill || 0) + 8);
          return {
            outcomeText: 'You popped the tama, spun the ken mid-air, and spiked it clean! The whole crew erupted in hype shouts: "DAMAAAA LOVE!"',
            happinessChange: 25,
            smartsChange: 4,
          };
        },
      },
      {
        text: 'Ask about the difference between Sweets Cushion Clear and KROM LOL Clear',
        action: () => ({
          outcomeText: 'The players gave you a passionate 20-minute breakdown on paint tackiness, durability, and grip for lunar balance tricks. You learned a ton!',
          happinessChange: 15,
          smartsChange: 8,
        }),
      },
      {
        text: 'Offer to trade your kendama for a limited Yuntrove craft',
        action: () => ({
          outcomeText: 'You completed a friendly dama swap and got your hands on a sleek Yuntrove bamboo hybrid ken with laser markings.',
          happinessChange: 20,
        }),
      },
    ],
  },
  {
    id: 'kindergarten_show_and_tell',
    title: 'Show and Tell Drama',
    prompt: 'It is show-and-tell day in class! A classmate brought a live garden toad that suddenly leaps out of its jar onto your head!',
    icon: '🐸',
    minAge: 4,
    maxAge: 7,
    options: [
      {
        text: 'Giggle and balance the toad on your nose',
        action: () => ({
          outcomeText: 'The entire kindergarten erupted in laughter! Even the teacher chuckled. You became an instant classroom hero!',
          happinessChange: 25,
          fameChange: 5,
        }),
      },
      {
        text: 'Scream at the top of your lungs and run around in circles',
        action: () => ({
          outcomeText: 'You sprinted into the cubbies, knocking over twenty lunchboxes. The teacher had to call the nurse to calm you down.',
          happinessChange: -10,
        }),
      },
      {
        text: 'Catch the toad gently and set it outside by the flowers',
        action: () => ({
          outcomeText: 'You escorted Mr. Toad to safety in the school courtyard. The teacher gave you a gold star for environmental stewardship.',
          happinessChange: 15,
          karmaChange: 10,
          smartsChange: 4,
        }),
      },
    ],
  },
  {
    id: 'lemonade_stand_empire',
    title: 'Lemonade Stand Hustle',
    prompt: 'On a scorching summer afternoon, you set up a homemade lemonade stand on your sidewalk. A neighborhood officer pulls up in a squad car!',
    icon: '🍋',
    minAge: 7,
    maxAge: 12,
    options: [
      {
        text: 'Offer the officer an ice-cold cup on the house',
        action: (char) => ({
          outcomeText: `The officer smiled, drank the whole cup, and handed you a ${char.currencySymbol}20 tip! "Best lemonade in the precinct, kid!"`,
          happinessChange: 25,
          moneyChange: 20,
          karmaChange: 10,
        }),
      },
      {
        text: 'Charge surge pricing: $5 a glass because of the heatwave',
        action: (char) => ({
          outcomeText: `The neighbors grumbled about price gouging, but thirsty people still bought 15 cups! You made ${char.currencySymbol}75!`,
          happinessChange: 20,
          moneyChange: 75,
          karmaChange: -5,
          smartsChange: 4,
        }),
      },
      {
        text: 'Add fresh strawberries and mint to create an artisan brand',
        action: (char) => ({
          outcomeText: `A local food blogger stopped by and posted about your gourmet stand! You made ${char.currencySymbol}120!`,
          happinessChange: 30,
          moneyChange: 120,
          smartsChange: 6,
          fameChange: 8,
        }),
      },
    ],
  },
  {
    id: 'high_school_talent_show',
    title: 'High School Talent Show',
    prompt: 'The annual school talent show is tonight and the auditorium is completely packed! Your name is called over the loudspeaker!',
    icon: '🎤',
    minAge: 14,
    maxAge: 18,
    options: [
      {
        text: 'Perform an electric rock guitar solo with an aerial kick',
        action: (char) => {
          const success = char.smarts + char.looks > 100 || Math.random() > 0.4;
          if (success) {
            return {
              outcomeText: 'You shredded like Jimi Hendrix! The auditorium exploded into a standing ovation and you won 1st Place Trophy!',
              happinessChange: 35,
              fameChange: 20,
              looksChange: 5,
            };
          } else {
            return {
              outcomeText: 'Your guitar cable unplugged mid-verse and you accidentally tripped over the monitor speaker!',
              happinessChange: -12,
              fameChange: 5,
            };
          }
        },
      },
      {
        text: 'Do a deadpan stand-up comedy roast of the vice principal',
        action: () => ({
          outcomeText: 'The students went wild with laughter, but the administration gave you three days of lunch detention. Totally worth it.',
          happinessChange: 25,
          fameChange: 15,
          karmaChange: -5,
        }),
      },
      {
        text: 'Stage freeze and back away quietly into the curtain wings',
        action: () => ({
          outcomeText: 'Stage fright got the best of you. You watched the rest of the show from the backstage green room sipping fruit punch.',
          happinessChange: -8,
        }),
      },
    ],
  },
  {
    id: 'dorm_room_fire_alarm',
    title: 'Late Night Fire Alarm',
    prompt: 'At 2:45 AM, your college dorm fire alarm starts blaring at 110 decibels! Everyone rushes outside in bathrobes into the chilly drizzle.',
    icon: '🚨',
    minAge: 18,
    maxAge: 24,
    options: [
      {
        text: 'Order 10 boxes of late-night pizza for everyone shivering outside',
        action: (char) => ({
          outcomeText: `You became an instant campus legend! 50 students chanted your name in the rain!`,
          happinessChange: 35,
          moneyChange: -120,
          karmaChange: 25,
          fameChange: 12,
        }),
      },
      {
        text: 'Investigate who burnt the 2 AM microwave popcorn',
        action: () => ({
          outcomeText: 'You tracked down the culprit on floor 3. It was a physics major who forgot popcorn needs to spin.',
          happinessChange: 15,
          smartsChange: 4,
        }),
      },
      {
        text: 'Wrap yourself like a burrito in your comforter and fall asleep on a bench',
        action: () => ({
          outcomeText: 'You caught 40 winks on a concrete bench. Uncomfortable, but peaceful.',
          happinessChange: 5,
        }),
      },
    ],
  },
  {
    id: 'office_coffee_machine_explosion',
    title: 'Breakroom Espresso Disaster',
    prompt: 'At the office, you attempted to brew an extra-strong double espresso. The high-pressure steam valve suddenly hissed and sprayed dark roast coffee everywhere!',
    icon: '☕',
    minAge: 22,
    maxAge: 65,
    options: [
      {
        text: 'Heroically dive to hit the main emergency power cutoff',
        action: () => ({
          outcomeText: 'You sliced the power just before the boiler burst! Coworkers applauded your lightning reflexes under pressure!',
          happinessChange: 20,
          smartsChange: 5,
          karmaChange: 10,
        }),
      },
      {
        text: 'Blame the disaster on an imaginary intern named "Eugene"',
        action: () => ({
          outcomeText: 'Management spent three weeks searching the HR payroll database for "Eugene". You dodged the cleanup duties.',
          happinessChange: 10,
          karmaChange: -10,
        }),
      },
      {
        text: 'Roll up your sleeves and wipe down every wall with paper towels',
        action: () => ({
          outcomeText: 'You cleaned the entire breakroom spotless. Your boss noticed your integrity and offered you praise.',
          happinessChange: 15,
          karmaChange: 15,
        }),
      },
    ],
  },
  {
    id: 'antique_painting_thrift_find',
    title: 'Thrift Store Masterpiece',
    prompt: 'While browsing a dusty thrift store, you spot an oil painting in an ornate gilded frame for only $40. There is a faded 18th-century signature in the bottom corner.',
    icon: '🖼️',
    minAge: 20,
    maxAge: 85,
    options: [
      {
        text: 'Buy it immediately and take it to an antique appraiser',
        action: (char) => {
          const authentic = Math.random() > 0.45;
          if (authentic) {
            const valuation = randomInt(15000, 85000);
            return {
              outcomeText: `UNBELIEVABLE! The appraiser gasped: "This is a lost Dutch Golden Age original!" You sold it at auction for ${char.currencySymbol}${valuation.toLocaleString()}!`,
              happinessChange: 45,
              moneyChange: valuation,
              smartsChange: 8,
              fameChange: 15,
            };
          } else {
            return {
              outcomeText: 'The appraiser revealed it was a cheap 1970s print painted over plywood. Still looks nice in your hallway!',
              happinessChange: 5,
              moneyChange: -40,
            };
          }
        },
      },
      {
        text: 'Hang it in your bathroom without checking its value',
        action: () => ({
          outcomeText: 'Guests frequently compliment your sophisticated bathroom art choices. A classy touch.',
          happinessChange: 12,
        }),
      },
      {
        text: 'Leave it on the shelf for someone else to discover',
        action: () => ({
          outcomeText: 'You left the dusty painting where it was. You kept your 40 bucks.',
          happinessChange: 2,
        }),
      },
    ],
  },
  // KENDAMA, SWEETS, KROM, YUNTROVE & NAKO CELEBRITY EVENTS
  {
    id: 'nako_meet_matt_jorgensen',
    title: 'NAKO: Meeting Matt "Sweets" Jorgensen',
    prompt: 'At the North American Kendama Open (NAKO), you spot legendary Sweets Kendamas founder Matt "Sweets" Jorgensen hanging out by the mainstage surrounded by hype players!',
    icon: '🎯',
    minAge: 10,
    maxAge: 75,
    options: [
      {
        text: 'Walk up, bust out your kendama, and lace a clean 1-turn lunar flip',
        action: (char) => {
          const success = Math.random() > 0.35;
          if (success) {
            return {
              outcomeText: 'Matt Jorgensen yelled "LETS GOOOOO! That was SO clean!" He slapped a Team Sweets sticker on your kendama and gave you a signed pro model!',
              happinessChange: 40,
              smartsChange: 5,
              fameChange: 20,
              karmaChange: 10,
              celebrityInteraction: true,
            };
          } else {
            return {
              outcomeText: 'You missed the spike and dropped the tama. Matt smiled warmly and handed you high fives: "Keep shredding dude, NAKO is about having fun!"',
              happinessChange: 15,
              karmaChange: 5,
              celebrityInteraction: true,
            };
          }
        },
      },
      {
        text: 'Ask Matt about founding Sweets Kendamas and his clear coat secrets',
        action: () => ({
          outcomeText: 'Matt generously spent twenty minutes sharing how he started Sweets in Minneapolis, preaching the kendama lifestyle and community mindset.',
          happinessChange: 30,
          smartsChange: 10,
          karmaChange: 10,
          celebrityInteraction: true,
        }),
      },
      {
        text: 'Challenge Matt to an impromptu high-stakes game of KEN',
        action: (char) => {
          const victory = Math.random() > 0.6;
          if (victory) {
            return {
              outcomeText: 'Against all odds, you hit a clutch bird-to-over-the-valley! The crowd erupted! Matt handed you a special gold-seal trophy!',
              happinessChange: 50,
              moneyChange: 1500,
              fameChange: 35,
              celebrityInteraction: true,
            };
          } else {
            return {
              outcomeText: 'Matt took you to K-E-N with an effortless inward lunar rover spike. You learned legendary techniques from the master himself.',
              happinessChange: 20,
              smartsChange: 8,
              celebrityInteraction: true,
            };
          }
        },
      },
    ],
  },
  {
    id: 'krom_kendama_street_jam',
    title: 'KROM Kendama Street Battle',
    prompt: 'While walking through downtown, you come across a vibrant pop-up street jam hosted by KROM Kendama with Danish pros pulling off wild freestyle lines!',
    icon: '🪀',
    minAge: 8,
    maxAge: 65,
    options: [
      {
        text: 'Enter the 1-on-1 freestyle circle with your best tricks',
        action: () => {
          const win = Math.random() > 0.4;
          if (win) {
            return {
              outcomeText: 'You strung together slingers, juggle-to-lighthouse, and a crisp trade spike! You won a limited-edition KROM Slaydog!',
              happinessChange: 35,
              fameChange: 15,
              smartsChange: 5,
            };
          } else {
            return {
              outcomeText: 'You jammed hard and soaked in the incredible European trick theory. Your balance improved noticeably.',
              happinessChange: 20,
              smartsChange: 4,
            };
          }
        },
      },
      {
        text: 'Buy an exclusive KROM Pop fresh off the display rack',
        action: () => ({
          outcomeText: 'You picked up a fresh rubber-paint KROM kendama with flawless tracking. The tactile feel is sheer perfection.',
          happinessChange: 25,
          moneyChange: -45,
        }),
      },
      {
        text: 'Spectate and cheer on the competitors while eating sweets',
        action: () => ({
          outcomeText: 'You munched on sweet candies and filmed viral trick clips that got thousands of views on TikTok.',
          happinessChange: 20,
          fameChange: 5,
        }),
      },
    ],
  },
  {
    id: 'yuntrove_balance_mod_discovery',
    title: 'Rare Yuntrove Craft Discovery',
    prompt: 'A master boutique kendama lathe artisan unveils an ultra-rare Purpleheart and Damascus Wood Yuntrove Balance Mod in a velvet collector case.',
    icon: '🪵',
    minAge: 12,
    maxAge: 80,
    options: [
      {
        text: 'Offer $350 cash on the spot to add it to your collection',
        action: (char) => {
          if (char.money >= 350) {
            return {
              outcomeText: 'The artisan agreed! You now own an iconic Yuntrove masterpiece with laser-balanced lunar stall cups and velvet bag!',
              happinessChange: 40,
              moneyChange: -350,
              smartsChange: 5,
            };
          } else {
            return {
              outcomeText: 'You counted your pockets and realized you didn\'t have enough cash. The artisan let you take a commemorative sticker instead.',
              happinessChange: 5,
            };
          }
        },
      },
      {
        text: 'Test play the Yuntrove prototype on the store mat',
        action: () => ({
          outcomeText: 'The balance points felt utterly magical! Lunar stalls held effortlessly without a wobble.',
          happinessChange: 25,
          smartsChange: 8,
        }),
      },
      {
        text: 'Politely admire the craftsmanship and move on',
        action: () => ({
          outcomeText: 'You admired the exotic grain lines of the Yuntrove wood. True art.',
          happinessChange: 8,
        }),
      },
    ],
  },
  {
    id: 'artisan_sweets_candy_shop',
    title: 'Gourmet Sweets Bonanza',
    prompt: 'You step into an internationally renowned handmade confection and sweets shop featuring sugar sculptures, matcha truffles, and gourmet honeycomb.',
    icon: '🍬',
    minAge: 4,
    maxAge: 90,
    options: [
      {
        text: 'Sample every single luxury sweet in the display counter',
        action: () => ({
          outcomeText: 'Pure sugar bliss! Your tastebuds ascended to heaven, though your dentist might object.',
          happinessChange: 30,
          healthChange: -2,
        }),
      },
      {
        text: 'Purchase an assortment gift box for your family and friends',
        action: (char) => ({
          outcomeText: 'Your loved ones were thrilled with the sweet treats! You shared smiles and delicious chocolates together.',
          happinessChange: 35,
          moneyChange: -40,
          karmaChange: 15,
        }),
      },
      {
        text: 'Ask the confectioner how they pull hot hard candy by hand',
        action: () => ({
          outcomeText: 'The candy master taught you the science of sugar crystallisation temperatures. Fascinating stuff!',
          happinessChange: 15,
          smartsChange: 8,
        }),
      },
    ],
  },
  // RECAPTCHA RANDOM EVENTS
  {
    id: 'recaptcha_security_checkpoint',
    title: 'Sudden reCAPTCHA Inspection',
    prompt: 'While accessing your central bank account, a flashing cyber security gate opens: "SECURITY ALERT: Confirm you are a human operator via reCAPTCHA checkpoint!"',
    icon: '🛡️',
    minAge: 16,
    maxAge: 95,
    options: [
      {
        text: 'Identify all squares with traffic lights with laser precision',
        action: () => ({
          outcomeText: 'Verification Passed! Your bank commended your flawless human reflexes and rewarded you with a 5% high-yield interest bonus.',
          happinessChange: 25,
          moneyChange: 250,
          smartsChange: 5,
          karmaChange: 5,
        }),
      },
      {
        text: 'Stare at the fire hydrant puzzle wondering if the pole counts as a hydrant',
        action: () => ({
          outcomeText: 'After an agonizing 45 seconds of existential debate over pixels, you clicked Verify. "Success: You are human." Phew.',
          happinessChange: 10,
          smartsChange: 6,
        }),
      },
      {
        text: 'Click the audio reCAPTCHA button and listen to the mysterious robotic voice',
        action: () => ({
          outcomeText: 'A deep metallic voice read out digits. You typed them in correctly and unlocked the secret cyber security vault!',
          happinessChange: 20,
          smartsChange: 10,
        }),
      },
    ],
  },
  {
    id: 'ai_simulation_glitch_test',
    title: 'The Humanity Questioning',
    prompt: 'A quirky pedestrian on the street stops you wearing aluminum foil: "Quick! Prove to me you are not an AI chatbot generated in a digital life simulation!"',
    icon: '🤖',
    minAge: 12,
    maxAge: 90,
    options: [
      {
        text: 'Pull out your phone, show them a reCAPTCHA green checkmark, and say "BEEP BOOP"',
        action: () => ({
          outcomeText: 'They shrieked in bewilderment and dropped a twenty-dollar bill on the sidewalk while fleeing! Hilarious.',
          happinessChange: 35,
          moneyChange: 20,
          karmaChange: 5,
        }),
      },
      {
        text: 'Perform an intricate kendama combo to prove your physical hand-eye dexterity',
        action: () => ({
          outcomeText: 'You spiked a whirlwind on your Sweets kendama! The pedestrian gasped: "No artificial intelligence has that much steeze! You\'re real!"',
          happinessChange: 30,
          smartsChange: 6,
          fameChange: 10,
        }),
      },
      {
        text: 'Politely reassure them that you are a flesh-and-blood human with feelings',
        action: () => ({
          outcomeText: 'You had a wholesome conversation about the philosophical nature of consciousness and digital worlds.',
          happinessChange: 20,
          karmaChange: 10,
        }),
      },
    ],
  },
];


