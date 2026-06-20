import { useState, useMemo } from 'react';
import { speak } from '../utils/speech';
import { useProgress } from '../hooks/useProgress';
import { getAllDays } from '../utils/scheduler';
import { Volume2, Check, RotateCcw, TrendingUp } from 'lucide-react';
import type { WordEntry } from '../data/vocabulary';

export default function Review() {
  const { progress } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedWords, setReviewedWords] = useState<string[]>([]);

  // Collect all wrong words with their data
  const reviewWords = useMemo(() => {
    const wrongWordSet = new Map<string, WordEntry>();
    Object.values(progress.days).forEach(day => {
      day.wrongWords?.forEach(w => {
        // Find the word entry from vocabulary
        for (const d of getAllDays()) {
          const found = d.words.find(word => word.w === w);
          if (found) {
            wrongWordSet.set(w, found);
            break;
          }
        }
      });
    });
    return Array.from(wrongWordSet.values());
  }, [progress]);

  const current = reviewWords[currentIndex] || null;
  const hasReviewed = current ? reviewedWords.includes(current.w) : false;

  const markReviewed = () => {
    if (current && !reviewedWords.includes(current.w)) {
      setReviewedWords(prev => [...prev, current.w]);
    }
  };

  const goNext = () => {
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  if (!reviewWords.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <TrendingUp size={48} className="mb-4 text-gray-300" />
        <p className="text-lg text-gray-400 mb-2">暂无需要复习的单词</p>
        <p className="text-sm text-gray-400">继续学习新的单词吧！</p>
      </div>
    );
  }

  const allReviewed = reviewedWords.length >= reviewWords.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">错题复习</h1>
          <p className="text-sm text-gray-400">{reviewWords.length} 个需要复习</p>
        </div>
        <button
          onClick={() => { setCurrentIndex(0); setReviewedWords([]); setIsFlipped(false); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all"
        >
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      {allReviewed ? (
        <div className="animate-slideUp text-center py-12">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">全部复习完毕！</h2>
          <p className="text-gray-400 mb-2">
            已复习 {reviewedWords.length} 个错题
          </p>
        </div>
      ) : current ? (
        <div className="animate-fadeIn">
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className="bg-[var(--primary)] rounded-full h-2 transition-all"
              style={{ width: `${(reviewedWords.length / reviewWords.length) * 100}%` }}
            />
          </div>

          {/* Word card for review */}
          <div
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 cursor-pointer mb-4"
            onClick={() => setIsFlipped(!isFlipped)}
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
                <p className="text-sm text-gray-400 mt-4">点击查看释义</p>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.w}</h2>
                <p className="text-lg text-[var(--primary)] font-medium mb-4">{current.m}</p>
                <div className="space-y-2">
                  {current.ex.map((ex, i) => (
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
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all text-sm"
            >
              上一个
            </button>
            {!hasReviewed ? (
              <button
                onClick={markReviewed}
                className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-blue-600 transition-all font-medium text-sm"
              >
                <Check size={16} className="inline mr-1" /> 已掌握
              </button>
            ) : (
              <span className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 font-medium text-sm text-center">
                <Check size={16} className="inline mr-1" /> 已复习
              </span>
            )}
            <button
              onClick={goNext}
              disabled={currentIndex === reviewWords.length - 1}
              className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all text-sm"
            >
              下一个
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
