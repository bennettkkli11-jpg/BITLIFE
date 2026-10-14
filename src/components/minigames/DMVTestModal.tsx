import React, { useState } from 'react';
import { DMV_QUESTIONS, DMVQuestion } from '../../data/dmvQuestions';
import { pickRandom } from '../../utils/lifeEngine';
import { playSuccessSound, playFailSound, playClickSound } from '../../utils/audio';

interface DMVTestModalProps {
  onPass: () => void;
  onFail: () => void;
  onClose: () => void;
}

export const DMVTestModal: React.FC<DMVTestModalProps> = ({ onPass, onFail, onClose }) => {
  const [question] = useState<DMVQuestion>(() => pickRandom(DMV_QUESTIONS));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    const isCorrect = selectedIndex === question.correctIndex;
    setPassed(isCorrect);
    if (isCorrect) {
      playSuccessSound();
    } else {
      playFailSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            <span>🚗</span> DMV Driver's License Examination
          </h3>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800">
            Cancel
          </button>
        </div>

        {/* Traffic Sign / Icon Preview */}
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
          {question.imageIcon}
        </div>

        <p className="text-sm font-semibold text-slate-200 mb-5 text-left">{question.question}</p>

        {/* Options */}
        <div className="space-y-2.5 mb-6 text-left">
          {question.options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            let btnStyle = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750';

            if (submitted) {
              if (idx === question.correctIndex) {
                btnStyle = 'bg-emerald-900/80 border-emerald-500 text-white font-medium';
              } else if (isSelected) {
                btnStyle = 'bg-red-900/80 border-red-500 text-red-200';
              }
            } else if (isSelected) {
              btnStyle = 'bg-blue-600/30 border-blue-400 text-white font-medium';
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => {
                  playClickSound();
                  setSelectedIndex(idx);
                }}
                className={`w-full p-3.5 rounded-xl border text-xs leading-relaxed transition-all text-left flex items-start gap-2.5 ${btnStyle}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-700/60 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Result & Actions */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-md"
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {passed ? '🎉 Congratulations! You passed the driver test!' : '❌ You failed the driver test! Study harder.'}
            </p>
            <p className="text-xs text-slate-400">{question.explanation}</p>
            <button
              onClick={passed ? onPass : onFail}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md ${
                passed ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {passed ? 'Receive Driver’s License' : 'Accept Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
