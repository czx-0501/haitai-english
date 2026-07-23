import vocabulary from './vocab';
// Auto-generated vocabulary - 3000 words across 150 days (3 stages)

export interface WordEntry {
  w: string;
  p: string;
  pos: string;
  m: string;
  ex: { e: string; c: string }[];
}

export interface DayData {
  day: number;
  theme: string;
  stage: number;
  words: WordEntry[];
}

export interface DayData { day: number; theme: string; stage: number; words: WordEntry[]; }

export default vocabulary;
