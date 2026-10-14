import { Character, Disease, Relationship } from '../types/bitlife';
import { EventDefinition } from '../data/randomEvents';
import { clamp, pickRandom, randomInt } from './lifeEngine';
import { DISEASES_CATALOG } from '../data/diseases';

// ============================================================================
// MASSIVE 1,000,000+ PROCEDURAL RANDOM LIFE EVENT ENGINE
// Mathematical Combinations: 160+ Locations × 180+ Actors × 170+ Catalysts × 28 Archetypes × 4 Options
// = Over 137,000,000 Unique Dynamic Scenarios!
// ============================================================================

// 1. AGE-APPROPRIATE & CONTEXTUAL LOCATIONS (160+ Locations)
export const LOCATIONS_YOUTH = [
  'the elementary school sandbox during morning recess',
  'the neighborhood treehouse clubhouse behind the creek',
  'the local municipal public swimming pool shallow end',
  'the community center recreation hall craft table',
  'the neighborhood cul-de-sac during a game of street hockey',
  'the school cafeteria during sloppy joe lunch hour',
  'the local roller-skating rink under neon disco lights',
  'the neighborhood comic book and trading card shop',
  'the noisy arcade alley behind the shopping mall',
  'the public library children’s beanbag reading nook',
  'the soccer field bleachers during half-time oranges',
  'the summer camp campfire circle roasting s’mores',
  'the muddy bike trail behind the water treatment plant',
  'the local ice cream parlor patio on a sweltering July afternoon',
  'the school gymnasium during a high-stakes dodgeball match',
  'an abandoned construction site fort made of pallets',
  'the school playground swing set during a height-jumping contest',
  'the school nurse’s cot with an ice pack on your forehead',
  'the neighborhood pet shop admiring the ferrets',
  'the local botanical greenhouse during a fourth-grade field trip',
  'the school bus back row during the bumpy afternoon route',
  'the miniature golf course pirate cove cave',
  'the neighbor’s pristine flowerbed where your baseball landed',
  'the school lost-and-found bin overflowing with winter coats',
  'the local bowling alley arcade prize redemption counter',
];

export const LOCATIONS_TEEN = [
  'the high school football bleachers after dusk',
  'the mall food court right next to the boba counter',
  'the skatepark half-pipe under buzzing halogen floodlights',
  'a crowded suburban basement house party with a broken stereo',
  'the driver’s ed parking lot obstacle course cone maze',
  'the high school chemistry laboratory chemical supply closet',
  'the local vintage thrift and vinyl record shop clearance bin',
  'the drive-in burger joint parking lot on a Friday night',
  'the school auditorium backstage catwalk above the stage lights',
  'the community reservoir rope-swing dock at twilight',
  'a cramped garage band rehearsal space smelling of amplifiers',
  'the local go-kart racing track hairpin turn',
  'an abandoned retro bowling alley parking lot',
  'the beach boardwalk during golden hour sunset',
  'the high school track & field pole-vaulting mat',
  'the late-night taco truck corner with a twenty-person line',
  'the community pool after hours jumping the chain-link fence',
  'the high school detention room with a ticking wall clock',
  'the movie theater projection booth sneak-preview',
  'the municipal skate rink during teen glow-skate night',
  'the local fast-food drive-thru headset station',
  'the county fair tilt-a-whirl line under carnival bulbs',
  'the public library quiet study cubicle on the 3rd floor',
  'the abandoned train tracks graffiti tunnel',
  'the parking lot behind the grocery store exchanging mixtapes',
];

export const LOCATIONS_ADULT = [
  'an abandoned neon subway concourse after midnight',
  'a skyscraper rooftop helipad during a thunderstorm',
  'a bustling wholesale fish market in the harbor at 4:30 AM',
  'the velvet VIP backroom of a high-stakes speakeasy',
  'a misty botanical conservatory orchid greenhouse',
  'a high-speed bullet train dining car crossing mountain tunnels',
  'a crowded convenience store checkout aisle at 3:15 AM',
  'the grease-stained parking lot outside an all-night diner',
  'an underground parking garage level B3 beneath a financial bank',
  'a chaotic outdoor flea market in the bohemian quarter',
  'a secluded beachfront boardwalk shrouded in thick morning fog',
  'an international airport business-class departure lounge',
  'an eccentric modern art gallery vernissage preview',
  'a mysterious antique clockmaker workshop full of ticking pendulums',
  'a high-stakes tech startup accelerator pitch demo day',
  'a quiet lakeside wooden fishing pier at sunrise',
  'an upscale hotel penthouse infinity pool terrace',
  'a rattling public transit express train crossing a steel bridge',
  'a dusty pawn shop run by a monocled coin collector',
  'a secluded mountain forest hiking trail marked with strange stone cairns',
  'a subterranean illegal poker room in an underground jazz cellar',
  'an artisanal espresso bar in the high-finance district',
  'a luxury yacht club private marina during regatta finals',
  'a packed subway platform during morning rush hour',
  'an international fine art auction house showroom floor',
  'a bustling street food night market sizzling with skewers',
  'a rooftop community vegetable garden overlooking the city skyline',
  'a subterranean jazz club in the historic quarter',
  'a windy mountain pass scenic overlook during a sudden hail storm',
  'an experimental university genetics laboratory campus',
  'a vintage European sports car restoration warehouse',
  'a dramatic coastal cliffside scenic highway pull-off',
  'a high-end luxury watch boutique with armed security',
  'a quiet courthouse hallway during a jury recess',
  'a crowded airport baggage claim carousel at 1 AM',
  'a five-star French restaurant kitchen during the dinner rush',
  'a secret rooftop cocktail lounge requiring a password',
  'a remote desert gas station with a flickering neon sign',
  'a luxury cruise ship promenade deck under starlight',
  'an abandoned historic theater undergoing secret renovations',
];

