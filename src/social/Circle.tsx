import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Share2, Plus, LogIn, UserPlus, Award } from 'lucide-react';
import { supabase } from '../supabase/client';
import { getPosts, toggleLike, getComments, addComment, createPost, shareStudyResult } from '../supabase/social';
import { signUp, signIn, signOut, getCurrentUser } from '../supabase/auth';
import type { AuthUser } from '../supabase/auth';
import type { Post } from '../supabase/social';

export default function Circle() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [newPost, setNewPost] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadUser(); loadPosts(); }, []);

  async function loadUser() {
    const u = await getCurrentUser();
    setUser(u);
  }

  async function loadPosts() {
    const { data } = await getPosts();
    if (data) setPosts(data);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const result = authMode === 'register'
      ? await signUp(email, password, nickname)
      : await signIn(email, password);
    if (result.error) { setError(result.error); return; }
    setShowAuth(false);
    await loadUser();
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
  }

  async function handleLike(postId: string) {
    if (!user) { setShowAuth(true); return; }
    await toggleLike(postId);
    await loadPosts();
  }

  async function handlePost() {
    if (!newPost.trim()) return;
    await createPost(newPost.trim());
    setNewPost('');
    await loadPosts();
  }

  async function handleShareStudy() {
    if (!user) { setShowAuth(true); return; }
    await shareStudyResult(20, 85, 1);
    await loadPosts();
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">圈子</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <button onClick={handleShareStudy} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-sm hover:bg-amber-100">
              <Award size={16} /> 打卡分享
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{user.nickname}</span>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[var(--primary)] text-white text-sm">
            <LogIn size={16} /> 登录
          </button>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAuth(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{authMode === 'login' ? '登录' : '注册'}</h2>
            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === 'register' && (
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="昵称" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" required />
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码（至少6位）" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" required minLength={6} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm">
                {authMode === 'login' ? '登录' : '注册'}
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-3">
              {authMode === 'login' ? '还没有账号？' : '已有账号？'}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-[var(--primary)] ml-1">
                {authMode === 'login' ? '去注册' : '去登录'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Create Post */}
      {user && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="分享你的学习心得..." rows={2} className="w-full text-sm resize-none outline-none" />
          <div className="flex justify-end mt-2">
            <button onClick={handlePost} disabled={!newPost.trim()} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[var(--primary)] text-white text-sm disabled:opacity-50">
              <Plus size={16} /> 发布
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>还没有动态</p>
          <p className="text-sm mt-1">学习完单词来打卡吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                  {post.user?.nickname?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{post.user?.nickname || '匿名'}</p>
                  <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{post.content}</p>
              <div className="flex items-center gap-4 text-gray-400">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-sm hover:text-red-500">
                  <Heart size={16} /> {post.likes_count || 0}
                </button>
                <span className="flex items-center gap-1 text-sm">
                  <MessageCircle size={16} /> {post.comments_count || 0}
                </span>
                <button className="flex items-center gap-1 text-sm hover:text-[var(--primary)]">
                  <Share2 size={16} /> 分享
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
