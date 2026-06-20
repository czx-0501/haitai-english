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

      // 只保留 Supabase 需要的请求头，去掉 host/cf-* 等有问题的头
      const headers = new Headers();
      if (request.headers.get('apikey')) headers.set('apikey', request.headers.get('apikey'));
      if (request.headers.get('authorization')) headers.set('authorization', request.headers.get('authorization'));
      if (request.headers.get('content-type')) headers.set('content-type', request.headers.get('content-type'));
      if (request.headers.get('x-client-info')) headers.set('x-client-info', request.headers.get('x-client-info'));

      try {
        const response = await fetch(supabaseUrl, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
        });

        // 把 Supabase 的响应原样返回给浏览器
        const respHeaders = new Headers(response.headers);
        // 允许跨域
        respHeaders.set('access-control-allow-origin', '*');
        respHeaders.set('access-control-allow-headers', 'apikey, authorization, content-type');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: respHeaders,
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Proxy failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // === 静态文件请求（含 SPA 路由） ===
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new URL('/', url).toString());
    }
    return response;
  },
};
