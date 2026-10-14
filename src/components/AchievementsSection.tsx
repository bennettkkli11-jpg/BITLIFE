import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Character } from '../types/bitlife';
import { ACHIEVEMENTS, AchievementItem } from '../data/achievements';
import { playClickSound, playJackpotFanfare } from '../utils/audio';

interface AchievementsSectionProps {
  character: Character;
}

type CategoryFilter = 'All' | 'Wealth' | 'Crime' | 'Career' | 'Life' | 'Gambling' | 'Secret';

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ character }) => {
  const [filter, setFilter] = useState<CategoryFilter>('All');

  const unlockedCount = ACHIEVEMENTS.filter((a) => {
    const val = a.getCurrentValue(character);
    return val >= a.targetValue || character.unlockedAchievements?.includes(a.id);
  }).length;

  const totalCount = ACHIEVEMENTS.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  const isGodOfEverythingUnlocked =
    character.unlockedAchievements?.includes('secret_god_of_everything');

  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => filter === 'All' || a.category === filter
  );

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3.5">
      {/* Header and Summary */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <span>🏆</span> Achievements & Milestones
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {unlockedCount} / {totalCount} ({percentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 🌟 THE SPECIAL ONE FOR EVERYTHING: PANTHEON PODIUM 🌟 */}
      {isGodOfEverythingUnlocked ? (
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-950/90 via-purple-950 to-indigo-950 border-2 border-amber-400 shadow-2xl space-y-2 ring-2 ring-amber-400/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-bounce">🌌</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow">
                    ★ 100% MASTER OF EVERYTHING ★
                  </span>
                  <span className="text-amber-400 text-xs">✨✨✨</span>
                </div>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide mt-0.5">
                  The Omnipotent God of BitLife
                </h4>
              </div>
            </div>
            <button
              onClick={() => {
                playJackpotFanfare();
                try {
                  confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
                } catch {}
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 text-xs font-black shadow-lg cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              🎉 Celebrate!
            </button>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-snug">
            You unlocked every single achievement in the game! You reign supreme across wealth, politics, royalty, crime, and all destinies!
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-3 bg-gradient-to-r from-slate-950 via-purple-950/50 to-slate-950 border border-purple-700/50 flex items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl p-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40">
              🌌
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                  Special Grand Achievement
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {unlockedCount} / {totalCount - 1} Complete
                </span>
              </div>
              <h5 className="font-bold text-white text-xs truncate">
                The Omnipotent God (Master of Everything)
              </h5>
              <p className="text-[11px] text-slate-400 truncate">
                Unlock all {totalCount - 1} other achievements to awaken this ultimate secret!
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/70 border border-purple-500/50 text-purple-200 text-[10px] font-black uppercase">
              {percentage}%
            </span>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
        {(['All', 'Wealth', 'Crime', 'Career', 'Life', 'Gambling', 'Secret'] as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playClickSound();
              setFilter(cat);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
              filter === cat
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
            }`}
          >
            {cat === 'Secret' ? '🔮 Secret' : cat}
          </button>
        ))}
      </div>

      {/* List of Achievement Cards */}
      <div className="space-y-2">
        {filteredAchievements.map((item) => {
          const currentVal = item.getCurrentValue(character);
          const isUnlocked =
            currentVal >= item.targetValue || character.unlockedAchievements?.includes(item.id);
          const progressPercent = Math.min(100, Math.round((Math.max(0, currentVal) / item.targetValue) * 100));

          const displayCurrent = item.formatValue
            ? item.formatValue(currentVal)
            : `${currentVal}`;
          const displayTarget = item.formatValue
            ? item.formatValue(item.targetValue)
            : `${item.targetValue} ${item.unit || ''}`;

          const isSecretLocked = item.isSecret && !isUnlocked;
          const isUltimate = item.isUltimate;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all text-xs ${
                isUnlocked
                  ? isUltimate
                    ? 'bg-gradient-to-r from-purple-950/70 via-amber-950/60 to-indigo-950 border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/30'
                    : item.isSecret
                    ? 'bg-gradient-to-r from-purple-950/40 via-amber-950/30 to-slate-950 border-purple-500/60 shadow-md ring-1 ring-purple-500/20'
                    : 'bg-amber-950/20 border-amber-500/40 shadow-xs'
                  : isUltimate
                  ? 'bg-gradient-to-r from-purple-950/30 via-slate-950 to-purple-950/20 border-2 border-dashed border-purple-600/60 shadow'
                  : isSecretLocked
                  ? 'bg-purple-950/10 border-purple-900/30 opacity-70'
                  : 'bg-slate-950/70 border-slate-850 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                    isUnlocked
                      ? isUltimate
                        ? 'bg-amber-400/20 border-amber-300 text-amber-300 shadow-lg'
                        : item.isSecret
                        ? 'bg-purple-500/20 border-purple-400/80 text-purple-300'
                        : 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                      : isUltimate
                      ? 'bg-purple-950/40 border-purple-600/70 text-purple-300 animate-pulse'
                      : isSecretLocked
                      ? 'bg-purple-950/30 border-purple-800/40 text-purple-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {isSecretLocked && !isUltimate ? '🔒' : item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-bold truncate ${
                        isUnlocked
                          ? isUltimate
                            ? 'text-amber-300 font-black tracking-wide'
                            : item.isSecret
                            ? 'text-purple-300'
                            : 'text-amber-300'
                          : isUltimate
                          ? 'text-purple-300 font-extrabold'
                          : isSecretLocked
                          ? 'text-purple-400 italic'
                          : 'text-slate-200'
                      }`}
                    >
                      {isSecretLocked && !isUltimate
                        ? '??? Secret Achievement'
                        : isSecretLocked && isUltimate
                        ? '🌌 ??? The Special Achievement: Master of Everything'
                        : item.title}
                    </h4>
                    {isUnlocked ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 border ${
                        isUltimate
                          ? 'text-amber-200 bg-amber-950/90 border-amber-400 font-black shadow'
                          : item.isSecret
                          ? 'text-purple-300 bg-purple-950/80 border-purple-600/70'
                          : 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60'
                      }`}>
                        {isUltimate ? '★ 100% MASTER ★' : 'Unlocked ✅'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {displayCurrent} / {displayTarget}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isSecretLocked && isUltimate
                      ? 'Special mystery achievement! Unlock every other achievement in BitLife to earn the ultimate title.'
                      : isSecretLocked
                      ? 'Hidden secret! Unlock other achievements across life to reveal and claim this milestone.'
                      : item.description}
                  </p>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked
                          ? isUltimate
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500'
                            : item.isSecret
                            ? 'bg-gradient-to-r from-purple-500 to-amber-400'
                            : 'bg-amber-400'
                          : isUltimate
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-500'
                          : isSecretLocked
                          ? 'bg-purple-700/60'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