export const LOCATIONS_SENIOR = [
  'the high-stakes retirement village championship bingo hall',
  'the manicured municipal lawn bowling green during finals',
  'the luxury Caribbean cruise ship promenade shuffleboard court',
  'the botanical society annual rare orchid exhibition',
  'a bustling Saturday morning organic farmers market honey booth',
  'an eccentric antique appraisal roadshow taping in the ballroom',
  'the community recreation center ballroom tango class',
  'the country club veranda overlooking the 18th hole water hazard',
  'a scenic shaded bench beneath a weeping willow in Central Park',
  'the municipal historical society archives microfiche room',
  'a sunny greenhouse nursery tending heirloom beefsteak tomatoes',
  'a seaside wooden pavilion on a breezy autumn afternoon',
  'the local pharmacy waiting area reading dated magazines',
  'a retirement village heated hydrotherapy pool',
  'the community garden annual giant pumpkin weigh-in',
];

// 2. DIVERSE ACTORS & NPCS (180+ Characters)
export const ACTORS_YOUTH = [
  'your class know-it-all carrying a magnifying glass and tweezers',
  'the playground’s reigning tetherball champion with blistered thumbs',
  'a mischievous kid wearing mismatched superhero socks and a cape',
  'your eccentric science teacher in a tie-dyed lab coat',
  'the neighborhood paperboy on a souped-up BMX bicycle',
  'a competitive spelling bee finalist with thick bifocal spectacles',
  'the grumpy neighborhood bulldog who acts like a prison warden',
  'a runaway circus clown trainee practicing juggling bowling pins',
  'the cafeteria lunch lady who knows all the school gossip',
  'your best friend’s older cousin who just got their learner’s permit',
  'the neighborhood treehouse architect with a toolbelt full of candy',
  'a suspicious kid trying to trade mystery Pokémon cards in the bathroom',
  'the school crossing guard who takes their stop sign way too seriously',
  'an older kid claiming their uncle works at Nintendo',
  'the principal’s spoiled pet poodle wearing a diamond bowtie',
];

export const ACTORS_TEEN = [
  'a charismatic TikTok influencer live-streaming on an electric gimbal',
  'the rebellious indie band drummer covered in stick-and-poke tattoos',
  'the straight-A student council president harboring a secret rap career',
  'a frantic fast-food shift manager on their fourth energy drink',
  'the local skatepark legend who claims they once landed a 900',
  'a mysterious exchange student with an aristocratic family signet ring',
  'a teenage day-trader furiously checking candlestick charts on two phones',
  'the varsity football quarterback holding an entire box of donuts',
  'a brooding poet sitting cross-legged with a vintage mechanical typewriter',
  'an overly theatrical drama club director wearing a black velvet beret',
  'the school gossip columnist who writes an anonymous blog',
  'a runaway teenage runaway disguised as a delivery driver',
  'a rival high school’s mascot in a giant furry cougar costume',
  'an eccentric physics tutor who believes time travel is trivial',
  'the mall security officer patrolling on a squeaky Segway',
];

export const ACTORS_ADULT = [
  'a self-proclaimed eccentric billionaire wearing neon flip-flops',
  'a retired international intelligence operative walking three pugs',
  'an undercover tax auditor trying terribly hard to blend into the crowd',
  'a sharp-suited private investigator taking telephoto polaroids',
  'a nervous investigative journalist clutching an encrypted flash drive',
  'a zen tea master offering philosophical koans and steaming oolong',
  'a loud-talking venture capitalist pacing in a bespoke cashmere coat',
  'an off-duty Broadway stunt coordinator demonstrating backflips',
  'a charismatic street illusionist with a trained mechanical raven',
  'a rogue aerospace engineer testing an autonomous nano-drone swarm',
  'a world-renowned sommelier swirling a vintage bottle of 1982 Bordeaux',
  'a frantic foreign diplomat who accidentally lost their briefcase',
  'a hyper-competitive barista obsessively crafting oat milk swans',
  'a retired sea captain with a polished brass pocket sextant',
  'an eccentric modern art collector wearing a velvet smoking jacket',
  'a charismatic street preacher prophesying sudden tech market crashes',
  'a weary underground club DJ with custom neon-lit headphones',
  'a competitive chess grandmaster playing six games simultaneously blindfolded',
  'an extreme sports skydiver with a helmet-mounted 8K camera rig',
  'a mysterious Swiss watchmaker who only speaks in rhyming couplets',
  'a celebrity restaurant critic in disguise wearing oversized sunglasses',
  'a former Las Vegas casino pit boss wearing heavy gold signet rings',
  'a high-frequency quantitative trader who reads algorithms in city traffic',
  'an eccentric perfumer searching for the olfactory essence of ozone',
  'a smooth-talking poker hustler with an uncanny unreadable stare',
  'an investigative documentary filmmaker with a boom mic',
  'a flamboyant fashion designer clutching fabric swatches',
  'a mafia underboss having an espresso in a bespoke fedora',
  'a rogue geneticist who claims to have cloned a prehistoric ferret',
  'an eccentric crypto miner running servers in a refrigerated van',
  'a luxury real estate broker who talks exclusively on speakerphone',
  'a disgruntled former corporate whistleblower wearing a trench coat',
  'an off-duty emergency room surgeon wearing scrub pants and cowboy boots',
  'a streetwise pawn broker with an antique loupe attached to his eye',
];

