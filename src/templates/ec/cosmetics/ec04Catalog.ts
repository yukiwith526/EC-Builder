import { categoryLabel, DEFAULT_PRODUCT_INGREDIENTS, DEFAULT_PRODUCT_USAGE, type SiteProduct } from '../../../types/site'

export const EC04_BRAND = {
  name: 'FLEUR LUMIÈRE',
  tagline: '“かわいい”に恋するすべてのひとに。',
  description:
    '“かわいい”。\nそれは、見た目だけの美しさでも、誰かに褒められるための飾りでもなく、あなたを、あまくて、やわらかな幸福の予感でつつむもの。\nINNOCENT & RADIANT\n2つの魅力が惹きよせる幸せの魔法を、今日もあなたに。',
  concept: '花と光をテーマにした、ロマンティックなビューティーブランド',
  image: '/brand/rose.png',
  announcement: '8,000円以上のご購入で全国送料無料 ／ 限定コフレ好評発売中',
}

export const EC04_HERO = {
  kicker: 'LIMITED EDITION',
  title: 'Petit Romance Bouquet',
  subtitle: '花びらの光を、指先に。春の限定コフレ。',
  cta: '詳しく見る',
  image: '/brand/hero.png',
  images: ['/brand/hero.png', '/brand/rose.png'],
}

export const DESIGN_IMAGES = ['/brand/hero.png', '/brand/rose.png']

function item(
  id: string,
  name: string,
  price: number,
  description: string,
  image: string,
  category: string,
): SiteProduct {
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
    categoryJa: categoryLabel(category, [
      { id: 'makeup', label: 'メイク' },
      { id: 'skincare', label: 'スキンケア' },
      { id: 'fragrance', label: 'フレグランス' },
      { id: 'gift', label: 'ギフトセット' },
    ]),
  }
}

export const EC04_PRODUCTS: SiteProduct[] = [
  item('p01', 'クリスタルブルーム リップオイル', 4180, '花びらのような透明感を唇に。オイルなのにべたつかず、微笑むたび光が残ります。', '/products/lip-oil.png', 'makeup'),
  item('p02', 'ペタルプリズム ハイライター', 4620, '虹色の花びらが頬骨でほどけるハイライター。朝の光を閉じ込めたような繊細な輝きです。', '/products/highlighter.png', 'makeup'),
  item('p03', 'ムーンライト アイパレット', 6380, '夜明け前の空を9色に分けたアイシャドウ。マットとラスターが、まぶたで花を咲かせます。', '/products/palette.png', 'makeup'),
  item('p04', 'デューイローズ ファンデーション', 5280, 'バラの露のような艶を残すリキッドファンデーション。カバーしながらも、素肌に見える仕上がり。', '/products/primer-ivory.png', 'makeup'),
  item('p05', 'シルクヴェール プライマー', 3850, 'シルクのような膜で毛穴をやわらげる下地。ラベンダーピンクの光が、血色をそっと足します。', '/products/primer-lilac.png', 'makeup'),
  item('p06', 'ベルベット リップルージュ', 3520, 'ベルベットのようなマットなのに、乾かないルージュ。花びらを一枚、そっと重ねた発色。', '/products/lipstick.png', 'makeup'),
  item('p07', 'パールチークカラー', 3960, '真珠層のチーク。指で溶かすと、頬が内側から赤らんだように見えます。', '/products/highlighter.png', 'makeup'),
  item('p08', 'クリスタルネイルカラー', 1980, 'ガラスの花びらのような透け感ネイル。二度塗りで、指先がジュエリーになります。', '/products/nail.png', 'makeup'),
  item('p09', 'ローズデュー ミスト', 3300, 'ダマスクローズの朝露を閉じ込めたミスト。メイクの上からも、肌をうるおいで包みます。', '/products/mist.png', 'skincare'),
  item('p10', 'ペタル ナイトクリーム', 4840, '花びらをすりつぶしたような濃密クリーム。眠っているあいだに、肌のキメをやわらかく整えます。', '/products/cream.png', 'skincare'),
  item('p11', 'ムーンペタル オードトワレ', 8800, '夜にほころぶ花の香り。トップはペアー、ハートはピオニー、ベースはムスクのやわらかな残香。', '/products/perfume.png', 'fragrance'),
  item('p12', 'ブルーム ヘアミスト', 4180, '髪にひと吹きする花のベール。歩くたび、やわらかい香りが残ります。', '/products/mist.png', 'fragrance'),
  item('p13', 'ペタル ホリデーコフレ', 12100, 'リップオイル、チーク、ミストを花束のようにまとめた限定コフレ。ギフトボックス付き。', '/products/gift-set.png', 'gift'),
  item('p14', 'ミニリップ アトリエ', 6600, 'リップオイル3色を小さなアトリエに。ポーチに忍ばせて、気分で色を選べます。', '/products/gift-set.png', 'gift'),
]

export const EC04_PICKUP = [
  { title: 'ムーンライト アイパレット', text: '夜明けの空を閉じ込めた、9色の花びら。', image: '/products/palette.png' },
  { title: 'ローズデュー ミスト', text: 'メイクの上から、朝露のようにひと吹き。', image: '/products/mist.png' },
  { title: 'クリスタルブルーム リップオイル', text: '透けるピンクが、微笑むたびに残る。', image: '/products/lip-oil.png' },
  { title: 'シルクヴェール プライマー', text: 'ラベンダーの光で、毛穴をやわらげる下地。', image: '/products/primer-lilac.png' },
]

export const EC04_NEWS = [
  { date: '2026.09.18', title: 'Petit Romance Bouquet 限定コフレを発売しました' },
  { date: '2026.09.01', title: '公式オンラインショップをリニューアルオープン' },
  { date: '2026.08.12', title: '秋の新色 クリスタルブルーム リップオイル 3色追加' },
]

export const EC04_INSTAGRAM = [
  '/products/primer-lilac.png',
  '/products/primer-ivory.png',
  '/products/lip-oil.png',
  '/products/perfume.png',
  '/products/gift-set.png',
  '/brand/rose.png',
]
