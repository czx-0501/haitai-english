import { useDailyWords } from '../hooks/useDailyWords';
import { useProgress } from '../hooks/useProgress';
import WordCard from '../components/WordCard';
import { getTodayData } from '../utils/scheduler';
import { BookOpen, CheckCircle, Users, X, TrendingUp, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';

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

  const [showRanking, setShowRanking] = useState(false);
  const [rankingList, setRankingList] = useState<any[]>([]);

  async function loadRanking() {
    setShowRanking(true);
    try {
      const user = await getCurrentUser();
      if (!user?.id) return;
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
      if (!friends || friends.length === 0) return;
      const ids = friends.map((f: any) => f.friend_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, nickname, day, total_learned, streak, cefr_level')
        .in('id', ids);
      if (profiles) {
        profiles.sort((a: any, b: any) => (b.day || 0) - (a.day || 0));
        setRankingList(profiles);
      }
    } catch(e) { console.error(e); }
  }

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
      {/* Quick access cards */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <a href="/quiz" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <ClipboardCheck size={20} className="text-amber-500" />
          </div>
          <p className="font-medium text-gray-900">每日小测</p>
          <p className="text-xs text-gray-400 mt-0.5">检验今日学习成果</p>
        </a>
        <a href="/review" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-red-400" />
          </div>
          <p className="font-medium text-gray-900">错题复习</p>
          <p className="text-xs text-gray-400 mt-0.5">间隔复习巩固</p>
        </a>
        <a href="/practice" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3 text-lg">📝</div>
          <p className="font-medium text-gray-900">专项练习</p>
          <p className="text-xs text-gray-400 mt-0.5">语法·阅读·听力</p>
        </a>
        <button onClick={loadRanking} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Users size={20} className="text-purple-500" />
          </div>
          <p className="font-medium text-gray-900">学习圈子</p>
          <p className="text-xs text-gray-400 mt-0.5">好友学习进度排名</p>
        </button>
      </div>

      {/* Friend Ranking Modal */}
      {showRanking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowRanking(false)}>
          <div className="bg-white rounded-2xl rounded-b-none sm:rounded-b-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">好友学习排名</h2>
              <button onClick={() => setShowRanking(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {rankingList.length === 0 ? (
              <div className="text-center py-8">
                <Users size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500 mb-1">暂无好友数据</p>
                <p className="text-xs text-gray-400 mb-4">去圈子页面添加好友开始排名</p>
                <a href="/circle" className="inline-block px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm">去添加好友</a>
              </div>
            ) : (
              <div className="space-y-2">
                {rankingList.map((item: any, idx: number) => (
                  <div key={item.id || idx} className={'flex items-center gap-3 p-3 rounded-xl ' + (idx < 3 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50')}>
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' + (idx < 3 ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500')}>
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                      {item.nickname?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.nickname || '匿名'}</p>
                      <p className="text-xs text-gray-400">Day {item.day || 0} · {item.total_learned || 0} 词</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary)] text-white">{item.cefr_level || 'A1'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
