import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './lib/i18n'
import { MusicProvider } from './lib/music'
import './styles/tokens.css'
import './styles/base.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <MusicProvider>
        <App />
      </MusicProvider>
    </I18nProvider>
  </StrictMode>,
)
