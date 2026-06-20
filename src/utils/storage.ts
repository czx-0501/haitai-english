const STORAGE_KEY = 'engdaily_progress';

export interface DayProgress {
  date: string;           // YYYY-MM-DD
  day: number;
  wordsLearned: number;
  totalWords: number;
  quizCorrect: number;
  quizTotal: number;
  wrongWords: string[];   // word strings for review
  completed: boolean;     // all 20 words + quiz done
}

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string | null;
}

export interface AppProgress {
  streak: StreakData;
  days: Record<string, DayProgress>;
  totalLearnedWords: number;
  startDate: string;
}

const defaultProgress: AppProgress = {
  streak: { current: 0, longest: 0, lastDate: null },
  days: {},
  totalLearnedWords: 0,
  startDate: new Date().toISOString().split('T')[0],
};

export function loadProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Merge with defaults for any missing fields
      return { ...defaultProgress, ...data };
    }
  } catch { /* ignore */ }
  return { ...defaultProgress };
}

export function saveProgress(p: AppProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayProgress(p: AppProgress): DayProgress | null {
  const key = getTodayKey();
  return p.days[key] || null;
}

export function updateStreak(p: AppProgress): AppProgress {
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (p.streak.lastDate === today) return p;
  
  if (p.streak.lastDate === yesterday || p.streak.lastDate === null) {
    p.streak.current += 1;
  } else {
    p.streak.current = 1;
  }
  p.streak.lastDate = today;
  
  if (p.streak.current > p.streak.longest) {
    p.streak.longest = p.streak.current;
  }
  
  return p;
}

export function markWordLearned(p: AppProgress, day: number, word: string): AppProgress {
  const key = getTodayKey();
  if (!p.days[key]) {
    p.days[key] = {
      date: key,
      day,
      wordsLearned: 0,
      totalWords: 20,
      quizCorrect: 0,
      quizTotal: 0,
      wrongWords: [],
      completed: false,
    };
  }
  
  const dp = p.days[key];
  if (dp.wordsLearned < dp.totalWords) {
    const learnedKey = `learned_${key}`;
    const learned: string[] = JSON.parse(localStorage.getItem(learnedKey) || '[]');
    if (!learned.includes(word)) {
      learned.push(word);
      localStorage.setItem(learnedKey, JSON.stringify(learned));
      dp.wordsLearned = learned.length;
      p.totalLearnedWords += 1;
    }
  }
  
  // Check if day is complete
  if (dp.wordsLearned >= dp.totalWords && dp.quizTotal > 0) {
    dp.completed = true;
    p = updateStreak(p);
  }
  
  return p;
}

export function recordQuizResult(p: AppProgress, day: number, correct: number, total: number, wrongWords: string[]): AppProgress {
  const key = getTodayKey();
  if (!p.days[key]) {
    p.days[key] = {
      date: key,
      day,
      wordsLearned: 0,
      totalWords: 20,
      quizCorrect: 0,
      quizTotal: 0,
      wrongWords: [],
      completed: false,
    };
  }
  
  const dp = p.days[key];
  dp.quizCorrect = correct;
  dp.quizTotal = total;
  dp.wrongWords = [...new Set([...dp.wrongWords, ...wrongWords])];
  
  if (dp.wordsLearned >= dp.totalWords && dp.quizTotal > 0) {
    dp.completed = true;
    p = updateStreak(p);
  }
  
  return p;
}
