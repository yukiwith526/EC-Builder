import { MAX_PRODUCT_IMAGES } from '../types/site'
import { readImageFile } from './ImageField'

export function ProductImageEditor({
  images,
  onAdd,
  onRemove,
  onPick,
}: {
  images: string[]
  onAdd: (src: string) => void
  onRemove: (src: string) => void
  onPick?: (src: string) => void
}) {
  return (
    <div className="inspector__row">
      <div className="hero-slides">
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className={`hero-slides__item ${index === 0 ? 'is-on' : ''}`}>
            <button type="button" onClick={() => onPick?.(src)}>
              <img src={src} alt="" />
            </button>
            <button type="button" className="text-btn" onClick={() => onRemove(src)}>
              削除
            </button>
          </div>
        ))}
        {images.length < MAX_PRODUCT_IMAGES && (
          <label className="hero-slides__add">
            追加
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file || !file.type.startsWith('image/')) return
                onAdd(await readImageFile(file))
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}
