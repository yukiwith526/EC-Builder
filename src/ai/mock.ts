import type { SiteConfig, SiteOperation, SiteProduct } from '../types/site'
import { COSMETICS_THEME, GOODS_THEME, LUXURY_THEME } from '../site/update'
import { createId } from '../site/ids'
import { isGoodsTemplate, mockHelp, mockProductName } from '../templates/voice'
import type { SelectionTarget } from './target'

interface MockRequest {
  message: string
  site: SiteConfig
  target: SelectionTarget | null
}

interface MockResult {
  reply: string
  operations: SiteOperation[]
}

export function interpretMock(request: MockRequest): MockResult {
  const message = request.message.trim()
  const target = request.target
  const addOrRemove = catalogChange(request, message)
  if (addOrRemove) return addOrRemove

  if (target && target.kind !== 'other') {
    const targeted = applySelectionEdit(request, message, target)
    if (targeted.notes.length) return { operations: targeted.operations, reply: targeted.notes.join('\n') }
    return {
      operations: [],
      reply: `選択中の${target.label}について、もう少し具体的に指示してください。例：「もっと短くして」「高級感のある文章にして」`,
    }
  }

  const operations: SiteOperation[] = []
  const notes: string[] = []
  const brandName = extractBrandRename(message)
  if (brandName) {
    operations.push({ op: 'replace', path: '/brand/name', value: brandName })
    notes.push(`ブランド名を「${brandName}」に変更しました。`)
  }

  const legal = legalEdits(message)
  if (legal.length) {
    operations.push(...legal)
    notes.push('特定商取引法・プライバシーポリシーの事業者情報を更新しました。')
  }

  if (/20代|女性向け/.test(message)) {
    if (isGoodsTemplate(request.site.templateId)) {
      operations.push(
        { op: 'replace', path: '/brand/tagline', value: '毎日の暮らしに、小さな余白を。' },
        {
          op: 'replace',
          path: '/brand/description',
          value: `${request.site.brand.name}は、自分らしい暮らしを楽しむ人のためのブランドです。使いやすい道具と、主張しすぎない香りで、部屋の空気を整えます。`,
        },
      )
    } else {
      operations.push(
        { op: 'replace', path: '/brand/tagline', value: 'わたしらしい、いちばんきれいを。' },
        {
          op: 'replace',
          path: '/brand/description',
          value: '20代の毎日に寄り添うコスメ。仕事も、休日も、自分のペースで輝けるように。軽やかな質感と、やさしい香りをお届けします。',
        },
      )
    }
    notes.push('20代女性向けのトーンに整えました。')
  }

  if (/大人っぽ|落ち着|全体的に/.test(message)) {
    if (isGoodsTemplate(request.site.templateId)) {
      operations.push(
        { op: 'replace', path: '/theme/inkColor', value: GOODS_THEME.inkColor },
        { op: 'replace', path: '/theme/accentColor', value: '#2f585f' },
        { op: 'replace', path: '/theme/paperColor', value: '#efece6' },
        { op: 'replace', path: '/theme/backgroundColor', value: GOODS_THEME.backgroundColor },
        { op: 'replace', path: '/brand/tagline', value: '余白のある、大人の暮らし。' },
        {
          op: 'replace',
          path: '/brand/description',
          value: `${request.site.brand.name}は、華美さを抑えた色と、静かな香りで部屋を整えます。暮らしに残るのは、余白と素材感だけです。`,
        },
      )
    } else {
      operations.push(
        { op: 'replace', path: '/theme/inkColor', value: '#3a2a32' },
        { op: 'replace', path: '/theme/accentColor', value: '#9a6b7c' },
        { op: 'replace', path: '/theme/paperColor', value: '#f3ebe6' },
        { op: 'replace', path: '/theme/backgroundColor', value: '#faf6f3' },
        { op: 'replace', path: '/brand/tagline', value: '余白のある、大人の美しさ。' },
        {
          op: 'replace',
          path: '/brand/description',
          value: '華美さを抑えた質感と、落ち着いた色。肌に残るのは、静かな艶だけ。日常の装いに、ほどよい気品を添えます。',
        },
      )
    }
    notes.push('全体を少し大人っぽいトーンに整えました。')
  }

  if (/ピンクを?(少し)?薄/.test(message)) {
    operations.push(
      { op: 'replace', path: '/theme/accentColor', value: '#e3b7c5' },
      { op: 'replace', path: '/theme/paperColor', value: '#fff8fa' },
    )
    notes.push('ピンクを少し薄い色味にしました。')
  }

  if (/高級|ラグジュアリー|luxury/i.test(message) && !/コピー|文章|文言/.test(message)) {
    operations.push(
      { op: 'replace', path: '/theme/backgroundColor', value: LUXURY_THEME.backgroundColor },
      { op: 'replace', path: '/theme/inkColor', value: LUXURY_THEME.inkColor },
      { op: 'replace', path: '/theme/accentColor', value: LUXURY_THEME.accentColor },
      { op: 'replace', path: '/theme/paperColor', value: LUXURY_THEME.paperColor },
    )
    notes.push('高級感のある雰囲気に変更しました。')
  }

  if (/かわいい|コスメらしい|明るい/.test(message)) {
    const theme = isGoodsTemplate(request.site.templateId) ? GOODS_THEME : COSMETICS_THEME
    operations.push(
      { op: 'replace', path: '/theme/backgroundColor', value: theme.backgroundColor },
      { op: 'replace', path: '/theme/inkColor', value: theme.inkColor },
      { op: 'replace', path: '/theme/accentColor', value: theme.accentColor },
      { op: 'replace', path: '/theme/paperColor', value: theme.paperColor },
    )
    notes.push('明るくやさしい雰囲気に戻しました。')
  }

  if (/ブランドコンセプトを削除/.test(message)) {
    operations.push({
      op: 'replace',
      path: '/sections',
      value: request.site.sections.filter((id) => id !== 'concept'),
    })
    notes.push('ブランドコンセプトを非表示にしました。')
  }

  if (notes.length === 0) {
    const copy = productCopyEdit(request)
    if (copy) return copy
    return {
      operations: [],
      reply: mockHelp(request.site.templateId),
    }
  }

  return { operations, reply: notes.join('\n') }
}

