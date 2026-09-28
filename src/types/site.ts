export const TEMPLATE_IDS = ['cosmetics', 'goods'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]
export type TemplateKind = 'lp' | 'ec'

export const SECTION_IDS = ['hero', 'concept', 'pickup', 'products', 'instagram', 'news'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const DEFAULT_SECTIONS: SectionId[] = [...SECTION_IDS]

export const DEFAULT_CATEGORIES: SiteCategory[] = [
  { id: 'makeup', label: 'メイク' },
  { id: 'skincare', label: 'スキンケア' },
  { id: 'fragrance', label: 'フレグランス' },
  { id: 'gift', label: 'ギフトセット' },
]

export type SetupStep = 'brand' | 'seller' | 'categories' | 'products' | 'done'

export interface SiteLegal {
  seller: string
  representative: string
  address: string
  phone: string
  email: string
}

export function emptyLegal(): SiteLegal {
  return {
    seller: '',
    representative: '',
    address: '',
    phone: '',
    email: '',
  }
}

export type SiteConfig = SiteData

export interface SiteCategory {
  id: string
  label: string
}

export interface SiteNews {
  id: string
  date: string
  title: string
}

export const DEFAULT_NEWS: SiteNews[] = [
  { id: 'news-1', date: '2026.09.18', title: 'Petit Romance Bouquet 限定コフレを発売しました' },
  { id: 'news-2', date: '2026.09.01', title: '公式オンラインショップをリニューアルオープン' },
  { id: 'news-3', date: '2026.08.12', title: '秋の新色 クリスタルブルーム リップオイル 3色追加' },
]

export const DEFAULT_PRODUCT_USAGE = '適量を手に取り、肌なじませてお使いください。'
export const DEFAULT_PRODUCT_INGREDIENTS = '全成分は商品パッケージをご確認ください。'

export interface SiteProduct {
  id: string
  name: string
  price: number
  description: string
  usage: string
  ingredients: string
  image: string
  images: string[]
  category: string
  categoryJa: string
}

export interface SiteTheme {
  backgroundColor: string
  inkColor: string
  accentColor: string
  paperColor: string
}

export interface SiteData {
  id: string
  templateId: TemplateId
  setupStep: SetupStep
  brand: {
    name: string
    tagline: string
    description: string
    concept: string
    image: string
  }
  hero: {
    kicker: string
    title: string
    subtitle: string
    cta: string
    image: string
    images: string[]
  }
  theme: SiteTheme
  announcement: string
  announcementVisible: boolean
  freeShippingThreshold: number
  announcementExtra: string
  products: SiteProduct[]
  pickupIds: string[]
  categories: SiteCategory[]
  news: SiteNews[]
  instagram: {
    kicker: string
    handle: string
    caption: string
  }
  legal: SiteLegal
  sections: SectionId[]
  updatedAt: string
}

export type Selection =
  | { type: 'announcement' }
  | { type: 'news'; id: string }
  | { type: 'news.list' }
  | { type: 'brand.name' }
  | { type: 'brand.tagline' }
  | { type: 'brand.description' }
  | { type: 'brand.image' }
  | { type: 'hero' }
  | { type: 'hero.image' }
  | { type: 'hero.kicker' }
  | { type: 'hero.title' }
  | { type: 'hero.subtitle' }
  | { type: 'hero.cta' }
  | { type: 'pickup' }
  | { type: 'instagram' }
  | { type: 'instagram.kicker' }
  | { type: 'instagram.handle' }
  | { type: 'instagram.caption' }
  | { type: 'product'; id: string }
  | { type: 'product.image'; id: string }
  | { type: 'product.description'; id: string }
  | { type: 'product.usage'; id: string }
  | { type: 'product.ingredients'; id: string }
  | { type: 'products' }
  | { type: 'theme' }
  | { type: 'footer' }
  | { type: 'legal' }
  | { type: 'legal.seller' }
  | { type: 'legal.representative' }
  | { type: 'legal.address' }
  | { type: 'legal.phone' }
  | { type: 'legal.email' }

export interface TemplateMeta {
  id: TemplateId
  kind: TemplateKind
  name: string
  description: string
  available: boolean
  previewImages: string[]
  overlay?: 'light' | 'dark'
}

export interface SiteOperation {
  op: 'replace' | 'add' | 'remove'
  path: string
  value?: unknown
}

export function isProductSelection(selection: Selection | null): selection is Extract<Selection, { id: string }> {
  return Boolean(
    selection &&
      (selection.type === 'product' ||
        selection.type === 'product.image' ||
        selection.type === 'product.description' ||
        selection.type === 'product.usage' ||
        selection.type === 'product.ingredients'),
  )
}

export function selectionId(selection: Selection | null): string | undefined {
  if (!selection) return undefined
  if (selection.type === 'product') return `products.${selection.id}`
  if (selection.type === 'product.image') return `products.${selection.id}.image`
  if (selection.type === 'product.description') return `products.${selection.id}.description`
  if (selection.type === 'product.usage') return `products.${selection.id}.usage`
  if (selection.type === 'product.ingredients') return `products.${selection.id}.ingredients`
  if (selection.type === 'news') return `news.${selection.id}`
  if (selection.type === 'news.list') return 'news.list'
  return selection.type
}

export function selectionLabel(selection: Selection | null): string {
  if (!selection) return ''
  if (selection.type === 'news') return 'お知らせ'
  if (selection.type === 'product.image') return '商品画像'
  if (selection.type === 'product.description') return '商品説明'
  if (selection.type === 'product.usage') return '使い方・特長'
  if (selection.type === 'product.ingredients') return '成分'
  if (selection.type === 'product') return '商品'
  const labels: Record<string, string> = {
    announcement: 'お知らせバー',
    'brand.name': 'ブランド名',
    'brand.tagline': 'タグライン',
    'brand.description': 'ブランド説明',
    'brand.image': 'コンセプト画像',
    hero: 'Hero',
    'hero.image': 'Hero画像',
    'hero.kicker': 'Heroキッカー',
    'hero.title': 'Heroタイトル',
    'hero.subtitle': 'Heroサブコピー',
    'hero.cta': 'Heroボタン',
    pickup: 'ピックアップ',
    instagram: 'Instagram',
    'instagram.kicker': 'Instagram見出し',
    'instagram.handle': 'Instagramアカウント',
    'instagram.caption': 'Instagram説明',
    products: '商品一覧',
    'news.list': 'お知らせ',
    theme: 'カラー',
    footer: 'フッター',
    legal: '事業者情報',
    'legal.seller': '事業者名',
    'legal.representative': '運営統括責任者',
    'legal.address': '所在地',
    'legal.phone': '電話番号',
    'legal.email': 'メールアドレス',
  }
  return labels[selection.type] ?? selection.type
}

export function formatAnnouncement(threshold: number, extra: string): string {
  const amount = Math.max(0, Math.round(threshold)).toLocaleString('ja-JP')
  const suffix = extra.trim()
  return suffix ? `${amount}円以上のご購入で全国送料無料 ／ ${suffix}` : `${amount}円以上のご購入で全国送料無料`
}

export const MAX_HERO_SLIDES = 3
export const MAX_PRODUCT_IMAGES = 3

export function heroImages(hero: SiteData['hero']): string[] {
  const listed = Array.isArray(hero.images) ? hero.images.filter((item) => typeof item === 'string' && item.length > 0) : []
  if (hero.image && !listed.includes(hero.image)) return [hero.image, ...listed].slice(0, MAX_HERO_SLIDES)
  return listed.slice(0, MAX_HERO_SLIDES)
}

export function productImages(product: Pick<SiteProduct, 'image' | 'images'>): string[] {
  const listed = Array.isArray(product.images) ? product.images.filter((item) => typeof item === 'string' && item.length > 0) : []
  if (product.image && !listed.includes(product.image)) return [product.image, ...listed].slice(0, MAX_PRODUCT_IMAGES)
  return listed.slice(0, MAX_PRODUCT_IMAGES)
}

export function categoryLabel(id: string, categories: SiteCategory[]): string {
  return categories.find((item) => item.id === id)?.label ?? id
}

export function namedCategories(categories: SiteCategory[]): SiteCategory[] {
  return categories.filter((item) => item.label.trim().length > 0)
}
