import { useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Volume2, RefreshCw } from 'lucide-react';
import { speak } from '../utils/speech';
import type { WordEntry } from '../data/vocabulary';

interface Props {
  words: WordEntry[];
  onComplete: (correct: number, total: number, wrongWords: string[]) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({ words, onComplete }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wrongList, setWrongList] = useState<string[]>([]);

  const questions = useMemo(() => {
    if (!words.length) return [];
    return shuffle(words).map(w => {
      const wrongOnes = words
        .filter(other => other.w !== w.w)
        .map(other => other.m)
        .filter((v, i, a) => a.indexOf(v) === i);
      const shuffledWrong = shuffle(wrongOnes).slice(0, 3);
      const options = shuffle([w.m, ...shuffledWrong]);
      return {
        word: w,
        options,
        correctIndex: options.indexOf(w.m),
      };
    });
  }, [words]);

  const question = questions[currentQ] || null;

  const handleAnswer = useCallback((index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === question?.correctIndex;
    setAnswers(prev => [...prev, correct]);
    if (!correct && question) {
      setWrongList(prev => [...prev, question.word.w]);
    }
  }, [selected, question]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      const correct = answers.filter(Boolean).length + (selected === question?.correctIndex ? 1 : 0);
      onComplete(correct, questions.length, wrongList);
    }
  }, [currentQ, questions.length, answers, selected, question, wrongList, onComplete]);

  const handleRestart = () => {
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowResult(false);
    setWrongList([]);
  };

  const handleSpeak = (text: string) => {
    speak(text);
  };

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p>暂无单词可测</p>
      </div>
    );
  }

  if (showResult) {
    const correctCount = answers.filter(Boolean).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="animate-slideUp text-center py-8">
        <div className="text-6xl mb-4">
          {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold mb-2">测验完成！</h2>
        <p className="text-gray-500 mb-2">
          正确 {correctCount} / {questions.length}
        </p>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
          <div
            className="h-3 rounded-full transition-all duration-1000"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage >= 80 ? 'var(--success)' : percentage >= 60 ? 'var(--accent)' : '#ef4444'
            }}
          />
        </div>
        {wrongList.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-red-600 mb-2">需要复习的单词 ({wrongList.length})：</p>
            <div className="flex flex-wrap gap-2">
              {wrongList.map(w => (
                <span key={w} className="px-3 py-1 bg-white rounded-lg text-sm text-red-500 border border-red-200">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-blue-600 transition-all font-medium"
        >
          <RefreshCw size={18} /> 再来一次
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">
          第 {currentQ + 1} / {questions.length} 题
        </span>
        <div className="flex gap-1">
          {answers.map((c, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c ? 'bg-green-400' : 'bg-red-400'}`} />
          ))}
          {Array.from({ length: questions.length - answers.length }, (_, i) => (
            <div key={`p-${i}`} className="w-2 h-2 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Question */}
      {question && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-400 mb-2">请选择正确的中文释义</p>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">{question.word.w}</h2>
              <button
                onClick={() => handleSpeak(question.word.w)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="朗读发音"
              >
                <Volume2 size={20} className="text-[var(--primary)]" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">{question.word.p}</p>
          </div>

          <div className="grid gap-3">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctIndex;
              const isSelected = selected === i;
              let btnStyle = 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800';
              if (isSelected && isCorrect) btnStyle = 'bg-green-50 border-green-400 text-green-700';
              else if (isSelected && !isCorrect) btnStyle = 'bg-red-50 border-red-400 text-red-700';
              else if (selected !== null && isCorrect) btnStyle = 'bg-green-50 border-green-400 text-green-700';

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${btnStyle}`}
                >
                  <span className="flex items-center gap-2">
                    {selected !== null && isCorrect && <CheckCircle size={18} className="text-green-500" />}
                    {isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                    <span>{opt}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Next button */}
      {selected !== null && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-blue-600 transition-all animate-slideUp"
        >
          {currentQ < questions.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
