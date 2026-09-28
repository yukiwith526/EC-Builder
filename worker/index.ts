import { handleAiRequest } from '../server/ai.ts'
import { AI_ERRORS, AI_RETRY_AFTER_SECONDS, MAX_AI_BODY_BYTES, aiJson, parseAiBody } from '../server/guard.ts'

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/ai')) {
      return new Response('Not found', { status: 404 })
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
    }
    const type = request.headers.get('content-type') ?? ''
    if (!type.toLowerCase().includes('application/json')) {
      return aiJson(415, { error: AI_ERRORS.badType })
    }
    const declared = Number(request.headers.get('content-length') ?? 0)
    if (declared > MAX_AI_BODY_BYTES) {
      return aiJson(413, { error: AI_ERRORS.tooLarge })
    }

    const ip = clientIp(request)
    const [perIp, global] = await Promise.all([
      env.AI_IP_RATE_LIMIT.limit({ key: ip }),
      env.AI_GLOBAL_RATE_LIMIT.limit({ key: 'openai' }),
    ])
    if (!perIp.success || !global.success) {
      return aiJson(
        429,
        { error: AI_ERRORS.tooMany },
        { 'Retry-After': String(AI_RETRY_AFTER_SECONDS) },
      )
    }

    try {
      const raw = await request.text()
      const parsed = parseAiBody(raw)
      if (!parsed.ok) return aiJson(parsed.status, { error: parsed.error })
      const result = await handleAiRequest(parsed.body, env.OPENAI_API_KEY)
      return aiJson(result.status, result.payload)
    } catch {
      return aiJson(500, { error: AI_ERRORS.openai })
    }
  },
} satisfies ExportedHandler<Env>

function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown'
}
