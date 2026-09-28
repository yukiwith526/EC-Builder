import type { SiteData } from '../../../types/site'
import { DEFAULT_SECTIONS, emptyLegal } from '../../../types/site'
import { createId } from '../../../site/ids'
import { GOODS_THEME } from '../../../site/update'
import { GOODS_ANNOUNCE_EXTRA, GOODS_BRAND, GOODS_CATEGORIES, GOODS_HERO, GOODS_NEWS } from './catalog'

export function createGoodsSite(overrides?: { name?: string; concept?: string }): SiteData {
  const name = overrides?.name?.trim() || GOODS_BRAND.name
  return {
    id: createId('site'),
    templateId: 'goods',
    brand: {
      ...GOODS_BRAND,
      name,
      concept: overrides?.concept?.trim() || GOODS_BRAND.concept,
    },
    hero: { ...GOODS_HERO },
    theme: { ...GOODS_THEME },
    announcement: GOODS_BRAND.announcement,
    announcementVisible: true,
    freeShippingThreshold: 5000,
    announcementExtra: GOODS_ANNOUNCE_EXTRA,
    products: [],
    pickupIds: [],
    categories: GOODS_CATEGORIES.map((item) => ({ ...item })),
    news: GOODS_NEWS.map((item) => ({ ...item })),
    instagram: {
      kicker: 'INSTAGRAM',
      handle: name.replaceAll(/\s+/g, '').toLowerCase(),
      caption: '暮らしの一瞬を、そっとお届けします。',
    },
    legal: emptyLegal(),
    sections: [...DEFAULT_SECTIONS],
    setupStep: 'brand',
    updatedAt: new Date().toISOString(),
  }
}
