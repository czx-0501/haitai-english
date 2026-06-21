import { useState, useMemo } from 'react';
import { ArrowLeft, Volume2, RefreshCw } from 'lucide-react';
import { speak } from '../utils/speech';
import { getTodayData } from '../utils/scheduler';
import { getAllDays } from '../utils/scheduler';
import { Link } from 'react-router-dom';

export default function Listening() {
  const [mode, setMode] = useState<'word' | 'sentence' | null>(null);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<{ expected: string; typed: string; correct: boolean }[]>([]);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const items = useMemo(() => {
    if (!mode) return [];
    const dayData = getTodayData();
    let list: { text: string }[] = [];
    if (mode === 'word' && dayData?.words) {
      list = dayData.words.slice(0, 10).map(w => ({ text: w.w }));
    } else if (mode === 'sentence' && dayData?.words) {
      for (const w of dayData.words) {
        if (w.ex?.length && list.length < 5) list.push({ text: w.ex[0].e });
      }
    }
    if (list.length === 0) {
      const all = getAllDays();
      const first = all.find(d => d.words?.length);
      if (first) {
        if (mode === 'word') list = first.words.slice(0, 10).map(w => ({ text: w.w }));
        else list = first.words.filter(w => w.ex?.length).slice(0, 5).map(w => ({ text: w.ex![0].e }));
      }
    }
    return list;
  }, [mode]);

  const current = items[idx];
  const pct = items.length > 0 ? Math.round((correct / items.length) * 100) : 0;

  const start = () => { setStarted(true); setIdx(0); setInput(''); setChecked(false); setResults([]); setCorrect(0); setDone(false); };
  const play = () => { if (current) speak(current.text); };
  const check = () => {
    if (!input.trim()) return;
    const isOk = input.trim().toLowerCase() === current.text.toLowerCase();
    setResults(r => [...r, { expected: current.text, typed: input.trim(), correct: isOk }]);
    if (isOk) setCorrect(c => c + 1);
    setChecked(true);
  };
  const next = () => {
    if (idx < items.length - 1) {
      setIdx(i => i + 1);
      setInput('');
      setChecked(false);
    } else {
      setDone(true);
    }
  };

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/practice" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold text-gray-900">听力训练</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎧</div>
          <p className="text-lg font-bold mb-2">听力训练</p>
          <p className="text-sm text-gray-400 mb-6">听写单词或句子，提升拼写能力</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={() => setMode('word')}
              className={`p-6 rounded-2xl border-2 text-center transition-all ${mode === 'word' ? 'border-[var(--primary)] bg-blue-50' : 'border-gray-200'}`}>
              <div className="text-3xl mb-2">🔤</div>
              <p className="text-sm font-medium">单词听写</p>
              <p className="text-xs text-gray-400 mt-1">听发音→拼写单词</p>
            </button>
            <button onClick={() => setMode('sentence')}
              className={`p-6 rounded-2xl border-2 text-center transition-all ${mode === 'sentence' ? 'border-[var(--primary)] bg-blue-50' : 'border-gray-200'}`}>
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-medium">句子听写</p>
              <p className="text-xs text-gray-400 mt-1">听完整句子→打字</p>
            </button>
          </div>
          <button onClick={start} disabled={!mode}
            className="px-8 py-3 rounded-xl bg-[var(--primary)] text-white font-medium disabled:opacity-40">开始练习</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 className="text-xl font-bold mb-2">练习完成</h2>
        <p className="text-4xl font-bold text-[var(--primary)] mb-6">{correct} / {items.length}</p>
        <div className="space-y-2 mb-6 text-left max-w-md mx-auto">
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl p-3 flex items-center gap-3 ${r.correct ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-lg">{r.correct ? '✅' : '❌'}</span>
              <div>
                <p className="text-sm font-medium">{r.expected}</p>
                {!r.correct && <p className="text-xs text-gray-400">你的输入: {r.typed}</p>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={start} className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white">
          <RefreshCw size={16} className="inline mr-1" />再来一次
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/practice" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900">{mode === 'word' ? '单词听写' : '句子听写'}</h1>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{idx + 1} / {items.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-[var(--primary)] rounded-full h-1.5 transition-all" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center mb-6">
        <p className="text-sm text-gray-400 mb-4">点击播放，听写以下内容</p>
        <button onClick={play} className="flex flex-col items-center mx-auto mb-4">
          <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-2">
            <Volume2 size={40} className="text-[var(--primary)]" />
          </div>
          <span className="text-sm text-[var(--primary)]">点击播放</span>
        </button>
      </div>

      <input value={input} onChange={e => setInput(e.target.value)} disabled={checked}
        placeholder="输入你听到的内容..."
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 bg-white disabled:opacity-50"
        onKeyDown={e => { if (e.key === 'Enter' && !checked) check(); }} />

      {checked && (
        <div className={`rounded-xl p-3 mb-3 text-sm text-center ${current && input.trim().toLowerCase() === current.text.toLowerCase() ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {current && input.trim().toLowerCase() === current.text.toLowerCase()
            ? '✅ 正确！'
            : `❌ 正确答案: ${current?.text}`}
        </div>
      )}

      {checked ? (
        <button onClick={next} className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium">
          {idx < items.length - 1 ? '下一题' : '查看结果'}
        </button>
      ) : (
        <button onClick={check} disabled={!input.trim()}
          className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium disabled:opacity-40">检查</button>
      )}
    </div>
  );
}
