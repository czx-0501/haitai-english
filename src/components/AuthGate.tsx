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

  // 密码重置相关
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  useEffect(() => {
    // 检查是否为密码重置回调（URL hash 中带有 type=recovery）
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
      // 清理 URL hash，避免刷新时重复进入
      window.history.replaceState(null, '', window.location.pathname);
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [session]);

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

    let { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      // Retry once - WKWebView cold start network warm-up
      await new Promise(r => setTimeout(r, 300));
      const retry = await supabase.auth.signInWithPassword({ email, password });
      data = retry.data;
      signInErr = retry.error;
    }
   if (data?.session) setSession(data.session);
   setAuthLoading(false);
   return;
  } catch (e: any) {
     setError(e.message || '操作失败');
    }
  }

  // 发送密码重置邮件
  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('请输入邮箱地址'); return; }
    setAuthLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetErr) { setError(resetErr.message); setAuthLoading(false); return; }
      setResetEmailSent(true);
      setAuthLoading(false);
    } catch (e: any) {
      setError(e.message || '发送失败');
      setAuthLoading(false);
    }
  }

  // 设置新密码
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) { setError('密码至少6位'); return; }
    if (newPassword !== newPasswordConfirm) { setError('两次密码不一致'); return; }
    setAuthLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) { setError(updateErr.message); setAuthLoading(false); return; }
      setRecoverySuccess(true);
      setAuthLoading(false);
      setTimeout(() => {
        setIsRecoveryMode(false);
        setRecoverySuccess(false);
        setNewPassword('');
        setNewPasswordConfirm('');
        setEmail('');
        setPassword('');
      }, 3000);
    } catch (e: any) {
      setError(e.message || '更新失败');
      setAuthLoading(false);
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

  if (session && !isRecoveryMode) return <>{children}</>;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-8">
      <div className="text-center mb-10">
        <img src="/logo.jpg" alt="海苔英语" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover shadow-lg" />
        <h1 className="text-2xl font-bold text-gray-900">海苔英语</h1>
        <p className="text-sm text-gray-400 mt-1">从小白到日常流畅沟通</p>
      </div>

      {/* 密码重置模式：设置新密码 */}
      {isRecoveryMode && !recoverySuccess && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-center mb-6">设置新密码</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input
              type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
              required minLength={6}
            />
            <input
              type="password" value={newPasswordConfirm}
              onChange={e => setNewPasswordConfirm(e.target.value)}
              placeholder="确认新密码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
              required minLength={6}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium text-sm disabled:opacity-60">
              {authLoading ? '处理中...' : '更新密码'}
            </button>
          </form>
        </div>
      )}

      {/* 密码重置成功 */}
      {isRecoveryMode && recoverySuccess && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">密码已更新</h2>
          <p className="text-sm text-gray-400">请使用新密码登录</p>
        </div>
      )}

      {/* 找回密码：发送重置邮件 */}
      {showResetPassword && !isRecoveryMode && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-center mb-6">
            {resetEmailSent ? '邮件已发送' : '重置密码'}
          </h2>

          {!resetEmailSent ? (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                请输入注册时使用的邮箱地址，我们会向该邮箱发送重置密码链接。
              </p>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="注册邮箱"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
                required
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button type="submit" disabled={authLoading}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium text-sm disabled:opacity-60">
                {authLoading ? '发送中...' : '发送重置链接'}
              </button>
            </form>
          ) : (
            <div className="text-center py-2">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                重置密码链接已发送至 <strong className="text-gray-700">{email}</strong>，
                请前往邮箱查收并点击链接完成重置。
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            <button onClick={() => { setShowResetPassword(false); setResetEmailSent(false); setError(''); setEmail(''); }}
              className="text-[var(--primary)]">
              返回登录
            </button>
          </p>
        </div>
      )}

      {/* 登录/注册 */}
      {!showResetPassword && !isRecoveryMode && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-center mb-6">{authMode === 'login' ? '登录' : '注册'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <input value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="昵称"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
                required
              />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="邮箱"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
              required
            />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="密码（至少6位）"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-[var(--primary)]"
              required minLength={6}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium text-sm disabled:opacity-60">
              {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            {authMode === 'login' ? '还没有账号？' : '已有账号？'}
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-[var(--primary)] ml-1">
              {authMode === 'login' ? '去注册' : '去登录'}
            </button>
          </p>
          {authMode === 'login' && (
            <p className="text-xs text-center mt-2">
              <button onClick={() => { setShowResetPassword(true); setError(''); setEmail(''); }}
                className="text-gray-400 hover:text-[var(--primary)]">
                忘记密码？
              </button>
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-300 mt-8">登录即表示同意使用条款</p>
    </div>
  );
}
