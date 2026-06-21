import { useState, useMemo } from 'react';
import { Volume2, RotateCcw, TrendingUp, Check, X } from 'lucide-react';
import { speak } from '../utils/speech';
import { loadProgress, saveProgress, getDueWords, updateReviewResult } from '../utils/storage';
import { getAllDays } from '../utils/scheduler';
import type { WordEntry } from '../data/vocabulary';

export default function Review() {
  const [, setTick] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selected, setSelected] = useState<'correct' | 'wrong' | null>(null);
  const [wrongThisSession, setWrongThisSession] = useState(0);

  const refresh = () => setTick(t => t + 1);

  const reviewWords = useMemo(() => {
    const dueWords = getDueWords();
    const progress = loadProgress();
    // Also include wrong words from quiz
    const wrongWordSet = new Map<string, WordEntry>();
    Object.values(progress.days).forEach(day => {
      day.wrongWords?.forEach(w => {
        if (!dueWords.some(d => d.w === w)) {
          for (const d of getAllDays()) {
            const found = d.words.find(word => word.w === w);
            if (found) { wrongWordSet.set(w, found); break; }
          }
        }
      });
    });
    return [...dueWords, ...Array.from(wrongWordSet.values())];
  }, []);

  const current = reviewWords[currentIndex] || null;
  const totalCount = reviewWords.length;
  const reviewedCount = currentIndex + (selected ? 1 : 0);
  const allReviewed = currentIndex >= totalCount - 1 && selected !== null;

  const markCorrect = () => {
    if (!current || selected) return;
    const p = loadProgress();
    updateReviewResult(p, current.w, true);
    saveProgress(p);
    setSelected('correct');
  };

  const markWrong = () => {
    if (!current || selected) return;
    const p = loadProgress();
    updateReviewResult(p, current.w, false);
    saveProgress(p);
    setSelected('wrong');
    setWrongThisSession(prev => prev + 1);
  };

  const goNext = () => {
    if (currentIndex < totalCount - 1 && selected) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setSelected(null);
    } else if (allReviewed) {
      refresh();
    }
  };

  if (!totalCount) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <TrendingUp size={48} className="mb-4 text-gray-300" />
        <p className="text-lg text-gray-400 mb-2">暂无待复习单词</p>
        <p className="text-sm text-gray-400">继续学习新单词，系统会自动安排复习</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">间隔复习</h1>
          <p className="text-sm text-gray-400">{totalCount} 个待复习</p>
        </div>
        <button
          onClick={() => { setCurrentIndex(0); setSelected(null); setIsFlipped(false); setWrongThisSession(0); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all"
        >
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      {allReviewed ? (
        <div className="animate-slideUp text-center py-12">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">全部复习完毕！</h2>
          <p className="text-gray-400">
            {wrongThisSession === 0
              ? '全部正确，太棒了！🎉'
              : `复习 ${totalCount} 个，${wrongThisSession} 个没记住`}
          </p>
        </div>
      ) : current ? (
        <div className="animate-fadeIn">
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className="bg-[var(--primary)] rounded-full h-2 transition-all"
              style={{ width: `${(reviewedCount / totalCount) * 100}%` }}
            />
          </div>

          {/* Word card */}
          <div
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 cursor-pointer mb-4"
            onClick={() => { if (!selected) setIsFlipped(!isFlipped); }}
          >
            {!isFlipped ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-gray-900">{current.w}</h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(current.w); }}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Volume2 size={20} className="text-[var(--primary)]" />
                  </button>
                </div>
                <p className="text-gray-400">{current.p} · {current.pos}</p>
                {!selected && <p className="text-sm text-gray-400 mt-4">点击查看释义</p>}
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.w}</h2>
                <p className="text-lg text-[var(--primary)] font-medium mb-4">{current.m}</p>
                <div className="space-y-2">
                  {(current.ex || []).map((ex, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-left">
                      <p className="text-sm text-gray-800 mb-0.5">{ex.e}</p>
                      <p className="text-xs text-gray-500">{ex.c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {selected ? (
            <div className="flex items-center gap-3">
              <div className={`flex-1 py-2.5 rounded-xl text-center font-medium text-sm ${
                selected === 'correct'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                {selected === 'correct' ? <><Check size={16} className="inline mr-1" /> 记住了</> : <><X size={16} className="inline mr-1" /> 没记住</>}
              </div>
              <button
                onClick={goNext}
                className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm"
              >
                {currentIndex < totalCount - 1 ? '下一个' : '查看结果'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={markCorrect}
                disabled={!isFlipped}
                className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-30 transition-all font-medium text-sm disabled:cursor-not-allowed"
              >
                <Check size={16} className="inline mr-1" /> 记住了
              </button>
              <button
                onClick={markWrong}
                disabled={!isFlipped}
                className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-30 transition-all font-medium text-sm disabled:cursor-not-allowed"
              >
                <X size={16} className="inline mr-1" /> 没记住
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
