-- =============================================================
-- 0003_movement_trigger.sql — пересчёт остатка и updated_at
-- Применять ПОСЛЕ 0002_rls.sql
-- =============================================================

-- -------------------------------------------------------------
-- Автообновление updated_at при изменении товара.
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- Пересчёт остатка товара при добавлении движения.
-- Всё в одной транзакции: если остаток уходит в минус — вся
-- операция откатывается (движение не сохраняется).
-- FOR UPDATE блокирует строку товара, исключая гонки при
-- одновременных продажах.
-- -------------------------------------------------------------
create or replace function public.apply_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_stock int;
  delta     int;
begin
  -- приход и возврат увеличивают остаток, продажа уменьшает
  if new.type in ('приход', 'возврат') then
    delta := new.quantity;
  else
    delta := -new.quantity;
  end if;

  -- берём остаток строго в том же бутике, что и движение
  select stock into cur_stock
  from public.products
  where id = new.product_id
    and boutique_id = new.boutique_id
  for update;

  if not found then
    raise exception 'Товар не найден в этом бутике';
  end if;

  if cur_stock + delta < 0 then
    raise exception 'Недостаточно товара на складе: остаток %, запрошено %',
      cur_stock, new.quantity;
  end if;

  update public.products
  set stock = cur_stock + delta
  where id = new.product_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_movement on public.movements;
create trigger trg_apply_movement
  after insert on public.movements
  for each row execute function public.apply_movement();
