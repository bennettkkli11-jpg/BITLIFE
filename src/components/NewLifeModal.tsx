import React, { useState } from 'react';
import { Gender } from '../types/bitlife';
import { COUNTRIES } from '../data/countries';
import { playClickSound } from '../utils/audio';

interface NewLifeModalProps {
  onStartRandom: () => void;
  onStartCustom: (custom: {
    firstName: string;
    lastName: string;
    gender: Gender;
    countryName: string;
    cityName?: string;
    bornRoyal?: boolean;
    specialCelebrity?: 'donald_trump' | 'elon_musk';
  }) => void;
  onClose: () => void;
}

export const NewLifeModal: React.FC<NewLifeModalProps> = ({
  onStartRandom,
  onStartCustom,
  onClose,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [countryName, setCountryName] = useState('United States');
  const [cityName, setCityName] = useState('');
  const [bornRoyal, setBornRoyal] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.name === countryName);
  const countryHasMonarchy = !!selectedCountry?.monarchy;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    onStartCustom({
      firstName,
      lastName,
      gender,
      countryName,
      cityName: cityName || undefined,
      bornRoyal: countryHasMonarchy && bornRoyal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>👶</span> Start a New Life
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {!isCustomMode ? (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Every life is an unwritten adventure. How would you like to begin?
            </p>

            <button
              onClick={() => {
                playClickSound();
                onStartRandom();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-black text-sm text-white shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            >
              🎲 Random Life (Instant)
            </button>

            {/* Special Celebrity Lives Feature */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-cyan-950/70 border border-amber-500/50 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <span>⭐</span> Special Celebrity Lives
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                  1/500 Roll
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mb-2 leading-relaxed">
                Follow their authentic, real-life chronological events year-by-year from childhood to global fame!
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onStartCustom({
                      firstName: 'Donald',
                      lastName: 'Trump',
                      gender: 'Male',
                      countryName: 'United States',
                      cityName: 'New York',
                      specialCelebrity: 'donald_trump',
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-left cursor-pointer transition-transform active:scale-95 shadow"
                >
                  <div className="text-xl mb-0.5">🦅</div>
                  <div className="text-xs font-bold text-white truncate">Donald Trump</div>
                  <div className="text-[9px] text-amber-300">NYC • 45th & 47th POTUS</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onStartCustom({
                      firstName: 'Elon',
                      lastName: 'Musk',
                      gender: 'Male',
                      countryName: 'South Africa',
                      cityName: 'Pretoria',
                      specialCelebrity: 'elon_musk',
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-left cursor-pointer transition-transform active:scale-95 shadow"
                >
                  <div className="text-xl mb-0.5">🚀</div>
                  <div className="text-xs font-bold text-white truncate">Elon Musk</div>
                  <div className="text-[9px] text-cyan-300">Pretoria • Tesla & SpaceX</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                setIsCustomMode(true);
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 font-bold text-xs text-slate-200 border border-slate-700 shadow cursor-pointer"
            >
              ✨ Custom Character & Birth City
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">First Name</label>
              <input
                type="text"
                placeholder="Leave blank for random"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Leave blank for random"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['Male', 'Female', 'Non-Binary'] as Gender[]).map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-2 rounded-lg font-semibold text-center border transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Starting Country</label>
              <select
                value={countryName}
                onChange={(e) => {
                  setCountryName(e.target.value);
                  setCityName('');
                  const nextCountry = COUNTRIES.find((c) => c.name === e.target.value);
                  if (!nextCountry?.monarchy) setBornRoyal(false);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} {c.monarchy ? '👑' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Starting City to be Born in 🏙️
              </label>
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white cursor-pointer"
              >
                <option value="">🎲 Random City in {countryName}</option>
                {selectedCountry?.cities.map((ct) => (
                  <option key={ct} value={ct}>
                    📍 {ct}
                  </option>
                ))}
              </select>
            </div>

            {countryHasMonarchy && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>👑</span> Born into Royalty
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    Start life as {gender === 'Female' ? selectedCountry?.monarchy?.princessTitle : selectedCountry?.monarchy?.princeTitle}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={bornRoyal}
                  onChange={(e) => setBornRoyal(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                Create Character 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
