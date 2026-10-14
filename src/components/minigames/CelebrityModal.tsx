import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Celebrity, CELEBRITIES } from '../../data/celebrities';
import { Character, Relationship } from '../../types/bitlife';
import { clamp, randomInt, pickRandom } from '../../utils/lifeEngine';
import {
  playCashSound,
  playClickSound,
  playFailSound,
  playSuccessSound,
} from '../../utils/audio';

interface CelebrityModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onClose: () => void;
}

type ActionOutcome = {
  title: string;
  description: string;
  success: boolean;
  moneyDelta?: number;
  fameDelta?: number;
  happinessDelta?: number;
  smartsDelta?: number;
  looksDelta?: number;
  partnerAdded?: Relationship;
};

export const CelebrityModal: React.FC<CelebrityModalProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onClose,
}) => {
  const [selectedCeleb, setSelectedCeleb] = useState<Celebrity | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [outcome, setOutcome] = useState<ActionOutcome | null>(null);

  // Minors are not permitted in VIP Celebrity Lounges
  if (character.age < 18) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-600/60 shadow-2xl p-6 text-white text-center space-y-3">
          <div className="text-3xl">🚸</div>
          <h3 className="text-base font-bold text-amber-400">Underage Notice</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are currently {character.age} years old. The Celebrity & Titans VIP Lounge is strictly reserved for adults aged 18 and older!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const categories = ['All', 'Tech Titan', 'Tycoon', 'Entertainment', 'Sports'];

  const filteredCelebs = CELEBRITIES.filter((c) => {
    if (activeCategory === 'All') return true;
    return c.category === activeCategory;
  });

  const handleSelectCeleb = (celeb: Celebrity) => {
    playClickSound();
    setSelectedCeleb(celeb);
    setOutcome(null);
  };

  // 1. Pitch Startup / Idea
  const handlePitchStartup = (celeb: Celebrity) => {
    playClickSound();
    const success = character.smarts >= 55 || Math.random() < 0.45;
    let grantAmount = 0;
    let description = '';

    if (celeb.id === 'djt') {
      if (success) {
        grantAmount = 250000;
        description = `DJT leaned back, gave two enthusiastic thumbs up: "Fantastic pitch, tremendous energy! We're doing a luxury real estate branding licensing deal right now!" He wired $${grantAmount.toLocaleString()} to your account!`;
      } else {
        description = `DJT shook his head: "Weak pitch, low energy! Needs much better marketing. Not a deal for me, believe me!"`;
      }
    } else if (celeb.id === 'jeff_bezos') {
      if (success) {
        grantAmount = 350000;
        description = `Jeff Bezos's eyes lit up: "Relentless customer obsession. Amazon Web Services and our venture fund are backing this with a $${grantAmount.toLocaleString()} seed investment!"`;
      } else {
        description = `Bezos smirked and adjusted his aviators: "We benchmarked this back in 2012. You need to invent and simplify much more."`;
      }
    } else if (celeb.id === 'sundar_pichai') {
      if (success) {
        grantAmount = 300000;
        description = `Sundar Pichai smiled warmly: "This architecture is deeply aligned with our multimodal AI research roadmap. Google Ventures is allocating a $${grantAmount.toLocaleString()} technology fellowship grant!"`;
      } else {
        description = `Sundar nodded thoughtfully: "Interesting concept, but our internal DeepMind teams are already exploring this direction. Keep innovating!"`;
      }
    } else if (celeb.id === 'larry_page') {
      if (success) {
        grantAmount = 400000;
        description = `Larry Page sat up with intense excitement: "A true 10x Moonshot! This could transform human transportation and energy. Here is a $${grantAmount.toLocaleString()} Google X innovation check!"`;
      } else {
        description = `Larry stared into space thinking about flying vehicles: "It's only an incremental 10% improvement. In life, you must aim for true 10x audacity!"`;
      }
    } else if (celeb.id === 'elon_musk') {
      if (success) {
        grantAmount = 280000;
        description = `Elon Musk nodded rapidly: "Hardcore engineering. First principles logic checks out. SpaceX & xAI will cut a $${grantAmount.toLocaleString()} angel check to get prototype rev 1 built!"`;
      } else {
        description = `Elon chuckled: "Too many assumptions violating physics. Delete the part, simplify the requirements, and come back next quarter."`;
      }
    } else if (celeb.id === 'matt_jorgensen') {
      if (success) {
        grantAmount = 150000;
        description = `Matt "Sweets" Jorgensen was hyped beyond belief: "DUDE! That kendama design is absolutely insane! The weight distribution and tama tracking are pure fire! Sweets Kendamas is officially funding your signature line with a $${grantAmount.toLocaleString()} partnership grant!"`;
      } else {
        description = `Matt smiled warmly: "It's a neat concept, but the lunar balance isn't dialed in yet. Keep grinding, hone your shape, and spread kendama love!"`;
      }
    } else {
      if (success) {
        grantAmount = 200000;
        description = `${celeb.name} loved your vision! "This is spectacular! Let's build something iconic together!" They wired you a $${grantAmount.toLocaleString()} endorsement check!`;
      } else {
        description = `${celeb.name} politely passed on your business pitch: "Not quite the right strategic fit for my portfolio right now."`;
      }
    }

    if (success) {
      playSuccessSound();
      playCashSound();
      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.3 } });
      } catch {}
    } else {
      playFailSound();
    }

    applyOutcome({
      title: success ? 'Startup Venture Funded! 🚀' : 'Pitch Declined',
      description,
      success,
      moneyDelta: grantAmount,
      fameDelta: success ? 15 : 0,
      happinessDelta: success ? 30 : -10,
      smartsDelta: success ? 8 : 2,
    });
  };

  // 2. Hang Out / VIP Experience
  const handleHangout = (celeb: Celebrity) => {
    playClickSound();
    let description = '';

    if (celeb.id === 'djt') {
      description = `You played 18 holes of golf with Donald J. Trump at Mar-a-Lago! He drove the gold-plated cart, chatted about international diplomacy, and treated you to club sandwiches at the clubhouse.`;
    } else if (celeb.id === 'jeff_bezos') {
      description = `You boarded Jeff Bezos's sailing superyacht Koru in the Mediterranean. You drank espresso on the teak deck and debated orbital space stations until twilight!`;
    } else if (celeb.id === 'sundar_pichai') {
      description = `Sundar Pichai invited you to the Googleplex in Mountain View. You toured the secret robotics facility and enjoyed artisanal chai while chatting about the future of global search.`;
    } else if (celeb.id === 'larry_page') {
      description = `Larry Page strapped you into a prototype electric flying craft! You zoomed over the California coastline at 130 mph with zero engine noise. What a thrill!`;
    } else if (celeb.id === 'elon_musk') {
      description = `Elon Musk gave you an exclusive VIP midnight walkthrough of Starbase Boca Chica. You stood directly beneath the 400-foot Starship launch tower while Raptor engines underwent cold-fire testing!`;
    } else if (celeb.id === 'taylor_swift') {
      description = `Taylor Swift gave you all-access backstage VIP credentials at the Eras Tour! You danced in the front row as 80,000 screaming fans sang along to every hit song.`;
    } else if (celeb.id === 'mark_zuckerberg') {
      description = `You trained Brazilian Jiu-Jitsu with Mark Zuckerberg! He swept you with an armbar, helped you back up, and handed you a recovery electrolyte drink.`;
    } else if (celeb.id === 'keanu_reeves') {
      description = `Keanu Reeves took you for a ride on his custom ARCH motorcycles through the Malibu canyons. "You're breathtaking!" he cheered at the ocean overlook.`;
    } else if (celeb.id === 'cristiano_ronaldo') {
      description = `Cristiano Ronaldo invited you onto the private pitch for soccer penalty kick practice! He shouted "SIUUUU!" after scoring an unstoppable curve shot.`;
    } else if (celeb.id === 'matt_jorgensen') {
      description = `Matt "Sweets" Jorgensen invited you to Sweets Kendamas HQ in Minneapolis! You jammed on custom Cushion Clear damas, learned bird stalls and lunar flips, and filmed an epic community edit! "Spread Kendama Love!" he shouted!`;
    } else {
      description = `You spent a wonderful afternoon hanging out with ${celeb.name}. You exchanged stories and had a blast!`;
    }

    playSuccessSound();
    applyOutcome({
      title: `VIP Hangout with ${celeb.name}! 🌟`,
      description,
      success: true,
      happinessDelta: 25,
      fameDelta: 12,
      smartsDelta: 4,
    });
  };

  // 3. Take Viral Selfie & Autograph
  const handleSelfie = (celeb: Celebrity) => {
    playClickSound();
    playSuccessSound();
    const views = randomInt(500, 2500);
    const description = `You posed for a smiling selfie with ${celeb.name} (${celeb.avatar})! You posted it on Instagram and TikTok, where it blew up with ${views.toLocaleString()},000 views and hit the #1 trending explore page!`;

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.3 } });
    } catch {}

    applyOutcome({
      title: 'Viral Celebrity Selfie! 📸',
      description,
      success: true,
      fameDelta: 20,
      happinessDelta: 20,
    });
  };

  // 4. Seek Mentorship & Wisdom
  const handleMentorship = (celeb: Celebrity) => {
    playClickSound();
    playSuccessSound();
    const description = `${celeb.name} sat down with you for 30 minutes of deep 1-on-1 mentorship. Their core advice: "${celeb.catchphrase}". You took meticulous notes and feel profoundly inspired!`;

    applyOutcome({
      title: 'Executive Mentorship Session 🧠',
      description,
      success: true,
      smartsDelta: 10,
      happinessDelta: 15,
    });
  };

  // 5. Ask on a Celebrity Date
  const handleAskOnDate = (celeb: Celebrity) => {
    playClickSound();

    // STRICT USER REQUIREMENT: REJECT if no high looks, smarts
    const hasHighLooksAndSmarts = character.looks >= 70 && character.smarts >= 70;
    if (!hasHighLooksAndSmarts) {
      playFailSound();
      applyOutcome({
        title: 'Rejected! 💔',
        description: `REJECTED! ${celeb.name} looked you up and down and scoffed: "I only date partners with high looks and high smarts. You don't meet my standards."`,
        success: false,
        happinessDelta: -12,
      });
      return;
    }

    // High bar criteria for celebrities
    const accepted = character.looks >= 70 && character.smarts >= 70 && (character.fame >= 30 || character.money >= 3000000 || Math.random() < 0.45);

    if (accepted) {
      playSuccessSound();
      playCashSound();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.25 } });
      } catch {}

      // Muhammed bin Salmad is female/male depending on player gender
      let isMale = celeb.id !== 'taylor_swift';
      if (celeb.id === 'muhammed_bin_salmad') {
        isMale = character.gender === 'Female';
      }

      const partner: Relationship = {
        id: 'rel_celeb_' + Date.now(),
        name: celeb.name,
        relation: isMale ? 'Boyfriend' : 'Girlfriend',
        age: randomInt(32, 60),
        alive: true,
        relationshipLevel: 90,
        smarts: celeb.smarts,
        looks: celeb.looks,
        money: 10000000,
        occupation: celeb.id === 'muhammed_bin_salmad'
          ? (isMale ? 'Crown Prince & Royal Titan' : 'Crown Princess & Royal Titanesse')
          : celeb.title,
      };

      applyOutcome({
        title: 'Going Steady 💕',
        description: `Going Steady. You are now dating ${celeb.name}.`,
        success: true,
        happinessDelta: 40,
        fameDelta: 30,
        looksDelta: 5,
        partnerAdded: partner,
      });
    } else {
      playFailSound();
      applyOutcome({
        title: 'Polite Celebrity Decline 💔',
        description: `${celeb.name} offered a courteous smile: "You're wonderful, but with my demanding global travel schedule, I don't have time for romance right now. Let's stay good friends!"`,
        success: false,
        happinessDelta: -8,
      });
    }
  };

  const applyOutcome = (out: ActionOutcome) => {
    setOutcome(out);

    onUpdateCharacter((prev) => {
      let updated = { ...prev };
      updated.celebrityInteractions = (updated.celebrityInteractions || 0) + 1;
      if (out.moneyDelta) updated.money = updated.money + out.moneyDelta;
      if (out.happinessDelta) updated.happiness = clamp(updated.happiness + out.happinessDelta);
      if (out.fameDelta) updated.fame = clamp(updated.fame + out.fameDelta);
      if (out.smartsDelta) updated.smarts = clamp(updated.smarts + out.smartsDelta);
      if (out.looksDelta) updated.looks = clamp(updated.looks + out.looksDelta);
      if (out.partnerAdded) {
        updated.relationships = [...updated.relationships, out.partnerAdded];
      }
      return updated;
    });

    onAddLog(out.description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[88vh] rounded-2xl bg-slate-900 border border-amber-600/60 shadow-2xl p-5 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <div>
              <h3 className="text-sm font-bold text-amber-300">Celebrity & Titans VIP Lounge</h3>
              <p className="text-[10px] text-slate-400">
                Encounters: <strong className="text-emerald-400 font-mono">{character.celebrityInteractions || 0}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto py-2 shrink-0 no-scrollbar text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClickSound();
                setActiveCategory(cat);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Outcome Card if an action was just taken */}
        {outcome && (
          <div
            className={`p-3.5 rounded-xl border mb-2 text-xs shrink-0 ${
              outcome.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center font-bold mb-1">
              <span className={outcome.success ? 'text-emerald-300' : 'text-amber-300'}>
                {outcome.title}
              </span>
              <button
                onClick={() => setOutcome(null)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] leading-relaxed">{outcome.description}</p>
            {outcome.moneyDelta && outcome.moneyDelta > 0 && (
              <div className="mt-1 font-mono font-bold text-emerald-400">
                +${outcome.moneyDelta.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Selected Celebrity Detail Sheet or Celeb List */}
        {selectedCeleb ? (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            <button
              onClick={() => setSelectedCeleb(null)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              ← Back to all celebrities
            </button>

            {/* Celebrity Hero Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-600/40 shadow-inner">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0">
                  {selectedCeleb.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {selectedCeleb.name}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">
                      {selectedCeleb.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">{selectedCeleb.title}</p>
                  <p className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                    Net Worth: ${(selectedCeleb.netWorth / 1000000000).toFixed(1)} Billion
                  </p>
                </div>
              </div>

              <blockquote className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] italic text-amber-200/90 mt-2">
                "{selectedCeleb.catchphrase}"
              </blockquote>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handlePitchStartup(selectedCeleb)}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white text-xs font-bold shadow flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span>💼</span> Pitch Startup / Venture Idea
                </span>
                <span className="text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded">High Payout</span>
              </button>

              <button
                onClick={() => handleHangout(selectedCeleb)}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>🥂</span> VIP Hangout & Exclusive Access
              </button>

              <button
                onClick={() => handleSelfie(selectedCeleb)}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>📸</span> Take Viral Selfie (+Fame)
              </button>

              <button
                onClick={() => handleMentorship(selectedCeleb)}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>🧠</span> Seek Wisdom & Mentorship (+Smarts)
              </button>

              <button
                onClick={() => handleAskOnDate(selectedCeleb)}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span>💘</span> Ask on a Celebrity Date
                </span>
                <span className="text-[10px] bg-pink-950/60 px-2 py-0.5 rounded">High Status</span>
              </button>
            </div>
          </div>
        ) : (
          /* Celebrities List */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {filteredCelebs.map((celeb) => (
              <div
                key={celeb.id}
                onClick={() => handleSelectCeleb(celeb)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 group-hover:bg-amber-500/10 border border-slate-800 group-hover:border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                    {celeb.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                        {celeb.name}
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {celeb.moniker}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{celeb.title}</p>
                    <p className="text-[10px] font-mono text-emerald-400 font-semibold">
                      ${(celeb.netWorth / 1000000000).toFixed(1)}B Net Worth
                    </p>
                  </div>
                </div>

                <div className="text-slate-500 group-hover:text-amber-400 text-sm font-bold pl-2 shrink-0">
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
