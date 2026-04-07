import { useNavigate } from 'react-router-dom';
import type { SpriteAsset } from '@/lib/types';
import SpriteSheetCanvas from './SpriteSheetCanvas';

const CATEGORY_COLORS: Record<string, string> = {
  character: '#22c55e',
  terrain:   '#3b82f6',
  prop:      '#f59e0b',
  nature:    '#10b981',
  ui:        '#a855f7',
};

const CATEGORY_LABELS: Record<string, string> = {
  character: 'Character',
  terrain:   'Terrain',
  prop:      'Prop',
  nature:    'Nature',
  ui:        'UI',
};

interface AssetCardProps {
  asset: SpriteAsset;
  projectId?: string;
}

export default function AssetCard({ asset, projectId }: AssetCardProps) {
  const navigate = useNavigate();
  const frameCount = asset.layers?.[0]?.frames.length || asset.frames?.length || 0;
  const categoryColor = CATEGORY_COLORS[asset.category] ?? '#888';

  return (
    <button
      id={`asset-card-${asset.id}`}
      onClick={() => {
        const query = projectId ? `?projectId=${projectId}` : '';
        navigate(`/asset/${asset.id}${query}`);
      }}
      className="group w-full text-left bg-card rounded-lg border border-border hover:border-primary/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:scale-[1.01] active:scale-[0.99] overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Preview area: Professional dark background to match canvas */}
      <div className="w-full flex-1 flex items-center justify-center p-4 bg-[#050508] min-h-[160px] overflow-hidden border-b border-white/5">
        <div className="transform transition-all duration-700 group-hover:scale-105 group-hover:brightness-110">
           <SpriteSheetCanvas 
            asset={asset} 
            // Scale logic: characters get slightly smaller scale to fit labels comfortably
            scale={asset.animations.length > 4 ? 2 : 3} 
            showLabels={true} 
          />
        </div>
      </div>

      {/* Info panel */}
      <div className="p-4 bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-pixel text-[10px] text-foreground tracking-wider group-hover:text-primary transition-colors truncate pr-2">
            {asset.name.toUpperCase()}
          </h3>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[7px] font-pixel rounded-sm border shrink-0 opacity-80"
            style={{
              color: categoryColor,
              borderColor: `${categoryColor}40`,
              backgroundColor: `${categoryColor}10`,
            }}
          >
            {CATEGORY_LABELS[asset.category]}
          </span>
        </div>
        
        <p className="text-[9px] text-muted-foreground font-mono leading-relaxed line-clamp-2 h-[2.4em] opacity-60 italic">
          {asset.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-3">
          <div className="flex items-center gap-1.5 font-mono text-[7px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">
            <span>{asset.size}x{asset.size}</span>
          </div>
          <span className="text-[7px] text-muted-foreground/30 font-mono">•</span>
          <span className="text-[7px] text-muted-foreground/80 font-mono">
            {frameCount} FRAMES
          </span>
          {asset.animations.length > 0 && (
            <>
              <span className="text-[7px] text-muted-foreground/30 font-mono">•</span>
              <span className="text-[7px] text-muted-foreground/80 font-mono text-emerald-500/80">
                {asset.animations.length} ANIMATIONS
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
