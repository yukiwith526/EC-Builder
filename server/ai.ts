import { AI_ERRORS, MAX_AI_MESSAGE_CHARS } from './guard.ts'

export interface AiRequestBody {
  message?: string
  site?: unknown
  selectedElement?: string
  selectedLabel?: string
  selectedPath?: string
  currentText?: string
  productCopy?: { description?: string; usage?: string; ingredients?: string } | null
}

export async function handleAiRequest(
  body: AiRequestBody,
  apiKey: string | undefined,
): Promise<{ status: number; payload: Record<string, unknown> }> {
  if (!apiKey) {
    return { status: 501, payload: { error: 'OPENAI_API_KEY is not set' } }
  }
  if (!body.site) {
    return { status: 400, payload: { error: 'site is required' } }
  }
  if (typeof body.message === 'string' && body.message.length > MAX_AI_MESSAGE_CHARS) {
    return { status: 400, payload: { error: AI_ERRORS.longMessage } }
  }

  const site = compactSite(body.site)
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(site) },
        {
          role: 'user',
          content: JSON.stringify({
            instruction: body.message ?? '',
            selected: body.selectedPath
              ? {
                  id: body.selectedElement ?? null,
                  label: body.selectedLabel ?? null,
                  path: body.selectedPath,
                  currentText: body.currentText ?? '',
                  productCopy: body.productCopy ?? null,
                }
              : null,
            legal: legalSchema(site),
            site,
          }),
        },
      ],
    }),
  })

  if (!completion.ok) {
    return { status: 502, payload: { error: 'AIの処理に失敗しました。しばらくしてからもう一度送ってください。' } }
  }

  const data = (await completion.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    return { status: 502, payload: { error: 'Empty OpenAI response' } }
  }
  const parsed = parseAiPayload(content)
  return {
    status: 200,
    payload: {
      reply: parsed.reply || '選択中の要素を更新しました。',
      text: parsed.text ?? parsed.value ?? '',
      operations: parsed.operations ?? [],
    },
  }
}

function systemPrompt(site: unknown) {
  const templateId =
    site && typeof site === 'object' && 'templateId' in site && typeof site.templateId === 'string'
      ? site.templateId
      : ''
  const goods = templateId === 'goods'
  const voice = goods
    ? `- This is a quiet Japanese lifestyle / home-goods shop, not cosmetics.
- Copy should feel like home scent, objects, and daily rituals. Avoid かわいい, コスメ, 美容液, 肌に, Glow Serum, LUMINA unless the current site text already uses them.
- Brand example: KUMO. Product examples: Room Fragrance, Soy Candle.`
    : `- This is a Japanese cosmetics EC site.
- Brand example: LUMINA. Product examples: Glow Serum.`
  return `You edit an EC site.
Return JSON only: {"reply": string, "text": string, "operations": [{"op":"replace"|"add"|"remove","path":string,"value":unknown}]}.
Rules:
- instruction is the user prompt.
${voice}
- Match the existing site's categories and tone. Do not force a cosmetics catalog onto a lifestyle store.
- If selected is set, change ONLY selected.path, except product copy and legal fields:
  /products/{id}/description (商品説明), /products/{id}/usage (使い方・特長), /products/{id}/ingredients (成分).
  /legal/seller (事業者名・販売業者), /legal/representative (運営統括責任者), /legal/address (所在地), /legal/phone (電話番号), /legal/email (メールアドレス).
- "legal" in the user message is structured merchant data for 特定商取引法に基づく表記 and プライバシーポリシー. Each key has label, path, and value. To change a fact, emit op=replace with that path and the new string. One field per operation.
- If the user states several legal facts in one message, update every matching /legal/* field even when one legal field is selected. Do not put a whole paragraph into a single field.
- Do not invent a company name, address, phone, or email. Write only facts the user gave, or a light rewrite of the selected field's current value.
- For a selected product, if the user says 書いて / 作成して / 商品説明 / 使い方 / 成分, write real Japanese copy for the requested fields. If they do not name a field, write all three.
- selected.productCopy has the current description, usage, and ingredients. Do not copy placeholder lines like 全成分は商品パッケージをご確認ください unless the user asked to keep them.
- Do not edit title when subtitle is selected, and do not edit subtitle when title is selected.
- /hero/kicker, /hero/title, /hero/subtitle, /hero/cta are different fields.
- /brand/tagline and /brand/description are different fields.
- For the announcement bar use /announcementExtra, not /announcement.
- Put the rewritten copy in "text" AND in operations as op=replace path=selected.path value=the new copy.
- "reply" is a short Japanese confirmation only. Never write reply into the site.
- Put rewritten copy in "text" and in operations.value. Those must be real website copy, not sentences like 「〜しました」.
- When writing product description/usage/ingredients, emit one replace operation per field.
- If setupStep is "products", the user is adding catalog items. Prefer op=add path=/products/- with full copy. They may also ask to write description/usage/ingredients for the last product.
- If the user asks to add a product, use op=add path=/products/- even when a product or product list is selected. The value must include name, price, description, usage, and ingredients.
- If nothing is selected and the user asks to write 商品説明 / 使い方 / 成分, find products by name or category (フレグランス → fragrance, Room Fragrance) and replace those fields. Never return an empty operations list or a help message in that case.
- For 成分, write a concrete comma-separated ingredient list. Do not use 「全成分は商品パッケージをご確認ください」.
- Never return empty operations when the user asked to change copy.
- Never rewrite React. Never mention Stripe/auth/payment.
- Product images must stay empty unless the user provided a URL. Design images may use /brand/hero.png or /brand/rose.png.
Allowed paths: /brand/name, /brand/tagline, /brand/description, /brand/concept, /brand/image, /hero/kicker, /hero/title, /hero/subtitle, /hero/cta, /hero/image, /hero/images, /instagram/kicker, /instagram/handle, /instagram/caption, /theme/backgroundColor, /theme/inkColor, /theme/accentColor, /theme/paperColor, /legal/seller, /legal/representative, /legal/address, /legal/phone, /legal/email, /announcement, /announcementVisible, /freeShippingThreshold, /announcementExtra, /products/-, /products/{id}/name, /products/{id}/price, /products/{id}/description, /products/{id}/usage, /products/{id}/ingredients, /products/{id}/image, /products/{id}/category, /products/{id}/categoryJa, /pickupIds, /categories, /news/{index}/title, /news/{index}/date, /sections
Write polished Japanese.`
}

