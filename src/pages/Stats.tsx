import { useState } from 'react';
import { useProgress } from '../hooks/useProgress';
import { loadProgress, getUnlockedAchievements } from '../utils/storage';

import { getDayNumber, getTotalDays, getCEFRProgress, getSelectedLevel } from '../utils/scheduler';
import { Flame, BookOpen, Trophy, Target, Zap } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';

export default function Stats() {
  const [previewLevel, setPreviewLevel] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const CEFR_DETAILS: Record<string, {topics: string, words: string, nextLabel: string}> = {
    A1: {topics: '问候·数字·颜色·家庭·食物·交通·购物·时间·天气', words: '~1000 词', nextLabel: 'A2 初级 (Day 51)'},
    A2: {topics: '工作·旅游·科技·社交·健康·餐饮·兴趣爱好·节日·教育', words: '~2000 词', nextLabel: 'B1 中级 (Day 101)'},
    B1: {topics: '观点表达·文化讨论·深度对话·思辨·新闻·社会话题·旅行·科技', words: '~3000 词', nextLabel: 'B2 中高级 (Day 151)'},
    B2: {topics: '学术讨论·专业话题·辩论演讲·复杂阅读·抽象概念·商业', words: '~4000 词', nextLabel: 'C1 高级 (Day 201)'},
    C1: {topics: '流利表达·抽象概念·高级写作·地道习语·学术论文·文化赏析', words: '~5000 词', nextLabel: 'C2 精通 (Day 251)'},
    C2: {topics: '母语级·文学赏析·专业学术·文化精通·高级辩论·抽象思维', words: '~6000 词', nextLabel: '已完成全部级别'},
  };
  const { progress } = useProgress();
  const CEFR_OFFSETS: Record<string, number> = { A1: 0, A2: 50, B1: 100, B2: 150, C1: 200, C2: 250 };
  const day = getDayNumber();
  const totalDays = getTotalDays();
  const cefrData = getCEFRProgress(day);
  const currentOffset = CEFR_OFFSETS[getSelectedLevel()] || 0;
  const baseDay = Math.max(1, day - currentOffset);
  const previewDay = previewLevel ? Math.min(baseDay + (CEFR_OFFSETS[previewLevel] || 0), totalDays) : day;
  const previewCefrData = getCEFRProgress(previewDay);

  // Calculate stats
  const achievements = getUnlockedAchievements(loadProgress());
  const totalQuiz = Object.values(progress.days).reduce((sum, d) => sum + (d.quizCorrect || 0), 0);
  const totalQuizQ = Object.values(progress.days).reduce((sum, d) => sum + (d.quizTotal || 0), 0);
  const overallAccuracy = totalQuizQ > 0 ? Math.round((totalQuiz / totalQuizQ) * 100) : 0;
  const completedDays = Object.values(progress.days).filter(d => d.completed).length;
  const daysWithActivity = Object.keys(progress.days).length;


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
            <ProgressRing progress={(previewDay / totalDays) * 100} size={90} />
            <p className="text-xs text-gray-500 mt-2">总进度</p>
            <p className="text-sm font-medium">Day {previewDay}/{totalDays}</p>
          </div>
          <div className="text-center">
            <ProgressRing progress={previewCefrData.progress} size={90} color="#8b5cf6" />
            <p className="text-xs text-gray-500 mt-2">当前阶段</p>
            <p className="text-sm font-medium">{previewCefrData.level} {previewCefrData.label}</p>
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

      {/* Achievements section */}
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

      {/* CEFR Learning Path */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3">CEFR 学习路径</h2>
        <div className="space-y-3">
          {[
            { level: 'A1', label: 'A1 入门', days: 'Day 1-50', desc: '问候、数字、购物、餐厅、交通等基础表达', active: (previewLevel || cefrData.level) === 'A1' },
            { level: 'A2', label: 'A2 初级', days: 'Day 51-100', desc: '工作、旅游、科技、社交、健康等场景', active: (previewLevel || cefrData.level) === 'A2' },
            { level: 'B1', label: 'B1 中级', days: 'Day 101-150', desc: '观点表达、文化讨论、深度对话、思辨能力', active: (previewLevel || cefrData.level) === 'B1' },
            { level: 'B2', label: 'B2 中高级', days: 'Day 151-200', desc: '学术讨论、专业话题、辩论演讲、复杂阅读', active: (previewLevel || cefrData.level) === 'B2' },
            { level: 'C1', label: 'C1 高级', days: 'Day 201-250', desc: '流利表达、抽象概念、高级写作、地道习语', active: (previewLevel || cefrData.level) === 'C1' },
            { level: 'C2', label: 'C2 精通', days: 'Day 251-300', desc: '接近母语水平、文学赏析、专业学术、文化精通', active: (previewLevel || cefrData.level) === 'C2' },
          ].map(s => {
            return (
            <div
              key={s.level}
              className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                s.active ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-gray-100 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => { setPreviewLevel(s.level === previewLevel ? null : s.level); setExpandedLevel(s.level === expandedLevel ? null : s.level); }}
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
            {expandedLevel === s.level && (
              <div className="mt-2 p-4 rounded-xl bg-purple-50 border border-purple-200 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span>📚 {CEFR_DETAILS[s.level]?.topics}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span>📖 词汇量 {CEFR_DETAILS[s.level]?.words}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>本阶段进度</span>
                    <span>{Math.min(100, Math.round((previewLevel === s.level ? previewDay : day) / ((s.level === 'A1' ? 50 : s.level === 'A2' ? 100 : s.level === 'B1' ? 150 : s.level === 'B2' ? 200 : s.level === 'C1' ? 250 : 300) / 300 * totalDays) * 100))}%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-600 rounded-full h-1.5 transition-all" style={{width: `${Math.min(100, Math.round((previewLevel === s.level ? previewDay : day) / ((s.level === 'A1' ? 50 : s.level === 'A2' ? 100 : s.level === 'B1' ? 150 : s.level === 'B2' ? 200 : s.level === 'C1' ? 250 : 300) / 300 * totalDays) * 100))}%`}} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">🏁 下一阶段：{CEFR_DETAILS[s.level]?.nextLabel}</p>
                <a href="/learn" className="inline-block text-xs font-medium text-[var(--primary)] hover:underline">▶ 继续学习</a>
              </div>
            )}
          </div>
        );
      })} 
        </div>
      </div>
    </div>
  );
}
