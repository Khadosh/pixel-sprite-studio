import { useQuery } from '@tanstack/react-query';
import { ASSET_CATALOG, getAssetsByCategory, getAssetById } from '@/lib/assets';
import { SpriteAsset } from '@/lib/types';

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (category?: string, size?: number) => [...assetKeys.lists(), { category, size }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

export function useAssets(category?: string, size?: number) {
  return useQuery({
    queryKey: assetKeys.list(category, size),
    queryFn: async () => {
      // Return filtered static assets
      return getAssetsByCategory(category || 'all', size);
    },
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
export function useAssetCategoryCounts(size?: number) {
  return useQuery({
    queryKey: [...assetKeys.all, 'counts', { size }],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      const assets = size ? ASSET_CATALOG.filter(a => a.size === size) : ASSET_CATALOG;
      
      assets.forEach((a: SpriteAsset) => {
        counts[a.category] = (counts[a.category] ?? 0) + 1;
      });
      return counts;
    },
    staleTime: Infinity,
  });
}
