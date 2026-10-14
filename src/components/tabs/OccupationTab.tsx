import React, { useState } from 'react';
import { Character, EducationLevel, JobOccupation } from '../../types/bitlife';
import { JOB_TEMPLATES, JobTemplate, FREELANCE_GIGS } from '../../data/jobs';
import { UNIVERSITY_MAJORS, GRADUATE_PROGRAMS, DegreeMajor, GraduateSchool } from '../../data/degrees';
import { pickRandom, randomInt, clamp } from '../../utils/lifeEngine';
import { playCashSound, playClickSound, playFailSound, playSuccessSound } from '../../utils/audio';

interface OccupationTabProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
}

export const OccupationTab: React.FC<OccupationTabProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
}) => {
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'JOB_BOARD' | 'COLLEGE_APPLY' | 'GRAD_APPLY' | 'FREELANCE'
  >('NONE');
  const [notice, setNotice] = useState<string | null>(null);

  // Filter jobs player is eligible to browse
  const availableJobs = JOB_TEMPLATES.filter((j) => {
    if (character.age < 18) return false;
    // Education filter (checks current education level or awarded completed degrees)
    const hasDegree = (deg: string) =>
      character.educationLevel === deg ||
      (character.completedDegrees || []).some((d) => d.includes(deg));

    if (j.requiredEducation === 'Medical School' && !hasDegree('Medical School')) return false;
    if (j.requiredEducation === 'Law School' && !hasDegree('Law School')) return false;
    if (j.requiredEducation === 'Business School' && !hasDegree('Business School')) return false;
    if (
      j.requiredEducation === 'University' &&
      !['University', 'Graduate School', 'Medical School', 'Law School', 'Business School'].some(hasDegree) &&
      !(character.completedDegrees || []).some((d) => d.includes('Bachelor') || d.includes('University'))
    ) {
      return false;
    }
    return true;
  });

  const handleStudyHarder = () => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      schoolPerformance: clamp(prev.schoolPerformance + 15),
      smarts: clamp(prev.smarts + 3),
      happiness: clamp(prev.happiness - 2),
    }));
    setNotice('You spent late nights in the library studying your textbooks! Your grades and smarts improved.');
    onAddLog('I studied hard and improved my grades.');
  };

  const handleApplyCollege = (major: DegreeMajor) => {
    playClickSound();
    if (character.money < major.tuitionPerYear && character.debt + major.tuitionPerYear > 150000) {
      setNotice('You were denied a student loan due to excess debt.');
      return;
    }
    const accepted = character.smarts >= major.smartsReq || Math.random() < 0.4;
    if (accepted) {
      playSuccessSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        educationLevel: 'University',
        educationMajor: major.name,
        inSchool: true,
        schoolYearsCompleted: 0,
        schoolTotalYears: 4,
        debt: prev.debt + major.tuitionPerYear * 4,
        happiness: clamp(prev.happiness + 20),
      }));
      setNotice(`ACCEPTED! You were admitted into University majoring in ${major.name} (4-Year Program)! Student loans were taken.`);
      onAddLog(`I enrolled in University studying ${major.name}.`);
      setActiveModal('NONE');
    } else {
      playFailSound();
      setNotice(`REJECTED. The admissions board declined your application for ${major.name}.`);
    }
  };

  const handleApplyGradSchool = (prog: GraduateSchool) => {
    playClickSound();
    const accepted = character.smarts >= prog.smartsReq;
    if (accepted) {
      playSuccessSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        educationLevel: prog.level,
        inSchool: true,
        schoolYearsCompleted: 0,
        schoolTotalYears: prog.durationYears,
        debt: prev.debt + prog.tuitionPerYear * prog.durationYears,
        happiness: clamp(prev.happiness + 25),
      }));
      setNotice(`CONGRATULATIONS! You were admitted into ${prog.name} (${prog.durationYears}-Year Program)!`);
      onAddLog(`I began higher education studies at ${prog.name}.`);
      setActiveModal('NONE');
    } else {
      playFailSound();
      setNotice(`REJECTED from ${prog.name}. Your smarts (${character.smarts}%) did not meet their cut-off (${prog.smartsReq}%).`);
    }
  };

  const handleDropOut = () => {
    playClickSound();
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      inSchool: false,
      educationLevel: prev.completedDegrees && prev.completedDegrees.length > 0 ? prev.educationLevel : 'High School',
      happiness: clamp(prev.happiness - 15),
    }));
    setNotice(`You dropped out of ${character.educationLevel === 'University' ? 'University' : character.educationLevel}.`);
    onAddLog(`I decided to drop out of ${character.educationLevel}.`);
  };

  const handleApplyJob = (template: JobTemplate) => {
    playClickSound();
    // Interview pass chance based on smarts and looks
    const interviewPass = character.smarts >= template.requiredSmarts - 10;
    if (interviewPass) {
      playSuccessSound();
      playCashSound();
      const company = pickRandom(template.companyPool);
      const newJob: JobOccupation = {
        id: 'job_' + Date.now(),
        title: template.title,
        company,
        salary: template.baseSalary,
        careerTrack: template.careerTrack,
        requiredEducation: template.requiredEducation,
        requiredSmarts: template.requiredSmarts,
        yearsInRole: 0,
        performance: 70,
        stress: randomInt(30, 60),
      };
      onUpdateCharacter((prev) => ({
        ...prev,
        job: newJob,
        happiness: clamp(prev.happiness + 25),
      }));
      setNotice(`HIRED! You nailed the interview and were offered the role of ${template.title} at ${company} with a starting salary of ${character.currencySymbol}${template.baseSalary.toLocaleString()}/yr!`);
      onAddLog(`I was hired as a ${template.title} at ${company}.`);
      setActiveModal('NONE');
    } else {
      playFailSound();
      setNotice(`The interview with ${pickRandom(template.companyPool)} did not go well. They decided to pursue other applicants.`);
    }
  };

  const handleWorkHarder = () => {
    if (!character.job) return;
    const times = character.job.timesWorkedHarderThisYear || 0;
    if (times >= 2) {
      playClickSound();
      playFailSound();
      setNotice('You have already put in extreme overtime twice this year! You are thoroughly exhausted. Wait until next year before burning out.');
      return;
    }

    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => {
      if (!prev.job) return prev;
      return {
        ...prev,
        job: {
          ...prev.job,
          performance: clamp(prev.job.performance + 14),
          stress: clamp(prev.job.stress + 18),
          timesWorkedHarderThisYear: (prev.job.timesWorkedHarderThisYear || 0) + 1,
        },
        happiness: clamp(prev.happiness - 4),
        health: clamp(prev.health - 2),
      };
    });
    setNotice(`You burned the midnight oil at the office (${times + 1}/2 times this year)! Your performance increased, but so did your stress.`);
  };

  const handleAskRaise = () => {
    if (!character.job) return;
    playClickSound();

    if (character.job.askedForRaiseThisYear) {
      playFailSound();
      onUpdateCharacter((prev) => {
        if (!prev.job) return prev;
        return {
          ...prev,
          job: {
            ...prev.job,
            performance: clamp(prev.job.performance - 10),
            stress: clamp(prev.job.stress + 10),
          },
        };
      });
      setNotice('You already asked for a raise this year! Your supervisor was furious at your persistence and reprimanded you.');
      return;
    }

    // Mark that they asked this year
    if (character.job.performance >= 85) {
      playSuccessSound();
      playCashSound();
      // Balanced reasonable raise: 6% capped at $15,000
      const bonus = Math.min(15000, Math.max(1000, Math.round(character.job.salary * 0.06)));
      onUpdateCharacter((prev) => {
        if (!prev.job) return prev;
        return {
          ...prev,
          job: {
            ...prev.job,
            salary: prev.job.salary + bonus,
            performance: clamp(prev.job.performance - 25), // Boss expects higher delivery now
            askedForRaiseThisYear: true,
          },
          happiness: clamp(prev.happiness + 15),
        };
      });
      setNotice(`RAISE APPROVED! Management rewarded your diligence with a modest salary bump (+${character.currencySymbol}${bonus.toLocaleString()}/yr). You cannot ask again until next year.`);
      onAddLog(`My boss gave me a raise to ${character.currencySymbol}${(character.job.salary + bonus).toLocaleString()}/year.`);
    } else {
      playFailSound();
      onUpdateCharacter((prev) => {
        if (!prev.job) return prev;
        return {
          ...prev,
          job: {
            ...prev.job,
            askedForRaiseThisYear: true,
            performance: clamp(prev.job.performance - 5),
          },
        };
      });
      setNotice(`RAISE DENIED. Your performance (${character.job.performance}%) wasn't high enough (needs 85%+). You must wait until next year to ask again.`);
    }
  };

  const handleQuitJob = () => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      job: undefined,
      happiness: clamp(prev.happiness + 10),
    }));
    setNotice('You submitted your two-week resignation letter and walked out the door!');
    onAddLog('I quit my job.');
  };

  const handleTakeFreelance = (gig: (typeof FREELANCE_GIGS)[0]) => {
    playClickSound();
    playCashSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      partTimeJob: {
        id: gig.id,
        title: gig.title,
        hourlyRate: gig.hourlyRate,
        hoursPerWeek: 15,
      },
      happiness: clamp(prev.happiness + 10),
    }));
    setNotice(`You started working part-time as a ${gig.title} earning ${character.currencySymbol}${gig.hourlyRate}/hr!`);
    onAddLog(`I started a side gig as a ${gig.title}.`);
    setActiveModal('NONE');
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pr-1">
      {notice && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/50 text-xs text-amber-200 font-medium">
          {notice}
        </div>
      )}

      {/* Education Section */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
            <span>🎓</span> Education & Academics
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Level: <strong className="text-white">{character.educationLevel}</strong>
          </span>
        </div>

        {character.inSchool ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  {character.educationLevel === 'University'
                    ? `University (${character.educationMajor || 'General Studies'})`
                    : character.educationLevel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40">
                  {character.educationLevel === 'University'
                    ? `${['Freshman', 'Sophomore', 'Junior', 'Senior'][(character.schoolYearsCompleted || 0)] || 'Senior'} • Year ${Math.min(4, (character.schoolYearsCompleted || 0) + 1)}/4`
                    : `Year ${(character.schoolYearsCompleted || 0) + 1} of ${character.schoolTotalYears || 2}`}
                </span>
              </div>

              {/* Degree completion progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Degree Completion Progress</span>
                  <span className="font-mono text-cyan-300">
                    {Math.min(100, Math.round(((character.schoolYearsCompleted || 0) / (character.schoolTotalYears || (character.educationLevel === 'University' ? 4 : 2))) * 100))}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(((character.schoolYearsCompleted || 0) / (character.schoolTotalYears || (character.educationLevel === 'University' ? 4 : 2))) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-300 pt-1">
                <span>Academic Grades & Standing</span>
                <span className="font-bold text-emerald-400">{character.schoolPerformance}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${character.schoolPerformance}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStudyHarder}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all active:scale-[0.98]"
              >
                Study Harder 📚
              </button>
              <button
                onClick={handleDropOut}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-red-950/80 hover:border-red-600/60 border border-slate-700 text-slate-300 hover:text-red-300 font-bold text-xs transition-all active:scale-[0.98]"
              >
                Drop Out 🚪
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1 text-xs text-slate-300">
            {/* Awarded Degrees Badge List */}
            {character.completedDegrees && character.completedDegrees.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>🎓</span> Awarded Diplomas & Degrees ({character.completedDegrees.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {character.completedDegrees.map((deg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold"
                    >
                      {deg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {character.age < 18
                ? 'Too young for higher education.'
                : character.completedDegrees && character.completedDegrees.length > 0
                ? 'You hold college credentials! You can enter the job market or pursue Higher Education (Medical, Law, Business, or Graduate School).'
                : character.educationLevel === 'High School'
                ? 'You have a High School diploma. You can apply for a 4-year University Bachelor’s program!'
                : 'Not currently enrolled in school.'}
            </p>

            {character.age >= 18 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveModal('COLLEGE_APPLY');
                  }}
                  disabled={character.inSchool}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🏛️</span>
                  <span>{character.completedDegrees?.some(d => d.includes('Bachelor') || d.includes('University')) ? 'Another Major' : 'University (4 Yrs)'}</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveModal('GRAD_APPLY');
                  }}
                  disabled={
                    character.inSchool ||
                    !character.completedDegrees?.some(d => d.includes('Bachelor') || d.includes('University'))
                  }
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🩺</span>
                  <span>Higher Ed / Med School</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Careers / Occupation Section */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-2.5">
          <span>💼</span> Full-Time Career
        </h3>

        {character.job ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-white">{character.job.title}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">{character.job.company}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {character.currencySymbol}{character.job.salary.toLocaleString()}/yr
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Tenure: {character.job.yearsInRole} yrs
                  </div>
                </div>
              </div>

              {/* Performance & Stress */}
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Performance</span>
                    <span className="font-bold text-emerald-400">{character.job.performance}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${character.job.performance}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Stress Level</span>
                    <span className="font-bold text-red-400">{character.job.stress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${character.job.stress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWorkHarder}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700"
              >
                Work Harder 📈
              </button>
              <button
                onClick={handleAskRaise}
                className="py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow"
              >
                Ask for Raise 💰
              </button>
              <button
                onClick={handleQuitJob}
                className="py-2 rounded-xl bg-red-900/80 hover:bg-red-800 text-red-200 font-semibold text-xs"
              >
                Quit Job 🚪
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-center p-3 rounded-xl bg-slate-950/60 border border-slate-850">
            <p className="text-xs text-slate-400">
              You are currently unemployed. Search open vacancies to jumpstart your career!
            </p>
            <button
              onClick={() => {
                playClickSound();
                setActiveModal('JOB_BOARD');
              }}
              disabled={character.age < 18}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow"
            >
              Browse Job Openings 💼
            </button>
          </div>
        )}
      </div>

      {/* Freelance & Gigs */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <span>⚡</span> Part-Time Gigs & Side Hustles
          </h3>
          {character.partTimeJob && (
            <span className="text-xs text-emerald-400 font-bold font-mono">
              {character.partTimeJob.title} (${character.partTimeJob.hourlyRate}/hr)
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Earn supplemental pocket cash through local neighborhood odd jobs.
        </p>
        <button
          onClick={() => {
            playClickSound();
            setActiveModal('FREELANCE');
          }}
          disabled={character.age < 12}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 font-bold text-xs border border-slate-700"
        >
          Find Freelance Gigs 🐕
        </button>
      </div>

      {/* Modal: Job Board */}
      {activeModal === 'JOB_BOARD' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-emerald-400">Available Job Listings</h4>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {availableJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{j.title}</div>
                    <div className="text-[11px] text-slate-400">
                      Req: {j.requiredEducation} · Smarts {j.requiredSmarts}%
                    </div>
                    <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                      {character.currencySymbol}{j.baseSalary.toLocaleString()}/yr
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyJob(j)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: College Majors */}
      {activeModal === 'COLLEGE_APPLY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-blue-400">Select University Major</h4>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {UNIVERSITY_MAJORS.map((m) => (
                <div
                  key={m.name}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{m.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Category: {m.category} · Min Smarts: {m.smartsReq}%
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      Tuition: {character.currencySymbol}{m.tuitionPerYear.toLocaleString()}/yr
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyCollege(m)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                  >
                    Enroll
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Grad School */}
      {activeModal === 'GRAD_APPLY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-indigo-400">Graduate & Professional Programs</h4>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {GRADUATE_PROGRAMS.map((g) => (
                <div
                  key={g.name}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{g.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Duration: {g.durationYears} yrs · Min Smarts: {g.smartsReq}%
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      Tuition: {character.currencySymbol}{g.tuitionPerYear.toLocaleString()}/yr
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyGradSchool(g)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Freelance */}
      {activeModal === 'FREELANCE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-amber-400">Local Freelance Gigs</h4>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {FREELANCE_GIGS.filter((f) => character.age >= f.minAge).map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{f.title}</div>
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      {character.currencySymbol}{f.hourlyRate}/hour
                    </div>
                  </div>
                  <button
                    onClick={() => handleTakeFreelance(f)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow"
                  >
                    Take Gig
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
