import { useEffect, useRef, type MouseEvent } from 'react'
import { Selectable } from '../../../builder/Selectable'
import { addPickupProduct, pickupProducts } from '../../../site/update'
import type { Selection, SiteData } from '../../../types/site'

export function PickupCarousel({
  site,
  selection,
  locked,
  onSelect,
  onOpen,
  onChange,
}: {
  site: SiteData
  selection: Selection | null
  locked: boolean
  onSelect: (selection: Selection | null) => void
  onOpen: (event: MouseEvent, id: string) => void
  onChange?: (site: SiteData) => void
}) {
  const items = pickupProducts(site)
  const scroller = useRef<HTMLDivElement>(null)

  const scrollByCard = (dir: number) => {
    const node = scroller.current
    if (!node) return
    const amount = node.clientWidth
    const max = node.scrollWidth - node.clientWidth
    const next = node.scrollLeft + dir * amount
    if (next > max - 8) {
      node.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (next < 0) {
      node.scrollTo({ left: max, behavior: 'smooth' })
      return
    }
    node.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const node = scroller.current
    if (!node || items.length < 2) return
    let paused = false
    const pause = () => {
      paused = true
    }
    const resume = () => {
      paused = false
    }
    node.addEventListener('pointerdown', pause)
    node.addEventListener('pointerleave', resume)
    const id = window.setInterval(() => {
      if (!paused) scrollByCard(1)
    }, 4200)
    return () => {
      window.clearInterval(id)
      node.removeEventListener('pointerdown', pause)
      node.removeEventListener('pointerleave', resume)
    }
  }, [items.length])

  if (locked && items.length === 0) return null

  const addItem = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!onChange) return
    const next = addPickupProduct(site)
    onChange(next)
    const created = next.products.at(-1)
    if (created) onSelect({ type: 'product', id: created.id })
  }

  return (
    <section className="sf-pickup-block">
      <Selectable disabled={locked} active={selection?.type === 'pickup'} onSelect={() => onSelect({ type: 'pickup' })}>
        <header>
          <p className="sf-kicker">PICK UP</p>
          <h2>ピックアップ</h2>
        </header>
      </Selectable>
      <div className="sf-pickup-carousel">
        {items.length > 1 && (
          <button type="button" className="sf-pickup__arrow is-prev" aria-label="前へ" onClick={() => scrollByCard(-1)}>
            ‹
          </button>
        )}
        <div className="sf-pickup__track" ref={scroller}>
          {items.map((item) => (
            <article key={item.id} className="sf-pickup-card">
              <Selectable
                className="selectable--media"
                disabled={locked}
                active={selection?.type === 'product.image' && selection.id === item.id}
                onSelect={() => onSelect({ type: 'product.image', id: item.id })}
              >
                <button type="button" className="sf-card__open" onClick={(event) => onOpen(event, item.id)}>
                  {item.image ? <img src={item.image} alt="" /> : <div className="sf-card__fallback" />}
                </button>
              </Selectable>
              <Selectable
                disabled={locked}
                active={selection?.type === 'product' && selection.id === item.id}
                onSelect={() => onSelect({ type: 'product', id: item.id })}
              >
                <button type="button" className="sf-card__open" onClick={(event) => onOpen(event, item.id)}>
                  <p className="sf-kicker">{item.categoryJa || 'PICK UP'}</p>
                  <h3>{item.name.trim() || '新しい商品'}</h3>
                  <p>{item.description}</p>
                </button>
              </Selectable>
            </article>
          ))}
          {items.length === 0 && <p className="sf-empty">ピックアップする商品を追加してください。</p>}
        </div>
        {items.length > 1 && (
          <button type="button" className="sf-pickup__arrow is-next" aria-label="次へ" onClick={() => scrollByCard(1)}>
            ›
          </button>
        )}
      </div>
      {!locked && onChange && (
        <button type="button" className="sf-add-product" onClick={addItem}>
          ピックアップに商品を追加
        </button>
      )}
    </section>
  )
}
