import { useI18n } from '@/lib/i18n'
import ExitButton from '@/components/ExitButton'
import LanguagePicker from '@/components/LanguagePicker'
import MusicToggle from '@/components/MusicToggle'

/**
 * Banner — top header strip shown above every view.
 * Top-left:   Exit (close / sign-out)
 * Top-left+:  Music control (next to Exit)
 * Center:     "KOKORO 心" wordmark
 * Top-right:  Language picker
 */
export default function Banner() {
  const { t } = useI18n()
  return (
    <header className="banner">
      <ExitButton />
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
