import type { Selection, SiteData, SiteOperation } from '../types/site'

export interface SelectionTarget {
  id: string
  label: string
  path: string
  currentText: string
  kind: 'text' | 'image' | 'other'
}

export function selectionTarget(site: SiteData, selection: Selection | null): SelectionTarget | null {
  if (!selection) return null

  if (selection.type === 'announcement') {
    return {
      id: 'announcement',
      label: 'お知らせバー',
      path: '/announcementExtra',
      currentText: site.announcementExtra ?? '',
      kind: 'text',
    }
  }
  if (selection.type === 'brand.name' || selection.type === 'footer') {
    return { id: selection.type, label: 'ブランド名', path: '/brand/name', currentText: site.brand.name, kind: 'text' }
  }
  if (selection.type === 'brand.tagline') {
    return { id: 'brand.tagline', label: 'タグライン', path: '/brand/tagline', currentText: site.brand.tagline, kind: 'text' }
  }
  if (selection.type === 'brand.description') {
    return {
      id: 'brand.description',
      label: 'ブランド説明',
      path: '/brand/description',
      currentText: site.brand.description,
      kind: 'text',
    }
  }
  if (selection.type === 'hero.kicker') {
    return { id: 'hero.kicker', label: 'Heroキッカー', path: '/hero/kicker', currentText: site.hero.kicker, kind: 'text' }
  }
  if (selection.type === 'hero.title' || selection.type === 'hero') {
    return { id: 'hero.title', label: 'Heroタイトル', path: '/hero/title', currentText: site.hero.title, kind: 'text' }
  }
  if (selection.type === 'hero.subtitle') {
    return { id: 'hero.subtitle', label: 'Heroサブコピー', path: '/hero/subtitle', currentText: site.hero.subtitle, kind: 'text' }
  }
  if (selection.type === 'hero.cta') {
    return { id: 'hero.cta', label: 'Heroボタン', path: '/hero/cta', currentText: site.hero.cta, kind: 'text' }
  }
  if (selection.type === 'hero.image') {
    return { id: 'hero.image', label: 'Hero画像', path: '/hero/image', currentText: site.hero.image, kind: 'image' }
  }
  if (selection.type === 'brand.image') {
    return { id: 'brand.image', label: 'コンセプト画像', path: '/brand/image', currentText: site.brand.image, kind: 'image' }
  }
  if (selection.type === 'instagram.kicker') {
    return { id: 'instagram.kicker', label: 'Instagram見出し', path: '/instagram/kicker', currentText: site.instagram.kicker, kind: 'text' }
  }
  if (selection.type === 'instagram.handle') {
    return { id: 'instagram.handle', label: 'Instagramアカウント', path: '/instagram/handle', currentText: site.instagram.handle, kind: 'text' }
  }
  if (selection.type === 'instagram.caption' || selection.type === 'instagram') {
    return {
      id: 'instagram.caption',
      label: 'Instagram説明',
      path: '/instagram/caption',
      currentText: site.instagram.caption,
      kind: 'text',
    }
  }
  if (selection.type === 'pickup') {
    return { id: 'pickup', label: 'ピックアップ', path: '/pickupIds', currentText: '', kind: 'other' }
  }
  if (selection.type === 'products') {
    return { id: 'products', label: '商品一覧', path: '/products/-', currentText: '', kind: 'other' }
  }
  if (selection.type === 'product' || selection.type === 'product.image' || selection.type === 'product.description' || selection.type === 'product.usage' || selection.type === 'product.ingredients') {
    const product = site.products.find((item) => item.id === selection.id)
    if (!product) return null
    if (selection.type === 'product.image') {
      return {
        id: `product.image.${product.id}`,
        label: '商品画像',
        path: `/products/${product.id}/image`,
        currentText: product.image,
        kind: 'image',
      }
    }
    if (selection.type === 'product.usage') {
      return {
        id: `product.usage.${product.id}`,
        label: '使い方・特長',
        path: `/products/${product.id}/usage`,
        currentText: product.usage ?? '',
        kind: 'text',
      }
    }
    if (selection.type === 'product.ingredients') {
      return {
        id: `product.ingredients.${product.id}`,
        label: '成分',
        path: `/products/${product.id}/ingredients`,
        currentText: product.ingredients ?? '',
        kind: 'text',
      }
    }
    return {
      id: `product.description.${product.id}`,
      label: '商品説明',
      path: `/products/${product.id}/description`,
      currentText: product.description,
      kind: 'text',
    }
  }
  if (selection.type === 'news.list') {
    return { id: 'news.list', label: 'お知らせ', path: '/news/-', currentText: '', kind: 'other' }
  }
  if (selection.type === 'news') {
    const index = site.news.findIndex((item) => item.id === selection.id)
    const item = site.news[index]
    if (!item || index < 0) return null
    return { id: `news.${item.id}`, label: 'お知らせ', path: `/news/${index}/title`, currentText: item.title, kind: 'text' }
  }
  const legalField = legalTarget(site, selection.type)
  if (legalField) return legalField
  return { id: selection.type, label: selection.type, path: '', currentText: '', kind: 'other' }
}

