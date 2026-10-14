import React, { useState, useEffect } from 'react';
import { Character, DailyStreakData, DailyStreakReward } from '../types/bitlife';
import {
  DAILY_REWARDS_LADDER,
  getDailyStreakData,
  isDailyRewardClaimable,
  claimDailyReward,
  getTimeUntilNextReset,
} from '../utils/dailyStreak';
import { getSelectedTimezone, getTimezoneMeta, formatTimeInZone } from '../utils/timezone';
import { playCashSound, playClickSound, playSuccessSound } from '../utils/audio';

interface DailyStreakModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onClose: () => void;
  onOpenTimeZone?: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onClose,
  onOpenTimeZone,
}) => {
  const [streakData, setStreakData] = useState<DailyStreakData>(getDailyStreakData());
  const [claimable, setClaimable] = useState<boolean>(isDailyRewardClaimable());
  const [countdown, setCountdown] = useState(getTimeUntilNextReset());
  const [justClaimedReward, setJustClaimedReward] = useState<DailyStreakReward | null>(null);
  const [claimedBonuses, setClaimedBonuses] = useState<string[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Live timer for midnight countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextReset());
      setClaimable(isDailyRewardClaimable());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = () => {
    if (!claimable || isClaiming) return;
    setIsClaiming(true);
    playClickSound();

    try {
      const { updatedCharacter, reward, updatedStreak, bonusSummary } = claimDailyReward(character);
      onUpdateCharacter(() => updatedCharacter);
      setStreakData(updatedStreak);
      setClaimable(false);
      setJustClaimedReward(reward);
      setClaimedBonuses(bonusSummary);

      playSuccessSound();
      playCashSound();

      // Log in character chronicle
      const logText = `🔥 DAILY STREAK BONUS (Day ${reward.day}): Claimed ${character.currencySymbol}${reward.cashBonus.toLocaleString()}, ${bonusSummary.join(', ')}. Login streak reached ${updatedStreak.currentStreak} days!`;
      onAddLog(logText);
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const currentCycleDay = streakData.streakCycleDay;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-750 shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Flame Banner */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-b from-amber-950/60 via-red-950/40 to-slate-900 border-b border-slate-800">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-pulse">🔥</span>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Daily Streak Rewards
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    Day {streakData.currentStreak}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Return every 24 hours to multiply cash, stats & special items!
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current</div>
              <div className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                <span>🔥</span> {streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day' : 'Days'}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Best Streak</div>
              <div className="text-sm font-black text-yellow-300 flex items-center justify-center gap-1">
                <span>⭐</span> {streakData.longestStreak} Days
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center" title="Freezes protect against missing a day">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Freeze Shields</div>
              <div className="text-sm font-black text-cyan-300 flex items-center justify-center gap-1">
                <span>🛡️</span> {streakData.freezeTokens}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: Scrollable Reward Track */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3">
          
          {/* Claim celebration alert */}
          {justClaimedReward && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/70 shadow-lg text-emerald-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-300 mb-1">
                <span>🎉</span> Reward Claimed Successfully!
              </div>
              <div className="text-xs space-y-0.5">
                {claimedBonuses.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-400">✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>7-Day Reward Ladder</span>
            <span className="text-[10px] text-amber-400 font-normal">Cycles weekly</span>
          </div>

          {/* 7 Cards Roadmap */}
          <div className="space-y-2">
            {DAILY_REWARDS_LADDER.map((item) => {
              const isToday = item.day === currentCycleDay;
              const isClaimedToday = isToday && !claimable;
              const isPastDay = item.day < currentCycleDay;
              const isFutureDay = item.day > currentCycleDay;

              return (
                <div
                  key={item.day}
                  className={`p-3 rounded-2xl transition-all border flex items-center justify-between ${
                    isToday
                      ? claimable
                        ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-red-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.01]'
                        : 'bg-emerald-950/30 border-emerald-500/50 text-slate-200'
                      : isPastDay
                      ? 'bg-slate-950/60 border-slate-850 opacity-70'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isPastDay || isClaimedToday
                          ? 'bg-emerald-600 text-white'
                          : isToday
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPastDay || isClaimedToday ? '✓' : `D${item.day}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black truncate text-white">
                          {item.title}
                        </span>
                        {item.highlight && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                            SPECIAL
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-bold text-emerald-400 font-mono mt-0.5">
                        +{character.currencySymbol}{item.cashBonus.toLocaleString()}
                        {item.specialItem && (
                          <span className="text-amber-300 font-sans ml-1.5">
                            · {item.specialItem.icon} {item.specialItem.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right pl-2">
                    {isClaimedToday ? (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 font-bold">
                        Claimed
                      </span>
                    ) : isToday ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black animate-pulse shadow">
                        TODAY
                      </span>
                    ) : isPastDay ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streak Freeze & Lore Card */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <div>
                <div className="font-bold text-cyan-300">Streak Protection Active</div>
                <div className="text-[10px] text-slate-400">
                  {streakData.freezeTokens > 0
                    ? `You have ${streakData.freezeTokens} Freeze Shield(s). If you miss 1 day, your streak will be protected!`
                    : 'No freeze shields currently. Log in daily or unlock more on Days 3 & 6!'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Strip */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2.5">
          {/* Timezone banner */}
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span>🌐</span>
              <span className="truncate">
                Timezone: <strong className="text-cyan-300 font-bold">{getTimezoneMeta(getSelectedTimezone()).name.split('(')[0]}</strong>
              </span>
            </div>
            {onOpenTimeZone && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenTimeZone();
                }}
                className="shrink-0 text-cyan-400 hover:text-cyan-300 font-bold hover:underline ml-2"
              >
                Change ➔
              </button>
            )}
          </div>

          {claimable ? (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="text-base">🎁</span>
              <span>{isClaiming ? 'Claiming Reward...' : `CLAIM DAY ${currentCycleDay} REWARD`}</span>
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Today's Reward Claimed
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Next reward in: {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.minutes).padStart(2, '0')}:
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
              </div>

              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
