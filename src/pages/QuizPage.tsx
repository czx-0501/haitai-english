import { useState } from 'react';
import { useProgress } from '../hooks/useProgress';
import { getTodayData } from '../utils/scheduler';
import Quiz from '../components/Quiz';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

export default function QuizPage() {
  const [started, setStarted] = useState(false);
  const { recordQuiz, todayProgress } = useProgress();
  const dayData = getTodayData();

  if (!dayData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ClipboardCheck size={48} className="mb-4 opacity-50" />
        <p>暂无今日测验</p>
      </div>
    );
  }

  const handleComplete = (correct: number, total: number, wrongWords: string[]) => {
    recordQuiz(correct, total, wrongWords);
  };

  if (!started) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-xl font-bold text-gray-900 mb-1">每日小测</h1>
        <p className="text-sm text-gray-400 mb-6">{dayData.theme} · 共 20 题</p>

        {todayProgress?.quizTotal ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
            <div className="text-4xl mb-3">
              {todayProgress.quizCorrect / todayProgress.quizTotal >= 0.8 ? '🎉' : '💪'}
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">今日已测</p>
            <p className="text-gray-500">
              正确 {todayProgress.quizCorrect} / {todayProgress.quizTotal}
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-blue-600 transition-all font-medium"
            >
              重测一次
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={32} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">准备好测试了吗？</h2>
            <p className="text-sm text-gray-400 mb-6">
              根据今天学习的 20 个单词，选择正确的中文释义
            </p>
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-blue-600 transition-all shadow-sm"
            >
              开始小测 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">每日小测</h1>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
          {dayData.theme}
        </span>
      </div>
      <Quiz
        key={Date.now()}
        words={dayData.words}
        onComplete={handleComplete}
      />
    </div>
  );
}
