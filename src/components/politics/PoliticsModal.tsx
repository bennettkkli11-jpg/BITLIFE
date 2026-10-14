import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  POLITICAL_OFFICES,
  POLITICAL_PARTIES,
  CAMPAIGN_PLATFORMS,
  PRESIDENTIAL_BILLS,
  OfficeDefinition,
  LegislativeBill,
} from '../../data/politics';
import { Character, PoliticalOffice } from '../../types/bitlife';
import { clamp, randomInt, pickRandom } from '../../utils/lifeEngine';
import {
  playCashSound,
  playClickSound,
  playFailSound,
  playSuccessSound,
} from '../../utils/audio';

interface PoliticsModalProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onClose: () => void;
}

export const PoliticsModal: React.FC<PoliticsModalProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onClose,
}) => {
  // If character already in office
  const activeOffice = character.politicalOffice;

  // Running for office state
  const [selectedOffice, setSelectedOffice] = useState<OfficeDefinition>(POLITICAL_OFFICES[0]);
  const [selectedParty, setSelectedParty] = useState(POLITICAL_PARTIES[0].name);
  const [selectedPlatform, setSelectedPlatform] = useState(CAMPAIGN_PLATFORMS[0].title);
  const [campaignBudget, setCampaignBudget] = useState<number>(() => {
    return Math.min(character.money, 15000);
  });

  const [campaignResult, setCampaignResult] = useState<{
    won: boolean;
    title: string;
    description: string;
    votesPercent: number;
  } | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  // Office title generator
  const getOfficeTitle = (def: OfficeDefinition) => {
    let t = def.titlePattern;
    t = t.replace('{city}', character.city);
    t = t.replace('{country}', character.country);
    t = t.replace('{headOfState}', 'President');
    return t;
  };

  // Launch Campaign
  const handleLaunchCampaign = () => {
    playClickSound();

    if (character.money < campaignBudget) {
      setFeedback('You do not have enough funds to finance this campaign war chest.');
      return;
    }

    if (campaignBudget <= 0) {
      setFeedback('You must allocate a campaign war chest.');
      return;
    }

    // THE 100M REQUIREMENT CHECK FOR PRESIDENT:
    const isPresidential = selectedOffice.level === 'President';
    const has100M = campaignBudget >= 100000000;

    let won = false;
    let votesPercent = 0;
    let resultDesc = '';

    if (isPresidential) {
      if (!has100M) {
        // UNDER $100M GUARANTEED FAILURE FOR PRESIDENTIAL RACE
        won = false;
        votesPercent = randomInt(18, 38);
        resultDesc = `DISASTROUS ELECTION COLLAPSE! Opponents deployed a $250M+ super-PAC media blitz across all 50 battleground states. Your budget of ${character.currencySymbol}${campaignBudget.toLocaleString()} fell far short of the mandatory $100,000,000 ($100M) national war chest. Political commentators mocked your underfunded campaign on national television. You received only ${votesPercent}% of the vote and were soundly defeated.`;
      } else {
        // WITH AT LEAST $100M: YOU CAN STILL FAIL!
        // Campaign war chest gets you to the national debate stage, but voters, scandals, and candidate metrics determine victory.
        const candidateScore =
          (character.smarts * 0.3) +
          (character.looks * 0.2) +
          (character.karma * 0.25) +
          Math.min(25, Math.round(campaignBudget / 15000000));
        
        // Real risk of failing even with $100M: 35% chance of an October surprise or swing-state upset
        const octoberSurpriseUpset = Math.random() < 0.35;
        won = candidateScore >= 55 && !octoberSurpriseUpset;
        votesPercent = won ? randomInt(51, 65) : randomInt(41, 49);

        if (won) {
          resultDesc = `LANDSLIDE ELECTORAL VICTORY! Your monumental $${(campaignBudget / 1000000).toFixed(0)}M war chest and debate mastery dominated battleground states! You swept the electoral map with ${votesPercent}% of the vote! You have been officially sworn in as Commander-in-Chief!`;
        } else {
          resultDesc = `HEARTBREAKING PRESIDENTIAL LOSS! YOU CAN FAIL EVEN WITH A $100M+ WAR CHEST! Despite pouring $${(campaignBudget / 1000000).toFixed(0)}M into national advertising, a surprise late-breaking debate blunder and massive opponent turnout in swing states caused a crushing electoral defeat! You conceded with ${votesPercent}% of the vote.`;
        }
      }
    } else {
      // Lower offices
      const budgetRatio = campaignBudget / selectedOffice.minCampaignBudget;
      const passRatio = budgetRatio >= 1.0;
      const candidateScore = (character.smarts * 0.4) + (character.karma * 0.3) + (passRatio ? 35 : 10);
      won = candidateScore >= 50 || Math.random() < 0.6;
      votesPercent = won ? randomInt(53, 72) : randomInt(35, 48);

      if (won) {
        resultDesc = `VICTORY! Your grassroots coalition and debate performances propelled you to victory with ${votesPercent}% of the vote! You are now the ${getOfficeTitle(selectedOffice)}!`;
      } else {
        resultDesc = `DEFEAT! Your opponent captured the undecided suburban precincts. You lost the election with ${votesPercent}% of the vote.`;
      }
    }

    if (won) {
      playSuccessSound();
      playCashSound();
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.25 } });
      } catch {}

      const newOffice: PoliticalOffice = {
        title: getOfficeTitle(selectedOffice),
        level: selectedOffice.level,
        salary: selectedOffice.salary,
        termYearsLeft: selectedOffice.termYears,
        totalYearsServed: 0,
        approvalRating: randomInt(65, 85),
        party: selectedParty,
      };

      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money - campaignBudget,
        politicalOffice: newOffice,
        fame: clamp(prev.fame + selectedOffice.fameBonus),
        happiness: clamp(prev.happiness + 35),
        presidentialTermsWon: isPresidential ? (prev.presidentialTermsWon || 0) + 1 : prev.presidentialTermsWon,
        politicalCampaignsRun: (prev.politicalCampaignsRun || 0) + 1,
      }));

      onAddLog(resultDesc);
    } else {
      playFailSound();
      onUpdateCharacter((prev) => ({
        ...prev,
        money: prev.money - campaignBudget,
        happiness: clamp(prev.happiness - 25),
        politicalCampaignsRun: (prev.politicalCampaignsRun || 0) + 1,
      }));
      onAddLog(resultDesc);
    }

    setCampaignResult({
      won,
      title: won ? 'Elected to Public Office! 🏛️' : 'Campaign Defeat ❌',
      description: resultDesc,
      votesPercent,
    });
  };

  // Executive Actions while in Office
  const handlePassBill = (bill: LegislativeBill) => {
    playClickSound();
    const passed = character.smarts >= 50 || Math.random() < 0.7;

    if (passed) {
      playSuccessSound();
      const newRating = clamp((activeOffice?.approvalRating || 60) + bill.approvalChangeSuccess);
      onUpdateCharacter((prev) => ({
        ...prev,
        politicalOffice: prev.politicalOffice
          ? { ...prev.politicalOffice, approvalRating: newRating }
          : undefined,
        happiness: clamp(prev.happiness + 15),
        fame: clamp(prev.fame + 10),
      }));
      const text = `PASSED INTO LAW! Congress/Parliament enacted "${bill.title}". The public celebrated and your approval rating surged to ${newRating}%!`;
      setFeedback(text);
      onAddLog(text);
    } else {
      playFailSound();
      const newRating = clamp((activeOffice?.approvalRating || 60) + bill.approvalChangeFail);
      onUpdateCharacter((prev) => ({
        ...prev,
        politicalOffice: prev.politicalOffice
          ? { ...prev.politicalOffice, approvalRating: newRating }
          : undefined,
        happiness: clamp(prev.happiness - 10),
      }));
      const text = `FILIBUSTERED! The opposition coalition blocked "${bill.title}" in the senate. Pundits questioned your legislative influence. Approval dropped to ${newRating}%.`;
      setFeedback(text);
      onAddLog(text);
    }
  };

  const handleStateOfTheUnion = () => {
    playClickSound();
    playSuccessSound();
    const ratingBoost = randomInt(6, 14);
    const newRating = clamp((activeOffice?.approvalRating || 60) + ratingBoost);
    onUpdateCharacter((prev) => ({
      ...prev,
      politicalOffice: prev.politicalOffice
        ? { ...prev.politicalOffice, approvalRating: newRating }
        : undefined,
      happiness: clamp(prev.happiness + 15),
      fame: clamp(prev.fame + 12),
    }));
    const text = `You addressed the joint session of legislature and 40 million viewers in a prime-time State of the Union address! The speech received standing ovations and boosted approval to ${newRating}%!`;
    setFeedback(text);
    onAddLog(text);
  };

  const handleDiplomaticSummit = () => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 15),
      fame: clamp(prev.fame + 15),
      smarts: clamp(prev.smarts + 5),
    }));
    const text = 'You hosted the G7 World Economic Summit. You negotiated trade accords and toasted global peace at a formal white-tie state banquet!';
    setFeedback(text);
    onAddLog(text);
  };

  const handlePresidentialPardon = () => {
    playClickSound();
    playSuccessSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      karma: clamp(prev.karma + 10),
      happiness: clamp(prev.happiness + 5),
    }));
    const text = 'You exercised sovereign executive clemency to grant a full presidential pardon to a non-violent whistleblower.';
    setFeedback(text);
    onAddLog(text);
  };

  const handleResign = () => {
    playClickSound();
    playFailSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      politicalOffice: undefined,
      happiness: clamp(prev.happiness - 20),
      fame: clamp(prev.fame - 15),
    }));
    const text = `I resigned from the office of ${activeOffice?.title}.`;
    onAddLog(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[88vh] rounded-2xl bg-slate-900 border border-blue-600/60 shadow-2xl p-5 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blue-850 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <h3 className="text-sm font-bold text-blue-300">Political Office & Campaigns</h3>
              <p className="text-[10px] text-slate-400">
                {activeOffice ? `Active Role: ${activeOffice.title}` : 'Run for Public Office'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-700/60 text-xs text-blue-100 mt-2 shrink-0 leading-relaxed">
            {feedback}
          </div>
        )}

        {/* Campaign Result Modal Card */}
        {campaignResult && (
          <div
            className={`p-4 rounded-xl border my-2 shrink-0 text-xs ${
              campaignResult.won
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-100'
                : 'bg-red-950/50 border-red-800/60 text-red-100'
            }`}
          >
            <div className="flex justify-between items-center font-bold mb-1.5 text-sm">
              <span>{campaignResult.title}</span>
              <span className="font-mono">{campaignResult.votesPercent}% Popular Vote</span>
            </div>
            <p className="text-xs leading-relaxed">{campaignResult.description}</p>
            <button
              onClick={() => {
                setCampaignResult(null);
                if (campaignResult.won) {
                  onClose();
                }
              }}
              className="mt-2.5 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {/* VIEW 1: ACTIVE INCUMBENT DASHBOARD */}
        {activeOffice ? (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-3 pr-1">
            {/* Status Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-600/50 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500 text-slate-950">
                  {activeOffice.party}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Term: {activeOffice.termYearsLeft} yrs left
                </span>
              </div>
              <h4 className="text-base font-black text-white">{activeOffice.title}</h4>
              <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                Salary: {character.currencySymbol}{activeOffice.salary.toLocaleString()}/yr
              </p>

              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Public Approval Rating</span>
                  <span className="font-mono font-bold text-amber-300">{activeOffice.approvalRating}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeOffice.approvalRating >= 60
                        ? 'bg-emerald-500'
                        : activeOffice.approvalRating >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${activeOffice.approvalRating}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Executive Actions */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Executive Duties & Powers
              </h5>

              <button
                onClick={handleStateOfTheUnion}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <div>Deliver State of the Union Address</div>
                    <div className="text-[10px] text-slate-400 font-normal">Boost public approval ratings on TV</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-mono text-xs">+Approval</span>
              </button>

              <button
                onClick={handleDiplomaticSummit}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🌐</span>
                  <div>
                    <div>Host G7 International Summit</div>
                    <div className="text-[10px] text-slate-400 font-normal">State dinner with foreign prime ministers</div>
                  </div>
                </div>
                <span className="text-blue-400 font-mono text-xs">+Fame</span>
              </button>

              {activeOffice.level === 'President' && (
                <button
                  onClick={handlePresidentialPardon}
                  className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🕊️</span>
                    <div>
                      <div>Issue Presidential Pardon</div>
                      <div className="text-[10px] text-slate-400 font-normal">Exercise constitutional executive clemency</div>
                    </div>
                  </div>
                  <span className="text-amber-300 font-mono text-xs">+Karma</span>
                </button>
              )}
            </div>

            {/* Landmark Legislation Agenda */}
            <div className="space-y-2 pt-1">
              <h5 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Pass Landmark Federal Legislation
              </h5>
              {PRESIDENTIAL_BILLS.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">{bill.title}</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{bill.description}</p>
                  </div>
                  <button
                    onClick={() => handlePassBill(bill)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow"
                  >
                    Pass Bill
                  </button>
                </div>
              ))}
            </div>

            {/* Resignation */}
            <button
              onClick={handleResign}
              className="w-full py-2.5 rounded-xl border border-red-900/60 text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
            >
              Resign from Public Office 🚪
            </button>
          </div>
        ) : (
          /* VIEW 2: RUNNING FOR OFFICE CAMPAIGN LAUNCHPAD */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-3 pr-1">
            {/* Office Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Target Office:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POLITICAL_OFFICES.map((off) => {
                  const eligible = character.age >= off.minAge;
                  const isPresident = off.level === 'President';
                  return (
                    <button
                      key={off.level}
                      onClick={() => {
                        playClickSound();
                        setSelectedOffice(off);
                        if (isPresident) {
                          setCampaignBudget(Math.min(character.money, 100000000));
                        } else {
                          setCampaignBudget(Math.min(character.money, off.minCampaignBudget));
                        }
                      }}
                      disabled={!eligible}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedOffice.level === off.level
                          ? 'bg-blue-950/80 border-blue-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 disabled:opacity-30'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{off.level}</span>
                        {isPresident && <span className="text-[10px]">🇺🇸</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {eligible ? `Age ${off.minAge}+` : `Locked (Age ${off.minAge}+)`}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-1">
                        {isPresident ? 'Requires $100M+' : `Min: $${(off.minCampaignBudget / 1000).toFixed(0)}k`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRESIDENTIAL $100M HIGHLIGHT BANNER */}
            {selectedOffice.level === 'President' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-red-950/70 to-blue-950/80 border border-amber-500/80 text-xs shadow-lg space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-amber-300 uppercase tracking-wide">
                  <span>⚠️</span>
                  <span>100 MILLION DOLLAR WAR CHEST REQUIREMENT</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                  A successful presidential campaign requires <strong className="text-amber-300 font-mono">AT LEAST $100,000,000 ($100M)</strong>. Running with less than $100M will cause your campaign to be wiped out by opponents' nationwide advertising blitz!
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-800/40">
                  <span className="text-slate-300">Your Bank Balance:</span>
                  <span
                    className={`font-mono font-bold ${
                      character.money >= 100000000 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {character.currencySymbol}{character.money.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Political Party Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Political Party Alignment:
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {POLITICAL_PARTIES.map((party) => (
                  <button
                    key={party.name}
                    onClick={() => {
                      playClickSound();
                      setSelectedParty(party.name);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                      selectedParty === party.name
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span className="mr-1">{party.icon}</span>
                    <span>{party.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Platform */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Primary Campaign Platform:
              </label>
              <div className="space-y-1.5 text-xs">
                {CAMPAIGN_PLATFORMS.map((plat) => (
                  <div
                    key={plat.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedPlatform(plat.title);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedPlatform === plat.title
                        ? 'bg-blue-950/70 border-blue-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{plat.icon}</span>
                      <span className="font-semibold text-white">{plat.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{plat.appeal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Budget Input */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">Campaign War Chest:</label>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {character.currencySymbol}{campaignBudget.toLocaleString()}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5 mb-2 text-[10px]">
                <button
                  onClick={() => setCampaignBudget(Math.min(character.money, 50000))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  $50k
                </button>
                <button
                  onClick={() => setCampaignBudget(Math.min(character.money, 1000000))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  $1M
                </button>
                <button
                  onClick={() => setCampaignBudget(Math.min(character.money, 20000000))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  $20M
                </button>
                <button
                  onClick={() => setCampaignBudget(Math.min(character.money, 100000000))}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  $100M (Winning Presidential)
                </button>
                <button
                  onClick={() => setCampaignBudget(character.money)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  Max All In
                </button>
              </div>

              <input
                type="range"
                min="5000"
                max={Math.max(5000, character.money)}
                step="50000"
                value={campaignBudget}
                onChange={(e) => setCampaignBudget(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Launch Campaign Button */}
            <button
              onClick={handleLaunchCampaign}
              disabled={campaignBudget <= 0 || campaignBudget > character.money}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>🗳️</span>
              <span>
                Launch Campaign for {selectedOffice.level} ({character.currencySymbol}
                {campaignBudget.toLocaleString()})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
