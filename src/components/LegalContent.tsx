import type { Locale } from '@/lib/i18n'

// ============================================================
//  Privacy + Terms body content, per locale
// ============================================================
//  EN is the authoritative version. RU and KA are good-faith
//  translations of the same content. If anything diverges in
//  meaning, EN wins.
// ============================================================

interface Props {
  locale: Locale
}

export default function LegalContent({ locale }: Props) {
  if (locale === 'ru') return <BodyRu />
  if (locale === 'ka') return <BodyKa />
  return <BodyEn />
}

function BodyEn() {
  return (
    <>
      <section>
        <h3>Privacy notice</h3>
        <p>
          Kokoro is a small, private mood diary built for a circle of friends.
          It is not a commercial service.
        </p>

        <h4>What we collect</h4>
        <ul>
          <li>Your Telegram user ID, username, and first / last name (sent to us by Telegram when you open the Mini App)</li>
          <li>The mood scores (1–5) you choose</li>
          <li>Any short notes you write</li>
          <li>Timestamps of your entries</li>
          <li>Your chosen interface language (stored only in your browser)</li>
        </ul>
        <p>We do <strong>not</strong> collect profile photos, contacts, location, device sensors, or any browsing activity outside the app.</p>

        <h4>Where it is stored</h4>
        <ul>
          <li>Supabase PostgreSQL, EU region (Ireland)</li>
          <li>Row-Level Security: by default only you can read or write your own entries</li>
          <li>An administrator (Egor) has elevated access via a private admin panel</li>
        </ul>

        <h4>Third-party services</h4>
        <ul>
          <li><strong>Telegram WebApp SDK</strong> — sign-in</li>
          <li><strong>YouTube IFrame Player</strong> — ambient music. Subject to YouTube's Terms and Google's Privacy Policy. All audio rights belong to the respective owners; Kokoro claims none</li>
          <li><strong>Supabase</strong> — authentication, database, Edge Functions</li>
          <li><strong>Vercel</strong> — hosts the static frontend</li>
        </ul>

        <h4>Cookies &amp; local storage</h4>
        <p>Kokoro stores in your browser only: the Supabase session token, music preferences, selected language, and whether you've dismissed this welcome dialog. Clearing browser storage resets them.</p>

        <h4>Your rights</h4>
        <p>Message Egor on Telegram to see your data, delete some or all of your entries, or remove your account entirely.</p>

        <h4>Not medical advice</h4>
        <p>
          Kokoro is a personal reflection tool. Mood scores here are not
          diagnoses, and the app cannot replace professional support.
          If you are in crisis, please contact a qualified professional
          or a local crisis line:
        </p>
        <ul>
          <li>International — <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
          <li>EU 24/7 — 116 123</li>
          <li>United States — 988</li>
          <li>United Kingdom — 116 123</li>
        </ul>
      </section>

      <section>
        <h3>Terms of use</h3>
        <p>
          Kokoro is provided <strong>free of charge</strong> and
          <strong> as-is</strong>, with no warranty of any kind. It is
          intended for the invited members of a small private circle.
          You should be at least 13 years old (the Telegram minimum) —
          and 16 or older where local law (e.g. GDPR) requires it.
        </p>
        <p>Please don't try to access another user's entries, abuse the admin panel, or submit illegal, threatening, or harassing content.</p>
        <p>The author is not responsible for any loss of data, downtime, or damages arising from your use of the app.</p>
      </section>

      <section>
        <h3>Contact</h3>
        <p>For any privacy question or data request, message <strong>Egor</strong> on Telegram.</p>
      </section>
    </>
  )
}

