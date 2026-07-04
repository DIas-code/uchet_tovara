-- =============================================================
-- 0005_categories.sql — категории как отдельная сущность
-- Применять ПОСЛЕ 0004 (или после 0003, если 0004 не применяли).
--
-- Категория уникальна В ПРЕДЕЛАХ бутика: unique (boutique_id, name).
-- У товара — ссылка category_id на категорию.
-- Миграция аддитивная и безопасная: старую колонку products.category
-- НЕ удаляем (можно убрать позже отдельной миграцией).
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Категории бутика. boutique_id подставляется автоматически.
-- -------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  boutique_id uuid not null default public.current_boutique_id()
              references public.boutiques(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (boutique_id, name)
);
create index if not exists categories_boutique_id_idx
  on public.categories(boutique_id);

alter table public.categories enable row level security;

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select using (boutique_id = public.current_boutique_id());

drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories
  for insert with check (boutique_id = public.current_boutique_id());

drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories
  for update using (boutique_id = public.current_boutique_id())
  with check (boutique_id = public.current_boutique_id());

drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories
  for delete using (boutique_id = public.current_boutique_id());

-- -------------------------------------------------------------
-- Ссылка товара на категорию. При удалении категории — товар
-- становится «без категории» (category_id = null).
-- -------------------------------------------------------------
alter table public.products
  add column if not exists category_id uuid
  references public.categories(id) on delete set null;
create index if not exists products_category_id_idx
  on public.products(category_id);

-- -------------------------------------------------------------
-- Перенос уже введённых текстовых категорий в новую таблицу
-- и привязка товаров.
-- -------------------------------------------------------------
insert into public.categories (boutique_id, name)
select distinct boutique_id, btrim(category)
from public.products
where category is not null and btrim(category) <> ''
on conflict (boutique_id, name) do nothing;

update public.products p
set category_id = c.id
from public.categories c
where c.boutique_id = p.boutique_id
  and c.name = btrim(p.category)
  and p.category is not null
  and p.category_id is null;
