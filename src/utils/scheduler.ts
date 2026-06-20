import vocabulary from '../data/vocabulary';
import type { DayData } from '../data/vocabulary';

export function getDayNumber(): number {
  const startStr = localStorage.getItem('engdaily_start') || new Date().toISOString().split('T')[0];
  const start = new Date(startStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.min(Math.max(1, diff + 1), vocabulary.length);
}

export function getTodayData(): DayData | null {
  const day = getDayNumber();
  return vocabulary.find(d => d.day === day) || null;
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
  return vocabulary.length;
}
