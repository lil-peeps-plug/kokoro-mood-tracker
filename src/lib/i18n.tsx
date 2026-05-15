import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// ============================================================
//  Kokoro — tiny in-house i18n
//  ----------------------------------------------------------
//  Three supported locales: English, Russian, Georgian.
//  Strings are typed so every key is checked at compile time.
//  Persisted to localStorage; falls back to navigator.language.
// ============================================================

export type Locale = 'en' | 'ru' | 'ka'

const STORAGE_KEY = 'kokoro:locale'

export const LOCALES: ReadonlyArray<{
  code: Locale
  label: string
  short: string
}> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'ka', label: 'ქართული', short: 'KA' },
]

interface Strings {
  loading: string
  loadingQuote: string
  errorTelegramOnly: string

  bannerTitle: string

  logTitle: string
  logSubtitle: string
  logPick: string
  logScoreLabels: Record<1 | 2 | 3 | 4 | 5, string>
  logNotePlaceholder: string
  logSave: string
  logUpdate: string
  logEdit: string
  logSaving: string
  logSaved: string
  logThanksTitle: string
  logThanksBody: string
  logThanksReminder: string
  logAlreadyTitle: string
  logAlreadyBody: string
  logCountdownLabel: string

  slotLabels: Record<'morning' | 'afternoon' | 'night', string>
  slotEmpty: string

  statsTitle: string
  statsSubtitle: string
  statsStub: string

  statsRangeLabel: string
  statsRange7d: string
  statsRange30d: string
  statsRangeAll: string

  statsAverage: string
  statsStreak: string
  statsTotal: string

  statsTrend: string
  statsDistribution: string
  statsCalendar: string
  statsCalendarLow: string
  statsCalendarHigh: string
  statsHistory: string
  statsHistoryEmpty: string

  statsExportPdf: string
  statsExporting: string
  statsReportLabel: string
  statsFooterLine: string
  statsError: string

  tabLog: string
  tabStats: string

  devLoginTitle: string
  devLoginHint: string
  devLoginEmail: string
  devLoginPassword: string
  devLoginSubmit: string
  devLoginSubmitting: string

  languageMenuLabel: string

  musicPlay: string
  musicPause: string
  musicVolume: string
  musicLegal: string
  musicSource: string

  exit: string
  exitConfirm: string

  aboutTitle: string
  aboutBody: string
  aboutDontShow: string
  aboutOk: string

  legalLink: string
  legalTitle: string
  legalUpdated: string
  legalDismiss: string

  errorBoundary: string
  errorRetry: string
}

