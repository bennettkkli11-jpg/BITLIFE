import React, { useState } from 'react';
import { Character, Relationship, RelationType } from '../../types/bitlife';
import { clamp, randomInt, pickRandom } from '../../utils/lifeEngine';
import { playCashSound, playClickSound, playFailSound, playSuccessSound } from '../../utils/audio';
import { RecaptchaWidget } from '../RecaptchaWidget';

interface RelationshipsTabProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onOpenDatingModal: () => void;
}

export const RelationshipsTab: React.FC<RelationshipsTabProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onOpenDatingModal,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // reCAPTCHA questioning state
  const [questioningPerson, setQuestioningPerson] = useState<Relationship | null>(null);
  const [questioningAll, setQuestioningAll] = useState(false);
  const [captchaVerifiedInTab, setCaptchaVerifiedInTab] = useState(false);
  const [executingPerson, setExecutingPerson] = useState<Relationship | null>(null);
  const [execMethod, setExecMethod] = useState<string>('Royal Guillotine');

  const aliveRelations = character.relationships.filter((r) => r.alive);

  const handleSpendQualityTime = (rel: Relationship) => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, relationshipLevel: clamp(r.relationshipLevel + 12) } : r
      ),
      happiness: clamp(prev.happiness + 8),
    }));
    const activities = [
      'went bowling at the retro arcade',
      'went for an afternoon picnic in the botanical gardens',
      'marathon-watched classic movies together',
      'went out for gelato by the waterfront',
    ];
    const act = pickRandom(activities);
    setFeedback(`You and ${rel.name} ${act}!`);
    onAddLog(`I spent time with my ${rel.relation.toLowerCase()}, ${rel.name}.`);
  };

  const handleConverse = (rel: Relationship) => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, relationshipLevel: clamp(r.relationshipLevel + 6) } : r
      ),
      happiness: clamp(prev.happiness + 4),
    }));
    const topics = [
      'the meaning of universe and life goals',
      'favorite childhood holiday traditions',
      'their latest work gossip and ambitions',
      'conspiracy theories regarding moon landings',
    ];
    setFeedback(`You had an engaging conversation with ${rel.name} about ${pickRandom(topics)}.`);
  };

  const handleCompliment = (rel: Relationship) => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, relationshipLevel: clamp(r.relationshipLevel + 10) } : r
      ),
      happiness: clamp(prev.happiness + 6),
      karma: clamp(prev.karma + 4),
    }));
    const compliments = [
      'their impeccable sense of style',
      'their brilliant sense of humor',
      'how deeply you appreciate their support',
    ];
    setFeedback(`You complimented ${rel.name} on ${pickRandom(compliments)}! They blushed and thanked you.`);
  };

  const handleInsult = (rel: Relationship) => {
    playClickSound();
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, relationshipLevel: clamp(r.relationshipLevel - 25) } : r
      ),
      happiness: clamp(prev.happiness - 5),
      karma: clamp(prev.karma - 10),
    }));
    setFeedback(`You hurled a bitter insult at ${rel.name}! They stormed off in fury!`);
    onAddLog(`I had a heated confrontation with ${rel.name}.`);
  };

  const handleAskForMoney = (rel: Relationship) => {
    playClickSound();
    if (rel.relationshipLevel > 65 && rel.money > 200) {
      playSuccessSound();
      playCashSound();
      const gift = character.age < 18 ? randomInt(3, 12) : randomInt(10, 35);
      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money + gift,
        relationships: prev.relationships.map((r) =>
          r.id === rel.id
            ? { ...r, relationshipLevel: clamp(r.relationshipLevel - 8), money: Math.max(0, r.money - gift) }
            : r
        ),
      }));
      setFeedback(`${rel.name} handed you a modest ${character.currencySymbol}${gift}. "That's all the spare change I have. Don't waste it!"`);
      onAddLog(`My ${rel.relation.toLowerCase()}, ${rel.name}, gave me ${character.currencySymbol}${gift}.`);
    } else {
      playFailSound();
      setFeedback(`${rel.name} shook their head: "Money doesn't grow on trees! Stop asking and earn your own!"`);
    }
  };

  const handleVerifyPersonQuestioning = (rel: Relationship) => {
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, relationshipLevel: Math.min(100, r.relationshipLevel + 25) } : r
      ),
      happiness: clamp(prev.happiness + 15),
      karma: clamp(prev.karma + 10),
    }));
    setFeedback(`🤖 HUMAN STATUS VERIFIED! You questioned ${rel.name} with reCAPTCHA. They identified all target images flawlessly and proved they are 100% human! Relationship boosted!`);
    onAddLog(`I questioned my ${rel.relation.toLowerCase()}, ${rel.name}, with a reCAPTCHA challenge. They solved it and verified their humanity!`);
    setQuestioningPerson(null);
    setSelectedPerson(null);
  };

  const handleVerifyAllQuestioning = () => {
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) => ({
        ...r,
        relationshipLevel: clamp(r.relationshipLevel + 20),
      })),
      happiness: clamp(prev.happiness + 20),
      karma: clamp(prev.karma + 15),
    }));
    setFeedback(`🛡️ ALL PEOPLE CLEARED! You questioned all ${aliveRelations.length} people in your circle with reCAPTCHA. Every single family member and friend passed the test! No AI bots detected.`);
    onAddLog(`I questioned ALL ${aliveRelations.length} people in my life with a mass reCAPTCHA audit. Every one of them proved their humanity!`);
    setQuestioningAll(false);
  };

  const handleExecutePerson = (rel: Relationship, method: string = 'Royal Guillotine') => {
    playClickSound();
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      relationships: prev.relationships.map((r) =>
        r.id === rel.id ? { ...r, alive: false } : r
      ),
      royalty: prev.royalty
        ? { ...prev.royalty, respect: clamp((prev.royalty.respect || 80) + 12) }
        : undefined,
      happiness: clamp(prev.happiness + 5),
    }));
    const royalTitle = character.royalty?.title || 'Sovereign Monarch';
    const text = `🪓 ROYAL EXECUTION! By Sovereign Decree of ${royalTitle} ${character.firstName}, your ${rel.relation.toLowerCase()} ${rel.name} was sentenced to death for High Treason against the Crown and executed by ${method}! As Sovereign, you possess absolute sovereign crime immunity!`;
    setFeedback(text);
    onAddLog(text);
    setSelectedPerson(null);
    setExecutingPerson(null);
  };

  const handleProposeMarriage = (rel: Relationship) => {
    playClickSound();
    if (rel.relationshipLevel > 70) {
      playSuccessSound();
      playCashSound();
      const existingSpouses = character.relationships.filter(
        (r) => r.alive && (r.relation === 'Husband' || r.relation === 'Wife')
      );
      const totalSpousesNow = existingSpouses.length + 1;
      const targetRelation = (rel.relation === 'Boyfriend' ? 'Husband' : 'Wife') as RelationType;

      onUpdateCharacter((prev) => ({
        ...prev,
        relationships: prev.relationships.map((r) =>
          r.id === rel.id
            ? {
                ...r,
                relation: targetRelation,
                relationshipLevel: 100,
              }
            : r
        ),
        happiness: clamp(prev.happiness + 35),
      }));

      const spouseText = totalSpousesNow > 1
        ? `💍 WEDDING BELLS! ${rel.name} said YES to becoming your ${targetRelation.toLowerCase()}! You now have ${totalSpousesNow} spouses (Multiple Wives/Husbands)!`
        : `💍 WEDDING BELLS! ${rel.name} said YES! You held a beautiful wedding ceremony and are now legally married!`;

      setFeedback(spouseText);
      onAddLog(totalSpousesNow > 1 ? `I took ${rel.name} as my new ${targetRelation.toLowerCase()} (Total Spouses: ${totalSpousesNow})!` : `I married ${rel.name}!`);
      setSelectedPerson(null);
    } else {
      playFailSound();
      setFeedback(`${rel.name} said it's too soon for marriage.`);
    }
  };

  const handleTryForBaby = (rel: Relationship) => {
    playClickSound();
    if (character.age < 18 || rel.age < 18 || character.age > 50) {
      setFeedback('You are not currently of suitable reproductive age (Adults 18+).');
      return;
    }
    const success = Math.random() < 0.65;
    if (success) {
      playSuccessSound();
      const childGender = Math.random() > 0.5 ? 'Son' : 'Daughter';
      const childName = `${childGender === 'Son' ? 'Liam' : 'Maya'} ${character.lastName}`;
      const newChild: Relationship = {
        id: 'rel_child_' + Date.now(),
        name: childName,
        relation: childGender,
        age: 0,
        alive: true,
        relationshipLevel: 100,
        smarts: randomInt(40, 90),
        looks: randomInt(40, 90),
        money: 0,
        occupation: 'Infant',
      };
      onUpdateCharacter((prev) => ({
        ...prev,
        relationships: [...prev.relationships, newChild],
        happiness: clamp(prev.happiness + 30),
      }));
      setFeedback(`👶 IT'S A BABY! You and ${rel.name} welcomed a beautiful ${childGender.toLowerCase()}, ${childName}, into the world!`);
      onAddLog(`My partner ${rel.name} and I had a ${childGender.toLowerCase()} named ${childName}.`);
    } else {
      setFeedback('You tried for a baby, but did not conceive this year.');
    }
  };

  const handleBreakup = (rel: Relationship) => {
    playClickSound();
    playFailSound();
    const isSpouse = rel.relation === 'Husband' || rel.relation === 'Wife';

    onUpdateCharacter((prev) => {
      let cash = prev.money;
      if (isSpouse) {
        // Divorce splits money
        cash = Math.round(cash * 0.5);
      }
      return {
        ...prev,
        money: cash,
        relationships: prev.relationships.filter((r) => r.id !== rel.id),
        happiness: clamp(prev.happiness - 20),
      };
    });

    if (isSpouse) {
      setFeedback(`DIVORCED! You separated from ${rel.name}. The divorce court split your marital liquid assets 50/50.`);
      onAddLog(`I divorced my spouse, ${rel.name}.`);
    } else {
      setFeedback(`You broke up with ${rel.name} and parted ways.`);
      onAddLog(`I broke up with ${rel.name}.`);
    }
    setSelectedPerson(null);
  };

  const getRelationEmoji = (r: RelationType) => {
    if (r === 'Mother' || r === 'Wife' || r === 'Girlfriend') return '👩';
    if (r === 'Father' || r === 'Husband' || r === 'Boyfriend') return '👨';
    if (r === 'Sister' || r === 'Daughter') return '👧';
    if (r === 'Brother' || r === 'Son') return '👦';
    return '🤝';
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pr-1">
      {/* Top Romance Trigger */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/80 to-purple-950/80 border border-pink-700/50 shadow-md flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-pink-300 flex items-center gap-1.5">
            <span>💘</span> Romance & Dating
          </h3>
          <p className="text-[11px] text-pink-200/80 mt-0.5">
            {character.age < 18 ? 'Locked for minors (Available at Age 18+)' : 'Find true love or a casual fling on the Love App.'}
          </p>
        </div>
        <button
          onClick={onOpenDatingModal}
          disabled={character.age < 18}
          className="px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
        >
          {character.age < 18 ? 'Locked (18+)' : 'Love App 💖'}
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-pink-500/50 text-xs text-pink-200 font-medium">
          {feedback}
        </div>
      )}

      {/* Question ALL People with reCAPTCHA */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-600/50 shadow-md flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
            <span>🛡️</span> Question ALL People with reCAPTCHA
          </h3>
          <p className="text-[11px] text-blue-200/80 mt-0.5">
            Verify every relationship in your circle. Question all {aliveRelations.length} people with a security check.
          </p>
        </div>
        <button
          onClick={() => {
            playClickSound();
            setQuestioningAll(true);
            setCaptchaVerifiedInTab(false);
          }}
          disabled={aliveRelations.length === 0}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] shrink-0 cursor-pointer"
        >
          Question ALL 🤖
        </button>
      </div>

      {/* Relationships Roster */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mb-3">
          <span>👥</span> Family & Friends ({aliveRelations.length})
        </h3>

        <div className="space-y-2">
          {aliveRelations.map((rel) => (
            <div
              key={rel.id}
              onClick={() => {
                playClickSound();
                setSelectedPerson(rel);
                setFeedback(null);
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRelationEmoji(rel.relation)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rel.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({rel.relation})</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Age {rel.age} · {rel.occupation}
                  </div>
                </div>
              </div>

              {/* Relationship Meter */}
              <div className="w-24 text-right">
                <div className="text-[10px] font-bold text-emerald-400 mb-0.5">
                  {rel.relationshipLevel}% ❤️
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${rel.relationshipLevel}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Person Interaction Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <div className="text-left">
                <h4 className="font-bold text-sm text-white">{selectedPerson.name}</h4>
                <div className="text-xs text-slate-400">
                  {selectedPerson.relation} · Age {selectedPerson.age}
                </div>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleSpendQualityTime(selectedPerson)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                Spend Quality Time 🎳
              </button>
              <button
                onClick={() => handleConverse(selectedPerson)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                Have a Conversation 💬
              </button>
              <button
                onClick={() => handleCompliment(selectedPerson)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                Give a Compliment ✨
              </button>
              <button
                onClick={() => handleAskForMoney(selectedPerson)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-emerald-400 border border-slate-700"
              >
                Ask for Money 💵
              </button>

              {/* Question this person with reCAPTCHA */}
              <button
                onClick={() => {
                  playClickSound();
                  setQuestioningPerson(selectedPerson);
                  setCaptchaVerifiedInTab(false);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-xs font-bold text-blue-300 border border-blue-600/60 shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🤖</span> Question with reCAPTCHA (Test Humanity)
              </button>

              {(selectedPerson.relation === 'Boyfriend' || selectedPerson.relation === 'Girlfriend') && (
                <button
                  onClick={() => handleProposeMarriage(selectedPerson)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow"
                >
                  Propose Marriage 💍
                </button>
              )}

              {(selectedPerson.relation === 'Husband' ||
                selectedPerson.relation === 'Wife' ||
                selectedPerson.relation === 'Boyfriend' ||
                selectedPerson.relation === 'Girlfriend') && (
                <>
                  <button
                    onClick={() => handleTryForBaby(selectedPerson)}
                    className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow"
                  >
                    Try to Have a Baby 👶
                  </button>
                  <button
                    onClick={() => handleBreakup(selectedPerson)}
                    className="w-full py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-xs font-bold text-red-200"
                  >
                    {selectedPerson.relation === 'Husband' || selectedPerson.relation === 'Wife'
                      ? 'File for Divorce ⚖️'
                      : 'Break Up 💔'}
                  </button>
                </>
              )}

              {/* EXECUTE ANYONE (EVEN YOUR OWN SISTER) */}
              <button
                onClick={() => {
                  playClickSound();
                  setExecutingPerson(selectedPerson);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-rose-900 to-red-800 hover:from-red-700 hover:to-rose-800 border border-red-500/80 text-xs font-black text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider transition-transform active:scale-95"
              >
                <span>🪓</span> Order Execution ({selectedPerson.relation})
              </button>

              <button
                onClick={() => handleInsult(selectedPerson)}
                className="w-full py-2 rounded-xl text-xs text-red-400 hover:text-red-300"
              >
                Insult Them 🤬
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Questioning Individual Person Modal */}
      {questioningPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-blue-500/80 shadow-2xl p-6 text-white text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-2xl mx-auto mb-3">
              🤖
            </div>

            <h3 className="text-base font-extrabold text-white">
              Questioning {questioningPerson.name}
            </h3>
            <p className="text-xs text-blue-300 font-medium mb-1">
              {questioningPerson.relation} · Age {questioningPerson.age}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You are questioning {questioningPerson.name} to confirm their identity. Have them solve the reCAPTCHA challenge below to verify they are a living human!
            </p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex flex-col items-center">
              <RecaptchaWidget
                isVerified={captchaVerifiedInTab}
                onVerify={() => {
                  setCaptchaVerifiedInTab(true);
                  setTimeout(() => {
                    handleVerifyPersonQuestioning(questioningPerson);
                  }, 400);
                }}
                onReset={() => setCaptchaVerifiedInTab(false)}
                promptTitle={`Verify ${questioningPerson.name}`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQuestioningPerson(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel Interrogation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question ALL People Modal */}
      {questioningAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-indigo-500/80 shadow-2xl p-6 text-white text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-2xl mx-auto mb-3">
              🛡️
            </div>

            <h3 className="text-base font-extrabold text-white">
              Question ALL People ({aliveRelations.length})
            </h3>
            <p className="text-xs text-indigo-300 font-semibold mb-1">
              Circle-Wide Humanity Audit
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Testing all your family members, friends, and partners with an official reCAPTCHA check. Clear the challenge to verify the entire inner circle at once!
            </p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex flex-col items-center">
              <RecaptchaWidget
                isVerified={captchaVerifiedInTab}
                onVerify={() => {
                  setCaptchaVerifiedInTab(true);
                  setTimeout(() => {
                    handleVerifyAllQuestioning();
                  }, 400);
                }}
                onReset={() => setCaptchaVerifiedInTab(false)}
                promptTitle="Mass Humanity Verification"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQuestioningAll(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Royal / Sovereign Execution Chamber Modal */}
      {executingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-red-600/80 shadow-2xl shadow-red-950/80 p-6 text-white text-center animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-500 flex items-center justify-center text-3xl mx-auto shadow-xl">
              🪓
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/50">
                Sovereign Death Warrant
              </span>
              <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight">
                Execute {executingPerson.name}
              </h3>
              <p className="text-xs text-red-300 font-semibold mt-0.5">
                Target: {executingPerson.relation} · Age {executingPerson.age}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                By sovereign authority, you can condemn anyone—including your own {executingPerson.relation.toLowerCase()}—to death for High Treason. Sovereign rulers possess absolute crime immunity!
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 text-left uppercase tracking-wider font-mono">
                Select Execution Method:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Royal Guillotine', icon: '🪓' },
                  { name: 'Palace Firing Squad', icon: '🎯' },
                  { name: 'Crocodile Moat', icon: '🐊' },
                  { name: 'Poisoned Goblet', icon: '🍷' },
                  { name: 'Feeding to Lions', icon: '🦁' },
                  { name: 'Headsman Decapitation', icon: '⚔️' },
                ].map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setExecMethod(m.name)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-1.5 cursor-pointer transition-all ${
                      execMethod === m.name
                        ? 'bg-red-950 border-red-500 text-white font-black shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="truncate text-[11px]">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleExecutePerson(executingPerson, execMethod)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-red-950/60 cursor-pointer transition-transform active:scale-95"
              >
                Condemn & Execute {executingPerson.name} 💀
              </button>

              <button
                type="button"
                onClick={() => setExecutingPerson(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Grant Sovereign Stay of Execution (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
