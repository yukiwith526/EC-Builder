import type { SectionId, SiteCategory, SiteData, SiteLegal, SiteNews, SiteOperation, SiteProduct, TemplateId } from '../types/site'
import { DEFAULT_CATEGORIES, DEFAULT_NEWS, DEFAULT_PRODUCT_INGREDIENTS, DEFAULT_PRODUCT_USAGE, DEFAULT_SECTIONS, MAX_HERO_SLIDES, MAX_PRODUCT_IMAGES, SECTION_IDS, TEMPLATE_IDS, categoryLabel, emptyLegal, formatAnnouncement, productImages } from '../types/site'
import { GOODS_ANNOUNCE_EXTRA, GOODS_BRAND, GOODS_CATEGORIES, GOODS_NEWS } from '../templates/ec/goods/catalog'
import { createId } from './ids'
import { cloneSite, defaultInstagram, setHero, touch } from './update'

const ALLOWED = /^(brand|hero|instagram|theme|legal|announcement|announcementVisible|freeShippingThreshold|announcementExtra|products|pickupIds|categories|news|sections)(\/|$)/

export function normalizeSite(site: SiteData): SiteData {
  const next = cloneSite(site)
  if (!Array.isArray(next.sections) || next.sections.length === 0) {
    next.sections = [...DEFAULT_SECTIONS]
  }
  next.sections = next.sections.filter((id): id is SectionId =>
    (SECTION_IDS as readonly string[]).includes(id),
  )
  if ((next.templateId as string) === 'goodskin') next.templateId = 'goods'
  if (!TEMPLATE_IDS.includes(next.templateId as TemplateId)) {
    next.templateId = 'cosmetics'
  }
  if (!Array.isArray(next.categories) || next.categories.length === 0) {
    next.categories = fallbackCategories(next.templateId).map((item) => ({ ...item }))
  }
  next.categories = next.categories
    .filter((item): item is SiteCategory => Boolean(item && typeof item.id === 'string') && typeof item.label === 'string')
    .map((item) => ({ id: item.id, label: item.label }))
  if (
    next.setupStep !== 'brand' &&
    next.setupStep !== 'seller' &&
    next.setupStep !== 'categories' &&
    next.setupStep !== 'products' &&
    next.setupStep !== 'done'
  ) {
    next.setupStep = 'done'
  }
  if (typeof next.freeShippingThreshold !== 'number' || Number.isNaN(next.freeShippingThreshold)) {
    const matched = String(next.announcement ?? '').match(/([\d,]+)円以上/)
    next.freeShippingThreshold = matched ? Number(matched[1].replaceAll(',', '')) || 8000 : 8000
  }
  if (typeof next.announcementVisible !== 'boolean') next.announcementVisible = true
  if (typeof next.announcementExtra !== 'string') {
    const parts = String(next.announcement ?? '').split('／')
    next.announcementExtra = parts.slice(1).join('／').trim() || defaultAnnouncementExtra(next.templateId)
  }
  if (next.templateId === 'goods') {
    if (/コフレ|リップ|かわいい|スキンケアと暮らし/.test(next.announcementExtra)) {
      next.announcementExtra = GOODS_ANNOUNCE_EXTRA
    }
    if (/Good Skin/.test(next.brand.description)) {
      next.brand.description = GOODS_BRAND.description
    }
    if (/photo-1556228578/.test(next.brand.image)) {
      next.brand.image = GOODS_BRAND.image
    }
    next.news = migrateGoodsNews(Array.isArray(next.news) ? next.news : [])
  }
  next.announcement = formatAnnouncement(next.freeShippingThreshold, next.announcementExtra)
  next.products = next.products.map((product) => normalizeProduct(product, next.categories))
  const slides = Array.isArray(next.hero.images)
    ? next.hero.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  if (next.hero.image && !slides.includes(next.hero.image)) slides.unshift(next.hero.image)
  next.hero.images = slides.slice(0, MAX_HERO_SLIDES)
  next.hero.image = slides[0] ?? next.hero.image ?? ''
  if (!Array.isArray(next.pickupIds)) {
    next.pickupIds = next.products.filter((item) => item.image).slice(0, 4).map((item) => item.id)
  } else {
    next.pickupIds = next.pickupIds.filter((id) => next.products.some((item) => item.id === id))
  }
  if (!Array.isArray(next.news)) {
    next.news = (next.templateId === 'goods' ? GOODS_NEWS : DEFAULT_NEWS).map((item) => ({ ...item }))
  }
  next.news = next.news
    .filter((item) => item && typeof item.id === 'string')
    .map((item) => ({
      id: item.id,
      date: typeof item.date === 'string' && item.date.trim() ? item.date : '2026.01.01',
      title: typeof item.title === 'string' ? item.title : '',
    }))
  const fallbackIg = defaultInstagram(next)
  const rawIg = next.instagram
  next.instagram = {
    kicker: typeof rawIg?.kicker === 'string' ? rawIg.kicker : fallbackIg.kicker,
    handle: typeof rawIg?.handle === 'string' ? rawIg.handle.replace(/^@/, '').trim() : fallbackIg.handle,
    caption: typeof rawIg?.caption === 'string' ? rawIg.caption : fallbackIg.caption,
  }
  next.legal = normalizeLegal(next.legal)
  return next
}

