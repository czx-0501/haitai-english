import vocabulary from '../data/vocabulary';
import type { DayData } from '../data/vocabulary';

export function getDayNumber(): number {
  const startStr = localStorage.getItem('engdaily_start') || new Date().toISOString().split('T')[0];
  const start = new Date(startStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  const baseDay = Math.min(Math.max(1, diff + 1), 300);
  const offset = CEFR_OFFSETS[getSelectedLevel()] || 0;
  return Math.min(baseDay + offset, 300);
}

const LEARNING_MODE_KEY = 'engdaily_learning_mode';
export function getLearningMode() { try { return localStorage.getItem(LEARNING_MODE_KEY) || 'CEFR'; } catch(e) { return 'CEFR'; } }
export function setLearningMode(mode: string) { try { localStorage.setItem(LEARNING_MODE_KEY, mode); } catch(e) {} }

import { toeflVocabulary } from '../data/toefl';
import { ieltsVocabulary } from '../data/ielts';

function getTodayData(): DayData | null {
  const mode = getLearningMode();
  if (mode === 'TOEFL') {
    const day = getDayNumber();
    return (toeflVocabulary as any[]).find((d: any) => d.day === day) || null;
  }
  if (mode === 'IELTS') {
    const day = getDayNumber();
    return (ieltsVocabulary as any[]).find((d: any) => d.day === day) || null;
  }
  const day = getDayNumber();
  return vocabulary.find((d: any) => d.day === day) || null;
}

export function getDayData(day: number): DayData | null {
  return vocabulary.find(d => d.day === day) || null;
}

export function getAllDays(): DayData[] {
  return vocabulary;
}

export function getStageDays(stage: number): DayData[] {
  return vocabulary.filter(d => d.stage === stage);
}

export function getTotalDays(): number {
  return 300;
}

export function getCEFRLevel(day: number): string {
  if (day <= 50) return 'A1';
  if (day <= 100) return 'A2';
  if (day <= 150) return 'B1';
  if (day <= 200) return 'B2';
  if (day <= 250) return 'C1';
  return 'C2';
}

export function getCEFRLabel(level: string): string {
  const labels: Record<string, string> = {
    A1: '入门', A2: '初级',
    B1: '中级', B2: '中高级',
    C1: '高级', C2: '精通'
  };
  return labels[level] || '';
}

const CEFR_OFFSETS: Record<string, number> = { A1: 0, A2: 50, B1: 100, B2: 150, C1: 200, C2: 250 };

export function getCEFROptions() {
  return [
    { value: 'A1', label: 'A1 入门' },
    { value: 'A2', label: 'A2 初级' },
    { value: 'B1', label: 'B1 中级' },
    { value: 'B2', label: 'B2 中高级' },
    { value: 'C1', label: 'C1 高级' },
    { value: 'C2', label: 'C2 精通' },
  ];
}

export function getSelectedLevel(): string {
  return localStorage.getItem('engdaily_cefr_level') || 'A1';
}

export function setSelectedLevel(level: string) {
  localStorage.setItem('engdaily_cefr_level', level);
}

export function getCEFRProgress(day: number) {
  return {
    level: getCEFRLevel(day),
    label: getCEFRLabel(getCEFRLevel(day)),
    dayStart: Math.floor((day - 1) / 50) * 50 + 1,
    dayEnd: (Math.floor((day - 1) / 50) + 1) * 50,
    progress: ((day - 1) % 50) / 50 * 100
  };
}


// Ensure TOEFL/IELTS modules are available
