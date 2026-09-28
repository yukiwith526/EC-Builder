import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Selection, SiteData } from '../types/site'
import { createSiteRepository } from './storage'
import { normalizeSite } from './operations'
import { openNewSiteLocation, openSiteLocation, siteIdFromLocation } from './location'

interface SiteContextValue {
  site: SiteData | null
  onboarded: boolean
  selection: Selection | null
  setSelection: (selection: Selection | null) => void
  saveSite: (site: SiteData) => void
  completeOnboarding: (site: SiteData) => void
  resumeSite: () => boolean
  resetSite: () => void
}

const SiteContext = createContext<SiteContextValue | null>(null)
const repository = createSiteRepository()

function readWorkspace(): { site: SiteData | null; onboarded: boolean } {
  const urlId = siteIdFromLocation()
  const stored = repository.load()
  if (urlId && stored && stored.id === urlId) {
    return { site: stored, onboarded: true }
  }
  return { site: null, onboarded: false }
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [{ site, onboarded }, setWorkspace] = useState(readWorkspace)
  const [selection, setSelection] = useState<Selection | null>(null)

  useEffect(() => {
    const sync = () => {
      const next = readWorkspace()
      setWorkspace(next)
      if (!next.onboarded) setSelection(null)
    }
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const value = useMemo<SiteContextValue>(
    () => ({
      site,
      onboarded,
      selection,
      setSelection,
      saveSite: (next) => {
        const normalized = normalizeSite(next)
        repository.save(normalized)
        setWorkspace({ site: normalized, onboarded: true })
      },
      resumeSite: () => {
        const stored = repository.load()
        if (!stored) return false
        openSiteLocation(stored.id)
        setWorkspace({ site: stored, onboarded: true })
        return true
      },
      completeOnboarding: (next) => {
        const normalized = normalizeSite(next)
        repository.save(normalized)
        openSiteLocation(normalized.id)
        setWorkspace({ site: normalized, onboarded: true })
      },
      resetSite: () => {
        repository.clear()
        openNewSiteLocation()
        setSelection(null)
        setWorkspace({ site: null, onboarded: false })
      },
    }),
    [site, onboarded, selection],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used within SiteProvider')
  return context
}
