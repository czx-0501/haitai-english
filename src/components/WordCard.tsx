import { Volume2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { speak } from '../utils/speech';
import type { WordEntry } from '../data/vocabulary';

interface Props {
  word: WordEntry;
  isFlipped: boolean;
  isLearned: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMarkLearned: (word: string) => void;
  currentIndex: number;
  totalWords: number;
}

export default function WordCard({
  word, isFlipped, isLearned, onFlip, onNext, onPrev,
  onMarkLearned, currentIndex, totalWords
}: Props) {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(word.w);
  };

  const handleSpeakExample = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text);
  };

  return (
    <div className="animate-fadeIn">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          第 {currentIndex + 1} / {totalWords} 词
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalWords }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentIndex ? 'bg-[var(--primary)]' :
                i === currentIndex ? 'bg-[var(--primary)] ring-2 ring-[var(--primary-light)]' :
                'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Word card */}
      <div className="card-container h-72 mb-4">
        <div
          className={`card-flipper w-full h-full cursor-pointer rounded-2xl ${isFlipped ? 'flipped' : ''}`}
          onClick={onFlip}
        >
          {/* Front */}
          <div className="card-front bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-4xl font-bold text-gray-900">{word.w}</h2>
              <button
                onClick={handleSpeak}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="朗读发音"
              >
                <Volume2 size={22} className="text-[var(--primary)]" />
              </button>
            </div>
            <p className="text-lg text-gray-500 mb-2">{word.p}</p>
            <p className="text-sm text-gray-400">{word.pos}</p>
            <p className="text-sm text-gray-400 mt-4">点击翻转查看释义</p>
          </div>

          {/* Back */}
          <div className="card-back bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-3xl font-bold text-gray-900">{word.w}</h2>
              <button
                onClick={handleSpeak}
                className="p-2 rounded-full hover:bg-[var(--primary-light)] active:bg-[var(--primary-light)] transition-all active:scale-110"
                title="朗读发音"
              >
                <Volume2 size={20} className="text-[var(--primary)]" />
              </button>
            </div>
            <p className="text-lg text-[var(--primary)] font-medium text-center mb-4">{word.m}</p>
            <div className="w-full space-y-3">
              {word.ex.map((ex, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-1">{ex.e}</p>
                      <p className="text-xs text-gray-500">{ex.c}</p>
                    </div>
                    <button
                      onClick={(e) => handleSpeakExample(e, ex.e)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 active:bg-[var(--primary-light)] transition-all active:scale-110"
                      title="朗读这句"
                    >
                      <Volume2 size={18} className="text-gray-400 hover:text-[var(--primary)] active:text-[var(--primary)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={18} /> 上一词
        </button>

        {!isLearned ? (
          <button
            onClick={() => onMarkLearned(word.w)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-blue-600 transition-all font-medium shadow-sm"
          >
            <Check size={18} /> 学会了
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-50 text-green-600 font-medium">
            <Check size={18} /> 已掌握
          </span>
        )}

        <button
          onClick={onNext}
          disabled={currentIndex === totalWords - 1}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          下一词 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
