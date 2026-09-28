export const MAX_AI_BODY_BYTES = 80_000
export const MAX_AI_MESSAGE_CHARS = 2_000
export const AI_RETRY_AFTER_SECONDS = 60

export const AI_ERRORS = {
  tooMany: 'リクエストが多すぎます。1分ほど待ってからもう一度送ってください。',
  tooLarge: '送信内容が大きすぎます。画像を減らすか、文章を短くしてください。',
  badType: '不正なリクエストです。',
  longMessage: 'メッセージが長すぎます。短くして送ってください。',
  openai: 'AIの処理に失敗しました。しばらくしてからもう一度送ってください。',
}

export function aiJson(status: number, payload: Record<string, unknown>, extra?: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra,
    },
  })
}

export function parseAiBody(raw: string): { ok: true; body: { message?: string; site?: unknown } & Record<string, unknown> } | { ok: false; status: number; error: string } {
  if (raw.length > MAX_AI_BODY_BYTES) return { ok: false, status: 413, error: AI_ERRORS.tooLarge }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: AI_ERRORS.badType }
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, status: 400, error: AI_ERRORS.badType }
  const body = parsed as { message?: unknown; site?: unknown }
  if (typeof body.message === 'string' && body.message.length > MAX_AI_MESSAGE_CHARS) {
    return { ok: false, status: 400, error: AI_ERRORS.longMessage }
  }
  return { ok: true, body: body as { message?: string; site?: unknown } & Record<string, unknown> }
}

export function localRateBucket(limit: number, periodMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((time) => now - time < periodMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(now)
    hits.set(key, recent)
    return true
  }
}
