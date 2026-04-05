import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getAssetById } from '@/lib/assets';
import { PaletteProvider, usePalette } from '@/hooks/usePalette';
import SpriteSheetCanvas from '@/components/SpriteSheetCanvas';
import SpritePreview from '@/components/SpritePreview';
import SpritePixelEditor from '@/components/SpritePixelEditor';
import EditorToolbar from '@/components/EditorToolbar';
import { usePixelEditor } from '@/hooks/usePixelEditor';
import { Download, RotateCcw, ArrowLeft, Save, Pencil, X } from 'lucide-react';
import type { SpriteAsset } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const PIXEL_SCALE = 4;
const GRID_GAP = 1;

const CATEGORY_COLORS: Record<string, string> = {
  character: '#22c55e',
  terrain:   '#3b82f6',
  prop:      '#f59e0b',
  nature:    '#10b981',
  ui:        '#a855f7',
};

function AssetDetailContent({ initialAsset }: { initialAsset: SpriteAsset }) {
  const { palette, setPaletteColor, resetPalette } = usePalette();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Mutable asset for editing
  const [asset, setAsset] = useState<SpriteAsset>(() => ({
    ...initialAsset,
    frames: initialAsset.frames.map(f => f.map(r => [...r])),
  }));

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editFrameIndex, setEditFrameIndex] = useState(0);
  const [onionSkin, setOnionSkin] = useState(false);

  const editor = usePixelEditor(asset, editFrameIndex, setAsset);

  const CELL_SIZE = asset.size * PIXEL_SCALE;

  const handleExportPNG = useCallback(() => {
    const hasAnimations = asset.animations.length > 0;
    let rows: { frameIndices: number[] }[];

    if (hasAnimations) {
      rows = asset.animations.map(a => ({ frameIndices: a.frameIndices }));
    } else {
      rows = [{ frameIndices: asset.frames.map((_, i) => i) }];
    }

    const maxCols = Math.max(...rows.map(r => r.frameIndices.length));
    const w = maxCols * (CELL_SIZE + GRID_GAP) - GRID_GAP;
    const h = rows.length * (CELL_SIZE + GRID_GAP) - GRID_GAP;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    rows.forEach((row, rowIdx) => {
      const y = rowIdx * (CELL_SIZE + GRID_GAP);
      row.frameIndices.forEach((frameIdx, colIdx) => {
        const x = colIdx * (CELL_SIZE + GRID_GAP);
        const frame = asset.frames[frameIdx];
        for (let fRow = 0; fRow < asset.size; fRow++) {
          for (let fCol = 0; fCol < asset.size; fCol++) {
            const val = frame[fRow][fCol];
            if (val === 0) continue;
            const color = palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
            ctx.fillRect(
              x + fCol * PIXEL_SCALE,
              y + fRow * PIXEL_SCALE,
              PIXEL_SCALE,
              PIXEL_SCALE
            );
          }
        }
      });
    });

    const link = document.createElement('a');
    link.download = `${asset.id}-spritesheet.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [asset, palette, CELL_SIZE]);

  const handleSaveToProject = async () => {
    if (!projectId) return;
    try {
      setIsSaving(true);
      const assetDataToSave = { ...asset, palette: { ...palette } };
      const { error } = await supabase
        .from('project_sprites')
        .insert([{ project_id: projectId, asset_data: assetDataToSave }]);
      if (error) throw error;
      toast({ title: 'Guardado', description: 'El sprite se ha guardado en tu proyecto exitosamente.' });
      navigate(`/project/${projectId}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryColor = CATEGORY_COLORS[asset.category] ?? '#888';
  const frameCount = asset.frames.length;
  const animCount = asset.animations.length;

  // Onion skin frames for the editor
  const onionSkinPrev = onionSkin && editFrameIndex > 0 ? asset.frames[editFrameIndex - 1] : undefined;
  const onionSkinNext = onionSkin && editFrameIndex < frameCount - 1 ? asset.frames[editFrameIndex + 1] : undefined;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back link + header */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Catalog
          </button>

          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-pixel text-primary text-lg md:text-xl tracking-wider">
                {asset.name.toUpperCase()}
              </h1>
              <span
                className="inline-flex items-center px-2 py-0.5 text-[8px] font-pixel rounded-full border"
                style={{
                  color: categoryColor,
                  borderColor: `${categoryColor}40`,
                  backgroundColor: `${categoryColor}10`,
                }}
              >
                {asset.category.toUpperCase()}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-mono">{asset.description}</p>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              <span>{asset.size}×{asset.size} px</span>
              <span className="text-border">•</span>
              <span>{frameCount} frame{frameCount !== 1 ? 's' : ''}</span>
              {animCount > 0 && (
                <>
                  <span className="text-border">•</span>
                  <span>{animCount} animation{animCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </header>
        </div>

        {/* Sprite sheet + Preview */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 overflow-x-auto">
            <div className="bg-card rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-pixel text-[10px] text-muted-foreground tracking-wider">
                  SPRITE GRID
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-pixel rounded border transition-all ${
                      editing
                        ? 'bg-accent text-accent-foreground border-accent hover:brightness-110'
                        : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {editing ? <X size={14} /> : <Pencil size={14} />}
                    {editing ? 'CERRAR EDITOR' : 'EDITAR PÍXELES'}
                  </button>
                  {projectId && (
                    <button
                      onClick={handleSaveToProject}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-pixel bg-green-600 text-white rounded border border-green-500 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      <Save size={14} />
                      {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                    </button>
                  )}
                  <button
                    onClick={handleExportPNG}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-pixel bg-primary text-primary-foreground rounded border border-primary hover:brightness-110 transition-all"
                  >
                    <Download size={14} />
                    EXPORT PNG
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <SpriteSheetCanvas asset={asset} />
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <div className="w-full lg:w-64">
            <div className="bg-card rounded-lg border border-border p-4">
              <SpritePreview asset={asset} />
            </div>
          </div>
        </div>

        {/* Pixel Editor */}
        {editing && (
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] text-muted-foreground tracking-wider">
                PIXEL EDITOR
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Frame {editFrameIndex + 1} / {frameCount}
              </span>
            </div>

            {/* Toolbar */}
            <EditorToolbar
              tool={editor.tool}
              onToolChange={editor.setTool}
              brushSize={editor.brushSize}
              onBrushSizeChange={editor.setBrushSize}
              canUndo={editor.canUndo}
              onUndo={editor.undo}
              onionSkin={onionSkin}
              onToggleOnionSkin={() => setOnionSkin(s => !s)}
              mirrorX={editor.mirrorX}
              onToggleMirrorX={() => editor.setMirrorX(m => !m)}
            />

            {/* Frame selector */}
            <div className="flex flex-wrap gap-2">
              {asset.frames.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setEditFrameIndex(idx)}
                  className={`px-3 py-1.5 text-[10px] font-pixel rounded border transition-all ${
                    editFrameIndex === idx
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  F{idx + 1}
                </button>
              ))}
            </div>

            {/* Active color indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-pixel text-muted-foreground">COLOR:</span>
              <div className="flex gap-1.5">
                {Object.entries(palette).filter(([k]) => k !== '0').map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => editor.setActiveColorKey(Number(key))}
                    className={`w-6 h-6 rounded-sm border-2 transition-all ${
                      editor.activeColorKey === Number(key)
                        ? 'border-primary scale-110 shadow-md shadow-primary/30'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: color }}
                    title={asset.colorNames[Number(key)] || key}
                  />
                ))}
              </div>
            </div>

            {/* Canvas editor */}
            <div className="flex justify-center">
              <div className="max-w-[400px] w-full aspect-square">
                <SpritePixelEditor
                  asset={asset}
                  frameIndex={editFrameIndex}
                  activeColorKey={editor.activeColorKey}
                  tool={editor.tool}
                  brushSize={editor.brushSize}
                  onPointerDown={editor.handlePointerDown}
                  onPointerMove={editor.handlePointerMove}
                  onPointerUp={editor.handlePointerUp}
                  onionSkinPrevFrame={onionSkinPrev}
                  onionSkinNextFrame={onionSkinNext}
                  draftFrame={editor.draftFrame}
                />
              </div>
            </div>
          </div>
        )}

        {/* Palette Editor */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-pixel text-[10px] text-muted-foreground tracking-wider">
              PALETTE
            </span>
            <button
              onClick={resetPalette}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-pixel text-muted-foreground bg-secondary rounded border border-border hover:border-primary/50 transition-colors"
            >
              <RotateCcw size={10} />
              RESET
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(palette)
              .filter(([k]) => k !== '0')
              .map(([key, color]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-sm border border-border group-hover:border-primary/60 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setPaletteColor(Number(key), e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                    {asset.colorNames[Number(key)] || key}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <footer className="text-center text-[10px] text-muted-foreground font-mono pb-4">
          {asset.name} • {frameCount} frames • {asset.size}×{asset.size} px • transparent PNG export
        </footer>
      </div>
    </div>
  );
}

export default function AssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const asset = useMemo(() => getAssetById(assetId ?? ''), [assetId]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider">
            ASSET NOT FOUND
          </p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-pixel bg-primary text-primary-foreground rounded border border-primary hover:brightness-110 transition-all mx-auto"
          >
            <ArrowLeft size={14} />
            BACK TO CATALOG
          </button>
        </div>
      </div>
    );
  }

  return (
    <PaletteProvider defaultPalette={asset.palette}>
      <AssetDetailContent initialAsset={asset} />
    </PaletteProvider>
  );
}
