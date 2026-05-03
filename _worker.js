export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    const indexResponse = await env.ASSETS.fetch(new Request(new URL('/', url.origin), request));
    return new Response(indexResponse.body, {
      status: 200,
      headers: indexResponse.headers,
    });
  }
};