const en: Strings = {
  loading: 'Loading…',
  loadingQuote: 'Everything will be okay',
  errorTelegramOnly: 'This app must be opened inside Telegram.',
  bannerTitle: 'KOKORO',
  logTitle: 'How are you, today?',
  logSubtitle:
    'Tap a number. The middle is steady — left is heavier, right is lighter.',
  logPick: 'Pick a number',
  logScoreLabels: {
    1: 'rough',
    2: 'low',
    3: 'okay',
    4: 'good',
    5: 'great',
  },
  logNotePlaceholder: 'A short note (optional)',
  logSave: 'Save mood',
  logUpdate: 'Update mood',
  logEdit: 'Edit mood',
  logSaving: 'Saving…',
  logSaved: 'Saved ✓',
  logThanksTitle: 'Thank you ♡',
  logThanksBody: 'Your mood was saved.',
  logThanksReminder: 'Remember, you matter!',
  logAlreadyTitle: 'See you tomorrow ♡',
  logAlreadyBody: "You've logged all three check-ins for today.",
  logCountdownLabel: 'New day in',
  slotLabels: {
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
  },
  slotEmpty: 'Not yet',
  statsTitle: 'Your story so far',
  statsSubtitle:
    'Averages, streaks, charts, and an option to export everything to PDF.',
  statsStub: 'Charts and stats arrive in the next phase. PDF export soon after.',
  statsRangeLabel: 'Range',
  statsRange7d: '7 days',
  statsRange30d: '30 days',
  statsRangeAll: 'All',
  statsAverage: 'Average',
  statsStreak: 'Streak',
  statsTotal: 'Total',
  statsTrend: 'Mood over time',
  statsDistribution: 'Distribution',
  statsCalendar: 'Calendar',
  statsCalendarLow: 'Low',
  statsCalendarHigh: 'High',
  statsHistory: 'History',
  statsHistoryEmpty: 'No entries for this range yet.',
  statsExportPdf: 'Export PDF',
  statsExporting: 'Exporting…',
  statsReportLabel: 'Mood report',
  statsFooterLine: 'Made with love · Kokoro',
  statsError: "Couldn't load your stats",
  tabLog: 'Log',
  tabStats: 'Stats',
  devLoginTitle: 'Dev sign-in',
  devLoginHint:
    "Telegram isn't available in this browser. Sign in with a Supabase user you created manually in Authentication → Users.",
  devLoginEmail: 'Email',
  devLoginPassword: 'Password',
  devLoginSubmit: 'Sign in',
  devLoginSubmitting: 'Signing in…',
  languageMenuLabel: 'Language',
  musicPlay: 'Play music',
  musicPause: 'Pause music',
  musicVolume: 'Volume',
  musicLegal:
    'Audio streamed via the YouTube IFrame Player. All audio rights belong to their respective owners; Kokoro claims none. Use of the embed is subject to the YouTube Terms of Service and Google Privacy Policy.',
  musicSource: 'Source on YouTube',
  exit: 'Exit',
  exitConfirm: 'Close Kokoro?',
  aboutTitle: 'About Kokoro',
  aboutBody:
    'Kokoro 心 is a quiet mood diary, made with care by Egor for our small circle.\n\nHow it works: tap a number 1–5 to log how you feel, then add a short note if you’d like. Stats show your averages, streaks, and patterns over time — export everything as a PDF whenever you want a keepsake.\n\nMusic streamed via YouTube.',
  aboutDontShow: 'Don’t show this again',
  aboutOk: 'OK',
  legalLink: 'Privacy & terms',
  legalTitle: 'Privacy & terms',
  legalUpdated: 'Last updated',
  legalDismiss: 'Close',
  errorBoundary: 'Something quietly went wrong. The error is logged.',
  errorRetry: 'Try again',
}

const ru: Strings = {
  loading: 'Загрузка…',
  loadingQuote: 'Всё будет хорошо',
  errorTelegramOnly: 'Это приложение нужно открывать внутри Telegram.',
  bannerTitle: 'KOKORO',
  logTitle: 'Как ты сегодня?',
  logSubtitle:
    'Выбери число. Середина — ровно, левее — тяжелее, правее — легче.',
  logPick: 'Выбери число',
  logScoreLabels: {
    1: 'тяжело',
    2: 'низко',
    3: 'ровно',
    4: 'хорошо',
    5: 'отлично',
  },
  logNotePlaceholder: 'Короткая заметка (необязательно)',
  logSave: 'Сохранить',
  logUpdate: 'Обновить',
  logEdit: 'Изменить',
  logSaving: 'Сохраняю…',
  logSaved: 'Сохранено ✓',
  logThanksTitle: 'Спасибо ♡',
  logThanksBody: 'Настроение сохранено.',
  logThanksReminder: 'Помни — ты важен!',
  logAlreadyTitle: 'До завтра ♡',
  logAlreadyBody: 'Все три отметки на сегодня сделаны.',
  logCountdownLabel: 'Новый день через',
  slotLabels: {
    morning: 'Утро',
    afternoon: 'День',
    night: 'Вечер',
  },
  slotEmpty: 'Пока нет',
  statsTitle: 'Твоя история',
  statsSubtitle:
    'Средние, серии, графики и экспорт в PDF.',
  statsStub:
    'Графики и статистика появятся в следующей фазе. Экспорт PDF — после.',
  statsRangeLabel: 'Период',
  statsRange7d: '7 дней',
  statsRange30d: '30 дней',
  statsRangeAll: 'Всё',
  statsAverage: 'Среднее',
  statsStreak: 'Серия',
  statsTotal: 'Всего',
  statsTrend: 'Настроение по дням',
  statsDistribution: 'Распределение',
  statsCalendar: 'Календарь',
  statsCalendarLow: 'Низко',
  statsCalendarHigh: 'Высоко',
  statsHistory: 'История',
  statsHistoryEmpty: 'Пока нет записей за этот период.',
  statsExportPdf: 'Экспорт в PDF',
  statsExporting: 'Сохраняю…',
  statsReportLabel: 'Отчёт настроения',
  statsFooterLine: 'Сделано с любовью · Kokoro',
  statsError: 'Не удалось загрузить статистику',
  tabLog: 'Лог',
  tabStats: 'Стат',
  devLoginTitle: 'Вход (dev)',
  devLoginHint:
    'Telegram недоступен в этом браузере. Войди под пользователем Supabase, созданным вручную в Authentication → Users.',
  devLoginEmail: 'Email',
  devLoginPassword: 'Пароль',
  devLoginSubmit: 'Войти',
  devLoginSubmitting: 'Вхожу…',
  languageMenuLabel: 'Язык',
  musicPlay: 'Включить музыку',
  musicPause: 'Выключить музыку',
  musicVolume: 'Громкость',
  musicLegal:
    'Аудио воспроизводится через YouTube IFrame Player. Все права на аудио принадлежат их владельцам; Kokoro не претендует ни на одно из них. Использование плеера регулируется условиями YouTube и политикой конфиденциальности Google.',
  musicSource: 'Источник на YouTube',
  exit: 'Выход',
  exitConfirm: 'Закрыть Kokoro?',
  aboutTitle: 'О Kokoro',
  aboutBody:
    'Kokoro 心 — тихий дневник настроения, созданный с заботой Егором для нашего маленького круга.\n\nКак это работает: выбери число от 1 до 5, чтобы отметить своё состояние, и оставь короткую заметку, если хочешь. Вкладка «Stats» покажет средние, серии и закономерности — экспортируй всё в PDF, когда захочется сохранить.\n\nМузыка воспроизводится через YouTube.',
  aboutDontShow: 'Больше не показывать',
  aboutOk: 'ОК',
  legalLink: 'Конфиденциальность',
  legalTitle: 'Конфиденциальность и условия',
  legalUpdated: 'Обновлено',
  legalDismiss: 'Закрыть',
  errorBoundary: 'Что-то пошло не так. Ошибка записана.',
  errorRetry: 'Попробовать снова',
}

