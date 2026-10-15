/** GET /api/health: confirma que a função está no ar e que a chave existe, sem revelá-la. */
export function health(env: Record<string, string | undefined> = process.env): Response {
  return Response.json(
    { ok: true, openaiKey: Boolean(env.OPENAI_API_KEY) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    }
    return health();
  },
};
