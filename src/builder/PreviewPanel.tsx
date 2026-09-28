import { useState } from 'react'
import { useSite } from '../site/SiteContext'
import { getStorefront } from '../templates/registry'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORTS: { id: Viewport; label: string }[] = [
  { id: 'desktop', label: 'デスクトップ' },
  { id: 'tablet', label: 'タブレット' },
  { id: 'mobile', label: 'モバイル' },
]

export function PreviewPanel({ fillWidth = false }: { fillWidth?: boolean }) {
  const { site, selection, setSelection, saveSite } = useSite()
  const [viewport, setViewport] = useState<Viewport>(fillWidth ? 'mobile' : 'desktop')
  const [browse, setBrowse] = useState(false)
  const [notice, setNotice] = useState('')
  if (!site) return null

  const Storefront = getStorefront(site.templateId)
  const frame = fillWidth ? 'mobile' : viewport

  return (
    <section className="preview-panel">
      <header className="preview-toolbar">
        <div>
          <span>EC SITE PREVIEW</span>
          <strong>{site.brand.name}</strong>
        </div>
        <div className="preview-toolbar__actions">
          {!fillWidth &&
            VIEWPORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`preview-toolbar__icon ${viewport === item.id ? 'is-on' : ''}`}
                aria-label={item.label}
                title={item.label}
                onClick={() => setViewport(item.id)}
              >
                <ViewportIcon id={item.id} />
              </button>
            ))}
          <button
            type="button"
            className={browse ? 'is-on' : ''}
            onClick={() => {
              setBrowse((current) => !current)
              setSelection(null)
              setNotice('')
            }}
          >
            プレビュー
          </button>
          <button
            type="button"
            className="publish"
            onClick={() => setNotice('公開は未実装です。既存サイトへはデプロイしません。')}
          >
            公開
          </button>
        </div>
      </header>
      {notice && <p className="notice notice--light">{notice}</p>}
      <div id="ec-builder-preview-stage" className="preview-stage">
        <div className={`preview-frame is-${frame}`}>
          <Storefront
            site={site}
            selection={site.setupStep === 'done' && !browse ? selection : null}
            interactive={site.setupStep === 'done'}
            browse={browse}
            onSelect={site.setupStep === 'done' && !browse ? setSelection : () => undefined}
            onChange={site.setupStep === 'done' && !browse ? saveSite : undefined}
          />
        </div>
      </div>
    </section>
  )
}

function ViewportIcon({ id }: { id: Viewport }) {
  if (id === 'desktop') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4" strokeLinecap="round" />
      </svg>
    )
  }
  if (id === 'tablet') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="6" y="3" width="12" height="18" rx="1.8" />
        <path d="M12 17.5h.01" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="8" y="2.5" width="8" height="19" rx="1.6" />
      <path d="M11 18.5h2" strokeLinecap="round" />
    </svg>
  )
}
