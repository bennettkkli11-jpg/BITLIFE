import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ROYAL_DECREES,
  KNIGHTHOOD_CANDIDATES,
  ROYAL_SUITORS_POOL,
  RoyalDecree,
  RoyalSuitor,
} from '../../data/royalty';
import { COUNTRIES } from '../../data/countries';
import { Character, RoyaltyInfo, Relationship } from '../../types/bitlife';
import { clamp, randomInt, pickRandom } from '../../utils/lifeEngine';
import {
  playCashSound,
  playClickSound,
  playFailSound,
  playSuccessSound,
} from '../../utils/audio';

interface RoyaltyModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onClose: () => void;
}

export const RoyaltyModal: React.FC<RoyaltyModalProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onClose,
}) => {
  const isRoyal = !!character.royalty;
  const isMonarch =
    !!character.royalty?.isMonarch ||
    character.royalty?.title?.includes('King') ||
    character.royalty?.title?.includes('Queen') ||
    character.royalty?.title?.includes('Emperor') ||
    character.royalty?.title?.includes('Sultan') ||
    character.royalty?.title?.includes('Sovereign');

  const currentCountry = COUNTRIES.find((c) => c.name === character.country);
  const countryMonarchy = currentCountry?.monarchy;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DECREES' | 'KNIGHTHOODS' | 'EXECUTIONS' | 'SUITORS'>('OVERVIEW');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Execution state
  const [selectedExecTarget, setSelectedExecTarget] = useState<string>('traitor');
  const [selectedExecMethod, setSelectedExecMethod] = useState<string>('Royal Guillotine');

  // 1. Issue Royal Decree
  const handleIssueDecree = (decree: RoyalDecree) => {
    playClickSound();

    if (decree.cost && character.money < decree.cost) {
      setFeedback(`You need at least ${character.currencySymbol}${decree.cost.toLocaleString()} from your treasury.`);
      return;
    }

    playSuccessSound();
    const newRespect = clamp((character.royalty?.respect || 80) + decree.respectChange);

    onUpdateCharacter((prev) => ({
      ...prev,
      money: decree.cost ? prev.money - decree.cost : prev.money,
      karma: clamp(prev.karma + decree.karmaChange),
      happiness: clamp(prev.happiness + 15),
      royalty: prev.royalty
        ? { ...prev.royalty, respect: newRespect }
        : undefined,
    }));

    const text = `ROYAL PROCLAMATION: You issued the decree "${decree.title}". Royal respect is now ${newRespect}%!`;
    setFeedback(text);
    onAddLog(text);
  };

  // 2. Bestow Knighthood
  const handleKnightCandidate = (candidate: (typeof KNIGHTHOOD_CANDIDATES)[0]) => {
    playClickSound();
    playSuccessSound();

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.3 } });
    } catch {}

    const newRespect = clamp((character.royalty?.respect || 80) + 8);
    onUpdateCharacter((prev) => ({
      ...prev,
      royalty: prev.royalty
        ? { ...prev.royalty, respect: newRespect }
        : undefined,
      happiness: clamp(prev.happiness + 10),
      fame: clamp(prev.fame + 5),
    }));

    const text = `At the Royal Palace Investiture, you tapped your sovereign sword on the shoulders of ${candidate.name} (${candidate.field}), bestowing the title of Knight Commander!`;
    setFeedback(text);
    onAddLog(text);
  };

  // 3. Host Grand Royal Gala
  const handleHostRoyalGala = () => {
    playClickSound();
    const cost = 1500000;
    if (character.money < cost) {
      setFeedback(`Hosting a palace gala costs ${character.currencySymbol}${cost.toLocaleString()}.`);
      return;
    }

    playSuccessSound();
    playCashSound();
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.25 } });
    } catch {}

    const newRespect = clamp((character.royalty?.respect || 80) + 15);
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - cost,
      royalty: prev.royalty
        ? { ...prev.royalty, respect: newRespect }
        : undefined,
      happiness: clamp(prev.happiness + 25),
      fame: clamp(prev.fame + 20),
    }));

    const text = 'You hosted the Annual Royal Palace Winter Gala! Aristocrats, ambassadors, and tech billionaires toasted to your health under glittering crystal chandeliers.';
    setFeedback(text);
    onAddLog(text);
  };

  // 4. Royal Pardon / Clemency
  const handleRoyalPardon = () => {
    playClickSound();
    playSuccessSound();
    const newRespect = clamp((character.royalty?.respect || 80) + 5);
    onUpdateCharacter((prev) => ({
      ...prev,
      karma: clamp(prev.karma + 12),
      happiness: clamp(prev.happiness + 10),
      royalty: prev.royalty
        ? { ...prev.royalty, respect: newRespect }
        : undefined,
    }));
    const text = 'You exercised the Royal Prerogative of Mercy to pardon a repentant commoner, demonstrating sovereign benevolence.';
    setFeedback(text);
    onAddLog(text);
  };

  // 5. Public Royal Walkabout / Wave to crowd
  const handlePublicWalkabout = () => {
    playClickSound();
    playSuccessSound();
    const newRespect = clamp((character.royalty?.respect || 80) + 10);
    onUpdateCharacter((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 15),
      royalty: prev.royalty
        ? { ...prev.royalty, respect: newRespect }
        : undefined,
    }));
    const text = 'You conducted a royal walkabout through the palace gates. Thousands of cheering citizens waved flags and presented bouquets of roses!';
    setFeedback(text);
    onAddLog(text);
  };

  // 6. Abdicate the Throne
  const handleAbdicate = () => {
    playClickSound();
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      royalty: undefined,
      happiness: clamp(prev.happiness - 15),
      fame: clamp(prev.fame - 20),
    }));
    const text = 'You signed the Instrument of Abdication, relinquishing all royal titles and sovereign privileges to live life as a private commoner.';
    onAddLog(text);
    onClose();
  };

  // 7. Execute Someone (For Reigning Monarchs)
  const handleOrderExecution = () => {
    playClickSound();
    playFailSound();

    let targetName = 'Lord Malcor the Treasonous Rebel';
    let targetRel: Relationship | undefined;

    if (selectedExecTarget !== 'traitor') {
      targetRel = character.relationships.find((r) => r.id === selectedExecTarget && r.alive);
      if (targetRel) {
        targetName = `${targetRel.name} (${targetRel.relation})`;
      }
    }

    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: targetRel
        ? prev.relationships.map((r) => (r.id === targetRel?.id ? { ...r, alive: false } : r))
        : prev.relationships,
      royalty: prev.royalty
        ? { ...prev.royalty, respect: clamp((prev.royalty.respect || 80) + 12) }
        : undefined,
      happiness: clamp(prev.happiness + 10),
    }));

    const text = `🪓 ROYAL EXECUTION: By Sovereign Decree of King/Queen ${character.firstName}, ${targetName} was executed by ${selectedExecMethod} for High Treason against the Crown! The Sovereign possesses absolute sovereign crime immunity!`;
    setFeedback(text);
    onAddLog(text);
  };

  // 8. Court a Royal Suitor (for Commoners)
  const handleCourtRoyal = (suitor: RoyalSuitor) => {
    playClickSound();

    // STRICT USER REQUIREMENT 1: REJECT if no high looks, smarts
    const hasHighLooksAndSmarts = character.looks >= 70 && character.smarts >= 70;
    if (!hasHighLooksAndSmarts) {
      playFailSound();
      setFeedback(
        `REJECTED! ${suitor.name} curled their lip in aristocratic disgust: "Royal dynasties only associate with suitors who have high looks and high smarts. You fail to meet our court's standards!"`
      );
      return;
    }

    // STRICT USER REQUIREMENT 2: IT IS NOT GUARANTEED that you can date royalty!
    // Even with high looks and smarts, royal protocols, Privy Council vetoes, and dynastic politics cause frequent rejection:
    const royalAcceptanceOdds = Math.min(
      0.38,
      (character.looks * 0.002) + (character.smarts * 0.002) + (character.fame * 0.001)
    );
    const royalAccepted = Math.random() < royalAcceptanceOdds;

    if (!royalAccepted) {
      playFailSound();
      const reasons = [
        `The Sovereign Monarch and Royal Privy Council vetoed the union: "Palace protocol demands verified noble bloodlines. The Crown cannot permit courtship with an untitled commoner."`,
        `${suitor.name} offered a formal palace apology: "My royal duties require an arranged dynastic match approved by parliament. Our courtship cannot proceed."`,
        `The Royal Court dismissed your petition: "Aristocratic pedigree rules forbid the Royal Family from taking a commoner consort at this time."`,
      ];
      setFeedback(`COURTSHIP DENIED! ${pickRandom(reasons)}`);
      return;
    }

    // Courting succeeded!
    playSuccessSound();
    playCashSound();
    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.25 } });
    } catch {}

    // Muhammed bin Salmad dynamic gender based on player
    let suitorName = suitor.name;
    let suitorTitle = suitor.title;
    let isMaleSuitor = suitor.title.includes('Prince') || suitor.title.includes('Duke');
    if (suitor.name === 'Muhammed bin Salmad') {
      isMaleSuitor = character.gender === 'Female';
      suitorTitle = isMaleSuitor ? 'Crown Prince of Saudi Arabia' : 'Crown Princess of Saudi Arabia';
    }

    const royalTitle = character.gender === 'Female' ? 'Duchess Consort' : 'Duke Consort';
    // USER REQUIREMENT: Sovereign grants can be from 10mil to 100mil per year!
    const sovereignGrant = randomInt(20000000, 100000000);

    const newRoyalty: RoyaltyInfo = {
      title: royalTitle,
      country: suitor.country,
      respect: 88,
      yearlyAllowance: sovereignGrant,
      isMonarch: false,
    };

    const partner: Relationship = {
      id: 'rel_royal_' + Date.now(),
      name: suitorName,
      relation: isMaleSuitor ? 'Husband' : 'Wife',
      age: suitor.age,
      alive: true,
      relationshipLevel: 95,
      smarts: suitor.smarts,
      looks: suitor.looks,
      money: suitor.netWorth,
      occupation: suitorTitle,
    };

    const existingSpouses = character.relationships.filter(
      (r) => r.alive && (r.relation === 'Husband' || r.relation === 'Wife')
    );
    const totalSpouses = existingSpouses.length + 1;

    onUpdateCharacter((prev) => ({
      ...prev,
      royalty: newRoyalty,
      fame: clamp(prev.fame + 45),
      happiness: clamp(prev.happiness + 40),
      relationships: [...prev.relationships, partner],
    }));

    const text = `Going Steady. You are now dating ${suitorName}! 💍 ROYAL WEDDING: You married ${suitorName} (${suitorTitle})! You are now ${royalTitle} with an annual sovereign grant of ${character.currencySymbol}${sovereignGrant.toLocaleString()}/yr! (Total Spouses: ${totalSpouses})`;
    setFeedback(text);
    onAddLog(`Going Steady. You are now dating ${suitorName}. ` + text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[88vh] rounded-2xl bg-slate-900 border border-amber-500/70 shadow-2xl p-5 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                {isRoyal ? 'The Royal Court & Throne Room' : 'Royal Nobility & International Suitors'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isRoyal
                  ? `${character.royalty?.title} of ${character.royalty?.country || character.country}${
                      character.royalty?.country && character.royalty.country !== character.country
                        ? ` • Abroad in ${character.country}`
                        : ''
                    }`
                  : `${character.country} • Court Aristocracy Abroad`}
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

        {/* Expatriate Royalty Banner */}
        {isRoyal && character.royalty?.country && character.royalty.country !== character.country && (
          <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-[11px] text-purple-200 mt-2 shrink-0 flex items-center gap-2">
            <span>✈️</span>
            <span>
              <strong>Royal Dynasty Abroad:</strong> You hold the sovereign title of{' '}
              <strong>{character.royalty.title} of {character.royalty.country}</strong> while living in {character.country}. Your royal privileges, dignity, and crown allowance remain intact!
            </span>
          </div>
        )}

        {/* Feedback Banner */}
        {feedback && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/50 text-xs text-amber-100 mt-2 shrink-0 leading-relaxed">
            {feedback}
          </div>
        )}

        {/* Navigation Tabs */}
        {isRoyal && (
          <div className="flex gap-1.5 overflow-x-auto py-2 shrink-0 text-xs no-scrollbar">
            {(['OVERVIEW', 'DECREES', 'KNIGHTHOODS', 'EXECUTIONS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'OVERVIEW'
                  ? 'Crown Overview'
                  : tab === 'DECREES'
                  ? 'Sovereign Decrees'
                  : tab === 'KNIGHTHOODS'
                  ? 'Knighthoods'
                  : 'Royal Executions 🪓'}
              </button>
            ))}
          </div>
        )}

        {/* ROYAL VIEW: OVERVIEW */}
        {isRoyal ? (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-2 pr-1">
            {activeTab === 'OVERVIEW' && (
              <>
                {/* Royal Status Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/90 via-purple-950/80 to-slate-950 border border-amber-500/60 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                      {character.royalty?.country && character.royalty.country !== character.country
                        ? '👑 Royalty Abroad'
                        : 'Reigning Royalty'}
                    </span>
                    <span className="text-xs text-amber-200">
                      {countryMonarchy?.palace || (character.royalty?.country ? `${character.royalty.country} Royal Court` : 'Royal Palace')}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-amber-200">
                    👑 {character.royalty?.title} {character.firstName} {character.lastName}
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono font-bold mt-1">
                    Annual Sovereign Grant: {character.currencySymbol}
                    {(character.royalty?.yearlyAllowance || 5000000).toLocaleString()}/yr
                  </p>

                  {/* Respect Meter */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-semibold">Royal Respect from Subjects</span>
                      <span className="font-mono font-bold text-amber-300">{character.royalty?.respect || 80}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${character.royalty?.respect || 80}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sovereign Royal Actions */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Sovereign Duties & Powers
                  </h5>

                  <button
                    onClick={handlePublicWalkabout}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">👋</span>
                      <div>
                        <div>Public Royal Walkabout</div>
                        <div className="text-[10px] text-slate-400 font-normal">Wave from palace balcony and greet citizens</div>
                      </div>
                    </div>
                    <span className="text-amber-400 font-mono text-xs">+Respect</span>
                  </button>

                  <button
                    onClick={handleHostRoyalGala}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🥂</span>
                      <div>
                        <div>Host Palace State Banquet ($1.5M)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Entertain visiting foreign royalty and dignitaries</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-mono text-xs">+Fame</span>
                  </button>

                  <button
                    onClick={handleRoyalPardon}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🕊️</span>
                      <div>
                        <div>Exercise Royal Clemency</div>
                        <div className="text-[10px] text-slate-400 font-normal">Pardon a subject using royal prerogative</div>
                      </div>
                    </div>
                    <span className="text-cyan-400 font-mono text-xs">+Karma</span>
                  </button>
                </div>

                {/* Abdication */}
                <button
                  onClick={handleAbdicate}
                  className="w-full py-2.5 rounded-xl border border-red-900/60 text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                >
                  Abdicate the Throne (Surrender Royalty) 💔
                </button>
              </>
            )}

            {/* DECREES TAB */}
            {activeTab === 'DECREES' && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Proclaim Sovereign Decrees
                </h5>
                {ROYAL_DECREES.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-2xl shrink-0 mt-0.5">{dec.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{dec.title}</div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{dec.description}</p>
                        {dec.cost && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Cost: {character.currencySymbol}{dec.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleIssueDecree(dec)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow"
                    >
                      Proclaim
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* KNIGHTHOODS TAB */}
            {activeTab === 'KNIGHTHOODS' && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Palace Investitures & Knighthoods
                </h5>
                <p className="text-[11px] text-slate-400">
                  Bestow Knighthoods upon exceptional citizens in recognition of extraordinary national achievements.
                </p>
                {KNIGHTHOOD_CANDIDATES.map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cand.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{cand.name}</div>
                        <div className="text-[10px] text-amber-300">{cand.field}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleKnightCandidate(cand)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs cursor-pointer shadow"
                    >
                      Knight 🗡️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* EXECUTIONS TAB (ROYAL POWER OF LIFE AND DEATH) */}
            {activeTab === 'EXECUTIONS' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/90 via-slate-950 to-red-950/80 border border-red-600/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🪓</span>
                    <h5 className="text-xs font-black text-red-400 uppercase tracking-wider">
                      Royal Execution Chamber
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    As Monarch, you hold sovereign divine authority. You can order the execution of criminals, dissidents, and relatives with <strong>absolute sovereign crime immunity</strong>.
                  </p>
                </div>

                <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Select Execution Target:</label>
                      <select
                        value={selectedExecTarget}
                        onChange={(e) => setSelectedExecTarget(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium outline-none cursor-pointer"
                      >
                        <option value="traitor">Lord Malcor the Treasonous Rebel (Dissident Leader)</option>
                        {character.relationships
                          .filter((r) => r.alive)
                          .map((rel) => (
                            <option key={rel.id} value={rel.id}>
                              {rel.name} ({rel.relation}) — Age {rel.age}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Execution Method:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Royal Guillotine', icon: '🪓' },
                          { name: 'Palace Firing Squad', icon: '🎯' },
                          { name: 'Crocodile Moat', icon: '🐊' },
                          { name: 'Poisoned Chalice', icon: '🍷' },
                        ].map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => setSelectedExecMethod(m.name)}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                              selectedExecMethod === m.name
                                ? 'bg-red-950 border-red-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{m.icon}</span>
                            <span className="text-[11px]">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleOrderExecution}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 uppercase tracking-wider"
                      >
                        <span>🪓</span>
                        <span>Off With Their Head! (Execute)</span>
                      </button>
                      <p className="text-[10px] text-emerald-400 text-center mt-1.5 font-mono">
                        🛡️ Sovereign Immunity: The Crown cannot be charged by mortal courts.
                      </p>
                    </div>
                  </div>
              </div>
            )}
          </div>
        ) : (
          /* COMMONER VIEW: COURT ROYAL SUITORS */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-2 pr-1">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/80 to-amber-950/80 border border-amber-500/50">
              <h4 className="text-xs font-bold text-amber-300">Court Global Royalty & Aristocracy</h4>
              <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                Win the heart of a Prince, Princess, or Sovereign Duke to marry into a royal dynasty and ascend to the aristocracy!
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Eligible Royal Suitors
              </h5>

              {ROYAL_SUITORS_POOL.map((suitor, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                      {suitor.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{suitor.name}</h4>
                        <span className="text-xs shrink-0">{suitor.flag}</span>
                      </div>
                      <p className="text-[10px] text-amber-300 font-semibold">{suitor.title} of {suitor.country}</p>
                      <p className="text-[10px] text-slate-400">
                        Age {suitor.age} · Looks {suitor.looks}% · Net ${(suitor.netWorth / 1000000).toFixed(0)}M
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCourtRoyal(suitor)}
                    className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow"
                  >
                    Court 💍
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
