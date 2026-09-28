import type { SiteData } from '../../../types/site'
import { DEFAULT_CATEGORIES, DEFAULT_NEWS, DEFAULT_SECTIONS, emptyLegal } from '../../../types/site'
import { createId } from '../../../site/ids'
import { COSMETICS_THEME } from '../../../site/update'
import { EC04_BRAND, EC04_HERO } from './ec04Catalog'

export function createCosmeticsSite(overrides?: {
  name?: string
  concept?: string
}): SiteData {
  const name = overrides?.name?.trim() || EC04_BRAND.name

  return {
    id: createId('site'),
    templateId: 'cosmetics',
    brand: {
      ...EC04_BRAND,
      name,
      concept: overrides?.concept?.trim() || EC04_BRAND.concept,
    },
    hero: { ...EC04_HERO },
    theme: { ...COSMETICS_THEME },
    announcement: EC04_BRAND.announcement,
    announcementVisible: true,
    freeShippingThreshold: 8000,
    announcementExtra: '限定コフレ好評発売中',
    products: [],
    pickupIds: [],
    categories: DEFAULT_CATEGORIES.map((item) => ({ ...item })),
    news: DEFAULT_NEWS.map((item) => ({ ...item })),
    instagram: {
      kicker: 'INSTAGRAM',
      handle: name.replaceAll(/\s+/g, '').toLowerCase(),
      caption: '花と光の毎日を、そっとお届けします。',
    },
    legal: emptyLegal(),
    sections: [...DEFAULT_SECTIONS],
    setupStep: 'brand',
    updatedAt: new Date().toISOString(),
  }
}
