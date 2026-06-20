import { createClient } from '@supabase/supabase-js';

// 开发环境：直连 Supabase
// 生产环境：通过 Cloudflare Pages Function 代理（避免 CORS 问题）
const isDev = import.meta.env.DEV;
const supabaseUrl = isDev
  ? (import.meta.env.VITE_SUPABASE_URL || '')
  : '/api';  // 生产环境走同源代理

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
