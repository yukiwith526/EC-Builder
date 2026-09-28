import { useState } from 'react'
import { categoryLabel, DEFAULT_PRODUCT_INGREDIENTS, DEFAULT_PRODUCT_USAGE, MAX_PRODUCT_IMAGES, type SiteData } from '../types/site'
import { defaultProductPrice, productNamePlaceholder } from '../templates/voice'
import { addProduct } from '../site/update'
import { ProductImageEditor } from './ProductImageEditor'

interface Props {
  site: SiteData
  onChange: (site: SiteData) => void
  onFinish: () => void
}

export function ProductComposer({ site, onChange, onFinish }: Props) {
  const categories = site.categories
  const [name, setName] = useState('')
  const [price, setPrice] = useState(() => defaultProductPrice(site.templateId))
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [usage, setUsage] = useState('')
  const [ingredients, setIngredients] = useState('')
  const selected = categories.some((item) => item.id === category) ? category : categories[0]?.id ?? ''

  const add = () => {
    if (!name.trim() || !selected) return
    onChange(
      addProduct(site, {
        name: name.trim(),
        price: Number(price) || 0,
        category: selected,
        image: images[0] ?? '',
        images,
        description: description.trim() || `${site.brand.name} の${categoryLabel(selected, categories)}。`,
        usage: usage.trim() || DEFAULT_PRODUCT_USAGE,
        ingredients: ingredients.trim() || DEFAULT_PRODUCT_INGREDIENTS,
      }),
    )
    setName('')
    setImages([])
    setDescription('')
    setUsage('')
    setIngredients('')
  }

  return (
    <div className="product-composer">
      <p>手入力で追加</p>
      <label>
        商品名
        <input value={name} placeholder={productNamePlaceholder(site.templateId)} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        価格
        <input
          inputMode="numeric"
          autoComplete="off"
          value={price}
          onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))}
        />
      </label>
      <label>
        カテゴリ
        <select value={selected} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p>商品写真（3枚まで）</p>
      <ProductImageEditor
        images={images}
        onAdd={(src) => setImages((current) => (current.includes(src) || current.length >= MAX_PRODUCT_IMAGES ? current : [...current, src]))}
        onRemove={(src) => setImages((current) => current.filter((item) => item !== src))}
        onPick={(src) => setImages((current) => [src, ...current.filter((item) => item !== src)])}
      />
      <label>
        商品説明
        <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        使い方・特長
        <textarea rows={3} value={usage} onChange={(event) => setUsage(event.target.value)} />
      </label>
      <label>
        成分
        <textarea rows={3} value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
      </label>
      <div className="product-composer__actions">
        <button type="button" disabled={!name.trim() || !selected} onClick={add}>
          この商品を追加
        </button>
        <button type="button" className="text-btn" onClick={onFinish}>
          {site.products.length > 0 ? '追加を終えてプレビューを編集' : 'あとで追加して編集に進む'}
        </button>
      </div>
    </div>
  )
}
