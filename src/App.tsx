import { BuilderShell } from './builder/BuilderShell'
import { SiteProvider } from './site/SiteContext'

export default function App() {
  return (
    <SiteProvider>
      <BuilderShell />
    </SiteProvider>
  )
}
