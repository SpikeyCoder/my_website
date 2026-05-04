const BLOCKED_PATHS = new Set([
  '/.env',
  '/.htpasswd',
  '/.htaccess',
  '/.ds_store',
  '/settings.py',
  '/config.php',
  '/phpinfo.php',
  '/info.php',
  '/server-status',
  '/server-info',
  '/debug',
  '/trace.axd',
  '/elmah.axd',
  '/thumbs.db',
  '/backup.sql',
  '/database.sql',
  '/dump.sql',
  '/admin',
  '/account',
  '/dashboard',
  '/billing',
  '/api/admin',
  '/api/private',
  '/api/users',
  '/api/settings',
  '/api/docs',
  '/config',
  '/internal',
  '/manage',
  '/orders',
  '/payments',
  '/profile',
  '/settings',
  '/users',
  '/swagger.json',
  '/openapi.json',
  '/graphql',
]);

const BLOCKED_PREFIXES = ['/.git/', '/.env.', '/debug/'];

function isBlocked(pathname) {
  const p = pathname.toLowerCase();
  if (BLOCKED_PATHS.has(p)) return true;
  for (const prefix of BLOCKED_PREFIXES) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isBlocked(url.pathname)) {
      return new Response('Not Found', { status: 404 });
    }
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    const indexResponse = await env.ASSETS.fetch(new Request(new URL('/', url.origin), request));
    return new Response(indexResponse.body, {
      status: 200,
      headers: indexResponse.headers,
    });
  }
};
