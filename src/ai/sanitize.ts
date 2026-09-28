import type { SiteData, SiteProduct } from '../types/site'
import { formatAnnouncement, MAX_PRODUCT_IMAGES, productImages } from '../types/site'
import { isSiteData } from '../site/storage'
import { touch } from '../site/update'

export function mergeAiSite(base: SiteData, incoming: unknown): SiteData {
  if (!incoming || typeof incoming !== 'object') return base
  const raw = incoming as SiteData
  const next: SiteData = {
    ...base,
    brand: {
      ...base.brand,
      name: str(raw.brand?.name, base.brand.name),
      tagline: str(raw.brand?.tagline, base.brand.tagline),
      description: str(raw.brand?.description, base.brand.description),
      concept: str(raw.brand?.concept, base.brand.concept),
      image: str(raw.brand?.image, base.brand.image),
    },
    hero: {
      ...base.hero,
      kicker: str(raw.hero?.kicker, base.hero.kicker),
      title: str(raw.hero?.title, base.hero.title),
      subtitle: str(raw.hero?.subtitle, base.hero.subtitle),
      cta: str(raw.hero?.cta, base.hero.cta),
      image: str(raw.hero?.image, base.hero.image),
      images: Array.isArray(raw.hero?.images)
        ? raw.hero.images.filter((item): item is string => typeof item === 'string')
        : base.hero.images,
    },
    theme: {
      ...base.theme,
      backgroundColor: str(raw.theme?.backgroundColor, base.theme.backgroundColor),
      inkColor: str(raw.theme?.inkColor, base.theme.inkColor),
      accentColor: str(raw.theme?.accentColor, base.theme.accentColor),
      paperColor: str(raw.theme?.paperColor, base.theme.paperColor),
    },
    announcement: str(raw.announcement, base.announcement),
    announcementVisible:
      typeof raw.announcementVisible === 'boolean' ? raw.announcementVisible : base.announcementVisible,
    freeShippingThreshold:
      typeof raw.freeShippingThreshold === 'number' && !Number.isNaN(raw.freeShippingThreshold)
        ? Math.max(0, Math.round(raw.freeShippingThreshold))
        : base.freeShippingThreshold,
    announcementExtra: str(raw.announcementExtra, base.announcementExtra),
    products: mergeProducts(base.products, raw.products),
    pickupIds: Array.isArray(raw.pickupIds)
      ? raw.pickupIds.filter((item): item is string => typeof item === 'string')
      : base.pickupIds,
    instagram: {
      kicker: str(raw.instagram?.kicker, base.instagram.kicker),
      handle: str(raw.instagram?.handle, base.instagram.handle),
      caption: str(raw.instagram?.caption, base.instagram.caption),
    },
  }
  next.announcement = formatAnnouncement(next.freeShippingThreshold ?? 8000, next.announcementExtra ?? '')
  next.templateId = base.templateId
  next.id = base.id
  return isSiteData(next) ? touch(next) : base
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function mergeProducts(base: SiteProduct[], incoming: unknown): SiteProduct[] {
  if (!Array.isArray(incoming)) return base
  return incoming
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const product = item as SiteProduct
      const current = base.find((entry) => entry.id === product.id) ?? base[index]
      const images = productImages({
        image: str(product.image, current?.image ?? ''),
        images: Array.isArray(product.images)
          ? product.images.filter((entry): entry is string => typeof entry === 'string')
          : current?.images ?? [],
      }).slice(0, MAX_PRODUCT_IMAGES)
      return {
        id: typeof product.id === 'string' ? product.id : current?.id ?? `product_${index}`,
        name: typeof product.name === 'string' ? product.name : current?.name ?? '',
        price: typeof product.price === 'number' ? product.price : current?.price ?? 0,
        description: str(product.description, current?.description ?? ''),
        usage: str(product.usage, current?.usage ?? ''),
        ingredients: str(product.ingredients, current?.ingredients ?? ''),
        image: images[0] ?? '',
        images,
        category: product.category ?? current?.category ?? 'makeup',
        categoryJa: product.categoryJa ?? current?.categoryJa ?? 'メイク',
      }
    })
}
