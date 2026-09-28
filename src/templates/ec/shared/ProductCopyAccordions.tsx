import { useState } from 'react'
import { Selectable } from '../../../builder/Selectable'
import type { Selection, SiteProduct } from '../../../types/site'

const ITEMS = [
  ['desc', '商品説明', 'product.description'],
  ['details', '使い方・特長', 'product.usage'],
  ['ing', '成分', 'product.ingredients'],
] as const

export function ProductCopyAccordions({
  product,
  locked,
  selection,
  onSelect,
}: {
  product: SiteProduct
  locked: boolean
  selection: Selection | null
  onSelect: (selection: Selection) => void
}) {
  const selectedType =
    selection && 'id' in selection && selection.id === product.id ? selection.type : null
  const openFromSelection =
    selectedType === 'product.usage' ? 'details' : selectedType === 'product.ingredients' ? 'ing' : 'desc'
  const [open, setOpen] = useState(openFromSelection)

  return (
    <div className="sf-pdp__acc">
      {ITEMS.map(([id, label, type]) => {
        const body = type === 'product.usage' ? product.usage ?? '' : type === 'product.ingredients' ? product.ingredients ?? '' : product.description
        const active = selectedType === type
        return (
          <Selectable
            key={id}
            disabled={locked}
            active={active}
            onSelect={() => {
              onSelect({ type, id: product.id })
              setOpen(id)
            }}
          >
            <div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect({ type, id: product.id })
                  setOpen(id)
                }}
              >
                {label}
                <span>{open === id ? '−' : '+'}</span>
              </button>
              {open === id && <p>{body.trim() || '未入力'}</p>}
            </div>
          </Selectable>
        )
      })}
    </div>
  )
}
