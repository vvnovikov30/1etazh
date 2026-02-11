# 1etazh (локальный тест)

## Запуск
```bash
npm install
npm run dev
```

Открой: http://localhost:3000

## Переменные окружения и секреты
Все пароли, токены, ключи и ID хранятся только в `.env.local` (локальный файл, не коммитится).

Скопируйте шаблон:
```bash
cp .env.example .env.local
```

Заполните значения:
- `TELEGRAM_LEADS_BOT_TOKEN`
- `TELEGRAM_LEADS_CHAT_ID`
- `TELEGRAM_LEADS_MESSAGE_THREAD_ID` (опционально)
- `TELEGRAM_DISCUSSION_BOT_TOKEN`
- `TELEGRAM_DISCUSSION_CHAT_ID`
- `TELEGRAM_DISCUSSION_MESSAGE_THREAD_ID` (опционально)

## Контакты (константы)
`lib/links.ts` — Telegram (чат), Telegram-канал, телефон.

## Генерация контент-манифестов

Проект использует автогенерацию манифестов для каруселей шоурума и блога. После добавления новых фото или статей нужно запустить генерацию.

### Запуск генерации
```bash
npm run content:gen
```

Этот скрипт:
1. Сканирует `public/showroom/<category>/*` и генерирует `lib/showroom.generated.ts`
2. Сканирует `content/blog/*.mdx` и генерирует `lib/blog.generated.ts`

### Добавление фото в шоурум

1. Поместите изображения в соответствующие категории:
   - `public/showroom/exterior/` — фасад и внешний вид
   - `public/showroom/interior/` — интерьер
   - `public/showroom/kitchen/` — кухня-гостиная
   - `public/showroom/bathroom/` — санузел
   - `public/showroom/bedroom/` — спальня
   - `public/showroom/engineering/` — инженерия и котельная
   - `public/showroom/plan/` — планировка
   - `public/showroom/landscape/` — участок
   - `public/showroom/misc/` — прочее

2. Поддерживаемые форматы: `.jpg`, `.jpeg`, `.png`, `.webp`

3. Alt и caption генерируются автоматически по категории. Для переопределения создайте файл `content/showroom.overrides.json`.

4. Запустите генерацию: `npm run content:gen`

### Showroom overrides

Файл `content/showroom.overrides.json` позволяет настроить метаданные для конкретных фото. Поддерживаются следующие поля:

- `tags` (массив строк) — теги-фичи, из которых автоматически генерируются alt и caption
- `blogSlug` (строка) — slug статьи блога, связанной с фото (появляется ссылка "Подробнее →")
- `alt` (строка) — явно заданный alt-текст (приоритет над автогенерацией)
- `caption` (строка) — явно заданная подпись (приоритет над автогенерацией)

#### Правила приоритета генерации alt/caption:

1. **Если в override заданы `alt` или `caption` явно** — используются они
2. **Иначе если в override заданы `tags`** — alt и caption генерируются автоматически из тегов
3. **Иначе** — используются дефолтные значения по категории

**Важно:** `tags` из override полностью заменяют дефолтные теги (не мерджатся).

#### Примеры использования:

**Только теги (автогенерация alt/caption):**
```json
{
  "/showroom/engineering/ventilation.jpg": {
    "tags": ["ventilation", "recuperation", "fresh-air"],
    "blogSlug": "ventilyaciya-svezhest-chistota"
  }
}
```

Результат:
- `caption`: "Вентиляция • Рекуперация"
- `alt`: "Шоурум одноэтажного дома: инженерия — комфортный воздухообмен без духоты; свежий воздух без потерь тепла."
- В карусели появится ссылка "Подробнее →" на `/blog/ventilyaciya-svezhest-chistota`

**Явные alt/caption:**
```json
{
  "/showroom/kitchen/photo.jpg": {
    "alt": "Кастомный alt текст",
    "caption": "Кастомная подпись",
    "tags": ["кухня", "интерьер"]
  }
}
```

**Связь фото → статья:**
```json
{
  "/showroom/engineering/foundation.jpg": {
    "tags": ["foundation", "slab", "waterproofing"],
    "blogSlug": "fundament-ustoychivost-bez-promerzaniya"
  }
}
```

#### Поддерживаемые теги-фичи:

- `ventilation` — Вентиляция
- `recuperation` — Рекуперация
- `fresh-air` — Свежий воздух
- `foundation` — Фундамент
- `slab` — Плита
- `waterproofing` — Гидроизоляция
- `insulation` — Утепление
- `thermal-bridge` — Мостики холода
- `energy-saving` — Энергосбережение

Теги должны быть на английском языке, slug-friendly (латиница, дефисы).

### Добавление статьи в блог

1. Создайте файл `content/blog/<slug>.mdx` с обязательным frontmatter:
   ```mdx
   ---
   title: "Заголовок статьи"
   description: "Краткое описание"
   date: 2026-02-09
   tags:
     - тег1
     - тег2
   cover: "/path/to/cover.jpg"  # опционально
   intent: "опциональное поле"   # опционально
   ---

   # Содержание статьи
   ```

2. Обязательные поля: `title`, `description`, `date`
3. Опциональные поля: `tags` (массив), `cover` (строка), `intent` (строка)
4. Запустите генерацию: `npm run content:gen`

### Использование компонента Figure

Компонент `Figure` автоматически определяет alt/caption для изображений из шоурума:

```tsx
import { Figure } from "@/components/Figure";

// Автоматически определит alt/caption по категории
<Figure src="/showroom/kitchen/photo.jpg" />

// Можно переопределить
<Figure 
  src="/showroom/kitchen/photo.jpg" 
  alt="Кастомный alt"
  caption="Кастомная подпись"
/>
```
