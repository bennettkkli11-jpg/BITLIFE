import React from 'react';
import { PastLifeRecord } from '../types/bitlife';

interface CemeteryModalProps {
  records: PastLifeRecord[];
  onClearCemetery: () => void;
  onClose: () => void;
}

export const CemeteryModal: React.FC<CemeteryModalProps> = ({
  records,
  onClearCemetery,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪦</span>
            <h3 className="text-lg font-bold text-slate-100">Cemetery & Hall of Fame</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
          >
            Close
          </button>
        </div>

        {records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <span className="text-4xl mb-2">🌿</span>
            <p className="text-sm font-semibold">No graves in the cemetery yet.</p>
            <p className="text-xs text-slate-500 mt-1">Complete a life in BitLife to preserve their legacy here!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-600 flex items-center justify-center text-lg font-bold text-stone-300">
                    🪦
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200">{r.fullName}</span>
                      <span className="text-xs">{r.flag}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Lived to age {r.age} · {r.career || 'Unemployed'}
                    </div>
                    <div className="text-[10px] text-red-400/90 italic">
                      Died of: {r.causeOfDeath}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {r.ribbon}
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                    ${r.netWorth.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {records.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">{records.length} souls resting in peace</span>
            <button
              onClick={onClearCemetery}
              className="text-red-400 hover:text-red-300 hover:underline"
            >
              Clear Cemetery Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