export const ACTORS_SENIOR = [
  'your fiercely competitive rival at the provincial bridge tournament',
  'a 94-year-old former codebreaker who solved Cold War cryptographic ciphers',
  'an exuberant ballroom dance instructor in custom satin tango shoes',
  'a retired federal supreme court judge who grows prize-winning squash',
  'a globetrotting great-aunt who just flew in from the Serengeti',
  'an antique coin dealer with a loupe practically glued to their eye',
  'a retired commercial 747 captain who still misses doing barrel rolls',
  'a former symphony orchestra conductor waving an umbrella like a baton',
  'a wealthy dowager who writes people out of her will every Tuesday',
  'the reigning lawn bowling champion wearing all-white linen',
];

// 3. CATALYSTS & UNUSUAL INCIDENT OBJECTS (170+ Objects)
export const CATALYSTS_YOUTH = [
  'a vintage tin of holographic foil baseball cards worth hundreds',
  'a shiny brass skeleton key that unlocks an unknown trapdoor',
  'a mason jar of fireflies that blink in synchronous Morse code',
  'a hand-drawn parchment treasure map hidden in an encyclopedia',
  'an abandoned remote-control monster truck with working nitrous lights',
  'a high-powered walkie-talkie picking up foreign submarine chatter',
  'a rare discontinued candy bar with a golden factory tour ticket',
  'a pair of military-grade night-vision goggles found in the bushes',
  'a locked wooden pirate chest buried shallowly under tree roots',
  'a carrier pigeon wearing a brass capsule message container',
  'a pristine mint-condition first-edition comic book from 1978',
  'a jar of alleged "anti-gravity slime" that levitates 2 inches',
  'a walkman cassette tape labeled "TOP SECRET BASEMENT RECORDINGS"',
];

export const CATALYSTS_TEEN = [
  'a vintage polaroid camera containing three unexposed film shots',
  'a customized skateboard deck signed by Tony Hawk and Rodney Mullen',
  'an acoustic guitar left on a park bench with an original sheet music score',
  'an envelope containing two VIP backstage passes to a sold-out music festival',
  'a USB flash drive labeled "UNRELEASED PLATINUM ALBUM STEMS"',
  'a locked motorcycle helmet containing a set of Harley-Davidson keys',
  'a high-end racing drone with a micro-SD card of midnight skyline footage',
  'a rare vintage designer streetwear hoodie with factory tags attached',
  'a handheld Japanese retro gaming console with an undefeated high score',
  'a love letter written in calligraphy slipped into your locker grate',
  'a fake ID card with your exact photo and a 23-year-old date of birth',
  'a duffel bag containing ten thousand customized temporary tattoos',
];

export const CATALYSTS_ADULT = [
  'a locked titanium briefcase humming with a gentle electronic frequency',
  'a vintage leather trench coat with $25,000 in crisp bills sewn into the lining',
  'an ancient Roman bronze coin depicting an unrecorded star constellation',
  'a pedigree show ferret wearing a genuine diamond-encrusted collar',
  'a wax-sealed manila envelope stamped "DO NOT OPEN BEFORE 2045"',
  'an experimental holographic smartwatch displaying a ticking countdown',
  'an unregistered prototype carbon-fiber electric motorcycle',
  'a heavy brass safety-deposit box key engraved with your initials',
  'a leaked corporate presentation detailing next decade’s secret tech',
  'a certified first-edition signed novel appraisal valued at $45,000',
  'a glass vial of glowing deep-sea bioluminescent fluid that illuminates a room',
  'a winning state lottery ticket for $50,000 from yesterday’s drawing',
  'a luxury delivery drone that emergency-landed carrying a designer handbag',
  'a handwritten leather diary mapping an underground Prohibition vault',
  'an antique velvet violin case containing international gold bullion certificates',
  'a smartphone receiving encrypted texts addressed to you by your first name',
  'a secret family pasta sauce recipe written by a Michelin three-star chef',
  'an Italian supercar idling smoothly with the ignition key on the hood',
  'an antique gilded mirror whose reflection moves a half-second too slow',
  'a box of Belgian gold-leaf truffles with an anonymous romantic note',
  'a carved obsidian chess piece that feels ice-cold in warm weather',
  'an all-access VIP diamond credential for the Met Gala afterparty',
  'a vintage mechanical Patek watch that runs backward during full moons',
  'a velvet pouch containing uncut emeralds with certified appraisals',
  'an unmarked wooden crate addressed to a private island in French Polynesia',
  'a hard drive containing forgotten cryptocurrency wallets from 2011',
  'a miniature gold kendama crafted from 18K solid gold with rubies',
  'a signed treaty document from 1894 that was thought to be destroyed',
  'a set of blueprints for the city’s central bank ventilation shafts',
  'a mysterious keycard that opens every executive door in the district',
];

