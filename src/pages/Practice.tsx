import { Link } from 'react-router-dom';


export default function Practice() {
  return (
    <div className="space-y-5">
      <div className="text-center pt-2 pb-1">
        <h1 className="text-2xl font-bold text-gray-900">专项练习</h1>
        <p className="text-sm text-gray-400 mt-0.5">语法 · 阅读 · 听力</p>
      </div>

      <div className="space-y-3">
        <Link to="/practice/grammar" className="block">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">📝</div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">语法练习</p>
              <p className="text-sm text-gray-500 mt-0.5">时态、从句、虚拟语气选择题</p>
              <p className="text-xs text-gray-400 mt-1">包含 A2 - C1 级别 100 道题</p>
            </div>
            <span className="text-gray-400 text-xl">›</span>
          </div>
        </Link>

        <Link to="/practice/reading" className="block">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100 hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">📖</div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">短文阅读</p>
              <p className="text-sm text-gray-500 mt-0.5">分级短文 + 阅读理解题</p>
              <p className="text-xs text-gray-400 mt-1">包含 A1 - C2 级别 12 篇</p>
            </div>
            <span className="text-gray-400 text-xl">›</span>
          </div>
        </Link>

        <Link to="/practice/listening" className="block">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100 hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">🎧</div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">听力训练</p>
              <p className="text-sm text-gray-500 mt-0.5">单词和句子听写练习</p>
              <p className="text-xs text-gray-400 mt-1">基于 TTS 发音，检验拼写</p>
            </div>
            <span className="text-gray-400 text-xl">›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
