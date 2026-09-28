import type { CSSProperties, FormEvent, MouseEvent } from 'react'
import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SiteData, SiteProduct } from '../../../types/site'
import './commerce.css'

export const CART_SHIPPING_FEE = 550

export interface CartItem {
  productId: string
  quantity: number
}

export interface OrderReceipt {
  name: string
  email: string
  zip: string
  address: string
  shipping: number
  subtotal: number
  total: number
  lines: { name: string; quantity: number; price: number }[]
}

function cartStorageKey(siteId: string) {
  return `ec-builder-cart-v1:${siteId}`
}

export function readCart(siteId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(cartStorageKey(siteId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as CartItem
        if (typeof row.productId !== 'string' || typeof row.quantity !== 'number') return null
        const quantity = Math.max(1, Math.round(row.quantity))
        return { productId: row.productId, quantity }
      })
      .filter((item): item is CartItem => Boolean(item))
  } catch {
    return []
  }
}

export function writeCart(siteId: string, items: CartItem[]) {
  localStorage.setItem(cartStorageKey(siteId), JSON.stringify(items))
}

export function addCartItem(items: CartItem[], productId: string, quantity: number): CartItem[] {
  const qty = Math.max(1, Math.round(quantity))
  const existing = items.find((item) => item.productId === productId)
  if (existing) {
    return items.map((item) =>
      item.productId === productId ? { ...item, quantity: item.quantity + qty } : item,
    )
  }
  return [...items, { productId, quantity: qty }]
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity < 1) return items.filter((item) => item.productId !== productId)
  return items.map((item) => (item.productId === productId ? { ...item, quantity } : item))
}

export function yen(amount: number) {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function cartLines(site: SiteData, items: CartItem[]) {
  return items
    .map((item) => {
      const product = site.products.find((row) => row.id === item.productId)
      if (!product) return null
      return { ...item, product }
    })
    .filter((item): item is CartItem & { product: SiteProduct } => Boolean(item))
}

export function cartTotals(site: SiteData, items: CartItem[]) {
  const lines = cartLines(site, items)
  const subtotal = lines.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const threshold = Math.max(0, site.freeShippingThreshold ?? 8000)
  const remaining = Math.max(0, threshold - subtotal)
  const shipping = subtotal > 0 && remaining === 0 ? 0 : subtotal > 0 ? CART_SHIPPING_FEE : 0
  return { lines, subtotal, remaining, shipping, total: subtotal + shipping, count: lines.reduce((sum, item) => sum + item.quantity, 0) }
}

export function CartDrawer({
  site,
  items,
  open,
  onClose,
  onQuantity,
  onRemove,
  onShop,
  onCheckout,
  themeStyle,
}: {
  site: SiteData
  items: CartItem[]
  open: boolean
  onClose: () => void
  onQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onShop: (event: MouseEvent) => void
  onCheckout: () => void
  themeStyle?: CSSProperties
}) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    setHost(document.getElementById('ec-builder-preview-stage'))
  }, [])
  const { lines, subtotal, remaining, count } = cartTotals(site, items)
  const progress = site.freeShippingThreshold > 0 ? Math.min(100, (subtotal / site.freeShippingThreshold) * 100) : 100

  const ui = (
    <div className={`sf-cart-portal ${open ? 'is-open' : ''}`} style={themeStyle} onClick={(event) => event.stopPropagation()}>
      <div
        className={`sf-overlay ${open ? 'is-open' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      />
      <aside className={`sf-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} onClick={(event) => event.stopPropagation()}>
        <header className="sf-drawer__head">
          <p>CART{count > 0 ? ` (${count})` : ''}</p>
          <button type="button" aria-label="閉じる" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="sf-ship">
          {subtotal > 0 && remaining === 0 ? (
            <p>送料無料です</p>
          ) : (
            <p>あと {yen(remaining)} で送料無料</p>
          )}
          <div className="sf-ship__bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        {lines.length === 0 ? (
          <div className="sf-cart-empty">
            <p>カートは空です。</p>
            <button type="button" className="sf-pdp__buy-now" onClick={onShop}>
              買い物を続ける
            </button>
          </div>
        ) : (
          <div className="sf-cart-lines">
            {lines.map((item) => (
              <article key={item.productId} className="sf-cart-line">
                {item.product.image ? <img src={item.product.image} alt="" /> : <div className="sf-card__fallback" />}
                <div>
                  <h3>{item.product.name.trim() || '新しい商品'}</h3>
                  <p>{yen(item.product.price)}</p>
                  <div className="sf-pdp__qty">
                    <button type="button" onClick={() => onQuantity(item.productId, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onQuantity(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button type="button" className="sf-pdp__link" onClick={() => onRemove(item.productId)}>
                    削除
                  </button>
                </div>
                <strong>{yen(item.product.price * item.quantity)}</strong>
              </article>
            ))}
          </div>
        )}
        <div className="sf-cart-foot">
          <div className="sf-cart-foot__row">
            <span>小計</span>
            <strong>{yen(subtotal)}</strong>
          </div>
          <p>送料はチェックアウト時に計算されます。</p>
          <button type="button" className="sf-pdp__buy-now" disabled={lines.length === 0} onClick={onCheckout}>
            CHECKOUT
          </button>
        </div>
      </aside>
    </div>
  )

  if (!host) return null
  return createPortal(ui, host)
}