function catalogChange(request: MockRequest, message: string): MockResult | null {
  const target = request.target
  const listing = target?.id === 'products' || request.site.setupStep === 'products'
  const addCount = message.match(/商品を(\d+)つ追加/)
  const addNamed = message.match(/「([^」]+)」を追加/) ?? message.match(/([^\s「」。、]{2,40})を追加/)
  const priceMatch = message.match(/(\d[\d,]*)\s*円/)
  const wantsProduct =
    Boolean(addCount) ||
    /商品を追加|美容液を追加|キャンドルを追加/.test(message) ||
    ((target?.id === 'products' || target?.id.startsWith('product.')) && /追加/.test(message) && !/お知らせ/.test(message)) ||
    (listing && /追加|作って|つくって|新商品/.test(message) && !/お知らせ/.test(message))

  const copy = productCopyEdit(request)
  if (copy) return copy

  if (wantsProduct && !/画像/.test(message)) {
    const count = addCount ? Math.min(5, Number(addCount[1]) || 1) : 1
    const operations: SiteOperation[] = []
    let addedName = ''
    for (let i = 0; i < count; i += 1) {
      const named = addNamed?.[1] && !/^商品/.test(addNamed[1]) ? clean(addNamed[1]) : ''
      const name = named || mockProductName(message, request.site.templateId) || (count > 1 ? `New Product ${i + 1}` : 'New Product')
      addedName = name
      const price = priceMatch ? Number(priceMatch[1].replaceAll(',', '')) : isGoodsTemplate(request.site.templateId) ? 3200 : 5800
      const category = /スキンケア|美容液/.test(message)
        ? 'skincare'
        : /ヘア/.test(message)
          ? 'hair'
          : /ボディ/.test(message)
            ? 'body'
            : /フレグランス|香水|キャンドル/.test(message)
              ? request.site.categories.find((item) => item.id === 'fragrance')?.id ?? request.site.categories[0]?.id
              : /ギフト/.test(message)
                ? request.site.categories.find((item) => item.id === 'gift')?.id ?? request.site.categories[0]?.id
                : request.site.categories[0]?.id ?? 'makeup'
      const categoryJa = request.site.categories.find((item) => item.id === category)?.label ?? category
      operations.push({
        op: 'add',
        path: '/products/-',
        value: {
          id: createId('product'),
          name,
          price,
          description: rewriteSelectedText(
            '',
            `/products/${name}/description`,
            `${name}の商品説明を書いて。${message}`,
            request.site.brand.name,
            request.site.templateId,
          ),
          usage: rewriteSelectedText(
            '',
            `/products/${name}/usage`,
            `${name}の使い方を書いて。${message}`,
            request.site.brand.name,
            request.site.templateId,
          ),
          ingredients: rewriteSelectedText(
            '',
            `/products/${name}/ingredients`,
            `${name}の成分を書いて。${message}`,
            request.site.brand.name,
            request.site.templateId,
          ),
          image: '',
          images: [],
          category,
          categoryJa,
        },
      })
    }
    return { operations, reply: count > 1 ? `商品を${count}つ追加し、説明・使い方・成分も書きました。` : `「${addedName}」を追加し、説明・使い方・成分も書きました。` }
  }

  if (/この商品を削除|商品を削除/.test(message)) {
    const id = target?.id.startsWith('product.') ? target.id.replace(/^product\.(image\.)?/, '') : request.site.products.at(-1)?.id
    if (id) return { operations: [{ op: 'remove', path: `/products/${id}` }], reply: '商品を削除しました。' }
  }

  if ((target?.id === 'news.list' || target?.id.startsWith('news.')) && /追加/.test(message) && !/商品/.test(message)) {
    return {
      operations: [
        {
          op: 'add',
          path: '/news/-',
          value: { id: createId('news'), date: today(), title: clean(addNamed?.[1] || '新しいお知らせ') },
        },
      ],
      reply: 'お知らせを追加しました。',
    }
  }

  return null
}

