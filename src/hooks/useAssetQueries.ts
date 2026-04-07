import { useQuery } from '@tanstack/react-query';
import { ASSET_CATALOG, getAssetsByCategory, getAssetById } from '@/lib/assets';
import { SpriteAsset } from '@/lib/types';

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (category?: string) => [...assetKeys.lists(), { category }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

export function useAssets(category?: string) {
  return useQuery({
    queryKey: assetKeys.list(category),
    queryFn: async () => {
      // Simulate network request for consistency if desired, or just return static
      return getAssetsByCategory(category || 'all');
    },
    // We don't need real staletime for now since it's static,
    // but the query pattern makes it easier to migrate later.
    staleTime: Infinity,
  });
}

export function useAsset(id?: string) {
  return useQuery({
    queryKey: assetKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Asset ID is required');
      const asset = getAssetById(id);
      if (!asset) throw new Error(`Asset with id ${id} not found`);
      return asset;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}

/**
 * Hook to get the counts per category for the filter component
 */
export function useAssetCategoryCounts() {
  return useQuery({
    queryKey: [...assetKeys.all, 'counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      ASSET_CATALOG.forEach((a: SpriteAsset) => {
        counts[a.category] = (counts[a.category] ?? 0) + 1;
      });
      return counts;
    },
    staleTime: Infinity,
  });
}
