import { supabase } from './client';

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string;
};

export async function signUp(email: string, password: string, nickname: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  
  // Create user profile - retry if session not ready
  if (data.user) {
    for (let i = 0; i < 3; i++) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        nickname,
        email,
        avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${email}`,
      });
      if (!profileError) break;
      await new Promise(r => setTimeout(r, 500)); // wait 500ms before retry
    }
  }
  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error: error?.message || null };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (data) return data as AuthUser;

  // Fallback: construct from auth user metadata when no user_profiles record exists
  return {
    id: user.id,
    email: user.email || '',
    nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '用户',
    avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.email}`,
  } as AuthUser;
}
