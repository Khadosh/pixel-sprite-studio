-- Incremento atómico del uso diario de IA (public.increment_ai_usage).
--
-- Reemplaza el patrón "SELECT call_count → llamar al modelo → UPSERT" de las
-- Edge Functions, que permitía superar el límite diario con peticiones
-- concurrentes (todas leían el mismo valor antes de que alguna escribiera).
--
-- Contrato de public.increment_ai_usage(p_user_id uuid, p_limit int) returns int:
--   * Si el usuario todavía tiene cupo hoy (UTC), incrementa call_count en UNA
--     sola sentencia (INSERT ... ON CONFLICT DO UPDATE ... WHERE call_count < p_limit)
--     y devuelve el nuevo contador (1..p_limit).
--   * Si ya alcanzó p_limit, NO incrementa y devuelve -1.
--     Decisión: se devuelve -1 en lugar de lanzar excepción para que el llamador
--     (supabase-js .rpc desde la Edge Function) distinga "sin cupo" de un error
--     real de base de datos sin tener que parsear mensajes ni SQLSTATE. Además
--     el contador nunca queda por encima del límite.
--   * p_limit <= 0 o p_user_id nulo devuelven -1 sin escribir nada.
--
-- Atomicidad: ON CONFLICT DO UPDATE bloquea la fila en conflicto y re-evalúa la
-- condición WHERE sobre la versión más reciente de la fila, de modo que N
-- llamadas concurrentes nunca superan p_limit (verificado con 15 llamadas en
-- paralelo y p_limit = 10: exactamente 10 devuelven un contador positivo).

-- 1. Garantía de unicidad en (user_id, usage_date).
--    Ya existe como PRIMARY KEY (user_ai_usage_pkey); se agrega de forma
--    idempotente por si el esquema de algún entorno divergió.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    where i.indrelid = 'public.user_ai_usage'::regclass
      and i.indisunique
      and (
        select array_agg(a.attname::text order by a.attname)
        from pg_attribute a
        where a.attrelid = i.indrelid
          and a.attnum = any (i.indkey)
      ) = array['usage_date', 'user_id']
  ) then
    alter table public.user_ai_usage
      add constraint user_ai_usage_user_id_usage_date_key unique (user_id, usage_date);
  end if;
end
$$;

-- 2. Función atómica.
create or replace function public.increment_ai_usage(p_user_id uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_user_id is null or p_limit is null or p_limit <= 0 then
    return -1;
  end if;

  insert into public.user_ai_usage as u (user_id, usage_date, call_count, updated_at)
  values (p_user_id, (now() at time zone 'utc')::date, 1, now())
  on conflict (user_id, usage_date) do update
    set call_count = u.call_count + 1,
        updated_at = now()
    where u.call_count < p_limit
  returning u.call_count into v_count;

  -- Sin fila devuelta => la condición WHERE falló => cupo agotado.
  return coalesce(v_count, -1);
end;
$$;

comment on function public.increment_ai_usage(uuid, int) is
  'Incrementa atómicamente el uso diario de IA del usuario. Devuelve el nuevo contador o -1 si ya alcanzó p_limit. Solo service_role.';

-- 3. Solo el service role (Edge Functions) puede ejecutarla.
revoke execute on function public.increment_ai_usage(uuid, int) from public, anon, authenticated;
grant execute on function public.increment_ai_usage(uuid, int) to service_role;
