import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { getTodayData, getDayNumber, getTotalDays, getCEFRProgress, getCEFROptions, getSelectedLevel, setSelectedLevel } from '../utils/scheduler';
import { getDueCount } from '../utils/storage';

export default function Home() {
  const [, forceUpdate] = useState(0);
  const [previewCefr, setPreviewCefr] = useState<string | null>(null);
  const { progress, todayProgress } = useProgress();
  const dayData = getTodayData();
  const day = getDayNumber();
  const totalDays = getTotalDays();
  const cefrData = getCEFRProgress(day);
  const cefrLabel = cefrData.label;
  const displayLevel = previewCefr || cefrData.level;
  const dueCount = getDueCount();

  const todayLearnedPercent = todayProgress
    ? Math.round((todayProgress.wordsLearned / todayProgress.totalWords) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900">海苔英语</h1>
        <p className="text-sm text-gray-400 mt-0.5">从零开始练就地道英语</p>
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
              <button key={opt.value} onClick={() => { setSelectedLevel(opt.value); setPreviewCefr(null); forceUpdate(i => i + 1); }}
                 className={'px-3 py-1.5 rounded-xl text-xs font-medium transition-all ' + (cur === opt.value ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                 {opt.label}
               </button>
            );
          })}
          <button onClick={() => { setSelectedLevel('TOEFL'); setPreviewCefr('TOEFL'); forceUpdate(i => i + 1); }}
            className={'px-3 py-1.5 rounded-xl text-xs font-medium transition-all ' + (getSelectedLevel() === 'TOEFL' ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
            TOEFL
          </button>
          <button onClick={() => { setSelectedLevel('IELTS'); setPreviewCefr('IELTS'); forceUpdate(i => i + 1); }}
            className={'px-3 py-1.5 rounded-xl text-xs font-medium transition-all ' + (getSelectedLevel() === 'IELTS' ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
            IELTS
          </button>
        </div>
        <p className="text-xs text-gray-400">点选级别查看学习目标与计划</p>
      </div>

      {/* Level Detail */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {displayLevel === 'TOEFL' ? '📖 TOEFL 核心词汇' : displayLevel === 'IELTS' ? '📖 IELTS 核心词汇' : `📖 ${cefrData.level} ${cefrLabel}`} · Day {day}/{totalDays}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          {displayLevel === 'TOEFL' || displayLevel === 'IELTS' ? (
            <>
              <span className="px-2 py-0.5 rounded-full bg-white border border-purple-200">词汇量 ~3000 词</span>
              <span>Day 1-150</span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-full bg-white border border-purple-200">词汇量 ~{displayLevel === 'A1' ? 1000 : displayLevel === 'A2' ? 2000 : displayLevel === 'B1' ? 3000 : displayLevel === 'B2' ? 4000 : displayLevel === 'C1' ? 5000 : 6000} 词</span>
              <span>Day {cefrData.dayStart}-{cefrData.dayEnd}</span>
            </>
          )}
        </div>
        {displayLevel === 'TOEFL' ? (
          <p className="text-xs text-gray-500 leading-relaxed mb-1">学术·阅读·写作·听力·口语·语法·词汇·逻辑·分析·推理</p>
        ) : displayLevel === 'IELTS' ? (
          <p className="text-xs text-gray-500 leading-relaxed mb-1">学术·图表·书信·议论文·口语·听力·阅读·写作·语法·词汇</p>
        ) : (
          <p className="text-xs text-gray-500 leading-relaxed mb-1">{cefrData.level === 'A1' ? '问候、数字、颜色、家庭、食物、交通、购物、时间、天气' : cefrData.level === 'A2' ? '工作、旅游、科技、社交、健康、餐饮、兴趣爱好、节日' : cefrData.level === 'B1' ? '观点表达、文化讨论、深度对话、新闻、社会话题、旅行体验' : cefrData.level === 'B2' ? '学术讨论、专业话题、辩论演讲、复杂阅读、抽象概念、商业环境' : cefrData.level === 'C1' ? '流利表达、抽象概念、高级写作、地道习语、学术论文、文化赏析' : '接近母语、文学赏析、专业学术、文化精通、高级辩论、抽象思维'}</p>
        )}
        <p className="text-xs text-gray-500 mt-2 mb-2">目标：{cefrData.level === 'A1' ? '掌握问候、自我介绍、数字、颜色、家庭等日常表达；能进行简单购物和问路' : cefrData.level === 'A2' ? '能在工作、旅行、社交等常见场景中交流；能描述经历、表达喜好和计划' : cefrData.level === 'B1' ? '能就熟悉话题发表观点、参与讨论；能应对旅行中大部分场景；能写简单连贯文章' : cefrData.level === 'B2' ? '能与母语者流畅交流；能理解复杂文本；能在专业领域进行讨论和辩论' : cefrData.level === 'C1' ? '能流利自然地表达；能灵活有效地使用语言应对社交、学术和专业场景' : '接近母语水平；能轻松理解听到和读到的任何内容；能区分细微含义差异'}</p>
        <div className="w-full bg-purple-200 rounded-full h-1.5 mb-2">
          <div className="bg-purple-600 rounded-full h-1.5 transition-all" style={{width: `${Math.round(cefrData.progress)}%`}} />
        </div>
        <Link to="/learn" className="inline-block text-xs text-[var(--primary)] font-medium">
          开始学习 →
        </Link>
      </div>
    </div>
  );
}
