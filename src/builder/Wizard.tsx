import { useMemo, useState } from 'react'
import { templatesByKind, createSiteFromTemplate } from '../templates/registry'
import { useSite } from '../site/SiteContext'
import { createSiteRepository } from '../site/storage'
import type { TemplateMeta } from '../types/site'
import './onboarding.css'

export function Wizard() {
  const { completeOnboarding, resumeSite } = useSite()
  const [notice, setNotice] = useState<TemplateMeta | null>(null)
  const draft = useMemo(() => createSiteRepository().load(), [])
  const ec = templatesByKind('ec')
  const draftName = draft?.brand.name.trim()

  const startTemplate = (template: TemplateMeta) => {
    if (draft?.templateId === template.id) {
      setNotice(template)
      return
    }
    completeOnboarding(createSiteFromTemplate(template.id))
  }

  return (
    <div className="onboard">
      <header className="onboard__header">
        <p className="onboard__lead">あなたの想いを、ブランドに。</p>
      </header>

      <main className="onboard__solo onboard__solo--center">
        <div className="guide__intro">
          <h1>テンプレートを選択</h1>
          <p className="guide__lead">好きなデザインを選んで、編集を始めます。</p>
        </div>
        <section className="pick-group">
          <h2>
            <span>E-commerce</span>
          </h2>
          <div className="pick-grid">
            {ec.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                hasDraft={draft?.templateId === template.id}
                onStart={() => startTemplate(template)}
              />
            ))}
          </div>
        </section>
      </main>

      {notice && (
        <div className="guide-notice" role="dialog" aria-modal="true" aria-labelledby="guide-notice-title">
          <div className="guide-notice__card">
            <p className="guide__kicker">下書き</p>
            <h2 id="guide-notice-title">このデザインの下書きがあります</h2>
            <p className="guide__lead">
              {draftName
                ? `「${draftName}」の続きから編集しますか？新しく始めると、いまの下書きは上書きされます。`
                : '保存中のサイトの続きから編集しますか？新しく始めると、いまの下書きは上書きされます。'}
            </p>
            <div className="guide__actions">
              <button type="button" onClick={() => resumeSite()}>
                {draftName ? `「${draftName}」の続きから編集` : '続きから編集'}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => completeOnboarding(createSiteFromTemplate(notice.id))}
              >
                新しく作り直す
              </button>
              <button type="button" className="text-btn" onClick={() => setNotice(null)}>
                選択に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  hasDraft,
  onStart,
}: {
  template: TemplateMeta
  hasDraft: boolean
  onStart: () => void
}) {
  return (
    <article className="pick-card">
      <button type="button" className="pick-card__visual" onClick={onStart} aria-label={`${template.name}を選択`}>
        <img src={template.previewImages[0]} alt="" />
        {hasDraft && <span className="pick-card__draft">下書きあり</span>}
      </button>
      <div className="pick-card__body">
        <h3>{template.name}</h3>
        <p>{template.description}</p>
      </div>
    </article>
  )
}
