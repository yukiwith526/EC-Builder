import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import type { SiteData } from '../types/site'
import { addCategory, moveCategory, removeCategory, updateCategory } from '../site/update'

interface Props {
  site: SiteData
  onChange: (site: SiteData) => void
}

export function CategoryEditor({ site, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const composing = useRef(false)

  const add = () => {
    const label = draft.trim()
    if (!label) return
    onChange(addCategory(site, label))
    setDraft('')
  }

  const onDragStart = (event: DragEvent<HTMLButtonElement>, id: string) => {
    event.dataTransfer.setData('text/plain', id)
    event.dataTransfer.effectAllowed = 'move'
    setDragging(id)
  }

  const onDrop = (event: DragEvent<HTMLLIElement>, id: string) => {
    event.preventDefault()
    const fromId = event.dataTransfer.getData('text/plain') || dragging
    if (fromId) onChange(moveCategory(site, fromId, id))
    setDragging(null)
  }

  return (
    <div className="category-editor">
      <p>販売カテゴリ</p>
      <ul>
        {site.categories.map((item) => (
          <li
            key={item.id}
            className={dragging === item.id ? 'is-dragging' : ''}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, item.id)}
          >
            <button
              type="button"
              className="drag-handle"
              draggable
              aria-label="順番を変更"
              onDragStart={(event) => onDragStart(event, item.id)}
              onDragEnd={() => setDragging(null)}
            >
              ☰
            </button>
            <input
              value={item.label}
              placeholder="カテゴリ名"
              onChange={(event) => onChange(updateCategory(site, item.id, event.target.value))}
            />
            <button
              type="button"
              className="ghost"
              disabled={site.categories.length <= 1}
              onClick={() => onChange(removeCategory(site, item.id))}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <div className="category-editor__add">
        <input
          value={draft}
          placeholder="新しいカテゴリ名"
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={() => {
            composing.current = true
            window.requestAnimationFrame(() => {
              composing.current = false
            })
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') return
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
            event.preventDefault()
            add()
          }}
        />
        <button type="button" disabled={!draft.trim()} onClick={add}>
          追加
        </button>
      </div>
    </div>
  )
}
