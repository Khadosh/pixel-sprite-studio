-- Add slug column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate initial slugs for projects based on name
UPDATE projects 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Resolve duplicate project slugs by appending short ID
WITH numbered_projects AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY slug ORDER BY created_at) as rn
  FROM projects
)
UPDATE projects p
SET slug = p.slug || '-' || substring(p.id::text from 1 for 4)
FROM numbered_projects np
WHERE p.id = np.id AND np.rn > 1;

-- Make project slugs unique
ALTER TABLE projects ADD CONSTRAINT projects_slug_key UNIQUE (slug);
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;

-- Add slug column to project_sprites
ALTER TABLE project_sprites ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate initial slugs for sprites based on asset_data->>'name'
UPDATE project_sprites 
SET slug = lower(regexp_replace(asset_data->>'name', '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- If asset name is missing or empty, use 'temp-' + short ID
UPDATE project_sprites
SET slug = 'temp-' || substring(id::text from 1 for 8)
WHERE slug IS NULL OR slug = '';

-- Resolve duplicate sprite slugs within the same project
WITH numbered_sprites AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY project_id, slug ORDER BY created_at) as rn
  FROM project_sprites
)
UPDATE project_sprites ps
SET slug = ps.slug || '-' || substring(ps.id::text from 1 for 4)
FROM numbered_sprites ns
WHERE ps.id = ns.id AND ns.rn > 1;

-- Make sprite slugs unique per project
ALTER TABLE project_sprites ADD CONSTRAINT project_sprites_project_id_slug_key UNIQUE (project_id, slug);
ALTER TABLE project_sprites ALTER COLUMN slug SET NOT NULL;