function wantsAllProductCopy(message: string) {
  const wantDesc = /商品説明/.test(message) || (/説明/.test(message) && !/ブランド/.test(message))
  const wantUsage = /使い方|特長/.test(message)
  const wantIng = /成分/.test(message)
  const specified = [wantDesc, wantUsage, wantIng].filter(Boolean).length
  if (specified >= 2) return true
  if (specified === 1) return false
  return /書いて|作成して|作って|考えて|生成して/.test(message)
}

function productCopyEdit(request: MockRequest): MockResult | null {
  const message = request.message
  if (/追加|作って|つくって|新商品/.test(message)) return null
  if (!/書いて|説明|使い方|特長|成分/.test(message)) return null
  const products = matchingProducts(request.site, message)
  if (!products.length) return null
  const fields = requestedCopyFields(message)
  const operations: SiteOperation[] = []
  const labels: string[] = []
  for (const product of products) {
    if (fields.has('description')) {
      operations.push({
        op: 'replace',
        path: `/products/${product.id}/description`,
        value: rewriteSelectedText(product.description, `/products/${product.id}/description`, message, request.site.brand.name, request.site.templateId),
      })
      labels.push('商品説明')
    }
    if (fields.has('usage')) {
      operations.push({
        op: 'replace',
        path: `/products/${product.id}/usage`,
        value: rewriteSelectedText(product.usage ?? '', `/products/${product.id}/usage`, message, request.site.brand.name, request.site.templateId),
      })
      labels.push('使い方')
    }
    if (fields.has('ingredients')) {
      operations.push({
        op: 'replace',
        path: `/products/${product.id}/ingredients`,
        value: specificIngredients(product),
      })
      labels.push('成分')
    }
  }
  if (!operations.length) return null
  const names = products.map((item) => item.name || '商品').join('、')
  const unique = [...new Set(labels)]
  return { operations, reply: `「${names}」の${unique.join('・')}を更新しました。` }
}

function matchingProducts(site: SiteConfig, message: string): SiteProduct[] {
  const quoted = message.match(/「([^」]+)」/)
  if (quoted?.[1]) {
    const found = site.products.filter((item) => item.name.includes(quoted[1]))
    if (found.length) return found
  }
  const haystack = (item: SiteProduct) => `${item.name} ${item.category} ${item.categoryJa}`
  if (/フレグランス|香水|香り|ディフューザー|キャンドル/.test(message)) {
    const found = site.products.filter((item) => /fragrance|香水|香り|Fragrance|キャンドル/i.test(haystack(item)))
    if (found.length) return found
  }
  if (/スキンケア|美容液/.test(message)) {
    const found = site.products.filter((item) => /skincare|スキン|美容液/i.test(haystack(item)))
    if (found.length) return found
  }
  if (/ヘア/.test(message)) {
    const found = site.products.filter((item) => /hair|ヘア/i.test(haystack(item)))
    if (found.length) return found
  }
  if (site.products.length === 1) return site.products
  return site.products.slice(-1)
}

