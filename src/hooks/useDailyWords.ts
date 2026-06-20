import { useState, useCallback, useEffect } from 'react';
import { getTodayData, getDayNumber } from '../utils/scheduler';
import type { WordEntry } from '../data/vocabulary';

export function useDailyWords() {
  const dayData = getTodayData();
  const day = getDayNumber();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<WordEntry[]>(dayData?.words || []);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  // Load learned words from storage
  useEffect(() => {
    const key = `learned_${new Date().toISOString().split('T')[0]}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    setLearnedWords(saved);
  }, []);

  const currentWord = words[currentIndex] || null;
  const isLearned = currentWord ? learnedWords.includes(currentWord.w) : false;
  const progress = words.length > 0 ? ((currentIndex + (isLearned ? 0 : 0)) / words.length) * 100 : 0;
  const learnedCount = learnedWords.length;

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, words.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const toggleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const markLearned = useCallback((word: string) => {
    setLearnedWords(prev => {
      if (prev.includes(word)) return prev;
      return [...prev, word];
    });
    // Also update localStorage
    const key = `learned_${new Date().toISOString().split('T')[0]}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!saved.includes(word)) {
      saved.push(word);
      localStorage.setItem(key, JSON.stringify(saved));
    }
  }, []);

  const reset = useCallback(() => {
    const newDayData = getTodayData();
    setWords(newDayData?.words || []);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  return {
    currentWord,
    currentIndex,
    totalWords: words.length,
    isFlipped,
    isLearned,
    progress,
    learnedCount,
    day,
    toggleFlip,
    handleNext,
    handlePrev,
    markLearned,
    reset,
    words,
  };
}
