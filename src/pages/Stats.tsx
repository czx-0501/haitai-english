import { useProgress } from '../hooks/useProgress';
import { loadProgress, getUnlockedAchievements } from '../utils/storage';

import { getDayNumber, getTotalDays } from '../utils/scheduler';
import { Flame, BookOpen, Trophy, Target, Zap } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';

export default function Stats() {
  const { progress } = useProgress();
  const day = getDayNumber();
  const totalDays = getTotalDays();
  const stage = day <= 50 ? 1 : day <= 100 ? 2 : 3;
  const stageLabels = ['', '生存英语', '生活英语', '深度沟通'];

  // Calculate stats
  const achievements = getUnlockedAchievements(loadProgress());
  const totalQuiz = Object.values(progress.days).reduce((sum, d) => sum + (d.quizCorrect || 0), 0);
  const totalQuizQ = Object.values(progress.days).reduce((sum, d) => sum + (d.quizTotal || 0), 0);
  const overallAccuracy = totalQuizQ > 0 ? Math.round((totalQuiz / totalQuizQ) * 100) : 0;
  const completedDays = Object.values(progress.days).filter(d => d.completed).length;
  const daysWithActivity = Object.keys(progress.days).length;

  // Calculate stage progress
  const stageStartDay = stage === 1 ? 1 : stage === 2 ? 51 : 101;
  const stageEndDay = stage === 1 ? 50 : stage === 2 ? 100 : 150;
  const stageProgress = Math.round(((day - stageStartDay + 1) / (stageEndDay - stageStartDay + 1)) * 100);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">学习统计</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white shadow-sm">
          <Flame size={22} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress.streak.current}</p>
          <p className="text-xs opacity-80">连续学习天数</p>
        </div>
        <div className="bg-gradient-to-br from-[var(--primary)] to-blue-600 rounded-2xl p-4 text-white shadow-sm">
          <BookOpen size={22} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{progress.totalLearnedWords}</p>
          <p className="text-xs opacity-80">已学词汇量</p>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-4 text-white shadow-sm">
          <Target size={22} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{completedDays}</p>
          <p className="text-xs opacity-80">已完成天数</p>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl p-4 text-white shadow-sm">
          <Trophy size={22} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{overallAccuracy}%</p>
          <p className="text-xs opacity-80">总正确率</p>
        </div>
      </div>

      {/* Progress circles */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-4">学习进度</h2>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <ProgressRing progress={(day / totalDays) * 100} size={90} />
            <p className="text-xs text-gray-500 mt-2">总进度</p>
            <p className="text-sm font-medium">Day {day}/{totalDays}</p>
          </div>
          <div className="text-center">
            <ProgressRing progress={stageProgress} size={90} color="#8b5cf6" />
            <p className="text-xs text-gray-500 mt-2">当前阶段</p>
            <p className="text-sm font-medium">{stageLabels[stage]}</p>
          </div>
          <div className="text-center">
            <ProgressRing progress={overallAccuracy} size={90} color="#10b981" />
            <p className="text-xs text-gray-500 mt-2">平均正确率</p>
            <p className="text-sm font-medium">{overallAccuracy}%</p>
          </div>
        </div>
      </div>

      {/* Best streak */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3">打卡记录</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-4 py-3 flex-1">
            <Flame size={20} className="text-orange-500" />
            <div>
              <p className="text-lg font-bold text-orange-600">{progress.streak.current}</p>
              <p className="text-xs text-orange-400">当前连续</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 rounded-xl px-4 py-3 flex-1">
            <Trophy size={20} className="text-yellow-500" />
            <div>
              <p className="text-lg font-bold text-yellow-600">{progress.streak.longest}</p>
              <p className="text-xs text-yellow-400">最长连续</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 flex-1">
            <Zap size={20} className="text-blue-500" />
            <div>
              <p className="text-lg font-bold text-blue-600">{daysWithActivity}</p>
              <p className="text-xs text-blue-400">活跃天数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stage info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {achievements.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3">🏆 成就徽章</h2>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map(ach => (
              <div key={ach.id} className="text-center p-3 rounded-xl border-2 border-amber-200 bg-amber-50">
                <p className="text-2xl mb-1">{ach.icon}</p>
                <p className="text-xs font-medium text-amber-800">{ach.name}</p>
                <p className="text-xs text-amber-500 mt-0.5">{ach.unlockedDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

        <h2 className="text-base font-bold text-gray-900 mb-3">学习路径</h2>
        <div className="space-y-3">
          {[
            { stage: 1, label: 'Stage 1: 生存英语', words: '~1000 词', days: 'Day 1-50', desc: '问候、数字、购物、餐厅、交通等基础表达', active: stage === 1 },
            { stage: 2, label: 'Stage 2: 生活英语', words: '~1000 词', days: 'Day 51-100', desc: '工作、旅游、科技、社交、健康等场景', active: stage === 2 },
            { stage: 3, label: 'Stage 3: 深度沟通', words: '~1000 词', days: 'Day 101-150', desc: '观点表达、文化讨论、深度对话、思辨能力', active: stage === 3 },
          ].map(s => (
            <div
              key={s.stage}
              className={`rounded-xl p-3.5 border transition-all ${
                s.active ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${s.active ? 'text-[var(--primary)]' : 'text-gray-600'}`}>
                  {s.active ? '> ' : ''}{s.label}
                </p>
                <span className={`text-xs ${s.active ? 'text-[var(--primary)]' : 'text-gray-400'}`}>
                  {s.days}
                </span>
              </div>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
