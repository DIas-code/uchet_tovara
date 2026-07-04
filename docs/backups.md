# Надёжность БД и бэкапы

Два автоматических процесса через GitHub Actions (бесплатно).

## 1. Keep-alive (чтобы база не засыпала)

Файл: `.github/workflows/keep-alive.yml`

Бесплатный Supabase ставит проект на паузу после 7 дней без обращений.
Экшен раз в сутки пингует прод — запрос доходит до Supabase и сбрасывает счётчик.
**Секреты не нужны.** Работает сразу после первого пуша в GitHub.

> Если сменишь адрес приложения — поправь URL в `keep-alive.yml`.

## 2. Ежедневный бэкап данных

Файл: `.github/workflows/backup.yml`

Раз в сутки делает дамп данных (`supabase db dump --data-only`) и сохраняет его
как **артефакт** запуска (хранится 30 дней). Схема БД в бэкапе не нужна — она
лежит в `supabase/migrations/`.

### Разовая настройка (1 секрет)

1. Supabase → **Project Settings → Database → Connection string → URI**.
   Скопировать строку вида
   `postgresql://postgres:ПАРОЛЬ@db.xxxx.supabase.co:5432/postgres`
   (вместо `ПАРОЛЬ` — пароль БД, который задавали при создании проекта).
2. GitHub → репозиторий → **Settings → Secrets and variables → Actions →
   New repository secret**.
   - Name: `SUPABASE_DB_URL`
   - Secret: строка из шага 1
3. Готово. Первый бэкап можно запустить вручную: вкладка **Actions → backup →
   Run workflow**.

### Скачать бэкап

GitHub → **Actions → backup → нужный запуск → Artifacts → backup-YYYY-MM-DD**.

### Восстановление

1. Создать чистый проект Supabase, применить миграции `supabase/migrations/*.sql`
   по порядку (схема).
2. Загрузить данные из дампа:
   `psql "postgresql://postgres:ПАРОЛЬ@db.xxxx.supabase.co:5432/postgres" -f backup-data.sql`

## Что ещё делает надёжность

- Остатки пересчитываются триггером в транзакции — рассинхронизации нет.
- RLS изолирует бутики на уровне БД.
- Схема — в git (миграции), поэтому воспроизводима в любой момент.
