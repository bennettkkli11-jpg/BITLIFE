import React, { useState } from 'react';
import { Relationship, SexualOrientation } from '../../types/bitlife';
import { MALE_NAMES, FEMALE_NAMES, SURNAMES } from '../../data/names';
import { CELEBRITIES, Celebrity } from '../../data/celebrities';
import { pickRandom, randomInt, clamp } from '../../utils/lifeEngine';
import { playClickSound, playSuccessSound, playFailSound } from '../../utils/audio';

interface DatingModalProps {
  playerAge: number;
  playerLooks: number;
  playerSmarts: number;
  playerGender?: 'Male' | 'Female' | 'Non-Binary';
  orientation: SexualOrientation;
  currencySymbol: string;
  onNewPartner: (partner: Relationship, isCelebrity?: boolean) => void;
  onClose: () => void;
}

interface Candidate {
  name: string;
  age: number;
  relationType: 'Boyfriend' | 'Girlfriend';
  occupation: string;
  looks: number;
  smarts: number;
  money: number;
  isCelebrity?: boolean;
  avatar?: string;
}

export const DatingModal: React.FC<DatingModalProps> = ({
  playerAge,
  playerLooks,
  playerSmarts,
  playerGender = 'Male',
  orientation,
  currencySymbol,
  onNewPartner,
  onClose,
}) => {
  if (playerAge < 18) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-pink-900/60 shadow-2xl p-6 text-white text-center space-y-3">
          <div className="text-3xl">🚸</div>
          <h3 className="text-base font-bold text-pink-400">Underage Notice</h3>
          <p className="text-xs text-zinc-300">
            You are currently {playerAge} years old. Just like crime, dating is strictly prohibited for minors! Focus on your education until age 18.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const generateCandidate = (): Candidate => {
    // 20% chance of encountering a VIP celebrity match (DJT, Bezos, Sundar Pichai, Muhammed bin Salmad, etc.)
    if (Math.random() < 0.25) {
      const celeb = pickRandom(CELEBRITIES);
      let isMale = celeb.id !== 'taylor_swift';
      // Muhammed bin Salmad is female/male depending on gender
      if (celeb.id === 'muhammed_bin_salmad') {
        isMale = playerGender === 'Female';
      }

      return {
        name: celeb.name,
        age: randomInt(32, 65),
        relationType: isMale ? 'Boyfriend' : 'Girlfriend',
        occupation: celeb.title,
        looks: celeb.looks,
        smarts: celeb.smarts,
        money: celeb.netWorth > 1000000000 ? 50000000 : 5000000,
        isCelebrity: true,
        avatar: celeb.avatar,
      };
    }

    let isMale = true;
    if (orientation === 'Straight') {
      isMale = playerGender === 'Female';
    } else if (orientation === 'Gay') {
      isMale = playerGender === 'Male';
    } else {
      isMale = Math.random() > 0.5;
    }

    const firstName = isMale ? pickRandom(MALE_NAMES) : pickRandom(FEMALE_NAMES);
    const lastName = pickRandom(SURNAMES);
    const age = clamp(playerAge + randomInt(-3, 4), 18, 95);
    const occupation = pickRandom([
      'Architect',
      'Veterinarian',
      'Software Engineer',
      'High School Teacher',
      'Personal Trainer',
      'Graphic Designer',
      'Barista',
      'Photographer',
      'Nurse',
      'Financial Advisor',
    ]);

    return {
      name: `${firstName} ${lastName}`,
      age,
      relationType: isMale ? 'Boyfriend' : 'Girlfriend',
      occupation,
      looks: randomInt(40, 95),
      smarts: randomInt(40, 95),
      money: randomInt(5000, 75000),
      isCelebrity: false,
    };
  };

  const [candidate, setCandidate] = useState<Candidate>(generateCandidate);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [goingSteadyPrompt, setGoingSteadyPrompt] = useState<Relationship | null>(null);

  const handleAskOut = () => {
    playClickSound();

    // STRICT USER REQUIREMENT: REJECT if no high looks, smarts
    const hasHighLooksAndSmarts = playerLooks >= 70 && playerSmarts >= 70;
    if (!hasHighLooksAndSmarts) {
      playFailSound();
      setFeedback(
        `REJECTED! ${candidate.name} looked you up and down with disappointment: "I only date people who have both high looks and high smarts. You don't meet my standards!"`
      );
      return;
    }

    // Acceptance check based on compatibility
    const requiredScore = candidate.isCelebrity ? 65 : 55;
    const accepted = playerLooks >= requiredScore || Math.random() < 0.65;

    if (accepted) {
      playSuccessSound();
      const newPartner: Relationship = {
        id: 'rel_partner_' + Date.now(),
        name: candidate.name,
        relation: candidate.relationType,
        age: candidate.age,
        alive: true,
        relationshipLevel: randomInt(75, 95),
        smarts: candidate.smarts,
        looks: candidate.looks,
        money: candidate.money,
        occupation: candidate.occupation,
      };
      setGoingSteadyPrompt(newPartner);
    } else {
      playFailSound();
      setFeedback(
        candidate.isCelebrity
          ? `${candidate.name} declined with high-society charm: "My schedule between boardrooms and international galas is simply too packed for romance."`
          : `${candidate.name} politely rejected your advance. "Sorry, I just don't feel that spark between us."`
      );
    }
  };

  const refreshCandidate = () => {
    playClickSound();
    setCandidate(generateCandidate());
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-pink-700/60 shadow-2xl p-6 text-white text-center">
        <div className="flex items-center justify-between pb-3 border-b border-pink-900/40 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💘</span>
            <h3 className="text-base font-bold text-pink-400">BitLife Love App</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Candidate Card */}
        <div
          className={`p-4 rounded-xl border text-left mb-4 space-y-3 transition-all ${
            candidate.isCelebrity
              ? 'bg-gradient-to-b from-amber-950/40 to-slate-950 border-amber-500/60 shadow-md'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-base text-white truncate">{candidate.name}</h4>
                {candidate.isCelebrity && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase tracking-wider">
                    VIP Titan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Age {candidate.age} · {candidate.occupation}
              </p>
            </div>
            <div className="text-3xl shrink-0">
              {candidate.avatar || (candidate.relationType === 'Boyfriend' ? '👨' : '👩')}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-850 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Looks</span>
                <span className="font-bold text-pink-400">{candidate.looks}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${candidate.looks}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Smarts</span>
                <span className="font-bold text-cyan-400">{candidate.smarts}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${candidate.smarts}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Net Worth</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {currencySymbol}{candidate.money.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 mb-4 leading-relaxed">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={refreshCandidate}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Swipe Next ➡️
          </button>
          <button
            onClick={handleAskOut}
            className="py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-lg cursor-pointer"
          >
            Ask Out on Date 💕
          </button>
        </div>

        {/* PROMPT: GOING STEADY */}
        {goingSteadyPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-pink-950 via-slate-950 to-slate-900 border-2 border-pink-500 p-6 text-white text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="text-4xl animate-bounce">💖</div>
              <h3 className="text-lg font-black text-pink-300">Going Steady</h3>
              <p className="text-sm font-semibold text-pink-100 leading-relaxed bg-pink-900/30 p-3 rounded-xl border border-pink-700/50">
                Going Steady. You are now dating <span className="text-amber-300 font-bold">{goingSteadyPrompt.name}</span>.
              </p>
              <button
                onClick={() => {
                  playClickSound();
                  onNewPartner(goingSteadyPrompt, candidate.isCelebrity);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl cursor-pointer transition-transform active:scale-95"
              >
                Continue 💕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
