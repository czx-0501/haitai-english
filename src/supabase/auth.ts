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
  
  // Create user profile
  if (data.user) {
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      nickname,
      email,
      avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${email}`,
    });
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
  
  return data as AuthUser | null;
}