export function textFromAi(payload: { text?: unknown; reply?: unknown; value?: unknown }): string {
  if (typeof payload.text === 'string' && payload.text.trim() && !isStatusReply(payload.text) && !isBrokenCopy(payload.text)) {
    return payload.text.trim()
  }
  return ''
}

export function isBrokenCopy(text: string): boolean {
  const value = text.trim()
  if (/を、もっと近くに/.test(value)) return true
  if (/にを[、。]/.test(value)) return true
  if (/へを[、。]/.test(value)) return true
  if (/…$/.test(value) && value.length < 24) return true
  return false
}

export function isStatusReply(text: string): boolean {
  const value = text.trim()
  if (!value) return true
  if (value.length > 140) return false
  return (
    /(更新|変更|反映|整え)ました/.test(value) ||
    /トーンにしました/.test(value) ||
    /してください/.test(value) ||
    /例えば「/.test(value) ||
    /更新しています/.test(value)
  )
}

export function withoutStatusValues(operations: SiteOperation[]): SiteOperation[] {
  return operations.filter((item) => typeof item.value !== 'string' || !isStatusReply(item.value))
}

export function operationsForTarget(target: SelectionTarget, text: string): SiteOperation[] {
  if (target.kind !== 'text' || !target.path || !text.trim()) return []
  return [{ op: 'replace', path: target.path, value: text.trim() }]
}

export function operationMatchesTarget(target: SelectionTarget | null, operation: SiteOperation): boolean {
  if (!target) return true
  if (operation.op === 'add' && (operation.path === '/products/-' || operation.path === '/news/-')) return true
  if (target.id === 'products') {
    return operation.path === '/products/-' || operation.path.startsWith('/products/')
  }
  if (target.id === 'news.list') {
    return operation.path.startsWith('/news')
  }
  if (target.id === 'legal' || target.id.startsWith('legal.') || target.path.startsWith('/legal/')) {
    return operation.path.startsWith('/legal/')
  }
  const productId = productIdFromTarget(target.id)
  if (target.id.startsWith('product.image.')) {
    return operation.path === `/products/${productId}/image`
  }
  if (productId) {
    return (
      operation.path.startsWith(`/products/${productId}/`) ||
      (operation.op === 'remove' && operation.path === `/products/${productId}`) ||
      operation.path === '/products/-'
    )
  }
  if (!target.path) return false
  return operation.path === target.path
}

function legalTarget(site: SiteData, type: Selection['type']): SelectionTarget | null {
  const legal = site.legal ?? { seller: '', representative: '', address: '', phone: '', email: '' }
  const fields: Record<string, { label: string; path: string; currentText: string }> = {
    'legal.seller': { label: '事業者名', path: '/legal/seller', currentText: legal.seller },
    'legal.representative': { label: '運営統括責任者', path: '/legal/representative', currentText: legal.representative },
    'legal.address': { label: '所在地', path: '/legal/address', currentText: legal.address },
    'legal.phone': { label: '電話番号', path: '/legal/phone', currentText: legal.phone },
    'legal.email': { label: 'メールアドレス', path: '/legal/email', currentText: legal.email },
  }
  const field = fields[type]
  if (field) return { id: type, ...field, kind: 'text' }
  if (type === 'legal') {
    return { id: 'legal', label: '事業者情報', path: '/legal/seller', currentText: legal.seller, kind: 'other' }
  }
  return null
}

function productIdFromTarget(id: string): string {
  const named = id.match(/^product\.(?:image|description|usage|ingredients)\.(.+)$/)
  if (named?.[1]) return named[1]
  if (id.startsWith('product.')) return id.slice('product.'.length)
  return ''
}
