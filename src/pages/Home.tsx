import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { getTodayData, getDayNumber, getTotalDays, getCEFRProgress, getCEFROptions, getSelectedLevel, setSelectedLevel } from '../utils/scheduler';
import { getDueCount } from '../utils/storage';

export default function Home() {
  const { progress, todayProgress } = useProgress();
  const dayData = getTodayData();
  const day = getDayNumber();
  const totalDays = getTotalDays();
  const cefrData = getCEFRProgress(day);
  const cefrLabel = cefrData.label;
  const dueCount = getDueCount();

  const todayLearnedPercent = todayProgress
    ? Math.round((todayProgress.wordsLearned / todayProgress.totalWords) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900">海苔英语</h1>
        <p className="text-sm text-gray-400 mt-0.5">从小白到英语大师</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#4f6ef7] to-[#4f46e5] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xs opacity-80 mb-1">学习天数</p>
            <p className="text-3xl font-bold">Day {day}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80 mb-1">总词汇量</p>
            <p className="text-2xl font-bold">{progress.totalLearnedWords}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {dueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/30 text-xs">📝 {dueCount} 个待复习</span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs">🔥 连续 {progress.streak.current} 天</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs">📖 {cefrData.level} {cefrLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{width: `${Math.min(100, (day/totalDays)*100)}%`}} />
          </div>
          <span className="text-xs opacity-70 flex-shrink-0">{totalDays} 天</span>
        </div>
      </div>

      {/* Today's Learning */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">今日学习</h2>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
            {dayData?.theme || '今日无内容'}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-[70px] h-[70px] rounded-full border-[4px] border-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[var(--primary)]">{todayLearnedPercent}%</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">
              今日已学 {todayProgress?.wordsLearned || 0} / {todayProgress?.totalWords || 20} 词
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-[var(--primary)] rounded-full h-1.5" style={{width: `${todayLearnedPercent}%`}} />
            </div>
            <Link to="/learn" className="inline-block mt-3 text-xs text-[var(--primary)] font-medium">
              继续学习 ›
            </Link>
          </div>
        </div>
      </div>





      {/* CEFR Level selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3">学习级别</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {getCEFROptions().map(opt => {
            const cur = getSelectedLevel();
            return (
              <button key={opt.value} onClick={() => setSelectedLevel(opt.value)}
                className={'px-3 py-1.5 rounded-xl text-xs font-medium transition-all ' + (cur === opt.value ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400">点选级别查看学习目标与计划</p>
      </div>

      {/* CEFR Level detail */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm font-medium text-gray-700 mb-2">
          📖 {cefrData.level} {cefrLabel} · Day {day}/{totalDays}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">
          当前阶段：Day {cefrData.dayStart}-{cefrData.dayEnd}，进度 {Math.round(cefrData.progress)}%
        </p>
        <div className="w-full bg-purple-200 rounded-full h-1.5">
          <div className="bg-purple-600 rounded-full h-1.5 transition-all" style={{width: `${Math.round(cefrData.progress)}%`}} />
        </div>
        <Link to="/learn" className="inline-block mt-3 text-xs text-[var(--primary)] font-medium">
          开始学习 →
        </Link>
      </div>
    </div>
  );
}
