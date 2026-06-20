import { supabase } from './client';

// === 动态圈子 ===
export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  share_type?: 'study' | 'daily';
  created_at: string;
  user?: { nickname: string; avatar_url: string };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
};

export async function getPosts(page = 0, limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:user_id (nickname, avatar_url),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  
  return { data: data as Post[], error };
}

export async function createPost(content: string, imageUrl?: string, shareType?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '未登录' };
  
  const { data, error } = await supabase.from('posts').insert({
    user_id: user.id,
    content,
    image_url: imageUrl,
    share_type: shareType,
  }).select().single();
  
  return { data, error };
}

// === 点赞 ===
export async function toggleLike(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '未登录' };
  
  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();
  
  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return { liked: false };
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    return { liked: true };
  }
}

// === 评论 ===
export async function getComments(postId: string) {
  const { data } = await supabase
    .from('comments')
    .select('*, user:user_id (nickname, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function addComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '未登录' };
  
  const { data, error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: user.id,
    content,
  }).select().single();
  
  return { data, error };
}

// === 好友 ===
export async function searchUsers(query: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, nickname, avatar_url')
    .ilike('nickname', `%${query}%`)
    .limit(20);
  return data || [];
}

export async function sendFriendRequest(targetUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '未登录' };
  
  const { error } = await supabase.from('friend_requests').insert({
    sender_id: user.id,
    receiver_id: targetUserId,
  });
  return { error };
}

export async function getFriends() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data } = await supabase
    .from('friends')
    .select('friend_id, user_profiles!friends_friend_id_fkey (nickname, avatar_url)')
    .eq('user_id', user.id);
  return data || [];
}

// === 打卡分享 ===
export async function shareStudyResult(wordsLearned: number, correctRate: number, day: number) {
  const content = `📚 海苔英语 Day ${day} 打卡\n学习了 ${wordsLearned} 个单词\n正确率 ${correctRate}%\n#海苔英语 #每日打卡`;
  return createPost(content, undefined, 'study');
}
