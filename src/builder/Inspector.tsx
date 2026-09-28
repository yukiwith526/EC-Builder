import type { Selection, SiteData, SiteProduct } from '../types/site'
import { MAX_HERO_SLIDES, heroImages, isProductSelection, productImages, selectionLabel } from '../types/site'
import {
  addHeroImage,
  addNews,
  addPickupProduct,
  addProduct,
  addProductImage,
  hideSection,
  removeFromPickup,
  removeHeroImage,
  removeNews,
  removeProduct,
  removeProductImage,
  setAnnouncementExtra,
  setAnnouncementVisible,
  setBrandDescription,
  setBrandImage,
  setBrandName,
  setBrandTagline,
  setFreeShippingThreshold,
  setHero,
  setInstagram,
  setLegal,
  updateNews,
  updateProduct,
} from '../site/update'
import { ImageField, readImageFile } from './ImageField'
import { ImagePicker } from './ImagePicker'
import { ProductImageEditor } from './ProductImageEditor'

interface Props {
  site: SiteData
  selection: Selection
  onChange: (site: SiteData) => void
  onClear: () => void
  onSelect: (selection: Selection) => void
}

export function Inspector({ site, selection, onChange, onClear, onSelect }: Props) {
  const product = selectedProduct(site, selection)
  const news = selection.type === 'news' ? site.news?.find((item) => item.id === selection.id) : undefined
  const isHeroImage = selection.type === 'hero.image'
  const isInstagram =
    selection.type === 'instagram' ||
    selection.type === 'instagram.kicker' ||
    selection.type === 'instagram.handle' ||
    selection.type === 'instagram.caption'
  const slides = heroImages(site.hero)
  const announcementOn = site.announcementVisible !== false
  const canAddProduct =
    selection.type === 'products' ||
    selection.type === 'pickup' ||
    selection.type === 'product' ||
    selection.type === 'product.image' ||
    selection.type === 'product.description' ||
    selection.type === 'product.usage' ||
    selection.type === 'product.ingredients'

  const addNewsItem = () => {
    const next = addNews(site)
    onChange(next)
    const created = next.news[0]
    if (created) onSelect({ type: 'news', id: created.id })
  }

  const addProductItem = () => {
    const next = selection.type === 'pickup' ? addPickupProduct(site) : addProduct(site)
    onChange(next)
    const created = next.products.at(-1)
    if (created) onSelect({ type: 'product', id: created.id })
  }

  return (
    <div className="inspector">
      <header>
        <p>選択中：{selectionLabel(selection)}{product ? ` / ${product.name}` : ''}</p>
        <div className="inspector__header-actions">
          {selection.type === 'announcement' && (
            <>
              <button
                type="button"
                className={`text-btn ${announcementOn ? 'is-current' : ''}`}
                onClick={() => onChange(setAnnouncementVisible(site, true))}
              >
                表示
              </button>
              <button
                type="button"
                className={`text-btn ${announcementOn ? '' : 'is-current'}`}
                onClick={() => onChange(setAnnouncementVisible(site, false))}
              >
                非表示
              </button>
            </>
          )}
          {(news || selection.type === 'news.list') && (
            <>
              <button type="button" className="text-btn" onClick={addNewsItem}>
                追加
              </button>
              {news && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    onChange(removeNews(site, news.id))
                    onClear()
                  }}
                >
                  削除
                </button>
              )}
            </>
          )}
          {isInstagram && (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                onChange(hideSection(site, 'instagram'))
                onClear()
              }}
            >
              削除
            </button>
          )}
          {canAddProduct && (
            <>
              <button type="button" className="text-btn" onClick={addProductItem}>
                追加
              </button>
              {product && (site.pickupIds ?? []).includes(product.id) && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    onChange(removeFromPickup(site, product.id))
                    onSelect({ type: 'pickup' })
                  }}
                >
                  外す
                </button>
              )}
              {product && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    onChange(removeProduct(site, product.id))
                    onClear()
                  }}
                >
                  削除
                </button>
              )}
            </>
          )}
          <button type="button" className="text-btn" onClick={onClear}>
            解除
          </button>
        </div>
      </header>

      {selection.type === 'announcement' && (
        <div className="inspector__stack">
          <label>
            送料無料になる購入金額（円以上）
            <input
              inputMode="numeric"
              autoComplete="off"
              value={site.freeShippingThreshold ? String(site.freeShippingThreshold) : ''}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                onChange(setFreeShippingThreshold(site, digits === '' ? 0 : Number(digits)))
              }}
            />
          </label>
          <label>
            追加メッセージ
            <input
              value={site.announcementExtra ?? ''}
              onChange={(event) => onChange(setAnnouncementExtra(site, event.target.value))}
            />
          </label>
        </div>
      )}

      {news && (
        <div className="inspector__stack">
          <label>
            日付
            <input value={news.date} onChange={(event) => onChange(updateNews(site, news.id, { date: event.target.value }))} />
          </label>
          <label>
            タイトル
            <input value={news.title} onChange={(event) => onChange(updateNews(site, news.id, { title: event.target.value }))} />
          </label>
        </div>
      )}

      {(selection.type === 'legal' || selection.type.startsWith('legal.')) && (
        <div className="inspector__stack">
          <label>
            事業者名
            <input
              value={site.legal?.seller ?? ''}
              placeholder="株式会社フルール"
              onChange={(event) => onChange(setLegal(site, { seller: event.target.value }))}
            />
          </label>
          <label>
            運営統括責任者
            <input
              value={site.legal?.representative ?? ''}
              placeholder="山田 花"
              onChange={(event) => onChange(setLegal(site, { representative: event.target.value }))}
            />
          </label>
          <label>
            所在地
            <input
              value={site.legal?.address ?? ''}
              placeholder="〒107-0062 東京都港区南青山1-2-3"
              onChange={(event) => onChange(setLegal(site, { address: event.target.value }))}
            />
          </label>
          <label>
            電話番号
            <input
              value={site.legal?.phone ?? ''}
              placeholder="03-0000-0000"
              onChange={(event) => onChange(setLegal(site, { phone: event.target.value }))}
            />
          </label>
          <label>
            メールアドレス
            <input
              value={site.legal?.email ?? ''}
              placeholder="hello@example.com"
              onChange={(event) => onChange(setLegal(site, { email: event.target.value }))}
            />
          </label>
        </div>
      )}

      {(selection.type === 'brand.name' || selection.type === 'footer') && (
        <label>
          ブランド名
          <input value={site.brand.name} onChange={(event) => onChange(setBrandName(site, event.target.value))} />
        </label>
      )}

      {selection.type === 'brand.tagline' && (
        <label>
          タグライン
          <input value={site.brand.tagline} onChange={(event) => onChange(setBrandTagline(site, event.target.value))} />
        </label>
      )}

      {selection.type === 'brand.description' && (
        <label>
          説明
          <textarea
            rows={3}
            value={site.brand.description}
            onChange={(event) => onChange(setBrandDescription(site, event.target.value))}
          />
        </label>
      )}

      {selection.type === 'hero.kicker' && (
        <label>
          キッカー
          <input value={site.hero.kicker} onChange={(event) => onChange(setHero(site, { kicker: event.target.value }))} />
        </label>
      )}

      {(selection.type === 'hero.title' || selection.type === 'hero') && (
        <label>
          タイトル
          <input value={site.hero.title} onChange={(event) => onChange(setHero(site, { title: event.target.value }))} />
        </label>
      )}

      {selection.type === 'hero.subtitle' && (
        <label>
          サブコピー
          <textarea
            rows={2}
            value={site.hero.subtitle}
            onChange={(event) => onChange(setHero(site, { subtitle: event.target.value }))}
          />
        </label>
      )}

      {isInstagram && (
        <div className="inspector__stack">
          <label>
            見出し
            <input
              value={site.instagram.kicker}
              onChange={(event) => onChange(setInstagram(site, { kicker: event.target.value }))}
            />
          </label>
          <label>
            アカウント
            <input
              value={site.instagram.handle}
              placeholder="lumina"
              onChange={(event) => onChange(setInstagram(site, { handle: event.target.value }))}
            />
          </label>
          <label>
            説明
            <textarea
              rows={2}
              value={site.instagram.caption}
              onChange={(event) => onChange(setInstagram(site, { caption: event.target.value }))}
            />
          </label>
        </div>
      )}

      {selection.type === 'hero.cta' && (
        <label>
          ボタン
          <input value={site.hero.cta} onChange={(event) => onChange(setHero(site, { cta: event.target.value }))} />
        </label>
      )}

      {isHeroImage && (
        <div className="inspector__row">
          <div className="hero-slides">
            {slides.map((src, index) => (
              <div key={`${src}-${index}`} className={`hero-slides__item ${src === site.hero.image ? 'is-on' : ''}`}>
                <button type="button" onClick={() => onChange(setHero(site, { image: src, images: slides }))}>
                  <img src={src} alt="" />
                </button>
                <button type="button" className="text-btn" onClick={() => onChange(removeHeroImage(site, src))}>
                  削除
                </button>
              </div>
            ))}
            {slides.length < MAX_HERO_SLIDES && (
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
                    onChange(addHeroImage(site, await readImageFile(file)))
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {selection.type === 'brand.image' && (
        <div className="inspector__row">
          <ImagePicker value={site.brand.image} onChange={(image) => onChange(setBrandImage(site, image))} />
          <ImageField
            label="ファイルから"
            value={site.brand.image.startsWith('data:') ? site.brand.image : ''}
            onChange={(image) => onChange(setBrandImage(site, image))}
          />
          <button type="button" className="ghost" onClick={() => onChange(setBrandImage(site, ''))}>
            削除
          </button>
        </div>
      )}

      {product && (
        <>
          <label>
            商品名
            <input
              value={product.name}
              placeholder="商品名"
              onChange={(event) => onChange(updateProduct(site, product.id, { name: event.target.value }))}
            />
          </label>
          <label>
            カテゴリ
            <select
              value={site.categories.some((item) => item.id === product.category) ? product.category : site.categories[0]?.id ?? ''}
              onChange={(event) => onChange(updateProduct(site, product.id, { category: event.target.value }))}
            >
              {site.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            価格
            <input
              inputMode="numeric"
              autoComplete="off"
              value={product.price ? String(product.price) : ''}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                onChange(updateProduct(site, product.id, { price: digits === '' ? 0 : Number(digits) }))
              }}
            />
          </label>
          <label>
            商品説明
            <textarea
              rows={3}
              value={product.description}
              onChange={(event) => onChange(updateProduct(site, product.id, { description: event.target.value }))}
            />
          </label>
          <label>
            使い方・特長
            <textarea
              rows={3}
              value={product.usage ?? ''}
              onChange={(event) => onChange(updateProduct(site, product.id, { usage: event.target.value }))}
            />
          </label>
          <label>
            成分
            <textarea
              rows={3}
              value={product.ingredients ?? ''}
              onChange={(event) => onChange(updateProduct(site, product.id, { ingredients: event.target.value }))}
            />
          </label>
          <p className="inspector__hint">商品写真（3枚まで）</p>
          <ProductImageEditor
            images={productImages(product)}
            onAdd={(image) => onChange(addProductImage(site, product.id, image))}
            onRemove={(image) => onChange(removeProductImage(site, product.id, image))}
            onPick={(image) =>
              onChange(
                updateProduct(site, product.id, {
                  images: [image, ...productImages(product).filter((src) => src !== image)],
                  image,
                }),
              )
            }
          />
        </>
      )}
    </div>
  )
}

function selectedProduct(site: SiteData, selection: Selection): SiteProduct | undefined {
  if (!isProductSelection(selection)) return undefined
  return site.products.find((item) => item.id === selection.id)
}