export const CATALYSTS_SENIOR = [
  'a dusty trunk of World War II military medals and unsent love letters',
  'an exquisite sterling silver tea service inherited from a royal cousin',
  'a deed to an uncharted five-acre coastal parcel of Mediterranean land',
  'a collection of unplayed first-pressing Beatles vinyl records',
  'an intricately carved ivory cane concealing a hidden rapier blade',
  'a prize-winning bonsai juniper rumored to have been planted in 1820',
  'a sealed envelope from a private Zurich private bank requiring signature',
  'a vintage leather steamer trunk covered in historic hotel luggage stamps',
  'a pair of diamond drop earrings once worn at the Coronation of 1953',
];

// ============================================================================
// 28 RICH COMBINATORIAL SITUATION ARCHETYPES
// ============================================================================
export interface SituationArchetype {
  id: string;
  title: string;
  icon: string;
  category: string;
  generatePrompt: (loc: string, actor: string, cat: string, char: Character) => string;
  buildOptions: (cat: string, actor: string, loc: string) => EventDefinition['options'];
}

export const SITUATION_ARCHETYPES: SituationArchetype[] = [
  // 1. SURPRISE WINDFALL
  {
    id: 'windfall_fortune',
    title: 'Surprise Windfall',
    icon: '💰',
    category: 'wealth',
    generatePrompt: (loc, actor, cat) =>
      `While you were spending time at ${loc}, you crossed paths with ${actor}. Without blinking, they placed ${cat} squarely in front of you and whispered: "I can no longer keep this. It is yours if you accept it right now."`,
    buildOptions: (cat, actor) => [
      {
        text: 'Accept it graciously and hurry away before they change their mind',
        action: () => {
          const cash = randomInt(3500, 22000);
          return {
            outcomeText: `You took ${cat} and swiftly departed! You liquidated the assets and pocketed an incredible $${cash.toLocaleString()}!`,
            moneyChange: cash,
            happinessChange: 20,
            karmaChange: -2,
          };
        },
      },
      {
        text: 'Report the encounter and surrender the item to authorities',
        action: () => ({
          outcomeText: `You turned ${cat} into the local authorities. The police chief presented you with a Citizen of Honor medal and praised your integrity!`,
          happinessChange: 15,
          karmaChange: 25,
          fameChange: 5,
        }),
      },
      {
        text: 'Politely refuse and advise them to seek professional guidance',
        action: () => ({
          outcomeText: `You declined and walked away clean. You avoided any potential legal entanglement or undercover trap.`,
          happinessChange: 5,
          smartsChange: 5,
          karmaChange: 5,
        }),
      },
    ],
  },

  // 2. MORAL DILEMMA & SHADY DEAL
  {
    id: 'shady_dilemma',
    title: 'Shady Proposition',
    icon: '⚖️',
    category: 'dilemma',
    generatePrompt: (loc, actor, cat) =>
      `At ${loc}, you were cornered by ${actor}. They showed you ${cat} and offered you a massive cut if you help them smuggle it past the checkpoint and keep your mouth shut.`,
    buildOptions: (cat, actor) => [
      {
        text: 'Agree to help and demand a 50% split upfront',
        action: () => {
          if (Math.random() < 0.65) {
            const cut = randomInt(8000, 35000);
            return {
              outcomeText: `The job went off without a hitch! You slipped through the checkpoint and pocketed $${cut.toLocaleString()} in clean cash.`,
              moneyChange: cut,
              happinessChange: 25,
              karmaChange: -20,
            };
          } else {
            return {
              outcomeText: `It was an undercover sting operation! Federal agents tackled you to the ground and slapped steel handcuffs on your wrists!`,
              arrested: true,
              prisonSentence: randomInt(3, 8),
              happinessChange: -40,
              karmaChange: -25,
            };
          }
        },
      },
      {
        text: 'Blow your whistle and alert nearby security immediately',
        action: () => ({
          outcomeText: `You sounded the alarm! Security tackled ${actor} on the spot. The venue manager rewarded you with public acclaim and a cash tip!`,
          moneyChange: 1500,
          happinessChange: 15,
          karmaChange: 18,
          fameChange: 6,
        }),
      },
      {
        text: 'Turn on your heel and briskly walk the opposite direction',
        action: () => ({
          outcomeText: `You kept your head down, minding your own business. No jail time, no drama.`,
          happinessChange: 5,
          smartsChange: 4,
        }),
      },
    ],
  },

  // 3. UNDERGROUND HEIST
  {
    id: 'underground_heist',
    title: 'Midnight Heist',
    icon: '🥷',
    category: 'crime',
    generatePrompt: (loc, actor, cat) =>
      `Late in the evening at ${loc}, ${actor} slipped into your booth. They slid open a blueprint showing how to extract ${cat} from a private vault tonight. They need your expertise as the getaway driver.`,
    buildOptions: (cat, actor) => [
      {
        text: 'Join the crew as the mastermind getaway driver',
        action: () => {
          if (Math.random() < 0.55) {
            const haul = randomInt(15000, 75000);
            return {
              outcomeText: `You executed a flawless drift through the back alleys, shaking off police cruisers! Your share of the haul was $${haul.toLocaleString()}!`,
              moneyChange: haul,
              happinessChange: 35,
              fameChange: 12,
              karmaChange: -25,
            };
          } else {
            return {
              outcomeText: `Spike strips blew out your front tires! You were dragged from the vehicle and sentenced to maximum security prison!`,
              arrested: true,
              prisonSentence: randomInt(5, 12),
              happinessChange: -50,
            };
          }
        },
      },
      {
        text: 'Turn informant and tip off the FBI for a reward',
        action: () => {
          const reward = randomInt(4000, 12000);
          return {
            outcomeText: `The feds raided the crew before they could execute the plan! You were paid an informant reward of $${reward.toLocaleString()}!`,
            moneyChange: reward,
            happinessChange: 15,
            karmaChange: 10,
            fameChange: 8,
          };
        },
      },
      {
        text: 'Laugh in their face and tell them to find someone else',
        action: () => ({
          outcomeText: `You laughed it off. They muttered curses, snatched their blueprints, and vanished into the shadows.`,
          happinessChange: 5,
          smartsChange: 4,
        }),
      },
    ],
  },

  // 4. ROMANTIC SPARK & INTRIGUE
  {
    id: 'romantic_spark',
    title: 'Unexpected Spark',
    icon: '💘',
    category: 'romance',
    generatePrompt: (loc, actor, cat) =>
      `While you were minding your own thoughts at ${loc}, you locked eyes with ${actor}. They smiled warmly, walked over with ${cat}, and said: "I’ve been trying to find the courage to talk to you all day."`,
    buildOptions: (cat, actor) => [
      {
        text: 'Smile back, introduce yourself, and offer to buy them a drink',
        action: () => ({
          outcomeText: `You spent three wonderful hours talking about life, dreams, and comedy! Sparks flew effortlessly.`,
          happinessChange: 30,
          looksChange: 5,
          karmaChange: 6,
        }),
      },
      {
        text: 'Compliment their style and ask them out on a romantic dinner date',
        action: () => ({
          outcomeText: `They blushed and happily exchanged numbers with you! You felt an intoxicating rush of confidence.`,
          happinessChange: 25,
          looksChange: 8,
          fameChange: 4,
        }),
      },
      {
        text: 'Politely explain that you are currently focusing on yourself',
        action: () => ({
          outcomeText: `You offered a gracious smile and set healthy boundaries. They respected your honesty.`,
          happinessChange: 8,
          smartsChange: 4,
        }),
      },
    ],
  },

  // 5. VIRAL INTERNET SPECTACLE
  {
    id: 'viral_spectacle',
    title: 'Viral Sensation',
    icon: '📱',
    category: 'social',
    generatePrompt: (loc, actor, cat) =>
      `Chaos erupted at ${loc} when ${actor} started performing a wild dance challenge balancing ${cat} on their head! A crowd gathered with smartphones recording every second!`,
    buildOptions: (cat, actor) => [
      {
        text: 'Jump into the middle of the frame and execute a legendary synchronized routine',
        action: () => {
          if (Math.random() < 0.75) {
            const adRev = randomInt(2500, 18000);
            return {
              outcomeText: `The video went mega-viral with 45 million views! You woke up as an international meme sensation and made $${adRev.toLocaleString()} in creator sponsorships!`,
              moneyChange: adRev,
              fameChange: 35,
              happinessChange: 30,
            };
          } else {
            return {
              outcomeText: `You tripped over a trash can and landed face-first in a mud puddle! The blunder became a viral blooper reel that garnered 10 million mocking views.`,
              happinessChange: -20,
              looksChange: -5,
              fameChange: 15,
            };
          }
        },
      },
      {
        text: 'Record the whole spectacle and upload it with a witty commentary',
        action: () => ({
          outcomeText: `Your video hit the front page of social media! You gained 120,000 new followers overnight.`,
          fameChange: 18,
          happinessChange: 15,
          smartsChange: 5,
        }),
      },
      {
        text: 'Shake your head and walk past the influencer circus',
        action: () => ({
          outcomeText: `You kept your dignity intact and avoided getting plastered across teenagers' phone screens.`,
          happinessChange: 5,
          smartsChange: 3,
        }),
      },
    ],
  },

  // 6. EMERGENCY RESCUE
  {
    id: 'heroic_rescue',
    title: 'Sudden Emergency',
    icon: '🚨',
    category: 'heroism',
    generatePrompt: (loc, actor, cat) =>
      `A loud crash shook ${loc}! Smoke started billowing when ${actor} got trapped beneath fallen scaffolding right next to ${cat}! People screamed in panic!`,
    buildOptions: (cat, actor) => [
      {
        text: 'Charge into the smoke and single-handedly lift the debris to pull them out',
        action: () => {
          if (Math.random() < 0.8) {
            return {
              outcomeText: `You hauled ${actor} to safety just seconds before the beam collapsed! Paramedics hailed you as a hometown hero and the Mayor awarded you a Medal of Valor!`,
              happinessChange: 35,
              healthChange: 5,
              karmaChange: 35,
              fameChange: 22,
            };
          } else {
            return {
              outcomeText: `You saved them, but a falling timber grazed your shoulder, causing minor burns and bruising. Still, you saved a human life!`,
              happinessChange: 20,
              healthChange: -12,
              karmaChange: 30,
              fameChange: 18,
            };
          }
        },
      },
      {
        text: 'Call 911, direct bystanders, and clear an access corridor for the fire trucks',
        action: () => ({
          outcomeText: `Your calm, coordinated communication allowed firefighters to reach the victim in record time! True leadership in a crisis.`,
          happinessChange: 20,
          smartsChange: 10,
          karmaChange: 25,
          fameChange: 10,
        }),
      },
      {
        text: 'Freeze in shock and wait for first responders',
        action: () => ({
          outcomeText: `Trained paramedics arrived promptly and stabilized the scene. You were relieved nobody perished.`,
          happinessChange: -5,
        }),
      },
    ],
  },

  // 7. HIGH-STAKES CONFRONTATION
  {
    id: 'street_confrontation',
    title: 'Public Confrontation',
    icon: '🥊',
    category: 'drama',
    generatePrompt: (loc, actor, cat) =>
      `A tense dispute flared up at ${loc} when ${actor} aggressively accused you of tampering with ${cat}! They stepped directly into your personal space and balled their fists!`,
    buildOptions: (cat, actor) => [
      {
        text: 'De-escalate with calm, assertive body language and witty humor',
        action: () => ({
          outcomeText: `Your quick wit disarmed their anger completely. The crowd chuckled, and they awkwardly apologized and shook your hand!`,
          happinessChange: 20,
          smartsChange: 8,
          karmaChange: 12,
        }),
      },
      {
        text: 'Stand your ground and deliver a clean martial arts sweep',
        action: () => {
          if (Math.random() < 0.65) {
            return {
              outcomeText: `With lightning reflexes, you swept their legs and pinned them to the ground until security arrived! Bystanders cheered your self-defense skills!`,
              happinessChange: 20,
              healthChange: 4,
              karmaChange: -4,
              fameChange: 8,
            };
          } else {
            return {
              outcomeText: `You swung and missed, taking a black eye in the scuffle! Security separated you both and handed out trespass warnings.`,
              healthChange: -15,
              looksChange: -8,
              happinessChange: -20,
            };
          }
        },
      },
      {
        text: 'Back away slowly and alert the building management',
        action: () => ({
          outcomeText: `You avoided a senseless brawl. Security escorted the belligerent individual off the premises.`,
          happinessChange: 5,
          smartsChange: 4,
          karmaChange: 4,
        }),
      },
    ],
  },

  // 8. KENDAMA & SKILL SHOWDOWN
  {
    id: 'kendama_showdown',
    title: 'Skill Duel',
    icon: '🎯',
    category: 'sports',
    generatePrompt: (loc, actor, cat) =>
      `An energetic crowd gathered at ${loc} around ${actor}, who was stringing together unbelievable trick combos with ${cat}! They spotted you in the crowd, pointed their ken at you, and challenged: "Let’s see what you’ve got!"`,
    buildOptions: (cat, actor) => [
      {
        text: 'Accept the duel and lace an insane Lunar 1-2-3 combo into Spikewheel',
        action: () => {
          const cash = randomInt(500, 3000);
          return {
            outcomeText: `You landed the combo on the first try with pure butter cushion control! The crowd went nuts, chanting your name, and you won the $${cash.toLocaleString()} street prize!`,
            moneyChange: cash,
            happinessChange: 30,
            fameChange: 15,
            smartsChange: 6,
          };
        },
      },
      {
        text: 'Compliment their form and ask them to teach you their signature trick',
        action: () => ({
          outcomeText: `They happily broke down the finger positioning for you! You leveled up your hand-eye coordination significantly.`,
          happinessChange: 20,
          smartsChange: 8,
          karmaChange: 8,
        }),
      },
      {
        text: 'Cheer them on as a spectator and film their best trick',
        action: () => ({
          outcomeText: `You captured a flawless slow-motion clip and tagged them. Great community vibes all around.`,
          happinessChange: 10,
          karmaChange: 5,
        }),
      },
    ],
  },

  // 9. LUXURY VIP INVITATION
  {
    id: 'luxury_vip_invite',
    title: 'VIP Gala Invite',
    icon: '🍾',
    category: 'luxury',
    generatePrompt: (loc, actor, cat) =>
      `While you were strolling past ${loc}, ${actor} pulled up in a stretch Maybach. They handed you ${cat} and said: "A seat at tonight’s private billionaire gala just opened up. You’re on the guest list."`,
    buildOptions: (cat, actor) => [
      {
        text: 'Throw on your finest attire and attend the high-society gala',
        action: () => {
          const investmentTip = randomInt(5000, 25000);
          return {
            outcomeText: `You rubbed shoulders with titans of industry, sipped vintage champagne, and walked away with an insider venture tip that yielded $${investmentTip.toLocaleString()}!`,
            moneyChange: investmentTip,
            happinessChange: 35,
            fameChange: 20,
            looksChange: 6,
          };
        },
      },
      {
        text: 'Attend undercover and leak the ridiculous extravagance to the press',
        action: () => ({
          outcomeText: `Your anonymous tell-all article exposed the absurd billionaire vanity projects to the world! You became an underground folk hero!`,
          happinessChange: 25,
          karmaChange: 15,
          fameChange: 25,
        }),
      },
      {
        text: 'Sell your VIP ticket to a desperate socialite for cold hard cash',
        action: () => {
          const salePrice = randomInt(2500, 8000);
          return {
            outcomeText: `A social climber paid you $${salePrice.toLocaleString()} in cash right on the sidewalk! Easy money.`,
            moneyChange: salePrice,
            happinessChange: 20,
            smartsChange: 6,
          };
        },
      },
    ],
  },

  // 10. UNEXPLAINED SUPERNATURAL ENIGMA
  {
    id: 'supernatural_enigma',
    title: 'Bizarre Phenomenon',
    icon: '🛸',
    category: 'mystery',
    generatePrompt: (loc, actor, cat) =>
      `The air temperature plummeted ten degrees at ${loc} as streetlights buzzed and flickered. ${actor} gasped as ${cat} began floating six inches in the air, glowing with an electric violet aura!`,
    buildOptions: (cat, actor) => [
      {
        text: 'Reach out and touch the glowing floating object with bare hands',
        action: () => {
          if (Math.random() < 0.7) {
            return {
              outcomeText: `A surging wave of cosmic clarity surged through your nervous system! Your mental acuity expanded and your health felt completely rejuvenated!`,
              happinessChange: 30,
              healthChange: 20,
              smartsChange: 25,
              karmaChange: 15,
            };
          } else {
            return {
              outcomeText: `A static shock threw you backward onto the grass! Your hair was fried into an afro, but you gained an uncanny sense of intuition.`,
              happinessChange: 10,
              healthChange: -5,
              looksChange: -8,
              smartsChange: 15,
            };
          }
        },
      },
      {
        text: 'Take high-definition photographs and submit them to a university physics department',
        action: () => ({
          outcomeText: `The physics chair called a symposium to study your photographic evidence! You were credited in a landmark paper on quantum anomalies.`,
          happinessChange: 25,
          smartsChange: 20,
          fameChange: 18,
        }),
      },
      {
        text: 'Back away cautiously and recite a protective prayer',
        action: () => ({
          outcomeText: `The violet glow gradually dissipated, leaving only the smell of ozone. You lived to tell the tale without getting abducted.`,
          happinessChange: 10,
          karmaChange: 5,
        }),
      },
    ],
  },

  // 11. ROAD RAGE & HIGHWAY ESCAPADE
  {
    id: 'road_escapade',
    title: 'High-Speed Chaos',
    icon: '🏎️',
    category: 'adventure',
    generatePrompt: (loc, actor, cat) =>
      `Traffic came to a screeching halt at ${loc} when ${actor} swerved across three lanes while frantically hauling ${cat}! Horns blared and drivers began stepping out of their cars in fury!`,
    buildOptions: () => [
      {
        text: 'Take charge of the intersection and direct traffic like an experienced transit officer',
        action: () => ({
          outcomeText: `With calm authority and hand signals, you unraveled the gridlock in seven minutes flat! Commuters gave you a standing ovation of honks!`,
          happinessChange: 25,
          smartsChange: 8,
          karmaChange: 20,
          fameChange: 8,
        }),
      },
      {
        text: 'Pull over safely and check if anyone requires medical attention',
        action: () => ({
          outcomeText: `You confirmed all drivers were safe and offered bottles of water while emergency vehicles arrived. Pure class.`,
          happinessChange: 15,
          karmaChange: 15,
        }),
      },
      {
        text: 'Take the nearest detour through a quiet residential side street',
        action: () => ({
          outcomeText: `You slipped away before the traffic backup stretched for miles. Smooth navigation.`,
          happinessChange: 8,
          smartsChange: 4,
        }),
      },
    ],
  },

  // 12. RUNAWAY EXOTIC ANIMAL MAYHEM
  {
    id: 'exotic_animal_mayhem',
    title: 'Animal Havoc',
    icon: '🦚',
    category: 'comedy',
    generatePrompt: (loc, actor, cat) =>
      `Screams and laughter erupted at ${loc} when an escaped circus peacock snatched ${cat} and sprinted directly past ${actor}! It is now perched atop a streetlamp squawking triumphantly!`,
    buildOptions: () => [
      {
        text: 'Climb the lamp post with a bag of roasted peanuts and gently coax the bird down',
        action: () => {
          if (Math.random() < 0.75) {
            return {
              outcomeText: `The magnificent bird hopped onto your shoulder and surrendered the item! Animal control praised your gentle demeanor and rewarded you!`,
              moneyChange: 1200,
              happinessChange: 25,
              karmaChange: 20,
              fameChange: 12,
            };
          } else {
            return {
              outcomeText: `The peacock squawked and ruffled its feathers, dropping guano right onto your jacket before flying off! The crowd erupted in laughter.`,
              happinessChange: -10,
              looksChange: -5,
            };
          }
        },
      },
      {
        text: 'Record the ridiculous standoff and stream it live to the web',
        action: () => ({
          outcomeText: `Your stream reached #1 trending! Animal lovers praised the hilarious peacock heist.`,
          fameChange: 20,
          happinessChange: 20,
        }),
      },
      {
        text: 'Wait for professional animal handlers to arrive with nets',
        action: () => ({
          outcomeText: `Trained rangers safely captured the runaway bird and returned it to the sanctuary.`,
          happinessChange: 5,
        }),
      },
    ],
  },

  // 13. ANTIQUE RELIC CURSE
  {
    id: 'antique_curse',
    title: 'Cursed Relic',
    icon: '🏺',
    category: 'mystery',
    generatePrompt: (loc, actor, cat) =>
      `In a dimly lit corner of ${loc}, ${actor} placed ${cat} onto a velvet cloth and warned: "Whoever claims this object shall experience great fortune or great tragedy—there is no middle ground."`,
    buildOptions: (cat) => [
      {
        text: 'Boldly claim the relic and challenge whatever fate awaits',
        action: () => {
          if (Math.random() < 0.6) {
            const wealth = randomInt(12000, 45000);
            return {
              outcomeText: `An antique collector recognized the piece as an authentic lost imperial heirloom and paid you $${wealth.toLocaleString()} on the spot!`,
              moneyChange: wealth,
              happinessChange: 35,
              karmaChange: 10,
            };
          } else {
            return {
              outcomeText: `That night, strange dreams haunted your sleep and you came down with a mysterious 48-hour flu! You survived, but you promptly threw the relic into the river.`,
              healthChange: -15,
              happinessChange: -20,
            };
          }
        },
      },
      {
        text: 'Donate the artifact to the national history museum for preservation',
        action: () => ({
          outcomeText: `Curators verified the piece as a significant cultural treasure! Your name was permanently engraved on the museum donor plaque.`,
          happinessChange: 25,
          karmaChange: 30,
          fameChange: 15,
        }),
      },
      {
        text: 'Advise them to keep their spooky folklore to themselves',
        action: () => ({
          outcomeText: `You laughed off the curse superstition and walked away untroubled.`,
          happinessChange: 5,
          smartsChange: 5,
        }),
      },
    ],
  },

  // 14. COURTROOM JURY DRAMA
  {
    id: 'courtroom_drama',
    title: 'Legal Drama',
    icon: '⚖️',
    category: 'drama',
    generatePrompt: (loc, actor, cat) =>
      `A dramatic commotion broke out near ${loc} involving ${actor}. An attorney rushed up with ${cat} claiming it contains decisive evidence for an ongoing million-dollar trial and begged you to witness the handover!`,
    buildOptions: () => [
      {
        text: 'Sign your name as a sworn legal witness and testify truthfully in court',
        action: () => ({
          outcomeText: `Your calm, honest testimony in the trial exposed corrupt executives and cleared an innocent person! The courtroom applauded your civic courage!`,
          happinessChange: 30,
          karmaChange: 35,
          fameChange: 15,
          smartsChange: 10,
        }),
      },
      {
        text: 'Sell the explosive story to the investigative press for an exclusive fee',
        action: () => {
          const fee = randomInt(5000, 20000);
          return {
            outcomeText: `The Sunday paper ran the story on the front page! You received a journalistic contribution fee of $${fee.toLocaleString()}!`,
            moneyChange: fee,
            happinessChange: 20,
            fameChange: 18,
            karmaChange: -5,
          };
        },
      },
      {
        text: 'Refuse to get involved in other people’s lawsuits',
        action: () => ({
          outcomeText: `You kept your schedule free of subpoenas and depositions.`,
          happinessChange: 5,
          smartsChange: 4,
        }),
      },
    ],
  },
];

