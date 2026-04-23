import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Project, ProjectSprite } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { SpriteAsset } from '@/lib/types';

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
      return data as ProjectSprite[];
    },
    enabled: !!projectId,
  });
}

export function useSprite(idOrSlug?: string, projectId?: string) {
  return useQuery({
    queryKey: [...spriteKeys.detail(idOrSlug || ''), projectId],
    queryFn: async () => {
      if (!idOrSlug) throw new Error('Sprite ID or Slug is required');
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      const query = supabase.from('project_sprites').select('*');
      if (isUUID) {
        query.eq('id', idOrSlug);
      } else {
        query.eq('slug', idOrSlug);
        if (projectId) {
          query.eq('project_id', projectId);
        }
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data as ProjectSprite;
    },
    enabled: !!idOrSlug && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug) || !!projectId),
  });
}

export function useCreateSprite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, asset }: { projectId: string; asset: SpriteAsset }) => {
      const { createSpec } = await import('@/lib/slugUtils');
      
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

      const { data, error } = await supabase
        .from('project_sprites')
        .insert([{ project_id: projectId, asset_data: asset, slug }])
        .select()
        .single();

      if (error) throw error;
      return data as ProjectSprite;
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
      const { error } = await supabase
        .from('project_sprites')
        .update({ asset_data: asset })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spriteKeys.lists(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: spriteKeys.detail(variables.id) });
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
