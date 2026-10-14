import React, { useState } from 'react';
import { EventDefinition } from '../data/randomEvents';
import { Character } from '../types/bitlife';
import { playClickSound } from '../utils/audio';

interface LifeEventModalProps {
  event: EventDefinition;
  character: Character;
  onResolve: (outcome: ReturnType<EventDefinition['options'][0]['action']>) => void;
}

export const LifeEventModal: React.FC<LifeEventModalProps> = ({
  event,
  character,
  onResolve,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<ReturnType<EventDefinition['options'][0]['action']> | null>(null);

  const handleChoose = (opt: EventDefinition['options'][0]) => {
    playClickSound();
    const outcome = opt.action(character);
    setSelectedOutcome(outcome);
  };

  const handleDismiss = () => {
    if (selectedOutcome) {
      onResolve(selectedOutcome);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center">
        {!selectedOutcome ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
              {event.icon || '⚡'}
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-2">{event.title}</h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-5 text-left bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {event.prompt}
            </p>

            <div className="space-y-2">
              {event.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoose(opt)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold text-left border border-slate-700/60 transition-all active:scale-[0.99] flex items-center justify-between"
                >
                  <span>{opt.text}</span>
                  <span className="text-slate-500 ml-2">›</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mx-auto shadow-inner">
              📢
            </div>

            <h4 className="text-sm font-bold text-amber-400">What Happened</h4>

            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left">
              {selectedOutcome.outcomeText}
            </p>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
