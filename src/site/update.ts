import { categoryLabel, DEFAULT_PRODUCT_INGREDIENTS, DEFAULT_PRODUCT_USAGE, DEFAULT_SECTIONS, emptyLegal, formatAnnouncement, heroImages, MAX_HERO_SLIDES, MAX_PRODUCT_IMAGES, productImages, type SectionId, type SiteData, type SiteLegal, type SiteProduct, type SiteTheme } from '../types/site'
import { createId } from './ids'

export function cloneSite(site: SiteData): SiteData {
  return structuredClone(site)
}

export function touch(site: SiteData): SiteData {
  return { ...site, updatedAt: new Date().toISOString() }
}

export function setLegal(site: SiteData, patch: Partial<SiteLegal>): SiteData {
  const next = cloneSite(site)
  next.legal = { ...emptyLegal(), ...next.legal, ...patch }
  return touch(next)
}

export function setBrandName(site: SiteData, name: string): SiteData {
  const next = cloneSite(site)
  next.brand.name = name.trim() || next.brand.name
  return touch(next)
}

export function setBrandDescription(site: SiteData, description: string): SiteData {
  const next = cloneSite(site)
  next.brand.description = description
  return touch(next)
}

export function setBrandTagline(site: SiteData, tagline: string): SiteData {
  const next = cloneSite(site)
  next.brand.tagline = tagline
  return touch(next)
}

export function setBrandConcept(site: SiteData, concept: string): SiteData {
  const next = cloneSite(site)
  next.brand.concept = concept
  return touch(next)
}

export function setBrandImage(site: SiteData, image: string): SiteData {
  const next = cloneSite(site)
  next.brand.image = image
  return touch(next)
}

export function setAnnouncement(site: SiteData, announcement: string): SiteData {
  const next = cloneSite(site)
  next.announcementExtra = announcement
  next.announcement = formatAnnouncement(next.freeShippingThreshold ?? 8000, announcement)
  return touch(next)
}

export function setFreeShippingThreshold(site: SiteData, threshold: number): SiteData {
  const next = cloneSite(site)
  next.freeShippingThreshold = Math.max(0, Math.round(threshold) || 0)
  next.announcement = formatAnnouncement(next.freeShippingThreshold, next.announcementExtra ?? '')
  return touch(next)
}

export function setAnnouncementVisible(site: SiteData, visible: boolean): SiteData {
  const next = cloneSite(site)
  next.announcementVisible = visible
  return touch(next)
}

export function setAnnouncementExtra(site: SiteData, extra: string): SiteData {
  return setAnnouncement(site, extra)
}

export function setHero(
  site: SiteData,
  patch: Partial<SiteData['hero']>,
): SiteData {
  const next = cloneSite(site)
  next.hero = { ...next.hero, ...patch }
  if (patch.images) {
    next.hero.images = patch.images.filter(Boolean).slice(0, MAX_HERO_SLIDES)
    next.hero.image =
      patch.image && next.hero.images.includes(patch.image) ? patch.image : next.hero.images[0] ?? ''
  } else if (patch.image !== undefined && patch.images === undefined) {
    const slides = heroImages({ ...next.hero, image: site.hero.image, images: site.hero.images })
    if (patch.image) {
      next.hero.images = [patch.image, ...slides.filter((item) => item !== patch.image && item !== site.hero.image)].slice(
        0,
        MAX_HERO_SLIDES,
      )
      next.hero.image = patch.image
    } else {
      const rest = slides.filter((item) => item !== site.hero.image)
      next.hero.images = rest
      next.hero.image = rest[0] ?? ''
    }
  }
  return touch(next)
}

export function addHeroImage(site: SiteData, image: string): SiteData {
  const src = image.trim()
  if (!src) return site
  const slides = heroImages(site.hero)
  if (slides.includes(src)) return setHero(site, { images: slides, image: src })
  if (slides.length >= MAX_HERO_SLIDES) return site
  return setHero(site, { images: [...slides, src], image: src })
}

export function removeHeroImage(site: SiteData, image: string): SiteData {
  const images = heroImages(site.hero).filter((item) => item !== image)
  return setHero(site, { images, image: images[0] ?? '' })
}

