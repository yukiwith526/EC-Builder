import { getDesignImages } from '../templates/registry'
import { useSite } from '../site/SiteContext'

interface Props {
  value: string
  onChange: (src: string) => void
}

export function ImagePicker({ value, onChange }: Props) {
  const { site } = useSite()
  const images = getDesignImages(site?.templateId)
  if (images.length === 0) return null
  return (
    <div className="image-picker">
      <p>デザイン写真から選ぶ</p>
      <div className="image-picker__grid">
        {images.map((src) => (
          <button
            key={src}
            type="button"
            className={value === src ? 'is-on' : ''}
            onClick={() => onChange(src)}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
  )
}