function requestedCopyFields(message: string): Set<'description' | 'usage' | 'ingredients'> {
  const fields = new Set<'description' | 'usage' | 'ingredients'>()
  const wantIng = /成分/.test(message)
  const wantUsage = /使い方|特長/.test(message)
  const wantDesc = /商品説明/.test(message) || (/説明/.test(message) && !/ブランド/.test(message) && !wantIng)
  if (wantDesc) fields.add('description')
  if (wantUsage) fields.add('usage')
  if (wantIng) fields.add('ingredients')
  if (fields.size === 0 && /書いて|作成して|考えて/.test(message)) {
    fields.add('description')
    fields.add('usage')
    fields.add('ingredients')
  }
  return fields
}

function specificIngredients(product: Pick<SiteProduct, 'name' | 'category' | 'categoryJa'>) {
  const key = `${product.name} ${product.category} ${product.categoryJa}`
  if (/fragrance|香水|香り|Fragrance|キャンドル|ディフ/i.test(key)) {
    return 'エタノール、精製水、香料（ベルガモット、ラベンダー、シダーウッド）、リナロール、リモネン、ゲラニオール、シトラール、クマリン、ヘキシルシンナマル'
  }
  if (/hair|ヘア/i.test(key)) {
    return '水、コカミドプロピルベタイン、グリセリン、パンテノール、アルガンオイル、トコフェロール、香料、フェノキシエタノール'
  }
  return '水、グリセリン、BG、スクワラン、ヒアルロン酸Na、トコフェロール、フェノキシエタノール、香料'
}

