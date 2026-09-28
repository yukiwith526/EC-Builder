import { useEffect, useState } from 'react'
import { useSite } from '../site/SiteContext'
import { ChatPanel } from './ChatPanel'
import { PreviewPanel } from './PreviewPanel'
import { Wizard } from './Wizard'

export function BuilderShell() {
  const { site, onboarded, selection } = useSite()
  const mobile = useNarrowScreen()
  const [pane, setPane] = useState<'edit' | 'site'>('edit')

  useEffect(() => {
    if (mobile && selection) setPane('edit')
  }, [mobile, selection])

  if (!onboarded || !site) return <Wizard />

  return (
    <div className="builder-shell" data-pane={mobile ? pane : 'both'}>
      <nav className="builder-mobile-nav" aria-label="画面切替">
        <button type="button" className={pane === 'edit' ? 'is-on' : ''} onClick={() => setPane('edit')}>
          編集
        </button>
        <button type="button" className={pane === 'site' ? 'is-on' : ''} onClick={() => setPane('site')}>
          サイト
        </button>
      </nav>
      <ChatPanel key={site.id} />
      <PreviewPanel fillWidth={mobile} />
    </div>
  )
}

function useNarrowScreen() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return narrow
}