const ka: Strings = {
  loading: 'იტვირთება…',
  loadingQuote: 'ყველაფერი კარგად იქნება',
  errorTelegramOnly: 'ეს აპლიკაცია უნდა გაიხსნას Telegram-ში.',
  bannerTitle: 'KOKORO',
  logTitle: 'როგორ ხარ დღეს?',
  logSubtitle:
    'აირჩიე ციფრი. შუა — სტაბილური, მარცხნივ — მძიმე, მარჯვნივ — მსუბუქი.',
  logPick: 'აირჩიე ციფრი',
  logScoreLabels: {
    1: 'მძიმე',
    2: 'დაბალი',
    3: 'საშუალო',
    4: 'კარგი',
    5: 'შესანიშნავი',
  },
  logNotePlaceholder: 'მოკლე ჩანაწერი (არასავალდებულო)',
  logSave: 'შენახვა',
  logUpdate: 'განახლება',
  logEdit: 'რედაქტირება',
  logSaving: 'ვინახავ…',
  logSaved: 'შენახულია ✓',
  logThanksTitle: 'გმადლობთ ♡',
  logThanksBody: 'თქვენი განწყობა შენახულია.',
  logThanksReminder: 'გახსოვდე, შენ მნიშვნელოვანი ხარ!',
  logAlreadyTitle: 'ხვალამდე ♡',
  logAlreadyBody: 'სამივე ჩანაწერი დღევანდელი დასრულდა.',
  logCountdownLabel: 'ახალი დღე იწყება',
  slotLabels: {
    morning: 'დილა',
    afternoon: 'შუადღე',
    night: 'საღამო',
  },
  slotEmpty: 'ჯერ არა',
  statsTitle: 'შენი ისტორია',
  statsSubtitle: 'საშუალოები, სერიები, გრაფიკები და PDF ექსპორტი.',
  statsStub: 'გრაფიკები მომდევნო ფაზაში. PDF ექსპორტი მალე.',
  statsRangeLabel: 'პერიოდი',
  statsRange7d: '7 დღე',
  statsRange30d: '30 დღე',
  statsRangeAll: 'ყველა',
  statsAverage: 'საშუალო',
  statsStreak: 'სერია',
  statsTotal: 'სულ',
  statsTrend: 'განწყობა დროში',
  statsDistribution: 'განაწილება',
  statsCalendar: 'კალენდარი',
  statsCalendarLow: 'დაბალი',
  statsCalendarHigh: 'მაღალი',
  statsHistory: 'ისტორია',
  statsHistoryEmpty: 'ამ პერიოდისთვის ჯერ ჩანაწერი არ არის.',
  statsExportPdf: 'PDF ექსპორტი',
  statsExporting: 'ვინახავ…',
  statsReportLabel: 'განწყობის ანგარიში',
  statsFooterLine: 'სიყვარულით · Kokoro',
  statsError: 'სტატისტიკა ვერ ჩაიტვირთა',
  tabLog: 'ლოგი',
  tabStats: 'სტატ',
  devLoginTitle: 'Dev შესვლა',
  devLoginHint:
    'Telegram მიუწვდომელია ბრაუზერში. შედი Supabase მომხმარებლით, რომელიც ხელით შექმენი Authentication → Users-ში.',
  devLoginEmail: 'ელფოსტა',
  devLoginPassword: 'პაროლი',
  devLoginSubmit: 'შესვლა',
  devLoginSubmitting: 'შესვლა…',
  languageMenuLabel: 'ენა',
  musicPlay: 'ჩართე მუსიკა',
  musicPause: 'გათიშე მუსიკა',
  musicVolume: 'ხმის სიმაღლე',
  musicLegal:
    'აუდიო ნაკადი მიეწოდება YouTube IFrame Player-ით. ყველა აუდიო უფლება ეკუთვნის შესაბამის მფლობელებს; Kokoro არცერთს არ აცხადებს. გამოყენება ექვემდებარება YouTube-ის პირობებსა და Google-ის კონფიდენციალურობის პოლიტიკას.',
  musicSource: 'წყარო YouTube-ზე',
  exit: 'გასვლა',
  exitConfirm: 'დახუროთ Kokoro?',
  aboutTitle: 'Kokoro-ს შესახებ',
  aboutBody:
    'Kokoro 心 არის წყნარი განწყობის დღიური, შექმნილი მზრუნველობით ეგორის მიერ ჩვენი პატარა წრისთვის.\n\nროგორ მუშაობს: დააჭირე ციფრს 1-დან 5-მდე განწყობის ჩასაწერად და დაამატე მოკლე ჩანაწერი, თუ გინდა. სტატისტიკა აჩვენებს საშუალოს, სერიებს და ტენდენციებს — ექსპორტი PDF-ში ნებისმიერ დროს.\n\nმუსიკა YouTube-ის მეშვეობით.',
  aboutDontShow: 'აღარ მაჩვენო',
  aboutOk: 'ოკ',
  legalLink: 'კონფიდენციალურობა',
  legalTitle: 'კონფიდენციალურობა და პირობები',
  legalUpdated: 'განახლდა',
  legalDismiss: 'დახურვა',
  errorBoundary: 'რაღაც წყნარად შეფერხდა. შეცდომა აღრიცხულია.',
  errorRetry: 'სცადე ხელახლა',
}

const DICTS: Record<Locale, Strings> = { en, ru, ka }

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Strings
}

const I18nContext = createContext<I18nValue | null>(null)

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  // 1. Highest priority — the URL ?lang= param. The Telegram bot's
  //    /start welcome message has three inline web_app buttons; each
  //    opens the Mini App with ?lang=en|ru|ka so the user's first
  //    paint is already in their chosen language. We also persist
  //    the pick so subsequent loads remember it.
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('lang')
    if (fromUrl === 'en' || fromUrl === 'ru' || fromUrl === 'ka') {
      try {
        window.localStorage.setItem(STORAGE_KEY, fromUrl)
      } catch {
        /* localStorage blocked */
      }
      return fromUrl
    }
  } catch {
    /* URL parsing failed in some exotic webview — fall through */
  }

  // 2. Returning visit — what the user picked last time.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ru' || stored === 'ka') return stored
  } catch {
    /* localStorage blocked */
  }

  // 3. Hard default. We don't read navigator.language because the
  //    bot's welcome flow is the canonical entry point for new users.
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // Storage write blocked — ignore; state still updates in memory.
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: DICTS[locale] }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>')
  }
  return ctx
}