export function applyOperations(site: SiteData, operations: SiteOperation[]): SiteData {
  let next = normalizeSite(site)
  for (const operation of operations) {
    next = applyOne(next, operation)
  }
  return touch({
    ...next,
    announcement: formatAnnouncement(next.freeShippingThreshold ?? 8000, next.announcementExtra ?? ''),
  })
}

export function validateOperations(operations: unknown): SiteOperation[] {
  const list = Array.isArray(operations)
    ? operations
    : typeof operations === 'string'
      ? parseJsonArray(operations)
      : operations && typeof operations === 'object'
        ? [operations]
        : []
  return list.flatMap((item) => {
    const parsed = asOperation(item)
    return parsed ? [parsed] : []
  })
}

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function asOperation(item: unknown): SiteOperation | null {
  if (!item || typeof item !== 'object') return null
  const raw = item as { op?: string; operation?: string; path?: string; value?: unknown }
  const opRaw = raw.op ?? raw.operation
  const op = opRaw === 'update' || opRaw === 'set' || opRaw === 'patch' ? 'replace' : opRaw
  if (op !== 'replace' && op !== 'add' && op !== 'remove') return null
  if (typeof raw.path !== 'string') return null
  const path = raw.path.startsWith('/') ? raw.path : `/${raw.path.replaceAll('.', '/')}`
  const body = path.slice(1)
  if (!ALLOWED.test(body)) return null
  return { op, path, value: raw.value }
}

function applyOne(site: SiteData, operation: SiteOperation): SiteData {
  const next = cloneSite(site)
  const tokens = operation.path.replace(/^\//, '').split('/').map(decodeURIComponent)
  if (tokens[0] === 'products') return applyProduct(next, operation, tokens)
  if (tokens[0] === 'news') return applyNews(next, operation, tokens)
  if (tokens[0] === 'legal' && operation.op === 'replace') {
    return applyLegal(next, tokens, operation.value)
  }
  if (tokens[0] === 'hero' && tokens[1] === 'image' && operation.op === 'replace') {
    return setHero(site, { image: String(operation.value ?? '') })
  }
  if (tokens[0] === 'hero' && tokens[1] === 'images' && operation.op === 'replace') {
    const images = Array.isArray(operation.value)
      ? operation.value.filter((item): item is string => typeof item === 'string')
      : []
    return setHero(site, { images })
  }
  if (operation.op === 'remove') {
    setPath(next, tokens, undefined, true)
    return next
  }
  if (operation.value === undefined) return next
  setPath(next, tokens, operation.value, false)
  return next
}

function applyLegal(site: SiteData, tokens: string[], value: unknown): SiteData {
  site.legal = normalizeLegal(site.legal)
  const key = tokens[1]
  if (key === 'seller' || key === 'representative' || key === 'address' || key === 'phone' || key === 'email') {
    site.legal[key] = String(value ?? '').trim()
  }
  return site
}

function normalizeLegal(value: unknown): SiteLegal {
  const raw = value && typeof value === 'object' ? (value as Partial<SiteLegal>) : {}
  const blank = emptyLegal()
  return {
    seller: typeof raw.seller === 'string' ? raw.seller : blank.seller,
    representative: typeof raw.representative === 'string' ? raw.representative : blank.representative,
    address: typeof raw.address === 'string' ? raw.address : blank.address,
    phone: typeof raw.phone === 'string' ? raw.phone : blank.phone,
    email: typeof raw.email === 'string' ? raw.email : blank.email,
  }
}

function applyNews(site: SiteData, operation: SiteOperation, tokens: string[]): SiteData {
  if (!Array.isArray(site.news)) site.news = []
  if ((tokens[1] === '-' || tokens.length === 1) && operation.op === 'add') {
    const item = asNews(operation.value)
    if (item) site.news.unshift(item)
    return site
  }
  const key = tokens[1]
  if (!key) return site
  const index = /^\d+$/.test(key) ? Number(key) : site.news.findIndex((item) => item.id === key)
  if (index < 0 || !site.news[index]) return site
  if (operation.op === 'remove' && tokens.length === 2) {
    site.news.splice(index, 1)
    return site
  }
  if (tokens[2] && operation.op === 'replace') {
    const current = site.news[index]
    if (tokens[2] === 'title' || tokens[2] === 'date') current[tokens[2]] = String(operation.value ?? '')
  }
  return site
}

function asNews(value: unknown): SiteNews | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as SiteNews
  return {
    id: typeof raw.id === 'string' ? raw.id : createId('news'),
    date: typeof raw.date === 'string' && raw.date.trim() ? raw.date : '2026.01.01',
    title: typeof raw.title === 'string' ? raw.title : '新しいお知らせ',
  }
}

