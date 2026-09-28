export function siteIdFromLocation(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  const match = hash.match(/^\/?site\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function openSiteLocation(id: string) {
  const next = `#/site/${encodeURIComponent(id)}`
  if (window.location.hash !== next) {
    window.history.pushState({ siteId: id }, '', next)
  }
}

export function openNewSiteLocation() {
  if (!window.location.hash) return
  window.history.pushState({ siteId: null }, '', `${window.location.pathname}${window.location.search}`)
}
