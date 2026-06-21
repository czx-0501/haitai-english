import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Share2, Plus, Award, Users, Send, UserPlus, X, Search } from 'lucide-react';
import { getPosts, toggleLike, createPost, shareStudyResult, getComments, addComment, searchUsers, sendFriendRequest, getFriends } from '../supabase/social';
import { signOut, getCurrentUser } from '../supabase/auth';
import type { AuthUser } from '../supabase/auth';
import type { Post } from '../supabase/social';

export default function Circle() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [feedMode, setFeedMode] = useState<'all' | 'friends'>('all');
  const [friendIds, setFriendIds] = useState<string[]>([]);

  useEffect(() => { loadUser(); loadPosts(); }, []);

  async function loadUser() {
    const u = await getCurrentUser();
    setUser(u);
  }

  async function loadFeed(mode: string, ids: string[]) {
    const { data, error } = await getPosts();
    if (data) {
      if (mode === 'friends' && ids.length > 0) {
        const uid = user?.id;
        setPosts(data.filter(p => p.user_id === uid || ids.includes(p.user_id)));
      } else {
        setPosts(data);
      }
    }
  }

  async function switchFeedMode(mode: 'all' | 'friends') {
    setFeedMode(mode);
    if (mode === 'friends') {
      const data = await getFriends();
      const ids = data.map((f: any) => f.friend_id);
      setFriendIds(ids);
      await loadFeed('friends', ids);
    } else {
      await loadFeed('all', []);
    }
  }

  async function loadPosts() {
    if (feedMode === 'friends' && friendIds.length > 0) {
      await loadFeed('friends', friendIds);
    } else {
      await loadFeed('all', []);
    }
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
  }

  async function handleLike(postId: string) {
    await toggleLike(postId);
    await loadPosts();
  }

  async function handlePost() {
    if (!newPost.trim()) return;
    const { error } = await createPost(newPost.trim());
    if (error) {
      alert('发布失败: ' + (typeof error === 'string' ? error : error?.message || JSON.stringify(error)));
      return;
    }
    setNewPost('');
    await loadPosts();
  }

  async function handleShareStudy() {
    await shareStudyResult(20, 85, 1);
    await loadPosts();
  }

  // === Comments ===
  async function toggleComments(postId: string) {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    const data = await getComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
  }

  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    const { error } = await addComment(postId, commentText.trim());
    if (!error) {
      setCommentText('');
      const data = await getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
      await loadPosts();
    }
  }

  // === Friends ===
  async function handleOpenFriends() {
    setShowFriends(true);
    const data = await getFriends();
    setFriends(data);
  }

  async function handleSearchUsers() {
    if (!friendSearch.trim()) { setSearchResults([]); return; }
    const data = await searchUsers(friendSearch.trim());
    setSearchResults(data.filter(u => u.id !== user?.id));
  }

  async function handleSendFriendRequest(userId: string) {
    await sendFriendRequest(userId);
    setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, sent: true } : u));
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">圈子</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <button onClick={handleOpenFriends} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">
              <Users size={16} /> 好友
            </button>
            <button onClick={handleShareStudy} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-sm hover:bg-amber-100">
              <Award size={16} /> 打卡
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{user.nickname}</span>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">加载中...</div>
        )}
      </div>

      {/* Feed mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
        <button onClick={() => switchFeedMode('all')}
          className={'flex-1 py-2 text-sm rounded-lg text-center transition-all ' + (feedMode === 'all' ? 'bg-white text-[var(--primary)] font-medium shadow-sm' : 'text-gray-500')}>
          🌍 世界
        </button>
        <button onClick={() => switchFeedMode('friends')}
          className={'flex-1 py-2 text-sm rounded-lg text-center transition-all ' + (feedMode === 'friends' ? 'bg-white text-[var(--primary)] font-medium shadow-sm' : 'text-gray-500')}>
          👥 朋友圈
        </button>
      </div>

      {/* Friends Panel */}
      {showFriends && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowFriends(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">好友</h2>
              <button onClick={() => setShowFriends(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* My ID */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">我的ID：</span>
              <code className="text-xs text-gray-700 flex-1 truncate">{user?.id}</code>
              <button onClick={() => { navigator.clipboard.writeText(user?.id || ''); alert('ID已复制'); }} className="text-xs px-2 py-1 rounded-lg bg-[var(--primary)] text-white">复制</button>
            </div>

            {/* Search users */}
            <div className="flex items-center gap-2 mb-4">
              <input value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder="搜索用户昵称..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button onClick={handleSearchUsers} className="p-2 rounded-xl bg-[var(--primary)] text-white"><Search size={16} /></button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mb-4 border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">搜索结果</p>
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">{u.nickname[0]}</div>
                      <span className="text-sm">{u.nickname}</span>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(u.id)}
                      disabled={u.sent}
                      className="text-xs px-3 py-1 rounded-xl bg-[var(--primary)] text-white disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {u.sent ? '已发送' : <><UserPlus size={14} className="inline" /> 加好友</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <p className="text-xs text-gray-400 mb-2">我的好友 ({friends.length})</p>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">暂无好友</p>
            ) : (
              friends.map((f: any) => (
                <div key={f.friend_id} className="flex items-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm font-medium text-green-500">
                    {f.user_profiles?.nickname?.[0] || '?'}
                  </div>
                  <span className="text-sm">{f.user_profiles?.nickname || '匿名'}</span>
                </div>
              ))
            )}
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
              {/* Post header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                  {post.user?.nickname?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{post.user?.nickname || '匿名'}</p>
                  <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>

              {/* Post content */}
              <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 text-gray-400">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-sm hover:text-red-500">
                  <Heart size={16} /> {post.likes_count || 0}
                </button>
                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 text-sm hover:text-[var(--primary)]">
                  <MessageCircle size={16} /> {post.comments_count || 0}
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-[var(--primary)]">
                  <Share2 size={16} /> 分享
                </button>
              </div>

              {/* Comments section */}
              {expandedPost === post.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {/* Comments list */}
                  {(comments[post.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">暂无评论</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {(comments[post.id] || []).map((comment: any) => (
                        <div key={comment.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                            {comment.user?.nickname?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{comment.user?.nickname || '匿名'}</p>
                            <p className="text-xs text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="写评论..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-gray-50 text-xs outline-none"
                      onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id); }}
                    />
                    <button onClick={() => handleAddComment(post.id)} disabled={!commentText.trim()} className="p-1.5 rounded-xl bg-[var(--primary)] text-white disabled:opacity-40">
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
