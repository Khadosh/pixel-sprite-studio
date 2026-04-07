import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AssetCard from '@/components/AssetCard';
import CategoryFilter from '@/components/CategoryFilter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAssets, useAssetCategoryCounts } from '@/hooks/useAssetQueries';

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();

  const { data: filteredAssets = [], isLoading: isAssetsLoading } = useAssets(activeCategory);
  const { data: assetCounts = {}, isLoading: isCountsLoading } = useAssetCategoryCounts();

  const totalAssets = Object.values(assetCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle grid background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, hsl(142 72% 50%) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12 space-y-8">
        {/* Navigation */}
        <div>
          <button
            onClick={() => navigate(projectId ? `/project/${projectId}` : '/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            {projectId ? 'Volver al Proyecto' : 'Volver a la Home'}
          </button>
        </div>

        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary text-sm">✦</span>
            </div>
            <h1 className="font-pixel text-primary text-base md:text-lg tracking-wider">
              PIXEL SPRITE STUDIO
            </h1>
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary text-sm">✦</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-mono max-w-lg mx-auto">
            Browse, preview, and export pixel art assets — characters, terrain, props, and more.
          </p>
        </header>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-muted-foreground">
          <span>{totalAssets} assets</span>
          <span className="text-border">|</span>
          <span>16×16 px</span>
          <span className="text-border">|</span>
          <span>Transparent PNG export</span>
        </div>

        {/* Category filters */}
        <div className="flex justify-center">
          {isCountsLoading ? (
            <Loader2 className="animate-spin text-primary" size={24} />
          ) : (
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              assetCounts={assetCounts}
            />
          )}
        </div>

        {/* Asset grid */}
        {isAssetsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="animate-spin text-primary" size={32} />
             <p className="font-pixel text-[10px] text-muted-foreground animate-pulse">CARGANDO ASSETS...</p>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} projectId={projectId || undefined} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="text-3xl">🏗</div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider">
              NO ASSETS YET
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              This category is empty — more assets coming soon!
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-[10px] text-muted-foreground font-mono pb-4 space-y-1">
          <p>{totalAssets} assets • {Object.keys(assetCounts).length} categories • 16×16 px</p>
          <p className="text-muted-foreground/50">Pixel Sprite Studio — Asset Catalog</p>
        </footer>
      </div>
    </div>
  );
}
