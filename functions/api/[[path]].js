/**
 * Supabase API 代理
 * 浏览器同源请求 → Cloudflare Pages Function → Supabase
 * 绕过 CORS 限制
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 去掉 /api 前缀，保留剩余路径和查询参数
  const supabasePath = url.pathname.replace(/^\/api/, '') + url.search;
  const supabaseUrl = 'https://' + (env.SUPABASE_REF || 'nfegtesfuvkziwdfaekd') + '.supabase.co' + supabasePath;

  // 转发请求到 Supabase
  const response = await fetch(supabaseUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  // 返回响应（浏览器认为同源，不检查 CORS）
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
