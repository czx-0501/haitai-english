import { useState, useCallback, useEffect } from 'react';
import { loadProgress, saveProgress, markWordLearned, recordQuizResult, getTodayKey } from '../utils/storage';
import type { AppProgress, DayProgress } from '../utils/storage';
import { getTotalDays, getDayNumber } from '../utils/scheduler';

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const markLearned = useCallback((word: string) => {
    setProgress(prev => {
      const next = markWordLearned({ ...prev }, getDayNumber(), word);
      saveProgress(next);
      return next;
    });
  }, []);

  const recordQuiz = useCallback((correct: number, total: number, wrongWords: string[]) => {
    setProgress(prev => {
      const next = recordQuizResult({ ...prev }, getDayNumber(), correct, total, wrongWords);
      saveProgress(next);
      return next;
    });
  }, []);

  const todayProgress: DayProgress | null = progress.days[getTodayKey()] || null;
  const totalProgress = Object.keys(progress.days).length;
  const totalDays = getTotalDays();

  return {
    progress,
    todayProgress,
    totalProgress,
    totalDays,
    markLearned,
    recordQuiz,
  };
}