function compactSite(site: unknown) {
  if (!site || typeof site !== 'object') return site
  const raw = site as {
    templateId?: unknown
    brand?: unknown
    hero?: unknown
    theme?: unknown
    announcement?: unknown
    announcementVisible?: unknown
    freeShippingThreshold?: unknown
    announcementExtra?: unknown
    instagram?: unknown
    legal?: unknown
    categories?: unknown
    sections?: unknown
    setupStep?: unknown
    products?: { id?: string; name?: string; price?: number; description?: string; usage?: string; ingredients?: string; category?: string; categoryJa?: string; image?: string }[]
    news?: unknown
  }
  return {
    templateId: typeof raw.templateId === 'string' ? raw.templateId : undefined,
    setupStep: typeof raw.setupStep === 'string' ? raw.setupStep : undefined,
    brand: raw.brand,
    hero: raw.hero,
    theme: raw.theme,
    announcement: raw.announcement,
    announcementVisible: raw.announcementVisible,
    freeShippingThreshold: raw.freeShippingThreshold,
    announcementExtra: raw.announcementExtra,
    instagram: raw.instagram,
    legal: plainLegal(raw.legal),
    categories: raw.categories,
    sections: raw.sections,
    news: raw.news,
    products: Array.isArray(raw.products)
      ? raw.products.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          usage: product.usage,
          ingredients: product.ingredients,
          category: product.category,
          categoryJa: product.categoryJa,
          image: typeof product.image === 'string' && product.image.startsWith('data:') ? '[uploaded-image]' : product.image ?? '',
        }))
      : [],
  }
}

function plainLegal(value: unknown) {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const text = (key: string) => (typeof raw[key] === 'string' ? raw[key] : '')
  return {
    seller: text('seller'),
    representative: text('representative'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
  }
}

function legalSchema(site: unknown) {
  const legal = plainLegal(site && typeof site === 'object' && 'legal' in site ? site.legal : undefined)
  return {
    seller: { label: '事業者名・販売業者', path: '/legal/seller', value: legal.seller },
    representative: { label: '運営統括責任者', path: '/legal/representative', value: legal.representative },
    address: { label: '所在地', path: '/legal/address', value: legal.address },
    phone: { label: '電話番号', path: '/legal/phone', value: legal.phone },
    email: { label: 'メールアドレス', path: '/legal/email', value: legal.email },
  }
}

function parseAiPayload(content: string): { reply?: string; operations?: unknown; text?: string; value?: string } {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(trimmed) as { reply?: string; operations?: unknown; text?: string; value?: string }
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as {
        reply?: string
        operations?: unknown
        text?: string
        value?: string
      }
    }
    throw new Error('Invalid AI JSON')
  }
}
