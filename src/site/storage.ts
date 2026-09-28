import type { SiteData } from '../types/site'
import { normalizeSite } from './operations'

export const STORAGE_KEY = 'ec-builder:site:v4'
export const CHAT_KEY = 'ec-builder:chat:v1'

export interface SiteRepository {
  load(): SiteData | null
  save(site: SiteData): void
  clear(): void
}

export class LocalStorageRepository implements SiteRepository {
  load(): SiteData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isSiteData(parsed)) return null
      return normalizeSite(parsed)
    } catch {
      return null
    }
  }

  save(site: SiteData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(site))
    } catch (error) {
      console.warn('Failed to persist site (storage quota?)', error)
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CHAT_KEY)
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function loadChat(siteId: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const bucket = parsed as Record<string, unknown>
    const list = bucket[siteId]
    if (!Array.isArray(list)) return null
    const messages = list.filter(isChatMessage)
    return messages.length ? messages : null
  } catch {
    return null
  }
}

export function saveChat(siteId: string, messages: ChatMessage[]) {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    const bucket = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
    bucket[siteId] = messages.slice(-50)
    localStorage.setItem(CHAT_KEY, JSON.stringify(bucket))
  } catch (error) {
    console.warn('Failed to persist chat', error)
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const item = value as ChatMessage
  return typeof item.id === 'string' && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string'
}

export function isSiteData(value: unknown): value is SiteData {
  if (!value || typeof value !== 'object') return false
  const site = value as SiteData
  return (
    typeof site.id === 'string' &&
    typeof site.templateId === 'string' &&
    typeof site.brand?.name === 'string' &&
    typeof site.hero?.title === 'string' &&
    Array.isArray(site.products)
  )
}

/** Swap this factory later for a D1/R2-backed repository. */
export function createSiteRepository(): SiteRepository {
  return new LocalStorageRepository()
}
