import React, { useState, useEffect } from 'react';
import { TIMEZONES, TimeZoneOption } from '../data/timezones';
import {
  getSelectedTimezone,
  setSelectedTimezone,
  getTimezoneMeta,
  formatTimeInZone,
  getTimezoneAbbreviation,
  formatDateInZone,
  getUtcOffsetString,
} from '../utils/timezone';
import { playClickSound, playSuccessSound } from '../utils/audio';

interface TimeZoneModalProps {
  onClose: () => void;
  onTimezoneChanged?: (newTz: string) => void;
}

type TabCategory =
  | 'ALL'
  | 'US'
  | 'CANADA'
  | 'MEXICO'
  | 'EUROPE'
  | 'ASIA'
  | 'AFRICA'
  | 'SOUTH_AMERICA'
  | 'OBSCURE';

export const TimeZoneModal: React.FC<TimeZoneModalProps> = ({
  onClose,
  onTimezoneChanged,
}) => {
  const [currentTz, setCurrentTz] = useState<string>(() => getSelectedTimezone());
  const [activeTab, setActiveTab] = useState<TabCategory>('US'); // US first by default!
  const [searchQuery, setSearchQuery] = useState('');
  const [liveNow, setLiveNow] = useState<Date>(new Date());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectZone = (tzId: string) => {
    playClickSound();
    playSuccessSound();
    setSelectedTimezone(tzId);
    setCurrentTz(tzId);
    if (onTimezoneChanged) {
      onTimezoneChanged(tzId);
    }
    const meta = getTimezoneMeta(tzId);
    setCopiedNotification(`Time zone set to ${meta.name}`);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 3000);
  };

  const currentMeta = getTimezoneMeta(currentTz);
  const currentTimeString = formatTimeInZone(liveNow, currentTz, true);
  const currentTzAbbr = getTimezoneAbbreviation(liveNow, currentTz);
  const currentDateString = formatDateInZone(liveNow, currentTz);
  const currentOffset = getUtcOffsetString(liveNow, currentTz);

  // Filter timezones
  const filteredZones = TIMEZONES.filter((tz) => {
    if (activeTab !== 'ALL' && tz.category !== activeTab) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tz.id.toLowerCase().includes(q) ||
      tz.name.toLowerCase().includes(q) ||
      tz.shortName.toLowerCase().includes(q) ||
      tz.location.toLowerCase().includes(q) ||
      (tz.notes && tz.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-xl shadow-inner shadow-cyan-500/20">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase font-sans">
                  Time Zone <span className="text-cyan-400">Selector</span>
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  Global Clock
                </span>
              </div>
              <p className="text-xs text-slate-400">
                US, Canada & Mexico first, plus obscure territories worldwide
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Live Active Timezone Display Card */}
        <div className="shrink-0 p-4 border-b border-slate-900 bg-slate-900/60">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl shrink-0 p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                {currentMeta.flag}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    Selected Zone
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                    {currentOffset || currentMeta.shortName}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">
                  {currentMeta.name}
                </h4>
                <div className="text-[11px] text-slate-400 truncate">
                  📍 {currentMeta.location}
                </div>
              </div>
            </div>

            {/* Live Clock Digit */}
            <div className="shrink-0 flex flex-col sm:items-end bg-slate-950/90 px-3 py-2 rounded-xl border border-cyan-500/20">
              <div className="text-xs font-semibold text-slate-400">
                {currentDateString}
              </div>
              <div className="text-xl font-mono font-black text-cyan-300 tracking-wider flex items-center gap-1">
                <span>{currentTimeString}</span>
                <span className="text-xs text-cyan-500">{currentTzAbbr}</span>
              </div>
            </div>
          </div>

          {copiedNotification && (
            <div className="mt-2 text-center text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 py-1 rounded-lg animate-in fade-in">
              ✓ {copiedNotification}
            </div>
          )}
        </div>

        {/* Search & Quick Pick Shortcuts */}
        <div className="shrink-0 p-3 bg-slate-950 border-b border-slate-900 space-y-2">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, country, island, timezone, or offset..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs: US, Canada & Mexico First! Then Europe, Asia, Africa, South America, Obscure! */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('US');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'US'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🇺🇸</span>
              <span>1. United States</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('CANADA');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CANADA'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🇨🇦</span>
              <span>2. Canada</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('MEXICO');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MEXICO'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🇲🇽</span>
              <span>3. Mexico</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('EUROPE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'EUROPE'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🇪🇺</span>
              <span>4. Europe</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('ASIA');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ASIA'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌏</span>
              <span>5. Asia</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('AFRICA');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'AFRICA'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌍</span>
              <span>6. Africa</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('SOUTH_AMERICA');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SOUTH_AMERICA'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌎</span>
              <span>7. South America</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('OBSCURE');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'OBSCURE'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30 animate-pulse'
                  : 'bg-gradient-to-r from-amber-950/70 to-purple-950/70 hover:from-amber-900 hover:to-purple-900 text-amber-300 border border-amber-500/40'
              }`}
              title="Remote islands, 45-minute offsets, Antarctic stations, and points in the middle of nowhere"
            >
              <span>🏝️</span>
              <span>8. Middle of Nowhere</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌐</span>
              <span>All ({TIMEZONES.length})</span>
            </button>
          </div>
        </div>

        {/* List of Timezones */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2">
          {activeTab === 'OBSCURE' && (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs mb-3 flex items-start gap-2.5">
              <span className="text-xl shrink-0">🏝️</span>
              <div>
                <strong className="text-amber-300 font-bold block">
                  The Obscure Ones in the Middle of Nowhere
                </strong>
                Explore unique 45-minute and 30-minute offsets, sub-Antarctic research outposts, isolated Pacific coral atolls, and the most remote inhabited islands on planet Earth!
              </div>
            </div>
          )}

          {filteredZones.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-bold text-sm">No timezones match "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for a different region or switch tabs.</p>
            </div>
          ) : (
            filteredZones.map((tz) => {
              const isSelected = currentTz === tz.id;
              const zoneTime = formatTimeInZone(liveNow, tz.id, false);
              const zoneAbbr = getTimezoneAbbreviation(liveNow, tz.id);

              return (
                <div
                  key={tz.id}
                  onClick={() => handleSelectZone(tz.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-900/70 hover:bg-slate-850 hover:border-slate-700 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 w-8 text-center">
                      {tz.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300">
                          {tz.name}
                        </span>
                        {tz.highlight && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                            Quirky Offset
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold uppercase">
                            ✓ Active
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-slate-300 font-mono text-[11px]">
                          {tz.shortName}
                        </span>
                        <span>•</span>
                        <span className="truncate">{tz.location}</span>
                      </div>

                      {tz.notes && (
                        <div className="text-[11px] text-cyan-400/90 mt-1 italic">
                          💡 {tz.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time preview badge */}
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-mono font-black text-cyan-300">
                      {zoneTime}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {zoneAbbr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 border-t border-slate-900 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>💾</span>
            <span>Automatically saves to your profile and streak calendar</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/30 transition-transform active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