function applySelectionEdit(
  request: MockRequest,
  message: string,
  target: SelectionTarget,
): { operations: SiteOperation[]; notes: string[] } {
  if (target.kind === 'image') {
    return { operations: [], notes: ['画像はファイルから変更してください。'] }
  }
  if (target.path.startsWith('/legal/')) {
    return applyLegalSelection(message, target)
  }
  if (target.kind !== 'text' || !target.path) {
    return { operations: [], notes: [] }
  }

  const productMatch = target.path.match(/^\/products\/([^/]+)\//)
  const product = productMatch ? request.site.products.find((item) => item.id === productMatch[1]) : undefined
  if (product && wantsAllProductCopy(message)) {
    const brand = request.site.brand.name
    const templateId = request.site.templateId
    const description = rewriteSelectedText(product.description, `/products/${product.id}/description`, message, brand, templateId)
    const usage = rewriteSelectedText(product.usage ?? '', `/products/${product.id}/usage`, message, brand, templateId)
    const ingredients = specificIngredients(product)
    return {
      operations: [
        { op: 'replace', path: `/products/${product.id}/description`, value: description },
        { op: 'replace', path: `/products/${product.id}/usage`, value: usage },
        { op: 'replace', path: `/products/${product.id}/ingredients`, value: ingredients },
      ],
      notes: ['商品説明・使い方・成分を書きました。'],
    }
  }
  let path = target.path
  let current = target.currentText
  let label = target.label
  if (product) {
    if (/成分/.test(message)) {
      path = `/products/${product.id}/ingredients`
      current = product.ingredients ?? ''
      label = '成分'
    } else if (/使い方|特長/.test(message)) {
      path = `/products/${product.id}/usage`
      current = product.usage ?? ''
      label = '使い方・特長'
    } else if (/商品説明|説明/.test(message) && !/ブランド/.test(message)) {
      path = `/products/${product.id}/description`
      current = product.description
      label = '商品説明'
    }
  }

  const quoted = message.match(/[「『"]([^」』"]+)[」』"]/)
  const next = quoted?.[1]
    ? clean(quoted[1])
    : path.endsWith('/ingredients') && product
      ? specificIngredients(product)
      : rewriteSelectedText(current, path, message, request.site.brand.name, request.site.templateId)

  if (!next || next === current.trim()) {
    return { operations: [], notes: [] }
  }

  return {
    operations: [{ op: 'replace', path, value: next }],
    notes: [`選択中の${label}を更新しました。`],
  }
}

export function rewriteSelectedText(current: string, path: string, message: string, brand: string, templateId?: string): string {
  const shorter = /短く|簡潔|シンプル/.test(message)
  const tone = detectTone(message)
  const goods = isGoodsTemplate(templateId)
  const next = copyFor(path, tone, brand, current, shorter, goods)
  return next === current.trim() ? alternate(next, path, tone, brand, goods) : next
}

type Tone = 'luxury' | 'young' | 'cute' | 'natural' | 'fresh'

function detectTone(message: string): Tone {
  const luxury = /高級|大人|落ち着|上品|リッチ|ラグジュアリー/.test(message)
  const cute = /かわい[いく]|可愛|やさしく|優しい|甘い|ガーリー/.test(message)
  const young = /若い|20代|30代|女子|ガール|ときめ|刺さる|トレンド/.test(message)
  const natural = /自然|ナチュラル|やわらか|素朴|日常/.test(message)
  if (luxury) return 'luxury'
  if (young) return 'young'
  if (cute) return 'cute'
  if (natural) return 'natural'
  return 'fresh'
}

function pick(current: string, lines: string[]) {
  const cleaned = current.trim()
  return lines.find((line) => line !== cleaned) ?? lines[0] ?? cleaned
}

function copyFor(path: string, tone: Tone, brand: string, current: string, shorter: boolean, goods: boolean): string {
  if (path === '/hero/kicker') {
    return pick(current, tone === 'luxury' ? ['LIMITED'] : goods ? ['FOR YOUR SPACE', 'NEW ITEM'] : tone === 'cute' ? ['NEW ARRIVAL'] : ['FOR YOU', 'SELECTION'])
  }
  if (path === '/hero/title') {
    return pick(current, goods
      ? {
          luxury: ['QUIET FORM', 'STILL LIFE'],
          young: ['DAILY RITUAL', 'FOR YOUR ROOM'],
          cute: ['SOFT LIGHT', 'HOME SCENT'],
          natural: ['CLEAN FORMULA', 'GROW WITH US'],
          fresh: ['HOME SCENT', 'NEW ITEM'],
        }[tone]
      : {
          luxury: ['光は、ひかえめに。', '静かな艶を、肌に。'],
          young: ['わたしらしい、いちばんきれいを。', '今日の気分で、輝く。'],
          cute: ['今日の私に、光を。', 'かわいく、花ひらく。'],
          natural: ['肌に、やさしく。', '毎日に、余白を。'],
          fresh: ['肌に、花ひらく光を。', '光をまとう、毎日を。'],
        }[tone])
  }
  if (path === '/hero/subtitle') {
    return pick(current, goods
      ? {
          luxury: ['余白のある部屋に、静かな香りを。', '主張しすぎない、上質な日常。'],
          young: ['自分らしい暮らしを、今日から。', '部屋の空気ごと、整える。'],
          cute: ['やさしい香りが、部屋に残る。', '小さな道具で、気分を整える。'],
          natural: ['余分を削ぎ、本質を残す。', '手に取るたびに、呼吸が整う。'],
          fresh: ['部屋の空気ごと、整える香り。', '毎日使いたくなる、余白のある道具。'],
        }[tone]
      : {
          luxury: ['肌に残るのは、静かな艶だけ。', '華美さを抑えた、上質なひととき。'],
          young: ['仕事も、休日も、自分のペースで。', '軽やかな質感で、今日を好きになる。'],
          cute: ['ていねいに、肌へ。', 'やわらかな香りが、微笑みに残る。'],
          natural: ['余分を足さず、肌の調子に寄り添う。', '手に取るたびに、呼吸が整う。'],
          fresh: ['毎日に、そっと寄り添う美しさ。', 'いちばんやさしいかたちで。'],
        }[tone])
  }
  if (path === '/hero/cta') return tone === 'luxury' ? 'DETAILS' : '詳しく見る'
  if (path === '/brand/tagline') {
    const lines = goods
      ? {
          luxury: ['余白のある、大人の暮らし。', '静かな香りを、部屋に。'],
          young: ['自分らしい部屋で、暮らす。', '毎日のリズムを、整える。'],
          cute: ['小さな道具で、やさしく暮らす。', '香りと光のある部屋に。'],
          natural: ['肌にも、暮らしにも、余白を。', '余分を削ぎ、本質を残す。'],
          fresh: ['暮らしに、小さな余白を。', '部屋の空気ごと、整える。'],
        }[tone]
      : {
          luxury: ['余白のある、大人の美しさ。', '静かな光を、肌に。'],
          young: ['わたしらしい、いちばんきれいを。', '今日の私で、輝く。'],
          cute: ['かわいく、やさしく、私らしく。', '“かわいい”に恋するすべてのひとに。'],
          natural: ['毎日に、そっと寄り添う。', 'ていねいに、自然体で。'],
          fresh: ['肌に、花ひらく光を。', '光をまとう、毎日を。'],
        }[tone]
    return shorter ? (lines[0] ?? current) : pick(current, lines)
  }
  if (path === '/brand/description') return restyleDescription(brand, tone, goods)
  if (path === '/brand/name' || path.startsWith('/legal/')) return current
  if (path.includes('/products/') && path.endsWith('/name')) return current
  if (path === '/announcementExtra') {
    return pick(current, goods
      ? {
          luxury: ['上質な定番、取り揃えています'],
          young: ['新作アイテム、続々入荷中'],
          cute: ['小さな暮らしの道具、好評です'],
          natural: ['植物由来のデイリーケア、好評発売中'],
          fresh: ['暮らしの道具と、静かな香り'],
        }[tone]
      : {
          luxury: ['上質な限定コレクション、好評発売中'],
          young: ['新作アイテム、続々入荷中'],
          cute: ['限定コフレ好評発売中'],
          natural: ['毎日使える定番、取り揃えています'],
          fresh: ['新作アイテム、続々入荷中'],
        }[tone])
  }
  if (path.includes('/products/') && path.endsWith('/usage')) {
    return goods
      ? {
          luxury: '手のひらで温めてから、肌や髪になじませてください。',
          young: '朝晩のケアに、適量をなじませてお使いください。',
          cute: '好きなときに、やさしくなじませてお使いください。',
          natural: '必要な量だけ手に取り、なじませてお使いください。',
          fresh: '清潔な手で適量を取り、なじませてお使いください。',
        }[tone]
      : {
          luxury: '指先にとり、肌の上でゆっくりなじませてください。',
          young: 'メイクの仕上げに、適量をなじませてお使いください。',
          cute: '好きなところに、そっと重ねてお使いください。',
          natural: '清潔な肌に適量をとり、なじませてお使いください。',
          fresh: '朝晩のスキンケアのあとに、なじませてお使いください。',
        }[tone]
  }
  if (path.includes('/products/') && path.endsWith('/ingredients')) {
    return specificIngredients({ name: brand, category: goods ? 'fragrance' : 'skincare', categoryJa: '' })
  }
  if (path.includes('/products/') && path.endsWith('/description')) {
    return goods
      ? {
          luxury: '余白と素材感を大切にした一品。部屋に置いただけで、空気が整います。',
          young: '毎日のルーティンに、すっと溶け込む使い心地。自分らしい暮らしの相棒です。',
          cute: 'やさしい香りと、手になじむかたち。小さな幸せが残る道具です。',
          natural: '余分なものを足さず、暮らしの調子に寄り添う処方です。',
          fresh: '手に取るたびに、部屋の空気がすこし整う一品です。',
        }[tone]
      : {
          luxury: '余白と質感を大切にした、静かな輝き。肌に残るのは、やわらかな艶だけです。',
          young: '軽やかな使い心地で、自分らしさがすっと咲く一品。仕事も休日も、手元に置きたくなる。',
          cute: 'かわいくて、やさしい使い心地。指先までときめく、毎日の相棒です。',
          natural: '余分なものを足さず、肌と暮らしの調子に寄り添う処方です。',
          fresh: '毎日のルーティンに、そっと溶け込みます。手に取るたびに、気分が整う一品。',
        }[tone]
  }
  if (path === '/instagram/kicker') return 'INSTAGRAM'
  if (path === '/instagram/handle') return current.replace(/^@/, '') || brand.replaceAll(/\s+/g, '').toLowerCase()
  if (path === '/instagram/caption') {
    return pick(current, goods
      ? ['暮らしの一瞬を、そっとお届けします。', '部屋の空気ごと、毎日を残します。']
      : ['花と光の毎日を、そっとお届けします。', 'かわいくて、やさしい日々を。'])
  }
  if (path.includes('/news/')) {
    return pick(current, {
      luxury: ['限定コレクションを発売しました'],
      young: ['新作をオンラインで公開しました'],
      cute: goods ? ['小さな新作を入荷しました'] : ['限定コフレを発売しました'],
      natural: ['定番アイテムを入荷しました'],
      fresh: ['公式オンラインショップを更新しました'],
    }[tone])
  }
  return restyleDescription(brand, tone, goods)
}

function restyleDescription(brand: string, tone: Tone, goods: boolean): string {
  if (goods) {
    if (tone === 'luxury') {
      return `${brand}は、余白と素材感を大切にする暮らしのブランドです。主張しすぎない色と香りで、部屋を上質に整えます。`
    }
    if (tone === 'cute') {
      return `${brand}は、やさしい暮らしが好きな人のためのブランドです。小さな道具と柔らかい香りで、毎日を心地よくします。`
    }
    if (tone === 'young') {
      return `${brand}は、自分らしい部屋をつくりたい人のためのブランドです。使いやすいアイテムで、仕事も休日も整います。`
    }
    if (tone === 'natural') {
      return `${brand}は、余分を削ぎ、本質を残します。処方は短く、香りは控えめで、手に馴染むかたちだけを残しました。`
    }
    return `${brand}は、スキンケアと暮らしの香りをひとつのラインで考えるブランドです。毎日の調子に、そっと寄り添います。`
  }
  if (tone === 'luxury') {
    return `${brand}は、余白と素材感を大切にするブランドです。光を抑えた色と、ていねいな質感で、日常を上質に彩ります。`
  }
  if (tone === 'cute') {
    return `${brand}は、かわいいが好きな人のためのブランドです。やわらかな色と甘い香りで、指先までときめく毎日をお届けします。`
  }
  if (tone === 'young') {
    return `${brand}は、自分らしさを楽しみたい女性のためのブランドです。軽やかな質感と、ときめく色で、仕事も休日ももっと好きになれるアイテムをお届けします。`
  }
  if (tone === 'natural') {
    return `${brand}は、毎日の調子にそっと寄り添います。余分を足さず、手に取るたびに呼吸が整うような、自然体のプロダクトです。`
  }
  return `${brand}は、毎日に寄り添うブランドです。ていねいな処方と、使いやすいデザインで、肌と気持ちを整えます。`
}

function alternate(current: string, path: string, tone: Tone, brand: string, goods: boolean): string {
  const swapped: Tone = tone === 'fresh' ? 'natural' : 'fresh'
  return copyFor(path, swapped, brand, current, false, goods)
}

const LEGAL_EDIT_PATTERNS: { path: string; pattern: RegExp }[] = [
  { path: '/legal/seller', pattern: /(?:事業者名|販売業者|会社名)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/ },
  { path: '/legal/representative', pattern: /(?:運営統括責任者|代表者名|代表者)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/ },
  { path: '/legal/address', pattern: /(?:所在地|住所)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/ },
  { path: '/legal/phone', pattern: /(?:電話番号|電話)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/ },
  { path: '/legal/email', pattern: /(?:メールアドレス|メール)[をは]\s*[「『"]?(.+?)[」』"]?\s*(?:にして|に変更|にする|です|。|$)/ },
]

function legalEdits(message: string): SiteOperation[] {
  return LEGAL_EDIT_PATTERNS.flatMap(({ path, pattern }) => {
    const matched = message.match(pattern)
    const value = matched?.[1] ? clean(matched[1]) : ''
    if (!value) return []
    return [{ op: 'replace' as const, path, value }]
  })
}

function applyLegalSelection(message: string, target: SelectionTarget): { operations: SiteOperation[]; notes: string[] } {
  const operations = legalEdits(message)
  if (!operations.some((item) => item.path === target.path)) {
    const quoted = message.match(/[「『"]([^」』"]+)[」』"]/)
    const instruction = /(して|変更|書いて|更新|整え)/.test(message)
    const bare = quoted?.[1] ? clean(quoted[1]) : instruction ? '' : clean(message)
    if (bare && bare !== target.currentText.trim()) {
      operations.push({ op: 'replace', path: target.path, value: bare })
    }
  }
  if (!operations.length) return { operations: [], notes: [] }
  return { operations, notes: ['事業者情報を更新しました。'] }
}

function extractBrandRename(message: string): string | null {
  const matched = message.match(
    /(?:ブランド名|店名|名前)[をは]\s*[「『"]?([^「」『』"\n]+?)[」』"]?\s*(?:にして|に変更|にする)/,
  )
  const name = matched?.[1] ? clean(matched[1]) : ''
  return name || null
}

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
}

function clean(value: string): string {
  return value
    .replace(/(してください|して|に変更|です)$/g, '')
    .replaceAll(/[「」『』"]/g, '')
    .trim()
}