function applyProduct(site: SiteData, operation: SiteOperation, tokens: string[]): SiteData {
  if (tokens.length === 1 && operation.op === 'replace' && Array.isArray(operation.value)) {
    site.products = operation.value as SiteProduct[]
    return site
  }
  if ((tokens[1] === '-' || tokens.length === 1) && operation.op === 'add') {
    const product = asProduct(operation.value, site.categories)
    if (product) site.products.push(product)
    return site
  }
  const key = tokens[1]
  if (!key) return site
  const index = productIndex(site, key)
  if (index < 0) return site
  if (operation.op === 'remove' && tokens.length === 2) {
    site.products.splice(index, 1)
    return site
  }
  if (operation.op === 'replace' && tokens.length === 2 && operation.value && typeof operation.value === 'object') {
    const current = site.products[index]
    if (!current) return site
    site.products[index] = { ...current, ...(operation.value as SiteProduct), id: current.id }
    return site
  }
  if (tokens[2] && operation.op === 'replace') {
    const field = tokens[2] as keyof SiteProduct
    const current = site.products[index]
    if (!current) return site
    if (field === 'price') current.price = Number(operation.value) || 0
    else if (field === 'name' || field === 'description' || field === 'usage' || field === 'ingredients') current[field] = String(operation.value ?? '')
    else if (field === 'image') {
      const nextImage = String(operation.value ?? '')
      const rest = productImages(current).filter((src) => src !== nextImage)
      current.images = (nextImage ? [nextImage, ...rest] : rest).slice(0, MAX_PRODUCT_IMAGES)
      current.image = current.images[0] ?? ''
    } else if (field === 'images' && Array.isArray(operation.value)) {
      current.images = productImages({
        image: '',
        images: operation.value.filter((item): item is string => typeof item === 'string'),
      }).slice(0, MAX_PRODUCT_IMAGES)
      current.image = current.images[0] ?? ''
    } else if (field === 'category') {
      const category = String(operation.value)
      current.category = category
      current.categoryJa = categoryLabel(category, site.categories)
    }
  }
  return site
}

function productIndex(site: SiteData, key: string): number {
  if (/^\d+$/.test(key)) return Number(key)
  return site.products.findIndex((item) => item.id === key)
}

function asProduct(value: unknown, categories: SiteCategory[]): SiteProduct | null {
  if (!value || typeof value !== 'object') return null
  return normalizeProduct(
    {
      ...(value as SiteProduct),
      id: typeof (value as SiteProduct).id === 'string' ? (value as SiteProduct).id : createId('product'),
    },
    categories,
  )
}

export function normalizeProduct(
  raw: Partial<SiteProduct> & { name?: string },
  categories: SiteCategory[] = DEFAULT_CATEGORIES,
): SiteProduct {
  const fallback = categories[0]?.id ?? 'makeup'
  const category =
    typeof raw.category === 'string' && raw.category
      ? raw.category
      : fallback
  const images = productImages({
    image: typeof raw.image === 'string' ? raw.image : '',
    images: Array.isArray(raw.images) ? raw.images.filter((item): item is string => typeof item === 'string') : [],
  }).slice(0, MAX_PRODUCT_IMAGES)
  return {
    id: typeof raw.id === 'string' ? raw.id : `product_${Date.now()}`,
    name: typeof raw.name === 'string' ? raw.name : '',
    price: typeof raw.price === 'number' ? raw.price : 4800,
    description: raw.description ?? '',
    usage: typeof raw.usage === 'string' ? raw.usage : DEFAULT_PRODUCT_USAGE,
    ingredients: typeof raw.ingredients === 'string' ? raw.ingredients : DEFAULT_PRODUCT_INGREDIENTS,
    image: images[0] ?? '',
    images,
    category,
    categoryJa: raw.categoryJa || categoryLabel(category, categories),
  }
}

function defaultAnnouncementExtra(templateId: string) {
  return templateId === 'goods' ? GOODS_ANNOUNCE_EXTRA : '限定コフレ好評発売中'
}

function migrateGoodsNews(news: SiteNews[]): SiteNews[] {
  const cosmeticsTitles = new Set(DEFAULT_NEWS.map((item) => item.title))
  const kept = news.filter(
    (item) => !cosmeticsTitles.has(item.title) && !/コフレ|リップオイル|Petit Romance/.test(item.title),
  )
  return kept.length ? kept : GOODS_NEWS.map((item) => ({ ...item }))
}

function fallbackCategories(id: string): SiteCategory[] {
  if (id === 'goods') return GOODS_CATEGORIES
  return DEFAULT_CATEGORIES
}

function setPath(target: Record<string, unknown> | SiteData, tokens: string[], value: unknown, remove: boolean) {
  let current: Record<string, unknown> = target as Record<string, unknown>
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i]
    if (!token || typeof current[token] !== 'object' || current[token] === null) return
    current = current[token] as Record<string, unknown>
  }
  const last = tokens[tokens.length - 1]
  if (!last) return
  if (remove) delete current[last]
  else current[last] = value
}
