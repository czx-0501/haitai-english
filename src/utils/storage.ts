import vocabulary from '../data/vocabulary';

const STORAGE_KEY = 'engdaily_progress';
const REVIEW_INTERVALS = [1, 3, 7, 15];

export interface DayProgress {
  date: string;
  day: number;
  wordsLearned: number;
  totalWords: number;
  quizCorrect: number;
  quizTotal: number;
  wrongWords: string[];
  completed: boolean;
}

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string | null;
}

export interface WordHistoryEntry {
  stage: number;
  firstLearned: string;
  nextReview: string;
  lastReviewed: string;
}

export interface AchievementDef {
  id: string;
  days: number;
  icon: string;
  name: string;
}

export interface AchievementUnlocked {
  id: string;
  icon: string;
  name: string;
  unlockedDate: string;
}

export interface AppProgress {
  streak: StreakData;
  days: Record<string, DayProgress>;
  totalLearnedWords: number;
  startDate: string;
  wordHistory: Record<string, WordHistoryEntry>;
  achievements: Record<string, string>;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'streak_3',  days: 3,  icon: '🔥', name: '初出茅庐' },
  { id: 'streak_7',  days: 7,  icon: '⭐', name: '坚持不懈' },
  { id: 'streak_14', days: 14, icon: '🌟', name: '渐入佳境' },
  { id: 'streak_30', days: 30, icon: '💪', name: '习惯成自然' },
  { id: 'streak_60', days: 60, icon: '🏆', name: '百炼成钢' },
  { id: 'streak_100', days: 100, icon: '👑', name: '英语达人' },
  { id: 'streak_150', days: 150, icon: '🎯', name: '完美毕业' },
];

const defaultProgress: AppProgress = {
  streak: { current: 0, longest: 0, lastDate: null },
  days: {},
  totalLearnedWords: 0,
  startDate: new Date().toISOString().split('T')[0],
  wordHistory: {},
  achievements: {},
};

export function loadProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
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
  p = checkAchievements(p);
  return p;
}

export function markWordLearned(p: AppProgress, day: number, word: string): AppProgress {
  const key = getTodayKey();
  if (!p.days[key]) {
    p.days[key] = {
      date: key, day,
      wordsLearned: 0, totalWords: 20,
      quizCorrect: 0, quizTotal: 0,
      wrongWords: [], completed: false,
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
  // Add to spaced repetition history
  addWordToHistory(p, word);
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
      date: key, day,
      wordsLearned: 0, totalWords: 20,
      quizCorrect: 0, quizTotal: 0,
      wrongWords: [], completed: false,
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

// === Spaced Repetition ===

export function addWordToHistory(p: AppProgress, word: string): void {
  if (!p.wordHistory) p.wordHistory = {};
  if (!p.wordHistory[word]) {
    const today = getTodayKey();
    p.wordHistory[word] = {
      stage: 0,
      firstLearned: today,
      nextReview: today,
      lastReviewed: today,
    };
  }
}

export function getDueWords(): { w: string; m: string; p?: string; pos?: string; ex?: { e: string; c: string }[] }[] {
  const p = loadProgress();
  const today = getTodayKey();
  const due: typeof vocabulary[0]['words'] = [];
  if (!p.wordHistory) return due;
  for (const [word, record] of Object.entries(p.wordHistory)) {
    if (record.stage >= 4) continue;
    if (record.nextReview <= today) {
      for (const day of vocabulary) {
        const found = day.words.find(w => w.w === word);
        if (found) { due.push(found); break; }
      }
    }
  }
  return due;
}

export function getDueCount(): number {
  return getDueWords().length;
}

export function updateReviewResult(p: AppProgress, word: string, correct: boolean): void {
  const record = p.wordHistory?.[word];
  if (!record) return;
  const today = getTodayKey();
  if (correct) {
    record.stage += 1;
    if (record.stage >= 4) {
      record.nextReview = 'done';
    } else {
      const next = new Date();
      next.setDate(next.getDate() + REVIEW_INTERVALS[record.stage]);
      record.nextReview = next.toISOString().split('T')[0];
    }
  } else {
    record.stage = 0;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    record.nextReview = next.toISOString().split('T')[0];
  }
  record.lastReviewed = today;
}

// === Achievements ===

export function checkAchievements(p: AppProgress): AppProgress {
  if (!p.achievements) p.achievements = {};
  const streak = p.streak.current;
  const today = getTodayKey();
  for (const ach of ACHIEVEMENTS) {
    if (!p.achievements[ach.id] && streak >= ach.days) {
      p.achievements[ach.id] = today;
    }
  }
  return p;
}

export function getUnlockedAchievements(p: AppProgress): AchievementUnlocked[] {
  if (!p.achievements) return [];
  const result: AchievementUnlocked[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (p.achievements[ach.id]) {
      result.push({ id: ach.id, icon: ach.icon, name: ach.name, unlockedDate: p.achievements[ach.id] });
    }
  }
  result.sort((a, b) => b.unlockedDate.localeCompare(a.unlockedDate));
  return result;
}
