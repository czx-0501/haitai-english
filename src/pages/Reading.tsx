import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { readingPassages } from '../data/reading';
import { Link } from 'react-router-dom';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const OPTIONS = ['A', 'B', 'C', 'D'];

export default function Reading() {
  const [passage, setPassage] = useState<typeof readingPassages[0] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!passage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/practice" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold text-gray-900">短文阅读</h1>
        </div>
        <p className="text-sm text-gray-400 mb-2">{readingPassages.length} 篇分级文章</p>
        {LEVELS.map(level => {
          const items = readingPassages.filter(p => p.level === level);
          return items.length > 0 ? (
            <div key={level}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">{level}</span>
                <span className="text-xs text-gray-400">{items.length} 篇</span>
              </div>
              {items.map(p => (
                <div key={p.id} onClick={() => { setPassage(p); setAnswers({}); setSubmitted(false); }}
                  className="bg-white rounded-xl p-3.5 border border-gray-100 mb-1.5 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all">
                  <p className="text-sm font-medium text-gray-800">{p.title}</p>
                  <span className="text-gray-300">›</span>
                </div>
              ))}
            </div>
          ) : null;
        })}
      </div>
    );
  }

  const correctCount = submitted ? passage.questions.filter((q, i) => answers[i] === q.correctIndex).length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setPassage(null)} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-gray-900">{passage.title}</h1>
        </div>
        <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">{passage.level}</span>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{passage.passage}</p>
      </div>

      <h3 className="text-base font-bold mb-3">阅读理解题</h3>
      {passage.questions.map((q, qi) => (
        <div key={qi} className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
          <p className="text-sm font-medium mb-2">{qi + 1}. {q.q}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => {
              let cls = 'border-gray-200 bg-white';
              if (submitted) {
                if (oi === q.correctIndex) cls = 'border-green-300 bg-green-50';
                else if (answers[qi] === oi) cls = 'border-red-300 bg-red-50';
              } else if (answers[qi] === oi) {
                cls = 'border-[var(--primary)] bg-blue-50';
              }
              return (
                <div key={oi} onClick={() => { if (!submitted) setAnswers(a => ({ ...a, [qi]: oi })); }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${cls}`}>
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">{OPTIONS[oi]}</span>
                  <span className="text-xs">{opt}</span>
                </div>
              );
            })}
          </div>
          {submitted && <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">{q.explanation}</p>}
        </div>
      ))}

      {submitted ? (
        <div className="bg-green-50 rounded-xl p-4 text-center mb-4">
          <p className="text-lg font-bold text-green-700">{correctCount} / {passage.questions.length} 正确</p>
        </div>
      ) : (
        <button onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < passage.questions.length}
          className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium disabled:opacity-40">
          提交答案
        </button>
      )}
    </div>
  );
}
