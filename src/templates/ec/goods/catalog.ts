import { categoryLabel, DEFAULT_PRODUCT_INGREDIENTS, DEFAULT_PRODUCT_USAGE, type SiteCategory, type SiteProduct } from '../../../types/site'

export const GOODS_CATEGORIES: SiteCategory[] = [
  { id: 'skincare', label: 'スキンケア' },
  { id: 'hair', label: 'ヘアケア' },
  { id: 'body', label: 'ボディケア' },
  { id: 'fragrance', label: 'フレグランス' },
]

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&h=900&q=80`

export const GOODS_IMAGES = [
  photo('photo-1615397349754-cfa2066a298e'),
  photo('photo-1556228578-8c89e6adf883'),
  photo('photo-1620916566398-39f1143ab7be'),
  photo('photo-1603006905003-be475563bc59'),
  photo('photo-1608248543803-ba4f8c70ae0b'),
  photo('photo-1617897903246-719242758050'),
]

export const GOODS_BRAND = {
  name: 'Good Skin.',
  tagline: '肌にも、暮らしにも、余白を。',
  description:
    '余分を削ぎ、本質を残す。香りは控えめで、かたちは手に馴染むものだけを残しました。部屋の空気ごと、毎日をそっと整えます。',
  concept: '余分を削ぎ、本質を残すデイリーケア',
  image: GOODS_IMAGES[3],
  announcement: '5,000円以上のご購入で全国送料無料 ／ 暮らしの道具と、静かな香り',
}

export const GOODS_ANNOUNCE_EXTRA = '暮らしの道具と、静かな香り'

export const GOODS_NEWS = [
  { id: 'news-1', date: '2026.09.18', title: 'Room Fragrance を入荷しました' },
  { id: 'news-2', date: '2026.09.01', title: '公式オンラインショップをオープンしました' },
  { id: 'news-3', date: '2026.08.12', title: '暮らしの定番アイテムを追加しました' },
]

export const GOODS_HERO = {
  kicker: 'FOR YOUR SPACE',
  title: 'HOME SCENT',
  subtitle: '部屋の空気ごと、整える香り。',
  cta: 'フレグランスを見る',
  image: photo('photo-1608571423902-eed4a5ad8108'),
  images: [
    photo('photo-1608571423902-eed4a5ad8108'),
    photo('photo-1603006905003-be475563bc59'),
    photo('photo-1615397349754-cfa2066a298e'),
  ],
}

function item(id: string, name: string, price: number, description: string, image: string, category: string): SiteProduct {
  return {
    id,
    name,
    price,
    description,
    usage: DEFAULT_PRODUCT_USAGE,
    ingredients: DEFAULT_PRODUCT_INGREDIENTS,
    image,
    images: [image],
    category,
    categoryJa: categoryLabel(category, GOODS_CATEGORIES),
  }
}

export const GOODS_PRODUCTS: SiteProduct[] = [
  item('gs01', 'Hyaluronic Moisturizer', 3850, 'ベタつかず、肌の上で光だけが残る日常使いの保湿。', GOODS_IMAGES[2], 'skincare'),
  item('gs02', 'Brightening Essence', 4180, 'くすみの気になる朝に。透明感を底上げする導入美容液。', GOODS_IMAGES[1], 'skincare'),
  item('gs03', 'Botanical Shampoo', 1540, '植物由来の洗浄成分で、頭皮と髪をやさしく整える。', GOODS_IMAGES[4], 'hair'),
  item('gs04', 'Multi Body Balm', 1540, '指先からかかとまで。一塗りで肌を包むマルチバーム。', GOODS_IMAGES[5], 'body'),
  item('gs05', 'Room Fragrance', 1540, '部屋の空気ごと、整えるリードディフューザー。', GOODS_IMAGES[3], 'fragrance'),
]
