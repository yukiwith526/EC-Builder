import { useEffect, useState } from 'react'
import { Selectable } from '../../../builder/Selectable'
import { productImages, type Selection, type SiteProduct } from '../../../types/site'

export function ProductGallery({
  product,
  locked,
  selection,
  onSelect,
}: {
  product: SiteProduct
  locked: boolean
  selection: Selection | null
  onSelect: () => void
}) {
  const slides = productImages(product)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex((current) => (slides.length ? current % slides.length : 0))
  }, [slides.length, product.id])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [slides.length, paused])

  const go = (dir: number) => {
    if (slides.length < 2) return
    setPaused(true)
    setIndex((current) => (current + dir + slides.length) % slides.length)
  }

  const current = slides[index] ?? slides[0] ?? ''

  return (
    <div
      className="sf-pdp__gallery"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Selectable
        className="selectable--media"
        disabled={locked}
        active={selection?.type === 'product.image' && selection.id === product.id}
        onSelect={onSelect}
      >
        <div className="sf-pdp__hero">
          {current ? <img src={current} alt={product.name} /> : <div className="sf-card__fallback" />}
        </div>
      </Selectable>
      {slides.length > 1 && (
        <>
          <div
            className="sf-pdp__nav"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <button type="button" className="sf-pdp__prev" aria-label="前の写真" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="sf-pdp__next" aria-label="次の写真" onClick={() => go(1)}>
              ›
            </button>
          </div>
          <div className="sf-pdp__thumbs">
            {slides.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={i === index ? 'is-on' : ''}
                onClick={(event) => {
                  event.stopPropagation()
                  setPaused(true)
                  setIndex(i)
                }}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
