import type { CSSProperties, MouseEvent } from 'react'
import { useEffect, useState } from 'react'
import { DEFAULT_SECTIONS, namedCategories, type SectionId, type Selection, type SiteData, type SiteProduct } from '../../../types/site'
import { addNews, addProduct, removeNews, showSection } from '../../../site/update'
import { Selectable } from '../../../builder/Selectable'
import { HeroSlider } from './HeroSlider'
import { InstagramSection } from './InstagramSection'
import { PickupCarousel } from './PickupCarousel'
import { ProductCopyAccordions } from './ProductCopyAccordions'
import { ProductGallery } from './ProductGallery'
import {
  addCartItem,
  CartDrawer,
  CheckoutView,
  OrderDoneView,
  readCart,
  setCartQuantity,
  writeCart,
  yen,
  type CartItem,
  type OrderReceipt,
} from './commerce'
import { isLegalPage, LegalPage, StorefrontFooter, type LegalPageId } from './LegalPages'
import './lifestyle.css'

interface Props {
  site: SiteData
  selection: Selection | null
  interactive?: boolean
  browse?: boolean
  onSelect: (selection: Selection | null) => void
  onChange?: (site: SiteData) => void
}

export function LifestyleStorefront({ site, selection, interactive = true, browse = false, onSelect, onChange }: Props) {
  const [page, setPage] = useState<'home' | 'shop' | 'brand' | 'product' | 'checkout' | 'done' | LegalPageId>('home')
  const [category, setCategory] = useState<string>('all')
  const [productId, setProductId] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => readCart(site.id))
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    setCart(readCart(site.id))
  }, [site.id])

  useEffect(() => {
    writeCart(site.id, cart)
  }, [site.id, cart])

  const addToCart = (id: string, quantity: number) => setCart((current) => addCartItem(current, id, quantity))
  const categories = site.categories?.length ? site.categories : []
  const activeCategory = category === 'all' || categories.some((item) => item.id === category) ? category : 'all'
  const editing = interactive && !browse
  const locked = !editing
  const themeStyle = {
    '--sf-bg': site.theme.backgroundColor,
    '--sf-ink': site.theme.inkColor,
    '--sf-accent': site.theme.accentColor,
    '--sf-paper': site.theme.paperColor,
  } as CSSProperties

  const sections = site.sections?.length ? site.sections : DEFAULT_SECTIONS
  const openShop = (event: MouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    setPage('shop')
    setCategory(id)
    setProductId(null)
    if (editing) onSelect({ type: 'products' })
  }
  const openHome = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setPage('home')
    setCategory('all')
    setProductId(null)
  }
  const openBrand = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setPage('brand')
    setCategory('all')
    setProductId(null)
  }
  const openProduct = (event: MouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    setPage('product')
    setProductId(id)
    if (editing) onSelect({ type: 'product', id })
  }
  const openCart = (event?: MouseEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    setCartOpen(true)
  }
  const closeCart = () => setCartOpen(false)
  const openCheckout = (event?: MouseEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    setCartOpen(false)
    setPage('checkout')
    setProductId(null)
  }
  const openLegal = (event: MouseEvent, id: LegalPageId) => {
    event.preventDefault()
    event.stopPropagation()
    setCartOpen(false)
    setPage(id)
    setProductId(null)
  }
  const changeQty = (id: string, quantity: number) => setCart((current) => setCartQuantity(current, id, quantity))
  const removeLine = (id: string) => setCart((current) => current.filter((item) => item.productId !== id))

  return (
    <div className={`storefront storefront--lifestyle ${locked ? 'is-locked' : ''} ${browse ? 'is-browse' : ''}`} style={themeStyle} onClick={() => onSelect(null)}>
      <CartDrawer
          site={site}
          items={cart}
          open={cartOpen}
          onClose={closeCart}
          onQuantity={changeQty}
          onRemove={removeLine}
          themeStyle={themeStyle}
          onShop={(event) => {
            closeCart()
            openShop(event, 'all')
          }}
          onCheckout={() => openCheckout()}
        />
      {site.announcementVisible !== false ? (
        <Selectable
          disabled={locked}
          active={selection?.type === 'announcement'}
          onSelect={() => onSelect({ type: 'announcement' })}
        >
          <div className="sf-announce">
            <p>{site.announcement}</p>
          </div>
        </Selectable>
      ) : !locked ? (
        <Selectable
          disabled={locked}
          active={selection?.type === 'announcement'}
          onSelect={() => onSelect({ type: 'announcement' })}
        >
          <div className="sf-announce is-hidden">
            <p>お知らせバー（非表示）</p>
          </div>
        </Selectable>
      ) : null}

      <header className="sf-header">
        <div className="sf-header__inner">
          <span className="sf-icon">☰</span>
          <Selectable
            disabled={locked}
            active={selection?.type === 'brand.name'}
            onSelect={() => onSelect({ type: 'brand.name' })}
          >
            <button type="button" className="sf-logo" onClick={openHome}>
              {site.brand.name}
            </button>
          </Selectable>
          <button type="button" className="sf-icon sf-icon--bag" aria-label="カート" onClick={openCart}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6.5 8h11l.8 11.2a1.5 1.5 0 0 1-1.5 1.6H7.2a1.5 1.5 0 0 1-1.5-1.6L6.5 8Z" />
              <path d="M9 8V7.2A3 3 0 0 1 12 4a3 3 0 0 1 3 3.2V8" strokeLinecap="round" />
            </svg>
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
        </div>
        <nav className="sf-nav">
          {namedCategories(categories).map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === 'shop' && activeCategory === item.id ? 'is-on' : ''}
              onClick={(event) => openShop(event, item.id)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className={page === 'brand' ? 'is-on' : ''} onClick={openBrand}>
            ブランド
          </button>
        </nav>
      </header>

      {isLegalPage(page) ? (
        <LegalPage site={site} page={page} locked={locked} selection={selection} onSelect={onSelect} onOpen={openLegal} />
      ) : page === 'checkout' ? (
        <CheckoutView
          site={site}
          items={cart}
          onQuantity={changeQty}
          onRemove={removeLine}
          onShop={(event) => openShop(event, 'all')}
          onSubmit={(next) => {
            setReceipt(next)
            setCart([])
            setPage('done')
          }}
        />
      ) : page === 'done' ? (
        <OrderDoneView receipt={receipt ?? { name: '', email: '', zip: '', address: '', shipping: 0, subtotal: 0, total: 0, lines: [] }} onShop={(event) => openShop(event, 'all')} />
      ) : page === 'shop' ? (
        <ShopView
          site={site}
          selection={selection}
          locked={locked}
          category={activeCategory}
          categories={categories}
          onSelect={onSelect}
          onFilter={openShop}
          onOpen={openProduct}
          onChange={onChange}
        />
      ) : page === 'brand' ? (
        <BrandView site={site} selection={selection} locked={locked} onSelect={onSelect} />
      ) : page === 'product' ? (
        <ProductView
          key={productId ?? 'missing'}
          site={site}
          productId={productId}
          selection={selection}
          locked={locked}
          onSelect={onSelect}
          onOpen={openProduct}
          onShop={openShop}
          onHome={openHome}
          onAdd={(id, quantity, buyNow) => {
            addToCart(id, quantity)
            if (buyNow) openCheckout()
            else setCartOpen(true)
          }}
        />
      ) : (
        <>
          {sections.map((id) => (
            <Section
              key={id}
              id={id}
              site={site}
              selection={selection}
              locked={locked}
              category={activeCategory}
              onSelect={onSelect}
              onChange={onChange}
              onOpen={openProduct}
              onFilter={(event, id) => {
                event.preventDefault()
                event.stopPropagation()
                setPage('home')
                setCategory(id)
                setProductId(null)
              }}
            />
          ))}
          {!locked && onChange && !sections.includes('instagram') && (
            <button
              type="button"
              className="sf-add-product"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onChange(showSection(site, 'instagram'))
                onSelect({ type: 'instagram' })
              }}
            >
              Instagramを追加
            </button>
          )}
        </>
      )}

      <StorefrontFooter
        site={site}
        page={page}
        locked={locked}
        selected={selection?.type === 'footer'}
        onSelect={() => onSelect({ type: 'footer' })}
        onOpen={openLegal}
      />
    </div>
  )
}

