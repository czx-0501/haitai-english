import { useDailyWords } from '../hooks/useDailyWords';
import { useProgress } from '../hooks/useProgress';
import WordCard from '../components/WordCard';
import { getTodayData } from '../utils/scheduler';
import { BookOpen, CheckCircle } from 'lucide-react';

export default function Learn() {
  const {
    currentWord, currentIndex, totalWords, isFlipped,
    isLearned, toggleFlip, handleNext, handlePrev,
    markLearned, learnedCount, day, words
  } = useDailyWords();
  
  const { markLearned: saveProgress } = useProgress();
  const dayData = getTodayData();

  const handleMarkLearned = (word: string) => {
    markLearned(word);
    saveProgress(word);
  };

  if (!currentWord || !words.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BookOpen size={48} className="mb-4 opacity-50" />
        <p>暂无学习内容</p>
      </div>
    );
  }

  // All learned
  const allLearned = learnedCount >= totalWords;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Day {day}</h1>
          <p className="text-sm text-gray-400">{dayData?.theme}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 rounded-xl px-3 py-1.5">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-sm font-medium text-green-600">{learnedCount}/{totalWords}</span>
        </div>
      </div>

      {allLearned ? (
        <div className="animate-slideUp text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">今日单词已全部掌握！</h2>
          <p className="text-gray-400 mb-6">去完成小测巩固学习成果吧</p>
          <a
            href="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-blue-600 transition-all"
          >
            开始每日小测
          </a>
        </div>
      ) : (
        <WordCard
          word={currentWord}
          isFlipped={isFlipped}
          isLearned={isLearned}
          onFlip={toggleFlip}
          onNext={handleNext}
          onPrev={handlePrev}
          onMarkLearned={handleMarkLearned}
          currentIndex={currentIndex}
          totalWords={totalWords}
        />
      )}
    </div>
  );
}