function BodyRu() {
  return (
    <>
      <section>
        <h3>Уведомление о конфиденциальности</h3>
        <p>
          Kokoro — это небольшой личный дневник настроения, созданный для
          круга друзей. Это не коммерческий сервис.
        </p>

        <h4>Что мы собираем</h4>
        <ul>
          <li>Ваш Telegram ID, имя пользователя, имя и фамилию (передаёт Telegram при открытии Mini App)</li>
          <li>Оценки настроения (1–5), которые вы выбираете</li>
          <li>Короткие заметки, которые вы пишете</li>
          <li>Время ваших записей</li>
          <li>Выбранный язык интерфейса (хранится только в вашем браузере)</li>
        </ul>
        <p>Мы <strong>не</strong> собираем фотографии профиля, контакты, геолокацию, данные датчиков или активность в браузере вне приложения.</p>

        <h4>Где это хранится</h4>
        <ul>
          <li>Supabase PostgreSQL, регион ЕС (Ирландия)</li>
          <li>Row-Level Security: по умолчанию только вы можете читать и писать свои записи</li>
          <li>Администратор (Егор) имеет повышенный доступ через приватную админ-панель</li>
        </ul>

        <h4>Сторонние сервисы</h4>
        <ul>
          <li><strong>Telegram WebApp SDK</strong> — для входа</li>
          <li><strong>YouTube IFrame Player</strong> — для фоновой музыки. Подчиняется условиям YouTube и политике конфиденциальности Google. Все права на аудио принадлежат их владельцам; Kokoro не претендует ни на одно из них</li>
          <li><strong>Supabase</strong> — аутентификация, база данных, Edge Functions</li>
          <li><strong>Vercel</strong> — хостинг статического фронтенда</li>
        </ul>

        <h4>Cookie и локальное хранилище</h4>
        <p>В вашем браузере Kokoro хранит только: токен сессии Supabase, настройки музыки, выбранный язык и факт того, что вы закрыли это приветствие. Очистка хранилища браузера сбрасывает их.</p>

        <h4>Ваши права</h4>
        <p>Напишите Егору в Telegram, чтобы посмотреть свои данные, удалить часть или все записи или полностью удалить аккаунт.</p>

        <h4>Не медицинская помощь</h4>
        <p>
          Kokoro — инструмент личной рефлексии. Записанные здесь оценки
          не являются диагнозами, и приложение не заменяет
          профессиональную поддержку. Если вы в кризисе, обратитесь к
          квалифицированному специалисту или местной кризисной линии:
        </p>
        <ul>
          <li>Международная — <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
          <li>ЕС 24/7 — 116 123</li>
          <li>США — 988</li>
          <li>Великобритания — 116 123</li>
        </ul>
      </section>

      <section>
        <h3>Условия использования</h3>
        <p>
          Kokoro предоставляется <strong>бесплатно</strong> и
          <strong> «как есть»</strong>, без каких-либо гарантий. Приложение
          предназначено для приглашённых участников небольшого приватного
          круга. Вам должно быть не меньше 13 лет (минимум Telegram) — и
          16 лет, если этого требует местное законодательство (например, GDPR).
        </p>
        <p>Пожалуйста, не пытайтесь получить доступ к записям других пользователей, не злоупотребляйте админ-панелью и не отправляйте незаконный, угрожающий или оскорбительный контент.</p>
        <p>Автор не несёт ответственности за потерю данных, простой или ущерб, связанный с использованием приложения.</p>
      </section>

      <section>
        <h3>Контакты</h3>
        <p>По вопросам конфиденциальности и запросам по данным пишите <strong>Егору</strong> в Telegram.</p>
      </section>
    </>
  )
}

