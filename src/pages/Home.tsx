import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, TrendingUp, Zap, Flame, ChevronRight } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import { useProgress } from '../hooks/useProgress';
import { getTodayData, getDayNumber, getTotalDays } from '../utils/scheduler';

export default function Home() {
  const { progress, todayProgress } = useProgress();
  const dayData = getTodayData();
  const day = getDayNumber();
  const totalDays = getTotalDays();
  const stage = day <= 50 ? 1 : day <= 100 ? 2 : 3;
  const stageLabels = ['', '生存英语', '生活英语', '深度沟通'];

  const todayLearnedPercent = todayProgress
    ? Math.round((todayProgress.wordsLearned / todayProgress.totalWords) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900">海苔英语</h1>
        <p className="text-sm text-gray-400 mt-0.5">从小白到日常流畅沟通</p>
      </div>

      {/* Streak & Day Info */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-80">学习天数</p>
            <p className="text-3xl font-bold">Day {day}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">总词汇量</p>
            <p className="text-xl font-bold">{progress.totalLearnedWords}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
            <Flame size={16} />
            <span className="text-sm font-medium">连续 {progress.streak.current} 天</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
            <Zap size={16} />
            <span className="text-sm font-medium">阶段 {stage}: {stageLabels[stage]}</span>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs opacity-80 mb-1">
            <span>总进度</span>
            <span>{totalDays} 天</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(100, (day / totalDays) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Learning */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">今日学习</h2>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
            {dayData?.theme || '今日无内容'}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ProgressRing progress={todayLearnedPercent} size={80} />
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              今日已学 {todayProgress?.wordsLearned || 0} / {todayProgress?.totalWords || 20} 词
            </p>
            {todayProgress && (
              <p className="text-xs text-gray-400 mt-0.5">
                小测正确率: {todayProgress.quizTotal > 0
                  ? Math.round((todayProgress.quizCorrect / todayProgress.quizTotal) * 100)
                  : '-'}%
              </p>
            )}
            <Link
              to="/learn"
              className="inline-flex items-center gap-1 mt-3 text-sm text-[var(--primary)] font-medium hover:underline"
            >
              继续学习 <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/learn"
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-[var(--primary)]" />
          </div>
          <p className="font-medium text-gray-900">学单词</p>
          <p className="text-xs text-gray-400 mt-0.5">每日 20 词卡片学习</p>
        </Link>
        <Link
          to="/quiz"
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <ClipboardCheck size={20} className="text-amber-500" />
          </div>
          <p className="font-medium text-gray-900">每日小测</p>
          <p className="text-xs text-gray-400 mt-0.5">检验今日学习成果</p>
        </Link>
        <Link
          to="/review"
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-red-400" />
          </div>
          <p className="font-medium text-gray-900">错题复习</p>
          <p className="text-xs text-gray-400 mt-0.5">巩固薄弱单词</p>
        </Link>
        <Link
          to="/stats"
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <Zap size={20} className="text-green-500" />
          </div>
          <p className="font-medium text-gray-900">学习统计</p>
          <p className="text-xs text-gray-400 mt-0.5">查看学习趋势</p>
        </Link>
      </div>

      {/* Stage info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm font-medium text-gray-700 mb-2">
          📖 当前阶段: {stageLabels[stage]} (Day {day})
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          {stage === 1 && '学习基础词汇和日常表达，掌握问候、数字、颜色、家庭等生存必备英语。'}
          {stage === 2 && '深入生活各场景，学习工作、旅行、社交、科技等话题，提升日常交流能力。'}
          {stage === 3 && '学习表达观点、讨论新闻、深度沟通，达到流畅的日常英语交流水平。'}
        </p>
      </div>
    </div>
  );
}
