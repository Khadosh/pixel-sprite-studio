import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Project, ProjectSprite } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { SpriteAsset } from '@/lib/types';
import { serializeAsset, deserializeAsset } from '@/lib/spriteDto';
import { createSpec, parseSpec } from '@/lib/slugUtils';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (userId: string) => [...projectKeys.lists(), { userId }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export const spriteKeys = {
  all: ['sprites'] as const,
  lists: (projectId: string) => [...spriteKeys.all, 'list', projectId] as const,
  details: () => [...spriteKeys.all, 'detail'] as const,
  detail: (id: string) => [...spriteKeys.details(), id] as const,
};

// --- Projects Hooks ---

export function useProjects() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: projectKeys.list(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(idOrSlug?: string) {
  return useQuery({
    queryKey: projectKeys.detail(idOrSlug || ''),
    queryFn: async () => {
      if (!idOrSlug) throw new Error('Project ID or Slug is required');
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      const query = supabase.from('projects').select('*');
      if (isUUID) {
        query.eq('id', idOrSlug);
      } else {
        // We suspect projects MIGHT have a slug column even if types are missing it,
        // but let's try a safer approach if it fails. For now, keep as slug.
        query.eq('slug', idOrSlug);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!idOrSlug,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { slugify } = await import('@/lib/slugUtils');
      let baseSlug = slugify(name) || 'untitled';
      let slug = baseSlug;
      let counter = 1;
      let unique = false;

      // Ensure slug uniqueness
      while (!unique) {
        const { data } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        if (!data) {
          unique = true;
        } else {
          slug = `${baseSlug}-${counter++}`;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, user_id: user.id, slug }])
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { slugify } = await import('@/lib/slugUtils');
      let baseSlug = slugify(name) || 'untitled';
      let slug = baseSlug;
      let counter = 1;
      let unique = false;

      // Ensure slug uniqueness
      while (!unique) {
        const { data } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .maybeSingle();
        
        if (!data) {
          unique = true;
        } else {
          slug = `${baseSlug}-${counter++}`;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .update({ name, slug })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.slug) });
    },
  });
}

// --- Sprites Hooks ---

export function useProjectSprites(projectId?: string) {
  return useQuery({
    queryKey: spriteKeys.lists(projectId || ''),
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_sprites')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(s => {
        const asset = deserializeAsset(s.asset_data);
        return {
          ...s,
          asset_data: asset,
          slug: asset.slug || s.id,
          name: asset.name || 'Sin nombre'
        };
      }) as ProjectSprite[];
    },
    enabled: !!projectId,
  });
}

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function useSprite(idOrSlug?: string, projectId?: string) {
  return useQuery({
    queryKey: [...spriteKeys.detail(idOrSlug || ''), projectId],
    queryFn: async () => {
      if (!idOrSlug) throw new Error('Sprite ID or Slug is required');
      
      const isIdUUID = isUUID(idOrSlug);
      const query = supabase.from('project_sprites').select('*');
      
      if (isIdUUID) {
        query.eq('id', idOrSlug);
      } else {
        // Search using the dedicated slug column (now confirmed to exist)
        query.eq('slug', idOrSlug);
        
        // ONLY filter by project_id if it's a valid UUID to avoid Postgres errors
        if (projectId && isUUID(projectId)) {
          query.eq('project_id', projectId);
        }
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      if (!data) return null;

      let assetData = data.asset_data as any;
      const rawJson = JSON.stringify(assetData);

      // AUTO-CLEAN: If the sprite is massive (>1MB), purge history immediately on load
      if (rawJson.length > 1024 * 1024) {
        assetData.versions = [];
      }

      const asset = deserializeAsset(assetData);
      return {
        ...data,
        asset_data: asset,
        slug: asset.slug || data.id,
        name: asset.name || 'Sin nombre'
      } as ProjectSprite;
    },
    enabled: !!idOrSlug && (isUUID(idOrSlug) || (!!projectId && isUUID(projectId))),
  });
}

export function useCreateSprite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, asset }: { projectId: string; asset: SpriteAsset }) => {
      // Generate initial slug for the sprite (scoped to project)
      let baseSlug = createSpec('', asset.name || 'new sprite');
      let slug = baseSlug;
      let counter = 1;
      let unique = false;

      while (!unique) {
        const { data } = await supabase
          .from('project_sprites')
          .select('id')
          .eq('project_id', projectId)
          .eq('slug', slug)
          .maybeSingle();
        
        if (!data) {
          unique = true;
        } else {
          slug = `${baseSlug}-${counter++}`;
        }
      }

      const rawSize = JSON.stringify(asset).length;
      let assetToSave = { 
        ...asset,
        slug: slug // Ensure slug is in the JSON
      };
      if (rawSize > 500 * 1024) assetToSave.versions = [];

      const compressedAsset = serializeAsset(assetToSave);

      const { data, error: insertError } = await supabase
        .from('project_sprites')
        .insert([{ 
          project_id: projectId, 
          asset_data: compressedAsset,
          slug: slug // CRITICAL: Include the physical column
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      const decompressedAsset = deserializeAsset(data.asset_data);
      return {
        ...data,
        asset_data: decompressedAsset,
        slug: decompressedAsset.slug || data.id,
        name: decompressedAsset.name || 'Sin nombre'
      } as ProjectSprite;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spriteKeys.lists(variables.projectId) });
    },
  });
}

export function useUpdateSprite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, asset }: { id: string; projectId: string; asset: SpriteAsset }) => {
      // 1. Fetch current state to check if we need to update slug
      const { data: current } = await supabase
        .from('project_sprites')
        .select('asset_data')
        .eq('id', id)
        .single();
      
      const currentAsset = current?.asset_data ? deserializeAsset(current.asset_data) : null;
      const nameChanged = currentAsset?.name !== asset.name;
      
      // Determine the slug
      let slug = currentAsset?.slug || id;
      
      if (nameChanged) {
        let baseSlug = createSpec(id, asset.name);
        slug = baseSlug;
        let counter = 1;
        let unique = false;

        while (!unique) {
          const { data } = await supabase
            .from('project_sprites')
            .select('id')
            .eq('project_id', projectId)
            .eq('slug', slug)
            .neq('id', id)
            .maybeSingle();
          
          if (!data) {
            unique = true;
          } else {
            slug = `${baseSlug}-${counter++}`;
          }
        }
      }

      // 2. Prepare asset to save with the correct slug and size safety
      let assetToSave = { 
        ...asset,
        slug: slug // Sync the slug into the JSON
      };
      
      const rawSize = JSON.stringify(assetToSave).length;

      if (rawSize > 500 * 1024) {
        assetToSave.versions = [];
      }

      const compressedAsset = serializeAsset(assetToSave);

      // 3. Perform the update
      const { error } = await supabase
        .from('project_sprites')
        .update({ 
          asset_data: compressedAsset,
          slug: slug // CRITICAL: Sync the physical column
        })
        .eq('id', id);

      if (error) throw error;
      
      return { 
        slugChanged: nameChanged, 
        newSlug: slug,
        id 
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: spriteKeys.lists(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: spriteKeys.detail(variables.id) });
      if (data?.slugChanged) {
        queryClient.invalidateQueries({ queryKey: spriteKeys.detail(data.newSlug) });
      }
    },
  });
}

export function useDeleteSprite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_sprites')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spriteKeys.lists(variables.projectId) });
    },
  });
}