export function pickupProducts(site: SiteData) {
  return (site.pickupIds ?? [])
    .map((id) => site.products.find((item) => item.id === id))
    .filter((item): item is SiteProduct => Boolean(item))
}

export function addPickupProduct(site: SiteData): SiteData {
  const next = addProduct(site)
  const created = next.products.at(-1)
  if (!created) return next
  next.pickupIds = [...(next.pickupIds ?? []), created.id]
  return touch(next)
}

export function removeFromPickup(site: SiteData, id: string): SiteData {
  const next = cloneSite(site)
  next.pickupIds = (next.pickupIds ?? []).filter((item) => item !== id)
  return touch(next)
}

export function setTheme(site: SiteData, patch: Partial<SiteTheme>): SiteData {
  const next = cloneSite(site)
  next.theme = { ...next.theme, ...patch }
  return touch(next)
}

export const LUXURY_THEME: SiteTheme = {
  backgroundColor: '#0f0e0c',
  inkColor: '#f4efe6',
  accentColor: '#c4a574',
  paperColor: '#1a1814',
}

export const COSMETICS_THEME: SiteTheme = {
  backgroundColor: '#fffdfd',
  inkColor: '#4a3340',
  accentColor: '#c47a96',
  paperColor: '#fbf4f7',
}

export const GOODS_THEME: SiteTheme = {
  backgroundColor: '#ffffff',
  inkColor: '#1a1a1a',
  accentColor: '#3a6b74',
  paperColor: '#f6f5f2',
}

export function addProduct(site: SiteData, product?: Partial<SiteProduct>): SiteData {
  const next = cloneSite(site)
  next.products.push({
    id: product?.id ?? createId('product'),
    name: product?.name ?? '',
    price: product?.price ?? 4800,
    description: product?.description ?? '新しいアイテムの説明を追加してください。',
    usage: product?.usage ?? DEFAULT_PRODUCT_USAGE,
    ingredients: product?.ingredients ?? DEFAULT_PRODUCT_INGREDIENTS,
    image: productImages({
      image: product?.image ?? '',
      images: product?.images ?? [],
    })[0] ?? '',
    images: productImages({
      image: product?.image ?? '',
      images: product?.images ?? [],
    }),
    category: product?.category ?? next.categories[0]?.id ?? 'makeup',
    categoryJa:
      product?.categoryJa ??
      categoryLabel(product?.category ?? next.categories[0]?.id ?? 'makeup', next.categories),
  })
  return touch(next)
}

export function addProductImage(site: SiteData, id: string, image: string): SiteData {
  const src = image.trim()
  if (!src) return site
  const product = site.products.find((item) => item.id === id)
  if (!product) return site
  const slides = productImages(product)
  if (slides.includes(src) || slides.length >= MAX_PRODUCT_IMAGES) return site
  return updateProduct(site, id, { images: [...slides, src], image: src })
}

export function removeProductImage(site: SiteData, id: string, image: string): SiteData {
  const product = site.products.find((item) => item.id === id)
  const slides = productImages(product ?? { image: '', images: [] }).filter((item) => item !== image)
  return updateProduct(site, id, { images: slides, image: slides[0] ?? '' })
}

export function updateProduct(
  site: SiteData,
  id: string,
  patch: Partial<SiteProduct>,
): SiteData {
  const next = cloneSite(site)
  next.products = next.products.map((item) => {
    if (item.id !== id) return item
    const merged = { ...item, ...patch, id: item.id }
    if (patch.images !== undefined) {
      merged.images = productImages({ image: patch.image ?? patch.images[0] ?? '', images: patch.images }).slice(
        0,
        MAX_PRODUCT_IMAGES,
      )
      merged.image = merged.images[0] ?? ''
    } else if (patch.image !== undefined) {
      const rest = productImages(item).filter((src) => src !== patch.image)
      merged.images = [patch.image, ...rest].filter(Boolean).slice(0, MAX_PRODUCT_IMAGES)
      merged.image = merged.images[0] ?? ''
    }
    if (patch.category) merged.categoryJa = categoryLabel(patch.category, next.categories)
    return merged
  })
  return touch(next)
}

