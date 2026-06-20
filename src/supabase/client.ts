import { createClient } from '@supabase/supabase-js';

const isDev = import.meta.env.DEV;
// 生产环境走同源 /api 代理（绕过 CORS）
const supabaseUrl = isDev
  ? (import.meta.env.VITE_SUPABASE_URL || '')
  : '/api';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
