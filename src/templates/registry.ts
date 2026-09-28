import type { ComponentType } from 'react'
import type { Selection, SiteData, TemplateId, TemplateKind, TemplateMeta } from '../types/site'
import { DESIGN_IMAGES as COSMETICS_IMAGES } from './ec/cosmetics/ec04Catalog'
import { createCosmeticsSite } from './ec/cosmetics/defaultSite'
import { CosmeticsStorefront } from './ec/cosmetics/CosmeticsStorefront'
import { GOODS_HERO, GOODS_IMAGES } from './ec/goods/catalog'
import { createGoodsSite } from './ec/goods/defaultSite'
import { LifestyleStorefront } from './ec/shared/LifestyleStorefront'
import { LP_TEMPLATES } from './lp'

type StorefrontProps = {
  site: SiteData
  selection: Selection | null
  interactive?: boolean
  browse?: boolean
  onSelect: (selection: Selection | null) => void
  onChange?: (site: SiteData) => void
}

const EC_TEMPLATES: TemplateMeta[] = [
  {
    id: 'cosmetics',
    kind: 'ec',
    name: 'コスメ・ビューティー',
    description: 'ピンクをモチーフとした、女性向けの美容・コスメテンプレートです。',
    available: true,
    previewImages: ['/brand/hero.png'],
    overlay: 'light',
  },
  {
    id: 'goods',
    kind: 'ec',
    name: 'シンプル・雑貨',
    description: '余白のある、シンプルな暮らしのECテンプレートです。',
    available: false,
    previewImages: [GOODS_HERO.image],
    overlay: 'light',
  },
]

export const TEMPLATES: TemplateMeta[] = [...LP_TEMPLATES, ...EC_TEMPLATES]

export function templatesByKind(kind: TemplateKind) {
  return TEMPLATES.filter((item) => item.kind === kind && item.available)
}

export function createSiteFromTemplate(
  templateId: TemplateId,
  brief?: { name?: string; concept?: string },
): SiteData {
  if (templateId === 'goods') return createGoodsSite(brief)
  return createCosmeticsSite(brief)
}

export function getStorefront(templateId: TemplateId): ComponentType<StorefrontProps> {
  if (templateId === 'goods') return LifestyleStorefront
  return CosmeticsStorefront
}

export function getDesignImages(templateId?: string) {
  if (templateId === 'goods') return GOODS_IMAGES
  return COSMETICS_IMAGES
}
