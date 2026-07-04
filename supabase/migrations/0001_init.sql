-- =============================================================
-- 0001_init.sql — таблицы, функция определения бутика
-- Применять в Supabase: SQL Editor → New query → вставить → Run
-- =============================================================

-- Для gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Бутики (арендаторы). Каждый бутик — изолированное пространство.
-- -------------------------------------------------------------
create table if not exists public.boutiques (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Профили пользователей: связь аккаунта (auth.users) с бутиком и ролью.
-- Один пользователь принадлежит ровно одному бутику.
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  boutique_id uuid not null references public.boutiques(id) on delete cascade,
  role        text not null default 'seller' check (role in ('admin', 'seller')),
  full_name   text,
  created_at  timestamptz not null default now()
);
create index if not exists profiles_boutique_id_idx on public.profiles(boutique_id);

-- -------------------------------------------------------------
-- Функция: id бутика текущего пользователя.
-- SECURITY DEFINER — чтобы читать profiles в обход RLS.
-- Используется в DEFAULT колонок и в RLS-политиках.
-- -------------------------------------------------------------
create or replace function public.current_boutique_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select boutique_id from public.profiles where id = auth.uid();
$$;

-- -------------------------------------------------------------
-- Товары. boutique_id заполняется автоматически из профиля.
-- Код уникален В ПРЕДЕЛАХ бутика (у разных бутиков коды могут совпадать).
-- -------------------------------------------------------------
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  boutique_id    uuid not null default public.current_boutique_id()
                 references public.boutiques(id) on delete cascade,
  code           text not null,
  name           text,
  category       text,
  stock          int not null default 0 check (stock >= 0),
  sale_price     numeric(10, 2) not null check (sale_price >= 0),
  purchase_price numeric(10, 2) check (purchase_price >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (boutique_id, code)
);
create index if not exists products_boutique_id_idx on public.products(boutique_id);

-- -------------------------------------------------------------
-- Движения товара: приход / продажа / возврат (журнал операций).
-- boutique_id и created_by заполняются автоматически.
-- -------------------------------------------------------------
create table if not exists public.movements (
  id          uuid primary key default gen_random_uuid(),
  boutique_id uuid not null default public.current_boutique_id()
              references public.boutiques(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  type        text not null check (type in ('приход', 'продажа', 'возврат')),
  quantity    int not null check (quantity > 0),
  date        date not null default current_date,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists movements_boutique_id_idx on public.movements(boutique_id);
create index if not exists movements_product_id_idx on public.movements(product_id);
