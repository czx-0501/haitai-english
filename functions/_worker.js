/**
 * Cloudflare Pages Worker
 * - /api/* → 转发到 Supabase（绕过 CORS）
 * - 其他 → 正常响应静态文件（SPA 路由降级到 index.html）
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // === API 请求：代理到 Supabase ===
    if (url.pathname.startsWith('/api/')) {
      const supabasePath = url.pathname.replace(/^\/api/, '') + url.search;
      const supabaseUrl = `https://nfegtesfuvkziwdfaekd.supabase.co${supabasePath}`;

      try {
        const response = await fetch(supabaseUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
        });
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Proxy failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // === 静态文件请求（含 SPA 路由） ===
    // 先尝试请求原路径
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      // SPA 降级：未匹配到文件的路由返回 index.html
      return env.ASSETS.fetch(new URL('/', url).toString());
    }
    return response;
  },
};