function BodyKa() {
  return (
    <>
      <section>
        <h3>კონფიდენციალურობის შენიშვნა</h3>
        <p>
          Kokoro არის პატარა, პირადი განწყობის დღიური, შექმნილი
          მეგობრების წრისთვის. ეს არ არის კომერციული სერვისი.
        </p>

        <h4>რას ვაგროვებთ</h4>
        <ul>
          <li>თქვენი Telegram ID, მომხმარებლის სახელი, სახელი და გვარი (გვაწვდის Telegram, როცა გახსნით Mini App-ს)</li>
          <li>განწყობის შეფასებები (1–5), რომელსაც ირჩევთ</li>
          <li>მოკლე ჩანაწერები, რომელსაც წერთ</li>
          <li>თქვენი ჩანაწერების დრო</li>
          <li>არჩეული ენა (ინახება მხოლოდ თქვენს ბრაუზერში)</li>
        </ul>
        <p>ჩვენ <strong>არ</strong> ვაგროვებთ პროფილის ფოტოებს, კონტაქტებს, ადგილმდებარეობას, მოწყობილობის სენსორებს ან აპლიკაციის გარეთ ბრაუზინგის აქტივობას.</p>

        <h4>სად ინახება</h4>
        <ul>
          <li>Supabase PostgreSQL, ევროკავშირის რეგიონი (ირლანდია)</li>
          <li>Row-Level Security: ნაგულისხმევად მხოლოდ თქვენ შეგიძლიათ წაიკითხოთ ან ჩაწეროთ თქვენი ჩანაწერები</li>
          <li>ადმინისტრატორს (ეგორი) აქვს გაფართოებული წვდომა პირადი ადმინ პანელის მეშვეობით</li>
        </ul>

        <h4>მესამე მხარის სერვისები</h4>
        <ul>
          <li><strong>Telegram WebApp SDK</strong> — შესვლისთვის</li>
          <li><strong>YouTube IFrame Player</strong> — ფონური მუსიკისთვის. ექვემდებარება YouTube-ის პირობებსა და Google-ის კონფიდენციალურობის პოლიტიკას. ყველა აუდიო უფლება ეკუთვნის შესაბამის მფლობელებს; Kokoro არცერთს არ აცხადებს</li>
          <li><strong>Supabase</strong> — აუთენტიფიკაცია, მონაცემთა ბაზა, Edge Functions</li>
          <li><strong>Vercel</strong> — სტატიკური ფრონტენდის ჰოსტინგი</li>
        </ul>

        <h4>ქუქი-ფაილები და ლოკალური მეხსიერება</h4>
        <p>თქვენს ბრაუზერში Kokoro ინახავს მხოლოდ: Supabase სესიის ტოკენს, მუსიკის პარამეტრებს, არჩეულ ენას და მისალმების ფანჯრის სტატუსს. ბრაუზერის მეხსიერების გასუფთავება მათ ანულირებს.</p>

        <h4>თქვენი უფლებები</h4>
        <p>დაუკავშირდით ეგორს Telegram-ში, რომ ნახოთ თქვენი მონაცემები, წაშალოთ ნაწილი ან ყველა ჩანაწერი, ან მთლიანად წაშალოთ ანგარიში.</p>

        <h4>არ არის სამედიცინო რჩევა</h4>
        <p>
          Kokoro არის პირადი რეფლექსიის ხელსაწყო. აქ ჩაწერილი განწყობის
          შეფასებები არ არის დიაგნოზი და აპლიკაცია ვერ ცვლის
          პროფესიონალურ მხარდაჭერას. თუ კრიზისულ მდგომარეობაში ხართ,
          დაუკავშირდით კვალიფიციურ სპეციალისტს ან ადგილობრივ კრიზისულ ხაზს:
        </p>
        <ul>
          <li>საერთაშორისო — <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
          <li>ევროკავშირი 24/7 — 116 123</li>
          <li>აშშ — 988</li>
          <li>დიდი ბრიტანეთი — 116 123</li>
          <li>საქართველო — 112</li>
        </ul>
      </section>

      <section>
        <h3>გამოყენების პირობები</h3>
        <p>
          Kokoro მოწოდებულია <strong>უფასოდ</strong> და
          <strong> «როგორც არის»</strong>, ყოველგვარი გარანტიის გარეშე.
          გათვალისწინებულია მცირე პირადი წრის მოწვეული წევრებისთვის. უნდა
          იყოთ მინიმუმ 13 წლის (Telegram-ის მინიმუმი) — ან 16, თუ ადგილობრივი
          კანონი ამას მოითხოვს.
        </p>
        <p>გთხოვთ, არ ცადოთ სხვა მომხმარებლის ჩანაწერებზე წვდომა, ნუ ბოროტად გამოიყენებთ ადმინ პანელს და ნუ გადააგზავნით უკანონო, საფრთხის შემცველ ან შემაშფოთებელ კონტენტს.</p>
        <p>ავტორი არ არის პასუხისმგებელი მონაცემთა დაკარგვაზე, შეფერხებებზე ან ზიანზე, რომელიც გამოწვეულია აპის გამოყენებით.</p>
      </section>

      <section>
        <h3>კონტაქტი</h3>
        <p>კონფიდენციალურობის ნებისმიერი შეკითხვის ან მონაცემთა მოთხოვნისთვის დაუკავშირდით <strong>ეგორს</strong> Telegram-ში.</p>
      </section>
    </>
  )
}
