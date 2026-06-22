import { useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { grammarQuestions } from '../data/grammar';
import { Link } from 'react-router-dom';

const LABEL_MAP: Record<string, string> = { tense: '时态', clause: '从句', subjunctive: '虚拟语气' };
const OPTIONS = ['A', 'B', 'C', 'D'];

export default function Grammar() {
  const [category, setCategory] = useState('all');
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  const questions = useMemo(() => {
    const filtered = category === 'all' ? [...grammarQuestions] : grammarQuestions.filter(q => q.category === category);
    return filtered.sort(() => Math.random() - 0.5);
  }, [category]);

  const current = questions[idx];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correctIndex) setCorrect(c => c + 1);
    setTotal(t => t + 1);
  };

  const handleNext = () => {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/practice" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold text-gray-900">语法练习</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg font-bold mb-2">语法练习</p>
          <p className="text-sm text-gray-400 mb-6">时态、从句、虚拟语气共 100 题</p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { key: 'all', label: '全部' },
              { key: 'tense', label: '时态' },
              { key: 'clause', label: '从句' },
              { key: 'subjunctive', label: '虚拟语气' },
            ].map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`px-4 py-1.5 rounded-full text-sm ${category === c.key ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-600'}`}>{c.label}</button>
            ))}
          </div>
          <button onClick={() => { setStarted(true); setIdx(0); setSelected(null); setCorrect(0); setTotal(0); }}
            className="px-8 py-3 rounded-xl bg-[var(--primary)] text-white font-medium">开始练习</button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="text-xl font-bold mb-2">练习完成</h2>
        <p className="text-4xl font-bold text-[var(--primary)] mb-2">{correct} / {total}</p>
        <p className="text-gray-400 mb-6">{pct}%</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { setDone(false); setStarted(false); }} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600">返回</button>
          <button onClick={() => { setIdx(0); setSelected(null); setCorrect(0); setTotal(0); setDone(false); }}
            className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white"><RefreshCw size={16} className="inline mr-1" />再来一次</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/practice" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900">语法练习</h1>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{idx + 1} / {questions.length}</span>
          <span>正确 {correct}/{total}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-[var(--primary)] rounded-full h-1.5 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
      </div>

      <span className="inline-block text-xs text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 mb-3">{LABEL_MAP[current?.category] || current?.category}</span>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
        <p className="text-lg text-gray-900 leading-relaxed">{current?.question}</p>
      </div>

      <div className="space-y-2 mb-4">
        {current?.options.map((opt: string, i: number) => {
          let cls = 'bg-white border-gray-200';
          if (selected !== null) {
            if (i === current.correctIndex) cls = 'bg-green-50 border-green-300';
            else if (i === selected) cls = 'bg-red-50 border-red-300';
          }
          return (
            <div key={i} onClick={() => handleSelect(i)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${cls}`}>
              <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">{OPTIONS[i]}</span>
              <span className="text-sm">{opt}</span>
            </div>
          );
        })}
      </div>

      {selected !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className={`text-sm font-medium ${selected === current.correctIndex ? 'text-green-700' : 'text-red-700'} mb-1`}>
            {selected === current.correctIndex ? '✅ 正确' : '❌ 错误'}
          </p>
          <p className="text-sm text-amber-800">{current?.explanation}</p>
        </div>
      )}

      <button onClick={handleNext} disabled={selected === null}
        className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium disabled:opacity-40">
        {idx < questions.length - 1 ? '下一题' : '查看结果'}
      </button>
    </div>
  );
}
