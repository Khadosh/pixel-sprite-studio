-- 1. Crear tabla projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  user_id uuid references auth.users not null
);

-- Habilitar Row Level Security para projects
alter table public.projects enable row level security;

create policy "Users can view their own projects" on projects for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own projects" on projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own projects" on projects for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own projects" on projects for delete
  using ( auth.uid() = user_id );

-- 2. Crear tabla project_sprites
create table public.project_sprites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references public.projects on delete cascade not null,
  asset_data jsonb not null
);

-- Habilitar Row Level Security para project_sprites
alter table public.project_sprites enable row level security;

create policy "Users can view sprites belonging to their projects" on project_sprites for select
  using ( auth.uid() IN (SELECT user_id FROM projects WHERE projects.id = project_id) );

create policy "Users can insert sprites into their projects" on project_sprites for insert
  with check ( auth.uid() IN (SELECT user_id FROM projects WHERE projects.id = project_id) );

create policy "Users can delete sprites from their projects" on project_sprites for delete
  using ( auth.uid() IN (SELECT user_id FROM projects WHERE projects.id = project_id) );

create policy "Users can update sprites in their projects" on project_sprites for update
  using ( auth.uid() IN (SELECT user_id FROM projects WHERE projects.id = project_id) );
