import { useI18n } from '@/lib/i18n'
import LanguagePicker from '@/components/LanguagePicker'
import MusicToggle from '@/components/MusicToggle'

/**
 * Banner — top header strip shown above every view.
 * Top-left:   Music control
 * Center:     "KOKORO 心" wordmark
 * Top-right:  Language picker
 *
 * Note: no Exit button. Telegram already provides its own close affordance
 * in the Mini App chrome, so a second one is redundant and easy to misfire.
 */
export default function Banner() {
  const { t } = useI18n()
  return (
    <header className="banner">
      <MusicToggle />
      <div className="banner__inner">
        <span className="banner__title">{t.bannerTitle}</span>
        <span className="banner__kanji" aria-hidden="true">
          心
        </span>
      </div>
      <LanguagePicker />
    </header>
  )
}
