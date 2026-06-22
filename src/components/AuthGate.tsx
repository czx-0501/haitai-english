import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('请填写完整'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!nickname) { setError('请填写昵称'); setAuthLoading(false); return; }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email, password,
          options: { data: { nickname } }
        });
        if (signUpErr) { setError(signUpErr.message); setAuthLoading(false); return; }
        if (data?.session) {
          setSession(data.session);
          return;
        }
        setError('注册成功！请查看邮箱确认邮件后登录');
        setAuthLoading(false);
        return;
      }

     const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) { setError(signInErr.message); setAuthLoading(false); return; }
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s) setSession(s);
      setAuthLoading(false);
      return;
    } catch (e: any) {
      setError(e.message || '操作失败');
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src="/logo.jpg" alt="海苔英语" className="w-16 h-16 mx-auto mb-4 rounded-full object-cover" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (session) return <>{children}</>;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-8">
      <div className="text-center mb-10">
        <img src="/logo.jpg" alt="海苔英语" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover shadow-lg" />
        <h1 className="text-2xl font-bold text-gray-900">海苔英语</h1>
        <p className="text-sm text-gray-400 mt-1">从小白到日常流畅沟通</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-center mb-6">{authMode === 'login' ? '登录' : '注册'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <input
              value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="昵称"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
              required
            />
          )}
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
            required
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码（至少6位）"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium text-sm disabled:opacity-60"
          >
            {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          {authMode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-[var(--primary)] ml-1"
          >
            {authMode === 'login' ? '去注册' : '去登录'}
          </button>
        </p>
      </div>

      <p className="text-xs text-gray-300 mt-8">登录即表示同意使用条款</p>
    </div>
  );
}
