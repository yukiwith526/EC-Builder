import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { handleAiRequest } from './ai.ts'
import { AI_ERRORS, AI_RETRY_AFTER_SECONDS, MAX_AI_BODY_BYTES, localRateBucket, parseAiBody } from './guard.ts'

const allowLocal = localRateBucket(12, 60_000)

export function openaiPlugin(apiKey: string): Plugin {
  const handle = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/ai')) {
      next()
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.end('Method not allowed')
      return
    }
    void respond(req, res, apiKey)
  }

  return {
    name: 'ec-builder-openai',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

async function respond(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  const type = String(req.headers['content-type'] ?? '')
  if (!type.toLowerCase().includes('application/json')) {
    writeJson(res, 415, { error: AI_ERRORS.badType })
    return
  }
  const ip = String(req.socket.remoteAddress ?? 'local')
  if (!allowLocal(ip)) {
    res.setHeader('Retry-After', String(AI_RETRY_AFTER_SECONDS))
    writeJson(res, 429, { error: AI_ERRORS.tooMany })
    return
  }
  try {
    const raw = await readBody(req, MAX_AI_BODY_BYTES)
    const parsed = parseAiBody(raw)
    if (!parsed.ok) {
      writeJson(res, parsed.status, { error: parsed.error })
      return
    }
    const result = await handleAiRequest(parsed.body, apiKey)
    writeJson(res, result.status, result.payload)
  } catch (error) {
    if (error instanceof RangeError) {
      writeJson(res, 413, { error: AI_ERRORS.tooLarge })
      return
    }
    writeJson(res, 500, { error: AI_ERRORS.openai })
  }
}

function writeJson(res: ServerResponse, status: number, payload: Record<string, unknown>) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk) => {
      const buf = Buffer.from(chunk)
      size += buf.length
      if (size > maxBytes) {
        req.destroy()
        reject(new RangeError('too large'))
        return
      }
      chunks.push(buf)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
