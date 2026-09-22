-- Endurecimiento del esquema: unicidad de slug por usuario, updated_at con
-- trigger, tope de tamaño de asset_data y políticas RLS más eficientes.
-- Todas las sentencias son idempotentes (IF EXISTS / IF NOT EXISTS / OR REPLACE).

-- ---------------------------------------------------------------------------
-- 1. projects.slug: único POR USUARIO en lugar de global.
--    Verificado en local antes de aplicar: no había slugs duplicados por usuario
--    (select user_id, slug, count(*) from projects group by 1,2 having count(*) > 1).
--    Si un entorno tuviera duplicados, este ALTER falla y hay que resolverlos antes.
--
--    IMPORTANTE para el cliente: al crear/renombrar un proyecto con un slug que ya
--    usa el mismo usuario, Postgres devuelve el error 23505 (unique_violation,
--    constraint projects_user_id_slug_key). El cliente debe capturar ese código
--    y mostrar un mensaje del tipo "ya tenés un proyecto con ese nombre".
-- ---------------------------------------------------------------------------
alter table public.projects drop constraint if exists projects_slug_key;
alter table public.projects add constraint projects_user_id_slug_key unique (user_id, slug);

-- ---------------------------------------------------------------------------
-- 2. Índices de acceso por dueño.
--    projects(user_id): queda cubierto por el índice del unique compuesto
--    projects_user_id_slug_key (user_id, slug), cuya columna líder es user_id.
--    project_sprites(project_id): cubierto por project_sprites_project_id_slug_key
--    (project_id, slug). No se crean índices adicionales para evitar redundancia.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. updated_at + trigger genérico (sin depender de la extensión moddatetime).
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: fija updated_at = now() en la fila modificada.';

alter table public.projects
  add column if not exists updated_at timestamptz not null default now();

alter table public.project_sprites
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.project_sprites;
create trigger set_updated_at
  before update on public.project_sprites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Tope de 2 MB para asset_data (evita sprites gigantes en JSONB).
--    Antes de aplicar en un entorno con datos, comprobar:
--      select max(pg_column_size(asset_data)) from project_sprites;
-- ---------------------------------------------------------------------------
alter table public.project_sprites drop constraint if exists project_sprites_asset_data_size_check;
alter table public.project_sprites
  add constraint project_sprites_asset_data_size_check
  check (pg_column_size(asset_data) < 2097152);

-- ---------------------------------------------------------------------------
-- 5. RLS: misma semántica (solo el dueño puede SELECT/INSERT/UPDATE/DELETE),
--    pero con (select auth.uid()) para que el planner lo evalúe una sola vez
--    por sentencia (InitPlan) en lugar de una vez por fila, y EXISTS en lugar
--    de IN (subquery) para project_sprites.
-- ---------------------------------------------------------------------------

-- projects
drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects" on public.projects
  for select using ( (select auth.uid()) = user_id );

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects" on public.projects
  for insert with check ( (select auth.uid()) = user_id );

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects" on public.projects
  for update using ( (select auth.uid()) = user_id );

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects" on public.projects
  for delete using ( (select auth.uid()) = user_id );

-- project_sprites
drop policy if exists "Users can view sprites belonging to their projects" on public.project_sprites;
create policy "Users can view sprites belonging to their projects" on public.project_sprites
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert sprites into their projects" on public.project_sprites;
create policy "Users can insert sprites into their projects" on public.project_sprites
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update sprites in their projects" on public.project_sprites;
create policy "Users can update sprites in their projects" on public.project_sprites
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete sprites from their projects" on public.project_sprites;
create policy "Users can delete sprites from their projects" on public.project_sprites
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );
