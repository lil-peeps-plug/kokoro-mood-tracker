import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './lib/i18n'
import { MusicProvider } from './lib/music'
import { bindSafeArea } from './lib/safeArea'
import './styles/tokens.css'
import './styles/base.css'

// Admin panel is a totally separate UI tree — only loaded when the URL
// asks for it. Keeps the main app bundle untouched for ordinary users.
const AdminApp = lazy(() => import('./admin/AdminApp'))

// Push Telegram's safe-area insets into CSS variables before the first
// paint, so the banner never gets eclipsed by the iPhone Dynamic Island.
bindSafeArea()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

const isAdminRoute = window.location.pathname.startsWith('/admin')

// Tag the body so the phone-frame styles back off and the admin can
// claim the full viewport on laptops. Done before render so there's no
// momentary "phone in the corner" flash on first paint.
if (isAdminRoute) {
  document.body.classList.add('is-admin-route')
  document.documentElement.classList.add('is-admin-route')
}

createRoot(rootElement).render(
  <StrictMode>
    {isAdminRoute ? (
      // Admin still wants the YouTube music player and the i18n labels
      // used by MusicToggle, even though it has its own English-only UI
      // otherwise. Same providers, separate route tree.
      <I18nProvider>
        <MusicProvider>
          <Suspense fallback={null}>
            <AdminApp />
          </Suspense>
        </MusicProvider>
      </I18nProvider>
    ) : (
      <I18nProvider>
        <MusicProvider>
          <App />
        </MusicProvider>
      </I18nProvider>
    )}
  </StrictMode>,
)
