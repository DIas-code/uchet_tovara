-- =============================================================
-- 0002_rls.sql — Row Level Security (изоляция бутиков)
-- Применять ПОСЛЕ 0001_init.sql
--
-- Смысл: пользователь физически не может прочитать или изменить
-- данные чужого бутика — проверка на уровне PostgreSQL, а не только
-- в коде приложения.
-- =============================================================

alter table public.boutiques enable row level security;
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.movements enable row level security;

-- -------------------------------------------------------------
-- boutiques: пользователь видит только свой бутик.
-- Создание/удаление бутиков — только через service_role (владелец),
-- поэтому INSERT/UPDATE/DELETE-политик для обычных пользователей нет.
-- -------------------------------------------------------------
drop policy if exists boutiques_select_own on public.boutiques;
create policy boutiques_select_own on public.boutiques
  for select using (id = public.current_boutique_id());

-- -------------------------------------------------------------
-- profiles: пользователь видит только свой профиль.
-- -------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

-- -------------------------------------------------------------
-- products: полный CRUD, но строго в пределах своего бутика.
-- WITH CHECK гарантирует, что нельзя записать чужой boutique_id.
-- -------------------------------------------------------------
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select using (boutique_id = public.current_boutique_id());

drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert with check (boutique_id = public.current_boutique_id());

drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update using (boutique_id = public.current_boutique_id())
  with check (boutique_id = public.current_boutique_id());

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete using (boutique_id = public.current_boutique_id());

-- -------------------------------------------------------------
-- movements: журнал операций. Только чтение и добавление
-- в пределах своего бутика. Записи неизменяемы (нет UPDATE/DELETE) —
-- корректировки делаются встречной операцией (возврат и т.п.).
-- -------------------------------------------------------------
drop policy if exists movements_select on public.movements;
create policy movements_select on public.movements
  for select using (boutique_id = public.current_boutique_id());

drop policy if exists movements_insert on public.movements;
create policy movements_insert on public.movements
  for insert with check (boutique_id = public.current_boutique_id());
