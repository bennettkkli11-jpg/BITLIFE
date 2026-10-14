import React, { useState } from 'react';
import { Disease } from '../../types/bitlife';
import { playCashSound, playFailSound, playSuccessSound, playClickSound } from '../../utils/audio';

interface DoctorModalProps {
  playerCash: number;
  playerAge?: number;
  currencySymbol: string;
  diseases: Disease[];
  onCureDisease: (diseaseId: string, cost: number) => void;
  onBotchedSurgery: (damageLooks: number, cost: number) => void;
  onSuccessfulSurgery: (bonusLooks: number, cost: number) => void;
  onWitchDoctorResult: (healed: boolean, cost: number, message: string) => void;
  onClose: () => void;
}

type DoctorTab = 'GENERAL' | 'SURGERY' | 'WITCH';

export const DoctorModal: React.FC<DoctorModalProps> = ({
  playerCash,
  playerAge = 18,
  currencySymbol,
  diseases,
  onCureDisease,
  onBotchedSurgery,
  onSuccessfulSurgery,
  onWitchDoctorResult,
  onClose,
}) => {
  const [tab, setTab] = useState<DoctorTab>('GENERAL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const SURGERIES = [
    { name: 'Botox Injections', cost: 850, boost: 8, botchRisk: 0.1 },
    { name: 'Rhinoplasty (Nose Job)', cost: 4500, boost: 20, botchRisk: 0.15 },
    { name: 'Full Facelift', cost: 7200, boost: 28, botchRisk: 0.2 },
    { name: 'Tummy Tuck', cost: 5800, boost: 18, botchRisk: 0.15 },
    { name: 'Veneers & Hollywood Smile', cost: 3500, boost: 15, botchRisk: 0.08 },
  ];

  const handleTreatDisease = (d: Disease) => {
    if (playerCash < d.costToCure) {
      setFeedback('You do not have enough money for this medical treatment.');
      return;
    }
    playClickSound();
    playSuccessSound();
    onCureDisease(d.id, d.costToCure);
    setFeedback(`The medical doctor successfully treated your ${d.name}!`);
  };

  const handleSurgery = (surgery: (typeof SURGERIES)[0]) => {
    if (playerAge < 18) {
      setFeedback('You must be at least 18 years old to undergo cosmetic plastic surgery.');
      return;
    }
    if (playerCash < surgery.cost) {
      setFeedback('Insufficient funds for this cosmetic procedure.');
      return;
    }
    playClickSound();
    const botch = Math.random() < surgery.botchRisk;
    if (botch) {
      playFailSound();
      onBotchedSurgery(30, surgery.cost);
      setFeedback(`DISASTER! The surgeon botched your ${surgery.name}! Your face was distorted and your looks plummeted!`);
    } else {
      playSuccessSound();
      onSuccessfulSurgery(surgery.boost, surgery.cost);
      setFeedback(`STUNNING SUCCESS! The ${surgery.name} was immaculate! You look radiant (+${surgery.boost} Looks)!`);
    }
  };

  const handleWitchDoctor = () => {
    const cost = 250;
    if (playerCash < cost) {
      setFeedback('You cannot afford the witch doctor fee.');
      return;
    }
    playClickSound();
    const heal = Math.random() < 0.45;
    if (heal) {
      playSuccessSound();
      onWitchDoctorResult(true, cost, 'The witch doctor chanted ancient incantations and your spirit was cleansed! All ailments alleviated!');
      setFeedback('Miraculous recovery through alternative mysticism!');
    } else {
      playFailSound();
      onWitchDoctorResult(false, cost, 'The witch doctor fed you mashed caterpillar mush. You developed horrific abdominal spasms!');
      setFeedback('The witch doctor remedy made your health worse!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <span>🏥</span> Healthcare & Wellness
          </h3>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800">
            Close
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4">
          <button
            onClick={() => {
              playClickSound();
              setTab('GENERAL');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'GENERAL' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Medical Clinic
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTab('SURGERY');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'SURGERY' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plastic Surgery
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTab('WITCH');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'WITCH' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Witch Doctor
          </button>
        </div>

        {feedback && (
          <div className="mb-4 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
            {feedback}
          </div>
        )}

        {/* Tab 1: General Doctor */}
        {tab === 'GENERAL' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Consult Dr. Kimberly Adams at General Hospital for certified medical treatments.
            </p>
            {diseases.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-2xl">🩺</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">You have no diagnosed medical conditions right now. Healthy as a horse!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diseases.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-red-400">{d.name}</div>
                      <div className="text-[11px] text-slate-400">{d.description}</div>
                    </div>
                    <button
                      onClick={() => handleTreatDisease(d)}
                      disabled={playerCash < d.costToCure}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shrink-0 ml-2 shadow"
                    >
                      Cure ({currencySymbol}{d.costToCure})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Plastic Surgery */}
        {tab === 'SURGERY' && (
          <div className="space-y-2.5">
            {playerAge < 18 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <span className="text-3xl">🚸</span>
                <p className="text-xs text-pink-300 font-semibold">
                  Cosmetic surgery is restricted to adults (Age 18+).
                </p>
                <p className="text-[11px] text-slate-400">
                  You are currently {playerAge} years old. Come back when you are an adult!
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-pink-300/90">
                  Board-certified Beverly Hills cosmetic surgeons. Beware: procedures can botch!
                </p>
                {SURGERIES.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-pink-300">{s.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Expected boost: +{s.boost} Looks · Risk: {Math.round(s.botchRisk * 100)}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleSurgery(s)}
                      disabled={playerCash < s.cost}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold shrink-0 shadow"
                    >
                      {currencySymbol}{s.cost.toLocaleString()}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Witch Doctor */}
        {tab === 'WITCH' && (
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center space-y-3">
            <div className="text-3xl">🔮</div>
            <h4 className="text-sm font-bold text-purple-300">Baba Yaga’s Herbal Hut</h4>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              For only {currencySymbol}250, the witch doctor will prepare a concoction of dried scorpions, toad slime, and sacred herbs. It might cure you completely... or violently poison you!
            </p>
            <button
              onClick={handleWitchDoctor}
              disabled={playerCash < 250}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg"
            >
              Drink Concoction ({currencySymbol}250)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
