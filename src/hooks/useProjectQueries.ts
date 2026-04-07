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

export function useProject(id?: string) {
  return useQuery({
    queryKey: projectKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, user_id: user?.id }])
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

export function useCreateSprite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, asset }: { projectId: string; asset: SpriteAsset }) => {
      const { data, error } = await supabase
        .from('project_sprites')
        .insert([{ project_id: projectId, asset_data: asset }])
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
