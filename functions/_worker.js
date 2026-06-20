// Cloudflare Pages _worker.js
// - /api/* → 转发到 Supabase（绕过 CORS）
// - 其他 → 正常响应静态文件（SPA 路由降级到 index.html）

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // API 请求：代理到 Supabase
  if (url.pathname.startsWith('/api/')) {
    const supabasePath = url.pathname.replace(/^\/api/, '') + url.search;
    const supabaseUrl = `https://nfegtesfuvkziwdfaekd.supabase.co${supabasePath}`;

    try {
      const response = await fetch(supabaseUrl, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Proxy failed', detail: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 静态文件 + SPA 路由
  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    return env.ASSETS.fetch(new URL('/', url).toString());
  }
  return response;
}