function ProductView({
  site,
  productId,
  selection,
  locked,
  onSelect,
  onOpen,
  onShop,
  onHome,
  onAdd,
}: {
  site: SiteData
  productId: string | null
  selection: Selection | null
  locked: boolean
  onSelect: (selection: Selection | null) => void
  onOpen: (event: MouseEvent, id: string) => void
  onShop: (event: MouseEvent, id: string) => void
  onHome: (event: MouseEvent) => void
  onAdd: (id: string, quantity: number, buyNow: boolean) => void
}) {
  const [qty, setQty] = useState(1)
  const [wished, setWished] = useState(false)
  const product = site.products.find((item) => item.id === productId)

  if (!product) {
    return (
      <section className="sf-pdp">
        <p>商品が見つかりません。</p>
        <button type="button" className="sf-pdp__link" onClick={(event) => onShop(event, 'all')}>
          ショップへ戻る
        </button>
      </section>
    )
  }

  const related = site.products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4)

  return (
    <section className="sf-pdp">
      <p className="sf-pdp__crumb">
        <button type="button" onClick={onHome}>
          Home
        </button>
        {' / '}
        <button type="button" onClick={(event) => onShop(event, product.category)}>
          {product.categoryJa}
        </button>
        {' / '}
        {product.name}
      </p>
      <div className="sf-pdp__layout">
        <ProductGallery
          product={product}
          locked={locked}
          selection={selection}
          onSelect={() => onSelect({ type: 'product.image', id: product.id })}
        />
        <div className="sf-pdp__buy">
          <p className="sf-kicker">{product.categoryJa}</p>
          <Selectable
            disabled={locked}
            active={selection?.type === 'product' && selection.id === product.id}
            onSelect={() => onSelect({ type: 'product', id: product.id })}
          >
            <h1>{product.name.trim() || '新しい商品'}</h1>
            <p className="sf-pdp__ja">{product.categoryJa}</p>
            <p className="sf-pdp__price">¥{product.price.toLocaleString('ja-JP')}</p>
          </Selectable>
          <div className="sf-pdp__qty" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((value) => value + 1)}>
              +
            </button>
          </div>
          <button
            type="button"
            className="sf-pdp__cart"
            onClick={(event) => {
              event.stopPropagation()
              onAdd(product.id, qty, false)
            }}
          >
            ADD TO CART + {yen(product.price * qty)}
          </button>
          <button
            type="button"
            className="sf-pdp__buy-now"
            onClick={(event) => {
              event.stopPropagation()
              onAdd(product.id, qty, true)
            }}
          >
            BUY IT NOW
          </button>
          <button
            type="button"
            className={`sf-pdp__wish ${wished ? 'is-on' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              setWished((value) => !value)
            }}
          >
            <svg viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z" />
            </svg>
            お気に入りに追加
          </button>
          <ProductCopyAccordions
            product={product}
            locked={locked}
            selection={selection}
            onSelect={onSelect}
          />
        </div>
      </div>
      {related.length > 0 && (
        <section className="sf-pdp__related">
          <header>
            <p className="sf-kicker">YOU MAY ALSO LIKE</p>
            <h2>関連商品</h2>
          </header>
          <ProductGrid products={related} selection={selection} locked={locked} onSelect={onSelect} onOpen={onOpen} />
        </section>
      )}
    </section>
  )
}

function BrandView({
  site,
  selection,
  locked,
  onSelect,
}: {
  site: SiteData
  selection: Selection | null
  locked: boolean
  onSelect: (selection: Selection | null) => void
}) {
  const image = site.hero.image || site.brand.image
  return (
    <section className="sf-brand">
      <Selectable
        className="selectable--media"
        disabled={locked}
        active={selection?.type === 'hero.image'}
        onSelect={() => onSelect({ type: 'hero.image' })}
      >
        {image ? <img src={image} alt="" /> : <div className="sf-brand__fallback" />}
      </Selectable>
      <div className="sf-brand__copy">
        <p className="sf-kicker">BRAND</p>
        <Selectable
          disabled={locked}
          active={selection?.type === 'brand.tagline'}
          onSelect={() => onSelect({ type: 'brand.tagline' })}
        >
          <h2>{site.brand.tagline}</h2>
        </Selectable>
        <Selectable
          disabled={locked}
          active={selection?.type === 'brand.description'}
          onSelect={() => onSelect({ type: 'brand.description' })}
        >
          <p>{site.brand.description}</p>
        </Selectable>
      </div>
    </section>
  )
}

function ShopView({
  site,
  selection,
  locked,
  category,
  categories,
  onSelect,
  onFilter,
  onOpen,
  onChange,
}: {
  site: SiteData
  selection: Selection | null
  locked: boolean
  category: string
  categories: SiteData['categories']
  onSelect: (selection: Selection | null) => void
  onFilter: (event: MouseEvent, id: string) => void
  onOpen: (event: MouseEvent, id: string) => void
  onChange?: (site: SiteData) => void
}) {
  const current = categories.find((item) => item.id === category)
  const list = category === 'all' ? site.products : site.products.filter((item) => item.category === category)
  const labels = categories.map((item) => item.label).filter(Boolean)
  const lead = current
    ? `${current.label}の商品をご覧いただけます。`
    : labels.length
      ? `${labels.join('、')}の商品をご覧いただけます。`
      : '商品をご覧いただけます。'
  return (
    <section className="sf-products sf-products--shop">
      <Selectable
        disabled={locked}
        active={selection?.type === 'products'}
        onSelect={() => onSelect({ type: 'products' })}
      >
        <header>
          <p className="sf-kicker">SHOP</p>
          <h2>{current?.label ?? 'すべての商品'}</h2>
          <p>{lead}</p>
        </header>
      </Selectable>
      <CategoryFilters category={category} categories={categories} includeAll onFilter={onFilter} />
      <ProductGrid products={list} selection={selection} locked={locked} onSelect={onSelect} onOpen={onOpen} />
      <AddProductButton
        site={site}
        locked={locked}
        categoryId={current?.id}
        onChange={onChange}
        onSelect={onSelect}
      />
    </section>
  )
}

function CategoryFilters({
  category,
  categories,
  includeAll,
  onFilter,
}: {
  category: string
  categories: SiteData['categories']
  includeAll?: boolean
  onFilter: (event: MouseEvent, id: string) => void
}) {
  return (
    <div className="sf-filters">
      {includeAll && (
        <button type="button" className={category === 'all' ? 'is-on' : ''} onClick={(event) => onFilter(event, 'all')}>
          ALL
        </button>
      )}
      {namedCategories(categories).map((item) => (
        <button
          key={item.id}
          type="button"
          className={category === item.id ? 'is-on' : ''}
          onClick={(event) => onFilter(event, item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function ProductGrid({
  products,
  selection,
  locked,
  onSelect,
  onOpen,
}: {
  products: SiteProduct[]
  selection: Selection | null
  locked: boolean
  onSelect: (selection: Selection | null) => void
  onOpen: (event: MouseEvent, id: string) => void
}) {
  return (
    <div className="sf-grid">
      {products.map((product) => (
        <article key={product.id} className="sf-card">
          <Selectable
            className="selectable--media"
            disabled={locked}
            active={selection?.type === 'product.image' && selection.id === product.id}
            onSelect={() => onSelect({ type: 'product.image', id: product.id })}
          >
            <button type="button" className="sf-card__open" onClick={(event) => onOpen(event, product.id)}>
              {product.image ? <img src={product.image} alt={product.name} /> : <div className="sf-card__fallback" />}
            </button>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'product' && selection.id === product.id}
            onSelect={() => onSelect({ type: 'product', id: product.id })}
          >
            <button type="button" className="sf-card__open" onClick={(event) => onOpen(event, product.id)}>
              <p className="sf-cat">{product.categoryJa}</p>
              <h3>{product.name.trim() || '新しい商品'}</h3>
              <p className="sf-price">¥{product.price.toLocaleString('ja-JP')}</p>
              <p className="sf-desc">{product.description}</p>
            </button>
          </Selectable>
        </article>
      ))}
      {products.length === 0 && <p className="sf-empty">このカテゴリの商品はまだありません。</p>}
    </div>
  )
}

function AddProductButton({
  site,
  locked,
  categoryId,
  onChange,
  onSelect,
}: {
  site: SiteData
  locked: boolean
  categoryId?: string
  onChange?: (site: SiteData) => void
  onSelect: (selection: Selection | null) => void
}) {
  if (locked || !onChange) return null
  const category = categoryId && site.categories.some((item) => item.id === categoryId) ? categoryId : site.categories[0]?.id
  return (
    <button
      type="button"
      className="sf-add-product"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const next = addProduct(site, { category })
        onChange(next)
        const created = next.products.at(-1)
        if (created) onSelect({ type: 'product', id: created.id })
      }}
    >
      商品を追加
    </button>
  )
}

function Section({
  id,
  site,
  selection,
  locked,
  category,
  onSelect,
  onFilter,
  onChange,
  onOpen,
}: {
  id: SectionId
  site: SiteData
  selection: Selection | null
  locked: boolean
  category: string
  onSelect: (selection: Selection | null) => void
  onFilter: (event: MouseEvent, id: string) => void
  onChange?: (site: SiteData) => void
  onOpen: (event: MouseEvent, id: string) => void
}) {
  if (id === 'hero') {
    return (
      <HeroSlider
        site={site}
        selection={selection}
        locked={locked}
        onSelect={() => onSelect({ type: 'hero.image' })}
      >
        <div className="sf-hero__copy">
          <Selectable
            disabled={locked}
            active={selection?.type === 'hero.kicker'}
            onSelect={() => onSelect({ type: 'hero.kicker' })}
          >
            <p className="sf-kicker">{site.hero.kicker}</p>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'hero.title' || selection?.type === 'hero'}
            onSelect={() => onSelect({ type: 'hero.title' })}
          >
            <h1>{site.hero.title}</h1>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'hero.subtitle'}
            onSelect={() => onSelect({ type: 'hero.subtitle' })}
          >
            <p className="sf-hero__sub">{site.hero.subtitle}</p>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'hero.cta'}
            onSelect={() => onSelect({ type: 'hero.cta' })}
          >
            <span className="sf-btn">{site.hero.cta}</span>
          </Selectable>
        </div>
      </HeroSlider>
    )
  }

  if (id === 'concept') {
    return (
      <section className="sf-concept">
        <div className="sf-concept__text">
          <p className="sf-kicker">BRAND</p>
          <Selectable
            disabled={locked}
            active={selection?.type === 'brand.tagline'}
            onSelect={() => onSelect({ type: 'brand.tagline' })}
          >
            <h2>{site.brand.tagline}</h2>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'brand.description'}
            onSelect={() => onSelect({ type: 'brand.description' })}
          >
            <p className="sf-concept__copy">{site.brand.description}</p>
          </Selectable>
        </div>
        <Selectable
          className="selectable--media sf-concept__media"
          disabled={locked}
          active={selection?.type === 'brand.image'}
          onSelect={() => onSelect({ type: 'brand.image' })}
        >
          {site.brand.image ? <img src={site.brand.image} alt="" /> : <div className="sf-concept__fallback" />}
        </Selectable>
      </section>
    )
  }

  if (id === 'pickup') {
    return (
      <PickupCarousel
        site={site}
        selection={selection}
        locked={locked}
        onSelect={onSelect}
        onOpen={onOpen}
        onChange={onChange}
      />
    )
  }

  if (id === 'products') {
    const list =
      category === 'all' ? site.products.slice(0, 8) : site.products.filter((item) => item.category === category)
    return (
      <section className="sf-products">
        <Selectable
          disabled={locked}
          active={selection?.type === 'products'}
          onSelect={() => onSelect({ type: 'products' })}
        >
          <header>
            <p className="sf-kicker">FEATURED ITEMS</p>
            <h2>おすすめアイテム</h2>
          </header>
        </Selectable>
        <CategoryFilters category={category} categories={site.categories} includeAll onFilter={onFilter} />
        <ProductGrid products={list} selection={selection} locked={locked} onSelect={onSelect} onOpen={onOpen} />
        <AddProductButton
          site={site}
          locked={locked}
          categoryId={category === 'all' ? undefined : category}
          onChange={onChange}
          onSelect={onSelect}
        />
      </section>
    )
  }

  if (id === 'instagram') {
    return (
      <InstagramSection
        site={site}
        selection={selection}
        locked={locked}
        onSelect={onSelect}
        onOpen={onOpen}
        onChange={onChange}
      />
    )
  }

  const news = site.news ?? []
  if (locked && news.length === 0) return null
  return (
    <section className="sf-news">
      <Selectable
        disabled={locked}
        active={selection?.type === 'news.list'}
        onSelect={() => onSelect({ type: 'news.list' })}
      >
        <header>
          <p className="sf-kicker">NEWS</p>
          <h2>お知らせ</h2>
        </header>
      </Selectable>
      <ul>
        {news.map((item) => (
          <li key={item.id}>
            <Selectable
              disabled={locked}
              active={selection?.type === 'news' && selection.id === item.id}
              onSelect={() => onSelect({ type: 'news', id: item.id })}
            >
              <time>{item.date}</time>
              <span>{item.title}</span>
            </Selectable>
            {!locked && onChange && (
              <button
                type="button"
                className="sf-news__action"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onChange(removeNews(site, item.id))
                  if (selection?.type === 'news' && selection.id === item.id) onSelect({ type: 'news.list' })
                }}
              >
                削除
              </button>
            )}
          </li>
        ))}
      </ul>
      {news.length === 0 && <p className="sf-empty">お知らせはまだありません。</p>}
      {!locked && onChange && (
        <button
          type="button"
          className="sf-news__action"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const next = addNews(site)
            onChange(next)
            const created = next.news[0]
            if (created) onSelect({ type: 'news', id: created.id })
          }}
        >
          追加
        </button>
      )}
    </section>
  )
}
