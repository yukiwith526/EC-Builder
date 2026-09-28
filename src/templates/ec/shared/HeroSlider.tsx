import { useEffect, useState, type ReactNode } from 'react'
import { Selectable } from '../../../builder/Selectable'
import { heroImages, type Selection, type SiteData } from '../../../types/site'

export function HeroSlider({
  site,
  selection,
  locked,
  onSelect,
  children,
}: {
  site: SiteData
  selection: Selection | null
  locked: boolean
  onSelect: () => void
  children: ReactNode
}) {
  const slides = heroImages(site.hero)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex((current) => (slides.length ? current % slides.length : 0))
  }, [slides.length])

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

  return (
    <section className="sf-hero" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <Selectable className="selectable--media" disabled={locked} active={selection?.type === 'hero.image'} onSelect={onSelect}>
        {slides.length > 0 ? (
          <div className="sf-hero__slides">
            {slides.map((src, i) => (
              <div key={`${src}-${i}`} className={`sf-hero__slide ${i === index ? 'is-active' : ''}`}>
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        ) : (
          <div className="sf-hero__fallback" />
        )}
      </Selectable>
      {children}
      {slides.length > 1 && (
        <div
          className="sf-hero__nav"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <button type="button" aria-label="前のスライド" onClick={() => go(-1)}>
            ‹
          </button>
          <div className="sf-hero__dots">
            {slides.map((src, i) => (
              <button
                key={`${src}-dot-${i}`}
                type="button"
                className={i === index ? 'is-on' : ''}
                aria-label={`スライド${i + 1}`}
                onClick={() => {
                  setPaused(true)
                  setIndex(i)
                }}
              />
            ))}
          </div>
          <button type="button" aria-label="次のスライド" onClick={() => go(1)}>
            ›
          </button>
        </div>
      )}
    </section>
  )
}
