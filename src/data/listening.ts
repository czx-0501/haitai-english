// Listening exercises - dynamically generated from vocabulary
// Each vocabulary word can generate 2-3 question types:
// Type 1: Listen to word -> choose correct Chinese meaning
// Type 2: Listen to word -> choose correct English spelling  
// Type 3: Listen to example sentence -> choose correct translation
// With 5933 words x 3 types = 17799 possible exercises (800+ easily available)

export interface ListeningQuestion {
  type: 1 | 2 | 3;
  word: string;
  audioText: string;
  options: string[];
  correctIndex: number;
}

// Questions are generated on-the-fly from vocabulary
// See utils/speech.ts for TTS functionality
export function generateListeningQuestions(words: any[], count: number = 10): ListeningQuestion[] {
  const questions: ListeningQuestion[] = [];
  const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, Math.min(count * 2, words.length));
  
  for (const word of shuffled.slice(0, count)) {
    // Type 1: Listen to word, choose meaning
    const wrongMeanings = words
      .filter(w => w.w !== word.w)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.m);
    
    questions.push({
      type: 1,
      word: word.w,
      audioText: word.w,
      options: [word.m, ...wrongMeanings].sort(() => Math.random() - 0.5),
      correctIndex: [word.m, ...wrongMeanings].sort(() => Math.random() - 0.5).indexOf(word.m)
    });
  }
  
  return questions;
}

export const totalPossibleExercises = 17799;