export function removeProduct(site: SiteData, id: string): SiteData {
  const next = cloneSite(site)
  next.products = next.products.filter((item) => item.id !== id)
  next.pickupIds = (next.pickupIds ?? []).filter((item) => item !== id)
  return touch(next)
}

function uniqueCategoryId(site: SiteData, label: string): string {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || createId('cat')
  if (!site.categories.some((item) => item.id === base)) return base
  return createId(base)
}

export function addCategory(site: SiteData, label: string): SiteData {
  const name = label.trim()
  if (!name) return site
  const next = cloneSite(site)
  next.categories.push({ id: uniqueCategoryId(next, name), label: name })
  return touch(next)
}

export function updateCategory(site: SiteData, id: string, label: string): SiteData {
  const next = cloneSite(site)
  const category = next.categories.find((item) => item.id === id)
  if (!category) return site
  category.label = label
  next.products = next.products.map((product) =>
    product.category === id ? { ...product, categoryJa: label } : product,
  )
  return touch(next)
}

export function removeCategory(site: SiteData, id: string): SiteData {
  if (site.categories.length <= 1) return site
  const next = cloneSite(site)
  const fallback = next.categories.find((item) => item.id !== id)
  if (!fallback) return site
  next.categories = next.categories.filter((item) => item.id !== id)
  next.products = next.products.map((product) =>
    product.category === id
      ? { ...product, category: fallback.id, categoryJa: fallback.label }
      : product,
  )
  return touch(next)
}

export function moveCategory(site: SiteData, fromId: string, toId: string): SiteData {
  if (fromId === toId) return site
  const from = site.categories.findIndex((item) => item.id === fromId)
  const to = site.categories.findIndex((item) => item.id === toId)
  if (from < 0 || to < 0) return site
  const next = cloneSite(site)
  const [item] = next.categories.splice(from, 1)
  if (!item) return site
  next.categories.splice(to, 0, item)
  return touch(next)
}

export function updateNews(site: SiteData, id: string, patch: Partial<{ date: string; title: string }>): SiteData {
  const next = cloneSite(site)
  next.news = (next.news ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item))
  return touch(next)
}

export function addNews(site: SiteData, title = '新しいお知らせ'): SiteData {
  const next = cloneSite(site)
  const now = new Date()
  const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  next.news = [{ id: createId('news'), date, title }, ...(next.news ?? [])]
  return touch(next)
}

export function removeNews(site: SiteData, id: string): SiteData {
  const next = cloneSite(site)
  next.news = (next.news ?? []).filter((item) => item.id !== id)
  return touch(next)
}

export function defaultInstagram(site: Pick<SiteData, 'brand' | 'templateId'>): SiteData['instagram'] {
  return {
    kicker: 'INSTAGRAM',
    handle: site.brand.name.replaceAll(/\s+/g, '').toLowerCase(),
    caption:
      site.templateId === 'goods'
        ? '暮らしの一瞬を、そっとお届けします。'
        : '花と光の毎日を、そっとお届けします。',
  }
}

export function setInstagram(site: SiteData, patch: Partial<SiteData['instagram']>): SiteData {
  const next = cloneSite(site)
  next.instagram = { ...next.instagram, ...patch }
  if (patch.handle !== undefined) {
    next.instagram.handle = patch.handle.replace(/^@/, '').trim()
  }
  return touch(next)
}

export function hideSection(site: SiteData, id: SectionId): SiteData {
  const next = cloneSite(site)
  next.sections = next.sections.filter((item) => item !== id)
  return touch(next)
}

export function showSection(site: SiteData, id: SectionId): SiteData {
  if (site.sections.includes(id)) return site
  const next = cloneSite(site)
  const present = new Set([...next.sections, id])
  next.sections = [
    ...DEFAULT_SECTIONS.filter((item) => present.has(item)),
    ...next.sections.filter((item) => !(DEFAULT_SECTIONS as readonly string[]).includes(item)),
  ]
  return touch(next)
}

export function shortenText(value: string, max = 36): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  const sentence = compact.split(/[。！？]/)[0]?.trim()
  if (sentence && sentence.length <= max) return sentence
  if (compact.length <= max) return compact
  return `${compact.slice(0, max).trim()}…`
}
