import type { Selection, SiteConfig, SiteOperation } from '../types/site'
import { applyOperations, validateOperations } from '../site/operations'
import { interpretMock, rewriteSelectedText } from './mock'
import { isBrokenCopy, operationMatchesTarget, operationsForTarget, selectionTarget, textFromAi, withoutStatusValues } from './target'

export interface AIResponse {
  reply: string
  operations: SiteOperation[]
  site: SiteConfig
}

export interface AIService {
  sendMessage(message: string, currentConfig: SiteConfig, selection?: Selection | null): Promise<AIResponse>
}

export function createAIService(): AIService {
  return new HttpAIService(new MockAIService())
}

class MockAIService implements AIService {
  async sendMessage(message: string, currentConfig: SiteConfig, selection?: Selection | null): Promise<AIResponse> {
    const target = selectionTarget(currentConfig, selection ?? null)
    const result = interpretMock({
      message,
      site: currentConfig,
      target,
    })
    return finalize(currentConfig, target, {
      reply: result.reply,
      operations: result.operations,
    }, message)
  }
}

class HttpAIService implements AIService {
  fallback: AIService

  constructor(fallback: AIService) {
    this.fallback = fallback
  }

  async sendMessage(message: string, currentConfig: SiteConfig, selection?: Selection | null): Promise<AIResponse> {
    const target = selectionTarget(currentConfig, selection ?? null)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          site: currentConfig,
          selectedElement: target?.id ?? null,
          selectedLabel: target?.label ?? null,
          selectedPath: target?.path || null,
          currentText: target?.kind === 'text' ? target.currentText : null,
          productCopy: productCopyFor(currentConfig, target),
        }),
      })
      if (response.status === 429 || response.status === 413 || response.status === 400 || response.status === 415) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'リクエストを受け付けできませんでした。')
      }
      if (response.status === 501 || !response.ok) {
        return this.fallback.sendMessage(message, currentConfig, selection)
      }
      const data = (await response.json()) as { reply?: string; operations?: unknown; text?: unknown; value?: unknown }
      const result = finalize(currentConfig, target, data, message)
      if (result.operations.length > 0) return result
      return this.fallback.sendMessage(message, currentConfig, selection)
    } catch {
      return this.fallback.sendMessage(message, currentConfig, selection)
    }
  }
}

function finalize(
  site: SiteConfig,
  target: ReturnType<typeof selectionTarget>,
  data: { reply?: string; operations?: unknown; text?: unknown; value?: unknown },
  message: string,
): AIResponse {
  let operations = withoutStatusValues(validateOperations(data.operations)).filter((item) =>
    operationMatchesTarget(target, item),
  )
  const generated = textFromAi(data)
  if (target && generated && !hasProductCopyOps(target, operations)) {
    for (const operation of operationsForTarget(target, generated)) {
      if (!operations.some((item) => item.path === operation.path)) operations.push(operation)
    }
  }
  if (target?.kind === 'text' && target.path && !hasProductCopyOps(target, operations)) {
    operations = operations.filter(
      (item) =>
        item.path !== target.path ||
        typeof item.value !== 'string' ||
        (item.value.trim() !== target.currentText.trim() && !isBrokenCopy(item.value)),
    )
    if (!operations.some((item) => item.path === target.path)) {
      const next = rewriteSelectedText(target.currentText, target.path, message, site.brand.name, site.templateId)
      if (next.trim() && next.trim() !== target.currentText.trim()) {
        operations.push({ op: 'replace', path: target.path, value: next })
      }
    }
  }
  const applied = operations.length ? applyOperations(site, operations) : site
  return {
    reply: data.reply?.trim() || (operations.length ? '選択中の要素を更新しました。' : ''),
    operations,
    site: applied,
  }
}

function productCopyFor(site: SiteConfig, target: ReturnType<typeof selectionTarget>) {
  const id = target?.path.match(/^\/products\/([^/]+)\//)?.[1]
  const product = id ? site.products.find((item) => item.id === id) : undefined
  if (!product) return null
  return {
    description: product.description,
    usage: product.usage ?? '',
    ingredients: product.ingredients ?? '',
  }
}

function hasProductCopyOps(target: ReturnType<typeof selectionTarget>, operations: { path: string }[]) {
  const id = target?.path.match(/^\/products\/([^/]+)\//)?.[1]
  if (!id) return false
  return operations.some((item) => /^\/products\/[^/]+\/(description|usage|ingredients)$/.test(item.path) && item.path.includes(`/${id}/`))
}
