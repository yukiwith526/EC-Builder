export function placeholderImage(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#g)"/>
    <circle cx="400" cy="380" r="170" fill="rgba(255,255,255,0.22)"/>
    <circle cx="470" cy="430" r="90" fill="rgba(255,255,255,0.16)"/>
    <text x="400" y="880" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-size="34" font-family="Georgia, serif">${escapeXml(label)}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
