export function isGoodsTemplate(templateId?: string) {
  return templateId === 'goods'
}

const COSMETICS_INTRO = 'ブランド名を教えてください。例：LUMINA'
const GOODS_INTRO = 'ブランド名を教えてください。例：KUMO'

export function introMessage(templateId?: string) {
  return isGoodsTemplate(templateId) ? GOODS_INTRO : COSMETICS_INTRO
}

export function isStaleIntro(text: string, templateId?: string) {
  const expected = introMessage(templateId)
  if (text === expected) return false
  return text === COSMETICS_INTRO || text === GOODS_INTRO || (isGoodsTemplate(templateId) && text.includes('LUMINA'))
}

export function brandInputPlaceholder(templateId?: string) {
  return isGoodsTemplate(templateId) ? 'ブランド名を入力... 例：KUMO' : 'ブランド名を入力... 例：LUMINA'
}

export function productNamePlaceholder(templateId?: string) {
  return isGoodsTemplate(templateId) ? 'Room Fragrance' : 'Glow Serum'
}

export function defaultProductPrice(templateId?: string) {
  return isGoodsTemplate(templateId) ? '3200' : '5800'
}

export function mockHelp(templateId?: string) {
  return isGoodsTemplate(templateId)
    ? '例えば「ブランド名をKUMOにして」「キャンドルを追加して。価格は3200円」「全体的にもう少し落ち着いたトーンにして」と入力してください。'
    : '例えば「ブランド名をLUMINAにして」「美容液を追加して。価格は5800円」「全体的にもう少し大人っぽくして」と入力してください。'
}

export function mockProductName(message: string, templateId?: string) {
  if (isGoodsTemplate(templateId)) {
    if (/キャンドル/.test(message)) return 'Soy Candle'
    if (/香り|フレグランス/.test(message)) return 'Room Fragrance'
    return 'New Item'
  }
  if (/美容液/.test(message)) return 'Glow Serum'
  if (/キャンドル|香り|フレグランス/.test(message)) return 'Room Fragrance'
  return 'New Product'
}