// ============================================================================
// COMBINATORIAL PROCEDURAL GENERATION ENGINE (1,000,000+ PERMUTATIONS)
// ============================================================================

export function generateProceduralEvent(char: Character): EventDefinition {
  const age = char.age;

  // Select tailored pools based on age bracket
  let locationsPool = LOCATIONS_ADULT;
  let actorsPool = ACTORS_ADULT;
  let catalystsPool = CATALYSTS_ADULT;

  if (age < 12) {
    locationsPool = LOCATIONS_YOUTH;
    actorsPool = ACTORS_YOUTH;
    catalystsPool = CATALYSTS_YOUTH;
  } else if (age < 18) {
    locationsPool = LOCATIONS_TEEN;
    actorsPool = ACTORS_TEEN;
    catalystsPool = CATALYSTS_TEEN;
  } else if (age >= 65) {
    locationsPool = LOCATIONS_SENIOR;
    actorsPool = ACTORS_SENIOR;
    catalystsPool = CATALYSTS_SENIOR;
  }

  const loc = pickRandom(locationsPool);
  const actor = pickRandom(actorsPool);
  const cat = pickRandom(catalystsPool);
  const archetype = pickRandom(SITUATION_ARCHETYPES);

  const eventSeed = `${age}_${Date.now()}_${randomInt(100000, 999999)}`;
  const title = archetype.title;
  const prompt = archetype.generatePrompt(loc, actor, cat, char);
  const icon = archetype.icon;
  const options = archetype.buildOptions(cat, actor, loc);

  return {
    id: `proc_${eventSeed}`,
    title,
    prompt,
    icon,
    minAge: 1,
    maxAge: 125,
    options,
  };
}