export function CheckoutView({
  site,
  items,
  onQuantity,
  onRemove,
  onShop,
  onSubmit,
}: {
  site: SiteData
  items: CartItem[]
  onQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onShop: (event: MouseEvent) => void
  onSubmit: (receipt: OrderReceipt) => void
}) {
  const { lines, subtotal, shipping, total } = cartTotals(site, items)

  if (lines.length === 0) {
    return (
      <section className="sf-checkout">
        <p className="sf-kicker">CHECKOUT</p>
        <h1>カートが空です</h1>
        <button type="button" className="sf-pdp__buy-now" onClick={onShop}>
          買い物を続ける
        </button>
      </section>
    )
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const zip = String(form.get('zip') ?? '').trim()
    const address = String(form.get('address') ?? '').trim()
    if (!name || !email || !zip || !address) return
    onSubmit({
      name,
      email,
      zip,
      address,
      shipping,
      subtotal,
      total,
      lines: lines.map((item) => ({
        name: item.product.name.trim() || '新しい商品',
        quantity: item.quantity,
        price: item.product.price,
      })),
    })
  }

  return (
    <section className="sf-checkout" onClick={(event) => event.stopPropagation()}>
      <header>
        <p className="sf-kicker">CHECKOUT</p>
        <h1>ご購入手続き</h1>
        <p className="sf-checkout__note">プレビュー用の購入画面です。実際の決済は行われません。</p>
      </header>
      <div className="sf-checkout__layout">
        <form className="sf-checkout__form" onSubmit={submit}>
          <h2>お届け先</h2>
          <label>
            お名前
            <input required name="name" autoComplete="name" />
          </label>
          <label>
            メールアドレス
            <input required type="email" name="email" autoComplete="email" />
          </label>
          <label>
            郵便番号
            <input required name="zip" placeholder="150-0001" autoComplete="postal-code" />
          </label>
          <label>
            住所
            <input required name="address" placeholder="東京都渋谷区..." autoComplete="street-address" />
          </label>
          <h2>お支払い</h2>
          <p className="sf-checkout__note">カード決済は未接続です。内容を確認して注文を確定できます。</p>
          <button type="submit" className="sf-pdp__buy-now">
            {yen(total)} で注文を確定
          </button>
        </form>
        <aside className="sf-checkout__summary">
          <h2>注文内容</h2>
          {lines.map((item) => (
            <article key={item.productId} className="sf-cart-line">
              {item.product.image ? <img src={item.product.image} alt="" /> : <div className="sf-card__fallback" />}
              <div>
                <p>{item.product.name.trim() || '新しい商品'}</p>
                <div className="sf-pdp__qty">
                  <button type="button" onClick={() => onQuantity(item.productId, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onQuantity(item.productId, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className="sf-pdp__link" onClick={() => onRemove(item.productId)}>
                  削除
                </button>
              </div>
              <strong>{yen(item.product.price * item.quantity)}</strong>
            </article>
          ))}
          <p>
            小計 {yen(subtotal)} ／ 送料 {shipping === 0 ? '無料' : yen(shipping)}
          </p>
          <p className="sf-checkout__total">合計 {yen(total)}</p>
        </aside>
      </div>
    </section>
  )
}

export function OrderDoneView({
  receipt,
  onShop,
}: {
  receipt: OrderReceipt
  onShop: (event: MouseEvent) => void
}) {
  return (
    <section className="sf-checkout sf-checkout--done">
      <p className="sf-kicker">CHECKOUT</p>
      <h1>ご注文ありがとうございました</h1>
      <p>
        {receipt.name} 様（{receipt.email}）の注文を受け付けました。お支払い金額は {yen(receipt.total)}{' '}
        です。プレビューのためメール送信・決済は行われていません。
      </p>
      <ul>
        {receipt.lines.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {item.name} × {item.quantity}（{yen(item.price * item.quantity)}）
          </li>
        ))}
      </ul>
      <button type="button" className="sf-pdp__buy-now" onClick={onShop}>
        ショップへ戻る
      </button>
    </section>
  )
}
