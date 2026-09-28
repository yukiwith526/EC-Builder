import type { MouseEvent } from 'react'
import { Selectable } from '../../../builder/Selectable'
import { hideSection } from '../../../site/update'
import type { Selection, SiteData } from '../../../types/site'

export function InstagramSection({
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
  const posts = instagramImages(site)
  const ig = site.instagram
  const handle = ig.handle.replace(/^@/, '')
  if (locked && posts.length === 0 && !ig.kicker && !handle && !ig.caption) return null

  const instagramSelected =
    selection?.type === 'instagram' ||
    selection?.type === 'instagram.kicker' ||
    selection?.type === 'instagram.handle' ||
    selection?.type === 'instagram.caption'

  return (
    <section className="sf-instagram">
      <Selectable disabled={locked} active={instagramSelected} onSelect={() => onSelect({ type: 'instagram' })}>
        <header>
          <Selectable
            disabled={locked}
            active={selection?.type === 'instagram.kicker'}
            onSelect={() => onSelect({ type: 'instagram.kicker' })}
          >
            <p className="sf-kicker">{ig.kicker || 'INSTAGRAM'}</p>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'instagram.handle'}
            onSelect={() => onSelect({ type: 'instagram.handle' })}
          >
            <h2>{handle ? `@${handle}` : '@アカウント名'}</h2>
          </Selectable>
          <Selectable
            disabled={locked}
            active={selection?.type === 'instagram.caption'}
            onSelect={() => onSelect({ type: 'instagram.caption' })}
          >
            <p>{ig.caption || (locked ? '' : '説明文')}</p>
          </Selectable>
        </header>
      </Selectable>
      {posts.length > 0 && (
        <div className="sf-instagram__grid">
          {posts.map((post) => (
            <Selectable
              key={post.key}
              className="selectable--media"
              disabled={locked}
              active={selection?.type === 'product.image' && selection.id === post.id}
              onSelect={() => onSelect({ type: 'product.image', id: post.id })}
            >
              <button type="button" className="sf-card__open" onClick={(event) => onOpen(event, post.id)}>
                <img src={post.src} alt="" />
              </button>
            </Selectable>
          ))}
        </div>
      )}
      {posts.length === 0 && !locked && <p className="sf-empty">商品写真があると、ここに並びます。</p>}
      {!locked && onChange && (
        <button
          type="button"
          className="sf-news__action"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onChange(hideSection(site, 'instagram'))
            onSelect(null)
          }}
        >
          削除
        </button>
      )}
    </section>
  )
}

export function instagramImages(site: SiteData) {
  const posts: { key: string; src: string; id: string }[] = []
  for (const product of site.products) {
    if (!product.image) continue
    posts.push({ key: product.id, src: product.image, id: product.id })
    if (posts.length >= 6) return posts
  }
  return posts
}
