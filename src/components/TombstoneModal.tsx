import React from 'react';
import { Character, RibbonType } from '../types/bitlife';
import { calculateNetWorth } from '../utils/lifeEngine';

interface TombstoneModalProps {
  character: Character;
  onStartNewLife: () => void;
  onRestartSameCharacter: () => void;
  onOpenCemetery: () => void;
}

const RIBBON_COLORS: Record<RibbonType, { bg: string; text: string; icon: string }> = {
  Loaded: { bg: 'bg-emerald-500', text: 'text-emerald-950', icon: '💰' },
  Rich: { bg: 'bg-green-500', text: 'text-green-950', icon: '💵' },
  Hero: { bg: 'bg-blue-500', text: 'text-blue-950', icon: '🦸' },
  Wicked: { bg: 'bg-red-600', text: 'text-white', icon: '😈' },
  Scandalous: { bg: 'bg-orange-500', text: 'text-orange-950', icon: '🔥' },
  Jailbird: { bg: 'bg-zinc-700', text: 'text-white', icon: '⛓️' },
  Academic: { bg: 'bg-indigo-500', text: 'text-indigo-950', icon: '🎓' },
  Geriatric: { bg: 'bg-amber-400', text: 'text-amber-950', icon: '⏳' },
  'High Roller': { bg: 'bg-purple-500', text: 'text-purple-950', icon: '🎲' },
  Fertile: { bg: 'bg-rose-400', text: 'text-rose-950', icon: '👶' },
  Famous: { bg: 'bg-yellow-400', text: 'text-yellow-950', icon: '⭐' },
  Globetrotter: { bg: 'bg-teal-500', text: 'text-teal-950', icon: '✈️' },
  Unlucky: { bg: 'bg-slate-500', text: 'text-white', icon: '🌧️' },
  Catanic: { bg: 'bg-cyan-500', text: 'text-cyan-950', icon: '🐱' },
  Monarch: { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-amber-950', icon: '👑' },
  Presidential: { bg: 'bg-gradient-to-r from-blue-600 to-indigo-700', text: 'text-white', icon: '🦅' },
  Mediocre: { bg: 'bg-slate-400', text: 'text-slate-950', icon: '😐' },
};

export const TombstoneModal: React.FC<TombstoneModalProps> = ({
  character,
  onStartNewLife,
  onRestartSameCharacter,
  onOpenCemetery,
}) => {
  const netWorth = calculateNetWorth(character);
  const ribbon = character.ribbon || 'Mediocre';
  const ribbonInfo = RIBBON_COLORS[ribbon] || RIBBON_COLORS.Mediocre;

  const childrenCount = character.relationships.filter(
    (r) => r.relation === 'Son' || r.relation === 'Daughter'
  ).length;

  const loversCount = character.relationships.filter(
    (r) =>
      r.relation === 'Boyfriend' ||
      r.relation === 'Girlfriend' ||
      r.relation === 'Husband' ||
      r.relation === 'Wife'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center relative overflow-hidden">
        {/* Ribbon Banner */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md bg-white/10 border border-white/20">
          <span>{ribbonInfo.icon}</span>
          <span className="text-amber-300">{ribbon}</span>
        </div>

        {/* Stone Tombstone Icon / Shape */}
        <div className="mt-4 mb-3 mx-auto w-36 h-44 rounded-t-full bg-gradient-to-b from-stone-400 via-stone-500 to-stone-700 border-4 border-stone-300 shadow-2xl flex flex-col items-center justify-center p-3 text-stone-900">
          <div className="text-xs font-serif font-black tracking-widest uppercase text-stone-800">
            R. I. P.
          </div>
          <div className="w-8 h-0.5 bg-stone-700 my-1 rounded" />
          <div className="text-sm font-bold text-center leading-tight">
            {character.firstName}
            <br />
            {character.lastName}
          </div>
          <div className="text-[11px] font-mono font-semibold text-stone-800 mt-1">
            Age {character.age}
          </div>
          <div className="text-[10px] text-stone-800 text-center mt-1 px-1 line-clamp-2 italic">
            "{character.epitaph || 'Departed in peace'}"
          </div>
        </div>

        {/* Cause of Death */}
        <div className="text-xs text-red-400 font-semibold mb-3">
          Cause of Death: {character.causeOfDeath || 'Old age and peaceful departure'}
        </div>

        {/* Life Stats Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs mb-5">
          <div>
            <div className="text-[10px] text-slate-400">Net Worth</div>
            <div className="font-bold text-emerald-400 truncate">
              {character.currencySymbol}{netWorth.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Lovers</div>
            <div className="font-bold text-pink-400">{loversCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Children</div>
            <div className="font-bold text-blue-400">{childrenCount}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onStartNewLife}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-[0.98]"
          >
            Start a New Life
          </button>
          <button
            onClick={onRestartSameCharacter}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Try Again as {character.firstName}
          </button>
          <button
            onClick={onOpenCemetery}
            className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
          >
            Visit Cemetery & Hall of Fame 🪦
          </button>
        </div>
      </div>
    </div>
  );
};
