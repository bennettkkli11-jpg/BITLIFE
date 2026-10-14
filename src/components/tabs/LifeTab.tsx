import React, { useRef, useEffect } from 'react';
import { Character } from '../../types/bitlife';
import { calculateNetWorth } from '../../utils/lifeEngine';

interface LifeTabProps {
  character: Character;
  onAgeUp: () => void;
}

export function getCharacterAvatar(character: Character): string {
  if (character.specialCelebrityId === 'donald_trump') return '🦅';
  if (character.specialCelebrityId === 'elon_musk') return '🚀';
  if (character.royalty) return character.gender === 'Female' ? '👸' : '🤴';
  if (character.politicalOffice?.level === 'President') return '🦅';
  if (character.age < 3) return '👶';
  if (character.age < 12) return character.gender === 'Female' ? '👧' : '👦';
  if (character.age < 18) return character.gender === 'Female' ? '👩‍🦱' : '🧒';
  if (character.age < 65) {
    if (character.job?.careerTrack === 'Medicine') return '🩺';
    if (character.job?.careerTrack === 'Engineering') return '💻';
    if (character.job?.careerTrack === 'Law') return '⚖️';
    if (character.job?.careerTrack === 'Aviation') return '🧑‍✈️';
    return character.gender === 'Female' ? '👩' : '👨';
  }
  return character.gender === 'Female' ? '👵' : '👴';
}

export const LifeTab: React.FC<LifeTabProps> = ({ character, onAgeUp }) => {
  const netWorth = calculateNetWorth(character);
  const avatar = getCharacterAvatar(character);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of log when life progresses
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [character.age, character.lifeLog.length]);

  const currentGradeOrJob = () => {
    if (character.specialCelebrityTitle && character.age >= 25 && !character.politicalOffice) {
      return `⭐ ${character.specialCelebrityTitle}`;
    }
    if (character.royalty) {
      const realm = character.royalty.country || character.country;
      const isAbroad = realm !== character.country;
      return `👑 ${character.royalty.title} of ${realm}${isAbroad ? ` (Abroad in ${character.country})` : ''} (Respect: ${character.royalty.respect}%)`;
    }
    if (character.politicalOffice) return `🏛️ ${character.politicalOffice.title} (${character.politicalOffice.approvalRating}% Approval)`;
    if (character.inPrison) return `Inmate (${character.prisonYearsLeft} years remaining)`;
    if (character.job) return `${character.job.title} at ${character.job.company}`;
    if (character.inSchool) {
      if (character.educationLevel === 'University') {
        const year = Math.min(4, (character.schoolYearsCompleted || 0) + 1);
        const yearName = ['Freshman', 'Sophomore', 'Junior', 'Senior'][year - 1] || `Year ${year}`;
        return `University Student (${character.educationMajor || 'General Studies'} • ${yearName} Yr)`;
      }
      if (['Medical School', 'Law School', 'Business School', 'Graduate School'].includes(character.educationLevel)) {
        const year = (character.schoolYearsCompleted || 0) + 1;
        return `${character.educationLevel} (Year ${year}/${character.schoolTotalYears || 2})`;
      }
      return `${character.educationLevel} Student`;
    }
    if (!character.job && character.completedDegrees && character.completedDegrees.length > 0) {
      const topDegree = character.completedDegrees[character.completedDegrees.length - 1];
      return `${topDegree} Graduate`;
    }
    if (character.age < 5) return 'Toddler';
    if (character.partTimeJob) return `Part-Time ${character.partTimeJob.title}`;
    return 'Unemployed';
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Character Profile Card - Locked at top */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md mb-2 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">
                {character.firstName} {character.lastName}
              </h2>
              <span className="text-sm shrink-0" title={`${character.city}, ${character.country}`}>
                {character.flag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>📍 {character.city}, {character.country}</span>
              {character.specialCelebrityId && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 font-bold shrink-0">
                  ⭐ 1/500 Celeb
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">
              {currentGradeOrJob()}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>
                Age: <strong className="text-white font-mono">{character.age}</strong>
              </span>
              <span>·</span>
              <span>
                Bank: <strong className="text-emerald-400 font-mono">{character.currencySymbol}{character.money.toLocaleString()}</strong>
              </span>
              <span>·</span>
              <span>
                Net: <strong className="text-emerald-300 font-mono">{character.currencySymbol}{netWorth.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chronicle Life Journal / Feed - Only this middle scroll area moves */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scroll-smooth"
      >
        {character.lifeLog.map((log) => (
          <div
            key={log.yearNumber}
            className={`p-3 rounded-2xl border text-xs transition-all ${
              log.age === character.age
                ? 'bg-slate-900/95 border-slate-700 shadow-sm'
                : 'bg-slate-950/70 border-slate-850 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[11px] mb-1.5 text-slate-400 pb-1 border-b border-slate-800/60">
              <span className="text-amber-400 uppercase tracking-wider font-mono">
                Age {log.age}
              </span>
              <span className="text-[10px] text-slate-500">
                Year {log.yearNumber}
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-200">
              {log.events.map((ev, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* The Iconic Big "+ Age" button - Permanently locked in one spot */}
      <div className="pt-2 pb-1 shrink-0 bg-slate-950 border-t border-slate-900/80">
        <button
          onClick={onAgeUp}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] border border-emerald-400/40 cursor-pointer"
        >
          <span className="text-xl">➕</span>
          <span>Age ({character.age + 1})</span>
        </button>
      </div>
    </div>
  );
};
